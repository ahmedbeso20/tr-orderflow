'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { deriveSubkey } = require('./security');

const ROOT = path.join(__dirname, '..');
try { process.loadEnvFile(path.join(ROOT, '.env')); } catch { /* ملف .env اختياري */ }

const flag = (v, dflt) => (v === undefined || v === '' ? dflt : ['1', 'true', 'yes'].includes(String(v).toLowerCase()));
const FALLBACK_SECRET = crypto.randomBytes(48).toString('hex');

/** يبني الإعدادات من متغيرات البيئة، ويمكن تجاوزها (للاختبارات) عبر o */
function load(o = {}) {
  const e = process.env;
  const dataDir = path.resolve(o.dataDir || e.DATA_DIR || path.join(os.tmpdir(), 'orderflow-data'));
  const dbFile = o.dbFile || e.DB_FILE || path.join(dataDir, 'omniarab.db');
  if (dbFile !== ':memory:') fs.mkdirSync(path.dirname(dbFile), { recursive: true, mode: 0o700 });
  const nodeEnv = o.nodeEnv || e.NODE_ENV || 'development';
  const production = nodeEnv === 'production';
  const isCloud = Boolean(e.K_SERVICE || e.APP_URL || production);
  const isHttps = Boolean((e.APP_URL && e.APP_URL.startsWith('https')) || production);

  let secret = o.secret || e.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    if (production) {
      console.warn('[security] تحذير: SESSION_SECRET غير مضبوط أو أقل من 32 حرفًا في بيئة الإنتاج.');
    }
    secret = FALLBACK_SECRET;
  }

  const rawEncSecret = o.dataEncryptionKey || e.DATA_ENCRYPTION_KEY || secret;
  const sessionKey = deriveSubkey(secret, 'session-hmac-v1', 32);
  const receiptKey = deriveSubkey(secret, 'receipt-hmac-v1', 32);
  const encryptionKey = deriveSubkey(rawEncSecret, 'db-field-aes256gcm-v1', 32);

  return Object.freeze({
    port: +(o.port ?? e.PORT ?? 3000),
    host: o.host || e.HOST || '0.0.0.0',
    dbFile,
    publicDir: path.join(ROOT, 'public'),
    secret,
    sessionKey,
    receiptKey,
    encryptionKey,
    cookieName: 'omni_sid',
    secureCookie: flag(o.secureCookie ?? e.COOKIE_SECURE, isHttps),
    hsts: production,
    // لا نثق بترويسة X-Forwarded-For إلا خلف وسيط معروف (وإلا يستطيع أي عميل انتحال IP وتجاوز حدود الطلبات)
    trustProxy: flag(o.trustProxy ?? e.TRUST_PROXY, isCloud),
    geminiKey: o.geminiKey ?? e.GEMINI_API_KEY ?? '',
    geminiModel: o.geminiModel || e.GEMINI_MODEL || 'gemini-3-flash-preview',
    // بيانات حساب المالك الوحيد للنظام (تُقرأ من البيئة أو الإعدادات)
    ownerName: String(o.ownerName ?? e.OWNER_NAME ?? 'مالك منصة OrderFlow').trim(),
    ownerEmail: String(o.ownerEmail ?? e.OWNER_EMAIL ?? e.ADMIN_EMAIL ?? (!production ? 'owner@orderflow.eg' : '')).trim().toLowerCase(),
    ownerPhone: String(o.ownerPhone ?? o.adminPhone ?? e.OWNER_PHONE ?? e.ADMIN_PHONE ?? (!production ? '01099990000' : '')).trim(),
    ownerPassword: String(o.ownerPassword ?? o.adminPassword ?? e.OWNER_PASSWORD ?? e.ADMIN_PASSWORD ?? (!production ? 'Owner@2026!' : '')),
    adminPhone: String(o.adminPhone ?? o.ownerPhone ?? e.ADMIN_PHONE ?? e.OWNER_PHONE ?? '').trim(),
    adminPassword: String(o.adminPassword ?? o.ownerPassword ?? e.ADMIN_PASSWORD ?? e.OWNER_PASSWORD ?? ''),
    mailTransport: o.mailTransport || null,
    // تغيير الباقة دون دفع مسموح في بيئة التطوير فقط
    allowPlanSelfService: flag(o.allowPlanSelfService ?? e.ALLOW_PLAN_SELF_SERVICE, !production),
    allowedOrigins: String(o.allowedOrigins ?? e.ALLOWED_ORIGINS ?? '').split(',').map((s) => s.trim()).filter(Boolean),
    appUrl: (o.appUrl || e.APP_URL || '').replace(/\/+$/, ''),
    nodeEnv,
    production,
    payments: Object.freeze({
      // sandbox | hosted | kashier | اسم ملف داخل src/payments/providers — وفي الإنتاج لا شيء افتراضيًا حتى تُضبط بوابة حقيقية
      provider: String(o.paymentProvider ?? e.PAYMENT_PROVIDER ?? (production ? '' : 'sandbox')).trim().toLowerCase(),
      allowSandboxInProduction: flag(o.paymentAllowSandbox ?? e.PAYMENT_ALLOW_SANDBOX, false),
      apiUrl: o.paymentApiUrl ?? e.PAYMENT_API_URL ?? '',
      apiKey: o.paymentApiKey ?? e.PAYMENT_API_KEY ?? '',
      webhookSecret: o.paymentWebhookSecret ?? e.PAYMENT_WEBHOOK_SECRET ?? '',
      signatureHeader: String(e.PAYMENT_SIGNATURE_HEADER || 'x-signature').toLowerCase(),
      signatureEncoding: e.PAYMENT_SIGNATURE_ENCODING === 'base64' ? 'base64' : 'hex',
      amountUnit: e.PAYMENT_AMOUNT_UNIT === 'minor' ? 'minor' : 'major',
      methods: String(e.PAYMENT_METHODS || 'wallet,kashier,instapay,card').split(',').map((s) => s.trim()).filter(Boolean),
      kashierMerchantId: String(o.kashierMerchantId ?? e.KASHIER_MERCHANT_ID ?? '').trim(),
      kashierApiKey: String(o.kashierApiKey ?? e.KASHIER_API_KEY ?? '').trim(),
      kashierMode: String(o.kashierMode ?? e.KASHIER_MODE ?? (production ? 'live' : 'test')).trim().toLowerCase(),
      kashierAllowedMethods: String(o.kashierAllowedMethods ?? e.KASHIER_ALLOWED_METHODS ?? 'wallet').trim(),
      walletNumber: String(o.paymentWalletNumber ?? e.PAYMENT_WALLET_NUMBER ?? '').trim(),
      currency: 'EGP'
    }),
    maxDemos: +(o.maxDemos ?? e.MAX_DEMOS ?? 500),
    demoTtlSec: 24 * 3600,
    fetch: o.fetch || globalThis.fetch
  });
}

module.exports = { load };

