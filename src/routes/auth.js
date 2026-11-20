'use strict';
const crypto = require('node:crypto');
const { hashPassword, verifyPassword } = require('../auth');
const { checkLoginStatus, getLoginRedirect } = require('../rbac');
const { HttpError, bad, text, phone, email, password, clean, nowIso } = require('../util');
const { seedDemo } = require('../seed');

const BAD_LOGIN = 'بيانات الدخول غير صحيحة';
const sha256 = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');

module.exports = (r, app) => {
  const { q, tx, cfg, limiter, cipher, session, mailer, notify, logAudit, model, getPlatformSettings } = app;
  const dummyHash = hashPassword(crypto.randomBytes(12).toString('hex'));

  const issueOneTimeToken = (userId, type, ttlMs) => {
    const rawToken = crypto.randomBytes(24).toString('hex');
    const tokenHash = sha256(rawToken);
    const now = Date.now();
    const expiresAt = new Date(now + ttlMs).toISOString();
    q('INSERT INTO auth_tokens (user_id, type, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)')
      .run(userId, type, tokenHash, expiresAt, new Date(now).toISOString());
    return { token: rawToken, expiresAt };
  };

  const consumeOneTimeToken = (rawToken, type) => {
    const tokenStr = clean(rawToken);
    if (!tokenStr) throw bad('الرمز غير صالح أو منتهي الصلاحية');
    const row = q('SELECT * FROM auth_tokens WHERE token_hash = ? AND type = ?').get(sha256(tokenStr), type);
    if (!row || row.used_at || row.expires_at <= nowIso()) {
      throw bad('الرمز غير صالح أو منتهي الصلاحية');
    }
    q('UPDATE auth_tokens SET used_at = ? WHERE id = ?').run(nowIso(), row.id);
    return row;
  };

  app.issueOneTimeToken = issueOneTimeToken;
  app.consumeOneTimeToken = consumeOneTimeToken;

  // تسجيل حساب عميل جديد — يُحفظ تلقائيًا بحالة قيد المراجعة (pending) ولا يُمنح جلسة دخول حتى تتم الموافقة
  r.post('/api/auth/register', async ({ body, res, ip }) => {
    if (!limiter.hit(`reg:${ip}`, 15, 3600_000)) throw new HttpError(429, 'محاولات كثيرة، حاول لاحقًا');
    const platSettings = getPlatformSettings();
    if (platSettings.registration_open === '0') {
      throw new HttpError(403, 'التسجيل الجديد متوقف مؤقتًا من قِبل إدارة المنصة.');
    }

    const store = text(body.store, 'اسم المتجر', { min: 2, max: 60 });
    const fullName = body.fullName ? text(body.fullName, 'الاسم الكامل', { min: 2, max: 80 }) : store;
    const ph = phone(body.phone);
    const mail = email(body.email);
    const pw = password(body.password, ph);

    if (q('SELECT 1 FROM users WHERE phone = ?').get(ph)) throw new HttpError(409, 'رقم الموبايل مسجّل بالفعل، جرّب تسجيل الدخول');
    if (mail && q('SELECT 1 FROM users WHERE email = ?').get(mail)) throw new HttpError(409, 'البريد الإلكتروني مسجّل بالفعل');

    const requireApproval = platSettings.require_client_approval !== '0';
    const initialStatus = requireApproval ? 'pending' : 'active';
    const hash = await hashPassword(pw);
    let id;
    try {
      id = Number(q(`INSERT INTO users (phone, email, pass_hash, store_name, full_name, role, status, created_at)
        VALUES (?, ?, ?, ?, ?, 'client', ?, ?)`)
        .run(ph, mail, hash, store, fullName, initialStatus, nowIso()).lastInsertRowid);
    } catch (e) {
      if (/UNIQUE/.test(e.message)) throw new HttpError(409, 'الحساب مسجّل بالفعل');
      throw e;
    }

    if (mail) {
      const { token } = issueOneTimeToken(id, 'verify_email', 24 * 3600_000);
      await mailer.send({
        to: mail,
        subject: 'تأكيد البريد الإلكتروني — OrderFlow',
        type: 'verify_email',
        token,
        url: `${cfg.appUrl || 'http://localhost:3000'}/#/verify-email?token=${token}`,
        text: `رمز تأكيد بريدك الإلكتروني في OrderFlow هو: ${token}`
      });
    }

    const user = q('SELECT * FROM users WHERE id = ?').get(id);

    if (initialStatus === 'pending') {
      notify(id, 'info', 'طلب تسجيلك قيد المراجعة', 'شكرًا لتسجيلك في OrderFlow. سيقوم فريق الإشراف بمراجعة حسابك وتفعيله قريبًا.', '#/');
      return {
        ok: true,
        pending: true,
        status: 'pending',
        message: 'تم إنشاء حسابك بنجاح، وهو الآن قيد المراجعة من قِبل الإدارة. ستتمكن من تسجيل الدخول فور تفعيل الحساب.',
        account: { id: user.id, storeName: user.store_name, email: user.email || '', phone: user.phone, status: 'pending' }
      };
    }

    notify(id, 'info', 'مرحبًا بك في OrderFlow!', 'ابدأ بإضافة منتجاتك الأولى وسيتم مراجعتها واعتمادها للمزامنة مع الأسواق.', '#/prod');
    const token = session.issue(res, user);
    return { ok: true, pending: false, status: 'active', token, me: model.meOf(user), redirectTo: getLoginRedirect(user) };
  }, { auth: false });

  // تسجيل الدخول الموحّد لجميع الأدوار (Owner / Moderator / Client) مع توجيه تلقائي وحماية من التخمين
  r.post('/api/auth/login', async ({ body, res, ip }) => {
    const raw = clean(body.id || body.email || body.phone);
    const pw = String(body.password ?? '');
    if (!raw || !pw) throw bad('أدخل البريد الإلكتروني أو رقم الموبايل وكلمة المرور');
    const byMail = raw.includes('@');
    let ident;
    try { ident = byMail ? raw.toLowerCase() : phone(raw); } catch { throw new HttpError(401, BAD_LOGIN); }

    // تفعيل حد أقصى صارم لمحاولات تسجيل الدخول الفاشلة (Rate Limiting) لحماية حسابات الإدارة والعملاء
    if (!limiter.hit(`login-ip:${ip}`, 25, 600_000) || !limiter.hit(`login-id:${ident}`, 5, 900_000)) {
      try { logAudit(null, 'security.login_rate_limited', 'auth', null, { ident: String(ident).slice(0, 60) }, ip); } catch (_) {}
      throw new HttpError(429, 'تم تجاوز الحد الأقصى لمحاولات تسجيل الدخول الفاشلة. انتظر ١٥ دقيقة ثم حاول مجددًا.', { code: 'RATE_LIMITED' });
    }

    const u = q(`SELECT * FROM users WHERE ${byMail ? 'email' : 'phone'} = ? AND is_demo = 0`).get(ident);
    const ok = await verifyPassword(pw, u ? u.pass_hash : await dummyHash);
    if (!u || !ok) throw new HttpError(401, BAD_LOGIN);

    const statusCheck = checkLoginStatus(u);
    if (!statusCheck.allowed) {
      throw new HttpError(statusCheck.status, statusCheck.message, {
        code: statusCheck.code,
        ...(statusCheck.reason ? { reason: statusCheck.reason } : {})
      });
    }

    limiter.reset(`login-id:${ident}`);
    const token = session.issue(res, u);
    return { ok: true, token, me: model.meOf(u), redirectTo: getLoginRedirect(u) };
  }, { auth: false });

  // فحص فوري لصلاحية الجلسة — يكتشف الإبطال الفوري لحظة إيقاف أو حذف المشرف
  r.get('/api/auth/session-check', ({ user }) => ({
    ok: true,
    me: model.meOf(user),
    redirectTo: getLoginRedirect(user)
  }));

  // طلب رمز استعادة كلمة المرور (صالح لمدة ٣٠ دقيقة ويُستخدم مرة واحدة)
  r.post('/api/auth/forgot-password', async ({ body, ip }) => {
    if (!limiter.hit(`forgot-ip:${ip}`, 15, 600_000)) throw new HttpError(429, 'طلبات كثيرة، حاول بعد قليل');
    const raw = clean(body.id || body.email || body.phone);
    if (!raw) throw bad('أدخل رقم الموبايل أو البريد الإلكتروني المسجّل');
    const byMail = raw.includes('@');
    let ident = null;
    try { ident = byMail ? email(raw) : phone(raw); } catch { ident = null; }
    let devToken = undefined;
    if (ident) {
      const u = q(`SELECT * FROM users WHERE ${byMail ? 'email' : 'phone'} = ? AND is_demo = 0`).get(ident);
      // نمنع استعادة كلمة المرور العامة لحسابات المالك والمشرفين (دون كشف وجود الحساب) — تُدار كلمات مرورهم حصريًا عبر المالك أو متغيرات البيئة
      if (u && u.status === 'active' && u.role === 'client') {
        const { token } = issueOneTimeToken(u.id, 'reset_password', 30 * 60_000);
        const target = u.email || u.phone;
        await mailer.send({
          to: target,
          subject: 'إعادة تعيين كلمة المرور — OrderFlow',
          type: 'reset_password',
          token,
          url: `${cfg.appUrl || 'http://localhost:3000'}/#/reset-password?token=${token}`,
          text: `رمز إعادة تعيين كلمة المرور لحسابك في OrderFlow (صالح لمدة ٣٠ دقيقة): ${token}`
        });
        if (!cfg.production) devToken = token;
      }
    }
    return {
      ok: true,
      message: 'إذا كان الحساب مسجّلًا ونشطًا لدينا، فقد أرسلنا رمز ورابط إعادة تعيين كلمة المرور.',
      ...(devToken ? { devToken } : {})
    };
  }, { auth: false });

  r.post('/api/auth/reset-password', async ({ body, res, ip }) => {
    if (!limiter.hit(`reset-ip:${ip}`, 15, 600_000)) throw new HttpError(429, 'محاولات كثيرة، حاول بعد قليل');
    const tokenRow = consumeOneTimeToken(body.token, 'reset_password');
    const u = q('SELECT * FROM users WHERE id = ?').get(tokenRow.user_id);
    if (!u || u.status !== 'active' || u.role !== 'client') throw new HttpError(403, 'الحساب غير متاح');
    const nextPw = password(body.password, u.phone);
    const hash = await hashPassword(nextPw);
    q('UPDATE users SET pass_hash = ?, token_ver = token_ver + 1 WHERE id = ?').run(hash, u.id);
    const fresh = q('SELECT * FROM users WHERE id = ?').get(u.id);
    const sessionToken = session.issue(res, fresh);
    return { ok: true, token: sessionToken, me: model.meOf(fresh), redirectTo: getLoginRedirect(fresh) };
  }, { auth: false });

  r.post('/api/auth/verify-email', ({ body }) => {
    const tokenRow = consumeOneTimeToken(body.token, 'verify_email');
    const now = nowIso();
    q('UPDATE users SET email_verified_at = ? WHERE id = ?').run(now, tokenRow.user_id);
    notify(tokenRow.user_id, 'ok', 'تم توثيق بريدك الإلكتروني بنجاح ✓', 'شكراً لتأكيد بريدك الإلكتروني الرسمي على منصة OrderFlow.', '#/set');
    return { ok: true, verified: true, emailVerifiedAt: now };
  }, { auth: false });

  r.post('/api/contact', async ({ body, user, ip }) => {
    if (!limiter.hit(`contact:${ip}`, 10, 600_000)) throw new HttpError(429, 'طلبات كثيرة، حاول بعد قليل');
    const name = text(body.name, 'الاسم', { min: 2, max: 80 });
    const contact = text(body.contact || body.email || body.phone, 'وسيلة التواصل', { min: 4, max: 120 });
    const subject = text(body.subject || 'استفسار عام', 'الموضوع', { min: 2, max: 140 });
    const message = text(body.message, 'الرسالة', { min: 5, max: 2000 });
    const info = q('INSERT INTO support_tickets (user_id, name, contact, subject, message, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .run(user ? user.id : null, name, contact, subject, message, 'open', nowIso());
    await mailer.send({
      to: 'support@orderflow.eg',
      subject: `[تواصل معنا] ${subject} — ${name}`,
      type: 'contact',
      text: `من: ${name} (${contact})\n${message}`
    });
    return { ok: true, ticketId: Number(info.lastInsertRowid) };
  }, { auth: false });

  // حساب تجريبي مؤقت ببيانات جاهزة (يُحذف بعد ٢٤ ساعة)
  r.post('/api/auth/demo', async ({ res, ip }) => {
    if (!limiter.hit(`demo:${ip}`, 120, 3600_000)) throw new HttpError(429, 'محاولات كثيرة، حاول لاحقًا');
    const demoCount = q('SELECT COUNT(*) n FROM users WHERE is_demo = 1').get().n;
    if (demoCount >= cfg.maxDemos) {
      try {
        q('DELETE FROM users WHERE is_demo = 1 AND id IN (SELECT id FROM users WHERE is_demo = 1 ORDER BY created_at ASC LIMIT 10)').run();
      } catch (_) {}
    }
    const id = tx(() => {
      const tag = crypto.randomBytes(6).toString('hex');
      const info = q(`INSERT INTO users (phone,pass_hash,store_name,full_name,role,status,plan,is_demo,integrations,tax_id,instapay,created_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).run(`demo-${tag}`, '!', 'متجر النور للإلكترونيات', 'متجر النور للإلكترونيات', 'client', 'active', 'pro', 1,
        JSON.stringify({ a: 1, n: 1, j: 1, bs: 1, ar: 1, my: 0, fw: 1, vc: 1, eta: 1 }), cipher.encrypt('412-890-115'), cipher.encrypt('elnoor.store@instapay'), nowIso());
      seedDemo(app, Number(info.lastInsertRowid));
      return info.lastInsertRowid;
    });
    const user = q('SELECT * FROM users WHERE id = ?').get(id);
    const token = session.issue(res, user);
    return { ok: true, token, me: model.meOf(user), redirectTo: '#/dash' };
  }, { auth: false });

  r.post('/api/auth/logout', ({ res, user }) => {
    // إبطال الجلسة على مستوى الخادم فورًا لمنع إعادة استخدام التوكن أو الكوكي المسروق بعد تسجيل الخروج
    if (user && !user._readOnly && !user.is_demo) {
      q('UPDATE users SET token_ver = token_ver + 1 WHERE id = ?').run(user.id);
    }
    session.clear(res);
    return { ok: true };
  }, { auth: false });

  r.post('/api/auth/logout-all', ({ res, user, ip }) => {
    if (!user._readOnly) {
      q('UPDATE users SET token_ver = token_ver + 1 WHERE id = ?').run(user.id);
      logAudit(user.id, 'security.logout_all', 'user', user.id, { role: user.role }, ip);
    }
    session.clear(res);
    return { ok: true };
  });

  r.get('/api/auth/me', ({ user }) => ({ me: model.meOf(user), redirectTo: getLoginRedirect(user) }));
};
