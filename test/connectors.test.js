'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { createApp } = require('../src/app');
const {
  assertSafeExternalUrl,
  maskCredentials,
  validateAndMergeCredentials
} = require('../src/connectors');

class Client {
  constructor(base, ip = '10.99.1.1') {
    this.base = base;
    this.ip = ip;
    this.cookie = '';
  }
  async call(method, path, body) {
    const headers = { 'x-forwarded-for': this.ip, 'x-requested-with': 'omniarab' };
    if (this.cookie) headers.cookie = this.cookie;
    if (body !== undefined) headers['content-type'] = 'application/json';
    const res = await fetch(this.base + path, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
    const sc = res.headers.get('set-cookie');
    if (sc) this.cookie = sc.split(';')[0];
    return { status: res.status, data: await res.json() };
  }
  get(p) { return this.call('GET', p); }
  post(p, b) { return this.call('POST', p, b); }
  put(p, b) { return this.call('PUT', p, b); }
  del(p, b) { return this.call('DELETE', p, b); }
}

test('SSRF protection rejects non-HTTPS, localhost, private IPs, and cloud metadata endpoints', () => {
  assert.equal(assertSafeExternalUrl('https://apigw.trendyol.com/'), 'https://apigw.trendyol.com');
  assert.equal(assertSafeExternalUrl('https://partners-api.kenzz.com/v1'), 'https://partners-api.kenzz.com/v1');

  for (const badUrl of [
    'http://apigw.trendyol.com',
    'https://localhost/api',
    'https://127.0.0.1/api',
    'https://169.254.169.254/latest/meta-data',
    'https://10.0.0.5/internal',
    'https://192.168.1.10/admin',
    'https://172.16.0.1/secret',
    'https://[::1]/local',
    'https://service.internal/api',
    'https://user:pass@apigw.trendyol.com'
  ]) {
    assert.throws(() => assertSafeExternalUrl(badUrl), /https|محلية|خاصة|مصادقة/, `should reject ${badUrl}`);
  }
});

test('maskCredentials hides secrets and validateAndMergeCredentials preserves untouched secrets on update', () => {
  const first = validateAndMergeCredentials('t', {
    supplierId: '778899',
    apiKey: 'ty_key_supersecret1234',
    apiSecret: 'ty_sec_abcdef9876'
  });
  assert.equal(first.supplierId, '778899');
  assert.equal(first.apiKey, 'ty_key_supersecret1234');

  const masked = maskCredentials('t', first);
  assert.equal(masked.supplierId, '778899');
  assert.equal(masked.apiKey.configured, true);
  assert.equal(masked.apiKey.masked, '••••1234');
  assert.equal(masked.apiSecret.masked, '••••9876');
  assert.ok(!JSON.stringify(masked).includes('supersecret'));

  // Updating supplierId while leaving secret fields blank preserves existing secrets
  const updated = validateAndMergeCredentials('t', {
    supplierId: '991122',
    apiKey: '',
    apiSecret: ''
  }, first);
  assert.equal(updated.supplierId, '991122');
  assert.equal(updated.apiKey, 'ty_key_supersecret1234');
  assert.equal(updated.apiSecret, 'ty_sec_abcdef9876');
});

test('End-to-end encrypted API connectors: save, encrypt at rest, mask, test, and idempotent live sync for all 5 platforms', async (t) => {
  const calls = [];
  const fetchStub = async (url, init = {}) => {
    calls.push({ url, method: init.method || 'GET', headers: init.headers || {} });

    // Amazon LWA + SP-API
    if (url.includes('api.amazon.com/auth/o2/token')) {
      return { ok: true, status: 200, text: async () => JSON.stringify({ access_token: 'amz_live_tok_01' }) };
    }
    if (url.includes('/sellers/v1/marketplaceParticipations')) {
      assert.equal(init.headers['x-amz-access-token'], 'amz_live_tok_01');
      return { ok: true, status: 200, text: async () => JSON.stringify({ payload: [{ marketplace: { id: 'ARBP9OOSHTCHU' } }] }) };
    }
    if (url.includes('/orders/v0/orders')) {
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify({
          payload: {
            Orders: [{
              AmazonOrderId: '408-1111111-2222222',
              BuyerInfo: { BuyerName: 'أحمد من أمازون' },
              ShippingAddress: { City: 'القاهرة', AddressLine1: 'مدينة نصر' },
              OrderTotal: { Amount: '890.00' },
              PaymentMethod: 'COD',
              OrderStatus: 'Unshipped'
            }]
          }
        })
      };
    }
    if (url.includes('/fba/inventory/v1/summaries')) {
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify({
          payload: {
            inventorySummaries: [{ sellerSku: 'AMZ-SKU-01', productName: 'سماعة أمازون الأصلية', totalQuantity: 14 }]
          }
        })
      };
    }

    // Trendyol Supplier API
    if (url.includes('apigw.trendyol.com/integration/product/sellers/554433/products')) {
      assert.ok(String(init.headers.authorization || '').startsWith('Basic '));
      assert.equal(init.headers['user-agent'], '554433 - SelfIntegration');
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify({
          totalElements: 1,
          content: [{ stockCode: 'TY-SKU-01', title: 'حذاء رياضي ترينديول', salePrice: 1250, quantity: 9, categoryName: 'أزياء' }]
        })
      };
    }
    if (url.includes('apigw.trendyol.com/integration/order/sellers/554433/orders')) {
      return {
        ok: true,
        status: 200,
        text: async () => JSON.stringify({
          content: [{
            orderNumber: 'TY-ORD-9001',
            customerFirstName: 'سارة',
            customerLastName: 'محمود',
            shipmentAddress: { city: 'الإسكندرية', fullAddress: 'سموحة' },
            totalPrice: 1250,
            status: 'Created',
            lines: [{ productName: 'حذاء رياضي ترينديول', quantity: 1 }]
          }]
        })
      };
    }

