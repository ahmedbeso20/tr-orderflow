'use strict';
const { DatabaseSync } = require('node:sqlite');

// كل عنصر = ترحيل (migration) يُنفَّذ مرة واحدة. أضف عناصر جديدة في النهاية فقط
const MIGRATIONS = [`
CREATE TABLE users (
  id INTEGER PRIMARY KEY,
  phone TEXT NOT NULL UNIQUE,
  email TEXT,
  pass_hash TEXT NOT NULL,
  token_ver INTEGER NOT NULL DEFAULT 1,
  store_name TEXT NOT NULL,
  tax_id TEXT NOT NULL DEFAULT '',
  instapay TEXT NOT NULL DEFAULT '',
  plan TEXT NOT NULL DEFAULT 'free',
  is_demo INTEGER NOT NULL DEFAULT 0,
  integrations TEXT NOT NULL DEFAULT '{}',
  notifications TEXT NOT NULL DEFAULT '{"s":1,"o":1,"f":1,"w":0}',
  ai_cache TEXT NOT NULL DEFAULT '{}',
  last_sync_at TEXT,
  order_seq INTEGER NOT NULL DEFAULT 1000,
  created_at TEXT NOT NULL
);
CREATE UNIQUE INDEX users_email ON users(email) WHERE email IS NOT NULL;

CREATE TABLE products (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT NOT NULL,
  cat TEXT NOT NULL DEFAULT 'عام',
  markets TEXT NOT NULL DEFAULT 'a',
  price REAL NOT NULL,
  cost REAL NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (user_id, sku)
);

CREATE TABLE orders (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  no INTEGER NOT NULL,
  market TEXT NOT NULL,
  customer TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '',
  gov TEXT NOT NULL,
  address TEXT NOT NULL DEFAULT '',
  pay TEXT NOT NULL,
  courier TEXT NOT NULL,
  total REAL NOT NULL,
  cost_total REAL NOT NULL DEFAULT 0,
  ship_fee REAL NOT NULL DEFAULT 0,
  status INTEGER NOT NULL DEFAULT 0,
  items TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  settled_at TEXT,
  UNIQUE (user_id, no)
);
CREATE INDEX orders_user_date ON orders(user_id, created_at);
CREATE INDEX orders_user_status ON orders(user_id, status);

CREATE TABLE order_items (
  id INTEGER PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  qty INTEGER NOT NULL,
  price REAL NOT NULL,
  cost REAL NOT NULL
);
CREATE INDEX order_items_order ON order_items(order_id);

CREATE TABLE payouts (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  courier TEXT NOT NULL,
  gross REAL NOT NULL,
  fees REAL NOT NULL,
  net REAL NOT NULL,
  handle TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE ai_usage (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day TEXT NOT NULL,
  n INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, day)
);
`, `
ALTER TABLE users ADD COLUMN plan_cycle TEXT NOT NULL DEFAULT 'monthly';
ALTER TABLE users ADD COLUMN plan_expires_at TEXT;
ALTER TABLE users ADD COLUMN auto_renew INTEGER NOT NULL DEFAULT 1;
ALTER TABLE users ADD COLUMN default_pay_method TEXT NOT NULL DEFAULT 'card';

CREATE TABLE plan_payments (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tx_ref TEXT NOT NULL UNIQUE,
  plan TEXT NOT NULL,
  cycle TEXT NOT NULL DEFAULT 'monthly',
  method TEXT NOT NULL,
  amount REAL NOT NULL,
  vat REAL NOT NULL DEFAULT 0,
  discount REAL NOT NULL DEFAULT 0,
  coupon TEXT NOT NULL DEFAULT '',
  payer_info TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'paid',
  period_start TEXT NOT NULL,
  period_end TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX plan_payments_user ON plan_payments(user_id, created_at);
`, `
-- بوابة دفع قابلة للتوصيل: مزوّد الدفع، مرجعه، مفتاح منع التكرار، وسجل أحداث الخطافات لمنع إعادة التشغيل
ALTER TABLE plan_payments ADD COLUMN provider TEXT NOT NULL DEFAULT 'sandbox';
ALTER TABLE plan_payments ADD COLUMN provider_ref TEXT NOT NULL DEFAULT '';
ALTER TABLE plan_payments ADD COLUMN currency TEXT NOT NULL DEFAULT 'EGP';
ALTER TABLE plan_payments ADD COLUMN idem_key TEXT;
ALTER TABLE plan_payments ADD COLUMN updated_at TEXT;
CREATE UNIQUE INDEX plan_payments_idem ON plan_payments(user_id, idem_key) WHERE idem_key IS NOT NULL;
CREATE INDEX plan_payments_provider_ref ON plan_payments(provider, provider_ref);
CREATE TABLE payment_events (
  provider TEXT NOT NULL,
  event_id TEXT NOT NULL,
  tx_ref TEXT,
  created_at TEXT NOT NULL,
  PRIMARY KEY (provider, event_id)
);
`, `
-- الأدوار وحالة الحساب وتوثيق البريد الإلكتروني
ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'admin'));
ALTER TABLE users ADD COLUMN status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended'));
ALTER TABLE users ADD COLUMN email_verified_at TEXT;

-- نظام اعتماد المنتجات والطلبات وصور المنتجات وإلغاء الطلبات والمرتجعات
ALTER TABLE products ADD COLUMN approval_status TEXT NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected'));
ALTER TABLE products ADD COLUMN reject_reason TEXT NOT NULL DEFAULT '';
ALTER TABLE products ADD COLUMN image TEXT NOT NULL DEFAULT '';

ALTER TABLE orders ADD COLUMN approval_status TEXT NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected'));
ALTER TABLE orders ADD COLUMN reject_reason TEXT NOT NULL DEFAULT '';
ALTER TABLE orders ADD COLUMN cancel_reason TEXT NOT NULL DEFAULT '';
ALTER TABLE orders ADD COLUMN cancelled_at TEXT;
ALTER TABLE orders ADD COLUMN return_reason TEXT NOT NULL DEFAULT '';

-- جدول الكوبونات الترويجية في قاعدة البيانات (بدلًا من الكوبونات الثابتة في الكود)
CREATE TABLE coupons (
  id INTEGER PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('pct', 'fixed')),
  value REAL NOT NULL,
  desc TEXT NOT NULL DEFAULT '',
  once_per_user INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1,
  max_uses INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,
  expires_at TEXT,
  created_at TEXT NOT NULL
);

INSERT INTO coupons (code, type, value, desc, once_per_user, active, created_at) VALUES
  ('WELCOME20', 'pct', 20, 'خصم ترحيبي ٢٠٪ على اشتراكك', 1, 1, '2026-01-01T00:00:00.000Z'),
  ('EGYPT10', 'pct', 10, 'خصم خاص لتجار مصر ١٠٪', 0, 1, '2026-01-01T00:00:00.000Z'),
  ('OMNI50', 'fixed', 50, 'خصم نقدي فوري ٥٠ ج.م', 0, 1, '2026-01-01T00:00:00.000Z');

-- سجل المراجعة الإدارية (Audit Log) لكل إجراء يقوم به المدير
CREATE TABLE audit_log (
  id INTEGER PRIMARY KEY,
  admin_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL DEFAULT '',
  target_id INTEGER,
  details TEXT NOT NULL DEFAULT '{}',
  ip TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);
CREATE INDEX audit_log_created ON audit_log(created_at DESC);

-- رموز لمرة واحدة ومحددة الصلاحية لاستعادة كلمة المرور وتأكيد البريد الإلكتروني
CREATE TABLE auth_tokens (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('reset_password', 'verify_email')),
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  used_at TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX auth_tokens_user ON auth_tokens(user_id, type);

-- مركز الإشعارات
CREATE TABLE notifications (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  link TEXT NOT NULL DEFAULT '',
  read_at TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX notifications_user ON notifications(user_id, created_at DESC);

-- تذاكر الدعم الفني ورسائل تواصل معنا
CREATE TABLE support_tickets (
  id INTEGER PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  contact TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TEXT NOT NULL
);
`, `
-- طلبات خدمات الخبراء وإدارة الحسابات وحجز الاستشارات المجانية
CREATE TABLE service_requests (
  id INTEGER PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  ref_code TEXT NOT NULL UNIQUE,
  service_key TEXT NOT NULL,
  service_title TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  store_name TEXT NOT NULL DEFAULT '',
  platforms TEXT NOT NULL DEFAULT '',
  monthly_orders TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL
);
CREATE INDEX service_requests_user ON service_requests(user_id, created_at DESC);
`, {
  disableForeignKeys: true,
  sql: `
-- ترقية جدول المستخدمين لنظام الصلاحيات الكامل (Owner / Moderator / Client) وحالة المراجعة (pending / active / rejected / suspended)
CREATE TABLE users_new (
  id INTEGER PRIMARY KEY,
  phone TEXT NOT NULL UNIQUE,
  email TEXT,
  pass_hash TEXT NOT NULL,
  token_ver INTEGER NOT NULL DEFAULT 1,
  store_name TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  tax_id TEXT NOT NULL DEFAULT '',
  instapay TEXT NOT NULL DEFAULT '',
  plan TEXT NOT NULL DEFAULT 'free',
  is_demo INTEGER NOT NULL DEFAULT 0,
  integrations TEXT NOT NULL DEFAULT '{}',
  notifications TEXT NOT NULL DEFAULT '{"s":1,"o":1,"f":1,"w":0}',
  ai_cache TEXT NOT NULL DEFAULT '{}',
  last_sync_at TEXT,
  order_seq INTEGER NOT NULL DEFAULT 1000,
  created_at TEXT NOT NULL,
  plan_cycle TEXT NOT NULL DEFAULT 'monthly',
  plan_expires_at TEXT,
  auto_renew INTEGER NOT NULL DEFAULT 1,
  default_pay_method TEXT NOT NULL DEFAULT 'card',
  role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('owner', 'moderator', 'client')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rejected', 'suspended')),
  permissions TEXT NOT NULL DEFAULT '{}',
  reject_reason TEXT NOT NULL DEFAULT '',
  reviewed_by INTEGER REFERENCES users_new(id) ON DELETE SET NULL,
  reviewed_at TEXT,
  email_verified_at TEXT
);

INSERT INTO users_new (
  id, phone, email, pass_hash, token_ver, store_name, full_name, tax_id, instapay, plan, is_demo,
  integrations, notifications, ai_cache, last_sync_at, order_seq, created_at,
  plan_cycle, plan_expires_at, auto_renew, default_pay_method, role, status, email_verified_at
)
SELECT
  id, phone, email, pass_hash, token_ver, store_name, store_name, tax_id, instapay, plan, is_demo,
  integrations, notifications, ai_cache, last_sync_at, order_seq, created_at,
  plan_cycle, plan_expires_at, auto_renew, default_pay_method,
  CASE WHEN role = 'admin' THEN 'owner' ELSE 'client' END,
  status,
  email_verified_at
FROM users;

DROP TABLE users;
ALTER TABLE users_new RENAME TO users;

CREATE UNIQUE INDEX users_email ON users(email) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX users_single_owner ON users(role) WHERE role = 'owner';
CREATE INDEX users_role_status ON users(role, status);

-- ترقية سجل المراقبة (Audit Log) ليحفظ اسم ودور المنفذ حتى بعد حذف حساب المشرف
CREATE TABLE audit_log_new (
  id INTEGER PRIMARY KEY,
  admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  actor_name TEXT NOT NULL DEFAULT '',
  actor_email TEXT NOT NULL DEFAULT '',
  actor_role TEXT NOT NULL DEFAULT 'owner',
  action TEXT NOT NULL,
  target_type TEXT NOT NULL DEFAULT '',
  target_id INTEGER,
  details TEXT NOT NULL DEFAULT '{}',
  ip TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);

INSERT INTO audit_log_new (id, admin_id, actor_name, actor_email, actor_role, action, target_type, target_id, details, ip, created_at)
SELECT
  a.id,
  a.admin_id,
  COALESCE(u.store_name, ''),
  COALESCE(u.email, ''),
  COALESCE(u.role, 'owner'),
  a.action,
  a.target_type,
  a.target_id,
  a.details,
  a.ip,
  a.created_at
FROM audit_log a
LEFT JOIN users u ON u.id = a.admin_id;

DROP TABLE audit_log;
ALTER TABLE audit_log_new RENAME TO audit_log;
CREATE INDEX audit_log_created ON audit_log(created_at DESC);
CREATE INDEX audit_log_actor ON audit_log(admin_id, created_at DESC);

-- جدول إعدادات المنصة العامة (حصريًا للمالك)
CREATE TABLE platform_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

INSERT INTO platform_settings (key, value, updated_at) VALUES
  ('platform_name', 'OrderFlow', '2026-01-01T00:00:00.000Z'),
  ('support_email', 'support@orderflow.eg', '2026-01-01T00:00:00.000Z'),
  ('support_phone', '+20 100 000 0000', '2026-01-01T00:00:00.000Z'),
  ('registration_open', '1', '2026-01-01T00:00:00.000Z'),
  ('require_client_approval', '1', '2026-01-01T00:00:00.000Z'),
  ('maintenance_notice', '', '2026-01-01T00:00:00.000Z');
`
}, `
-- اتصالات API المشفرة لمنصات البيع الخمس (أمازون · نون · جوميا · ترينديول · كنز) وتتبع المزامنة الحقيقية
CREATE TABLE marketplace_connections (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('a', 'n', 'j', 't', 'k')),
  enabled INTEGER NOT NULL DEFAULT 1,
  environment TEXT NOT NULL DEFAULT 'production' CHECK (environment IN ('production', 'sandbox')),
  creds_enc TEXT NOT NULL DEFAULT '',
  endpoint_url TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'disconnected' CHECK (status IN ('disconnected', 'configured', 'connected', 'error')),
  last_tested_at TEXT,
  last_sync_at TEXT,
  last_error TEXT NOT NULL DEFAULT '',
  stats_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (user_id, platform)
);
CREATE INDEX marketplace_connections_user ON marketplace_connections(user_id);

ALTER TABLE orders ADD COLUMN external_ref TEXT NOT NULL DEFAULT '';
CREATE UNIQUE INDEX orders_user_market_extref ON orders(user_id, market, external_ref) WHERE external_ref <> '';
`];

