'use strict';
const http = require('node:http');
const { load } = require('./config');
const { openDb } = require('./db');
const { createSession, hashPasswordSync, requireOwner, requireModerator, requirePermission, requireAdmin } = require('./auth');
const { ROLES, requiredRoleForPath, canAccessPanel } = require('./rbac');
const { createModel } = require('./model');
const { createRouter, createLimiter, createStatic, readBody, clientIp, sendJson, sendText, securityHeaders } = require('./http');
const { HttpError, phone, email, clean, esc, nowIso } = require('./util');
const { createFieldCipher, sanitizePayload } = require('./security');
const { createPayments } = require('./payments');
const { createMailer } = require('./mailer');
const { createConnectors } = require('./connectors');

/** يضمن وجود حساب المالك الوحيد فقط (1 Owner Max — محمي بفهرس فريد في قاعدة البيانات) */
function ensureSingleOwner(cfg, q) {
  if (!cfg.ownerPassword || (!cfg.ownerPhone && !cfg.ownerEmail)) return;
  let ph = '';
  try { ph = cfg.ownerPhone ? phone(cfg.ownerPhone) : '01099990000'; } catch { ph = clean(cfg.ownerPhone) || '01099990000'; }
  let mail = null;
  try { mail = cfg.ownerEmail ? email(cfg.ownerEmail) : 'owner@orderflow.eg'; } catch { mail = 'owner@orderflow.eg'; }
  const ownerName = clean(cfg.ownerName) || 'مالك منصة OrderFlow';
  const hash = hashPasswordSync(cfg.ownerPassword);

  const existingOwner = q("SELECT * FROM users WHERE role = 'owner'").get();
  if (existingOwner) {
    // نحدّث بيانات المالك الوحيد دون السماح بإنشاء مالك ثانٍ مطلقًا
    q("UPDATE users SET phone = ?, email = ?, pass_hash = ?, store_name = ?, full_name = ?, status = 'active' WHERE id = ?")
      .run(ph, mail, hash, ownerName, ownerName, existingOwner.id);
    return;
  }

  const byCred = q('SELECT * FROM users WHERE phone = ? OR (email IS NOT NULL AND email = ?)').get(ph, mail);
  if (byCred) {
    q("UPDATE users SET phone = ?, email = ?, pass_hash = ?, store_name = ?, full_name = ?, role = 'owner', status = 'active', plan = 'business' WHERE id = ?")
      .run(ph, mail, hash, ownerName, ownerName, byCred.id);
    return;
  }

  q(`INSERT INTO users (phone, email, pass_hash, store_name, full_name, role, status, plan, created_at)
     VALUES (?, ?, ?, ?, ?, 'owner', 'active', 'business', ?)`)
    .run(ph, mail, hash, ownerName, ownerName, nowIso());
}

