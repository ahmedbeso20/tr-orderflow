'use strict';
const crypto = require('node:crypto');
const { HttpError, bad, nowIso, parseJson } = require('../util');
const { MARKETS } = require('../domain');

const PLATFORM_KEYS = ['a', 'n', 'j', 't', 'k'];
const REQUEST_TIMEOUT_MS = 12_000;

/**
 * تعريف حقول الربط الرسمية لكل منصة بيع (تُعرض ديناميكيًا في شاشة التكاملات)
 * secret: true => يُشفَّر بـ AES-256-GCM في قاعدة البيانات ولا يُعاد أبدًا بالنص الصريح للواجهة
 */
const PLATFORM_SCHEMAS = Object.freeze({
  a: {
    key: 'a',
    name: 'أمازون مصر (Amazon SP-API)',
    docsHint: 'احصل على مفاتيح LWA و Refresh Token من Seller Central ← Apps & Services ← Develop Apps.',
    defaultBaseUrl: 'https://sellingpartnerapi-eu.amazon.com',
    sandboxBaseUrl: 'https://sandbox.sellingpartnerapi-eu.amazon.com',
    fields: [
      { name: 'sellerId', label: 'معرّف البائع (Seller ID)', placeholder: 'مثال: A2EUQ1WTGCTBG2', required: true, secret: false },
      { name: 'marketplaceId', label: 'معرّف سوق مصر (Marketplace ID)', placeholder: 'ARBP9OOSHTCHU', defaultValue: 'ARBP9OOSHTCHU', required: false, secret: false },
      { name: 'clientId', label: 'LWA Client ID', placeholder: 'amzn1.application-oa2-client.xxxx', required: true, secret: false },
      { name: 'clientSecret', label: 'LWA Client Secret', placeholder: 'amzn1.oa2-cs.v1.xxxx', required: true, secret: true },
      { name: 'refreshToken', label: 'LWA Refresh Token', placeholder: 'Atzr|IwEBIA...', required: true, secret: true }
    ]
  },
  n: {
    key: 'n',
    name: 'نون مصر والخليج (Noon Partners API)',
    docsHint: 'أنشئ مفتاح API من Noon Seller Lab / Partners Portal ← API Keys واربطه بـ Project Code.',
    defaultBaseUrl: 'https://noon-api-gateway.noon.partners',
    sandboxBaseUrl: 'https://noon-api-gateway.noon.partners',
    fields: [
      { name: 'projectCode', label: 'كود المشروع (Project Code)', placeholder: 'مثال: PRJ1234', required: true, secret: false },
      { name: 'keyId', label: 'معرّف المفتاح (Key ID)', placeholder: 'مثال: noon_partner_key_01', required: true, secret: false },
      { name: 'privateKey', label: 'المفتاح الخاص (Private Key PEM أو API Token)', placeholder: '-----BEGIN PRIVATE KEY----- أو Bearer Token', required: true, secret: true, multiline: true },
      { name: 'baseUrl', label: 'رابط البوابة (اختياري)', placeholder: 'https://noon-api-gateway.noon.partners', defaultValue: 'https://noon-api-gateway.noon.partners', required: false, secret: false, isUrl: true }
    ]
  },
  j: {
    key: 'j',
    name: 'جوميا مصر (Jumia Vendor Center API)',
    docsHint: 'احصل على Client ID و Refresh Token أو مفتاح API من Jumia Vendor Center ← Settings ← Integration.',
    defaultBaseUrl: 'https://vendor-api.jumia.com',
    sandboxBaseUrl: 'https://vendor-api-staging.jumia.com',
    fields: [
      { name: 'shopId', label: 'معرّف المتجر أو بريد البائع (Shop ID / Email)', placeholder: 'مثال: shop_eg_1029 أو seller@store.eg', required: true, secret: false },
      { name: 'clientId', label: 'معرّف التطبيق (Client ID)', placeholder: 'مثال: jumia-client-xxxx', required: true, secret: false },
      { name: 'apiKey', label: 'مفتاح API أو OAuth Refresh Token', placeholder: 'أدخل Refresh Token أو API Key', required: true, secret: true },
      { name: 'baseUrl', label: 'رابط Jumia API (اختياري)', placeholder: 'https://vendor-api.jumia.com', defaultValue: 'https://vendor-api.jumia.com', required: false, secret: false, isUrl: true }
    ]
  },
  t: {
    key: 't',
    name: 'ترينديول (Trendyol Supplier API)',
    docsHint: 'احصل على Supplier ID و API Key و API Secret من Trendyol Partner Panel ← Account Info ← Integration Info.',
    defaultBaseUrl: 'https://apigw.trendyol.com',
    sandboxBaseUrl: 'https://stageapigw.trendyol.com',
    fields: [
      { name: 'supplierId', label: 'معرّف المورّد (Supplier ID)', placeholder: 'مثال: 123456', required: true, secret: false },
      { name: 'apiKey', label: 'مفتاح الربط (API Key)', placeholder: 'أدخل Trendyol API Key', required: true, secret: true },
      { name: 'apiSecret', label: 'الرمز السري (API Secret)', placeholder: 'أدخل Trendyol API Secret', required: true, secret: true },
      { name: 'storeFrontCode', label: 'كود الدولة / السوق (اختياري)', placeholder: 'EG أو TR', defaultValue: 'EG', required: false, secret: false }
    ]
  },
  k: {
    key: 'k',
    name: 'كنز مصر (Kenzz Partner API)',
    docsHint: 'أدخل Store ID ومفتاح الربط المعتمد من فريق شركاء Kenzz Egypt لتفعيل المزامنة الفورية.',
    defaultBaseUrl: 'https://partners-api.kenzz.com/v1',
    sandboxBaseUrl: 'https://sandbox-partners-api.kenzz.com/v1',
    fields: [
      { name: 'storeId', label: 'معرّف المتجر (Store ID)', placeholder: 'مثال: KNZ-EG-8821', required: true, secret: false },
      { name: 'apiKey', label: 'مفتاح الربط (Partner API Key)', placeholder: 'knz_live_xxxx', required: true, secret: true },
      { name: 'apiSecret', label: 'الرمز السري (API Secret — اختياري)', placeholder: 'اتركه فارغًا إن لم يُطلب', required: false, secret: true },
      { name: 'baseUrl', label: 'رابط Kenzz API (اختياري)', placeholder: 'https://partners-api.kenzz.com/v1', defaultValue: 'https://partners-api.kenzz.com/v1', required: false, secret: false, isUrl: true }
    ]
  }
});

