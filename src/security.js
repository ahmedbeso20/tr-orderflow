'use strict';
// وحدة التشفير وتقوية أمان البيانات والطلبات (AES-256-GCM + HKDF + حماية تلوث النموذج الأولي + كلمات المرور الضعيفة)
const crypto = require('node:crypto');
const { HttpError } = require('./util');

const ENC_PREFIX = 'enc:v1:';
const KDF_SALT = Buffer.from('orderflow-security-kdf-salt-v1', 'utf8');

const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

const WEAK_PASSWORDS = new Set([
  '12345678', '123456789', '1234567890', '01234567', '012345678',
  'password', 'password1', 'password123', 'pass1234', 'qwerty12',
  'qwerty123', 'admin123', 'admin1234', 'welcome1', 'welcome123',
  'iloveyou', 'abc12345', 'abcdef12', 'letmein1', 'orderflow'
]);

/** يشتق مفتاحًا فرعيًا مستقلًا لكل غرض أمني باستخدام HKDF-SHA256 */
function deriveSubkey(masterSecret, purpose, length = 32) {
  const ikm = Buffer.from(String(masterSecret || ''), 'utf8');
  const info = Buffer.from(`orderflow:${String(purpose || 'default')}`, 'utf8');
  return Buffer.from(crypto.hkdfSync('sha256', ikm, KDF_SALT, info, length));
}

/** تشفير حقول قاعدة البيانات الحساسة أثناء السكون (Encryption at Rest) بخوارزمية AES-256-GCM */
function createFieldCipher(keyMaterial) {
  const key = Buffer.isBuffer(keyMaterial) && keyMaterial.length === 32
    ? keyMaterial
    : deriveSubkey(keyMaterial, 'db-field-encryption-v1', 32);

  const isEncrypted = (value) => typeof value === 'string' && value.startsWith(ENC_PREFIX);

  function encrypt(plaintext) {
    if (plaintext === null || plaintext === undefined) return '';
    const str = String(plaintext);
    if (!str) return '';
    if (isEncrypted(str)) return str;
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const enc = Buffer.concat([cipher.update(str, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${ENC_PREFIX}${iv.toString('base64url')}:${tag.toString('base64url')}:${enc.toString('base64url')}`;
  }

  function decrypt(value, { strict = false } = {}) {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (!str) return '';
    // توافق رجعي مع القيم النصية القديمة المخزّنة قبل تفعيل التشفير
    if (!isEncrypted(str)) return str;
    const parts = str.slice(ENC_PREFIX.length).split(':');
    if (parts.length !== 3) {
      if (strict) throw new Error('صيغة البيانات المشفرة غير صالحة');
      return '';
    }
    try {
      const iv = Buffer.from(parts[0], 'base64url');
      const tag = Buffer.from(parts[1], 'base64url');
      const data = Buffer.from(parts[2], 'base64url');
      if (iv.length !== 12 || tag.length !== 16) throw new Error('طول IV أو AuthTag غير صالح');
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(tag);
      return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
    } catch (err) {
      if (strict) throw err;
      return '';
    }
  }

  return Object.freeze({ encrypt, decrypt, isEncrypted });
}

/** تنظيف كائنات JSON لمنع هجمات تلوث النموذج الأولي (Prototype Pollution) وهجمات التعشيش العميق */
function sanitizePayload(input, { maxDepth = 12, maxKeys = 500 } = {}) {
  let keyCount = 0;

  function walk(val, depth) {
    if (depth > maxDepth) {
      throw new HttpError(400, 'بنية الطلب متداخلة أكثر من الحد المسموح');
    }
    if (val === null || typeof val !== 'object') return val;
    if (Array.isArray(val)) {
      if (val.length > 200) throw new HttpError(400, 'عدد العناصر في القائمة يتجاوز الحد المسموح');
      return val.map((item) => walk(item, depth + 1));
    }
    const cleanObj = Object.create(null);
    for (const [k, v] of Object.entries(val)) {
      if (DANGEROUS_KEYS.has(k)) continue;
      keyCount += 1;
      if (keyCount > maxKeys) {
        throw new HttpError(400, 'عدد حقول الطلب يتجاوز الحد المسموح');
      }
      cleanObj[k] = walk(v, depth + 1);
    }
    return Object.assign({}, cleanObj);
  }

  return walk(input, 0);
}

/** فحص قوة كلمة المرور ضد الكلمات الشائعة والأنماط المتكررة */
function isWeakPassword(pw) {
  const s = String(pw || '');
  const lower = s.trim().toLowerCase();
  if (WEAK_PASSWORDS.has(lower)) return true;
  if (/^(.)\1+$/.test(s)) return true;
  return false;
}

/** حصر تمرير رمز الجلسة في رابط URL على مسارات التصدير والطباعة فقط لمنع تسريب التوكن */
const DOWNLOAD_TOKEN_PATHS = [
  /^\/api\/orders\/export\.csv$/,
  /^\/api\/products\/export\.csv$/,
  /^\/api\/orders\/awb$/,
  /^\/api\/orders\/\d+\/invoice$/,
  /^\/api\/billing\/payments\/\d+\/receipt$/
];

function isDownloadTokenAllowedPath(pathname) {
  return DOWNLOAD_TOKEN_PATHS.some((re) => re.test(String(pathname || '')));
}

module.exports = {
  ENC_PREFIX,
  deriveSubkey,
  createFieldCipher,
  sanitizePayload,
  isWeakPassword,
  isDownloadTokenAllowedPath
};
