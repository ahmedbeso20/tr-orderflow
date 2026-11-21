'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const ui = require('../public/js/ui-kit.js');

test('OrderFlowUI exposes crisp SVG icons for all core navigation and UI actions', () => {
  const required = [
    'dash', 'prod', 'ord', 'returns', 'customers', 'cod', 'pay',
    'notifications', 'ai', 'calc', 'int', 'help', 'set',
    'shield', 'store', 'checkCircle', 'ticket', 'scroll',
    'sunMoon', 'sync', 'plus', 'zap', 'lock', 'trendUp', 'truck',
    'wallet', 'smartphone', 'globe', 'search', 'download', 'copy', 'check', 'x'
  ];
  for (const name of required) {
    const svg = ui.svgIcon(name, 18);
    assert.ok(svg.startsWith('<svg '), `missing svg wrapper for ${name}`);
    assert.ok(svg.includes('width="18"'), `missing size for ${name}`);
    assert.ok(ui.ICONS[name], `missing icon definition for ${name}`);
  }
});

test('computeProfitBreakdown calculates Egyptian marketplace VAT, RTO, net profit, and break-even accurately', () => {
  const res = ui.computeProfitBreakdown([12, 650, 360, 40, 6]);
  // platformFee = 78, vatOnFee = 10.92, rtoLoss = 0.06 * 72 = 4.32
  // totalDeductions = 78 + 10.92 + 360 + 40 + 4.32 = 493.24
  // netProfit = 650 - 493.24 = 156.76
  assert.ok(Math.abs(res.platformFee - 78) < 0.01);
  assert.ok(Math.abs(res.vatOnFee - 10.92) < 0.01);
  assert.ok(Math.abs(res.rtoLoss - 4.32) < 0.01);
  assert.ok(Math.abs(res.netProfit - 156.76) < 0.01);
  assert.ok(res.margin > 24 && res.margin < 25);
  assert.ok(res.breakEven > 460 && res.breakEven < 475);
  assert.ok(res.segments.profit > 20);
});

test('computeProfitBreakdown handles zero price without NaN or Infinity', () => {
  const res = ui.computeProfitBreakdown([12, 0, 100, 30, 5]);
  assert.equal(res.margin, 0);
  assert.equal(res.segments.profit, 0);
  assert.ok(Number.isFinite(res.breakEven));
});

test('computePlanQuote computes monthly/yearly totals, discounts, and 14% VAT correctly', () => {
  const plans = [
    { id: 'free', name: 'Free', price: 0 },
    { id: 'pro', name: 'Pro', price: 1000 },
    { id: 'business', name: 'Business', price: 3000 }
  ];
  const coupons = {
    WELCOME20: { code: 'WELCOME20', type: 'pct', value: 20, desc: '20% off' },
    OMNI50: { code: 'OMNI50', type: 'fixed', value: 50, desc: '50 EGP off' }
  };

  const q1 = ui.computePlanQuote(plans, coupons, 'pro', 'monthly', 'WELCOME20');
  assert.equal(q1.basePrice, 1000);
  assert.equal(q1.discount, 200);
  assert.equal(q1.total, 800);
  assert.ok(Math.abs(q1.preTax + q1.vat - 800) < 0.02);

  const q2 = ui.computePlanQuote(plans, coupons, 'pro', 'yearly', 'OMNI50');
  assert.equal(q2.basePrice, 10000);
  assert.equal(q2.discount, 50);
  assert.equal(q2.total, 9950);
});

test('OrderFlowUI includes Connecto Growth Suite icons (moon, camera, book, briefcase, send, award, layers)', () => {
  for (const name of ['moon', 'camera', 'book', 'briefcase', 'send', 'award', 'layers']) {
    const svg = ui.svgIcon(name, 16);
    assert.ok(svg.startsWith('<svg '), `missing svg wrapper for ${name}`);
    assert.ok(ui.ICONS[name], `missing icon definition for ${name}`);
  }
});

