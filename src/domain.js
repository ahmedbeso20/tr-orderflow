'use strict';
// ثوابت المجال التجاري المشتركة بين المسارات

const VAT = 0.14;

const MARKETS = {
  a: { name: 'أمازون مصر', fee: 12 },
  n: { name: 'نون مصر', fee: 10 },
  j: { name: 'جوميا', fee: 11 },
  t: { name: 'ترينديول', fee: 15 },
  k: { name: 'كنز مصر', fee: 12 }
};

// رسوم الشحن التقديرية للطلب (عدّلها لتطابق عقدك مع شركة الشحن)
const COURIERS = {
  'بوسطة': { key: 'bosta', fee: 38, cycle: 'تحويل يومي متاح' },
  'أرامكس': { key: 'aramex', fee: 45, cycle: 'تحويل مرتين أسبوعيًا' },
  'مايلرز': { key: 'mylerz', fee: 35, cycle: 'تحويل كل خميس' }
};
const COURIER_BY_KEY = Object.fromEntries(Object.entries(COURIERS).map(([label, c]) => [c.key, label]));

const COD = 'عند الاستلام';
const PAYMENTS = [COD, 'فودافون كاش', 'إنستاباي', 'بطاقة بنكية', 'فوري'];
const PAY_BUCKET = { [COD]: 'cod', 'فودافون كاش': 'wallet', 'إنستاباي': 'wallet', 'بطاقة بنكية': 'card', 'فوري': 'card' };

const PLANS = {
  free: { id: 'free', name: 'باقة البداية', products: 50, markets: 2, ai: 15, priceMonthly: 0, priceYearly: 0 },
  pro: { id: 'pro', name: 'باقة التاجر المحترف', products: 1500, markets: 5, ai: 200, priceMonthly: 1000, priceYearly: 10000 },
  business: { id: 'business', name: 'باقة الشركات والمخازن الكبرى', products: null, markets: 5, ai: 1000, priceMonthly: 3000, priceYearly: 30000 }
};

const GATEWAY_METHODS = {
  card: { id: 'card', name: 'بطاقة بنكية (Visa / Mastercard / ميزة)', short: 'بطاقة بنكية', badge: 'تفعيل فوري 3DS' },
  instapay: { id: 'instapay', name: 'إنستاباي (InstaPay Egypt)', short: 'إنستاباي', badge: 'تحويل لحظي ٠٪ رسوم' },
  wallet: { id: 'wallet', name: 'محفظة إلكترونية (فودافون / اتصالات / أورنج / WE)', short: 'محفظة إلكترونية', badge: 'محفظة ذكية' },
  kashier: { id: 'kashier', name: 'بوابة كاشير الخارجية (Kashier)', short: 'كاشير (Kashier)', badge: 'بوابة دفع خارجية' },
  fawry: { id: 'fawry', name: 'فوري باي (Fawry Pay)', short: 'فوري باي', badge: 'كود مرجعي فوري' }
};

/** حساب تكلفة الاشتراك والخصم وضريبة القيمة المضافة ١٤٪ (يقبل كائن كوبون من قاعدة البيانات) */
function calcSubscriptionQuote(planId, cycle = 'monthly', couponOrCode = null) {
  const plan = PLANS[planId] || PLANS.pro;
  const isYearly = cycle === 'yearly';
  const basePrice = isYearly ? plan.priceYearly : plan.priceMonthly;
  let coupon = null;
  if (couponOrCode && typeof couponOrCode === 'object') {
    coupon = couponOrCode;
  }

  let discount = 0;
  if (coupon && basePrice > 0) {
    discount = coupon.type === 'pct'
      ? Math.round((basePrice * coupon.value) / 100 * 100) / 100
      : Math.min(basePrice, coupon.value);
  }
  const total = Math.max(0, Math.round((basePrice - discount) * 100) / 100);
  const preTax = Math.round((total / (1 + VAT)) * 100) / 100;
  const vat = Math.round((total - preTax) * 100) / 100;

  return {
    planId: plan.id,
    planName: plan.name,
    cycle: isYearly ? 'yearly' : 'monthly',
    basePrice,
    discount,
    coupon: coupon ? coupon.code : '',
    couponDesc: coupon ? coupon.desc : '',
    preTax,
    vat,
    total
  };
}

