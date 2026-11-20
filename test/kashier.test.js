'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { createApp } = require('../src/app');
const {
  buildKashierOrderHash,
  verifyKashierWebhookSignature,
  buildKashierCheckoutUrl
} = require('../src/payments/providers/kashier');

test('Kashier pure helpers: HMAC-SHA256 orderHash, checkout URL, and webhook signature verification', () => {
  const merchantId = 'MID-9988-112';
  const apiKey = 'kashier-test-secret-key-987654';
  const orderId = 'OF-PAY-2026-ABCD1234';
  const amount = '1000.00';
  const currency = 'EGP';

  const hash = buildKashierOrderHash({ merchantId, orderId, amount, currency, apiKey });
  const expected = crypto.createHmac('sha256', apiKey).update(`/?payment=${merchantId}.${orderId}.${amount}.${currency}`).digest('hex');
  assert.equal(hash, expected);

  const url = buildKashierCheckoutUrl({
    merchantId,
    apiKey,
    orderId,
    amount: 1000,
    currency: 'EGP',
    mode: 'test',
    allowedMethods: 'wallet',
    merchantRedirect: 'https://example.com/?pay_ref=OF-PAY-2026-ABCD1234#/pay',
    serverWebhook: 'https://example.com/api/billing/webhook/kashier'
  });
  const parsed = new URL(url);
  assert.equal(parsed.origin, 'https://checkout.kashier.io');
  assert.equal(parsed.searchParams.get('merchantId'), merchantId);
  assert.equal(parsed.searchParams.get('orderId'), orderId);
  assert.equal(parsed.searchParams.get('amount'), '1000.00');
  assert.equal(parsed.searchParams.get('allowedMethods'), 'wallet');
  assert.equal(parsed.searchParams.get('hash'), expected);

  const payload = {
    event: 'pay',
    data: {
      merchantOrderId: orderId,
      kashierOrderId: 'KSH-555001',
      transactionId: 'TX-9910',
      amount: '1000.00',
      currency: 'EGP',
      status: 'SUCCESS',
      signatureKeys: ['status', 'merchantOrderId', 'amount', 'currency']
    }
  };
  const qs = ['amount', 'currency', 'merchantOrderId', 'status']
    .map((k) => `${k}=${payload.data[k]}`)
    .join('&');
  const sig = crypto.createHmac('sha256', apiKey).update(qs).digest('hex');

  assert.equal(verifyKashierWebhookSignature({ payload, signature: sig, apiKey }), true);
  assert.equal(verifyKashierWebhookSignature({ payload, signature: 'bad-signature', apiKey }), false);
});

test('Kashier end-to-end checkout redirect + signed webhook plan activation', async (t) => {
  const apiKey = 'kashier-live-secret-key-2026';
  const app = createApp({
    dbFile: ':memory:',
    secret: 'a'.repeat(40),
    paymentProvider: 'kashier',
    kashierMerchantId: 'MID-4455-777',
    kashierApiKey: apiKey,
    kashierMode: 'test',
    kashierAllowedMethods: 'wallet',
    paymentWalletNumber: '01099887766'
  });
  await new Promise((res) => app.server.listen(0, '127.0.0.1', res));
  t.after(() => app.close());

  const port = app.server.address().port;
  const base = `http://127.0.0.1:${port}`;
  const H = { 'Content-Type': 'application/json', 'X-Requested-With': 'omniarab' };

  // Public billing config exposes readiness & wallet number without secrets
  const cfgRes = await fetch(`${base}/api/billing/config`).then((r) => r.json());
  assert.equal(cfgRes.provider, 'kashier');
  assert.equal(cfgRes.collectsCardData, false);
  assert.equal(cfgRes.externalGatewayReady, true);
  assert.equal(cfgRes.walletNumber, '01099887766');
  assert.equal(JSON.stringify(cfgRes).includes(apiKey), false);

  // Register & activate a real merchant
  const reg = await fetch(`${base}/api/auth/register`, {
    method: 'POST',
    headers: H,
    body: JSON.stringify({ store: 'متجر كاشير', phone: '01077112233', email: 'kashier@test.eg', password: 'NileFlow!9482' })
  }).then((r) => r.json());
  app.app.q("UPDATE users SET status = 'active' WHERE email = ?").run('kashier@test.eg');
  const login = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: H,
    body: JSON.stringify({ email: 'kashier@test.eg', password: 'NileFlow!9482' })
  }).then((r) => r.json());
  const auth = { ...H, Authorization: `Bearer ${login.token}` };

  // Start Kashier checkout -> returns pending + signed Kashier redirect URL
  const ck = await fetch(`${base}/api/billing/checkout`, {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({ plan: 'pro', cycle: 'monthly', method: 'kashier' })
  }).then((r) => r.json());
  assert.equal(ck.ok, true);
  assert.equal(ck.status, 'pending');
  assert.ok(ck.redirectUrl.startsWith('https://checkout.kashier.io/?'));
  assert.ok(ck.redirectUrl.includes('allowedMethods=wallet'));

  // Send signed Kashier webhook -> activates pro plan
  const whPayload = {
    event: 'pay',
    data: {
      merchantOrderId: ck.payment.txRef,
      kashierOrderId: 'KSH-ORD-991',
      transactionId: 'KSH-TX-991',
      amount: '1000.00',
      currency: 'EGP',
      status: 'SUCCESS',
      signatureKeys: ['amount', 'currency', 'merchantOrderId', 'status']
    }
  };
  const qs = ['amount', 'currency', 'merchantOrderId', 'status'].map((k) => `${k}=${whPayload.data[k]}`).join('&');
  const sig = crypto.createHmac('sha256', apiKey).update(qs).digest('hex');

  const whRes = await fetch(`${base}/api/billing/webhook/kashier`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-kashier-signature': sig },
    body: JSON.stringify(whPayload)
  }).then((r) => r.json());
  assert.equal(whRes.ok, true);
  assert.equal(whRes.status, 'paid');

  // Verify merchant plan upgraded to pro
  const st = await fetch(`${base}/api/billing/status/${encodeURIComponent(ck.payment.txRef)}`, { headers: auth }).then((r) => r.json());
  assert.equal(st.status, 'paid');
  assert.equal(st.plan.id, 'pro');
});