/**
 * حماية SSRF صارمة: السماح فقط بروابط HTTPS عامة ومنع العناوين المحلية أو الشبكات الداخلية
 */
function assertSafeExternalUrl(raw, label = 'رابط الـ API') {
  const s = String(raw || '').trim();
  if (!s) return '';
  let u;
  try {
    u = new URL(s);
  } catch {
    throw bad(`${label}: صيغة الرابط غير صحيحة`);
  }
  if (u.protocol !== 'https:') {
    throw bad(`${label}: يجب أن يبدأ الرابط ببروتوكول https:// الآمن فقط`);
  }
  if (u.username || u.password) {
    throw bad(`${label}: لا يُسمح بتضمين بيانات مصادقة داخل الرابط`);
  }
  const host = u.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (!host || host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal') || host.endsWith('.localhost')) {
    throw bad(`${label}: غير مسموح بالاتصال بعناوين محلية أو داخلية`);
  }
  // فحص عناوين IPv4 الخاصة/المحلية وعنوان Cloud Metadata (169.254.169.254)
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) {
    const [a, b] = host.split('.').map(Number);
    if (
      a === 0 || a === 10 || a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127)
    ) {
      throw bad(`${label}: غير مسموح بالاتصال بعناوين IP خاصة أو محلية`);
    }
  }
  // فحص عناوين IPv6 المحلية/الخاصة
  if (host.includes(':')) {
    if (host === '::1' || host === '::' || host.startsWith('fc') || host.startsWith('fd') || host.startsWith('fe80') || host.includes('127.0.0.1')) {
      throw bad(`${label}: غير مسموح بالاتصال بعناوين IPv6 محلية أو خاصة`);
    }
  }
  return u.toString().replace(/\/+$/, '');
}

function maskSecret(val) {
  const s = String(val || '').trim();
  if (!s) return '';
  if (s.length <= 4) return '••••';
  return `••••${s.slice(-4)}`;
}

/**
 * إخفاء الحقول السرية قبل إرسال بيانات الاتصال للواجهة
 */
function maskCredentials(platform, rawCreds = {}) {
  const schema = PLATFORM_SCHEMAS[platform];
  if (!schema) return {};
  const out = {};
  for (const f of schema.fields) {
    const val = String(rawCreds[f.name] ?? '').trim();
    if (f.secret) {
      out[f.name] = { configured: Boolean(val), masked: maskSecret(val) };
    } else {
      out[f.name] = val || f.defaultValue || '';
    }
  }
  return out;
}

/**
 * التحقق من صحة المدخلات ودمج الأسرار السابقة إذا تُرك حقل السر فارغًا أثناء التعديل
 */
function validateAndMergeCredentials(platform, inputCreds = {}, existingCreds = {}) {
  const schema = PLATFORM_SCHEMAS[platform];
  if (!schema) throw bad('منصة غير مدعومة');
  if (!inputCreds || typeof inputCreds !== 'object' || Array.isArray(inputCreds)) {
    throw bad('بيانات الربط غير صالحة');
  }

  const merged = {};
  for (const f of schema.fields) {
    let val = inputCreds[f.name] !== undefined && inputCreds[f.name] !== null
      ? String(inputCreds[f.name]).trim()
      : '';
    // عند التعديل، إذا تُرك الحقل السري فارغًا نحتفظ بالقيمة المشفرة السابقة
    if (!val && f.secret && existingCreds[f.name]) {
      val = String(existingCreds[f.name]).trim();
    }
    if (!val && f.defaultValue) {
      val = f.defaultValue;
    }
    if (val.length > 4000) {
      throw bad(`${f.label}: القيمة طويلة جدًا`);
    }
    if (f.isUrl && val) {
      val = assertSafeExternalUrl(val, f.label);
    }
    if (f.required && !val) {
      throw bad(`حقل "${f.label}" مطلوب لإتمام الربط مع ${schema.name}`);
    }
    merged[f.name] = val;
  }
  return merged;
}

/**
 * استدعاء JSON آمن مع مهلة زمنية صارمة (12 ثانية) وتمرير fetch القابل للحقن في الاختبارات
 */