// حالات الطلب: 0 قيد التجهيز، 1 تم الشحن، 2 تم التسليم، 3 مرتجع، 4 ملغي
const STATUS_NEXT = { 0: [1, 4], 1: [2, 3] };

const INTEGRATION_KEYS = ['a', 'n', 'j', 't', 'k', 'bs', 'ar', 'my', 'eta', 'fw', 'vc'];
const NOTIFICATION_KEYS = ['s', 'o', 'f', 'w'];

const EXPERT_SERVICES = {
  account_setup: {
    key: 'account_setup',
    title: 'فتح وتوثيق حسابات البائعين (أمازون · نون · جوميا · ترينديول)',
    short: 'فتح وتوثيق الحسابات',
    sla: 'خلال ٤٨ ساعة عمل',
    priceLabel: 'مجاني مع الباقة الاحترافية أو ٧٥٠ ج.م'
  },
  aplus_content: {
    key: 'aplus_content',
    title: 'تصميم صفحات المنتجات ومحتوى A+ وصور الاستوديو',
    short: 'محتوى A+ وصفحات المنتجات',
    sla: 'خلال ٣ أيام عمل',
    priceLabel: 'تبدأ من ٩٥٠ ج.م لباقة ١٠ منتجات'
  },
  ppc_ads: {
    key: 'ppc_ads',
    title: 'إدارة وتحسين الحملات الإعلانية الممولة (Amazon PPC & Noon Ads)',
    short: 'إدارة الإعلانات الممولة PPC',
    sla: 'تقرير أداء أسبوعي مباشر',
    priceLabel: '١٬٨٠٠ ج.م / شهريًا'
  },
  full_management: {
    key: 'full_management',
    title: 'الإدارة التشغيلية الكاملة لحسابات المتجر (Done-For-You)',
    short: 'إدارة الحسابات الكاملة',
    sla: 'مدير حساب مخصص يوميًا',
    priceLabel: 'باقة مخصصة حسب حجم المبيعات'
  },
  team_training: {
    key: 'team_training',
    title: 'تدريب فريقك على معايير Amazon SPN و Noon FBPI و Jumia AMP',
    short: 'تدريب واعتماد الفريق',
    sla: 'جلستان عمليتان أونلاين',
    priceLabel: '١٬٢٠٠ ج.م للفريق'
  },
  growth_consult: {
    key: 'growth_consult',
    title: 'جلسة استشارة نمو وتسعير مجانية مع خبير تجارة إلكترونية',
    short: 'استشارة نمو مجانية',
    sla: 'تواصل خلال ٢٤ ساعة',
    priceLabel: 'مجانية بالكامل (٣٠ دقيقة)'
  }
};

// عمولة السوق + ضريبة القيمة المضافة عليها كنسبة من إجمالي الطلب (جزء SQL)
const FEE_RATE_SQL = `(CASE market WHEN 'a' THEN ${MARKETS.a.fee} WHEN 'n' THEN ${MARKETS.n.fee} WHEN 'j' THEN ${MARKETS.j.fee} WHEN 't' THEN ${MARKETS.t.fee} WHEN 'k' THEN ${MARKETS.k.fee} ELSE ${MARKETS.j.fee} END) / 100.0 * ${1 + VAT}`;

module.exports = {
  VAT, MARKETS, COURIERS, COURIER_BY_KEY, COD, PAYMENTS, PAY_BUCKET,
  PLANS, GATEWAY_METHODS, calcSubscriptionQuote,
  STATUS_NEXT, INTEGRATION_KEYS, NOTIFICATION_KEYS, EXPERT_SERVICES, FEE_RATE_SQL
};