const fs = require('node:fs');

function enforceDbFilePermissions(file) {
  if (!file || file === ':memory:') return;
  for (const suffix of ['', '-wal', '-shm']) {
    try {
      if (fs.existsSync(file + suffix)) fs.chmodSync(file + suffix, 0o600);
    } catch (_) { /* تجاهل على أنظمة الملفات التي لا تدعم chmod */ }
  }
}

function initDb(file) {
  const db = new DatabaseSync(file);
  db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000; PRAGMA synchronous = NORMAL; PRAGMA secure_delete = ON; PRAGMA temp_store = MEMORY;');
  enforceDbFilePermissions(file);

  let v = db.prepare('PRAGMA user_version').get().user_version;
  for (; v < MIGRATIONS.length; v++) {
    const mig = MIGRATIONS[v];
    const sql = typeof mig === 'string' ? mig : mig.sql;
    const toggleFk = typeof mig === 'object' && mig.disableForeignKeys;
    if (toggleFk) db.exec('PRAGMA foreign_keys = OFF;');
    db.exec('BEGIN');
    try {
      db.exec(sql);
      db.exec(`PRAGMA user_version = ${v + 1}`);
      db.exec('COMMIT');
    } catch (e) {
      db.exec('ROLLBACK');
      if (toggleFk) db.exec('PRAGMA foreign_keys = ON;');
      throw e;
    }
    if (toggleFk) db.exec('PRAGMA foreign_keys = ON;');
  }
  return db;
}