async function callJson(fetchFn, url, opts = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs || REQUEST_TIMEOUT_MS);
  try {
    const res = await fetchFn(url, {
      method: opts.method || 'GET',
      headers: opts.headers || {},
      body: opts.body,
      signal: controller.signal
    });
    const textBody = typeof res.text === 'function'
      ? await res.text()
      : JSON.stringify(await res.json());
    let data = null;
    try { data = textBody ? JSON.parse(textBody) : {}; } catch { data = { raw: textBody.slice(0, 300) }; }
    return { ok: Boolean(res.ok), status: Number(res.status || 0), data };
  } catch (err) {
    if (err && err.name === 'AbortError') {
      throw new HttpError(504, 'انتهت مهلة الاتصال بسيرفر المنصة (12 ثانية). تأكد من صحة رابط API والإنترنت.');
    }
    throw new HttpError(502, `تعذّر الوصول إلى سيرفر المنصة: ${err?.message || 'خطأ في الشبكة'}`);
  } finally {
    clearTimeout(timer);
  }
}

function base64Url(input) {
  return Buffer.from(input).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function buildNoonJwt(keyId, privateKey) {
  const header = base64Url(JSON.stringify({ alg: privateKey.includes('BEGIN') ? 'RS256' : 'HS256', typ: 'JWT' }));
  const now = Math.floor(Date.now() / 1000);
  const payload = base64Url(JSON.stringify({ sub: keyId, iat: now, exp: now + 300, jti: crypto.randomUUID() }));
  const signingInput = `${header}.${payload}`;
  if (privateKey.includes('BEGIN')) {
    const signer = crypto.createSign('RSA-SHA256');
    signer.update(signingInput);
    const sig = signer.sign(privateKey, 'base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    return `${signingInput}.${sig}`;
  }
  const sig = crypto.createHmac('sha256', privateKey).update(signingInput).digest('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${signingInput}.${sig}`;
}

function apiErrorDetail(res) {
  const d = res?.data;
  if (!d) return `HTTP ${res?.status || 'ERR'}`;
  if (typeof d === 'string') return d.slice(0, 180);
  const msg = d.error_description || d.message || d.error || (Array.isArray(d.errors) && (d.errors[0]?.message || d.errors[0])) || d.raw || '';
  return `HTTP ${res.status}${msg ? ` — ${String(msg).slice(0, 160)}` : ''}`;
}

/* ==========================================================================
   الموصّلات الحقيقية للمنصات الخمس (Amazon · Noon · Jumia · Trendyol · Kenzz)
   ========================================================================== */

const ADAPTERS = {
  /** 1. Amazon Egypt — Selling Partner API (LWA OAuth2 + SP-API EU Endpoint) */
  a: {
    async getAccessToken(creds, fetchFn) {
      const form = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: creds.refreshToken,
        client_id: creds.clientId,
        client_secret: creds.clientSecret
      });
      const res = await callJson(fetchFn, 'https://api.amazon.com/auth/o2/token', {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: form.toString()
      });
      if (!res.ok || !res.data?.access_token) {
        throw new HttpError(400, `فشل مصادقة Amazon LWA: ${apiErrorDetail(res)}`);
      }
      return res.data.access_token;
    },

    async test(creds, env, fetchFn) {
      const token = await this.getAccessToken(creds, fetchFn);
      const base = env === 'sandbox' ? PLATFORM_SCHEMAS.a.sandboxBaseUrl : PLATFORM_SCHEMAS.a.defaultBaseUrl;
      const res = await callJson(fetchFn, `${base}/sellers/v1/marketplaceParticipations`, {
        headers: { 'x-amz-access-token': token, accept: 'application/json' }
      });
      if (!res.ok) {
        throw new HttpError(400, `فشل التحقق من حساب Amazon SP-API: ${apiErrorDetail(res)}`);
      }
      const list = Array.isArray(res.data?.payload) ? res.data.payload : [];
      return {
        ok: true,
        message: `تم الاتصال بنجاح بحساب أمازون (${creds.sellerId})${list.length ? ` — ${list.length} سوق نشط` : ''}.`,
        meta: { sellerId: creds.sellerId, marketplaces: list.length }
      };
    },

    async sync(creds, env, fetchFn) {
      const token = await this.getAccessToken(creds, fetchFn);
      const base = env === 'sandbox' ? PLATFORM_SCHEMAS.a.sandboxBaseUrl : PLATFORM_SCHEMAS.a.defaultBaseUrl;
      const mpId = creds.marketplaceId || 'ARBP9OOSHTCHU';
      const since = new Date(Date.now() - 30 * 86400_000).toISOString();
      const headers = { 'x-amz-access-token': token, accept: 'application/json' };

      const [ordersRes, invRes] = await Promise.all([
        callJson(fetchFn, `${base}/orders/v0/orders?MarketplaceIds=${encodeURIComponent(mpId)}&CreatedAfter=${encodeURIComponent(since)}`, { headers }),
        callJson(fetchFn, `${base}/fba/inventory/v1/summaries?granularityType=Marketplace&granularityId=${encodeURIComponent(mpId)}&marketplaceIds=${encodeURIComponent(mpId)}`, { headers }).catch(() => ({ ok: false, data: {} }))
      ]);

      if (!ordersRes.ok) {
        throw new HttpError(400, `فشل سحب طلبات أمازون: ${apiErrorDetail(ordersRes)}`);
      }

      const rawOrders = ordersRes.data?.payload?.Orders || ordersRes.data?.Orders || [];
      const rawProducts = invRes.ok ? (invRes.data?.payload?.inventorySummaries || invRes.data?.inventorySummaries || []) : [];

      const products = rawProducts.map((p) => ({
        sku: String(p.sellerSku || p.asin || '').trim(),
        name: String(p.productName || p.sellerSku || 'منتج أمازون').trim(),
        price: Number(p.price || 0) || 100,
        stock: Math.max(0, Number(p.totalQuantity ?? p.inventoryDetails?.fulfillableQuantity ?? 0) || 0),
        cat: 'أمازون مصر'
      })).filter((p) => p.sku);

      const orders = rawOrders.map((o) => ({
        externalRef: String(o.AmazonOrderId || '').trim(),
        customer: String(o.BuyerInfo?.BuyerName || o.ShippingAddress?.Name || 'عميل أمازون').trim(),
        gov: String(o.ShippingAddress?.StateOrRegion || o.ShippingAddress?.City || 'القاهرة').trim(),
        address: String(o.ShippingAddress?.AddressLine1 || '').trim(),
        total: Math.max(1, Number(o.OrderTotal?.Amount || 0) || 1),
        pay: o.PaymentMethod === 'COD' ? 'عند الاستلام' : 'بطاقة بنكية',
        status: o.OrderStatus === 'Shipped' ? 1 : o.OrderStatus === 'Delivered' ? 2 : o.OrderStatus === 'Canceled' ? 4 : 0,
        items: `طلب أمازون #${o.AmazonOrderId || ''}`,
        createdAt: o.PurchaseDate || nowIso()
      })).filter((o) => o.externalRef);

      return { products, orders };
    }
  },

  /** 2. Noon Egypt — Noon Partners API (JWT Login + FBPI Orders & Stock) */
  n: {
    async getAuthHeaders(creds, fetchFn) {
      const base = assertSafeExternalUrl(creds.baseUrl || PLATFORM_SCHEMAS.n.defaultBaseUrl, 'رابط نون API');
      const token = buildNoonJwt(creds.keyId, creds.privateKey);
      const loginRes = await callJson(fetchFn, `${base}/identity/public/v1/api/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-project-code': creds.projectCode },
        body: JSON.stringify({ token, default_project_code: creds.projectCode })
      });
      if (!loginRes.ok) {
        throw new HttpError(400, `فشل مصادقة Noon Partners: ${apiErrorDetail(loginRes)}`);
      }
      const sessionToken = loginRes.data?.token || loginRes.data?.access_token || token;
      return {
        base,
        headers: {
          authorization: `Bearer ${sessionToken}`,
          'x-project-code': creds.projectCode,
          'content-type': 'application/json',
          accept: 'application/json'
        }
      };
    },

    async test(creds, _env, fetchFn) {
      await this.getAuthHeaders(creds, fetchFn);
      return {
        ok: true,
        message: `تم الاتصال بنجاح بحساب نون (${creds.projectCode}).`,
        meta: { projectCode: creds.projectCode }
      };
    },

    async sync(creds, _env, fetchFn) {
      const { base, headers } = await this.getAuthHeaders(creds, fetchFn);
      const [ordersRes, stockRes] = await Promise.all([
        callJson(fetchFn, `${base}/fbpi/v1/orders/search`, { method: 'POST', headers, body: JSON.stringify({ limit: 50 }) }),
        callJson(fetchFn, `${base}/stock/v1/stock-list`, { method: 'POST', headers, body: JSON.stringify({ limit: 50 }) }).catch(() => ({ ok: false, data: {} }))
      ]);
      if (!ordersRes.ok && !stockRes.ok) {
        throw new HttpError(400, `فشل سحب بيانات نون: ${apiErrorDetail(ordersRes)}`);
      }
      const rawProducts = stockRes.ok ? (stockRes.data?.items || stockRes.data?.data || []) : [];
      const rawOrders = ordersRes.ok ? (ordersRes.data?.orders || ordersRes.data?.items || ordersRes.data?.data || []) : [];

      const products = rawProducts.map((p) => ({
        sku: String(p.partner_sku || p.sku || '').trim(),
        name: String(p.title || p.name || p.partner_sku || 'منتج نون').trim(),
        price: Number(p.price || p.sale_price || 0) || 100,
        stock: Math.max(0, Number(p.quantity ?? p.stock ?? 0) || 0),
        cat: 'نون مصر'
      })).filter((p) => p.sku);

      const orders = rawOrders.map((o) => ({
        externalRef: String(o.order_nr || o.id || '').trim(),
        customer: String(o.customer_name || 'عميل نون').trim(),
        gov: String(o.city || o.governorate || 'القاهرة').trim(),
        address: String(o.address || '').trim(),
        total: Math.max(1, Number(o.total_amount || o.price || 0) || 1),
        pay: /cod/i.test(String(o.payment_method || '')) ? 'عند الاستلام' : 'بطاقة بنكية',
        status: /deliver/i.test(String(o.status || '')) ? 2 : /ship/i.test(String(o.status || '')) ? 1 : /cancel/i.test(String(o.status || '')) ? 4 : 0,
        items: `طلب نون #${o.order_nr || o.id || ''}`,
        createdAt: o.created_at || nowIso()
      })).filter((o) => o.externalRef);

      return { products, orders };
    }
  },

  /** 3. Jumia Egypt — Jumia Vendor Center API */
  j: {
    async getAuthHeaders(creds, env, fetchFn) {
      const base = assertSafeExternalUrl(
        creds.baseUrl || (env === 'sandbox' ? PLATFORM_SCHEMAS.j.sandboxBaseUrl : PLATFORM_SCHEMAS.j.defaultBaseUrl),
        'رابط جوميا API'
      );
      let bearer = creds.apiKey;
      // محاولة استبدال Refresh Token عبر نقطة OAuth2 الرسمية لجوميا عند توفر clientId
      const form = new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: creds.clientId,
        refresh_token: creds.apiKey
      });
      const tokRes = await callJson(fetchFn, `${base}/token`, {
        method: 'POST',
        headers: { 'content-type': 'application/x-www-form-urlencoded' },
        body: form.toString()
      }).catch(() => ({ ok: false, data: {} }));
      if (tokRes.ok && tokRes.data?.access_token) {
        bearer = tokRes.data.access_token;
      }
      return {
        base,
        headers: {
          authorization: `Bearer ${bearer}`,
          'x-shop-id': creds.shopId,
          accept: 'application/json'
        }
      };
    },

    async test(creds, env, fetchFn) {
      const { base, headers } = await this.getAuthHeaders(creds, env, fetchFn);
      const res = await callJson(fetchFn, `${base}/shops`, { headers });
      if (!res.ok) {
        throw new HttpError(400, `فشل التحقق من حساب Jumia Vendor Center: ${apiErrorDetail(res)}`);
      }
      const shops = Array.isArray(res.data?.shops) ? res.data.shops : (Array.isArray(res.data) ? res.data : []);
      return {
        ok: true,
        message: `تم الاتصال بنجاح بحساب جوميا (${creds.shopId})${shops.length ? ` — ${shops.length} متجر` : ''}.`,
        meta: { shopId: creds.shopId, shops: shops.length }
      };
    },

    async sync(creds, env, fetchFn) {
      const { base, headers } = await this.getAuthHeaders(creds, env, fetchFn);
      const [ordersRes, prodRes] = await Promise.all([
        callJson(fetchFn, `${base}/orders?size=50`, { headers }),
        callJson(fetchFn, `${base}/catalog/products?size=50`, { headers }).catch(() => ({ ok: false, data: {} }))
      ]);
      if (!ordersRes.ok && !prodRes.ok) {
        throw new HttpError(400, `فشل سحب بيانات جوميا: ${apiErrorDetail(ordersRes)}`);
      }
      const rawProducts = prodRes.ok ? (prodRes.data?.products || prodRes.data?.items || []) : [];
      const rawOrders = ordersRes.ok ? (ordersRes.data?.orders || ordersRes.data?.items || []) : [];

      const products = rawProducts.map((p) => ({
        sku: String(p.sellerSku || p.sku || p.id || '').trim(),
        name: String(p.name || p.title || p.sellerSku || 'منتج جوميا').trim(),
        price: Number(p.price?.value ?? p.price ?? 0) || 100,
        stock: Math.max(0, Number(p.stock ?? p.quantity ?? 0) || 0),
        cat: 'جوميا مصر'
      })).filter((p) => p.sku);

      const orders = rawOrders.map((o) => ({
        externalRef: String(o.number || o.id || '').trim(),
        customer: String(o.shippingAddress?.firstName ? `${o.shippingAddress.firstName} ${o.shippingAddress.lastName || ''}`.trim() : (o.customerName || 'عميل جوميا')).trim(),
        gov: String(o.shippingAddress?.city || o.city || 'القاهرة').trim(),
        address: String(o.shippingAddress?.address || '').trim(),
        total: Math.max(1, Number(o.totalAmountLocalValue || o.total || 0) || 1),
        pay: /cod|cash/i.test(String(o.paymentMethod || '')) ? 'عند الاستلام' : 'بطاقة بنكية',
        status: /deliver/i.test(String(o.status || '')) ? 2 : /ship/i.test(String(o.status || '')) ? 1 : /cancel/i.test(String(o.status || '')) ? 4 : 0,
        items: `طلب جوميا #${o.number || o.id || ''}`,
        createdAt: o.createdAt || nowIso()
      })).filter((o) => o.externalRef);

      return { products, orders };
    }
  },

  /** 4. Trendyol — Official Supplier API (Basic Auth + Supplier User-Agent) */
  t: {
    headers(creds) {
      const basic = Buffer.from(`${creds.apiKey}:${creds.apiSecret}`).toString('base64');
      return {
        authorization: `Basic ${basic}`,
        'user-agent': `${creds.supplierId} - SelfIntegration`,
        accept: 'application/json'
      };
    },

    async test(creds, env, fetchFn) {
      const base = env === 'sandbox' ? PLATFORM_SCHEMAS.t.sandboxBaseUrl : PLATFORM_SCHEMAS.t.defaultBaseUrl;
      const url = `${base}/integration/product/sellers/${encodeURIComponent(creds.supplierId)}/products?size=1`;
      const res = await callJson(fetchFn, url, { headers: this.headers(creds) });
      if (!res.ok) {
        throw new HttpError(400, `فشل التحقق من حساب Trendyol: ${apiErrorDetail(res)}`);
      }
      const total = Number(res.data?.totalElements ?? 0);
      return {
        ok: true,
        message: `تم الاتصال بنجاح بحساب ترينديول (#${creds.supplierId}) — ${total} منتج متاح.`,
        meta: { supplierId: creds.supplierId, totalProducts: total }
      };
    },

    async sync(creds, env, fetchFn) {
      const base = env === 'sandbox' ? PLATFORM_SCHEMAS.t.sandboxBaseUrl : PLATFORM_SCHEMAS.t.defaultBaseUrl;
      const headers = this.headers(creds);
      const sid = encodeURIComponent(creds.supplierId);
      const [prodRes, ordersRes] = await Promise.all([
        callJson(fetchFn, `${base}/integration/product/sellers/${sid}/products?size=50`, { headers }),
        callJson(fetchFn, `${base}/integration/order/sellers/${sid}/orders?size=50`, { headers }).catch(() => ({ ok: false, data: {} }))
      ]);
      if (!prodRes.ok && !ordersRes.ok) {
        throw new HttpError(400, `فشل سحب بيانات ترينديول: ${apiErrorDetail(prodRes)}`);
      }
      const rawProducts = prodRes.ok ? (prodRes.data?.content || []) : [];
      const rawOrders = ordersRes.ok ? (ordersRes.data?.content || []) : [];

      const products = rawProducts.map((p) => ({
        sku: String(p.stockCode || p.barcode || p.productCode || '').trim(),
        name: String(p.title || p.stockCode || 'منتج ترينديول').trim(),
        price: Number(p.salePrice ?? p.listPrice ?? 0) || 100,
        stock: Math.max(0, Number(p.quantity ?? 0) || 0),
        cat: String(p.categoryName || 'ترينديول').trim()
      })).filter((p) => p.sku);

      const orders = rawOrders.map((o) => ({
        externalRef: String(o.orderNumber || o.id || '').trim(),
        customer: String(`${o.customerFirstName || ''} ${o.customerLastName || ''}`.trim() || 'عميل ترينديول'),
        gov: String(o.shipmentAddress?.city || 'القاهرة').trim(),
        address: String(o.shipmentAddress?.fullAddress || '').trim(),
        total: Math.max(1, Number(o.totalPrice || o.grossAmount || 0) || 1),
        pay: 'بطاقة بنكية',
        status: /deliver/i.test(String(o.status || '')) ? 2 : /ship/i.test(String(o.status || '')) ? 1 : /cancel/i.test(String(o.status || '')) ? 4 : 0,
        items: Array.isArray(o.lines) && o.lines.length
          ? o.lines.map((l) => `${l.productName || l.merchantSku || 'منتج'} ×${l.quantity || 1}`).join('، ')
          : `طلب ترينديول #${o.orderNumber || o.id || ''}`,
        createdAt: o.orderDate ? new Date(o.orderDate).toISOString() : nowIso()
      })).filter((o) => o.externalRef);

      return { products, orders };
    }
  },

  /** 5. Kenzz Egypt — Kenzz Partner API */
  k: {
    headers(creds) {
      const h = {
        authorization: `Bearer ${creds.apiKey}`,
        'x-store-id': creds.storeId,
        accept: 'application/json'
      };
      if (creds.apiSecret) h['x-api-secret'] = creds.apiSecret;
      return h;
    },

    async test(creds, env, fetchFn) {
      const base = assertSafeExternalUrl(
        creds.baseUrl || (env === 'sandbox' ? PLATFORM_SCHEMAS.k.sandboxBaseUrl : PLATFORM_SCHEMAS.k.defaultBaseUrl),
        'رابط كنز API'
      );
      const res = await callJson(fetchFn, `${base}/merchant/profile`, { headers: this.headers(creds) });
      if (!res.ok) {
        throw new HttpError(400, `فشل التحقق من حساب Kenzz: ${apiErrorDetail(res)}`);
      }
      return {
        ok: true,
        message: `تم الاتصال بنجاح بحساب كنز (${creds.storeId}).`,
        meta: { storeId: creds.storeId, storeName: res.data?.name || res.data?.storeName || '' }
      };
    },

    async sync(creds, env, fetchFn) {
      const base = assertSafeExternalUrl(
        creds.baseUrl || (env === 'sandbox' ? PLATFORM_SCHEMAS.k.sandboxBaseUrl : PLATFORM_SCHEMAS.k.defaultBaseUrl),
        'رابط كنز API'
      );
      const headers = this.headers(creds);
      const [prodRes, ordersRes] = await Promise.all([
        callJson(fetchFn, `${base}/products?limit=50`, { headers }),
        callJson(fetchFn, `${base}/orders?limit=50`, { headers }).catch(() => ({ ok: false, data: {} }))
      ]);
      if (!prodRes.ok && !ordersRes.ok) {
        throw new HttpError(400, `فشل سحب بيانات كنز: ${apiErrorDetail(prodRes)}`);
      }
      const rawProducts = prodRes.ok ? (prodRes.data?.products || prodRes.data?.data || []) : [];
      const rawOrders = ordersRes.ok ? (ordersRes.data?.orders || ordersRes.data?.data || []) : [];

      const products = rawProducts.map((p) => ({
        sku: String(p.sku || p.id || '').trim(),
        name: String(p.name || p.title || 'منتج كنز').trim(),
        price: Number(p.price || 0) || 100,
        stock: Math.max(0, Number(p.stock ?? p.quantity ?? 0) || 0),
        cat: String(p.category || 'كنز مصر').trim()
      })).filter((p) => p.sku);

      const orders = rawOrders.map((o) => ({
        externalRef: String(o.order_id || o.id || '').trim(),
        customer: String(o.customer_name || o.customer?.name || 'عميل كنز').trim(),
        gov: String(o.governorate || o.city || 'القاهرة').trim(),
        address: String(o.address || '').trim(),
        total: Math.max(1, Number(o.total || o.amount || 0) || 1),
        pay: /cod|cash|استلام/i.test(String(o.payment_method || '')) ? 'عند الاستلام' : 'إنستاباي',
        status: /deliver/i.test(String(o.status || '')) ? 2 : /ship/i.test(String(o.status || '')) ? 1 : /cancel/i.test(String(o.status || '')) ? 4 : 0,
        items: `طلب كنز #${o.order_id || o.id || ''}`,
        createdAt: o.created_at || nowIso()
      })).filter((o) => o.externalRef);

      return { products, orders };
    }
  }
};

