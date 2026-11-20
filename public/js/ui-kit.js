/* ==========================================================================
   OrderFlow UI Kit — Vector Iconography, Pure FinTech Calculators & Bento Visuals
   UMD-compatible so both the browser and Node unit tests (node:test) can import it.
   ========================================================================== */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
  }
  if (typeof window !== 'undefined') {
    root.OrderFlowUI = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const ICONS = {
    dash: '<rect x="3" y="3" width="7" height="9" rx="2"/><rect x="14" y="3" width="7" height="5" rx="2"/><rect x="14" y="12" width="7" height="9" rx="2"/><rect x="3" y="16" width="7" height="5" rx="2"/>',
    prod: '<path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',
    ord: '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M8 7h8"/><path d="M8 11h8"/><path d="M8 15h5"/>',
    returns: '<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11"/>',
    customers: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    cod: '<rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/>',
    pay: '<rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>',
    notifications: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    ai: '<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3Z"/><path d="M5 3v4"/><path d="M3 5h4"/><path d="M19 17v4"/><path d="M17 19h4"/>',
    calc: '<rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><line x1="16" x2="16" y1="14" y2="18"/><path d="M16 10h.01"/><path d="M12 10h.01"/><path d="M8 10h.01"/><path d="M12 14h.01"/><path d="M8 14h.01"/><path d="M12 18h.01"/><path d="M8 18h.01"/>',
    int: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    help: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
    set: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    store: '<path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/>',
    checkCircle: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
    ticket: '<path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/>',
    scroll: '<path d="M8 21h12a2 2 0 0 0 2-2v-2H10v2a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v3h4"/><path d="M19 17V5a2 2 0 0 0-2-2H4"/><path d="M15 8h-5"/><path d="M15 12h-5"/>',
    sunMoon: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
    moon: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
    sync: '<path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/>',
    plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
    zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
    lock: '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    trendUp: '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
    truck: '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>',
    wallet: '<path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>',
    smartphone: '<rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/>',
    globe: '<circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>',
    copy: '<rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>',
    check: '<polyline points="20 6 9 17 4 12"/>',
    x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
    menu: '<line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/>',
    arrowLeft: '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
    brain: '<path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/>',
    alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12" y1="17" y2="17.01"/>',
    edit: '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>',
    message: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
    key: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/>',
    trash: '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>',
    mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    qr: '<rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/><path d="M3 12h.01"/><path d="M12 3h.01"/><path d="M12 16v.01"/><path d="M16 12h1"/><path d="M21 12v.01"/><path d="M12 21v-1"/>',
    camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
    book: '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>',
    briefcase: '<rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
    send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
    award: '<circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>',
    layers: '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>'
  };

  function svgIcon(name, size = 18, cls = '') {
    const body = ICONS[name] || ICONS.prod;
    const clsAttr = cls ? ` class="of-ico ${cls}"` : ' class="of-ico"';
    return `<svg${clsAttr} width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.85" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
  }

  /**
   * Pure profit breakdown for Egyptian marketplaces (Amazon/Noon/Jumia)
   * Includes platform fee + 14% VAT on platform fee + shipping + RTO risk allowance.
   */
  function computeProfitBreakdown([commPct, price, cost, ship, rtoPct]) {
    const safePrice = Math.max(0, Number(price) || 0);
    const safeComm = Math.max(0, Number(commPct) || 0);
    const safeCost = Math.max(0, Number(cost) || 0);
    const safeShip = Math.max(0, Number(ship) || 0);
    const safeRto = Math.max(0, Number(rtoPct) || 0);

    const platformFee = (safePrice * safeComm) / 100;
    const vatOnFee = platformFee * 0.14;
    const rtoLoss = (safeRto / 100) * (safeShip * 1.8);
    const totalDeductions = platformFee + vatOnFee + safeCost + safeShip + rtoLoss;
    const netProfit = safePrice - totalDeductions;
    const margin = safePrice > 0 ? (netProfit / safePrice) * 100 : 0;
    const denom = Math.max(0.1, 1 - (safeComm * 1.14) / 100);
    const breakEven = (safeCost + safeShip + rtoLoss) / denom;
    const pctOf = (v) => (safePrice > 0 ? Math.max(0, Math.min(100, (v / safePrice) * 100)) : 0);

    return {
      price: safePrice,
      cost: safeCost,
      ship: safeShip,
      commPct: safeComm,
      rtoPct: safeRto,
      platformFee,
      vatOnFee,
      rtoLoss,
      totalDeductions,
      netProfit,
      margin,
      breakEven: Math.ceil(breakEven),
      segments: {
        cost: pctOf(safeCost),
        ship: pctOf(safeShip + rtoLoss),
        fees: pctOf(platformFee + vatOnFee),
        profit: pctOf(netProfit)
      }
    };
  }

  /**
   * Pure subscription invoice quote calculator (EGP, inclusive of 14% Egyptian VAT).
   */
  function computePlanQuote(plans, couponsMap, planId, cycle, couponCode) {
    const plan = plans.find((x) => x.id === planId) || plans[1] || plans[0];
    const isYearly = cycle === 'yearly';
    const basePrice = isYearly ? plan.price * 10 : plan.price;
    const c = couponCode && couponsMap[couponCode] ? couponsMap[couponCode] : null;
    let discount = 0;
    if (c && basePrice > 0) {
      if (c.type === 'pct' || c.pct) {
        const pct = c.type === 'pct' ? c.value : c.pct;
        discount = Math.round((basePrice * pct) / 100 * 100) / 100;
        if (c.maxDiscount) discount = Math.min(discount, c.maxDiscount);
      } else {
        discount = Math.min(basePrice, c.value || 0);
      }
    }
    const total = Math.max(0, Math.round((basePrice - discount) * 100) / 100);
    const preTax = Math.round((total / 1.14) * 100) / 100;
    const vat = Math.round((total - preTax) * 100) / 100;
    return { plan, isYearly, basePrice, discount, total, preTax, vat, coupon: c };
  }

  /**
   * Bespoke editorial micro-visuals for the Landing Page Asymmetric Bento Grid.
   */
  function renderBentoVisual(index) {
    if (index === 0) {
      return `
        <div class="bento-viz bento-sync-viz" aria-hidden="true">
          <div class="bento-node">
            <span class="bento-mk" style="background:#232f3e;color:#fff">أ</span>
            <div><b>أمازون مصر</b><small>−١ قطعة · فوري</small></div>
          </div>
          <span class="bento-flow-line"></span>
          <div class="bento-node is-hub">
            ${svgIcon('sync', 16)}
            <div><b>مخزون OrderFlow</b><small>متزامن خلال ٤ ثوانٍ</small></div>
          </div>
          <span class="bento-flow-line"></span>
          <div class="bento-node">
            <span class="bento-mk" style="background:#f5c400;color:#201400">ن</span>
            <span class="bento-mk" style="background:#f68b1e;color:#fff">ج</span>
            <div><b>نون + جوميا</b><small>تم التحديث</small></div>
          </div>
        </div>`;
    }
    if (index === 1) {
      return `
        <div class="bento-viz bento-profit-viz" aria-hidden="true">
          <div class="bento-profit-bar">
            <i style="width:52%;background:#64748b"></i>
            <i style="width:14%;background:#0B57A4"></i>
            <i style="width:11%;background:#0EA5C6"></i>
            <i style="width:23%;background:#059669"></i>
          </div>
          <div class="bento-profit-meta">
            <span>صافي الربح الفعلي</span>
            <b class="ok-tx">+١٥٨ ج.م · ٢٤.٣٪</b>
          </div>
        </div>`;
    }
    if (index === 2) {
      return `
        <div class="bento-viz bento-cod-viz" aria-hidden="true">
          <div class="bento-cod-row"><span>بوسطة Bosta</span><b>١٨٬٤٠٠ ج.م</b></div>
          <div class="bento-cod-row"><span>أرامكس · مايلرز</span><b>١٩٬٧٠٠ ج.م</b></div>
          <div class="bento-cod-foot">${svgIcon('zap', 14)}<span>جاهز للتحويل الفوري على InstaPay</span></div>
        </div>`;
    }
    if (index === 3) {
      return `
        <div class="bento-viz bento-eta-viz" aria-hidden="true">
          <div class="bento-qr-box">${svgIcon('qr', 28)}</div>
          <div class="bento-eta-copy">
            <b>فاتورة ضريبية إلكترونية ETA</b>
            <small>شامل ١٤٪ ق.م + بوالص شحن مجمّعة AWB</small>
            <div class="bento-eta-line"><span>#INV-2026-8419</span><span class="ok-tx">معتمدة ضريبيًا</span></div>
          </div>
        </div>`;
    }
    return '';
  }

  return {
    ICONS,
    svgIcon,
    computeProfitBreakdown,
    computePlanQuote,
    renderBentoVisual
  };
});
