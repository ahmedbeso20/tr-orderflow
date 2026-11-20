'use strict';
const crypto = require('node:crypto');
const { HttpError } = require('./util');
const { ROLES, hasPermission } = require('./rbac');

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

/** حارس صلاحية المالك الوحيد — يعيد 404 لإخفاء وجود لوحة المالك عن غير المصرح لهم */
function requireOwner(user) {
  if (!user || user._readOnly || user.role !== ROLES.OWNER || user.status !== 'active') {
    throw new HttpError(404, 'الصفحة غير موجودة');
  }
  return user;
}

/** حارس صلاحية المشرف — يعيد 404 لغير المشرفين */
function requireModerator(user) {
  if (!user || user._readOnly || user.role !== ROLES.MODERATOR || user.status !== 'active') {
    throw new HttpError(404, 'الصفحة غير موجودة');
  }
  return user;
}

/** حارس صلاحية مهمة محددة للمشرف (تعود 403 للمشرف عندما يعطّل المالك المهمة) */
function requirePermission(user, permKey) {
  if (!hasPermission(user, permKey)) {
    throw new HttpError(403, 'هذه الصلاحية غير مفعّلة لحسابك حاليًا. راجع مالك المنصة.', { code: 'PERMISSION_DENIED', permission: permKey });
  }
  return user;
}

/** توافق مع الاسم القديم (حصريًا للمالك) */
const requireAdmin = requireOwner;

const { isDownloadTokenAllowedPath } = require('./security');

/** إدارة جلسة المستخدم عبر كوكي موقَّع HttpOnly ودعم ترويسة Authorization مع كشف الإبطال الفوري للجلسة */
function createSession(cfg, q) {
  const signingKey = cfg.sessionKey || cfg.secret;

  const inspectToken = (token) => {
    if (!token) return { user: null, revoked: false, reason: 'missing' };
    const p = verifyToken(signingKey, token);
    if (!p) return { user: null, revoked: false, reason: 'invalid' };
    const u = q('SELECT * FROM users WHERE id = ?').get(p.u);
    if (!u) return { user: null, revoked: true, reason: 'deleted' };
    if (u.token_ver !== p.v) return { user: null, revoked: true, reason: 'revoked' };
    if (p.r && u.role !== p.r) return { user: null, revoked: true, reason: 'role_changed' };
    if (p.impBy) {
      const owner = q('SELECT id, role, status, token_ver FROM users WHERE id = ?').get(p.impBy);
      if (!owner || owner.role !== ROLES.OWNER || owner.status !== 'active' || (p.impV !== undefined && owner.token_ver !== p.impV)) {
        return { user: null, revoked: true, reason: 'impersonator_revoked' };
      }
      return { user: { ...u, _impersonatedBy: owner.id, _readOnly: true }, revoked: false, reason: 'ok' };
    }
    if (u.status !== 'active') {
      return { user: null, revoked: true, reason: u.status };
    }
    return { user: u, revoked: false, reason: 'ok' };
  };

  const extractTokens = (req) => {
    const tokens = [];
    if (req.headers['x-impersonate-token']) tokens.push(String(req.headers['x-impersonate-token']).trim());
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) tokens.push(authHeader.slice(7).trim());
    if (req.headers['x-omni-token']) tokens.push(String(req.headers['x-omni-token']).trim());
    const ck = parseCookies(req.headers.cookie)[cfg.cookieName];
    if (ck) tokens.push(ck);
    if (req.method === 'GET' && req.url && req.url.includes('token=')) {
      try {
        const uUrl = new URL(req.url, 'http://localhost');
        // لا نسمح بتمرير التوكن في رابط URL إلا لمسارات التصدير والطباعة المباشرة فقط لمنع تسريبه في السجلات أو للوحات التحكم
        if (isDownloadTokenAllowedPath(uUrl.pathname)) {
          const qToken = uUrl.searchParams.get('token');
          if (qToken) tokens.push(qToken);
        }
      } catch { /* تجاهل */ }
    }
    return tokens;
  };

  const inspect = (req) => {
    let sawRevoked = null;
    for (const token of extractTokens(req)) {
      const res = inspectToken(token);
      if (res.user) return res;
      if (res.revoked && !sawRevoked) sawRevoked = res;
    }
    return sawRevoked || { user: null, revoked: false, reason: 'none' };
  };

  return {
    issue(res, user) {
      const isPrivileged = user.role === ROLES.OWNER || user.role === ROLES.MODERATOR;
      // مدة جلسة أقصر للحسابات الإدارية (12 ساعة) مقابل 14 يومًا للعملاء و24 ساعة للتجريبي
      const maxAge = user.is_demo ? cfg.demoTtlSec : (isPrivileged ? 12 * 3600 : 14 * 86400);
      const nowSec = Math.floor(Date.now() / 1000);
      const token = signToken(signingKey, {
        u: user.id,
        v: user.token_ver,
        r: user.role,
        iat: nowSec,
        jti: crypto.randomBytes(8).toString('hex'),
        e: nowSec + maxAge
      });
      res.setHeader('Set-Cookie', cookie(cfg.cookieName, token, { maxAge, secure: cfg.secureCookie }));
      return token;
    },
    issueImpersonation(ownerUser, targetUser) {
      const maxAge = 3600;
      const nowSec = Math.floor(Date.now() / 1000);
      return signToken(signingKey, {
        u: targetUser.id,
        v: targetUser.token_ver,
        r: targetUser.role,
        impBy: ownerUser.id,
        impV: ownerUser.token_ver,
        ro: 1,
        iat: nowSec,
        e: nowSec + maxAge
      });
    },
    clear(res) {
      res.setHeader('Set-Cookie', cookie(cfg.cookieName, '', { maxAge: 0, secure: cfg.secureCookie }));
    },
    inspect,
    read(req) {
      return inspect(req).user;
    }
  };
}

module.exports = {
  hashPassword,
  hashPasswordSync,
  verifyPassword,
  signToken,
  verifyToken,
  requireOwner,
  requireModerator,
  requirePermission,
  requireAdmin,
  createSession
};