/**
 * إنشاء خدمة الموصّلات المربوطة بقاعدة البيانات والتشفير (AES-256-GCM)
 */
function createConnectors(app) {
  const { q, tx, cfg, cipher } = app;

  function decryptRowCreds(row) {
    if (!row || !row.creds_enc) return {};
    try {
      const plain = cipher.decrypt(row.creds_enc);
      return parseJson(plain, {});
    } catch {
      return {};
    }
  }

  function formatRow(platform, row) {
    const schema = PLATFORM_SCHEMAS[platform];
    if (!row) {
      return {
        platform,
        name: schema.name,
        configured: false,
        enabled: false,
        environment: 'production',
        status: 'disconnected',
        credentials: maskCredentials(platform, {}),
        lastTestedAt: null,
        lastSyncAt: null,
        lastError: '',
        stats: {}
      };
    }
    const rawCreds = decryptRowCreds(row);
    const masked = maskCredentials(platform, rawCreds);
    const hasRequired = schema.fields.filter((f) => f.required).every((f) => Boolean(rawCreds[f.name]));
    return {
      platform,
      name: schema.name,
      configured: hasRequired,
      enabled: Boolean(row.enabled),
      environment: row.environment || 'production',
      status: row.status || (hasRequired ? 'configured' : 'disconnected'),
      credentials: masked,
      lastTestedAt: row.last_tested_at || null,
      lastSyncAt: row.last_sync_at || null,
      lastError: row.last_error || '',
      stats: parseJson(row.stats_json, {})
    };
  }

  function listForUser(userId) {
    const rows = q('SELECT * FROM marketplace_connections WHERE user_id = ?').all(userId);
    const byPlatform = new Map(rows.map((r) => [r.platform, r]));
    return PLATFORM_KEYS.map((p) => formatRow(p, byPlatform.get(p)));
  }

  function getRow(userId, platform) {
    if (!PLATFORM_KEYS.includes(platform)) throw bad('منصة غير مدعومة');
    return q('SELECT * FROM marketplace_connections WHERE user_id = ? AND platform = ?').get(userId, platform);
  }

  function saveConnection(userId, platform, { credentials, environment = 'production', enabled = true }) {
    if (!PLATFORM_KEYS.includes(platform)) throw bad('منصة غير مدعومة');
    const env = environment === 'sandbox' ? 'sandbox' : 'production';
    const existingRow = getRow(userId, platform);
    const existingCreds = decryptRowCreds(existingRow);
    const merged = validateAndMergeCredentials(platform, credentials, existingCreds);
    const enc = cipher.encrypt(JSON.stringify(merged));
    const now = nowIso();
    const endpointUrl = merged.baseUrl || (env === 'sandbox' ? PLATFORM_SCHEMAS[platform].sandboxBaseUrl : PLATFORM_SCHEMAS[platform].defaultBaseUrl);

    if (existingRow) {
      q(`UPDATE marketplace_connections
         SET enabled = ?, environment = ?, creds_enc = ?, endpoint_url = ?, status = 'configured', last_error = '', updated_at = ?
         WHERE user_id = ? AND platform = ?`)
        .run(enabled ? 1 : 0, env, enc, endpointUrl, now, userId, platform);
    } else {
      q(`INSERT INTO marketplace_connections
         (user_id, platform, enabled, environment, creds_enc, endpoint_url, status, last_error, stats_json, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, 'configured', '', '{}', ?, ?)`)
        .run(userId, platform, enabled ? 1 : 0, env, enc, endpointUrl, now, now);
    }
    return formatRow(platform, getRow(userId, platform));
  }

  function deleteConnection(userId, platform) {
    if (!PLATFORM_KEYS.includes(platform)) throw bad('منصة غير مدعومة');
    q('DELETE FROM marketplace_connections WHERE user_id = ? AND platform = ?').run(userId, platform);
    return formatRow(platform, null);
  }

  async function testConnection(userId, platform) {
    const row = getRow(userId, platform);
    if (!row || !row.creds_enc) {
      throw bad(`أضف بيانات API الخاصة بمنصة ${MARKETS[platform]?.name || platform} أولًا قبل اختبار الاتصال.`);
    }
    const creds = decryptRowCreds(row);
    const adapter = ADAPTERS[platform];
    const now = nowIso();
    try {
      const res = await adapter.test(creds, row.environment || 'production', cfg.fetch);
      q(`UPDATE marketplace_connections
         SET status = 'connected', last_tested_at = ?, last_error = '', updated_at = ?
         WHERE user_id = ? AND platform = ?`)
        .run(now, now, userId, platform);
      return { ok: true, message: res.message, meta: res.meta || {}, connection: formatRow(platform, getRow(userId, platform)) };
    } catch (err) {
      const errMsg = String(err?.message || 'فشل الاتصال بالمنصة').slice(0, 300);
      q(`UPDATE marketplace_connections
         SET status = 'error', last_tested_at = ?, last_error = ?, updated_at = ?
         WHERE user_id = ? AND platform = ?`)
        .run(now, errMsg, now, userId, platform);
      return { ok: false, message: errMsg, connection: formatRow(platform, getRow(userId, platform)) };
    }
  }

  /**
   * سحب المنتجات والطلبات الحقيقية من المنصة وتخزينها في قاعدة البيانات بدون تكرار (Idempotent)
   */
  async function syncPlatform(userId, platform) {
    const row = getRow(userId, platform);
    if (!row || !row.creds_enc) {
      return { live: false, platform, skipped: true, reason: 'لم يتم إدخال مفتاح API بعد' };
    }
    const creds = decryptRowCreds(row);
    const adapter = ADAPTERS[platform];
    const now = nowIso();
    try {
      const pulled = await adapter.sync(creds, row.environment || 'production', cfg.fetch);
      const summary = tx(() => {
        let importedProducts = 0;
        let updatedProducts = 0;
        let importedOrders = 0;
        let skippedOrders = 0;

        for (const p of pulled.products || []) {
          const sku = String(p.sku || '').slice(0, 40);
          if (!sku) continue;
          const existing = q('SELECT id, markets FROM products WHERE user_id = ? AND sku = ?').get(userId, sku);
          if (existing) {
            const mSet = new Set(String(existing.markets || '').split('').filter(Boolean));
            mSet.add(platform);
            q('UPDATE products SET name = ?, price = ?, stock = ?, markets = ?, updated_at = ? WHERE id = ?')
              .run(String(p.name || sku).slice(0, 120), Math.max(1, Number(p.price) || 100), Math.max(0, Math.round(Number(p.stock) || 0)), [...mSet].join(''), now, existing.id);
            updatedProducts++;
          } else {
            const price = Math.max(1, Number(p.price) || 100);
            const cost = Math.round(price * 0.65);
            q(`INSERT INTO products (user_id, name, sku, cat, markets, price, cost, stock, approval_status, created_at, updated_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'approved', ?, ?)`)
              .run(userId, String(p.name || sku).slice(0, 120), sku, String(p.cat || 'عام').slice(0, 40), platform, price, cost, Math.max(0, Math.round(Number(p.stock) || 0)), now, now);
            importedProducts++;
          }
        }

        const userRow = q('SELECT order_seq FROM users WHERE id = ?').get(userId);
        let nextSeq = Number(userRow?.order_seq || 1000);
        for (const o of pulled.orders || []) {
          const extRef = String(o.externalRef || '').slice(0, 80);
          if (!extRef) continue;
          const exists = q('SELECT id FROM orders WHERE user_id = ? AND market = ? AND external_ref = ?').get(userId, platform, extRef);
          if (exists) {
            skippedOrders++;
            continue;
          }
          nextSeq += 1;
          const total = Math.max(1, Number(o.total) || 1);
          const costTotal = Math.round(total * 0.65);
          q(`INSERT INTO orders (user_id, no, market, customer, phone, gov, address, pay, courier, total, cost_total, ship_fee, status, items, approval_status, external_ref, created_at)
             VALUES (?, ?, ?, ?, '', ?, ?, ?, 'بوسطة', ?, ?, 38, ?, ?, 'approved', ?, ?)`)
            .run(
              userId, nextSeq, platform,
              String(o.customer || 'عميل المنصة').slice(0, 80),
              String(o.gov || 'القاهرة').slice(0, 40),
              String(o.address || '').slice(0, 200),
              String(o.pay || 'عند الاستلام'),
              total, costTotal,
              Number(o.status || 0),
              String(o.items || `طلب ${MARKETS[platform]?.name || platform}`).slice(0, 240),
              extRef,
              String(o.createdAt || now)
            );
          importedOrders++;
        }
        q('UPDATE users SET order_seq = ?, last_sync_at = ? WHERE id = ?').run(nextSeq, now, userId);

        const stats = { importedProducts, updatedProducts, importedOrders, skippedOrders, lastRunAt: now };
        q(`UPDATE marketplace_connections
           SET status = 'connected', last_sync_at = ?, last_tested_at = COALESCE(last_tested_at, ?), last_error = '', stats_json = ?, updated_at = ?
           WHERE user_id = ? AND platform = ?`)
          .run(now, now, JSON.stringify(stats), now, userId, platform);

        return stats;
      });

      return {
        live: true,
        ok: true,
        platform,
        name: MARKETS[platform]?.name || platform,
        ...summary,
        connection: formatRow(platform, getRow(userId, platform))
      };
    } catch (err) {
      const errMsg = String(err?.message || 'فشلت مزامنة البيانات مع المنصة').slice(0, 300);
      q(`UPDATE marketplace_connections
         SET status = 'error', last_error = ?, updated_at = ?
         WHERE user_id = ? AND platform = ?`)
        .run(errMsg, now, userId, platform);
      return {
        live: true,
        ok: false,
        platform,
        name: MARKETS[platform]?.name || platform,
        error: errMsg,
        connection: formatRow(platform, getRow(userId, platform))
      };
    }
  }

  return {
    PLATFORM_KEYS,
    PLATFORM_SCHEMAS,
    listForUser,
    saveConnection,
    deleteConnection,
    testConnection,
    syncPlatform
  };
}

module.exports = {
  PLATFORM_KEYS,
  PLATFORM_SCHEMAS,
  assertSafeExternalUrl,
  maskSecret,
  maskCredentials,
  validateAndMergeCredentials,
  createConnectors
};