    // Noon Partners API
    if (url.includes('/identity/public/v1/api/login')) {
      assert.equal(init.headers['x-project-code'], 'PRJ_EG_9');
      return { ok: true, status: 200, text: async () => JSON.stringify({ token: 'noon_sess_tok' }) };
    }
    // Jumia Vendor Center API
    if (url.includes('vendor-api.jumia.com/token')) {
      return { ok: true, status: 200, text: async () => JSON.stringify({ access_token: 'jumia_tok_1' }) };
    }
    if (url.includes('vendor-api.jumia.com/shops')) {
      return { ok: true, status: 200, text: async () => JSON.stringify({ shops: [{ id: 'SHOP-EG-1' }] }) };
    }
    // Kenzz Partner API
    if (url.includes('partners-api.kenzz.com/v1/merchant/profile')) {
      assert.equal(init.headers['x-store-id'], 'KNZ-99');
      return { ok: true, status: 200, text: async () => JSON.stringify({ name: 'متجر كنز المعتمد' }) };
    }

    return { ok: false, status: 404, text: async () => JSON.stringify({ message: `Unmocked ${url}` }) };
  };

  const app = createApp({
    dbFile: ':memory:',
    secret: 's'.repeat(48),
    trustProxy: true,
    fetch: fetchStub
  });
  await new Promise((r) => app.server.listen(0, '127.0.0.1', r));
  t.after(() => app.close());

  const base = `http://127.0.0.1:${app.server.address().port}`;
  const c = new Client(base);

  // Register merchant + upgrade to pro directly in DB so all 5 marketplaces can be connected
  const reg = await c.post('/api/auth/register', {
    store: 'متجر النخبة',
    phone: '01022334455',
    email: 'merchant@elite.eg',
    password: 'NileFlow!9482'
  });
  assert.equal(reg.status, 200);
  const uRow = app.app.q("SELECT id FROM users WHERE phone = '01022334455'").get();
  app.app.q("UPDATE users SET status = 'active', plan = 'pro' WHERE id = ?").run(uRow.id);

  const login = await c.post('/api/auth/login', { email: 'merchant@elite.eg', password: 'NileFlow!9482' });
  assert.equal(login.status, 200);

  // 1. Save & Test Amazon SP-API
  const amzSave = await c.put('/api/integrations/connections/a', {
    credentials: {
      sellerId: 'A2EGYPTSELLER',
      marketplaceId: 'ARBP9OOSHTCHU',
      clientId: 'amzn1.client.demo',
      clientSecret: 'amz_super_secret_key_8899',
      refreshToken: 'Atzr|refresh_secret_7766'
    },
    environment: 'production',
    testNow: true
  });
  assert.equal(amzSave.status, 200);
  assert.equal(amzSave.data.testResult.ok, true);
  assert.equal(amzSave.data.connection.status, 'connected');
  // Secrets must NEVER leak in API response
  assert.ok(!JSON.stringify(amzSave.data).includes('amz_super_secret_key_8899'));
  assert.ok(!JSON.stringify(amzSave.data).includes('Atzr|refresh_secret_7766'));

  // Verify ciphertext at rest in SQLite does NOT contain plaintext secret
  const dbRow = app.app.q("SELECT creds_enc FROM marketplace_connections WHERE user_id = ? AND platform = 'a'").get(uRow.id);
  assert.ok(dbRow.creds_enc.startsWith('enc:v1:'));
  assert.ok(!dbRow.creds_enc.includes('amz_super_secret_key_8899'));

  // 2. Save & Test Trendyol, Noon, Jumia, Kenzz
  const tySave = await c.put('/api/integrations/connections/t', {
    credentials: { supplierId: '554433', apiKey: 'ty_live_key_1122', apiSecret: 'ty_live_sec_3344' },
    testNow: true
  });
  assert.equal(tySave.status, 200);
  assert.equal(tySave.data.testResult.ok, true);

  const noonSave = await c.put('/api/integrations/connections/n', {
    credentials: { projectCode: 'PRJ_EG_9', keyId: 'noon_k_1', privateKey: 'noon_hmac_secret_5566' },
    testNow: true
  });
  assert.equal(noonSave.status, 200);
  assert.equal(noonSave.data.testResult.ok, true);

  const jumiaSave = await c.put('/api/integrations/connections/j', {
    credentials: { shopId: 'SHOP-EG-1', clientId: 'jumia-app-1', apiKey: 'jumia_refresh_7788' },
    testNow: true
  });
  assert.equal(jumiaSave.status, 200);
  assert.equal(jumiaSave.data.testResult.ok, true);

  const kenzzSave = await c.put('/api/integrations/connections/k', {
    credentials: { storeId: 'KNZ-99', apiKey: 'knz_live_secret_9900' },
    testNow: true
  });
  assert.equal(kenzzSave.status, 200);
  assert.equal(kenzzSave.data.testResult.ok, true);

  // 3. Live Sync on Trendyol & Amazon + verify Idempotency (no duplicate products or orders on 2nd sync)
  const tySync1 = await c.post('/api/integrations/connections/t/sync');
  assert.equal(tySync1.status, 200);
  assert.equal(tySync1.data.importedProducts, 1);
  assert.equal(tySync1.data.importedOrders, 1);

  const tySync2 = await c.post('/api/integrations/connections/t/sync');
  assert.equal(tySync2.status, 200);
  assert.equal(tySync2.data.importedProducts, 0);
  assert.equal(tySync2.data.updatedProducts, 1);
  assert.equal(tySync2.data.importedOrders, 0);
  assert.equal(tySync2.data.skippedOrders, 1);

  const amzSync = await c.post('/api/integrations/connections/a/sync');
  assert.equal(amzSync.status, 200);
  assert.equal(amzSync.data.importedProducts, 1);
  assert.equal(amzSync.data.importedOrders, 1);

  // Verify orders & products are visible in merchant's dashboard/API
  const prods = await c.get('/api/products');
  assert.equal(prods.status, 200);
  assert.ok(prods.data.products.some((p) => p.sku === 'TY-SKU-01'));
  assert.ok(prods.data.products.some((p) => p.sku === 'AMZ-SKU-01'));

  const orders = await c.get('/api/orders');
  assert.equal(orders.status, 200);
  const orderList = orders.data.items || orders.data.orders || [];
  assert.ok(orderList.some((o) => o.market === 't' && o.customer === 'سارة محمود'));
  assert.ok(orderList.some((o) => o.market === 'a' && o.customer === 'أحمد من أمازون'));

  // 4. Delete connection removes encrypted row and disables integration
  const delRes = await c.del('/api/integrations/connections/k');
  assert.equal(delRes.status, 200);
  assert.equal(delRes.data.integrations.k, 0);
  const kConn = delRes.data.connections.find((x) => x.platform === 'k');
  assert.equal(kConn.configured, false);
  assert.equal(kConn.status, 'disconnected');
});
