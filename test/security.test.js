'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createApp } = require('../src/app');
const { createLimiter } = require('../src/http');
const {
  ENC_PREFIX,
  deriveSubkey,
  createFieldCipher,
  sanitizePayload,
  isWeakPassword,
  isDownloadTokenAllowedPath
} = require('../src/security');

async function startTestApp(overrides = {}) {
  const inst = createApp({
    dbFile: ':memory:',
    secret: 'security-test-secret-must-be-at-least-32-chars-long',
    dataEncryptionKey: 'separate-data-encryption-key-32-chars-minimum!!',
    ownerEmail: 'owner@sec.eg',
    ownerPhone: '01099990001',
    ownerPassword: 'OwnerSec@2026!',
    ...overrides
  });
  await new Promise((r) => inst.server.listen(0, '127.0.0.1', r));
  const { port } = inst.server.address();
  const base = `http://127.0.0.1:${port}`;
  const req = async (method, p, body, headers = {}) => {
    const res = await fetch(base + p, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(method !== 'GET' ? { 'X-Requested-With': 'omniarab' } : {}),
        ...headers
      },
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
    const text = await res.text();
    let json = null;
    try { json = JSON.parse(text); } catch { /* not json */ }
    return { status: res.status, headers: res.headers, text, json };
  };
  return { ...inst, base, req };
}

describe('وحدة التشفير والأمان الصافية (src/security.js)', () => {
  it('تشتق مفاتيح فرعية مستقلة عبر HKDF-SHA256 لكل غرض أمني', () => {
    const k1 = deriveSubkey('master-secret-value-1234567890123456', 'session-hmac-v1', 32);
    const k2 = deriveSubkey('master-secret-value-1234567890123456', 'receipt-hmac-v1', 32);
    const k3 = deriveSubkey('master-secret-value-1234567890123456', 'db-field-aes256gcm-v1', 32);
    assert.equal(k1.length, 32);
    assert.notEqual(k1.toString('hex'), k2.toString('hex'));
    assert.notEqual(k1.toString('hex'), k3.toString('hex'));
    assert.notEqual(k2.toString('hex'), k3.toString('hex'));
  });

  it('تشفّر الحقول الحساسة بـ AES-256-GCM مع IV عشوائي وكشف العبث وتوافق مع النصوص القديمة', () => {
    const cipher = createFieldCipher('test-master-encryption-key-32-bytes!!');
    const c1 = cipher.encrypt('412-890-115');
    const c2 = cipher.encrypt('412-890-115');
    assert.ok(c1.startsWith(ENC_PREFIX));
    assert.notEqual(c1, c2, 'كل عملية تشفير يجب أن تستخدم IV عشوائيًا مختلفًا');
    assert.equal(cipher.decrypt(c1), '412-890-115');
    assert.equal(cipher.decrypt(c2), '412-890-115');
    // توافق رجعي مع القيم غير المشفرة سابقًا
    assert.equal(cipher.decrypt('legacy-plain@instapay'), 'legacy-plain@instapay');
    // كشف التلاعب في النص المشفر أو وسم المصادقة
    const tampered = c1.slice(0, -4) + 'AAAA';
    assert.equal(cipher.decrypt(tampered), '');
    assert.throws(() => cipher.decrypt(tampered, { strict: true }));
  });

  it('تنظّف حمولات JSON ضد تلوث النموذج الأولي (Prototype Pollution) والتعشيش العميق', () => {
    const dirty = JSON.parse('{"name":"Test","__proto__":{"isAdmin":true},"constructor":{"prototype":{"pwn":1}}}');
    const clean = sanitizePayload(dirty);
    assert.equal(clean.name, 'Test');
    assert.equal(Object.prototype.hasOwnProperty.call(clean, '__proto__'), false);
    assert.equal(Object.prototype.hasOwnProperty.call(clean, 'constructor'), false);
    assert.equal(({}).isAdmin, undefined);

    let deep = { a: 1 };
    for (let i = 0; i < 20; i++) deep = { nested: deep };
    assert.throws(() => sanitizePayload(deep), /متداخلة/);
  });

  it('ترفض كلمات المرور الشائعة والمتكررة وتحصر تمرير التوكن في الروابط بمسارات التصدير فقط', () => {
    assert.equal(isWeakPassword('12345678'), true);
    assert.equal(isWeakPassword('password123'), true);
    assert.equal(isWeakPassword('aaaaaaaa'), true);
    assert.equal(isWeakPassword('Strong@Order2026'), false);

    assert.equal(isDownloadTokenAllowedPath('/api/products/export.csv'), true);
    assert.equal(isDownloadTokenAllowedPath('/api/orders/15/invoice'), true);
    assert.equal(isDownloadTokenAllowedPath('/api/auth/me'), false);
    assert.equal(isDownloadTokenAllowedPath('/api/owner/dashboard'), false);
  });

  it('تضع سقفًا لحجم ذاكرة محدّد معدل الطلبات لمنع استنزاف RAM', () => {
    const lim = createLimiter({ maxEntries: 5 });
    for (let i = 0; i < 20; i++) lim.hit(`ip:${i}`, 10, 60_000);
    assert.ok(lim.size() <= 5);
    lim.stop();
  });
});

