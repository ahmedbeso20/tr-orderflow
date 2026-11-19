'use strict';
const crypto = require('node:crypto');
const { HttpError } = require('./util');

const scrypt = (pw, salt) => new Promise((resolve, reject) =>
  crypto.scrypt(pw.normalize('NFKC'), salt, 64, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (e, k) => (e ? reject(e) : resolve(k))));

async function hashPassword(pw) {
  const salt = crypto.randomBytes(16);
  return `s1$${salt.toString('base64')}$${(await scrypt(pw, salt)).toString('base64')}`;
}

function hashPasswordSync(pw) {
  const salt = crypto.randomBytes(16);
  const key = crypto.scryptSync(pw.normalize('NFKC'), salt, 64, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  return `s1$${salt.toString('base64')}$${key.toString('base64')}`;
}

async function verifyPassword(pw, stored) {
  const [ver, salt, hash] = String(stored).split('$');
  if (ver !== 's1' || !salt || !hash) return false;
  const expected = Buffer.from(hash, 'base64');
  const actual = await scrypt(pw, Buffer.from(salt, 'base64'));
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

const b64 = (b) => Buffer.from(b).toString('base64url');
const mac = (secret, data) => crypto.createHmac('sha256', secret).update(data).digest();

function signToken(secret, payload) {
  const body = b64(JSON.stringify(payload));
  return `${body}.${b64(mac(secret, body))}`;
}

function verifyToken(secret, token) {
  if (typeof token !== 'string') return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const good = mac(secret, body);
  const given = Buffer.from(sig, 'base64url');
  if (given.length !== good.length || !crypto.timingSafeEqual(given, good)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    return p.e > Date.now() / 1000 ? p : null;
  } catch { return null; }
}

function parseCookies(header = '') {
  const out = {};
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i < 1) continue;
    try { out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim()); } catch { /* تجاهل */ }
  }
  return out;
}

const cookie = (name, value, { maxAge, secure }) =>
  `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=${secure ? 'None' : 'Lax'}; Max-Age=${maxAge}${secure ? '; Secure; Partitioned' : ''}`;

/** حارس صلاحيات المدير */
function requireAdmin(user) {
  if (!user) throw new HttpError(401, 'سجّل الدخول للمتابعة', { code: 'AUTH' });
  if (user._readOnly || user.role !== 'admin') {
    throw new HttpError(403, 'غير مصرح: هذه العملية مخصصة لمديري النظام فقط', { code: 'FORBIDDEN' });
  }
  return user;
}

/** إدارة جلسة المستخدم عبر كوكي موقَّع HttpOnly ودعم ترويسة Authorization ومعامل ?token= للتحميل والطباعة */
function createSession(cfg, q) {
  const userFromToken = (token) => {
    if (!token) return null;
    const p = verifyToken(cfg.secret, token);
    if (!p) return null;
    const u = q('SELECT * FROM users WHERE id = ?').get(p.u);
    if (!u || u.token_ver !== p.v) return null;
    if (u.status === 'suspended' && !p.impBy) return null;
    if (p.impBy) {
      const admin = q('SELECT id, role, status FROM users WHERE id = ?').get(p.impBy);
      if (!admin || admin.role !== 'admin' || admin.status === 'suspended') return null;
      return { ...u, _impersonatedBy: admin.id, _readOnly: true };
    }
    return u;
  };
  return {
    issue(res, user) {
      const maxAge = user.is_demo ? cfg.demoTtlSec : 30 * 86400;
      const token = signToken(cfg.secret, { u: user.id, v: user.token_ver, e: Math.floor(Date.now() / 1000) + maxAge });
      res.setHeader('Set-Cookie', cookie(cfg.cookieName, token, { maxAge, secure: cfg.secureCookie }));
      return token;
    },
    issueImpersonation(adminUser, targetUser) {
      const maxAge = 3600;
      return signToken(cfg.secret, {
        u: targetUser.id,
        v: targetUser.token_ver,
        impBy: adminUser.id,
        ro: 1,
        e: Math.floor(Date.now() / 1000) + maxAge
      });
    },
    clear(res) {
      res.setHeader('Set-Cookie', cookie(cfg.cookieName, '', { maxAge: 0, secure: cfg.secureCookie }));
    },
    read(req) {
      // 0. فحص ترويسة المعاينة الإدارية X-Impersonate-Token
      if (req.headers['x-impersonate-token']) {
        const u = userFromToken(String(req.headers['x-impersonate-token']).trim());
        if (u) return u;
      }
      // 1. فحص ترويسة Authorization: Bearer <token>
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const u = userFromToken(authHeader.slice(7).trim());
        if (u) return u;
      }
      // 2. فحص ترويسة X-Omni-Token
      if (req.headers['x-omni-token']) {
        const u = userFromToken(String(req.headers['x-omni-token']).trim());
        if (u) return u;
      }
      // 3. فحص الكوكي
      const uCookie = userFromToken(parseCookies(req.headers.cookie)[cfg.cookieName]);
      if (uCookie) return uCookie;
      // 4. فحص معامل ?token= لطلبات GET (مثل تصدير CSV أو طباعة الفاتورة وبوالص الشحن داخل iframe)
      if (req.method === 'GET' && req.url && req.url.includes('token=')) {
        try {
          const uUrl = new URL(req.url, 'http://localhost');
          const qToken = uUrl.searchParams.get('token');
          const uQuery = userFromToken(qToken);
          if (uQuery) return uQuery;
        } catch { /* تجاهل */ }
      }
      return null;
    }
  };
}

module.exports = { hashPassword, hashPasswordSync, verifyPassword, signToken, verifyToken, requireAdmin, createSession };