function openDb(file) {
  let db;
  try {
    db = initDb(file);
  } catch (e) {
    if (file === ':memory:') throw e;
    const msg = String(e?.message || '');
    const isCorrupt = /not a database|malformed|SQLITE_CORRUPT|SQLITE_NOTADB/i.test(msg);
    if (!isCorrupt) throw e;
    // في حالة تلف الملف فقط: نعزله بنسخة احتياطية بدلاً من مسح البيانات صامتًا
    try { db?.close(); } catch (_) {}
    const stamp = Date.now();
    for (const suffix of ['', '-shm', '-wal']) {
      try {
        if (fs.existsSync(file + suffix)) fs.renameSync(file + suffix, `${file}${suffix}.corrupt.${stamp}`);
      } catch (_) {}
    }
    console.error(`[db] تم عزل ملف قاعدة بيانات تالف إلى ${file}.corrupt.${stamp} وإعادة التهيئة.`);
    db = initDb(file);
  }

  const cache = new Map();
  /** عبارة SQL مُجهَّزة ومخزّنة مؤقتًا */
  const q = (sql) => { let s = cache.get(sql); if (!s) cache.set(sql, (s = db.prepare(sql))); return s; };

  let depth = 0;
  /** ينفّذ fn داخل معاملة ذرّية (كلها أو لا شيء) */
  const tx = (fn) => {
    if (depth) return fn();
    db.exec('BEGIN IMMEDIATE');
    depth = 1;
    try { const r = fn(); db.exec('COMMIT'); return r; }
    catch (e) { db.exec('ROLLBACK'); throw e; }
    finally { depth = 0; }
  };

  return { db, q, tx, close: () => db.close() };
}

module.exports = { openDb };
