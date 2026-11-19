'use strict';
const http = require('node:http');
const { load } = require('./config');
const { openDb } = require('./db');
const { createSession, hashPasswordSync, requireAdmin } = require('./auth');
const { createModel } = require('./model');
const { createRouter, createLimiter, createStatic, readBody, clientIp, sendJson, securityHeaders } = require('./http');
const { HttpError, phone, clean, nowIso } = require('./util');
const { createPayments } = require('./payments');
const { createMailer } = require('./mailer');

function ensureFirstAdmin(cfg, q) {
  if (!cfg.adminPhone || !cfg.adminPassword) return;
  let ph;
  try { ph = phone(cfg.adminPhone); } catch { ph = clean(cfg.adminPhone); }
  if (!ph) return;
  const existing = q('SELECT * FROM users WHERE phone = ?').get(ph);
  const hash = hashPasswordSync(cfg.adminPassword);
  if (!existing) {
    q(`INSERT INTO users (phone, email, pass_hash, store_name, role, status, plan, created_at)
       VALUES (?, ?, ?, 'إدارة OrderFlow', 'admin', 'active', 'business', ?)`).run(ph, 'admin@orderflow.eg', hash, nowIso());
  } else {
    q("UPDATE users SET pass_hash = ?, role = 'admin', status = 'active' WHERE id = ?").run(hash, existing.id);
  }
}

function createApp(overrides = {}) {
  const cfg = load(overrides);
  const store = openDb(cfg.dbFile);
  const limiter = createLimiter();
  const session = createSession(cfg, store.q);
  const mailer = createMailer(cfg);

  const notify = (userId, type, title, body = '', link = '') => {
    try {
      store.q('INSERT INTO notifications (user_id, type, title, body, link, created_at) VALUES (?, ?, ?, ?, ?, ?)')
        .run(userId, type || 'info', String(title || '').slice(0, 200), String(body || '').slice(0, 600), String(link || ''), nowIso());
    } catch (_) {}
  };

  const logAudit = (adminId, action, targetType = '', targetId = null, details = {}, ip = '') => {
    const info = store.q('INSERT INTO audit_log (admin_id, action, target_type, target_id, details, ip, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(adminId, String(action), String(targetType || ''), targetId == null ? null : Number(targetId), JSON.stringify(details || {}), String(ip || ''), nowIso());
    return Number(info.lastInsertRowid);
  };

  ensureFirstAdmin(cfg, store.q);

  const app = { cfg, ...store, limiter, session, mailer, notify, logAudit, requireAdmin, model: createModel(store.q) };
  app.payments = createPayments(app);
  const router = createRouter();
  const serveStatic = createStatic(cfg.publicDir);

  for (const name of ['auth', 'catalog', 'orders', 'finance', 'account', 'billing', 'ai', 'services', 'admin']) require(`./routes/${name}`)(router, app);
  router.get('/api/health', () => ({ ok: true }), { auth: false });

  // حذف الحسابات التجريبية المنتهية (تُحذف بياناتها تلقائيًا)
  const purge = () => store.q('DELETE FROM users WHERE is_demo = 1 AND created_at < ?').run(new Date(Date.now() - cfg.demoTtlSec * 1000).toISOString());
  purge();
  const purgeTimer = setInterval(purge, 3600_000);
  purgeTimer.unref();

  // فحص Origin: نفس المضيف، أو أصل مُعلَن صراحةً (APP_URL / ALLOWED_ORIGINS). لا نسمح بنطاقات خارجية عامة.
  const allowedHosts = new Set([cfg.appUrl, ...cfg.allowedOrigins].filter(Boolean).map((u) => { try { return new URL(u).host; } catch { return ''; } }).filter(Boolean));
  const sameOrigin = (req) => {
    const origin = req.headers.origin;
    if (!origin) return true;
    const fHost = req.headers['x-forwarded-host'];
    const host = (cfg.trustProxy && fHost) || req.headers.host;
    try {
      const u = new URL(origin);
      if (u.host === host || allowedHosts.has(u.host)) return true;
      if (!cfg.production && (u.hostname === 'localhost' || u.hostname === '127.0.0.1')) return true;
      return false;
    } catch { return false; }
  };

  async function handleApi(req, res, url) {
    const ip = clientIp(req, cfg.trustProxy);
    if (!limiter.hit(`api:${ip}`, 600, 60_000)) throw new HttpError(429, 'طلبات كثيرة، انتظر قليلًا ثم حاول مجددًا');

    const method = req.method === 'HEAD' ? 'GET' : req.method;
    const { route, params, pathMatched } = router.match(method, url.pathname);
    if (!route) throw new HttpError(pathMatched ? 405 : 404, pathMatched ? 'الطريقة غير مسموحة' : 'المسار غير موجود');

    if (method !== 'GET' && !route.webhook) { // حماية CSRF (خطافات البوابات الخارجية تُوثَّق بتوقيع HMAC بدلًا منها): ترويسة مخصصة + فحص Origin (مع كوكي SameSite=Lax)
      if (req.headers['x-requested-with'] !== 'omniarab' || !sameOrigin(req)) throw new HttpError(403, 'طلب غير مسموح');
    }

    const user = session.read(req);
    if (route.auth && !user) throw new HttpError(401, 'سجّل الدخول للمتابعة', { code: 'AUTH' });
    if (route.admin || url.pathname.startsWith('/api/admin')) requireAdmin(user);
    if (user && user._readOnly && method !== 'GET' && url.pathname !== '/api/auth/logout') {
      throw new HttpError(403, 'وضع المعاينة للقراءة فقط: لا يمكن إجراء تعديلات نيابة عن العميل', { code: 'READ_ONLY_IMPERSONATION' });
    }

    let body = {};
    let raw = Buffer.alloc(0);
    if (method !== 'GET') {
      raw = await readBody(req);
      if (raw.length) {
        if (!/^application\/json/i.test(req.headers['content-type'] || '')) throw new HttpError(415, 'نوع المحتوى غير مدعوم');
        try { body = JSON.parse(raw.toString('utf8')); } catch { throw new HttpError(400, 'صيغة JSON غير صالحة'); }
        if (!body || typeof body !== 'object' || Array.isArray(body)) throw new HttpError(400, 'صيغة الطلب غير صالحة');
      }
    }

    const out = await route.handler({ req, res, url, query: Object.fromEntries(url.searchParams), params, body, rawBody: raw, user, ip });
    if (!res.writableEnded && !res.headersSent) sendJson(res, 200, out ?? { ok: true });
  }

  const server = http.createServer(async (req, res) => {
    securityHeaders(res, cfg);
    try {
      let url;
      try { url = new URL(req.url, 'http://localhost'); } catch { throw new HttpError(400, 'عنوان غير صالح'); }
      if (url.pathname.startsWith('/api/')) return await handleApi(req, res, url);
      if (req.method !== 'GET' && req.method !== 'HEAD') throw new HttpError(405, 'الطريقة غير مسموحة');
      serveStatic(req, res, url.pathname);
    } catch (e) {
      if (res.headersSent) return res.end();
      if (e instanceof HttpError) return sendJson(res, e.status, { error: e.message, ...e.extra });
      console.error('[server]', e);
      sendJson(res, 500, { error: 'حدث خطأ في الخادم، حاول مجددًا.' });
    }
  });

  const close = async () => {
    clearInterval(purgeTimer);
    limiter.stop();
    await new Promise((resolve) => { server.close(resolve); server.closeAllConnections?.(); });
    store.close();
  };

  return { server, cfg, close, app, mailer };
}

module.exports = { createApp };