/** صفحة 404 Not Found حقيقية تُعاد من الخادم مباشرةً عند محاولة الدخول المباشر إلى مسار لوحة المالك أو المشرف دون صلاحية */
function renderServer404Html(badPath) {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>404 — الصفحة غير موجودة | OrderFlow</title>
  <link rel="stylesheet" href="/css/app.css">
</head>
<body style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:var(--bg);color:var(--tx)">
  <main style="max-width:520px;width:100%;text-align:center">
    <div class="card" style="padding:48px 32px">
      <div style="font-size:64px;font-weight:900;color:var(--pr);line-height:1;font-family:var(--font-mono)">404</div>
      <h1 style="font-size:24px;margin:16px 0 8px;color:var(--tx)">الصفحة المطلوبة غير موجودة</h1>
      <p class="mu" style="margin-bottom:24px;font-size:15px">المسار <code dir="ltr">${esc(badPath)}</code> غير متاح أو ربما تم نقله.</p>
      <a class="btn btn-ac" href="/">العودة إلى الصفحة الرئيسية</a>
    </div>
  </main>
</body>
</html>`;
}

function createApp(overrides = {}) {
  const cfg = load(overrides);
  const store = openDb(cfg.dbFile);
  const limiter = createLimiter();
  const cipher = createFieldCipher(cfg.encryptionKey || cfg.secret);
  const session = createSession(cfg, store.q);
  const mailer = createMailer(cfg);

  const notify = (userId, type, title, body = '', link = '') => {
    try {
      store.q('INSERT INTO notifications (user_id, type, title, body, link, created_at) VALUES (?, ?, ?, ?, ?, ?)')
        .run(userId, type || 'info', String(title || '').slice(0, 200), String(body || '').slice(0, 600), String(link || ''), nowIso());
    } catch (_) {}
  };

  const logAudit = (actorId, action, targetType = '', targetId = null, details = {}, ip = '') => {
    const actor = actorId ? store.q('SELECT id, store_name, full_name, email, role FROM users WHERE id = ?').get(actorId) : null;
    const actorName = actor ? (actor.full_name || actor.store_name || '') : 'النظام';
    const actorEmail = actor ? (actor.email || '') : '';
    const actorRole = actor ? (actor.role || 'owner') : 'system';
    const info = store.q(`INSERT INTO audit_log
      (admin_id, actor_name, actor_email, actor_role, action, target_type, target_id, details, ip, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(actor ? actor.id : null, actorName, actorEmail, actorRole, String(action), String(targetType || ''), targetId == null ? null : Number(targetId), JSON.stringify(details || {}), String(ip || ''), nowIso());
    return Number(info.lastInsertRowid);
  };

  const getPlatformSettings = () => {
    const rows = store.q('SELECT key, value FROM platform_settings').all();
    const out = {
      platform_name: 'OrderFlow',
      support_email: 'support@orderflow.eg',
      support_phone: '+20 100 000 0000',
      registration_open: '1',
      require_client_approval: '1',
      maintenance_notice: ''
    };
    for (const row of rows) out[row.key] = row.value;
    return out;
  };

  const setPlatformSetting = (key, value) => {
    store.q(`INSERT INTO platform_settings (key, value, updated_at) VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`)
      .run(String(key), String(value ?? ''), nowIso());
  };

  ensureSingleOwner(cfg, store.q);

  const app = {
    cfg,
    ...store,
    limiter,
    cipher,
    session,
    mailer,
    notify,
    logAudit,
    getPlatformSettings,
    setPlatformSetting,
    requireOwner,
    requireModerator,
    requirePermission,
    requireAdmin,
    model: createModel(store.q, cipher)
  };
  app.payments = createPayments(app);
  app.connectors = createConnectors(app);
  const router = createRouter();
  const serveStatic = createStatic(cfg.publicDir);

  for (const name of ['auth', 'catalog', 'orders', 'finance', 'account', 'integrations', 'billing', 'ai', 'services', 'owner', 'moderator', 'admin']) {
    require(`./routes/${name}`)(router, app);
  }
  router.get('/api/health', () => ({ ok: true }), { auth: false });

  // حذف الحسابات التجريبية المنتهية ورموز التحقق المنتهية الصلاحية تلقائيًا
  const purge = () => {
    const now = nowIso();
    store.q('DELETE FROM users WHERE is_demo = 1 AND created_at < ?').run(new Date(Date.now() - cfg.demoTtlSec * 1000).toISOString());
    try {
      store.q('DELETE FROM auth_tokens WHERE expires_at < ? OR (used_at IS NOT NULL AND used_at < ?)').run(now, new Date(Date.now() - 86400_000).toISOString());
    } catch (_) {}
  };
  purge();
  const purgeTimer = setInterval(purge, 3600_000);
  purgeTimer.unref();

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

    if (method !== 'GET' && !route.webhook) {
      if (req.headers['x-requested-with'] !== 'omniarab' || !sameOrigin(req)) throw new HttpError(403, 'طلب غير مسموح');
    }

    const sess = session.inspect(req);
    const user = sess.user;

    const isOwnerRoute = route.owner || route.admin || url.pathname.startsWith('/api/owner') || url.pathname.startsWith('/api/admin');
    const isModRoute = route.moderator || url.pathname.startsWith('/api/moderator');

    // كشف الإبطال الفوري للجلسة (عند حذف أو إيقاف المشرف أو تغيير كلمة مروره)
    if (sess.revoked && route.auth) {
      session.clear(res);
      throw new HttpError(401, 'تم إنهاء جلستك بواسطة الإدارة، يرجى تسجيل الدخول مجددًا', { code: 'SESSION_REVOKED', reason: sess.reason });
    }

    // حماية مسارات المالك والمشرفين: إرجاع 404 Not Found لغير المصرح لهم لإخفاء وجود اللوحات تمامًا
    if (isOwnerRoute) {
      requireOwner(user);
    } else if (isModRoute) {
      requireModerator(user);
      if (route.permission) requirePermission(user, route.permission);
    } else if (route.auth && !user) {
      throw new HttpError(401, 'سجّل الدخول للمتابعة', { code: 'AUTH' });
    }

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
        body = sanitizePayload(body);
      }
    }

    const out = await route.handler({ req, res, url, query: Object.fromEntries(url.searchParams), params, body, rawBody: raw, user, ip, sess });
    if (!res.writableEnded && !res.headersSent) sendJson(res, 200, out ?? { ok: true });
  }

  const server = http.createServer(async (req, res) => {
    securityHeaders(res, cfg);
    try {
      let url;
      try { url = new URL(req.url, 'http://localhost'); } catch { throw new HttpError(400, 'عنوان غير صالح'); }
      if (url.pathname.startsWith('/api/')) return await handleApi(req, res, url);
      if (req.method !== 'GET' && req.method !== 'HEAD') throw new HttpError(405, 'الطريقة غير مسموحة');

      // حماية الوصول المباشر من شريط العنوان لمسارات المالك والمشرفين (/owner, /moderator, /admin)
      const neededRole = requiredRoleForPath(url.pathname);
      if (neededRole) {
        const user = session.read(req);
        if (!canAccessPanel(user, neededRole)) {
          return sendText(res, 404, req.method === 'HEAD' ? '' : renderServer404Html(url.pathname), {
            'Content-Type': 'text/html; charset=utf-8'
          });
        }
      }

      serveStatic(req, res, url.pathname);
    } catch (e) {
      if (res.headersSent) return res.end();
      if (e instanceof HttpError) return sendJson(res, e.status, { error: e.message, ...e.extra });
      console.error('[server]', e);
      sendJson(res, 500, { error: 'حدث خطأ في الخادم، حاول مجددًا.' });
    }
  });

  // حماية الخادم من هجمات Slowloris والاتصالات المعلّقة
  server.requestTimeout = 30_000;
  server.headersTimeout = 15_000;
  server.keepAliveTimeout = 65_000;
  server.maxHeadersCount = 64;

  const close = async () => {
    clearInterval(purgeTimer);
    limiter.stop();
    await new Promise((resolve) => { server.close(resolve); server.closeAllConnections?.(); });
    store.close();
  };

  return { server, cfg, close, app, mailer, db: store.db };
}

module.exports = { createApp };