test('renderBentoVisual returns clean HTML micro-visuals for marquee bento slots', () => {
  for (let i = 0; i < 4; i++) {
    const html = ui.renderBentoVisual(i);
    assert.ok(html.includes('bento-viz'), `expected bento visual for slot ${i}`);
  }
});

test('OrderFlowGrowth exposes partner certifications, 3-tab solutions, expert services, guides, and onboarding calculator', () => {
  const growth = require('../public/js/growth-suite.js');
  assert.equal(growth.PARTNER_CERTIFICATIONS.length, 5);
  assert.ok(growth.PARTNER_CERTIFICATIONS.some((p) => p.code.includes('SPN')));
  assert.ok(growth.PARTNER_CERTIFICATIONS.some((p) => p.code.includes('FBPI')));
  assert.ok(growth.PARTNER_CERTIFICATIONS.some((p) => p.code.includes('Trendyol')));
  assert.ok(growth.PARTNER_CERTIFICATIONS.some((p) => p.code.includes('Kenzz')));
  const fs = require('node:fs');
  const path = require('node:path');
  for (const p of growth.PARTNER_CERTIFICATIONS) {
    const fullHtml = growth.renderPlatformLogo(p.key, 'full');
    const iconHtml = growth.renderPlatformLogo(p.key, 'icon');
    assert.ok(fullHtml.startsWith('<img ') && fullHtml.includes('/assets/logos/'), `expected official brand logo img for ${p.key}`);
    assert.ok(iconHtml.startsWith('<img ') && iconHtml.includes('/assets/logos/'), `expected official brand icon img for ${p.key}`);
    assert.ok(fs.existsSync(path.join(__dirname, '..', 'public', p.logoSrc)), `missing logo file on disk: ${p.logoSrc}`);
    assert.ok(fs.existsSync(path.join(__dirname, '..', 'public', p.iconSrc)), `missing icon file on disk: ${p.iconSrc}`);
  }

  assert.equal(growth.SOLUTIONS_TABS.length, 3);
  const opsTab = growth.SOLUTIONS_TABS.find((t) => t.id === 'ops');
  const expertsTab = growth.SOLUTIONS_TABS.find((t) => t.id === 'experts');
  assert.equal(opsTab.items.length, 4);
  assert.equal(expertsTab.items.length, 4);
  const removedNames = new Set(['تحصيلات COD', 'فواتير إلكترونية ETA', 'إدارة الإعلانات PPC', 'تدريب فريقك']);
  for (const tab of growth.SOLUTIONS_TABS) {
    for (const item of tab.items) {
      assert.ok(!removedNames.has(item.name), `unexpected removed card in SOLUTIONS_TABS: ${item.name}`);
    }
  }
  assert.ok(growth.EXPERT_SERVICES_UI.length >= 6);
  assert.ok(growth.SELLER_GUIDES.length >= 4);

  const partial = growth.computeOnboardingProgress(
    { integrations: { a: 0, n: 0, j: 0, t: 0, k: 0 }, instaPayHandle: '' },
    [],
    {}
  );
  assert.equal(partial.totalCount, 4);
  assert.equal(partial.completedCount, 0);
  assert.equal(partial.percent, 0);
  assert.equal(partial.isComplete, false);

  const full = growth.computeOnboardingProgress(
    { integrations: { a: 1, n: 1, t: 1 }, instaPayHandle: 'store@instapay' },
    [{ id: 1, name: 'شاحن' }],
    { listing: { amz: 'ok' } }
  );
  assert.equal(full.completedCount, 4);
  assert.equal(full.percent, 100);
  assert.equal(full.isComplete, true);
});

