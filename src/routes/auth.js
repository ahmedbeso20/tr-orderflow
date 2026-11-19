'use strict';
const crypto = require('node:crypto');
const { hashPassword, verifyPassword } = require('../auth');
const { HttpError, bad, text, phone, email, password, clean, nowIso } = require('../util');
const { seedDemo } = require('../seed');

const BAD_LOGIN = 'بيانات الدخول غير صحيحة';
const sha256 = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');

module.exports = (r, app) => {
  const { q, tx, cfg, limiter, session, mailer, notify, model } = app;
  const dummyHash = hashPassword(crypto.randomBytes(12).toString('hex')); // يُستخدم لتمويه زمن الرد عند عدم وجود الحساب

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

  r.post('/api/auth/register', async ({ body, res, ip }) => {
    if (!limiter.hit(`reg:${ip}`, 10, 3600_000)) throw new HttpError(429, 'محاولات كثيرة، حاول لاحقًا');
    const store = text(body.store, 'اسم المتجر', { min: 2, max: 60 });
    const ph = phone(body.phone);
    const mail = email(body.email);
    const pw = password(body.password, ph);
    if (q('SELECT 1 FROM users WHERE phone = ?').get(ph)) throw new HttpError(409, 'رقم الموبايل مسجّل بالفعل، جرّب تسجيل الدخول');
    if (mail && q('SELECT 1 FROM users WHERE email = ?').get(mail)) throw new HttpError(409, 'البريد الإلكتروني مسجّل بالفعل');
    const hash = await hashPassword(pw);
    let id;
    try {
      id = Number(q('INSERT INTO users (phone,email,pass_hash,store_name,created_at) VALUES (?,?,?,?,?)')
        .run(ph, mail, hash, store, nowIso()).lastInsertRowid);
    } catch (e) {
      if (/UNIQUE/.test(e.message)) throw new HttpError(409, 'الحساب مسجّل بالفعل');
      throw e;
    }
    notify(id, 'info', 'مرحبًا بك في OrderFlow!', 'ابدأ بإضافة منتجاتك الأولى وسيتم مراجعتها واعتمادها للمزامنة مع الأسواق.', '#/prod');
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
    const token = session.issue(res, user);
    return { ok: true, token, me: model.meOf(user) };
  }, { auth: false });

  r.post('/api/auth/login', async ({ body, res, ip }) => {
    const raw = clean(body.id);
    const pw = String(body.password ?? '');
    if (!raw || !pw) throw bad('أدخل رقم الموبايل أو البريد الإلكتروني وكلمة المرور');
    const byMail = raw.includes('@');
    let ident;
    try { ident = byMail ? raw.toLowerCase() : phone(raw); } catch { throw new HttpError(401, BAD_LOGIN); }
    if (!limiter.hit(`login-ip:${ip}`, 30, 600_000) || !limiter.hit(`login-id:${ident}`, 8, 600_000)) throw new HttpError(429, 'محاولات دخول كثيرة، انتظر ١٠ دقائق ثم حاول مجددًا');
    const u = q(`SELECT * FROM users WHERE ${byMail ? 'email' : 'phone'} = ? AND is_demo = 0`).get(ident);
    const ok = await verifyPassword(pw, u ? u.pass_hash : await dummyHash);
    if (!u || !ok) throw new HttpError(401, BAD_LOGIN);
    if (u.status === 'suspended') {
      throw new HttpError(403, 'تم تعليق هذا الحساب من قِبل الإدارة. تواصل مع الدعم الفني للمساعدة.', { code: 'SUSPENDED' });
    }
    limiter.reset(`login-id:${ident}`);
    const token = session.issue(res, u);
    return { ok: true, token, me: model.meOf(u) };
  }, { auth: false });

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
      if (u && u.status !== 'suspended') {
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
      message: 'إذا كان الحساب مسجّلًا لدينا، فقد أرسلنا رمز ورابط إعادة تعيين كلمة المرور.',
      ...(devToken ? { devToken } : {})
    };
  }, { auth: false });

  // إعادة تعيين كلمة المرور باستخدام الرمز المؤقت لمرة واحدة
  r.post('/api/auth/reset-password', async ({ body, res, ip }) => {
    if (!limiter.hit(`reset-ip:${ip}`, 15, 600_000)) throw new HttpError(429, 'محاولات كثيرة، حاول بعد قليل');
    const tokenRow = consumeOneTimeToken(body.token, 'reset_password');
    const u = q('SELECT * FROM users WHERE id = ?').get(tokenRow.user_id);
    if (!u || u.status === 'suspended') throw new HttpError(403, 'الحساب غير متاح');
    const nextPw = password(body.password, u.phone);
    const hash = await hashPassword(nextPw);
    q('UPDATE users SET pass_hash = ?, token_ver = token_ver + 1 WHERE id = ?').run(hash, u.id);
    const fresh = q('SELECT * FROM users WHERE id = ?').get(u.id);
    const sessionToken = session.issue(res, fresh);
    return { ok: true, token: sessionToken, me: model.meOf(fresh) };
  }, { auth: false });

  // تأكيد البريد الإلكتروني بالرمز
  r.post('/api/auth/verify-email', ({ body }) => {
    const tokenRow = consumeOneTimeToken(body.token, 'verify_email');
    const now = nowIso();
    q('UPDATE users SET email_verified_at = ? WHERE id = ?').run(now, tokenRow.user_id);
    notify(tokenRow.user_id, 'ok', 'تم توثيق بريدك الإلكتروني بنجاح ✓', 'شكراً لتأكيد بريدك الإلكتروني الرسمي على منصة OrderFlow.', '#/set');
    return { ok: true, verified: true, emailVerifiedAt: now };
  }, { auth: false });

  // نموذج تواصل معنا العام
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
      // تفريغ الحسابات التجريبية القديمة لضمان عدم توقف الزوار
      try {
        q('DELETE FROM users WHERE is_demo = 1 AND id IN (SELECT id FROM users WHERE is_demo = 1 ORDER BY created_at ASC LIMIT 10)').run();
      } catch (_) {}
    }
    const id = tx(() => {
      const tag = crypto.randomBytes(6).toString('hex');
      const info = q(`INSERT INTO users (phone,pass_hash,store_name,plan,is_demo,integrations,tax_id,instapay,created_at)
        VALUES (?,?,?,?,?,?,?,?,?)`).run(`demo-${tag}`, '!', 'متجر النور للإلكترونيات', 'pro', 1,
        JSON.stringify({ a: 1, n: 1, j: 1, bs: 1, ar: 1, my: 0, fw: 1, vc: 1, eta: 1 }), '412-890-115', 'elnoor.store@instapay', nowIso());
      seedDemo(app, Number(info.lastInsertRowid));
      return info.lastInsertRowid;
    });
    const user = q('SELECT * FROM users WHERE id = ?').get(id);
    const token = session.issue(res, user);
    return { ok: true, token, me: model.meOf(user) };
  }, { auth: false });

  r.post('/api/auth/logout', ({ res }) => {
    session.clear(res);
    return { ok: true };
  }, { auth: false });

  r.get('/api/auth/me', ({ user }) => ({ me: model.meOf(user) }));
};