describe('تكامل تقوية أمان الخادم وقاعدة البيانات', () => {
  it('تفعّل secure_delete وصلاحيات 0600 على ملف SQLite وتشفّر tax_id و instapay أثناء السكون', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'of-sec-'));
    const dbPath = path.join(tmpDir, 'secure.db');
    const app = await startTestApp({ dbFile: dbPath });
    try {
      const sd = app.db.prepare('PRAGMA secure_delete').get();
      assert.equal(sd.secure_delete, 1);
      const fk = app.db.prepare('PRAGMA foreign_keys').get();
      assert.equal(fk.foreign_keys, 1);

      const mode = fs.statSync(dbPath).mode & 0o777;
      assert.equal(mode, 0o600);

      // تسجيل عميل وتفعيله عبر المالك ثم حفظ taxId و instaPayHandle
      const reg = await app.req('POST', '/api/auth/register', {
        store: 'متجر الأمان',
        phone: '01055551111',
        email: 'sec@client.eg',
        password: 'ClientSec@2026'
      });
      assert.equal(reg.status, 200);
      const clientId = reg.json.account.id;

      const ownerLogin = await app.req('POST', '/api/auth/login', {
        id: 'owner@sec.eg',
        password: 'OwnerSec@2026!'
      });
      const ownerToken = ownerLogin.json.token;

      await app.req('POST', `/api/owner/clients/${clientId}/approve`, {}, { Authorization: `Bearer ${ownerToken}` });

      const clientLogin = await app.req('POST', '/api/auth/login', {
        id: 'sec@client.eg',
        password: 'ClientSec@2026'
      });
      const clientToken = clientLogin.json.token;

      const putRes = await app.req('PUT', '/api/settings', {
        taxId: '555-777-999',
        instaPayHandle: 'secure.merchant@instapay'
      }, { Authorization: `Bearer ${clientToken}` });
      assert.equal(putRes.status, 200);
      assert.equal(putRes.json.settings.taxId, '555-777-999');
      assert.equal(putRes.json.settings.instaPayHandle, 'secure.merchant@instapay');

      // التحقق المباشر من قاعدة البيانات: البيانات مخزّنة مشفرة وليست نصًا صريحًا
      const rawRow = app.db.prepare('SELECT tax_id, instapay FROM users WHERE id = ?').get(clientId);
      assert.ok(rawRow.tax_id.startsWith(ENC_PREFIX), 'يجب تخزين الرقم الضريبي مشفرًا في SQLite');
      assert.ok(rawRow.instapay.startsWith(ENC_PREFIX), 'يجب تخزين عنوان InstaPay مشفرًا في SQLite');
      assert.notEqual(rawRow.tax_id, '555-777-999');
      assert.notEqual(rawRow.instapay, 'secure.merchant@instapay');

      // منع استغلال صور SVG XSS أو الروابط النسبية //
      const svgRes = await app.req('POST', '/api/products', {
        name: 'منتج اختبار',
        sku: 'XSS-1',
        price: 100,
        stock: 5,
        markets: 'a',
        image: 'data:image/svg+xml,<svg onload=alert(1)>'
      }, { Authorization: `Bearer ${clientToken}` });
      assert.equal(svgRes.status, 400);

      const protoRelRes = await app.req('POST', '/api/products', {
        name: 'منتج اختبار',
        sku: 'XSS-2',
        price: 100,
        stock: 5,
        markets: 'a',
        image: '//evil.example/payload.png'
      }, { Authorization: `Bearer ${clientToken}` });
      assert.equal(protoRelRes.status, 400);

      // حصر ?token= على مسارات التصدير فقط ورفضه على /api/auth/me و /api/owner/dashboard
      const qMe = await app.req('GET', `/api/auth/me?token=${encodeURIComponent(clientToken)}`);
      assert.equal(qMe.status, 401);
      const qOwner = await app.req('GET', `/api/owner/dashboard?token=${encodeURIComponent(ownerToken)}`);
      assert.equal(qOwner.status, 404);
      const qCsv = await app.req('GET', `/api/products/export.csv?token=${encodeURIComponent(clientToken)}`);
      assert.equal(qCsv.status, 200);

      // التحقق من ترويسات الأمان ومهل Slowloris
      assert.equal(qCsv.headers.get('x-content-type-options'), 'nosniff');
      assert.equal(qCsv.headers.get('x-dns-prefetch-control'), 'off');
      assert.equal(qCsv.headers.get('x-permitted-cross-domain-policies'), 'none');
      assert.equal(qCsv.headers.get('cross-origin-resource-policy'), 'same-origin');
      assert.ok(app.server.requestTimeout > 0 && app.server.headersTimeout > 0);

      // منع استعادة كلمة المرور العامة لحساب المالك (بدون كشف وجوده)
      const ownerFp = await app.req('POST', '/api/auth/forgot-password', { id: 'owner@sec.eg' });
      assert.equal(ownerFp.status, 200);
      assert.equal(ownerFp.json.devToken, undefined);

      // إبطال الجلسة على الخادم فور تسجيل الخروج
      const logoutRes = await app.req('POST', '/api/auth/logout', {}, { Authorization: `Bearer ${clientToken}` });
      assert.equal(logoutRes.status, 200);
      const reusedRes = await app.req('GET', '/api/auth/me', undefined, { Authorization: `Bearer ${clientToken}` });
      assert.equal(reusedRes.status, 401);
      assert.equal(reusedRes.json.code, 'SESSION_REVOKED');

      // رفض كلمات المرور الضعيفة عند التسجيل
      const weakReg = await app.req('POST', '/api/auth/register', {
        store: 'متجر ضعيف',
        phone: '01055552222',
        email: 'weak@client.eg',
        password: 'password123'
      });
      assert.equal(weakReg.status, 400);
    } finally {
      await app.close();
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