test('AI helpers return structured A+ highlights, deterministic price radar benchmark, and seller chat guidance', () => {
  const ai = require('../src/ai.js');
  const listing = ai.templateListing('شاحن سريع 65W', 'شحن سريع، منفذين Type-C', 'احترافية');
  assert.ok(Array.isArray(listing.aplusHighlights) && listing.aplusHighlights.length === 3);

  const radar = ai.priceRadarBenchmark('سماعة بلوتوث أنكر R50i', [{ name: 'سماعة بلوتوث أنكر R50i', price: 750 }]);
  assert.ok(radar.minPrice < radar.avgPrice && radar.avgPrice < radar.maxPrice);
  assert.equal(radar.platforms.length, 4);
  assert.ok(radar.recommended > 0);

  const reply = ai.rulesSellerAssistant('كيف أقلل مرتجعات الدفع عند الاستلام RTO؟', { storeName: 'متجر النور', productCount: 12, lowStockCount: 2, codReady: 4000 });
  assert.ok(reply.includes('RTO') || reply.includes('مرتجعات'));
});

test('Backend API: consultations, managed service requests, AI price radar, AI seller chat, and Trendyol/Kenzz toggles persist cleanly', async (t) => {
  const { createApp } = require('../src/app');
  const app = createApp({ dbFile: ':memory:', secret: 'x'.repeat(48), trustProxy: true, geminiKey: '' });
  await new Promise((r) => app.server.listen(0, '127.0.0.1', r));
  t.after(() => app.close());
  const base = `http://127.0.0.1:${app.server.address().port}`;
  let cookie = '';

  const call = async (method, path, body) => {
    const headers = { 'x-forwarded-for': '10.10.1.9', 'x-requested-with': 'omniarab' };
    if (cookie) headers.cookie = cookie;
    if (body !== undefined) headers['content-type'] = 'application/json';
    const res = await fetch(base + path, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
    const sc = res.headers.get('set-cookie');
    if (sc) cookie = sc.split(';')[0];
    return { status: res.status, data: await res.json() };
  };

  // 1. Public free consultation booking (no auth required)
  const conRes = await call('POST', '/api/consultations', {
    name: 'كريم عبدالله',
    phone: '01099887766',
    storeName: 'متجر كريم تك',
    serviceKey: 'growth_consult',
    platforms: 'أمازون · نون · ترينديول',
    monthlyOrders: '١٠٠ – ٥٠٠ طلب'
  });
  assert.equal(conRes.status, 200);
  assert.ok(conRes.data.request.ref_code.startsWith('OF-CON-'));

  // 2. Demo login -> authenticated routes
  const demo = await call('POST', '/api/auth/demo', {});
  assert.equal(demo.status, 200);

  // 3. Managed service request creation & listing
  const srvPost = await call('POST', '/api/services/requests', {
    serviceKey: 'aplus_content',
    phone: '01099887766',
    platforms: 'أمازون مصر · نون',
    monthlyOrders: '٥٠ – ٣٠٠ طلب شهريًا',
    notes: 'تطوير ١٥ صفحة منتج A+'
  });
  assert.equal(srvPost.status, 200);
  assert.ok(srvPost.data.request.ref_code.startsWith('OF-SRV-'));

  const srvList = await call('GET', '/api/services/requests');
  assert.equal(srvList.status, 200);
  assert.ok(srvList.data.requests.some((r) => r.ref_code === srvPost.data.request.ref_code));

  // 4. Price Radar returns instant EGP benchmark even without GEMINI_API_KEY
  const radarRes = await call('POST', '/api/ai/price-radar', { name: 'ساعة ذكية مقاومة للماء' });
  assert.equal(radarRes.status, 200);
  assert.ok(radarRes.data.market.recommended > 0);
  assert.equal(radarRes.data.market.platforms.length, 4);

  // 5. Seller AI Chat answers with store context
  const chatRes = await call('POST', '/api/ai/chat', { question: 'كيف أزيد أرباحي على أمازون FBA؟' });
  assert.equal(chatRes.status, 200);
  assert.ok(chatRes.data.answer.length > 30);

  // 6. Toggle Trendyol ('t') and Kenzz ('k') integrations cleanly
  const togT = await call('PUT', '/api/settings/integrations', { key: 't', on: true });
  assert.equal(togT.status, 200);
  assert.ok(Boolean(togT.data.integrations.t));

  const togK = await call('PUT', '/api/settings/integrations', { key: 'k', on: true });
  assert.equal(togK.status, 200);
  assert.ok(Boolean(togK.data.integrations.k));
});

