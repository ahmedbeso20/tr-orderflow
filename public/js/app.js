/* ==========================================================================
   1. الأدوات المساعدة ودوال التنسيق (Helpers & Utilities)
   ========================================================================== */
const $ = (sel) => document.querySelector(sel);
const fmtNum = (val) => (+val || 0).toLocaleString('ar-EG', { maximumFractionDigits: 1 });
const fmtEGP = (val) => fmtNum(val) + ' ج.م';
const esc = (str) => String(str ?? '').replace(/[<>&"']/g, (c) => '&#' + c.charCodeAt(0) + ';');
const UI = window.OrderFlowUI || { svgIcon: () => '', renderBentoVisual: () => '', computeProfitBreakdown: () => ({}), computePlanQuote: () => ({}) };
const GROWTH = window.OrderFlowGrowth || { PARTNER_CERTIFICATIONS: [], SOLUTIONS_TABS: [], EXPERT_SERVICES_UI: [], SELLER_GUIDES: [], computeOnboardingProgress: () => ({ steps: [], completedCount: 0, totalCount: 4, percent: 0, isComplete: false }), renderStudioPhotoOnCanvas: () => null };
const ico = (name, size = 18, cls = '') => UI.svgIcon(name, size, cls);

const ORDERFLOW_LOGO_SVG = `<svg class="logo-svg" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <defs>
    <linearGradient id="of-box-top" x1="18" y1="58" x2="88" y2="16" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#6CD8EC"/>
      <stop offset="50%" stop-color="#1CB4D0"/>
      <stop offset="100%" stop-color="#0C5CA4"/>
    </linearGradient>
    <linearGradient id="of-arrow-main" x1="8" y1="108" x2="114" y2="20" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0C5CA4"/>
      <stop offset="50%" stop-color="#1CB4D0"/>
      <stop offset="100%" stop-color="#6CD8EC"/>
    </linearGradient>
    <linearGradient id="of-arrow-depth" x1="12" y1="112" x2="112" y2="30" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#073B6B"/>
      <stop offset="55%" stop-color="#094A86"/>
      <stop offset="100%" stop-color="#0C5CA4"/>
    </linearGradient>
    <linearGradient id="of-chart-sub" x1="36" y1="112" x2="104" y2="54" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#094A86"/>
      <stop offset="55%" stop-color="#0C5CA4"/>
      <stop offset="100%" stop-color="#1CB4D0"/>
    </linearGradient>
    <linearGradient id="of-circuit" x1="20" y1="98" x2="106" y2="28" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#D4F6FA"/>
      <stop offset="55%" stop-color="#ECFAFD"/>
      <stop offset="100%" stop-color="#FFFFFF"/>
    </linearGradient>
  </defs>

  <!-- 1. Isometric Shipping Box (Top Flaps & Left/Center Walls) -->
  <path d="M56 14L90 34L84 38L56 21.5L46 27.5L74 44L68 48L40 31.5L30 37.5L58 54L74 44.5L79 48.5L58 61.5L18 38L56 14Z" fill="url(#of-box-top)"/>
  <path d="M18 38L25 42V73L18 80V38Z" fill="url(#of-box-top)"/>
  <path d="M54.5 59.5L61.5 59.5V72L58 75.5L54.5 72V59.5Z" fill="url(#of-arrow-depth)"/>

  <!-- 2. Bottom-Right Cube Base & Mini Analytics Bars -->
  <path d="M35 95L41 89L56 99V95L60 95V99L89 80V59L96 52V84L58 109L35 95Z" fill="url(#of-chart-sub)"/>
  <path d="M62 88V93L66 90.5V84L62 88ZM69 81V88.5L73 86V76.5L69 81ZM76 76V84L80 81.5V72L76 76ZM83 68V79.5L87 77V64L83 68Z" fill="url(#of-box-top)"/>

  <!-- 3. Secondary Rising Trend Line & Nodes (Bottom-Right) -->
  <path d="M58 93L75 73L79 77L89 64L94 66L103 52" stroke="#1CB4D0" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M97 51L105 49L104 57Z" fill="#6CD8EC"/>
  <circle cx="89" cy="64" r="3.4" fill="#6CD8EC"/>
  <circle cx="94" cy="66" r="3.2" fill="#1CB4D0"/>

  <!-- 4. Main Rising 3D Trend Arrow (3D Depth Underside + Main Face) -->
  <path d="M8 106L42 64L58 79L92 38L84 33L115 21L109 53L101 47L58 95L42 80L21 106H8Z" fill="url(#of-arrow-depth)" transform="translate(2, 3.5)"/>
  <path d="M8 106L42 64L58 79L92 38L84 33L115 21L109 53L101 47L58 95L42 80L21 106H8Z" fill="url(#of-arrow-main)"/>

  <!-- 5. Tech Circuit Line, Nodes & Data Bars Inside Main Arrow -->
  <path d="M68 74V64M75 66V54M82 58V46M89 50V39" stroke="#ECFAFD" stroke-width="2.4" stroke-linecap="round" opacity="0.45"/>
  <path d="M18 101L42 72L58 87L103 33" stroke="url(#of-circuit)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="29" cy="88" r="3.3" fill="#D4F6FA"/>
  <circle cx="42" cy="72" r="4.2" fill="#FFFFFF"/>
  <circle cx="58" cy="87" r="4" fill="#D4F6FA"/>
  <circle cx="78" cy="63" r="3.2" fill="#FFFFFF"/>
  <circle cx="106" cy="37" r="2.8" fill="#FFFFFF"/>
  <path d="M106 37V45" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round"/>
</svg>`;
const LOGO_HTML = `<a class="logo" href="#/"><i>${ORDERFLOW_LOGO_SVG}</i><span>Order<span class="logo-sub">Flow</span></span></a>`;

const MARKETPLACES = {
  a: { name: 'أمازون مصر', domain: 'Amazon.eg', short: 'أ', bg: '#232f3e', color: '#ffffff', fee: 12, syncNote: 'مخزون وأسعار FBA / FBM متزامنة ١٠٠٪' },
  n: { name: 'نون مصر', domain: 'Noon.com', short: 'ن', bg: '#f5c400', color: '#201400', fee: 10, syncNote: 'تحديث تلقائي للكتالوج والطلبات السريعة' },
  j: { name: 'جوميا مصر', domain: 'Jumia.com.eg', short: 'ج', bg: '#f68b1e', color: '#ffffff', fee: 11, syncNote: 'ربط مباشر للمنتجات وبوالص الشحن' }
};

const ORDER_STATUS = [
  { label: 'قيد التجهيز', cls: 'wn' },
  { label: 'تم الشحن', cls: 'pr' },
  { label: 'تم التسليم', cls: 'ok' },
  { label: 'مرتجع', cls: 'er' },
  { label: 'ملغى', cls: 'er' }
];

const APPROVAL_STATUS = {
  pending: { label: 'قيد المراجعة', cls: 'wn' },
  approved: { label: 'معتمد ✓', cls: 'ok' },
  rejected: { label: 'مرفوض ✕', cls: 'er' }
};

const MARKETPLACES_EXTRA = {
  t: { name: 'ترينديول (Trendyol)', domain: 'Trendyol.com', short: 'ت', bg: '#E85D04', color: '#ffffff' },
  k: { name: 'كنز مصر (Kenzz)', domain: 'Kenzz.com', short: 'ك', bg: '#0EA5C6', color: '#ffffff' }
};

const renderMarketChip = (key, size = 30) => {
  const m = MARKETPLACES[key] || MARKETPLACES_EXTRA[key];
  if (!m) return '';
  const logoHtml = typeof GROWTH.renderPlatformLogo === 'function' ? GROWTH.renderPlatformLogo(key, 'icon') : '';
  if (logoHtml) {
    return `<span class="mk-badge mk-badge--logo mk-badge--${key}" title="${m.name}" aria-label="${m.name}" style="width:${size}px;height:${size}px">${logoHtml}</span>`;
  }
  return `<b class="mk-badge" title="${m.name}" style="background:${m.bg};color:${m.color}">${m.short}</b>`;
};

const renderBadge = (text, cls = '') => `<span class="badge ${cls}">${text}</span>`;

const renderApprovalBadge = (status, reason = '') => {
  const st = APPROVAL_STATUS[status] || APPROVAL_STATUS.pending;
  return `<div>${renderBadge(st.label, st.cls)}${status === 'rejected' && reason ? `<small class="er-tx" style="display:block;font-size:11px;margin-top:3px">السبب: ${esc(reason)}</small>` : ''}</div>`;
};

const PRESET_PROD_IMAGES = [
  { label: 'سماعة', url: `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" rx="18" fill="#0C5CA4"/><text x="48" y="60" font-size="40" text-anchor="middle" fill="#fff">🎧</text></svg>')}` },
  { label: 'ماكينة قهوة', url: `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" rx="18" fill="#087F72"/><text x="48" y="60" font-size="40" text-anchor="middle" fill="#fff">☕</text></svg>')}` },
  { label: 'باور بانك', url: `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" rx="18" fill="#1CB4D0"/><text x="48" y="60" font-size="40" text-anchor="middle" fill="#fff">🔋</text></svg>')}` },
  { label: 'أجهزة منزلية', url: `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" rx="18" fill="#B45309"/><text x="48" y="60" font-size="40" text-anchor="middle" fill="#fff">🍟</text></svg>')}` },
  { label: 'إلكترونيات', url: `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><rect width="96" height="96" rx="18" fill="#1E293B"/><text x="48" y="60" font-size="40" text-anchor="middle" fill="#fff">⌚</text></svg>')}` }
];

const renderProdThumb = (p) => {
  if (p && p.image) {
    return `<span class="prod-thumb"><img src="${esc(p.image)}" alt="${esc(p.name || '')}" loading="lazy" referrerpolicy="no-referrer"></span>`;
  }
  return `<span class="prod-thumb" aria-hidden="true">${ico('prod', 20)}</span>`;
};

const getStockBadge = (qty) => {
  if (qty <= 5) return { text: 'منخفض جدًا', cls: 'er' };
  if (qty <= 15) return { text: 'قارب النفاد', cls: 'wn' };
  return { text: 'متوفر', cls: 'ok' };
};

const renderProgressRow = (label, pct, color, sub = '') => `
  <div style="margin: 12px 0">
    <div class="row" style="margin-bottom:5px;font-size:13.5px">
      <b>${label}</b>
      <span class="sp mu" style="font-size:12px">${sub}</span>
      <b>${fmtNum(pct)}٪</b>
    </div>
    <div class="progress"><i style="width:${Math.min(100, Math.max(0, pct))}%;background:${color}"></i></div>
  </div>
`;

const renderTable = (headers, rows) => `
  <div class="table-wrap">
    <table>
      <thead><tr>${headers.map((h) => `<th>${h}</th>`).join('')}</tr></thead>
      <tbody>
        ${rows.length
          ? rows.map((r) => `<tr>${r.map((c, idx) => `<td data-label="${esc(headers[idx] || '')}">${c}</td>`).join('')}</tr>`).join('')
          : `<tr><td colspan="${headers.length}" class="ctr mu" style="padding:28px">لا توجد نتائج مطابقة للبحث</td></tr>`}
      </tbody>
    </table>
  </div>
`;

/* ==========================================================================
   2. البيانات الافتراضية وإدارة الحالة (State & API Client)
   ========================================================================== */
const DEFAULT_UI = {
  range: 30,
  marketFilter: 'all',
  heroMarket: 'all',
  mobileNavOpen: false,
  dashMenuOpen: false,
  yearlyPricing: false,
  prodQuery: '',
  prodStockFilter: 'all',
  orderQuery: '',
  orderStatusFilter: -1,
  orderPage: 1,
  authMode: 0,
  customerQuery: '',
  helpQuery: '',
  adminClientQuery: '',
  adminClientStatus: 'all',
  adminClientPlan: 'all',
  adminApprovalStatus: 'pending',
  adminApprovalType: 'all',
  adminPaymentStatus: 'all',
  adminPaymentQuery: '',
  adminAuditAction: ''
};

let me = null;                    // المستخدم الحالي (null = زائر)
let products = [];
let payments = [];                // سجل مدفوعات وفواتير الاشتراكات
let counts = { lowStock: 0, pendingOrders: 0, unreadNotifications: 0 };
let planInfo = null;
let aiCache = {};                 // آخر تحليل للمستشار وآخر بحث أسعار (محفوظان على الخادم)
let aiListing = null;
let state = { ...DEFAULT_UI };    // تفضيلات الواجهة + بيانات المتجر القادمة من الخادم
const ordersById = new Map();     // طلبات الصفحة الحالية (للنوافذ المنبثقة)

const growthState = {
  solutionTab: 'ai',
  aiTab: 'listing',
  onboardingDismissed: false,
  selectedServiceKey: 'full_management',
  guideCategory: 'الكل',
  activeGuideId: '',
  photoStudio: {
    productId: '',
    preset: 'pure-white',
    ratio: '1:1',
    badgeText: 'أصلي ١٠٠٪',
    title: '',
    priceText: '',
    uploadedImg: null,
    lastDataUrl: ''
  },
  aiChat: [
    {
      role: 'assistant',
      text: 'أهلًا بك في مساعد OrderFlow الذكي للبائعين. اسألني أي سؤال عن أمازون مصر (FBA/FBM)، نون FBPI، جوميا، ترينديول، حساب ضريبة ١٤٪، أو كيفية تقليل مرتجعات الدفع عند الاستلام (RTO).'
    }
  ]
};

// حالة شباك الدفع الإلكتروني التفاعلي (OrderFlow Payment Gateway Counter)
const pgState = {
  plan: 'pro',
  cycle: 'monthly',
  method: 'card',
  couponInput: '',
  appliedCoupon: '',
  couponDesc: '',
  cardHolder: '',
  cardNumber: '',
  cardExpiry: '',
  cardCvv: '',
  instaPayAddress: '',
  transferRef: '',
  walletProvider: 'فودافون كاش',
  walletPhone: '',
  walletOtp: '',
  fawryPhone: '',
  lastReceipt: null,
  idemKey: '',          // مفتاح منع التكرار: يمنع الخصم المزدوج عند الضغط مرتين أو إعادة الإرسال
  gateway: { loaded: false, enabled: true, sandbox: true, collectsCardData: true, methods: [{ id: 'card' }, { id: 'instapay' }, { id: 'wallet' }, { id: 'fawry' }] }
};

// بيانات المعاينة التفاعلية الحية في الهيرو
const heroLiveState = {
  a: { orders: 128, revenue: 74200, profit: 1680, cod: 18400 },
  n: { orders: 86, revenue: 49500, profit: 1240, cod: 12900 },
  j: { orders: 41, revenue: 23800, profit: 760, cod: 6800 },
  lastEvent: 'تم خصم ١ قطعة من «سماعة أنكر Soundcore R50i» تلقائيًا من نون وجوميا بعد طلب جديد على أمازون مصر — منذ لحظات'
};

const HERO_SAMPLE_EVENTS = [
  { m: 'a', item: 'سماعة أنكر Soundcore R50i', gov: 'القاهرة', price: 780, net: 145 },
  { m: 'n', item: 'ماكينة قهوة إسبريسو ديلونجي', gov: 'الإسكندرية', price: 4200, net: 640 },
  { m: 'j', item: 'باور بانك شاومي ٢٠٠٠٠ مللي أمبير', gov: 'الجيزة', price: 950, net: 185 },
  { m: 'a', item: 'ساعة ذكية ألترا ضد الماء', gov: 'المنصورة', price: 620, net: 130 },
  { m: 'n', item: 'خلاط محمول قابل للشحن USB', gov: 'طنطا', price: 410, net: 95 }
];
let heroEventIdx = 0;

function loadAppState() {
  try {
    const s = JSON.parse(localStorage.getItem('omni_ui_v3') || '{}');
    if ([7, 30, 90].includes(+s.range)) state.range = +s.range;
    if (['all', 'a', 'n', 'j'].includes(s.marketFilter)) state.marketFilter = s.marketFilter;
  } catch (_) {}
}

function saveAppState() {
  try { localStorage.setItem('omni_ui_v3', JSON.stringify({ range: state.range, marketFilter: state.marketFilter })); } catch (_) {}
}

loadAppState();

let toastTimeout;
const dlg = $('#dlg');
const showToast = (msg, ms = 2800) => {
  const box = $('#toast');
  if (!box) return;
  const span = document.createElement('span');
  span.textContent = msg;
  box.replaceChildren(span);
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => box.replaceChildren(), ms);
};

/* ==========================================================================
   2.1 عميل الواجهة البرمجية والجلسة (API Client & Session)
   ========================================================================== */
class ApiError extends Error {
  constructor(status, message, data) {
    super(message);
    this.status = status;
    this.data = data || {};
  }
}

const getImpersonateToken = () => {
  try { return sessionStorage.getItem('omni_impersonate_token') || ''; } catch (_) { return ''; }
};

const setImpersonationToken = (t) => {
  try {
    if (t) sessionStorage.setItem('omni_impersonate_token', t);
    else sessionStorage.removeItem('omni_impersonate_token');
  } catch (_) {}
};

const getStoredToken = () => {
  try { return localStorage.getItem('omni_token') || ''; } catch (_) { return ''; }
};

const authedUrl = (url) => {
  const imp = getImpersonateToken();
  const t = imp || getStoredToken();
  if (!t) return url;
  return url + (url.includes('?') ? '&' : '?') + 'token=' + encodeURIComponent(t);
};

async function api(method, url, body) {
  const impToken = getImpersonateToken();
  const token = getStoredToken();
  const headers = { 'X-Requested-With': 'omniarab' };
  if (impToken && !url.startsWith('/api/admin') && !url.startsWith('/api/owner') && !url.startsWith('/api/moderator')) {
    headers['X-Impersonate-Token'] = impToken;
  } else if (token) {
    headers['Authorization'] = 'Bearer ' + token;
  }
  const opts = { method, credentials: 'include', headers };
  if (body !== undefined) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  let res;
  try {
    res = await fetch(url, opts);
  } catch (_) {
    throw new ApiError(0, 'تعذّر الاتصال بالخادم، تأكد من الإنترنت وحاول مجددًا');
  }
  const data = await res.json().catch(() => ({}));
  if (data && data.token && !data.readOnly && !url.includes('/impersonate')) {
    try { localStorage.setItem('omni_token', data.token); } catch (_) {}
  }
  if (!res.ok) {
    if (res.status === 401 && me) {
      sessionExpired(data && data.code === 'SESSION_REVOKED' ? (data.error || 'تم إيقاف أو حذف حسابك — تم إنهاء الجلسة فورًا') : '');
    }
    throw new ApiError(res.status, data.error || 'حدث خطأ غير متوقع', data);
  }
  return data;
}

async function downloadFile(url, filename, label) {
  try {
    const impToken = getImpersonateToken();
    const token = getStoredToken();
    const headers = { 'X-Requested-With': 'omniarab' };
    if (impToken) headers['X-Impersonate-Token'] = impToken;
    else if (token) headers['Authorization'] = 'Bearer ' + token;
    const res = await fetch(url, { credentials: 'include', headers });
    if (!res.ok) throw new Error('تعذر تحميل الملف');
    const blob = await res.blob();
    const objUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(objUrl), 5000);
    showToast(`📥 تم تنزيل ${label} بنجاح ✓`);
  } catch (e) {
    showToast('⚠️ ' + (e.message || 'تعذر تنزيل الملف'));
  }
}

const go = (hash) => {
  state.mobileNavOpen = false;
  state.dashMenuOpen = false;
  if (location.hash === hash) renderApp();
  else location.hash = hash;
};

const roleHomeHash = (u) => {
  if (!u) return '#/';
  if (u.role === 'owner' && !u.readOnly && !getImpersonateToken()) return '#/owner';
  if (u.role === 'moderator') return '#/moderator';
  return '#/dash';
};

let sessionCheckTimer = null;
function stopSessionHeartbeat() {
  if (sessionCheckTimer) {
    clearInterval(sessionCheckTimer);
    sessionCheckTimer = null;
  }
}

async function runSessionCheck() {
  if (!me || me.isDemo) return;
  try {
    const r = await api('GET', '/api/auth/session-check');
    if (r && r.me && me) {
      const prevPerms = JSON.stringify(me.permissions || {});
      const nextPerms = JSON.stringify(r.me.permissions || {});
      me.permissions = r.me.permissions || {};
      me.status = r.me.status;
      if (prevPerms !== nextPerms && location.hash.startsWith('#/moderator')) {
        renderApp(true);
      }
    }
  } catch (_) {
    // 401 is handled inside api() via sessionExpired()
  }
}

function startSessionHeartbeat() {
  stopSessionHeartbeat();
  if (!me || me.isDemo) return;
  sessionCheckTimer = setInterval(runSessionCheck, 5000);
}

function applySession(d) {
  me = d.me;
  products = d.products;
  payments = d.payments || [];
  counts = d.counts;
  planInfo = d.plan;
  aiCache = d.ai || {};
  Object.assign(state, d.settings);
  state.marketplaceConnections = d.marketplaceConnections || [];
  state.marketplaceSchemas = d.marketplaceSchemas || {};
  if (state.instaPayHandle) pgState.instaPayAddress = state.instaPayHandle;
  if (state.storePhone) {
    pgState.walletPhone = state.storePhone;
    pgState.fawryPhone = state.storePhone;
  }
  startSessionHeartbeat();
}

function clearSession() {
  stopSessionHeartbeat();
  me = null;
  products = [];
  payments = [];
  counts = { lowStock: 0, pendingOrders: 0, unreadNotifications: 0 };
  planInfo = null;
  aiCache = {};
  aiListing = null;
  pgState.lastReceipt = null;
  ordersById.clear();
  try { localStorage.removeItem('omni_token'); } catch (_) {}
  try { sessionStorage.removeItem('omni_impersonate_token'); } catch (_) {}
  Object.assign(state, { prodQuery: '', prodStockFilter: 'all', orderQuery: '', orderStatusFilter: -1, orderPage: 1, marketplaceConnections: [], marketplaceSchemas: {} });
}

function sessionExpired(customMsg) {
  clearSession();
  if (dlg && dlg.open) dlg.close();
  showToast(customMsg || 'انتهت جلستك، سجّل الدخول من جديد', 4800);
  go('#/');
}

async function loadSession() {
  try {
    applySession(await api('GET', '/api/bootstrap'));
  } catch (e) {
    if (getImpersonateToken()) {
      try { sessionStorage.removeItem('omni_impersonate_token'); } catch (_) {}
      try { applySession(await api('GET', '/api/bootstrap')); return; } catch (_) {}
    }
    clearSession();
    if (e.status !== 401) showToast('⚠️ ' + e.message, 5000);
  }
}

const applyMeta = (r) => {
  if (r.counts) counts = r.counts;
  if (r.plan) planInfo = r.plan;
};

const upsertProducts = (list) => {
  for (const p of list || []) {
    const i = products.findIndex((x) => x.id === p.id);
    if (i > -1) products[i] = p;
    else products.unshift(p);
  }
};

/* ==========================================================================
   2.2 دوال تنسيق وعرض مشتركة
   ========================================================================== */
const arDigits = (n) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);
const num = (s) => +String(s).replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
const fmtDate = (iso) => new Date(iso).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' });
const monthName = (ym) => new Date(ym + '-01T00:00:00Z').toLocaleDateString('ar-EG', { month: 'long', timeZone: 'UTC' });

const SHORT_AR_MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const shortMonthLabel = (ym) => {
  const mIdx = (+String(ym).slice(5, 7) || 1) - 1;
  return SHORT_AR_MONTHS[mIdx] || monthName(ym);
};

const timeAgo = (iso) => {
  if (!iso) return 'لم تتم بعد';
  const sec = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 45) return 'الآن';
  const rtf = new Intl.RelativeTimeFormat('ar-EG', { numeric: 'always' });
  if (sec < 3600) return rtf.format(-Math.round(sec / 60), 'minute');
  if (sec < 86400) return rtf.format(-Math.round(sec / 3600), 'hour');
  return rtf.format(-Math.round(sec / 86400), 'day');
};
const lastSyncLabel = () => timeAgo(state.lastSyncAt);

const GOVERNORATES = ['القاهرة', 'الجيزة', 'الإسكندرية', 'القليوبية', 'الدقهلية', 'الشرقية', 'الغربية', 'المنوفية', 'البحيرة', 'كفر الشيخ', 'دمياط', 'بورسعيد', 'الإسماعيلية', 'السويس', 'الفيوم', 'بني سويف', 'المنيا', 'أسيوط', 'سوهاج', 'قنا', 'الأقصر', 'أسوان', 'البحر الأحمر', 'الوادي الجديد', 'مطروح', 'شمال سيناء', 'جنوب سيناء'];
const PAY_METHODS = ['عند الاستلام', 'فودافون كاش', 'إنستاباي', 'بطاقة بنكية', 'فوري'];
const COURIER_NAMES = ['بوسطة', 'أرامكس', 'مايلرز'];

const EMPTY_ICON_MAP = {
  '📦': 'prod', '🧾': 'ord', '💳': 'pay', '↩️': 'returns', '👥': 'customers',
  '🔔': 'notifications', '✨': 'ai', '⚠️': 'alert', '🏪': 'store', '📜': 'scroll'
};
const emptyState = (icon, title, text, actionHtml = '') => `
  <div class="card empty">
    <div class="empty-icon" aria-hidden="true">${ico(EMPTY_ICON_MAP[icon] || icon || 'prod', 24)}</div>
    <h3>${title}</h3>
    <p class="mu">${text}</p>
    ${actionHtml}
  </div>
`;
const errorState = (msg) => emptyState('alert', 'تعذّر تحميل البيانات', esc(msg), '<button class="btn" data-a="retry">إعادة المحاولة</button>');

async function copyText(txt) {
  try {
    await navigator.clipboard.writeText(txt);
    return true;
  } catch (_) {
    const t = document.createElement('textarea');
    t.value = txt;
    t.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(t);
    t.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (_) {}
    t.remove();
    return ok;
  }
}

function enhanceA11y(root = document) {
  root.querySelectorAll('[data-a]').forEach((el) => {
    if (el.matches('button, input, select, textarea, a[href]')) return;
    const isSwitch = el.classList.contains('switch');
    el.tabIndex = 0;
    el.setAttribute('role', isSwitch ? 'switch' : 'button');
    if (isSwitch) el.setAttribute('aria-checked', el.classList.contains('on'));
  });
}

const renderAdvisor = (a) => `
  <div class="card ai-glow">
    <div class="row-wrap" style="margin-bottom:12px">
      <span class="ai-badge" style="${a.thinking ? 'background:linear-gradient(135deg,#0C5CA4,#1CB4D0);color:#fff;border-color:transparent' : ''}">${a.thinking ? '🧠 تقرير التفكير العميق الفائق (Gemini 4 Argon)' : (a.source === 'gemini' ? '✨ تقرير المستشار الذكي Gemini' : '📊 تحليل آلي لبيانات متجرك')}</span>
      <b>${esc(a.data.headline)}</b>
      <span class="sp"></span>
      <button class="btn btn-gh btn-sm" data-a="close-advisor">إخفاء ✕</button>
    </div>
    <div class="grid-cards">
      <div class="card" style="padding:14px">
        <b class="er-tx" style="font-size:13.5px;display:block;margin-bottom:4px">أولوية تزويد المخزون</b>
        <p style="font-size:13px">${esc(a.data.urgentRestockTip)}</p>
      </div>
      <div class="card" style="padding:14px">
        <b class="ok-tx" style="font-size:13.5px;display:block;margin-bottom:4px">تعظيم صافي الأرباح</b>
        <p style="font-size:13px">${esc(a.data.profitOptimizationTip)}</p>
      </div>
      <div class="card" style="padding:14px">
        <b class="pr-tx" style="font-size:13.5px;display:block;margin-bottom:4px">السيولة وتحصيلات COD</b>
        <p style="font-size:13px">${esc(a.data.cashflowAndCodTip)}</p>
      </div>
      ${a.data.strategicPlan ? `
      <div class="card" style="padding:16px;grid-column:1/-1;background:var(--bg-sub);border:1px solid var(--bd-strong)">
        <b style="color:var(--pr);font-size:14px;display:flex;align-items:center;gap:6px;margin-bottom:6px">
          <span>الخطة الاستراتيجية التنفيذية المقترحة لمتجرك</span>
        </b>
        <div style="font-size:13.5px;line-height:1.8;white-space:pre-line">${esc(a.data.strategicPlan)}</div>
      </div>` : ''}
    </div>
  </div>
`;

const renderMarketResearch = (m) => `
  <div class="card ai-glow">
    <div class="row-wrap" style="margin-bottom:10px">
      <b>تحليل رادار الأسعار لـ «${esc(m.name)}» في السوق المصري</b>
      <span class="sp"></span>
      <span class="ai-badge">${m.source === 'gemini' ? 'Google Search + Gemini' : 'تحليل السوق المصري الفوري'}</span>
    </div>
    ${m.minPrice ? `
      <div class="radar-kpis">
        <div class="radar-kpi"><small class="mu">أقل سعر منافس</small><b>${fmtEGP(m.minPrice)}</b></div>
        <div class="radar-kpi"><small class="mu">متوسط السوق</small><b>${fmtEGP(m.avgPrice)}</b></div>
        <div class="radar-kpi hi"><small>السعر المقترح للربح</small><b>${fmtEGP(m.recommended)}</b></div>
        <div class="radar-kpi"><small class="mu">أعلى سعر</small><b>${fmtEGP(m.maxPrice)}</b></div>
      </div>
    ` : ''}
    ${Array.isArray(m.platforms) && m.platforms.length ? `
      <div class="radar-platforms">
        ${m.platforms.map((pl) => `
          <div class="radar-plat">
            <b>${esc(pl.market)}</b>
            <span class="pr-tx" style="font-weight:800;font-size:15px">${fmtEGP(pl.price)}</span>
            <small class="mu">${esc(pl.badge)}</small>
          </div>
        `).join('')}
      </div>
    ` : ''}
    <div style="font-size:13.5px;line-height:1.8;margin-top:10px">${esc(m.text).replace(/\n+/g, '<br>')}</div>
    ${m.sources && m.sources.length ? `
      <div style="margin-top:10px;padding-top:8px;border-top:1px solid var(--bd);font-size:12px">
        <b class="mu">المصادر المرجعية من بحث جوجل:</b>
        <div class="row-wrap" style="margin-top:4px;gap:6px">
          ${m.sources.slice(0, 3).map((s) => `<a href="${esc(s.uri)}" target="_blank" rel="noopener noreferrer" class="badge pr" style="text-decoration:underline">${esc(s.title)} ↗</a>`).join('')}
        </div>
      </div>` : ''}
  </div>
`;

/* ==========================================================================
   3. بيانات الصفحات التسويقية والتنقل (Static Content & Navigation)
   ========================================================================== */
const NAV_LINKS = [
  { id: 'dash', icon: 'dash', group: 'ops', title: 'لوحة التحكم' },
  { id: 'prod', icon: 'prod', group: 'ops', title: 'المنتجات والمخزون', badge: () => counts.lowStock || '' },
  { id: 'ord', icon: 'ord', group: 'ops', title: 'الطلبات والفواتير', badge: () => counts.pendingOrders || '' },
  { id: 'returns', icon: 'returns', group: 'ops', title: 'المرتجعات' },
  { id: 'customers', icon: 'customers', group: 'ops', title: 'العملاء' },
  { id: 'cod', icon: 'cod', group: 'fin', title: 'تحصيلات الشحن COD' },
  { id: 'pay', icon: 'pay', group: 'fin', title: 'شباك الدفع والاشتراك', badge: () => (planInfo && planInfo.id === 'free' ? 'ترقية' : '') },
  { id: 'calc', icon: 'calc', group: 'fin', title: 'حاسبة الأرباح' },
  { id: 'ai', icon: 'ai', group: 'tools', title: 'استوديو الذكاء الاصطناعي' },
  { id: 'services', icon: 'briefcase', group: 'tools', title: 'خدمات الخبراء والنمو' },
  { id: 'int', icon: 'int', group: 'tools', title: 'التكاملات والربط' },
  { id: 'notifications', icon: 'notifications', group: 'tools', title: 'مركز الإشعارات', badge: () => counts.unreadNotifications || '' },
  { id: 'help', icon: 'help', group: 'tools', title: 'مركز المساعدة' },
  { id: 'set', icon: 'set', group: 'tools', title: 'الإعدادات' }
];

const ADMIN_NAV_LINKS = [
  { id: 'admin', icon: 'shield', title: 'لوحة المشرف العام' },
  { id: 'admin/clients', icon: 'store', title: 'إدارة التجار والعملاء' },
  { id: 'admin/approvals', icon: 'checkCircle', title: 'طابور الاعتماد والمراجعة' },
  { id: 'admin/payments', icon: 'pay', title: 'المدفوعات والاشتراكات' },
  { id: 'admin/coupons', icon: 'ticket', title: 'إدارة الكوبونات' },
  { id: 'admin/audit', icon: 'scroll', title: 'سجل التدقيق (Audit Log)' }
];

const COUPONS_MAP = {
  WELCOME20: { code: 'WELCOME20', type: 'pct', value: 20, desc: 'خصم ترحيبي ٢٠٪ على اشتراكك' },
  EGYPT10: { code: 'EGYPT10', type: 'pct', value: 10, desc: 'خصم خاص لتجار مصر ١٠٪' },
  OMNI50: { code: 'OMNI50', type: 'fixed', value: 50, desc: 'خصم نقدي فوري ٥٠ ج.م' }
};

function getPgQuote(planId = pgState.plan, cycle = pgState.cycle, couponCode = pgState.appliedCoupon) {
  return UI.computePlanQuote(PLANS, COUPONS_MAP, planId, cycle, couponCode);
}

const FEATURES_LIST = [
  { num: '01', span: 7, icon: 'sync', title: 'المزامنة الفورية للمخزون', desc: 'أي قطعة تُباع على نون تُخصم تلقائيًا من أمازون وجوميا خلال ثوانٍ لمنع غرامات إلغاء الطلبات وتجميد حساب البائع.' },
  { num: '02', span: 5, icon: 'trendUp', title: 'لوحة أرباح حقيقية بالجنيه', desc: 'اعرف صافي ربحك الفعلي في جيبك بعد خصم عمولة كل منصة (١٠٪–١٢٪) وضريبة القيمة المضافة ١٤٪ وتكلفة الشحن.' },
  { num: '03', span: 5, icon: 'cod', title: 'مطابقة تحصيلات الدفع عند الاستلام', desc: 'كشف حساب مركزي يراقب شحناتك لدى بوسطة وأرامكس ومايلرز ويحسب المبالغ الجاهزة للتحويل على إنستاباي.' },
  { num: '04', span: 7, icon: 'qr', title: 'الفاتورة الإلكترونية وبوالص الشحن', desc: 'أصدر فواتير ضريبية مبسطة متوافقة مع منظومة الضرائب المصرية (ETA) برمز QR واطبع بوالص الشحن المجمّعة بضغطة زر.' },
  { num: '05', span: 6, icon: 'ai', title: 'استوديو محتوى وتسعير بذكاء Gemini', desc: 'ولّد عناوين متوافقة مع خوارزمية أمازون A9 ونون وجوميا، وافحص أسعار المنافسين الحية في السوق المصري عبر بحث جوجل.' },
  { num: '06', span: 6, icon: 'message', title: 'تقليل خسائر رفض الاستلام (RTO)', desc: 'أرسل رسائل تأكيد طلبات احترافية عبر واتساب للعميل قبل الشحن لتقليل نسبة المرتجعات وحماية هامش ربحك.' }
];

const MERCHANT_STORIES = [
  {
    quote: 'بعد ربط أمازون ونون على OrderFlow، المزامنة بقت فورية وإلغاءات نفاد المخزون وصلت لصفر.',
    name: 'م. أحمد عبد الرحمن',
    role: 'متجر النور للإلكترونيات · القاهرة',
    metric: '−٩٦٪ غرامات نفاد المخزون',
    avatar: '/assets/images/merchant_avatar_ahmed.jpg'
  },
  {
    quote: 'بقينا نعرف رصيدنا الجاهز للسحب على إنستاباي من بوسطة وأرامكس وصافي ربح كل قطعة في ثانية.',
    name: 'أ. سارة الشناوي',
    role: 'كازا هوم للأجهزة المنزلية · الإسكندرية',
    metric: 'توفير ١٦ ساعة أسبوعيًا',
    avatar: '/assets/images/merchant_avatar_sara.jpg'
  },
  {
    quote: 'حاسبة الأرباح كشفت ٣ منتجات كنا بنبيعها بخسارة بعد العمولة وضريبة ١٤٪، عدّلنا السعر وزاد ربحنا فورًا.',
    name: 'أ. كريم الجندي',
    role: 'تك زون للإكسسوارات · المنصورة',
    metric: '+٢٧٪ زيادة في صافي الربح',
    avatar: '/assets/images/merchant_avatar_karim.jpg'
  }
];

const PLANS = [
  { id: 'free', name: 'باقة البداية', price: 0, desc: 'ابدأ مجانًا وجرّب المنصة', feats: ['حتى ٥٠ منتجًا متزامنًا', 'ربط سوقين (أمازون + نون)', 'لوحة التحكم وحاسبة الأرباح', 'إدارة الطلبات والفواتير'] },
  { id: 'pro', name: 'التاجر المحترف', price: 1000, popular: true, desc: 'الأنسب للمتاجر النشطة في مصر', feats: ['حتى ١٬٥٠٠ منتج متزامن', 'ربط كل الأسواق وشركات الشحن', 'أدوات الذكاء الاصطناعي والصور', 'فواتير QR وتسوية COD'] },
  { id: 'business', name: 'باقة الشركات', price: 3000, desc: 'للمخازن والعلامات الكبرى', feats: ['منتجات وطلبات غير محدودة', 'مستشار ذكاء اصطناعي متقدم', 'تصدير تقارير مالية CSV', 'مدير حساب ودعم واتساب مباشر'] }
];

const FAQS = [
  ['هل أحتاج بطاقة بنكية للبدء؟', 'لا، باقة البداية مجانية تمامًا. وعند الترقية يمكنك الدفع عبر إنستاباي أو فودافون كاش أو فوري أو أي بطاقة محلية.'],
  ['كيف تحمي المنصة مخزوني من البيع بالخطأ؟', 'أي طلب جديد على منصة يُخصم فورًا من باقي المنصات، وأي مرتجع يعود للمخزون تلقائيًا.'],
  ['هل تحسب المنصة العمولة وضريبة ١٤٪؟', 'نعم، تحسب الحاسبة والتقارير عمولة كل سوق + ١٤٪ ضريبة + الشحن + نسبة المرتجعات تلقائيًا.'],
  ['هل يمكنني التجربة قبل التسجيل؟', 'نعم، اضغط «جرّب اللوحة الآن» لفتح حساب تجريبي جاهز ببيانات حقيقية فورًا.']
];

/* ==========================================================================
   4. بناء الواجهة التسويقية والهيرو التفاعلي (Landing View & Hero)
   ========================================================================== */
const getHeroStats = () => {
  const mk = state.heroMarket;
  if (mk !== 'all' && heroLiveState[mk]) {
    const s = heroLiveState[mk];
    return { orders: s.orders, revenue: s.revenue, profit: s.profit, cod: s.cod, label: MARKETPLACES[mk].name };
  }
  const keys = ['a', 'n', 'j'];
  return {
    orders: keys.reduce((acc, k) => acc + heroLiveState[k].orders, 0),
    revenue: keys.reduce((acc, k) => acc + heroLiveState[k].revenue, 0),
    profit: keys.reduce((acc, k) => acc + heroLiveState[k].profit, 0),
    cod: keys.reduce((acc, k) => acc + heroLiveState[k].cod, 0),
    label: 'جميع الأسواق الثلاثة'
  };
};

const renderHeroPreviewCard = () => {
  const st = getHeroStats();
  const activeMkt = state.heroMarket;
  return `
    <div class="hero-preview-top">
      <div class="row" style="gap:10px">
        <span class="hero-brand-logo" aria-hidden="true">${ORDERFLOW_LOGO_SVG}</span>
        <div>
          <b style="font-size:15px;display:block;font-family:var(--font-display)">مركز تدفق الطلبات المباشر</b>
          <small style="color:#9AB3CE;font-size:12px">${st.label} · الجنيه المصري (EGP)</small>
        </div>
      </div>
      <div class="hero-mkt-tabs" role="tablist" aria-label="تصفية معاينة الأسواق">
        ${[['all', 'الكل'], ['a', 'أمازون'], ['n', 'نون'], ['j', 'جوميا']].map(([k, lbl]) => `
          <button type="button" class="hero-mkt-tab ${activeMkt === k ? 'active' : ''}" data-a="hero-mkt" data-v="${k}">${lbl}</button>
        `).join('')}
      </div>
    </div>

    <div class="hero-mini-kpis">
      <div class="hero-mini-kpi">
        <small>صافي ربح اليوم</small>
        <b class="profit" id="hero-profit">+${fmtEGP(st.profit)}</b>
      </div>
      <div class="hero-mini-kpi">
        <small>طلبات اليوم المتزامنة</small>
        <b id="hero-total-orders">${fmtNum(st.orders)} طلب</b>
      </div>
      <div class="hero-mini-kpi">
        <small>رصيد COD جاهز</small>
        <b id="hero-cod-ready" style="color:#6EE7F7">${fmtEGP(st.cod)}</b>
      </div>
    </div>

    <div class="hero-channels-list">
      ${['a', 'n', 'j'].map((k) => {
        const m = MARKETPLACES[k];
        const ch = heroLiveState[k];
        const isHighlighted = activeMkt === k;
        return `
          <button type="button" class="hero-channel-row ${isHighlighted ? 'highlight' : ''}" data-a="hero-mkt" data-v="${activeMkt === k ? 'all' : k}" style="width:100%;text-align:start;cursor:pointer;color:inherit" title="اضغط للتركيز على ${m.name}">
            ${renderMarketChip(k)}
            <div class="sp" style="min-width:0">
              <div class="row" style="gap:6px">
                <b style="font-size:14px">${m.name}</b>
                <small style="color:#9AB3CE;font-size:11.5px">${m.domain}</small>
              </div>
              <small style="color:#9AB3CE;font-size:11.5px;display:block">${m.syncNote}</small>
            </div>
            <div style="text-align:end;flex-shrink:0">
              <b id="hero-ord-${k}" style="color:#6EE7F7;font-size:13.5px;display:block">${fmtNum(ch.orders)} طلب اليوم</b>
              <small style="color:#4CE0B3;font-size:11.5px">صافي +${fmtEGP(ch.profit)}</small>
            </div>
          </button>
        `;
      }).join('')}
    </div>

    <div class="hero-live-feed">
      <div class="sp" style="min-width:200px">
        <b style="display:block;font-size:12px;color:#6EE7F7;margin-bottom:2px">آخر عملية مزامنة تلقائية</b>
        <span id="hero-feed-text">${esc(heroLiveState.lastEvent)}</span>
      </div>
      <button type="button" class="btn btn-sm btn-ac" data-a="hero-sim-order" title="جرب محاكاة وصول طلب جديد وخصم المخزون">${ico('zap', 14)} محاكاة طلب جديد</button>
    </div>
  `;
};

const renderSolutionsPanel = () => {
  const tabs = GROWTH.SOLUTIONS_TABS || [];
  const active = tabs.find((t) => t.id === growthState.solutionTab) || tabs[0];
  if (!active) return '';
  return `
    <div class="solutions-tabs-wrap">
      <div class="seg-rail" role="tablist" aria-label="حلول OrderFlow الذكية">
        ${tabs.map((t) => `
          <button type="button" role="tab" aria-selected="${t.id === active.id}" class="pill ${t.id === active.id ? 'on' : ''}" data-a="switch-solution-tab" data-v="${t.id}">
            ${ico(t.icon, 16)}
            <span>${t.label}</span>
          </button>
        `).join('')}
      </div>
    </div>
    <div class="solutions-stage">
      <div class="solutions-stage-head">
        <div>
          <h3>${active.headline}</h3>
          <p class="mu" style="margin-top:6px;max-width:66ch">${active.lead}</p>
        </div>
        <button type="button" class="btn btn-ac" data-a="${active.ctaAction}">${active.ctaText} ${ico('arrowLeft', 15)}</button>
      </div>
      <div class="solutions-cards-grid">
        ${active.items.map((item) => `
          <div class="solution-mini-card">
            <span class="bento-ico" aria-hidden="true">${ico(item.icon, 19)}</span>
            <h4>${item.name}</h4>
            <p class="mu">${item.desc}</p>
          </div>
        `).join('')}
      </div>
    </div>
  `;
};

const renderLanding = () => `
  <header class="navbar">
    <div class="container">
      ${LOGO_HTML}

      <nav class="nav-links" aria-label="التنقل الرئيسي">
        <a data-a="scroll" data-t="sec-solutions">حلولنا</a>
        <a data-a="scroll" data-t="sec-workflow">كيف يعمل</a>
        <a data-a="scroll" data-t="sec-calc-preview">حاسبة الأرباح</a>
        <a data-a="scroll" data-t="sec-services">خدمات الخبراء</a>
        <a data-a="scroll" data-t="sec-pricing">الباقات</a>
        <a href="#/guides">الأكاديمية</a>
      </nav>

      <div class="nav-actions">
        <button class="btn btn-gh btn-icon" data-a="theme" title="تبديل المظهر" aria-label="تبديل المظهر"><span class="theme-ico-moon">${ico('moon', 17)}</span><span class="theme-ico-sun">${ico('sunMoon', 17)}</span></button>
        ${me ? `
          <a class="btn btn-ac btn-sm" href="${roleHomeHash(me)}">لوحة التحكم ${ico('arrowLeft', 15)}</a>
        ` : `
          <button class="nav-text-link hide-xs" data-a="auth" data-m="0">دخول</button>
          <button class="btn btn-ac btn-sm" data-a="auth" data-m="1">ابدأ مجانًا</button>
        `}
        <button class="mobile-menu-btn" data-a="toggle-mobile-nav" aria-label="فتح القائمة" aria-expanded="${state.mobileNavOpen}">
          ${state.mobileNavOpen ? ico('x', 20) : ico('menu', 20)}
        </button>
      </div>
    </div>

    <div class="mobile-nav-drawer ${state.mobileNavOpen ? 'open' : ''}" id="mobile-nav-drawer">
      <div class="mobile-nav-links">
        <a data-a="scroll" data-t="sec-solutions">حلولنا الذكية</a>
        <a data-a="scroll" data-t="sec-workflow">كيف يعمل</a>
        <a data-a="scroll" data-t="sec-calc-preview">حاسبة الأرباح</a>
        <a data-a="scroll" data-t="sec-services">خدمات الخبراء</a>
        <a data-a="scroll" data-t="sec-pricing">الباقات</a>
        <a href="#/guides">الأكاديمية</a>
        <a data-a="open-consult">احجز استشارة مجانية</a>
      </div>
      <div class="row-wrap" style="padding-top:12px;border-top:1px solid var(--bd)">
        ${me ? `
          <a class="btn btn-ac sp" href="${roleHomeHash(me)}">لوحة التحكم</a>
          <button class="btn btn-gh" data-a="logout">خروج</button>
        ` : `
          <button class="btn btn-ac sp" data-a="auth" data-m="1">ابدأ مجانًا</button>
          <button class="btn btn-gh sp" data-a="auth" data-m="0">دخول</button>
          <button class="btn btn-gh" style="width:100%" data-a="demo">جرّب اللوحة الآن بدون تسجيل</button>
        `}
      </div>
    </div>
  </header>

  <section class="hero hero-simple">
    <div class="container">
      <div class="hero-simple-inner">
        <div class="hero-kicker">
          <span dir="ltr">Amazon Egypt · Noon · Jumia · Trendyol · Kenzz</span>
        </div>
        <h1>
          أدِر كل متاجرك من شاشة واحدة، وزوّد <span class="hl">صافي أرباحك</span>
        </h1>
        <div class="hero-cta-group">
          <button class="btn btn-ac btn-lg" data-a="auth" data-m="1">ابدأ مجانًا الآن</button>
          <button class="btn btn-hero-sec btn-lg" data-a="demo">جرّب اللوحة الآن</button>
          <button class="btn btn-hero-sec btn-lg" data-a="open-consult">${ico('message', 16)} استشارة مجانية</button>
        </div>
        <div class="hero-trust-meta">
          <span><b>مجانًا</b> بدون بطاقة بنكية</span>
          <span class="sep" aria-hidden="true">·</span>
          <span>ربط في <b>٣ دقائق</b></span>
          <span class="sep" aria-hidden="true">·</span>
          <span>دعم محلي <b>في مصر</b></span>
        </div>
      </div>
    </div>
  </section>

  <section class="ecosystem-bar" aria-label="الشراكات والتكاملات المعتمدة">
    <div class="container">
      <div class="partner-strip-head">
        <strong>تكاملات وشراكات موثوقة مع أكبر منصات البيع والشحن</strong>
      </div>
      <div class="partner-strip-grid">
        ${(GROWTH.PARTNER_CERTIFICATIONS || []).map((p) => `
          <div class="partner-cert-card">
            <span class="partner-logo-tile partner-logo-tile--${p.key}${p.bleed ? ' partner-logo-tile--bleed' : ''}" style="background:${p.tileBg || '#FFFFFF'}" aria-label="${p.name}" title="${p.name}">
              ${typeof GROWTH.renderPlatformLogo === 'function' ? GROWTH.renderPlatformLogo(p.key, 'icon') : p.short}
            </span>
            <div>
              <b style="font-size:14px;display:block">${p.name}</b>
              <small class="mu">${p.badge}</small>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  </section>

  <section class="sec" id="sec-solutions">
    <div class="container">
      <div class="sec-header">
        <span class="sec-kicker">حلولنا الذكية</span>
        <h2>كل ما تحتاجه لنمو متجرك في مكان واحد</h2>
        <p class="mu">اختر القسم المناسب لتتعرف على الأدوات والخدمات التي نقدمها لمتجرك.</p>
      </div>
      <div id="landing-solutions-slot">
        ${renderSolutionsPanel()}
      </div>
    </div>
  </section>

  <section class="sec alt" id="sec-workflow">
    <div class="container">
      <div class="sec-header">
        <span class="sec-kicker">كيف يعمل OrderFlow؟</span>
        <h2>ابدأ في ٣ خطوات بسيطة</h2>
        <p class="mu">إدارة بسيطة ومنظمة لمتجرك من لحظة الطلب حتى استلام أرباحك على InstaPay.</p>
      </div>
      <div class="workflow-steps-grid">
        <div class="workflow-step-card">
          <span class="editorial-step-idx">01</span>
          <h3>اربط متاجرك</h3>
          <p class="mu">اربط أمازون ونون وجوميا وترينديول خلال دقائق لتوحيد مخزونك.</p>
        </div>
        <div class="workflow-step-card">
          <span class="editorial-step-idx">02</span>
          <h3>جهّز طلباتك بسرعة</h3>
          <p class="mu">اطبع بوالص الشحن والفواتير الضريبية وأكّد الطلبات على واتساب.</p>
        </div>
        <div class="workflow-step-card">
          <span class="editorial-step-idx">03</span>
          <h3>تابع أرباحك وتحصيلاتك</h3>
          <p class="mu">اعرف صافي ربحك الحقيقي واسحب مستحقات COD على إنستاباي.</p>
        </div>
      </div>
    </div>
  </section>

  <section class="sec" id="sec-calc-preview">
    <div class="container">
      <div class="sec-header">
        <span class="sec-kicker">حاسبة الأرباح المجانية</span>
        <h2>احسب صافي ربحك قبل البيع</h2>
        <p class="mu">أدخل سعر البيع والتكلفة لتعرف مكسبك الحقيقي بعد العمولة وضريبة ١٤٪ والشحن.</p>
      </div>
      <div class="grid-2" style="align-items:stretch">
        <div class="card">
          <h3 style="margin-bottom:14px">بيانات المنتج</h3>
          <label for="lp-calc-mkt">السوق</label>
          <select id="lp-calc-mkt" data-i="lp-calc-mkt">
            <option value="12">أمازون مصر (١٢٪)</option>
            <option value="10">نون مصر (١٠٪)</option>
            <option value="11">جوميا مصر (١١٪)</option>
          </select>
          <div class="grid-equal" style="gap:12px">
            <div>
              <label for="lp-comm">العمولة (٪)</label>
              <input id="lp-comm" type="number" value="12" data-i="lp-calc-run">
            </div>
            <div>
              <label for="lp-price">سعر البيع (ج.م)</label>
              <input id="lp-price" type="number" value="650" data-i="lp-calc-run">
            </div>
          </div>
          <div class="grid-equal" style="gap:12px">
            <div>
              <label for="lp-cost">التكلفة (ج.م)</label>
              <input id="lp-cost" type="number" value="360" data-i="lp-calc-run">
            </div>
            <div>
              <label for="lp-ship">الشحن والتغليف (ج.م)</label>
              <input id="lp-ship" type="number" value="40" data-i="lp-calc-run">
            </div>
          </div>
          <label for="lp-rto">نسبة المرتجعات المتوقعة (٪)</label>
          <input id="lp-rto" type="number" value="6" data-i="lp-calc-run" style="margin-bottom:0">
        </div>
        <div class="card" id="lp-calc-res-box" style="display:flex;flex-direction:column;justify-content:space-between">
          ${renderProfitCalcResult([12, 650, 360, 40, 6])}
        </div>
      </div>
    </div>
  </section>

  <section class="sec alt" id="sec-services">
    <div class="container">
      <div class="sec-header">
        <span class="sec-kicker">طريقتان للنمو</span>
        <h2>أدِر متجرك بنفسك… أو دع خبراءنا يديرونه عنك</h2>
        <p class="mu">استخدم المنصة يوميًا بكل سهولة، أو اطلب دعم فريقنا المتخصص لإدارة حساباتك وإعلاناتك.</p>
      </div>
      <div class="dual-services-grid">
        <div class="service-pillar-card">
          <div>
            <span class="pillar-eyebrow">${ico('layers', 15)} المنصة الذاتية</span>
            <h3>إدارة متجرك بنفسك</h3>
            <p class="mu" style="line-height:1.75;margin-top:6px">كل أدوات المخزون والطلبات والذكاء الاصطناعي في لوحة سهلة الاستخدام.</p>
            <ul class="pricing-feats">
              <li>${ico('check', 16)}<span>مزامنة فورية للمخزون والطلبات عبر الأسواق</span></li>
              <li>${ico('check', 16)}<span>تجهيز صفحات المنتجات والصور بالذكاء الاصطناعي</span></li>
              <li>${ico('check', 16)}<span>تقارير أرباح دقيقة وتحصيلات COD وفواتير QR</span></li>
            </ul>
          </div>
          <div class="row-wrap" style="gap:10px">
            <button class="btn btn-ac sp" data-a="auth" data-m="1">ابدأ مجانًا</button>
            <button class="btn btn-gh" data-a="demo">جرّب اللوحة</button>
          </div>
        </div>

        <div class="service-pillar-card featured">
          <div>
            <span class="pillar-eyebrow">${ico('briefcase', 15)} خدمات الخبراء</span>
            <h3>إدارة كاملة عبر فريقنا</h3>
            <p class="mu" style="line-height:1.75;margin-top:6px">فريق متخصص يتولى تأسيس وتشغيل وتنمية متاجرك خطوة بخطوة.</p>
            <ul class="pricing-feats">
              <li>${ico('check', 16)}<span>فتح وتوثيق حسابات أمازون ونون وجوميا وترينديول</span></li>
              <li>${ico('check', 16)}<span>تصميم صفحات A+ وجلسات صور المنتجات</span></li>
              <li>${ico('check', 16)}<span>إدارة الإعلانات الممولة PPC وزيادة المبيعات</span></li>
            </ul>
          </div>
          <div class="row-wrap" style="gap:10px">
            <button class="btn btn-ac sp" data-a="open-consult">${ico('message', 16)} احجز استشارة مجانية</button>
            <a class="btn btn-gh" href="#/guides">الأكاديمية ${ico('arrowLeft', 14)}</a>
          </div>
        </div>
      </div>
    </div>
  </section>

  <section class="sec" id="sec-stories">
    <div class="container">
      <div class="sec-header">
        <span class="sec-kicker">آراء عملائنا</span>
        <h2>تجار يثقون في OrderFlow يوميًا</h2>
      </div>
      <div class="grid-3">
        ${MERCHANT_STORIES.map(s => `
          <article class="story-card">
            <div>
              <div class="story-metric">${ico('trendUp', 16)}<span>${esc(s.metric)}</span></div>
              <p class="story-quote">"${esc(s.quote)}"</p>
            </div>
            <div class="story-author">
              <img class="story-avatar" src="${esc(s.avatar)}" alt="${esc(s.name)}" loading="lazy" referrerpolicy="no-referrer">
              <div>
                <b style="display:block;font-size:14.5px">${esc(s.name)}</b>
                <small class="mu">${esc(s.role)}</small>
              </div>
            </div>
          </article>
        `).join('')}
      </div>
    </div>
  </section>

  <section class="sec alt" id="sec-pricing">
    <div class="container">
      <div class="row-wrap" style="margin-bottom:32px;align-items:flex-end">
        <div>
          <span class="sec-kicker">الباقات والأسعار</span>
          <h2>أسعار واضحة بالجنيه المصري</h2>
          <p class="mu">ابدأ مجانًا ورقِّ وقتما تحتاج عبر إنستاباي أو المحافظ الإلكترونية أو فوري.</p>
        </div>
        <span class="sp"></span>
        <div class="seg-rail" role="group" aria-label="دورة الفوترة">
          <button type="button" class="pill ${state.yearlyPricing ? '' : 'on'}" data-a="pricing-toggle" data-v="0">شهري</button>
          <button type="button" class="pill ${state.yearlyPricing ? 'on' : ''}" data-a="pricing-toggle" data-v="1">سنوي (وفّر شهرين)</button>
        </div>
      </div>
      <div class="grid-3">
        ${PLANS.map(p => {
          const isCurrent = me && planInfo && planInfo.id === p.id;
          const displayPrice = state.yearlyPricing ? p.price * 10 : p.price;
          return `
          <div class="pricing-card ${p.popular ? 'featured' : ''}">
            <div>
              ${p.popular ? `<div class="meta-inline pr" style="margin-bottom:8px">${ico('ai', 14)}<span>الأكثر اختيارًا</span></div>` : ''}
              <h3>${p.name}</h3>
              <p class="mu" style="font-size:13.5px">${p.desc}</p>
              <div class="pricing-price">
                ${fmtEGP(displayPrice)}
                <small class="mu" style="font-size:13px;font-weight:600;font-family:var(--font-sans)">/ ${p.price ? (state.yearlyPricing ? 'سنويًا' : 'شهريًا') : 'مجانًا'}</small>
              </div>
              <hr style="border:0;border-top:1px solid var(--bd);margin:16px 0">
              <ul class="pricing-feats">
                ${p.feats.map(f => `<li>${ico('check', 16)}<span>${f}</span></li>`).join('')}
              </ul>
            </div>
            <button class="btn ${p.popular ? 'btn-ac' : 'btn-gh'}" style="width:100%" data-a="choose-plan" data-p="${p.id}" ${isCurrent && p.price === 0 ? 'disabled' : ''}>
              ${p.price === 0
                ? (isCurrent ? 'باقتك الحالية' : 'ابدأ مجانًا')
                : (isCurrent ? `تجديد (${fmtEGP(displayPrice)})` : `اشترك الآن (${fmtEGP(displayPrice)})`)}
            </button>
          </div>
        `;}).join('')}
      </div>

      <div class="card ai-glow" style="margin-top:24px;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap">
        <div>
          <b style="display:block;margin-bottom:4px">الدفع الفوري عبر OrderFlow Pay</b>
          <p class="mu" style="font-size:13.5px;margin:0">
            إنستاباي · فودافون كاش · فوري · بطاقات بنكية — استخدم كود <code style="font-family:var(--font-mono);color:var(--pr);font-weight:700">WELCOME20</code> لخصم ٢٠٪.
          </p>
        </div>
        <button type="button" class="btn btn-ac" data-a="open-pay-window" data-p="pro">${ico('pay', 16)} شباك الدفع</button>
      </div>
    </div>
  </section>

  <section class="sec" id="sec-faq">
    <div class="container" style="max-width:780px">
      <div class="sec-header">
        <span class="sec-kicker">أسئلة شائعة</span>
        <h2>إجابات سريعة</h2>
      </div>
      ${FAQS.map(q => `
        <details>
          <summary>${q[0]}</summary>
          <p class="mu" style="margin-top:10px;line-height:1.75">${q[1]}</p>
        </details>
      `).join('')}
    </div>
  </section>

  <section class="hero" style="padding:62px 0;text-align:center;border-top:1px solid var(--hero-bd)">
    <div class="container" style="max-width:640px">
      <h2 style="font-size:clamp(1.6rem,3vw,2.25rem)">جاهز تبدأ مع OrderFlow؟</h2>
      <p class="lead" style="margin:10px auto 26px">أنشئ حسابك المجاني أو جرّب اللوحة التجريبية الآن بضغطة واحدة.</p>
      <div class="hero-cta-group" style="justify-content:center">
        <button class="btn btn-ac btn-lg" data-a="auth" data-m="1">ابدأ مجانًا الآن</button>
        <button class="btn btn-hero-sec btn-lg" data-a="demo">جرّب اللوحة الآن</button>
      </div>
    </div>
  </section>

  ${renderSiteFooter()}
`;

function renderSiteFooter() {
  return `
  <footer class="site-footer">
    <div class="container row-wrap">
      ${LOGO_HTML}
      <span class="sp"></span>
      <nav class="row-wrap" aria-label="روابط تذييل الصفحة" style="gap:10px 16px;font-size:13.5px;color:var(--mu)">
        <a href="#/guides" class="pr-tx">أكاديمية التاجر</a>
        <span aria-hidden="true">·</span>
        <a href="#/about" class="pr-tx">عن المنصة</a>
        <span aria-hidden="true">·</span>
        <a href="#/terms" class="pr-tx">الشروط والأحكام</a>
        <span aria-hidden="true">·</span>
        <a href="#/privacy" class="pr-tx">سياسة الخصوصية</a>
        <span aria-hidden="true">·</span>
        <a href="#/refund" class="pr-tx">سياسة الاسترجاع</a>
        <span aria-hidden="true">·</span>
        <a href="#/contact" class="pr-tx">تواصل معنا</a>
        <span aria-hidden="true">·</span>
        <span>© ٢٠٢٦ OrderFlow لتقنيات التجارة الإلكترونية · صُنع لتجار مصر</span>
      </nav>
    </div>
  </footer>`;
}

/* ==========================================================================
   5. بناء شاشات لوحة التحكم الداخليّة (Dashboard Views)
   ========================================================================== */
const views = {};

// 5.1 لوحة التحكم الرئيسية (#/dash)
const MARKET_BAR = { a: '#0C5CA4', n: '#1CB4D0', j: '#087F72' };

const renderSalesChart = (months) => {
  const rev = months.map((m) => m.revenue / 1000);
  const prof = months.map((m) => m.profit / 1000);
  const max = Math.max(1, ...rev, ...prof);

  return `
    <div class="row-wrap" style="margin-bottom:14px;font-size:12.5px;color:var(--tx-sec)">
      <span class="row" style="gap:7px"><i style="width:11px;height:11px;border-radius:3px;background:var(--pr);display:inline-block"></i> إجمالي المبيعات (ألف ج.م)</span>
      <span class="row" style="gap:7px"><i style="width:11px;height:11px;border-radius:3px;background:var(--ac);display:inline-block"></i> صافي الربح (ألف ج.م)</span>
    </div>
    <svg viewBox="0 0 640 240" width="100%" style="overflow:visible" role="img" aria-label="رسم بياني لنمو المبيعات وصافي الأرباح خلال ١٢ شهرًا">
      <defs>
        <linearGradient id="chart-rev-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#0B57A4" stop-opacity="1"/>
          <stop offset="100%" stop-color="#38BDF8" stop-opacity="0.72"/>
        </linearGradient>
        <linearGradient id="chart-prof-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#0EA5C6" stop-opacity="1"/>
          <stop offset="100%" stop-color="#34D399" stop-opacity="0.78"/>
        </linearGradient>
      </defs>
      ${[0, 1, 2, 3, 4].map((idx) => {
        const y = 198 - idx * 42;
        const val = Math.round((max / 4) * idx);
        return `
          <line x1="36" y1="${y}" x2="628" y2="${y}" stroke="var(--bd)" stroke-dasharray="${idx === 0 ? '0' : '4 4'}"/>
          ${idx > 0 ? `<text x="30" y="${y + 4}" text-anchor="end" fill="var(--mu)" font-size="10.5" font-family="var(--font-mono)">${fmtNum(val)}</text>` : ''}
        `;
      }).join('')}
      ${months.map((m, i) => {
        const hRev = (Math.max(0, rev[i]) / max) * 168;
        const hProf = (Math.max(0, prof[i]) / max) * 168;
        const x = 582 - i * 48;
        return `
          <g>
            <rect x="${x}" y="${198 - hRev}" width="17" height="${Math.max(2, hRev)}" rx="5" fill="url(#chart-rev-grad)" opacity="${i === 11 ? '1' : '0.86'}">
              <title>${monthName(m.ym)} — المبيعات: ${fmtNum(rev[i])} ألف ج.م</title>
            </rect>
            <rect x="${x + 19}" y="${198 - hProf}" width="13" height="${Math.max(2, hProf)}" rx="4" fill="url(#chart-prof-grad)">
              <title>${monthName(m.ym)} — صافي الربح: ${fmtNum(prof[i])} ألف ج.م</title>
            </rect>
            <text x="${x + 16}" y="222" text-anchor="middle" fill="var(--mu)" font-size="10.5" font-weight="700">${shortMonthLabel(m.ym)}</text>
          </g>
        `;
      }).join('')}
    </svg>
  `;
};

const renderOnboarding = () => `
  <div class="card ai-glow" style="margin-bottom:18px">
    <h3>ابدأ تجهيز متجرك على OrderFlow في ٣ خطوات</h3>
    <ol class="steps">
      <li><b>أضف منتجك الأول</b> بسعره وتكلفته وكميته ليُحسب هامش ربحك الصافي. <button class="btn btn-ac btn-sm" data-a="add-prod">${ico('plus', 14)} إضافة منتج</button></li>
      <li><b>فعّل الربط مع الأسواق</b> التي تبيع عليها (أمازون، نون، جوميا). <a class="pr-tx" href="#/int">صفحة التكاملات ◂</a></li>
      <li><b>سجّل أول طلب</b> ليُخصم المخزون تلقائيًا وتظهر أرباحك هنا. <a class="pr-tx" href="#/ord">صفحة الطلبات ◂</a></li>
    </ol>
  </div>
`;

const renderGuidedOnboarding = () => {
  if (growthState.onboardingDismissed) return '';
  const prog = GROWTH.computeOnboardingProgress(state, products, aiCache);
  if (prog.isComplete) return '';
  return `
    <div class="card onboarding-card" style="margin-bottom:20px">
      <div class="row-wrap" style="margin-bottom:12px">
        <div>
          <div class="row" style="gap:8px">
            ${ico('zap', 17, 'pr-tx')}
            <h3 style="margin:0;font-size:16px">خطوات تجهيز متجرك للانطلاق السريع</h3>
            <span class="meta-inline ok">${fmtNum(prog.completedCount)} من ${fmtNum(prog.totalCount)} مكتملة (${fmtNum(prog.percent)}٪)</span>
          </div>
          <p class="mu" style="font-size:13px;margin-top:3px">أكمل هذه الخطوات السريعة لتفعيل المزامنة التلقائية وأدوات الذكاء الاصطناعي لمتجرك.</p>
        </div>
        <span class="sp"></span>
        <button type="button" class="btn btn-gh btn-sm" data-a="dismiss-onboarding">إخفاء الدليل</button>
      </div>
      <div class="progress" style="margin-bottom:14px"><i style="width:${prog.percent}%;background:linear-gradient(90deg,var(--pr),var(--ac))"></i></div>
      <div class="onboarding-steps-grid">
        ${prog.steps.map((s) => `
          <a href="${s.href}" class="onboarding-step ${s.done ? 'done' : ''}">
            <div class="onboarding-step-top">
              <span class="onboarding-check" aria-hidden="true">${s.done ? ico('check', 14) : ico('arrowLeft', 14)}</span>
              <span class="onboarding-cta">${s.cta}</span>
            </div>
            <div>
              <b style="font-size:13.5px;display:block;margin-bottom:3px">${s.title}</b>
              <small class="mu" style="display:block;line-height:1.55">${s.desc}</small>
            </div>
          </a>
        `).join('')}
      </div>
    </div>
  `;
};

views.dash = (d) => {
  const k = d.kpis;
  const lowStockItems = products.filter((p) => p.approvalStatus === 'approved' && p.stock <= 15);
  const delta = (v) => (v == null ? 'فترة جديدة' : `${v >= 0 ? '+' : '−'}${fmtNum(Math.abs(v))}٪ عن الفترة السابقة`);
  const cards = [
    { icon: 'trendUp', title: 'إجمالي المبيعات', value: fmtEGP(k.gross), meta: delta(k.grossDelta), cls: k.grossDelta == null || k.grossDelta >= 0 ? 'ok' : 'er' },
    { icon: 'wallet', title: 'صافي الربح الحقيقي', value: fmtEGP(k.net), meta: `هامش ربح ${fmtNum(k.margin)}٪`, cls: k.net >= 0 ? 'ok' : 'er' },
    { icon: 'calc', title: 'عمولات وضرائب المنصات', value: fmtEGP(k.fees), meta: 'شامل ١٤٪ ق.م', cls: 'wn' },
    { icon: 'ord', title: 'إجمالي الطلبات', value: fmtNum(k.orders) + ' طلب', meta: `${fmtNum(k.deliveryRate)}٪ نسبة تسليم`, cls: 'pr' },
    { icon: 'cod', title: 'تحصيلات COD جاهزة', value: fmtEGP(k.codReady), meta: 'بوسطة · أرامكس · مايلرز', cls: 'ok' }
  ];

  return `
    <div class="row-wrap" style="margin-bottom:20px">
      <div class="seg-rail" role="group" aria-label="تصفية حسب السوق">
        ${[['all', 'كل الأسواق'], ['a', 'أمازون مصر'], ['n', 'نون مصر'], ['j', 'جوميا']].map((m) => `
          <button type="button" class="pill ${state.marketFilter === m[0] ? 'on' : ''}" data-a="mkt-filter" data-v="${m[0]}">${m[1]}</button>
        `).join('')}
      </div>
      <span class="sp"></span>
      <label class="row" style="cursor:pointer;font-size:13px;font-weight:700;gap:7px;background:var(--bg-elev);padding:7px 14px;border-radius:11px;border:1px solid var(--bd);white-space:nowrap;align-items:center" title="تفعيل نموذج gemini-4-argon عالي التفكير لتحليل متجرك واستخراج خطة استراتيجية دقيقة">
        <input type="checkbox" id="chk-high-thinking" ${state.highThinking ? 'checked' : ''} style="cursor:pointer;width:auto;min-height:auto;margin:0" data-a="toggle-thinking">
        ${ico('brain', 15)}
        <span style="white-space:nowrap">وضع التفكير العميق</span>
      </label>
      <button class="btn btn-ac btn-sm" data-a="ai-store-advisor" id="btn-ai-advisor">
        ${ico('ai', 15)}
        <span>${state.highThinking ? 'تحليل استراتيجي فائق' : 'تحليل المتجر بالذكاء الاصطناعي'}</span>
      </button>
    </div>

    ${renderGuidedOnboarding()}

    <div id="ai-advisor-panel" style="margin-bottom:${aiCache.advisor ? '20px' : '0'}">
      ${aiCache.advisor ? renderAdvisor(aiCache.advisor) : ''}
    </div>

    ${!products.length ? renderOnboarding() : ''}

    <div class="grid-kpi">
      ${cards.map((c) => `
        <div class="card kpi-card">
          <div class="kpi-head">
            <span class="mu" style="font-size:13px;font-weight:700">${c.title}</span>
            <span class="kpi-ico" aria-hidden="true">${ico(c.icon, 16)}</span>
          </div>
          <b>${c.value}</b>
          <span class="meta-inline ${c.cls}">${c.meta}</span>
        </div>
      `).join('')}
    </div>

    <div class="grid-2" style="margin-top:18px">
      <div class="card">
        <div class="row-wrap" style="margin-bottom:6px">
          <h3>نمو المبيعات وصافي الأرباح (١٢ شهرًا)</h3>
          <span class="sp"></span>
          <span class="mu" style="font-size:12px">مرّر الماوس على الأعمدة للتفاصيل</span>
        </div>
        ${renderSalesChart(d.months)}
      </div>

      <div class="card">
        <h3>توزيع المبيعات حسب السوق</h3>
        ${['a', 'n', 'j'].map((m) => renderProgressRow(MARKETPLACES[m].name, d.marketShare[m].pct, MARKET_BAR[m], fmtEGP(d.marketShare[m].amount))).join('')}

        <h3 style="margin-top:20px">طرق الدفع المفضلة للعملاء</h3>
        ${renderProgressRow('الدفع عند الاستلام (COD)', d.payShare.cod, 'var(--ac)')}
        ${renderProgressRow('فودافون كاش وإنستاباي', d.payShare.wallet, 'var(--pr)')}
        ${renderProgressRow('البطاقات البنكية وفوري', d.payShare.card, 'var(--wn)')}
      </div>
    </div>

    <div class="grid-2" style="margin-top:18px">
      <div class="card">
        <div class="row" style="margin-bottom:12px">
          <h3>أحدث الطلبات الواردة</h3>
          <span class="sp"></span>
          <a class="pr-tx" style="font-size:13px;font-weight:700" href="#/ord">عرض الكل ◂</a>
        </div>
        ${d.recent.length ? renderTable(
          ['رقم الطلب', 'السوق', 'العميل', 'المحافظة', 'الإجمالي', 'الحالة'],
          d.recent.map((o) => [
            `<b>#${arDigits(o.no)}</b>`,
            renderMarketChip(o.market),
            esc(o.customer),
            esc(o.gov),
            `<b>${fmtEGP(o.total)}</b>`,
            renderBadge((ORDER_STATUS[o.status] || ORDER_STATUS[0]).label, (ORDER_STATUS[o.status] || ORDER_STATUS[0]).cls)
          ])
        ) : '<p class="mu ctr" style="padding:24px">لا توجد طلبات بعد. ستظهر هنا فور تسجيل أول طلب.</p>'}
      </div>

      <div class="card">
        <div class="row" style="margin-bottom:10px">
          <h3>تنبيهات مخزون أوشك على النفاد</h3>
          <span class="sp"></span>
          <a class="pr-tx" style="font-size:13px;font-weight:700" href="#/prod">إدارة المخزون ◂</a>
        </div>
        ${lowStockItems.length ? lowStockItems.map((p) => {
          const sb = getStockBadge(p.stock);
          return `
            <div class="row-wrap" style="padding:9px 0;border-bottom:1px solid var(--bd)">
              <div class="sp" style="min-width:160px">
                <b style="font-size:14px;display:block">${esc(p.name)}</b>
                <small class="mu">SKU: ${esc(p.sku)} · متبقي <b>${fmtNum(p.stock)}</b> قطع</small>
              </div>
              ${renderBadge(sb.text, sb.cls)}
              <button class="btn btn-gh btn-sm" data-a="quick-restock" data-id="${p.id}" title="تزويد ١٠ قطع فورًا">+١٠ قطع</button>
            </div>
          `;
        }).join('') : `<p class="mu ctr" style="padding:20px">${products.length ? 'جميع منتجاتك المعتمدة متوفرة بكميات آمنة!' : 'أضف منتجاتك لتظهر هنا تنبيهات المخزون.'}</p>`}
      </div>
    </div>
  `;
};

// 5.2 صفحة المنتجات والمخزون (#/prod)
const renderProductsTable = () => {
  if (!products.length) {
    return emptyState('📦', 'لا توجد منتجات بعد', 'أضف أول منتج بسعره وتكلفته وكميته لنحسب لك هامش الربح ونتابع مخزونك.', '<button class="btn btn-ac" data-a="add-prod">+ إضافة أول منتج</button>');
  }
  const q = state.prodQuery.trim().toLowerCase();
  const filtered = products.filter(p => {
    const matchesQuery = (p.name + ' ' + p.sku + ' ' + (p.cat || '')).toLowerCase().includes(q);
    const matchesStock =
      state.prodStockFilter === 'all' ||
      (state.prodStockFilter === 'low' && p.stock <= 5) ||
      (state.prodStockFilter === 'warn' && p.stock > 5 && p.stock <= 15) ||
      (state.prodStockFilter === 'ok' && p.stock > 15) ||
      (state.prodStockFilter === 'pending' && p.approvalStatus === 'pending') ||
      (state.prodStockFilter === 'rejected' && p.approvalStatus === 'rejected');
    return matchesQuery && matchesStock;
  });

  return renderTable(
    ['المنتج', 'SKU', 'الأسواق النشطة', 'التكلفة', 'سعر البيع', 'هامش الربح', 'المخزون', 'حالة الاعتماد', 'إجراءات'],
    filtered.map(p => {
      const margin = p.price ? ((p.price - p.cost) / p.price) * 100 : 0;
      const sb = getStockBadge(p.stock);
      return [
        `<div class="row" style="gap:10px">${renderProdThumb(p)}<div><b>${esc(p.name)}</b><br><small class="mu">${esc(p.cat || 'عام')}</small></div></div>`,
        `<code dir="ltr" style="background:var(--bg-sub);padding:2px 7px;border-radius:6px">${esc(p.sku)}</code>`,
        `<div class="row" style="gap:5px;justify-content:flex-end">${['a', 'n', 'j'].map(k => `
          <span style="cursor:pointer;opacity:${p.markets.includes(k) ? '1' : '0.25'}" data-a="toggle-prod-mkt" data-id="${p.id}" data-m="${k}" title="اضغط لتفعيل/إيقاف السوق">
            ${renderMarketChip(k)}
          </span>
        `).join('')}</div>`,
        fmtEGP(p.cost),
        `<b>${fmtEGP(p.price)}</b>`,
        renderBadge(fmtNum(margin) + '٪', margin >= 25 ? 'ok' : margin >= 12 ? 'wn' : 'er'),
        `<div><b>${fmtNum(p.stock)}</b> ${renderBadge(sb.text, sb.cls)}</div>`,
        renderApprovalBadge(p.approvalStatus, p.rejectReason),
        `<div class="row" style="gap:6px;justify-content:flex-end">
          <button class="btn btn-gh btn-sm" data-a="edit-prod" data-id="${p.id}">✎ تعديل</button>
          <button class="btn btn-gh btn-sm" data-a="quick-restock" data-id="${p.id}">+١٠</button>
        </div>`
      ];
    })
  );
};

views.prod = () => `
  <div class="card">
    <div class="row-wrap" style="margin-bottom:14px">
      <span class="pill ${state.prodStockFilter === 'all' ? 'on' : ''}" data-a="prod-flt" data-v="all">الكل (${fmtNum(products.length)})</span>
      <span class="pill ${state.prodStockFilter === 'ok' ? 'on' : ''}" data-a="prod-flt" data-v="ok">متوفر</span>
      <span class="pill ${state.prodStockFilter === 'warn' ? 'on' : ''}" data-a="prod-flt" data-v="warn">قارب النفاد</span>
      <span class="pill ${state.prodStockFilter === 'low' ? 'on' : ''}" data-a="prod-flt" data-v="low">منخفض جدًا</span>
      <span class="pill ${state.prodStockFilter === 'pending' ? 'on' : ''}" data-a="prod-flt" data-v="pending">قيد المراجعة</span>
      <span class="pill ${state.prodStockFilter === 'rejected' ? 'on' : ''}" data-a="prod-flt" data-v="rejected">مرفوض</span>
      <span class="sp"></span>
      <button class="btn btn-gh btn-sm" data-a="export-prod-csv">📥 تصدير الكتالوج CSV</button>
      <button class="btn btn-ac btn-sm" data-a="add-prod">+ إضافة منتج جديد</button>
    </div>
    <input data-i="prod-search" placeholder="🔍 ابحث باسم المنتج أو كود SKU أو الفئة..." value="${esc(state.prodQuery)}">
    <p class="mu" style="font-size:12.5px;margin-bottom:10px">ملاحظة: المنتجات الجديدة تبدأ بحالة «قيد المراجعة»، والمنتجات المعتمدة (✓) فقط هي التي تُحتسب في رصيد المزامنة مع المنصات.</p>
    <div id="prod-table-box">${renderProductsTable()}</div>
  </div>
`;

// 5.3 صفحة الطلبات والفواتير (#/ord)
const renderPager = (d) => (d.pages > 1 ? `
  <div class="pager">
    <button class="btn btn-gh btn-sm" data-a="ord-page" data-v="${d.page - 1}" ${d.page <= 1 ? 'disabled' : ''}>▸ السابق</button>
    <span class="mu">صفحة ${fmtNum(d.page)} من ${fmtNum(d.pages)} · ${fmtNum(d.total)} طلب</span>
    <button class="btn btn-gh btn-sm" data-a="ord-page" data-v="${d.page + 1}" ${d.page >= d.pages ? 'disabled' : ''}>التالي ◂</button>
  </div>
` : `<p class="mu pager-note">${fmtNum(d.total)} طلب</p>`);

const renderOrdersTable = (d) => {
  d.items.forEach((o) => ordersById.set(o.id, o));
  if (!d.total && !state.orderQuery && state.orderStatusFilter < 0) {
    return emptyState('🧾', 'لا توجد طلبات بعد', 'سجّل أول طلب ليُخصم المخزون تلقائيًا وتُحسب أرباحك.', '<button class="btn btn-ac" data-a="new-order">+ طلب جديد</button>');
  }
  return renderTable(
    ['رقم الطلب', 'السوق', 'العميل / المنتجات', 'المحافظة', 'الدفع / الشحن', 'الإجمالي', 'حالة الشحن', 'الاعتماد', 'إجراءات'],
    d.items.map((o) => {
      const stObj = ORDER_STATUS[o.status] || ORDER_STATUS[0];
      return [
        `<b>#${arDigits(o.no)}</b><br><small class="mu">${fmtDate(o.createdAt)}</small>`,
        renderMarketChip(o.market),
        `<div><b>${esc(o.customer)}</b>${o.phone ? `<br><small dir="ltr" class="mu">${esc(o.phone)}</small>` : ''}<br><small class="mu">${esc(o.items || 'منتجات متنوعة')}</small></div>`,
        esc(o.gov),
        `<div>${esc(o.pay)}<br><small class="mu">${esc(o.courier)}</small></div>`,
        `<b>${fmtEGP(o.total)}</b>`,
        `<div>${renderBadge(stObj.label, stObj.cls)}${o.status === 4 && o.cancelReason ? `<small class="er-tx" style="display:block;font-size:11px;margin-top:2px">${esc(o.cancelReason)}</small>` : ''}</div>`,
        renderApprovalBadge(o.approvalStatus, o.rejectReason),
        `<div class="row" style="gap:6px;flex-wrap:wrap;justify-content:flex-end">
          ${o.status === 0 && o.approvalStatus !== 'rejected' ? `
            <button class="btn btn-gh btn-sm" data-a="set-status" data-id="${o.id}" data-s="1">تم الشحن ◂</button>
            <button class="btn btn-er btn-sm" data-a="cancel-order" data-id="${o.id}" title="إلغاء الطلب وإرجاع المخزون">✕ إلغاء</button>
          ` : ''}
          ${o.status === 1 ? `
            <button class="btn btn-gh btn-sm" data-a="set-status" data-id="${o.id}" data-s="2">تم التسليم ✓</button>
            <button class="btn btn-gh btn-sm" data-a="set-status" data-id="${o.id}" data-s="3" title="رفض العميل الاستلام">↩ مرتجع</button>` : ''}
          <button class="btn btn-gh btn-sm" style="color:var(--pr)" data-a="ai-order-msg" data-id="${o.id}">💬 رسالة ذكية</button>
          <button class="btn btn-gh btn-sm" data-a="view-invoice" data-id="${o.id}">🧾 فاتورة</button>
        </div>`
      ];
    })
  ) + renderPager(d);
};

views.ord = (d) => `
  <div class="card">
    <div class="row-wrap" style="margin-bottom:16px">
      ${[[-1, 'كل الطلبات'], [0, 'قيد التجهيز'], [1, 'تم الشحن'], [2, 'تم التسليم'], [3, 'مرتجع'], [4, 'ملغى']].map((s) => `
        <span class="pill ${state.orderStatusFilter === s[0] ? 'on' : ''}" data-a="ord-flt" data-v="${s[0]}">${s[1]}</span>
      `).join('')}
      <span class="sp"></span>
      <button class="btn btn-ac btn-sm" data-a="new-order">+ طلب جديد</button>
      <button class="btn btn-gh btn-sm" data-a="bulk-awb">🚚 بوالص الشحن (${fmtNum(counts.pendingOrders)})</button>
      <button class="btn btn-gh btn-sm" data-a="export-ord-csv">📥 تصدير CSV</button>
      <input class="ord-search-input" style="width:230px;margin:0" placeholder="🔍 ابحث برقم الطلب أو العميل..." aria-label="بحث في الطلبات" value="${esc(state.orderQuery)}" data-i="ord-search">
    </div>
    <div id="ord-table-box">${renderOrdersTable(d)}</div>
  </div>
`;

// 5.4 صفحة تحصيلات الشحن COD (#/cod)
const COURIER_TITLES = { bosta: 'بوسطة (Bosta)', aramex: 'أرامكس (Aramex)', mylerz: 'مايلرز (Mylerz)' };

views.cod = (d) => {
  const t = d.totals;
  const ipa = d.instaPayHandle || state.instaPayHandle;
  const kpi = (title, value, badge) => `
    <div class="card kpi-card">
      <span class="mu" style="font-size:13px;font-weight:700">${title}</span>
      <b>${value}</b>
      <div>${badge}</div>
    </div>`;
  return `
    <div class="grid-kpi">
      ${kpi('رصيد جاهز للتحويل (بعد الرسوم)', fmtEGP(t.net), renderBadge('جاهز للسحب الفوري', 'ok'))}
      ${kpi('شحنات قيد التوصيل', fmtEGP(t.pending), renderBadge('لم تُحصَّل بعد', 'pr'))}
      ${kpi('رسوم الشحن المخصومة', fmtEGP(t.fees), renderBadge('على الرصيد الحالي', 'wn'))}
      ${kpi('حساب الاستلام (InstaPay)', `<span dir="ltr" style="font-size:17px">${ipa ? esc(ipa) : 'غير مُضاف'}</span>`,
        ipa ? renderBadge('InstaPay جاهز', 'ok') : '<a class="pr-tx" href="#/set" style="font-size:12.5px;font-weight:700">أضف حساب InstaPay ◂</a>')}
    </div>

    <div class="grid-cards" style="margin-top:18px">
      ${d.couriers.map((c) => `
        <div class="card">
          <div class="row" style="margin-bottom:10px">
            <h3>${COURIER_TITLES[c.key]}</h3>
            <span class="sp"></span>
            ${renderBadge(c.cycle, 'pr')}
          </div>
          <div class="row" style="padding:6px 0"><span class="mu">محصّل لم يُسوَّ بعد</span><span class="sp"></span><b>${fmtEGP(c.collected)}</b></div>
          <div class="row" style="padding:6px 0"><span class="mu">قيد التوصيل</span><span class="sp"></span><b>${fmtEGP(c.pending)}</b></div>
          <div class="row" style="padding:6px 0"><span class="mu">رسوم مخصومة</span><span class="sp"></span><b class="er-tx">− ${fmtEGP(c.fees)}</b></div>
          <div class="row" style="padding:10px 0 0;border-top:1px solid var(--bd);margin-top:6px">
            <b>صافي القابل للسحب</b><span class="sp"></span><b class="ok-tx" style="font-size:18px">${fmtEGP(c.net)}</b>
          </div>
          <button class="btn ${c.net > 0 ? 'btn-ac' : 'btn-gh'}" style="width:100%;margin-top:12px" data-a="payout-cod" data-k="${c.key}" ${c.net > 0 ? '' : 'disabled'}>
            ${c.net > 0 ? '💸 طلب تحويل فوري (InstaPay)' : 'لا يوجد رصيد للسحب حاليًا'}
          </button>
        </div>
      `).join('')}
    </div>
    <p class="mu" style="font-size:12.5px;margin-top:14px">الأرصدة تُحسب آليًا من طلباتك: يدخل الطلب في «المحصّل» عند تسجيل تسليمه وتُخصم رسوم الشحن التقديرية، ثم يُسوَّى عند تسجيل التحويل إلى حسابك على إنستاباي.</p>
  `;
};

// 5.5 صفحة الذكاء الاصطناعي (#/ai)
const renderAIListingCards = (data) => {
  const suggestions = [
    { m: 'a', name: 'عنوان متوافق مع خوارزمية أمازون مصر (A9)', text: data.amazonTitle },
    { m: 'n', name: 'عنوان جذاب لمنصة نون مصر (Noon SEO)', text: data.noonTitle },
    { m: 'j', name: 'عنوان ترويجي لمنصة جوميا (Jumia)', text: data.jumiaTitle }
  ];

  return `
    <div class="row-wrap" style="margin-bottom:10px">
      <span class="ai-badge">${data.source === 'gemini' ? '✨ تم التوليد بواسطة Gemini' : '📝 قالب جاهز — فعّل مفتاح Gemini للتوليد الذكي'}</span>
      <span class="sp"></span>
      ${data.pricingTip ? renderBadge(esc(data.pricingTip), 'ok') : ''}
    </div>
    ${suggestions.map((s, idx) => `
      <div class="card" style="margin-bottom:12px">
        <div class="row" style="margin-bottom:6px">
          ${renderMarketChip(s.m)}
          <b style="font-size:14px">${s.name}</b>
          <span class="sp"></span>
          <button class="btn btn-gh btn-sm" data-a="copy-tx" data-target="ai-t-${idx}">📋 نسخ</button>
        </div>
        <p id="ai-t-${idx}" style="background:var(--bg);padding:10px;border-radius:8px;font-weight:600">${esc(s.text)}</p>
      </div>
    `).join('')}
    <div class="card" style="margin-bottom:12px">
      <div class="row" style="margin-bottom:8px">
        <b>الوصف التسويقي والنقاط البيعية (Bullet Points)</b>
        <span class="sp"></span>
        <button class="btn btn-gh btn-sm" data-a="copy-tx" data-target="ai-desc-box">${ico('copy', 14)} نسخ الوصف</button>
      </div>
      <div id="ai-desc-box" style="background:var(--bg);padding:12px;border-radius:10px;font-size:14px">
        <p>${esc(data.descriptionIntro)}</p>
        <ul style="padding-inline-start:20px;margin:8px 0">
          ${(data.bulletPoints || []).map(bp => `<li>${esc(bp)}</li>`).join('')}
        </ul>
        <p class="mu" style="font-size:12.5px;margin-top:8px"><b>الكلمات المفتاحية المقترحة (SEO Keywords):</b> ${esc(data.keywords)}</p>
      </div>
    </div>
    ${Array.isArray(data.aplusHighlights) && data.aplusHighlights.length ? `
      <div class="card">
        <div class="row" style="margin-bottom:10px">
          <b>شرائح محتوى A+ الجاهزة لصفحة المنتج</b>
          <span class="sp"></span>
          <span class="meta-inline pr">متوافق مع أمازون ونون</span>
        </div>
        <div class="aplus-grid">
          ${data.aplusHighlights.map((h, i) => `
            <div class="aplus-tile">
              <span class="step-num">0${i + 1}.</span>
              <b style="display:block;margin-bottom:4px;font-size:14px">${esc(h.title)}</b>
              <p class="mu" style="font-size:12.5px;line-height:1.65;margin:0">${esc(h.body)}</p>
            </div>
          `).join('')}
        </div>
      </div>
    ` : ''}
  `;
};

const renderPhotoStudioTab = () => {
  const ps = growthState.photoStudio;
  const presets = [
    { id: 'pure-white', label: 'أبيض نقي #FFFFFF (أمازون / نون)', desc: 'معتمد للصورة الرئيسية' },
    { id: 'studio-pearl', label: 'استوديو لؤلؤي فاخر', desc: 'إضاءة ناعمة + شارة جودة' },
    { id: 'promo-ocean', label: 'عرض ترويجي مميز', desc: 'للسوشيال وصفحات A+' }
  ];
  return `
    <div class="grid-2">
      <div class="card">
        <div class="row" style="margin-bottom:8px">
          <h3>استوديو صور المنتجات الذكي</h3>
          <span class="sp"></span>
          <span class="ai-badge">${ico('camera', 13)} Photo Studio</span>
        </div>
        <p class="mu" style="font-size:13.5px;margin-bottom:14px">جهّز صور منتجاتك بمقاسات وخلفيات متوافقة مع شروط أمازون مصر ونون وجوميا واحفظها مباشرة على منتجك في الكتالوج.</p>

        <label for="ps-prod-sel">اختر منتجًا من كتالوجك (لتطبيق الصورة عليه مباشرة)</label>
        <select id="ps-prod-sel" data-i="ps-select-prod">
          <option value="">— اختر منتجًا من الكتالوج —</option>
          ${products.map((p) => `<option value="${p.id}" ${String(ps.productId) === String(p.id) ? 'selected' : ''}>${esc(p.name)} (${fmtEGP(p.price)})</option>`).join('')}
        </select>

        <label for="ps-file-in">ارفع صورة المنتج (PNG / JPG — اختياري)</label>
        <input id="ps-file-in" type="file" accept="image/*" data-i="ps-upload-file" style="padding:8px">

        <label>اختر نمط الخلفية</label>
        <div class="ps-presets-grid">
          ${presets.map((pr) => `
            <button type="button" class="ps-preset-btn ${ps.preset === pr.id ? 'on' : ''}" data-a="ps-preset" data-v="${pr.id}">
              <b>${pr.label}</b>
              <small class="mu">${pr.desc}</small>
            </button>
          `).join('')}
        </div>

        <div class="grid-equal" style="gap:12px;margin-top:12px">
          <div>
            <label for="ps-title-in">عنوان العرض (في نمط الاستوديو والعرض)</label>
            <input id="ps-title-in" value="${esc(ps.title)}" placeholder="مثال: سماعة أنكر Soundcore R50i" data-i="ps-text-change">
          </div>
          <div>
            <label for="ps-badge-in">شارة الجودة / العرض</label>
            <input id="ps-badge-in" value="${esc(ps.badgeText)}" placeholder="مثال: أصلي ١٠٠٪ · ضمان سنة" data-i="ps-text-change">
          </div>
        </div>

        <div class="grid-equal" style="gap:12px">
          <div>
            <label for="ps-price-in">السعر المعروض (اختياري)</label>
            <input id="ps-price-in" value="${esc(ps.priceText)}" placeholder="مثال: ٧٥٠ ج.م" data-i="ps-text-change">
          </div>
          <div>
            <label>مقاس الصورة</label>
            <div class="seg-rail" style="width:100%">
              <button type="button" class="pill sp ${ps.ratio === '1:1' ? 'on' : ''}" data-a="ps-ratio" data-v="1:1">1:1 مربع (أمازون)</button>
              <button type="button" class="pill sp ${ps.ratio === '4:5' ? 'on' : ''}" data-a="ps-ratio" data-v="4:5">4:5 عمودي (نون)</button>
            </div>
          </div>
        </div>

        <div class="row-wrap" style="margin-top:14px;gap:10px">
          <button type="button" class="btn btn-ac sp" data-a="ps-save-to-prod" id="btn-ps-save">${ico('checkCircle', 16)} حفظ الصورة للمنتج في الكتالوج</button>
          <button type="button" class="btn btn-gh" data-a="ps-download">${ico('download', 16)} تحميل JPG</button>
        </div>
      </div>

      <div class="card photo-studio-stage">
        <div class="row" style="width:100%;margin-bottom:10px">
          <b>المعاينة الحية للصورة (${ps.ratio})</b>
          <span class="sp"></span>
          <span class="meta-inline ok">دقة عالية 800px</span>
        </div>
        <canvas id="ps-canvas" class="ps-canvas" width="800" height="800" aria-label="معاينة صورة المنتج في الاستوديو"></canvas>
      </div>
    </div>
  `;
};

const renderPriceRadarTab = () => `
  <div class="grid-2">
    <div class="card ai-glow">
      <div class="row" style="margin-bottom:8px">
        <h3>رادار أسعار المنافسين في السوق المصري</h3>
        <span class="sp"></span>
        <span class="ai-badge">${ico('globe', 13)} Price Radar</span>
      </div>
      <p class="mu" style="font-size:13.5px;margin-bottom:14px">أدخل اسم أي منتج أو اختره من كتالوجك لمعرفة النطاق السعري التنافسي عبر أمازون مصر ونون وجوميا وترينديول والسعر المقترح لحماية هامشك.</p>

      <label for="radar-prod-sel">اختر من منتجاتك (اختياري)</label>
      <select id="radar-prod-sel" data-i="radar-select-prod">
        <option value="">— اختر منتجًا لفحص أسعاره —</option>
        ${products.map((p) => `<option value="${esc(p.name)}">${esc(p.name)} (سعرك الحالي: ${fmtEGP(p.price)})</option>`).join('')}
      </select>

      <label for="radar-name">اسم المنتج أو الموديل</label>
      <input id="radar-name" maxlength="140" placeholder="مثال: شاحن سريع GaN 65W أو سماعة أنكر R50i" value="${esc(aiCache.market ? aiCache.market.name : '')}">

      <button type="button" class="btn btn-ac" style="width:100%;margin-top:6px" id="btn-radar-run" data-a="ai-radar-search">${ico('globe', 16)} فحص ومقارنة أسعار السوق الآن</button>
    </div>

    <div id="ai-market-box">
      ${(aiCache.market ? renderMarketResearch(aiCache.market) : '') || emptyState('globe', 'ابدأ فحص أسعار المنافسين', 'اختر منتجًا من كتالوجك أو اكتب اسمه واضغط «فحص ومقارنة أسعار السوق الآن» للحصول على نطاق الأسعار بالجنيه.')}
    </div>
  </div>
`;

const renderSellerChatTab = () => {
  const starters = [
    'متى أختار الشحن عبر أمازون FBA مقابل FBM في مصر؟',
    'كيف أفعّل شارة Noon Express وأتجنب رفض الصور؟',
    'ما أفضل خطة لتقليل مرتجعات الدفع عند الاستلام (RTO)؟',
    'كيف أحسب ضريبة القيمة المضافة ١٤٪ وهامش الربح الصافي؟'
  ];
  return `
    <div class="card ai-chat-shell">
      <div class="row-wrap" style="padding-bottom:12px;border-bottom:1px solid var(--bd);margin-bottom:12px">
        <div class="row" style="gap:10px">
          <span class="topbar-icon-box" aria-hidden="true">${ico('message', 19)}</span>
          <div>
            <h3 style="margin:0;font-size:16.5px">المساعد الذكي لبائعي OrderFlow</h3>
            <small class="mu">خبير متاح ٢٤/٧ للإجابة على أسئلة أمازون SPN ونون FBPI وجوميا والربحية والضرائب</small>
          </div>
        </div>
        <span class="sp"></span>
        <span class="meta-inline ok">مرتبط ببيانات متجرك</span>
      </div>

      <div class="ai-chat-starters">
        ${starters.map((q) => `<button type="button" class="pill" data-a="ai-chat-quick" data-q="${esc(q)}">${esc(q)}</button>`).join('')}
      </div>

      <div class="ai-chat-messages" id="ai-chat-messages">
        ${growthState.aiChat.map((m) => `
          <div class="ai-chat-bubble ${m.role === 'user' ? 'user' : 'assistant'}">
            <div class="ai-chat-role">${m.role === 'user' ? 'أنت' : 'مساعد OrderFlow الذكي'}</div>
            <div class="ai-chat-text">${esc(m.text).replace(/\n/g, '<br>')}</div>
          </div>
        `).join('')}
      </div>

      <form class="ai-chat-form" data-submit="ai-chat-send">
        <input id="ai-chat-input" maxlength="500" placeholder="اكتب سؤالك عن متجرك أو أمازون أو نون أو الإعلانات الممولة..." aria-label="سؤالك للمساعد الذكي" style="margin:0">
        <button type="submit" class="btn btn-ac" id="btn-ai-chat-send">${ico('send', 16)} إرسال</button>
      </form>
    </div>
  `;
};

views.ai = () => {
  const tab = growthState.aiTab || 'listing';
  const tabs = [
    { id: 'listing', icon: 'ai', label: 'استوديو المحتوى و A+' },
    { id: 'photo', icon: 'camera', label: 'استوديو صور المنتجات' },
    { id: 'radar', icon: 'globe', label: 'رادار أسعار المنافسين' },
    { id: 'chat', icon: 'message', label: 'المساعد الذكي للبائعين' }
  ];

  let body = '';
  if (tab === 'photo') {
    body = renderPhotoStudioTab();
  } else if (tab === 'radar') {
    body = renderPriceRadarTab();
  } else if (tab === 'chat') {
    body = renderSellerChatTab();
  } else {
    body = `
      <div class="grid-2">
        <div>
          <div class="card ai-glow" style="margin-bottom:18px">
            <div class="row" style="margin-bottom:8px">
              <h3>استوديو صفحات المنتجات و A+ بذكاء Gemini</h3>
              <span class="sp"></span>
              <span class="ai-badge">${ico('ai', 13)} Listing + A+</span>
            </div>
            <p class="mu" style="font-size:13.5px;margin-bottom:14px">اختر منتجًا من كتالوجك أو اكتب مواصفاته، لتوليد عناوين SEO متوافقة مع أمازون A9 ونون وجوميا + ٣ شرائح محتوى A+ جاهزة للنشر.</p>

            <label for="ai-select-prod-el">اختر من منتجاتك الحالية (اختياري)</label>
            <select id="ai-select-prod-el" data-i="ai-select-prod">
              <option value="">— اختر منتجًا لتعبئة البيانات تلقائيًا —</option>
              ${products.map(p => `<option value="${p.id}">${esc(p.name)} (${fmtEGP(p.price)})</option>`).join('')}
            </select>

            <label for="ai-name">اسم المنتج الأساسي</label>
            <input id="ai-name" maxlength="140" placeholder="مثال: سماعة بلوتوث لاسلكية عازلة للضوضاء">

            <label for="ai-feats">أهم المميزات والمواصفات (افصل بينها بفاصلة)</label>
            <input id="ai-feats" maxlength="400" placeholder="مثال: بطارية ٣٠ ساعة، مايك عازل للضوضاء، ضمان سنة">

            <label for="ai-tone">نبرة الكتابة التسويقية</label>
            <select id="ai-tone">
              <option value="احترافية مقنعة تناسب المتسوق المصري">احترافية مقنعة تناسب المتسوق المصري</option>
              <option value="ترويجية حماسية تركز على العروض والتوفير">ترويجية حماسية تركز على العروض والتوفير</option>
              <option value="لهجة مصرية قريبة وبسيطة تزيد الثقة">لهجة مصرية قريبة وبسيطة تزيد الثقة</option>
              <option value="تقنية دقيقة تبرز المواصفات الفنية والجودة">تقنية دقيقة تبرز المواصفات الفنية والجودة</option>
            </select>

            <div class="row-wrap" style="margin-top:6px">
              <button class="btn btn-ac sp" id="btn-ai-gen" data-a="ai-generate">${ico('ai', 16)} توليد المحتوى و A+</button>
              <button class="btn btn-gh" id="btn-ai-search" data-a="ai-market-search" title="فحص أسعار المنتج في السوق المصري">${ico('globe', 16)} فحص أسعار السوق</button>
            </div>
          </div>

          <div id="ai-market-box">
            ${(aiCache.market ? renderMarketResearch(aiCache.market) : '')}
          </div>
        </div>

        <div id="ai-output">
          ${aiListing ? renderAIListingCards(aiListing) : emptyState('ai', 'جاهز لكتابة قوائم منتجاتك ومحتوى A+', 'اختر منتجًا من كتالوجك أو اكتب مواصفاته ثم اضغط «توليد المحتوى و A+».')}
        </div>
      </div>
    `;
  }

  return `
    <div class="row-wrap" style="margin-bottom:18px">
      <div class="seg-rail" role="tablist" aria-label="أدوات استوديو الذكاء الاصطناعي">
        ${tabs.map((t) => `
          <button type="button" role="tab" aria-selected="${tab === t.id}" class="pill ${tab === t.id ? 'on' : ''}" data-a="switch-ai-tab" data-v="${t.id}">
            ${ico(t.icon, 15)}
            <span>${t.label}</span>
          </button>
        `).join('')}
      </div>
    </div>
    ${body}
  `;
};

// 5.6 حاسبة الأرباح (#/calc)
function renderProfitCalcResult(args) {
  const b = UI.computeProfitBreakdown(args);

  const rowItem = (label, val, sub = '') => `
    <div class="row" style="padding:9px 0;border-bottom:1px solid var(--bd)">
      <span class="sp">${label} <small class="mu">${sub}</small></span>
      <b>${fmtEGP(val)}</b>
    </div>
  `;

  return `
    <div>
      <h3>تحليل ربحية القطعة الواحدة</h3>
      <div class="calc-bar">
        <i style="height:100%;width:${b.segments.cost}%;background:#64748b" title="تكلفة المنتج"></i>
        <i style="height:100%;width:${b.segments.ship}%;background:#0B57A4" title="الشحن ومرتجعات"></i>
        <i style="height:100%;width:${b.segments.fees}%;background:#0EA5C6" title="عمولة المنصة والضريبة"></i>
        <i style="height:100%;width:${b.segments.profit}%;background:#047857" title="صافي الربح"></i>
      </div>
      <div class="calc-legend">
        <span><i style="background:#64748b"></i> التكلفة</span>
        <span><i style="background:#0B57A4"></i> الشحن وRTO</span>
        <span><i style="background:#0EA5C6"></i> العمولات والضريبة</span>
        <span><i style="background:#047857"></i> صافي الربح</span>
      </div>

      ${rowItem('سعر البيع للعميل', b.price)}
      ${rowItem('تكلفة شراء / تصنيع المنتج', b.cost)}
      ${rowItem('عمولة المنصة', b.platformFee, `(${fmtNum(b.commPct)}٪)`)}
      ${rowItem('ضريبة القيمة المضافة على العمولة', b.vatOnFee, '(١٤٪ قانوني)')}
      ${rowItem('تكلفة الشحن والتغليف', b.ship)}
      ${rowItem('مخصص خسارة رفض الاستلام (RTO)', b.rtoLoss, `(${fmtNum(b.rtoPct)}٪ مرتجع)`)}
    </div>

    <div style="margin-top:16px;padding-top:14px;border-top:1px solid var(--bd)">
      <div class="row">
        <span class="sp"><b>صافي الربح في جيبك للقطعة</b></span>
        <b class="${b.netProfit < 0 ? 'er-tx' : 'ok-tx'}" style="font-size:27px;font-family:var(--font-display)">${fmtEGP(b.netProfit)}</b>
      </div>
      <div class="row" style="margin-top:6px">
        <span class="sp mu">هامش الربح الصافي</span>
        <span class="meta-inline ${b.netProfit < 0 ? 'er' : b.margin < 12 ? 'wn' : 'ok'}">${fmtNum(b.margin)}٪</span>
      </div>
      <div class="row" style="margin-top:10px;padding-top:10px;border-top:1px dashed var(--bd);font-size:13px">
        <span class="sp mu">نقطة التعادل (أقل سعر بيع لتجنب الخسارة):</span>
        <b>${fmtEGP(b.breakEven)}</b>
      </div>
    </div>
  `;
}

views.calc = () => `
  <div class="grid-2">
    <div class="card">
      <h3>حاسبة أرباح المنصات المصرية</h3>
      <p class="mu" style="font-size:13.5px;margin-bottom:14px">احسب ربحك الصافي بدقة شاملة ١٤٪ ضريبة القيمة المضافة على رسوم المنصة ومخصص رفض الاستلام.</p>

      <label for="c-mkt-sel">اختر المنصة لتعبئة العمولة التقريبية</label>
      <select id="c-mkt-sel" data-i="calc-mkt">
        <option value="12">أمازون مصر (متوسط عمولة ١٢٪)</option>
        <option value="10">نون مصر (متوسط عمولة ١٠٪)</option>
        <option value="11">جوميا مصر (متوسط عمولة ١١٪)</option>
      </select>

      <div class="grid-equal" style="gap:12px">
        <div>
          <label for="c-comm">عمولة الفئة (٪)</label>
          <input id="c-comm" type="number" value="12" data-i="calc-run">
        </div>
        <div>
          <label for="c-price">سعر البيع للعميل (ج.م)</label>
          <input id="c-price" type="number" value="450" data-i="calc-run">
        </div>
      </div>

      <div class="grid-equal" style="gap:12px">
        <div>
          <label for="c-cost">تكلفة المنتج عليك (ج.م)</label>
          <input id="c-cost" type="number" value="250" data-i="calc-run">
        </div>
        <div>
          <label for="c-ship">الشحن والتغليف (ج.م)</label>
          <input id="c-ship" type="number" value="38" data-i="calc-run">
        </div>
      </div>

      <label for="c-rto">نسبة رفض الاستلام المتوقعة (٪ RTO)</label>
      <input id="c-rto" type="number" value="5" data-i="calc-run">
    </div>

    <div class="card" id="calc-res-box" style="display:flex;flex-direction:column;justify-content:space-between">
      ${renderProfitCalcResult([12, 450, 250, 38, 5])}
    </div>
  </div>
`;

// 5.7 صفحة التكاملات (#/int)
const INTEGRATIONS_GROUPS = [
  {
    title: 'الأسواق الإلكترونية الإقليمية والمحلية (Marketplaces)',
    items: [
      { key: 'a', name: 'أمازون مصر (Amazon SPN / Seller Central)', sub: 'مزامنة المخزون، الأسعار، والطلبات FBA / FBM' },
      { key: 'n', name: 'نون مصر والخليج (Noon FBPI Partners)', sub: 'مزامنة الكتالوج والطلبات السريعة Noon Express' },
      { key: 'j', name: 'جوميا مصر (Jumia AMP Vendor Center)', sub: 'ربط المنتجات وبوالص الشحن المعتمدة' },
      { key: 't', name: 'ترينديول (Trendyol API)', sub: 'التوسع الإقليمي ومزامنة الكتالوج والطلبات' },
      { key: 'k', name: 'كنز مصر (Kenzz Egypt)', sub: 'ربط الكتالوج ومبيعات السوق المصري' }
    ]
  },
  {
    title: 'شركات الشحن والتحصيل (Couriers & COD)',
    items: [
      { key: 'bs', name: 'بوسطة (Bosta Egypt)', sub: 'إصدار بوالص الشحن وتتبّع تحصيلات COD' },
      { key: 'ar', name: 'أرامكس (Aramex)', sub: 'شحن لجميع محافظات الجمهورية' },
      { key: 'my', name: 'مايلرز (Mylerz)', sub: 'توصيل سريع في نفس اليوم للقاهرة والإسكندرية' }
    ]
  },
  {
    title: 'المدفوعات ومنظومة الضرائب المصرية',
    items: [
      { key: 'eta', name: 'منظومة الفاتورة الإلكترونية (ETA)', sub: 'مصلحة الضرائب المصرية · إصدار فواتير QR' },
      { key: 'fw', name: 'فوري باي (Fawry Pay)', sub: 'تحصيل المدفوعات الإلكترونية' },
      { key: 'vc', name: 'فودافون كاش وإنستاباي', sub: 'تسوية الحسابات والمحافظ الذكية' }
    ]
  }
];

const API_PLATFORM_KEYS = ['a', 'n', 'j', 't', 'k'];

function getPlatformConnection(key) {
  return (state.marketplaceConnections || []).find((c) => c.platform === key) || null;
}

function formatApiIdentity(key, conn) {
  if (!conn || !conn.credentials) return '';
  const c = conn.credentials;
  if (key === 'a' && c.sellerId) return `Seller ID: ${c.sellerId}`;
  if (key === 'n' && c.projectCode) return `Project: ${c.projectCode}`;
  if (key === 'j' && c.shopId) return `Shop: ${c.shopId}`;
  if (key === 't' && c.supplierId) return `Supplier #${c.supplierId}`;
  if (key === 'k' && c.storeId) return `Store: ${c.storeId}`;
  return '';
}

function renderApiStatusLine(conn, isOn) {
  if (!conn || !conn.configured) {
    return `<span class="mp-api-pill mp-api-pill--idle">غير مربوط بـ API</span>
      <small class="mu">${isOn ? 'تفعيل محلي فقط — أضف مفتاح API للسحب الفوري' : 'أضف مفتاح API للاتصال المباشر بالمنصة'}</small>`;
  }
  if (conn.status === 'connected') {
    const st = conn.stats || {};
    const statsTxt = (st.importedProducts || st.importedOrders || st.updatedProducts)
      ? ` · آخر سحب: +${fmtNum(st.importedProducts || 0)} منتج، +${fmtNum(st.importedOrders || 0)} طلب`
      : '';
    return `<span class="mp-api-pill mp-api-pill--ok">متصل بالـ API ✓</span>
      <small class="ok-tx" style="font-weight:600">${conn.lastSyncAt ? 'آخر مزامنة: ' + fmtDateTime(conn.lastSyncAt) : 'تم التحقق من الاتصال بنجاح'}${statsTxt}</small>`;
  }
  if (conn.status === 'error') {
    return `<span class="mp-api-pill mp-api-pill--err">خطأ في الاتصال</span>
      <small class="er-tx" style="font-weight:600">${esc(conn.lastError || 'تحقق من صحة مفاتيح API')}</small>`;
  }
  return `<span class="mp-api-pill mp-api-pill--warn">مفتاح API محفوظ</span>
    <small class="mu">اضغط «اختبار الاتصال» أو «سحب البيانات» لبدء التشغيل الفوري</small>`;
}

views.int = () => {
  const conns = state.marketplaceConnections || [];
  const connectedApiCount = conns.filter((c) => c.configured).length;
  return `
    <div class="card mp-api-banner">
      <div class="row-wrap" style="gap:14px">
        <div class="sp">
          <div class="row" style="gap:8px;margin-bottom:6px">
            <span class="meta-inline pr">${ico('lock', 14)} ربط API مباشر ومشفّر بـ AES-256-GCM</span>
            <span class="badge ${connectedApiCount ? 'ok' : ''}">${fmtNum(connectedApiCount)} / ٥ منصات مربوطة بـ API</span>
          </div>
          <h3 style="margin:0 0 4px;font-size:17px">أدخل مفتاح API لكل منصة ليبدأ الموقع بالاتصال وسحب بياناتك فورًا</h3>
          <p class="mu" style="font-size:13px;margin:0;max-width:74ch">تُحفظ مفاتيحك مشفّرة بالكامل على الخادم ولا تُعرض بالنص الصريح أبدًا. بمجرد إدخال مفتاح أي منصة يمكنك اختبار الاتصال وسحب المنتجات والطلبات والمخزون مباشرةً.</p>
        </div>
        <button type="button" class="btn btn-ac btn-sm" data-a="sync-now">${ico('sync', 15)} مزامنة جميع المنصات المتصلة</button>
      </div>
    </div>

    ${INTEGRATIONS_GROUPS.map((g, gi) => `
      <h3 style="margin:22px 0 12px">${g.title}</h3>
      <div class="${gi === 0 ? 'mp-api-grid' : 'grid-cards'}">
        ${g.items.map((item) => {
          const isOn = !!state.integrations[item.key];
          if (API_PLATFORM_KEYS.includes(item.key)) {
            const conn = getPlatformConnection(item.key);
            const idLabel = formatApiIdentity(item.key, conn);
            return `
              <div class="card mp-api-card" data-platform="${item.key}">
                <div class="mp-api-head">
                  ${renderMarketChip(item.key, 42)}
                  <div class="sp" style="min-width:0">
                    <b style="display:block;font-size:15px">${item.name}</b>
                    <p class="mu" style="font-size:12.5px;margin:2px 0 0">${item.sub}</p>
                    ${idLabel ? `<div class="mp-api-id" dir="ltr">${esc(idLabel)}${conn?.environment === 'sandbox' ? ' · Sandbox' : ''}</div>` : ''}
                  </div>
                  <button type="button" role="switch" aria-checked="${isOn ? 'true' : 'false'}" class="switch ${isOn ? 'on' : ''}" data-a="toggle-int" data-k="${item.key}" title="تفعيل أو إيقاف الربط" aria-label="تفعيل أو إيقاف ${item.name}"></button>
                </div>

                <div class="mp-api-status">
                  ${renderApiStatusLine(conn, isOn)}
                </div>

                <div class="mp-api-actions">
                  <button type="button" class="btn btn-sm ${conn?.configured ? 'btn-gh' : 'btn-ac'}" data-a="open-api-cfg" data-k="${item.key}">
                    ${ico('lock', 14)} ${conn?.configured ? 'تعديل مفاتيح API' : 'إعداد مفتاح API'}
                  </button>
                  ${conn?.configured ? `
                    <button type="button" class="btn btn-sm btn-gh" data-a="test-api-conn" data-k="${item.key}">
                      ${ico('zap', 14)} اختبار الاتصال
                    </button>
                    <button type="button" class="btn btn-sm btn-ok" data-a="sync-api-conn" data-k="${item.key}">
                      ${ico('sync', 14)} سحب البيانات
                    </button>
                  ` : ''}
                </div>
              </div>
            `;
          }
          return `
            <div class="card row">
              <div class="sp">
                <b>${item.name}</b>
                <p class="mu" style="font-size:12.5px">${item.sub}</p>
                <small class="${isOn ? 'ok-tx' : 'mu'}" style="font-weight:700">
                  ${isOn ? 'متصل · آخر مزامنة: ' + lastSyncLabel() : 'غير متصل'}
                </small>
              </div>
              <button type="button" role="switch" aria-checked="${isOn ? 'true' : 'false'}" class="switch ${isOn ? 'on' : ''}" data-a="toggle-int" data-k="${item.key}" title="تفعيل أو إيقاف الربط" aria-label="تفعيل أو إيقاف ${item.name}"></button>
            </div>
          `;
        }).join('')}
      </div>
    `).join('')}
  `;
};

// 5.7.0 صفحة خدمات الخبراء وإدارة الحسابات (#/services)
views.services = (d) => {
  const requests = (d && d.requests) || [];
  const catalog = GROWTH.EXPERT_SERVICES_UI || [];
  const selectedKey = growthState.selectedServiceKey || 'full_management';
  const statusMap = {
    pending: ['قيد المراجعة', 'wn'],
    scheduled: ['مجدولة مع خبير', 'pr'],
    in_progress: ['جاري التنفيذ', 'pr'],
    completed: ['مكتملة', 'ok']
  };
  return `
    <div class="card ai-glow" style="margin-bottom:20px">
      <div class="row-wrap">
        <div>
          <span class="meta-inline pr" style="margin-bottom:6px">${ico('briefcase', 14)} فريق خبراء OrderFlow المتخصص</span>
          <h3 style="margin:0;font-size:19px">خدمات إدارة الحسابات، محتوى A+، والإعلانات الممولة PPC</h3>
          <p class="mu" style="font-size:13.5px;margin-top:4px;max-width:66ch">اختر الخدمة المناسبة لمرحلة متجرك، وسيتواصل معك خبير تجارة إلكترونية معتمد لمتابعة التنفيذ خطوة بخطوة.</p>
        </div>
        <span class="sp"></span>
        <a class="btn btn-gh btn-sm" href="#/guides">${ico('book', 15)} تصفح أكاديمية التاجر</a>
      </div>
    </div>

    <div class="services-catalog-grid">
      ${catalog.map((s) => `
        <div class="card service-card ${selectedKey === s.key ? 'selected' : ''}">
          <div>
            <div class="row" style="margin-bottom:10px">
              <span class="bento-ico" aria-hidden="true">${ico(s.icon, 19)}</span>
              <span class="sp"></span>
              <span class="meta-inline pr">${s.badge}</span>
            </div>
            <h3 style="font-size:16px">${s.title}</h3>
            <p class="mu" style="font-size:13px;line-height:1.65;margin-bottom:12px">${s.desc}</p>
            <ul class="pricing-feats" style="margin:10px 0 14px;font-size:13px;gap:7px">
              ${s.deliverables.map((x) => `<li>${ico('check', 14)}<span>${x}</span></li>`).join('')}
            </ul>
          </div>
          <div>
            <div class="row" style="padding-top:10px;border-top:1px solid var(--bd);margin-bottom:10px;font-size:12.5px">
              <b class="pr-tx">${s.priceLabel}</b>
              <span class="sp"></span>
              <span class="mu">${s.sla}</span>
            </div>
            <button type="button" class="btn ${selectedKey === s.key ? 'btn-ac' : 'btn-gh'} btn-sm" style="width:100%" data-a="select-service-card" data-k="${s.key}">
              ${selectedKey === s.key ? 'محددة للطلب بالأسفل ✓' : 'اختيار هذه الخدمة'}
            </button>
          </div>
        </div>
      `).join('')}
    </div>

    <div class="grid-2" style="margin-top:22px">
      <div class="card" id="service-req-form-card">
        <h3>تأكيد طلب الخدمة أو الاستشارة</h3>
        <p class="mu" style="font-size:13px;margin-bottom:14px">يتم حفظ طلبك فورًا وتعيين خبير مختص للتواصل معك عبر الهاتف أو واتساب.</p>
        <form data-submit="submit-service-req">
          <label for="srv-key">الخدمة المطلوبة</label>
          <select id="srv-key" name="serviceKey">
            ${catalog.map((s) => `<option value="${s.key}" ${selectedKey === s.key ? 'selected' : ''}>${s.title} — ${s.priceLabel}</option>`).join('')}
          </select>

          <div class="grid-equal" style="gap:12px">
            <div>
              <label for="srv-phone">رقم الموبايل / واتساب للتواصل</label>
              <input id="srv-phone" name="phone" value="${esc(state.storePhone || (me && me.phone) || '')}" placeholder="01012345678" required>
            </div>
            <div>
              <label for="srv-orders">متوسط الطلبات الشهري</label>
              <select id="srv-orders" name="monthlyOrders">
                <option value="متجر جديد (أقل من ٥٠ طلبًا)">متجر جديد (أقل من ٥٠ طلبًا)</option>
                <option value="٥٠ – ٣٠٠ طلب شهريًا" selected>٥٠ – ٣٠٠ طلب شهريًا</option>
                <option value="٣٠٠ – ١٬٠٠٠ طلب شهريًا">٣٠٠ – ١٬٠٠٠ طلب شهريًا</option>
                <option value="أكثر من ١٬٠٠٠ طلب شهريًا">أكثر من ١٬٠٠٠ طلب شهريًا</option>
              </select>
            </div>
          </div>

          <label for="srv-platforms">المنصات المستهدفة</label>
          <input id="srv-platforms" name="platforms" value="أمازون مصر · نون مصر · جوميا" placeholder="مثال: أمازون مصر، نون، جوميا، ترينديول">

          <label for="srv-notes">تفاصيل متجرك أو هدفك من الخدمة (اختياري)</label>
          <textarea id="srv-notes" name="notes" rows="3" placeholder="مثال: نرغب في تجهيز ٢٠ صفحة منتج A+ وإطلاق حملة PPC قبل موسم العروض..."></textarea>

          <button type="submit" class="btn btn-ac" style="width:100%" id="btn-srv-submit">${ico('send', 15)} إرسال طلب الخدمة للخبراء</button>
        </form>
      </div>

      <div class="card">
        <div class="row" style="margin-bottom:12px">
          <h3>طلبات الخدمات والاستشارات الخاصة بك</h3>
          <span class="sp"></span>
          <span class="badge pr">${fmtNum(requests.length)} طلب</span>
        </div>
        ${requests.length ? requests.map((r) => {
          const st = statusMap[r.status] || statusMap.pending;
          return `
            <div style="padding:12px 0;border-bottom:1px solid var(--bd)">
              <div class="row-wrap" style="margin-bottom:4px">
                <b style="font-size:14px">${esc(r.service_title)}</b>
                <span class="sp"></span>
                ${renderBadge(st[0], st[1])}
              </div>
              <div class="row-wrap mu" style="font-size:12px;gap:10px">
                <span style="font-family:var(--font-mono)">${esc(r.ref_code)}</span>
                <span>·</span>
                <span>${esc(r.platforms || 'متعدد الأسواق')}</span>
                <span>·</span>
                <span>${esc(r.monthly_orders)}</span>
              </div>
              ${r.notes ? `<p class="mu" style="font-size:12.5px;margin-top:6px">${esc(r.notes)}</p>` : ''}
            </div>
          `;
        }).join('') : emptyState('briefcase', 'لا توجد طلبات خدمات بعد', 'اختر أي خدمة من الأعلى أو احجز استشارة نمو مجانية لمتابعة تقدمها هنا.')}
      </div>
    </div>
  `;
};

const demoBanner = () => `
  <div class="demo-banner" role="note">
    <span>أنت تتصفح حسابًا تجريبيًا على OrderFlow ببيانات جاهزة (تُحذف تلقائيًا بعد ٢٤ ساعة).</span>
    <button class="btn btn-ac btn-sm" data-a="auth" data-m="1">أنشئ حساب متجرك المجاني</button>
  </div>
`;

const loaders = {
  dash: () => api('GET', `/api/dashboard?range=${state.range}&market=${state.marketFilter}`),
  ord: () => api('GET', `/api/orders?${new URLSearchParams({ status: state.orderStatusFilter, q: state.orderQuery, page: state.orderPage })}`),
  returns: () => api('GET', '/api/returns'),
  customers: () => api('GET', `/api/customers?${new URLSearchParams({ q: state.customerQuery })}`),
  cod: () => api('GET', '/api/cod'),
  pay: () => api('GET', '/api/billing'),
  services: () => api('GET', '/api/services/requests'),
  notifications: () => api('GET', '/api/notifications'),
  help: () => api('GET', '/api/support/tickets'),
  admin: () => api('GET', '/api/admin/dashboard'),
  'admin/clients': () => api('GET', `/api/admin/clients?${new URLSearchParams({ q: state.adminClientQuery, status: state.adminClientStatus, plan: state.adminClientPlan })}`),
  'admin/client-detail': (params) => api('GET', `/api/admin/clients/${encodeURIComponent(params.id)}`),
  'admin/approvals': () => api('GET', `/api/admin/approvals?${new URLSearchParams({ status: state.adminApprovalStatus, type: state.adminApprovalType })}`),
  'admin/payments': () => api('GET', `/api/admin/payments?${new URLSearchParams({ status: state.adminPaymentStatus, q: state.adminPaymentQuery })}`),
  'admin/coupons': () => api('GET', '/api/admin/coupons'),
  'admin/audit': () => api('GET', `/api/admin/audit?${new URLSearchParams({ action: state.adminAuditAction })}`)
};

/* ==========================================================================
   5.7.1 شباك الدفع الإلكتروني وبوابة الاشتراكات (OrderFlow Pay Counter & View)
   ========================================================================== */
const PG_METHOD_META = {
  card: ['pay', 'بطاقة بنكية', 'Visa / ميزة'],
  instapay: ['zap', 'إنستاباي', 'تحويل لحظي'],
  wallet: ['smartphone', 'محفظة ذكية', 'فودافون / اتصالات'],
  fawry: ['store', 'فوري باي', 'كود مرجعي']
};

/** خوارزمية Luhn — فحص أولي على المتصفح (الخادم يعيد الفحص دائمًا) */
const luhnOk = (d) => {
  let sum = 0, dbl = false;
  for (let i = d.length - 1; i >= 0; i--) {
    let n = d.charCodeAt(i) - 48;
    if (dbl) { n *= 2; if (n > 9) n -= 9; }
    sum += n; dbl = !dbl;
  }
  return sum % 10 === 0;
};
const pgCardBrand = (d) => (/^507803|^9\d{15}$/.test(d) ? 'MEEZA ميزة' : d.startsWith('4') ? 'VISA' : /^(5[1-5]|2[2-7])/.test(d) ? 'MASTERCARD' : 'BANK CARD');

const ensurePgGateway = async () => {
  if (pgState.gateway.loaded) return;
  try { pgState.gateway = { ...(await api('GET', '/api/billing/config')), loaded: true }; } catch (_) { /* نبقي الإعداد الافتراضي */ }
};
const pgMethodIds = () => pgState.gateway.methods.map((x) => x.id).filter((id) => PG_METHOD_META[id]);

function renderPgMethodForm() {
  const g = pgState.gateway;
  // بوابة مستضافة: لا حقول حساسة عندنا إطلاقًا — التحويل لصفحة البوابة المرخّصة
  if (!g.collectsCardData) {
    return `
      <div class="pg-redirect-note" role="note">
        <span class="pg-redirect-ic" aria-hidden="true">🔐</span>
        <div>
          <b>ستنتقل إلى صفحة الدفع الآمنة</b>
          <p class="mu">تُدخل بيانات الدفع لدى بوابة الدفع المرخّصة مباشرةً، ولا تمر بيانات بطاقتك أو محفظتك بخوادمنا. يُفعَّل اشتراكك تلقائيًا فور تأكيد البوابة للعملية.</p>
        </div>
      </div>`;
  }
  const m = pgState.method;
  const banner = `<div class="pg-sandbox-banner" role="note">${ico('shield', 16)}<span>بيئة تجريبية — لا يُخصم أي مبلغ حقيقي. بطاقة النجاح <bdi dir="ltr">4242 4242 4242 4242</bdi> · بطاقة الرفض <bdi dir="ltr">4000 0000 0000 0002</bdi></span></div>`;

  if (m === 'card') {
    const raw = String(pgState.cardNumber || '').replace(/\D/g, '');
    const formatted = (raw.padEnd(16, '•').match(/.{1,4}/g) || []).join(' ');
    return `
      ${banner}
      <div class="pg-bank-card" aria-hidden="true">
        <div class="row" style="justify-content:space-between">
          <span class="pg-card-chip"></span>
          <b class="pg-card-brand" id="pg-card-preview-brand">${pgCardBrand(raw)}</b>
        </div>
        <div class="pg-card-num" id="pg-card-preview-num" dir="ltr">${esc(formatted)}</div>
        <div class="row" style="justify-content:space-between">
          <div><small class="pg-card-cap">CARD HOLDER</small><b id="pg-card-preview-holder" dir="ltr">${esc(pgState.cardHolder || 'MERCHANT NAME')}</b></div>
          <div style="text-align:end"><small class="pg-card-cap">EXPIRES</small><b id="pg-card-preview-exp" dir="ltr">${esc(pgState.cardExpiry || 'MM/YY')}</b></div>
        </div>
      </div>

      <div class="row-wrap" style="justify-content:space-between;margin-bottom:6px">
        <label for="pg-card-holder" style="margin:0">اسم حامل البطاقة (كما يظهر عليها)</label>
        <button type="button" class="btn btn-gh btn-sm" data-a="pg-fill-demo-card">⚡ تعبئة بطاقة تجريبية</button>
      </div>
      <input id="pg-card-holder" dir="ltr" autocomplete="cc-name" placeholder="AHMED ELNOOR" value="${esc(pgState.cardHolder)}" data-i="pg-card-input">

      <label for="pg-card-num">رقم البطاقة</label>
      <input id="pg-card-num" dir="ltr" inputmode="numeric" autocomplete="cc-number" maxlength="19" placeholder="0000 0000 0000 0000" value="${esc(pgState.cardNumber)}" data-i="pg-card-input">

      <div class="grid-equal" style="gap:12px">
        <div>
          <label for="pg-card-exp">تاريخ الانتهاء</label>
          <input id="pg-card-exp" dir="ltr" inputmode="numeric" autocomplete="cc-exp" maxlength="5" placeholder="MM/YY" value="${esc(pgState.cardExpiry)}" data-i="pg-card-input">
        </div>
        <div>
          <label for="pg-card-cvv">رمز الأمان CVV</label>
          <input id="pg-card-cvv" dir="ltr" type="password" inputmode="numeric" autocomplete="cc-csc" maxlength="4" placeholder="•••" value="${esc(pgState.cardCvv)}" data-i="pg-card-input">
        </div>
      </div>`;
  }

  if (m === 'instapay') {
    return `
      ${banner}
      <div class="pg-ipa-box">
        <div class="row-wrap" style="justify-content:space-between;margin-bottom:6px">
          <div>
            <small class="mu" style="display:block">عنوان الدفع الفوري للمنصة (InstaPay IPA)</small>
            <b dir="ltr" class="pg-ipa-addr">orderflow.pay@instapay</b>
          </div>
          <button type="button" class="btn btn-gh btn-sm" data-a="pg-copy-ipa" data-v="orderflow.pay@instapay">📋 نسخ العنوان</button>
        </div>
        <small class="mu">حوّل قيمة الاشتراك من تطبيق إنستاباي ثم أدخل عنوانك أو رقم الموبايل المحوّل منه.</small>
      </div>

      <label for="pg-ipa-addr">عنوان InstaPay الخاص بك أو رقم الموبايل</label>
      <input id="pg-ipa-addr" dir="ltr" placeholder="username@instapay أو 010xxxxxxxx" value="${esc(pgState.instaPayAddress)}" data-i="pg-field-sync">

      <label for="pg-ipa-ref">رقم مرجع التحويل (اختياري)</label>
      <input id="pg-ipa-ref" dir="ltr" placeholder="IPN-000000" value="${esc(pgState.transferRef)}" data-i="pg-field-sync">`;
  }

  if (m === 'wallet') {
    return `
      ${banner}
      <label for="pg-wallet-prov">شبكة المحفظة الذكية</label>
      <select id="pg-wallet-prov" data-i="pg-field-sync">
        ${['فودافون كاش', 'اتصالات كاش', 'أورنج كاش', 'WE Pay'].map((w) => `<option ${pgState.walletProvider === w ? 'selected' : ''}>${w}</option>`).join('')}
      </select>

      <label for="pg-wallet-phone">رقم موبايل المحفظة</label>
      <input id="pg-wallet-phone" dir="ltr" inputmode="tel" autocomplete="tel" placeholder="01012345678" value="${esc(pgState.walletPhone)}" data-i="pg-field-sync">

      <div class="row-wrap" style="justify-content:space-between;margin-bottom:6px">
        <label for="pg-wallet-otp" style="margin:0">كود التأكيد OTP</label>
        <button type="button" class="btn btn-gh btn-sm" data-a="pg-send-otp">📲 إرسال كود تجريبي</button>
      </div>
      <input id="pg-wallet-otp" dir="ltr" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="••••••" value="${esc(pgState.walletOtp)}" data-i="pg-field-sync">`;
  }

  return `
    ${banner}
    <div class="pg-fawry-ticket">
      <small class="mu" style="display:block;font-weight:700">كود الدفع المرجعي عبر فوري</small>
      <div class="pg-fawry-code" dir="ltr">••• ••• •••</div>
      <span class="badge wn">يُصدَر الكود بعد تأكيد الطلب ويصلح ٤٨ ساعة في منافذ فوري وتطبيق MyFawry</span>
    </div>

    <label for="pg-fawry-phone">رقم الموبايل المسجّل لإشعار السداد</label>
    <input id="pg-fawry-phone" dir="ltr" inputmode="tel" autocomplete="tel" placeholder="01012345678" value="${esc(pgState.fawryPhone)}" data-i="pg-field-sync">`;
}

function renderPaymentGatewayCounter(inModal = false) {
  const q = getPgQuote();
  const receipt = pgState.lastReceipt;
  const g = pgState.gateway;
  if (!g.enabled) {
    return `<div class="pg-unavailable"><span aria-hidden="true">🛠️</span><h3>الدفع الإلكتروني غير مُفعّل حاليًا</h3><p class="mu">نعمل على تفعيل بوابة الدفع. يمكنك الاستمرار بالباقة المجانية الآن أو التواصل معنا لتفعيل باقتك يدويًا.</p></div>`;
  }
  const ids = pgMethodIds();
  if (!ids.includes(pgState.method)) pgState.method = ids[0] || 'card';
  const submitLabel = g.collectsCardData ? `🔒 إتمام الدفع الآمن (${fmtEGP(q.total)})` : `🔒 المتابعة إلى صفحة الدفع الآمنة (${fmtEGP(q.total)})`;

  if (receipt) {
    return `
      <div style="padding:28px 24px;text-align:center">
        <div style="width:58px;height:58px;border-radius:50%;background:var(--ok-soft);color:var(--ok);display:inline-grid;place-items:center;font-size:28px;font-weight:900;margin-bottom:12px">✓</div>
        <h3 style="font-size:21px;margin-bottom:6px">تم سداد الاشتراك وتفعيل «${esc(receipt.planName)}» بنجاح!</h3>
        <p class="mu" style="margin-bottom:18px">تم توثيق العملية عبر شباك الدفع الإلكتروني وإصدار فاتورتك الضريبية المعتمدة.</p>

        <div class="card" style="max-width:520px;margin:0 auto 18px;text-align:start;background:var(--bg)">
          <div class="row" style="padding:6px 0;border-bottom:1px dashed var(--bd)">
            <span class="mu">رقم العملية المرجعي</span>
            <span class="sp"></span>
            <code dir="ltr" style="font-weight:800;color:var(--pr)">${esc(receipt.txRef)}</code>
          </div>
          <div class="row" style="padding:6px 0;border-bottom:1px dashed var(--bd)">
            <span class="mu">الباقة والدورة</span>
            <span class="sp"></span>
            <b>${esc(receipt.planName)} (${receipt.cycle === 'yearly' ? 'سنوي' : 'شهري'})</b>
          </div>
          <div class="row" style="padding:6px 0;border-bottom:1px dashed var(--bd)">
            <span class="mu">وسيلة السداد</span>
            <span class="sp"></span>
            <b>${esc(receipt.methodShort)} — <span dir="ltr">${esc(receipt.payerInfo)}</span></b>
          </div>
          <div class="row" style="padding:6px 0;border-bottom:1px dashed var(--bd)">
            <span class="mu">سريان الاشتراك حتى</span>
            <span class="sp"></span>
            <b>${fmtDate(receipt.periodEnd)}</b>
          </div>
          <div class="row" style="padding:8px 0 2px">
            <b>الإجمالي المسدَّد (شامل ١٤٪ ق.م)</b>
            <span class="sp"></span>
            <b class="ok-tx" style="font-size:20px">${fmtEGP(receipt.amount)}</b>
          </div>
        </div>

        <div class="row-wrap" style="justify-content:center;gap:10px">
          <button type="button" class="btn" data-a="open-receipt" data-id="${receipt.id}">🧾 فتح وطباعة الإيصال الضريبي (QR) ↗</button>
          <button type="button" class="btn btn-gh" data-a="pg-new-payment">إجراء عملية دفع أخرى</button>
          ${inModal ? '<button type="button" class="btn btn-ac" data-a="pg-go-dash">الانتقال إلى لوحة التحكم ◂</button>' : ''}
        </div>
      </div>
    `;
  }

  return `
    <form class="pg-window" data-submit="pg-submit-checkout" novalidate>
      <div class="pg-main">
        <div class="row-wrap" style="justify-content:space-between;margin-bottom:12px">
          <div>
            <div class="pg-step"><span class="pg-step-n">١</span><div><b>اختر الباقة ودورة الفوترة</b><small class="mu">يمكنك الترقية أو التجديد في أي وقت</small></div></div>
          </div>
          <div class="row" style="background:var(--bg);padding:4px;border-radius:9px;border:1px solid var(--bd);gap:4px">
            <button type="button" class="pill ${pgState.cycle === 'monthly' ? 'on' : ''}" style="border:none;min-height:30px;padding:4px 11px;font-size:12px" data-a="pg-select-cycle" data-v="monthly">شهري</button>
            <button type="button" class="pill ${pgState.cycle === 'yearly' ? 'on' : ''}" style="border:none;min-height:30px;padding:4px 11px;font-size:12px" data-a="pg-select-cycle" data-v="yearly">سنوي (وفّر شهرين)</button>
          </div>
        </div>

        <div class="pg-plan-tabs">
          ${PLANS.filter((x) => x.price > 0).map((p) => {
            const pPrice = pgState.cycle === 'yearly' ? p.price * 10 : p.price;
            const active = pgState.plan === p.id;
            return `
              <button type="button" class="pg-plan-card ${active ? 'active' : ''}" data-a="pg-select-plan" data-p="${p.id}">
                <div class="row" style="justify-content:space-between;width:100%">
                  <b style="font-size:13.5px">${p.name}</b>
                  ${p.popular ? renderBadge('الأشهر', 'pr') : ''}
                </div>
                <div style="font-size:20px;font-weight:900;color:var(--pr)">
                  ${fmtEGP(pPrice)} <small class="mu" style="font-size:11.5px;font-weight:600">/ ${pgState.cycle === 'yearly' ? 'سنة' : 'شهر'}</small>
                </div>
                <small class="mu" style="font-size:11.5px">${p.feats[0]} · ${p.feats[1]}</small>
              </button>
            `;
          }).join('')}
        </div>

        <div class="pg-step"><span class="pg-step-n">٢</span><div><b>اختر وسيلة الدفع</b></div></div>
        <div class="pg-method-tabs" role="radiogroup" aria-label="وسائل الدفع المتاحة">
          ${ids.map((k) => { const [ic, title, sub] = PG_METHOD_META[k]; return `
            <button type="button" role="radio" aria-checked="${pgState.method === k}" class="pg-method-btn ${pgState.method === k ? 'active' : ''}" data-a="pg-select-method" data-m="${k}">
              <span class="pg-method-ic" aria-hidden="true">${ico(ic, 18)}</span>
              <span>${title}</span>
              <small class="mu">${sub}</small>
            </button>`; }).join('')}
        </div>

        <div id="pg-method-body">
          ${renderPgMethodForm()}
        </div>

        <p id="pg-err" class="pg-err er-tx" role="alert"></p>

        <button type="submit" class="btn btn-ac btn-lg pg-submit" id="btn-pg-submit" data-label="${esc(submitLabel)}">
          ${submitLabel}
        </button>
      </div>

      <div class="pg-side">
        <div>
          <div class="row" style="justify-content:space-between;margin-bottom:12px">
            <b style="font-size:15px">ملخص فاتورة الاشتراك</b>
            ${renderBadge('شامل الضريبة ١٤٪', 'ok')}
          </div>

          <div class="pg-summary-box">
            <div class="row" style="padding:6px 0;border-bottom:1px solid var(--bd)">
              <div>
                <b style="display:block;font-size:14px">${esc(q.plan.name)}</b>
                <small class="mu">${q.isYearly ? 'دورة فوترة سنوية (١٢ شهرًا — شهران مجانًا)' : 'دورة فوترة شهرية (٣٠ يومًا)'}</small>
              </div>
              <span class="sp"></span>
              <b style="white-space:nowrap">${fmtEGP(q.basePrice)}</b>
            </div>

            <div style="padding:10px 0;border-bottom:1px solid var(--bd)">
              <label for="pg-coupon-inp" style="font-size:12px;margin-bottom:4px">هل لديك كود خصم ترويجي؟</label>
              <div class="pg-coupon-row">
                <input id="pg-coupon-inp" dir="ltr" placeholder="مثال: WELCOME20" value="${esc(pgState.couponInput)}" data-i="pg-coupon-typing">
                <button type="button" class="btn btn-gh btn-sm" data-a="pg-apply-coupon">تطبيق</button>
              </div>
              <div class="row-wrap" style="gap:6px;margin-top:6px">
                ${g.sandbox ? '<small class="mu" style="font-size:11.5px">أكواد متاحة للتجربة:</small>' : ''}
                ${(g.sandbox ? Object.values(COUPONS_MAP) : []).map((c) => `
                  <button type="button" class="badge ${pgState.appliedCoupon === c.code ? 'ok' : 'pr'}" style="border:none;cursor:pointer" data-a="pg-quick-coupon" data-c="${c.code}" title="${c.desc}">
                    ${c.code}
                  </button>
                `).join('')}
                ${pgState.appliedCoupon ? `<button type="button" class="badge er" style="border:none;cursor:pointer" data-a="pg-clear-coupon">إلغاء الكوبون ✕</button>` : ''}
              </div>
            </div>

            <div class="row" style="padding:6px 0;font-size:13px">
              <span class="mu">القيمة قبل الضريبة</span>
              <span class="sp"></span>
              <span>${fmtEGP(q.preTax)}</span>
            </div>
            <div class="row" style="padding:6px 0;font-size:13px">
              <span class="mu">ضريبة القيمة المضافة (١٤٪)</span>
              <span class="sp"></span>
              <span>${fmtEGP(q.vat)}</span>
            </div>
            ${q.discount > 0 ? `
              <div class="row" style="padding:6px 0;font-size:13px;color:var(--ok)">
                <b>خصم الكوبون (${esc(q.coupon.code)})</b>
                <span class="sp"></span>
                <b>− ${fmtEGP(q.discount)}</b>
              </div>
            ` : ''}

            <div class="row" style="padding:10px 0 2px;border-top:1px dashed var(--bd);margin-top:6px">
              <b style="font-size:15px">الإجمالي المطلوب دفعه</b>
              <span class="sp"></span>
              <b class="pr-tx" style="font-size:22px">${fmtEGP(q.total)}</b>
            </div>
          </div>

          <div style="margin-top:14px;font-size:12.5px;line-height:1.9;color:var(--mu)">
            <div>✓ تفعيل لحظي لجميع مزايا الباقة وحدود المنتجات</div>
            <div>✓ إصدار فاتورة ضريبية إلكترونية رسمية برمز QR</div>
            <div>✓ إمكانية إلغاء التجديد التلقائي في أي وقت بدون شروط</div>
          </div>
        </div>

        <div class="card" style="padding:12px;background:var(--bg-elev);font-size:12px">
          <div class="row" style="gap:8px">
            <span style="font-size:18px">🛡️</span>
            <div>
              ${g.sandbox
                ? '<b style="display:block">بيئة تجريبية</b><span class="mu">لا يُخصم أي مبلغ حقيقي ولا تُخزَّن بيانات البطاقة.</span>'
                : '<b style="display:block">دفع مؤمّن</b><span class="mu">تُعالَج العملية لدى بوابة دفع مرخّصة، ولا تمر بيانات بطاقتك بخوادمنا.</span>'}
            </div>
          </div>
        </div>
      </div>
    </form>
  `;
}

// 5.7.2 صفحة شباك الدفع والاشتراك في لوحة التحكم (#/pay)
views.pay = (d) => {
  if (d && d.plan) planInfo = d.plan;
  if (d && d.payments) payments = d.payments;
  if (d && d.gateway) pgState.gateway = { ...d.gateway, loaded: true };
  const p = planInfo || { id: 'free', name: 'باقة البداية', used: 0, limit: 50, markets: 2, aiLimit: 15, aiUsed: 0, cycle: 'monthly', autoRenew: true };
  const activeMarkets = ['a', 'n', 'j'].filter((k) => state.integrations && state.integrations[k]).length;

  return `
    <div class="grid-kpi" style="margin-bottom:18px">
      <div class="card kpi-card">
        <span class="mu" style="font-size:13px;font-weight:700">باقة اشتراكك الحالية</span>
        <b>${esc(p.name)}</b>
        <div>${renderBadge(p.id === 'free' ? 'باقة مجانية' : (p.cycle === 'yearly' ? 'اشتراك سنوي نشط ✓' : 'اشتراك شهري نشط ✓'), p.id === 'free' ? 'wn' : 'ok')}</div>
      </div>
      <div class="card kpi-card">
        <span class="mu" style="font-size:13px;font-weight:700">استهلاك سعة المنتجات</span>
        <b>${fmtNum(p.used)} / ${p.limit == null ? '∞' : fmtNum(p.limit)}</b>
        <div>${renderBadge(p.limit == null ? 'غير محدود' : `متبقي ${fmtNum(Math.max(0, p.limit - p.used))} منتج`, 'pr')}</div>
      </div>
      <div class="card kpi-card">
        <span class="mu" style="font-size:13px;font-weight:700">الأسواق المربوطة وحصة الذكاء الاصطناعي</span>
        <b>${fmtNum(activeMarkets)} من ${fmtNum(p.markets)} أسواق</b>
        <div>${renderBadge(`استهلاك AI اليوم: ${fmtNum(p.aiUsed || 0)} من ${fmtNum(p.aiLimit || 200)}`, 'ok')}</div>
      </div>
      <div class="card kpi-card">
        <span class="mu" style="font-size:13px;font-weight:700">تاريخ التجديد القادم</span>
        <b style="font-size:19px">${p.expiresAt ? fmtDate(p.expiresAt) : 'مفتوح (مجاني)'}</b>
        <div class="row" style="justify-content:space-between;margin-top:2px">
          <small class="mu" style="font-weight:700">تجديد تلقائي</small>
          <span class="switch ${p.autoRenew ? 'on' : ''}" data-a="toggle-autorenew" title="تفعيل أو إيقاف التجديد التلقائي للاشتراك"></span>
        </div>
      </div>
    </div>

    <div class="card" style="padding:0;overflow:hidden;margin-bottom:22px;border:2px solid var(--pr)">
      <div class="row-wrap" style="padding:16px 22px;background:linear-gradient(135deg,#071E38 0%,#0C5CA4 100%);color:#fff">
        <div>
          <span class="ai-badge" style="margin-bottom:4px">💳 شباك الدفع الإلكتروني الفوري — OrderFlow Pay</span>
          <h3 style="margin:0;color:#fff;font-size:18px">اشترك أو جدّد باقتك الآن بالجنيه المصري (١٬٠٠٠ ج.م للباقة الاحترافية / ٣٬٠٠٠ ج.م للشركات والمخازن)</h3>
        </div>
        <span class="sp"></span>
        <span style="font-size:12.5px;color:#cbd5e1">🔒 دفع مشفّر · تفعيل فوري · فاتورة ضريبية QR</span>
      </div>
      <div id="pay-page-counter-box">
        ${renderPaymentGatewayCounter(false)}
      </div>
    </div>

    <div class="card">
      <div class="row-wrap" style="margin-bottom:14px">
        <div>
          <h3 style="margin:0">سجل مدفوعات الاشتراك والإيصالات الضريبية</h3>
          <small class="mu">جميع العمليات المسددة عبر شباك الدفع وفواتيرها الضريبية المعتمدة</small>
        </div>
        <span class="sp"></span>
        <button type="button" class="btn btn-gh btn-sm" data-a="open-pay-window" data-p="pro">💳 فتح شباك الدفع في نافذة منبثقة</button>
      </div>
      ${payments.length ? renderTable(
        ['رقم العملية', 'الباقة', 'الدورة', 'وسيلة الدفع', 'بيانات الدافع', 'التاريخ', 'الخصم', 'الإجمالي المسدَّد', 'الحالة', 'الإيصال الضريبي'],
        payments.map((py) => [
          `<code dir="ltr" style="font-weight:700;color:var(--pr)">${esc(py.txRef)}</code>`,
          `<b>${esc(py.planName)}</b>`,
          py.cycle === 'yearly' ? 'سنوي (١٢ شهرًا)' : 'شهري (٣٠ يومًا)',
          esc(py.methodShort),
          `<span dir="ltr" class="mu" style="font-size:12.5px">${esc(py.payerInfo || '—')}</span>`,
          fmtDate(py.createdAt),
          py.discount > 0 ? `<span class="ok-tx">−${fmtEGP(py.discount)} (${esc(py.coupon)})</span>` : '—',
          `<b>${fmtEGP(py.amount)}</b>`,
          ({ paid: renderBadge('مدفوع ✓', 'ok'), pending: renderBadge('قيد التأكيد…', 'wn'), failed: renderBadge('فشلت', 'er'), cancelled: renderBadge('ملغاة', 'er'), review: renderBadge('قيد المراجعة', 'wn') })[py.status] || renderBadge(esc(py.status), ''),
          py.status === 'paid' ? `<button type="button" class="btn btn-gh btn-sm" data-a="open-receipt" data-id="${py.id}">🧾 إيصال ضريبي QR ↗</button>` : '—'
        ])
      ) : emptyState('💳', 'لا توجد مدفوعات سابقة', 'اختر الباقة المناسبة لك من شباك الدفع أعلاه لإتمام أول اشتراك وإصدار فاتورتك الضريبية.')}
    </div>
  `;
};

// 5.8 صفحة المرتجعات (#/returns)
views.returns = (d) => {
  const items = (d && (d.items || d.returns)) || [];
  const totalValue = d && (d.totalValue ?? d.summary?.totalAmount ?? d.summary?.returnsValue ?? 0);
  return `
    <div class="grid-kpi" style="margin-bottom:18px">
      <div class="card kpi-card">
        <span class="mu" style="font-size:13px;font-weight:700">إجمالي الطلبات المرتجعة (RTO)</span>
        <b>${fmtNum(items.length)} طلب</b>
        <div>${renderBadge('أُعيدت كمياتها للمخزون تلقائيًا', 'ok')}</div>
      </div>
      <div class="card kpi-card">
        <span class="mu" style="font-size:13px;font-weight:700">إجمالي قيمة المرتجعات</span>
        <b>${fmtEGP(totalValue)}</b>
        <div>${renderBadge('مستبعدة من صافي المبيعات', 'wn')}</div>
      </div>
    </div>
    <div class="card">
      <div class="row-wrap" style="margin-bottom:14px">
        <div>
          <h3 style="margin:0">سجل الشحنات المرتجعة وأسباب رفض الاستلام</h3>
          <small class="mu">وثّق سبب الرفض لتحليل أداء شركات الشحن وجودة المنتجات وتقليل نسبة RTO</small>
        </div>
      </div>
      ${items.length ? renderTable(
        ['رقم الطلب', 'السوق', 'العميل', 'المحافظة', 'شركة الشحن', 'المنتجات', 'القيمة', 'سبب المرتجع', 'إجراء'],
        items.map((o) => [
          `<b>#${arDigits(o.no)}</b><br><small class="mu">${fmtDate(o.createdAt)}</small>`,
          renderMarketChip(o.market),
          `<b>${esc(o.customer)}</b>${o.phone ? `<br><small dir="ltr" class="mu">${esc(o.phone)}</small>` : ''}`,
          esc(o.gov),
          esc(o.courier),
          `<small>${esc(o.items || '—')}</small>`,
          `<b>${fmtEGP(o.total)}</b>`,
          o.returnReason ? renderBadge(esc(o.returnReason), 'wn') : '<span class="mu">غير محدد</span>',
          `<button class="btn btn-gh btn-sm" data-a="edit-return-reason" data-id="${o.id}" data-reason="${esc(o.returnReason || '')}">✎ تحديد السبب</button>`
        ])
      ) : emptyState('↩️', 'لا توجد شحنات مرتجعة', 'عند تحويل حالة أي طلب مشحون إلى «مرتجع»، سيظهر هنا مع إعادة كمياته للمخزون تلقائيًا.')}
    </div>
  `;
};

// 5.9 صفحة العملاء (#/customers)
views.customers = (d) => {
  const list = (d && d.customers) || [];
  return `
    <div class="card">
      <div class="row-wrap" style="margin-bottom:14px">
        <div>
          <h3 style="margin:0">قاعدة بيانات العملاء (${fmtNum(d?.total || list.length)})</h3>
          <small class="mu">ملخص تلقائي لعملاء متجرك عبر أمازون ونون وجوميا ومعدلات استلامهم</small>
        </div>
        <span class="sp"></span>
        <input style="width:260px;margin:0" placeholder="🔍 ابحث باسم العميل أو الموبايل أو المحافظة..." value="${esc(state.customerQuery)}" data-i="cust-search">
      </div>
      <div id="cust-table-box">
        ${list.length ? renderTable(
          ['اسم العميل', 'رقم الموبايل', 'المحافظة', 'إجمالي الطلبات', 'تم التسليم', 'مرتجع / ملغى', 'إجمالي المشتريات', 'آخر طلب'],
          list.map((c) => [
            `<b>${esc(c.name)}</b>`,
            c.phone ? `<code dir="ltr">${esc(c.phone)}</code>` : '<span class="mu">—</span>',
            esc(c.gov || '—'),
            `<b>${fmtNum(c.ordersCount)}</b>`,
            renderBadge(fmtNum(c.deliveredCount) + ' مستلم', 'ok'),
            c.returnedCount || c.cancelledCount ? renderBadge(`${fmtNum(c.returnedCount)} مرتجع · ${fmtNum(c.cancelledCount)} ملغى`, 'er') : '<span class="mu">٠</span>',
            `<b>${fmtEGP(c.totalSpent)}</b>`,
            `<small class="mu">${fmtDate(c.lastOrderAt)}</small>`
          ])
        ) : emptyState('👥', 'لا يوجد عملاء مطابقون', 'ستظهر بيانات العملاء هنا تلقائيًا مع تسجيل الطلبات على متجرك.')}
      </div>
    </div>
  `;
};

// 5.10 مركز الإشعارات (#/notifications)
views.notifications = (d) => {
  const list = (d && d.notifications) || [];
  if (d && typeof d.unread === 'number') counts.unreadNotifications = d.unread;
  const iconOf = { success: '✅', warning: '⚠️', error: '🚨', info: '🔔' };
  return `
    <div class="card">
      <div class="row-wrap" style="margin-bottom:14px">
        <div>
          <h3 style="margin:0">مركز الإشعارات والتنبيهات</h3>
          <small class="mu">تنبيهات الاعتماد، المخزون، الطلبات، والمدفوعات (${fmtNum(counts.unreadNotifications || 0)} غير مقروء)</small>
        </div>
        <span class="sp"></span>
        ${list.some((n) => !n.readAt) ? `<button class="btn btn-gh btn-sm" data-a="notif-read-all">✓ تعليم الكل كمقروء</button>` : ''}
      </div>
      ${list.length ? `
        <div style="border:1px solid var(--bd);border-radius:12px;overflow:hidden">
          ${list.map((n) => `
            <div class="notif-item ${n.readAt ? '' : 'unread'}">
              <span style="font-size:22px;line-height:1.2">${iconOf[n.type] || '🔔'}</span>
              <div class="sp">
                <div class="row-wrap" style="gap:8px;margin-bottom:3px">
                  <b>${esc(n.title)}</b>
                  ${!n.readAt ? renderBadge('جديد', 'pr') : ''}
                  <span class="sp"></span>
                  <small class="mu">${timeAgo(n.createdAt)}</small>
                </div>
                <p class="mu" style="font-size:13.5px;margin:0">${esc(n.body)}</p>
              </div>
              <div class="row" style="gap:6px">
                ${n.link ? `<a class="btn btn-gh btn-sm" href="${esc(n.link)}">عرض ◂</a>` : ''}
                ${!n.readAt ? `<button class="btn btn-gh btn-sm" data-a="notif-read" data-id="${n.id}">كمقروء ✓</button>` : ''}
              </div>
            </div>
          `).join('')}
        </div>
      ` : emptyState('🔔', 'لا توجد إشعارات حاليًا', 'ستصلك هنا تنبيهات فورية عند مراجعة منتجاتك أو طلباتك أو تحديثات الحساب.')}
    </div>
  `;
};

// 5.11 مركز المساعدة والدعم الفني (#/help)
const HELP_ARTICLES = [
  { cat: 'الاعتماد والمزامنة', q: 'لماذا تظهر المنتجات أو الطلبات الجديدة بحالة «قيد المراجعة»؟', a: 'لضمان دقة الكتالوج ومنع أخطاء التسعير، تخضع العناصر الجديدة التي يضيفها التاجر لمراجعة سريعة من فريق الإشراف. بمجرد اعتماد المنتج يدخل فورًا في رصيد المخزون والمزامنة التلقائية عبر الأسواق الثلاثة.' },
  { cat: 'إدارة المخزون', q: 'كيف تعمل المزامنة الفورية بين أمازون مصر ونون وجوميا؟', a: 'عند تسجيل طلب جديد على أي منصة، يخصم OrderFlow الكمية من مخزونك المركزي، وعند الضغط على «مزامنة الآن» يُحدّث الرصيد المعتمد على جميع الأسواق المربوطة في صفحة التكاملات.' },
  { cat: 'تحصيلات COD', q: 'كيف أسحب مستحقات الدفع عند الاستلام على إنستاباي؟', a: 'انتقل إلى صفحة الإعدادات وأضف عنوان InstaPay الخاص بك، ثم من صفحة «تحصيلات الشحن COD» اضغط على «طلب تحويل فوري» بجانب شركة الشحن لتسوية الرصيد المحصّل.' },
  { cat: 'الطلبات والمرتجعات', q: 'ماذا يحدث للمخزون عند إلغاء طلب أو تسجيله كمرتجع؟', a: 'سواء قمت بإلغاء الطلب قبل الشحن أو تسجيله كمرتجع بعد الشحن، يقوم النظام تلقائيًا بإعادة الكميات إلى رصيد المنتج واستبعاد الطلب من صافي المبيعات.' }
];

views.help = (d) => {
  const tickets = (d && d.tickets) || [];
  const q = (state.helpQuery || '').trim().toLowerCase();
  const filteredArticles = HELP_ARTICLES.filter((a) => !q || (a.q + ' ' + a.a + ' ' + a.cat).toLowerCase().includes(q));
  return `
    <div class="grid-2">
      <div>
        <div class="card" style="margin-bottom:18px">
          <h3>📚 قاعدة المعرفة والإجابات السريعة</h3>
          <input placeholder="🔍 ابحث في أدلة الاستخدام والأسئلة الشائعة..." value="${esc(state.helpQuery)}" data-i="help-search">
          <div id="help-articles-box">
            ${filteredArticles.map((art) => `
              <details open style="margin-bottom:10px">
                <summary>${renderBadge(art.cat, 'pr')} ${esc(art.q)}</summary>
                <p class="mu" style="margin-top:8px;font-size:13.5px">${esc(art.a)}</p>
              </details>
            `).join('') || '<p class="mu ctr">لا توجد مقالات مطابقة للبحث.</p>'}
          </div>
        </div>
      </div>

      <div>
        <div class="card" style="margin-bottom:18px">
          <h3>🛟 فتح تذكرة دعم فني مباشر</h3>
          <p class="mu" style="font-size:13px;margin-bottom:12px">فريق دعم OrderFlow في القاهرة يرد على استفسارات التجار خلال ساعات العمل.</p>
          <form data-submit="submit-ticket" novalidate>
            <label for="tk-subj">عنوان المشكلة أو الاستفسار</label>
            <input id="tk-subj" maxlength="160" placeholder="مثال: استفسار بخصوص ربط حساب نون أو مراجعة منتج">
            <label for="tk-msg">التفاصيل</label>
            <textarea id="tk-msg" rows="4" maxlength="2000" placeholder="اشرح لنا التفاصيل وسنقوم بمساعدتك فورًا..."></textarea>
            <button class="btn" type="submit" style="width:100%">إرسال تذكرة الدعم</button>
          </form>
        </div>

        <div class="card">
          <h3>تذاكر الدعم السابقة (${fmtNum(tickets.length)})</h3>
          ${tickets.length ? tickets.map((t) => `
            <div style="padding:10px 0;border-bottom:1px solid var(--bd)">
              <div class="row-wrap" style="justify-content:space-between">
                <b>#${t.id} · ${esc(t.subject)}</b>
                ${renderBadge(t.status === 'open' ? 'مفتوحة' : 'مغلقة', t.status === 'open' ? 'ok' : '')}
              </div>
              <p class="mu" style="font-size:13px;margin:4px 0">${esc(t.message)}</p>
              <small class="mu">${fmtDate(t.createdAt)}</small>
            </div>
          `).join('') : '<p class="mu" style="font-size:13px">لم تقم بإرسال أي تذاكر دعم فني بعد.</p>'}
        </div>
      </div>
    </div>
  `;
};

// 5.12 صفحة الإعدادات (#/set)
views.set = () => `
  <div class="grid-2">
    <div class="card">
      <h3>بيانات المتجر والفوترة الضريبية</h3>
      <label for="set-name">اسم المتجر التجاري</label>
      <input id="set-name" maxlength="60" value="${esc(state.storeName)}">

      <div class="row-wrap" style="justify-content:space-between;align-items:center">
        <label for="set-email" style="margin:0">البريد الإلكتروني الرسمي</label>
        ${state.storeEmail ? (me && me.emailVerified
          ? renderBadge('البريد موثّق ✓', 'ok')
          : `<button type="button" class="btn btn-gh btn-sm" data-a="send-verify-email">📧 توثيق البريد الآن</button>`) : ''}
      </div>
      <input id="set-email" type="email" dir="ltr" value="${esc(state.storeEmail)}" ${me.isDemo ? 'disabled title="غير متاح في الحساب التجريبي"' : ''}>

      <label for="set-phone">رقم الموبايل (واتساب) — يُستخدم لتسجيل الدخول</label>
      <input id="set-phone" dir="ltr" inputmode="tel" value="${esc(state.storePhone)}" ${me.isDemo ? 'disabled title="غير متاح في الحساب التجريبي"' : ''}>

      <div class="grid-equal" style="gap:12px">
        <div>
          <label for="set-tax">رقم التسجيل الضريبي</label>
          <input id="set-tax" dir="ltr" maxlength="20" value="${esc(state.taxId)}">
        </div>
        <div>
          <label for="set-ipa">عنوان InstaPay لاستلام التحصيلات</label>
          <input id="set-ipa" dir="ltr" maxlength="60" value="${esc(state.instaPayHandle)}">
        </div>
      </div>

      <button class="btn" data-a="save-settings">💾 حفظ إعدادات المتجر</button>
    </div>

    <div class="card">
      <h3>تفضيلات التنبيهات الذكية</h3>
      ${[
        ['s', 'تنبيه فوري عند انخفاض مخزون أي منتج لأقل من ٥ قطع'],
        ['o', 'إشعار عند وصول طلب جديد من أمازون أو نون أو جوميا'],
        ['f', 'تنبيه في حال تعذر مزامنة الأسعار أو المخزون'],
        ['w', 'إرسال ملخص المبيعات اليومي على واتساب']
      ].map((n) => `
        <div class="row" style="padding:10px 0;border-bottom:1px solid var(--bd)">
          <span class="sp">${n[1]}</span>
          <span class="switch ${state.notifications[n[0]] ? 'on' : ''}" data-a="toggle-notif" data-k="${n[0]}" aria-label="${n[1]}"></span>
        </div>
      `).join('')}

      <h3 style="margin-top:22px">المظهر والبيانات</h3>
      <p class="mu" style="font-size:13px;margin-bottom:12px">${me.isDemo
        ? 'هذا حساب تجريبي: بياناته مؤقتة وتُحذف تلقائيًا بعد ٢٤ ساعة.'
        : 'بياناتك محفوظة بأمان على حسابك، ويمكنك تصديرها في أي وقت.'}</p>
      <div class="row-wrap">
        <button class="btn btn-gh" data-a="theme">🌓 تبديل الوضع الليلي / النهاري</button>
        ${me.isDemo
          ? '<button class="btn btn-er" data-a="reset-demo">↺ إعادة ضبط البيانات التجريبية</button>'
          : `<button class="btn btn-gh" data-a="export-prod-csv">📥 المنتجات CSV</button>
             <button class="btn btn-gh" data-a="export-ord-csv">📥 الطلبات CSV</button>`}
        <button class="btn btn-gh" data-a="logout">تسجيل الخروج</button>
      </div>

      ${me.isDemo ? '' : `
        <h3 style="margin-top:22px">الأمان والحساب</h3>
        <div class="row-wrap">
          <button class="btn btn-gh" data-a="change-password">🔑 تغيير كلمة المرور</button>
          <button class="btn btn-er" data-a="delete-account">🗑 حذف الحساب نهائيًا</button>
        </div>`}
    </div>
  </div>
`;

/* ==========================================================================
   5.13 شاشات لوحة المشرف العام (Admin Dashboard Views — #/admin/*)
   ========================================================================== */
const renderAdminSubnav = (activeId) => `
  <div class="seg-rail" style="margin-bottom:20px" role="navigation" aria-label="أقسام المشرف العام">
    ${ADMIN_NAV_LINKS.map((item) => `
      <a href="#/${item.id}" class="pill ${activeId === item.id ? 'on' : ''}">${ico(item.icon, 15)} ${item.title}</a>
    `).join('')}
  </div>
`;

views.admin = (d) => {
  const k = (d && d.kpis) || {};
  const recentClients = (d && d.recentClients) || [];
  const recentAudit = (d && d.recentAudit) || [];
  return `
    ${renderAdminSubnav('admin')}
    <div class="grid-kpi" style="margin-bottom:18px">
      <div class="card kpi-card">
        <span class="mu" style="font-size:13px;font-weight:700">إجمالي المتاجر المسجلة</span>
        <b>${fmtNum(k.totalClients || 0)} متجر</b>
        <div>${renderBadge(`${fmtNum(k.activeClients || 0)} نشط · ${fmtNum(k.suspendedClients || 0)} موقوف`, 'pr')}</div>
      </div>
      <div class="card kpi-card">
        <span class="mu" style="font-size:13px;font-weight:700">مراجعات بانتظار الاعتماد</span>
        <b>${fmtNum((k.pendingProducts || 0) + (k.pendingOrders || 0))} عنصر</b>
        <div><a href="#/admin/approvals">${renderBadge(`${fmtNum(k.pendingProducts || 0)} منتج · ${fmtNum(k.pendingOrders || 0)} طلب ◂`, (k.pendingProducts + k.pendingOrders) > 0 ? 'wn' : 'ok')}</a></div>
      </div>
      <div class="card kpi-card">
        <span class="mu" style="font-size:13px;font-weight:700">إيرادات الاشتراكات المحصّلة</span>
        <b>${fmtEGP(k.totalPayments || 0)}</b>
        <div>${renderBadge(`${fmtNum(k.paidSubscriptions || 0)} عملية دفع ناجحة`, 'ok')}</div>
      </div>
      <div class="card kpi-card">
        <span class="mu" style="font-size:13px;font-weight:700">إجمالي GMV عبر المنصة</span>
        <b>${fmtEGP(k.totalGmv || 0)}</b>
        <div>${renderBadge(`${fmtNum(k.totalOrders || 0)} طلب · ${fmtNum(k.totalProducts || 0)} منتج`, 'ok')}</div>
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <div class="row" style="margin-bottom:12px">
          <h3>أحدث المتاجر المسجلة</h3>
          <span class="sp"></span>
          <a class="pr-tx" style="font-size:13px;font-weight:700" href="#/admin/clients">إدارة التجار ◂</a>
        </div>
        ${recentClients.length ? renderTable(
          ['المتجر', 'الموبايل', 'الباقة', 'الحالة', 'المنتجات / الطلبات', 'إجراء'],
          recentClients.map((c) => [
            `<b>${esc(c.storeName)}</b>`,
            `<code dir="ltr">${esc(c.phone)}</code>`,
            renderBadge(esc(c.plan), 'pr'),
            renderBadge(c.status === 'suspended' ? 'موقوف' : 'نشط', c.status === 'suspended' ? 'er' : 'ok'),
            `${fmtNum(c.productsCount)} منتج · ${fmtNum(c.ordersCount)} طلب`,
            `<a class="btn btn-gh btn-sm" href="#/admin/clients/${c.id}">التفاصيل ◂</a>`
          ])
        ) : '<p class="mu ctr">لا يوجد تجار مسجلون بعد.</p>'}
      </div>

      <div class="card">
        <div class="row" style="margin-bottom:12px">
          <h3>أحدث عمليات سجل التدقيق (Audit Log)</h3>
          <span class="sp"></span>
          <a class="pr-tx" style="font-size:13px;font-weight:700" href="#/admin/audit">السجل الكامل ◂</a>
        </div>
        ${recentAudit.length ? renderTable(
          ['الوقت', 'المشرف', 'الإجراء', 'الهدف'],
          recentAudit.slice(0, 8).map((a) => [
            `<small class="mu">${timeAgo(a.createdAt)}</small>`,
            esc(a.adminName || a.adminPhone || `#${a.adminId}`),
            `<code dir="ltr">${esc(a.action)}</code>`,
            `${esc(a.targetType)} #${a.targetId || '—'}`
          ])
        ) : '<p class="mu ctr">لا توجد عمليات مسجلة بعد.</p>'}
      </div>
    </div>
  `;
};

views['admin/clients'] = (d) => {
  const list = (d && d.clients) || [];
  return `
    ${renderAdminSubnav('admin/clients')}
    <div class="card">
      <div class="row-wrap" style="margin-bottom:14px">
        <input style="width:260px;margin:0" placeholder="🔍 ابحث باسم المتجر أو الموبايل أو البريد..." value="${esc(state.adminClientQuery)}" data-i="admin-client-search">
        ${[['all', 'كل الحالات'], ['active', 'نشط'], ['suspended', 'موقوف']].map(([k, lbl]) => `
          <span class="pill ${state.adminClientStatus === k ? 'on' : ''}" data-a="admin-client-status-flt" data-v="${k}">${lbl}</span>
        `).join('')}
        <span class="sp"></span>
        ${[['all', 'كل الباقات'], ['free', 'مجانية'], ['pro', 'احترافية'], ['business', 'شركات']].map(([k, lbl]) => `
          <span class="pill ${state.adminClientPlan === k ? 'on' : ''}" data-a="admin-client-plan-flt" data-v="${k}">${lbl}</span>
        `).join('')}
      </div>
      ${list.length ? renderTable(
        ['#', 'المتجر', 'الموبايل / البريد', 'الباقة', 'الحالة', 'المنتجات', 'الطلبات', 'المبيعات', 'إجراءات المشرف'],
        list.map((c) => [
          `<b>#${c.id}</b>`,
          `<div><b>${esc(c.storeName)}</b>${c.isDemo ? ' ' + renderBadge('تجريبي', 'wn') : ''}</div>`,
          `<div><code dir="ltr">${esc(c.phone)}</code>${c.email ? `<br><small dir="ltr" class="mu">${esc(c.email)}</small>` : ''}</div>`,
          renderBadge(esc(c.planName || c.plan), c.plan === 'free' ? '' : 'pr'),
          renderBadge(c.status === 'suspended' ? 'موقوف ✕' : 'نشط ✓', c.status === 'suspended' ? 'er' : 'ok'),
          `${fmtNum(c.productsCount)} ${c.pendingProductsCount ? renderBadge(`${fmtNum(c.pendingProductsCount)} معلق`, 'wn') : ''}`,
          `${fmtNum(c.ordersCount)} ${c.pendingOrdersCount ? renderBadge(`${fmtNum(c.pendingOrdersCount)} معلق`, 'wn') : ''}`,
          `<b>${fmtEGP(c.revenue ?? c.totalPaid ?? 0)}</b>`,
          `<div class="row" style="gap:6px;flex-wrap:wrap;justify-content:flex-end">
            <a class="btn btn-gh btn-sm" href="#/admin/clients/${c.id}">التفاصيل ◂</a>
            <button class="btn btn-gh btn-sm" data-a="admin-impersonate" data-id="${c.id}" title="تصفح لوحة التاجر بوضع القراءة فقط">👁️ معاينة</button>
            <button class="btn btn-gh btn-sm" data-a="admin-change-plan-modal" data-id="${c.id}" data-plan="${c.plan}" data-cycle="${c.planCycle || 'monthly'}" data-name="${esc(c.storeName)}">الباقة</button>
            <button class="btn ${c.status === 'suspended' ? 'btn-ok' : 'btn-er'} btn-sm" data-a="admin-toggle-client-status" data-id="${c.id}" data-status="${c.status}" data-name="${esc(c.storeName)}">
              ${c.status === 'suspended' ? 'تفعيل ✓' : 'إيقاف ✕'}
            </button>
          </div>`
        ])
      ) : emptyState('🏪', 'لا يوجد تجار مطابقون للبحث', 'جرّب تغيير شروط التصفية أو البحث.')}
    </div>
  `;
};

views['admin/client-detail'] = (d) => {
  const c = d && d.client;
  if (!c) return errorState('العميل غير موجود');
  const planObj = (d && d.plan) || { id: c.plan || 'free', name: c.planName || c.plan || 'مجانية', cycle: c.planCycle || 'monthly' };
  const settingsObj = (d && d.settings) || {};
  const prods = d.products || [];
  const ords = d.orders || [];
  const pays = d.payments || [];
  const logs = d.auditLogs || [];
  return `
    ${renderAdminSubnav('admin/clients')}
    <div class="card" style="margin-bottom:18px">
      <div class="row-wrap" style="justify-content:space-between;gap:12px">
        <div>
          <div class="row-wrap" style="gap:8px;margin-bottom:4px">
            <a href="#/admin/clients" class="btn btn-gh btn-sm">▸ كل التجار</a>
            <h3 style="margin:0">${esc(c.storeName)} (#${c.id})</h3>
            ${renderBadge(c.status === 'suspended' ? 'حساب موقوف' : 'حساب نشط', c.status === 'suspended' ? 'er' : 'ok')}
            ${renderBadge(esc(planObj.name), 'pr')}
          </div>
          <p class="mu" style="font-size:13.5px;margin:4px 0 0">
            الموبايل: <code dir="ltr">${esc(c.phone)}</code> · البريد: <code dir="ltr">${esc(c.email || '—')}</code> · الرقم الضريبي: <code dir="ltr">${esc(settingsObj.taxId || c.taxId || '—')}</code> · InstaPay: <code dir="ltr">${esc(settingsObj.instaPayHandle || c.instaPayHandle || '—')}</code>
          </p>
        </div>
        <div class="row-wrap" style="gap:8px">
          <button class="btn btn-ac btn-sm" data-a="admin-impersonate" data-id="${c.id}">👁️ معاينة كعميل (قراءة فقط)</button>
          <button class="btn btn-gh btn-sm" data-a="admin-change-plan-modal" data-id="${c.id}" data-plan="${planObj.id}" data-cycle="${planObj.cycle}" data-name="${esc(c.storeName)}">💳 تغيير الباقة</button>
          <button class="btn ${c.status === 'suspended' ? 'btn-ok' : 'btn-er'} btn-sm" data-a="admin-toggle-client-status" data-id="${c.id}" data-status="${c.status}" data-name="${esc(c.storeName)}">
            ${c.status === 'suspended' ? '✓ إعادة تفعيل الحساب' : '✕ إيقاف الحساب'}
          </button>
        </div>
      </div>
    </div>

    <div class="grid-2" style="margin-bottom:18px">
      <div class="card">
        <h3>منتجات التاجر (${fmtNum(prods.length)})</h3>
        ${prods.length ? renderTable(
          ['المنتج', 'SKU', 'السعر', 'المخزون', 'الاعتماد', 'إجراء'],
          prods.map((p) => [
            `<div class="row" style="gap:8px">${renderProdThumb(p)}<b>${esc(p.name)}</b></div>`,
            `<code dir="ltr">${esc(p.sku)}</code>`,
            fmtEGP(p.price),
            fmtNum(p.stock),
            renderApprovalBadge(p.approvalStatus, p.rejectReason),
            `<div class="row" style="gap:4px">
              ${p.approvalStatus !== 'approved' ? `<button class="btn btn-ok btn-sm" data-a="admin-approve" data-type="product" data-id="${p.id}">✓ اعتماد</button>` : ''}
              ${p.approvalStatus !== 'rejected' ? `<button class="btn btn-er btn-sm" data-a="admin-reject" data-type="product" data-id="${p.id}" data-name="${esc(p.name)}">✕ رفض</button>` : ''}
            </div>`
          ])
        ) : '<p class="mu ctr">لا توجد منتجات لهذا التاجر.</p>'}
      </div>

      <div class="card">
        <h3>أحدث طلبات التاجر (${fmtNum(ords.length)})</h3>
        ${ords.length ? renderTable(
          ['رقم الطلب', 'العميل', 'الإجمالي', 'الحالة', 'الاعتماد', 'إجراء'],
          ords.slice(0, 15).map((o) => [
            `<b>#${arDigits(o.no)}</b>`,
            esc(o.customer),
            fmtEGP(o.total),
            renderBadge((ORDER_STATUS[o.status] || ORDER_STATUS[0]).label, (ORDER_STATUS[o.status] || ORDER_STATUS[0]).cls),
            renderApprovalBadge(o.approvalStatus, o.rejectReason),
            `<div class="row" style="gap:4px">
              ${o.approvalStatus !== 'approved' ? `<button class="btn btn-ok btn-sm" data-a="admin-approve" data-type="order" data-id="${o.id}">✓ اعتماد</button>` : ''}
              ${o.approvalStatus !== 'rejected' ? `<button class="btn btn-er btn-sm" data-a="admin-reject" data-type="order" data-id="${o.id}" data-name="طلب #${o.no}">✕ رفض</button>` : ''}
            </div>`
          ])
        ) : '<p class="mu ctr">لا توجد طلبات لهذا التاجر.</p>'}
      </div>
    </div>

    <div class="grid-2">
      <div class="card">
        <h3>مدفوعات اشتراك التاجر (${fmtNum(pays.length)})</h3>
        ${pays.length ? renderTable(
          ['المرجع', 'الباقة', 'المبلغ', 'الحالة', 'التاريخ'],
          pays.map((py) => [
            `<code dir="ltr">${esc(py.txRef)}</code>`,
            esc(py.planName),
            fmtEGP(py.amount),
            renderBadge(esc(py.status), py.status === 'paid' ? 'ok' : 'wn'),
            fmtDate(py.createdAt)
          ])
        ) : '<p class="mu ctr">لا توجد مدفوعات مسجلة.</p>'}
      </div>

      <div class="card">
        <h3>سجل إجراءات المشرفين على الحساب</h3>
        ${logs.length ? renderTable(
          ['الوقت', 'الإجراء', 'التفاصيل'],
          logs.map((l) => [
            `<small class="mu">${timeAgo(l.createdAt)}</small>`,
            `<code dir="ltr">${esc(l.action)}</code>`,
            `<small dir="ltr" class="mu">${esc(JSON.stringify(l.details || {}))}</small>`
          ])
        ) : '<p class="mu ctr">لا توجد إجراءات إدارية سابقة على هذا الحساب.</p>'}
      </div>
    </div>
  `;
};

views['admin/approvals'] = (d) => {
  const prods = (d && d.products) || [];
  const ords = (d && d.orders) || [];
  return `
    ${renderAdminSubnav('admin/approvals')}
    <div class="card" style="margin-bottom:18px">
      <div class="row-wrap">
        <span class="mu" style="font-weight:700;font-size:13.5px">حالة المراجعة:</span>
        ${[['pending', 'قيد المراجعة'], ['approved', 'المعتمدة'], ['rejected', 'المرفوضة'], ['all', 'الكل']].map(([k, lbl]) => `
          <span class="pill ${state.adminApprovalStatus === k ? 'on' : ''}" data-a="admin-app-status-flt" data-v="${k}">${lbl}</span>
        `).join('')}
        <span class="sp"></span>
        ${[['all', 'المنتجات والطلبات'], ['products', 'المنتجات فقط'], ['orders', 'الطلبات فقط']].map(([k, lbl]) => `
          <span class="pill ${state.adminApprovalType === k ? 'on' : ''}" data-a="admin-app-type-flt" data-v="${k}">${lbl}</span>
        `).join('')}
      </div>
    </div>

    ${state.adminApprovalType !== 'orders' ? `
      <div class="card" style="margin-bottom:18px">
        <h3 style="margin-bottom:12px">📦 طابور مراجعة المنتجات (${fmtNum(prods.length)})</h3>
        ${prods.length ? renderTable(
          ['المنتج', 'المتجر', 'SKU', 'السعر / التكلفة', 'المخزون', 'حالة الاعتماد', 'إجراءات المراجعة'],
          prods.map((p) => [
            `<div class="row" style="gap:10px">${renderProdThumb(p)}<div><b>${esc(p.name)}</b><br><small class="mu">${esc(p.cat || 'عام')}</small></div></div>`,
            `<a class="pr-tx" href="#/admin/clients/${p.userId}"><b>${esc(p.storeName)}</b></a><br><small dir="ltr" class="mu">${esc(p.storePhone)}</small>`,
            `<code dir="ltr">${esc(p.sku)}</code>`,
            `<b>${fmtEGP(p.price)}</b><br><small class="mu">تكلفة: ${fmtEGP(p.cost)}</small>`,
            `<b>${fmtNum(p.stock)}</b>`,
            renderApprovalBadge(p.approvalStatus, p.rejectReason),
            `<div class="row" style="gap:6px;justify-content:flex-end">
              ${p.approvalStatus !== 'approved' ? `<button class="btn btn-ok btn-sm" data-a="admin-approve" data-type="product" data-id="${p.id}">✓ اعتماد</button>` : ''}
              ${p.approvalStatus !== 'rejected' ? `<button class="btn btn-er btn-sm" data-a="admin-reject" data-type="product" data-id="${p.id}" data-name="${esc(p.name)}">✕ رفض مع السبب</button>` : ''}
            </div>`
          ])
        ) : '<p class="mu ctr" style="padding:18px">لا توجد منتجات في هذا الطابور حاليًا.</p>'}
      </div>
    ` : ''}

    ${state.adminApprovalType !== 'products' ? `
      <div class="card">
        <h3 style="margin-bottom:12px">🧾 طابور مراجعة الطلبات (${fmtNum(ords.length)})</h3>
        ${ords.length ? renderTable(
          ['رقم الطلب', 'المتجر', 'السوق', 'العميل', 'المنتجات', 'الإجمالي', 'حالة الاعتماد', 'إجراءات المراجعة'],
          ords.map((o) => [
            `<b>#${arDigits(o.no)}</b><br><small class="mu">${fmtDate(o.createdAt)}</small>`,
            `<a class="pr-tx" href="#/admin/clients/${o.userId}"><b>${esc(o.storeName)}</b></a><br><small dir="ltr" class="mu">${esc(o.storePhone)}</small>`,
            renderMarketChip(o.market),
            `<b>${esc(o.customer)}</b><br><small class="mu">${esc(o.gov)}</small>`,
            `<small>${esc(o.items || '—')}</small>`,
            `<b>${fmtEGP(o.total)}</b>`,
            renderApprovalBadge(o.approvalStatus, o.rejectReason),
            `<div class="row" style="gap:6px;justify-content:flex-end">
              ${o.approvalStatus !== 'approved' ? `<button class="btn btn-ok btn-sm" data-a="admin-approve" data-type="order" data-id="${o.id}">✓ اعتماد</button>` : ''}
              ${o.approvalStatus !== 'rejected' ? `<button class="btn btn-er btn-sm" data-a="admin-reject" data-type="order" data-id="${o.id}" data-name="طلب #${o.no}">✕ رفض مع السبب</button>` : ''}
            </div>`
          ])
        ) : '<p class="mu ctr" style="padding:18px">لا توجد طلبات في هذا الطابور حاليًا.</p>'}
      </div>
    ` : ''}
  `;
};

views['admin/payments'] = (d) => {
  const list = (d && d.payments) || [];
  const t = (d && (d.totals || d.summary)) || {};
  return `
    ${renderAdminSubnav('admin/payments')}
    <div class="grid-kpi" style="margin-bottom:18px">
      <div class="card kpi-card">
        <span class="mu" style="font-size:13px;font-weight:700">إجمالي المدفوعات المؤكدة</span>
        <b>${fmtEGP(t.paidTotal || 0)}</b>
        <div>${renderBadge(`${fmtNum(t.paidCount || 0)} عملية ناجحة`, 'ok')}</div>
      </div>
      <div class="card kpi-card">
        <span class="mu" style="font-size:13px;font-weight:700">عمليات معلقة / قيد التأكيد</span>
        <b>${fmtNum(t.pendingCount || 0)}</b>
        <div>${renderBadge('بانتظار الخطاف أو المراجعة', 'wn')}</div>
      </div>
      <div class="card kpi-card">
        <span class="mu" style="font-size:13px;font-weight:700">عمليات مرفوضة / فاشلة</span>
        <b>${fmtNum(t.failedCount || 0)}</b>
        <div>${renderBadge('لم تُفعّل الباقة', 'er')}</div>
      </div>
    </div>

    <div class="card">
      <div class="row-wrap" style="margin-bottom:14px">
        ${[['all', 'الكل'], ['paid', 'مدفوع'], ['pending', 'معلق'], ['failed', 'مرفوض'], ['review', 'مراجعة']].map(([k, lbl]) => `
          <span class="pill ${state.adminPaymentStatus === k ? 'on' : ''}" data-a="admin-pay-status-flt" data-v="${k}">${lbl}</span>
        `).join('')}
        <span class="sp"></span>
        <input style="width:260px;margin:0" placeholder="🔍 ابحث برقم العملية أو اسم المتجر..." value="${esc(state.adminPaymentQuery)}" data-i="admin-pay-search">
      </div>
      ${list.length ? renderTable(
        ['رقم العملية', 'المتجر', 'الباقة', 'الدورة', 'وسيلة الدفع', 'الكوبون', 'المبلغ', 'الحالة', 'التاريخ'],
        list.map((py) => [
          `<code dir="ltr" style="font-weight:700;color:var(--pr)">${esc(py.txRef)}</code>`,
          `<a class="pr-tx" href="#/admin/clients/${py.userId}"><b>${esc(py.storeName)}</b></a><br><small dir="ltr" class="mu">${esc(py.storePhone)}</small>`,
          esc(py.planName),
          py.cycle === 'yearly' ? 'سنوي' : 'شهري',
          `${esc(py.methodShort)}<br><small dir="ltr" class="mu">${esc(py.payerInfo || '')}</small>`,
          py.coupon ? renderBadge(esc(py.coupon), 'ok') : '—',
          `<b>${fmtEGP(py.amount)}</b>`,
          renderBadge(esc(py.status), py.status === 'paid' ? 'ok' : py.status === 'failed' ? 'er' : 'wn'),
          fmtDate(py.createdAt)
        ])
      ) : emptyState('💳', 'لا توجد مدفوعات مطابقة', 'لم يتم تسجيل عمليات دفع مطابقة لمعايير التصفية.')}
    </div>
  `;
};

views['admin/coupons'] = (d) => {
  const list = (d && d.coupons) || [];
  list.forEach((c) => {
    if (c.active) COUPONS_MAP[c.code] = c;
    else delete COUPONS_MAP[c.code];
  });
  return `
    ${renderAdminSubnav('admin/coupons')}
    <div class="card">
      <div class="row-wrap" style="margin-bottom:14px">
        <div>
          <h3 style="margin:0">إدارة كوبونات الخصم في قاعدة البيانات (${fmtNum(list.length)})</h3>
          <small class="mu">أنشئ أو عدّل أو أوقف أكواد الخصم الترويجية لاشتراكات التجار</small>
        </div>
        <span class="sp"></span>
        <button class="btn btn-ac btn-sm" data-a="admin-open-coupon-modal">+ إضافة كوبون جديد</button>
      </div>
      ${list.length ? renderTable(
        ['الكود', 'النوع', 'القيمة', 'الوصف', 'الاستخدام', 'الحالة', 'إجراءات'],
        list.map((c) => [
          `<code dir="ltr" style="font-weight:800;font-size:14px;color:var(--pr)">${esc(c.code)}</code>`,
          c.type === 'pct' ? 'نسبة مئوية (٪)' : 'مبلغ ثابت (ج.م)',
          `<b>${c.type === 'pct' ? fmtNum(c.value) + '٪' : fmtEGP(c.value)}</b>`,
          esc(c.desc || '—'),
          `${fmtNum(c.usedCount)} / ${c.maxUses == null ? '∞' : fmtNum(c.maxUses)}`,
          renderBadge(c.active ? 'نشط ✓' : 'موقوف', c.active ? 'ok' : 'er'),
          `<div class="row" style="gap:6px;justify-content:flex-end">
            <button class="btn btn-gh btn-sm" data-a="admin-edit-coupon" data-code="${esc(c.code)}" data-type="${c.type}" data-value="${c.value}" data-desc="${esc(c.desc)}" data-max="${c.maxUses ?? ''}" data-active="${c.active ? 1 : 0}">✎ تعديل</button>
            <button class="btn btn-er btn-sm" data-a="admin-del-coupon" data-code="${esc(c.code)}">🗑 حذف</button>
          </div>`
        ])
      ) : emptyState('🎟️', 'لا توجد كوبونات', 'أضف أول كوبون خصم من الزر أعلاه.')}
    </div>
  `;
};

views['admin/audit'] = (d) => {
  const logs = (d && d.logs) || [];
  return `
    ${renderAdminSubnav('admin/audit')}
    <div class="card">
      <div class="row-wrap" style="margin-bottom:14px">
        <div>
          <h3 style="margin:0">سجل التدقيق الأمني الشامل (Audit Log)</h3>
          <small class="mu">يوثّق كل إجراء يقوم به المشرفون (الاعتماد، الرفض، الإيقاف، تغيير الباقة، المعاينة، الكوبونات)</small>
        </div>
        <span class="sp"></span>
        <select style="width:auto;margin:0" data-i="admin-audit-filter">
          <option value="" ${!state.adminAuditAction ? 'selected' : ''}>كل الإجراءات</option>
          ${['product.approve', 'product.reject', 'order.approve', 'order.reject', 'client.suspend', 'client.reactivate', 'client.change_plan', 'client.impersonate', 'coupon.create', 'coupon.update', 'coupon.delete'].map((actName) => `
            <option value="${actName}" ${state.adminAuditAction === actName ? 'selected' : ''}>${actName}</option>
          `).join('')}
        </select>
      </div>
      ${logs.length ? renderTable(
        ['#', 'التاريخ والوقت', 'المشرف', 'الإجراء', 'الهدف', 'التفاصيل', 'IP'],
        logs.map((l) => [
          `#${l.id}`,
          `<small class="mu">${fmtDate(l.createdAt)} · ${timeAgo(l.createdAt)}</small>`,
          `<b>${esc(l.adminName || 'مشرف')}</b><br><small dir="ltr" class="mu">${esc(l.adminPhone || '')}</small>`,
          `<code dir="ltr" style="color:var(--pr);font-weight:700">${esc(l.action)}</code>`,
          `${esc(l.targetType)} #${l.targetId || '—'}`,
          `<small dir="ltr" class="mu" style="white-space:normal;max-width:320px;display:inline-block">${esc(JSON.stringify(l.details || {}))}</small>`,
          `<code dir="ltr" style="font-size:11.5px">${esc(l.ip || '—')}</code>`
        ])
      ) : emptyState('📜', 'لا توجد سجلات مطابقة', 'جميع إجراءات المشرفين تُسجّل هنا تلقائيًا.')}
    </div>
  `;
};

/* ==========================================================================
   5.14 الصفحات العامة وصفحات استعادة الحساب و404 (Public Pages & 404)
   ========================================================================== */
const renderPublicHeader = () => `
  <header class="navbar">
    <div class="container">
      ${LOGO_HTML}
      <nav class="nav-links" aria-label="روابط الصفحات العامة">
        <a href="#/">الرئيسية</a>
        <a href="#/guides">أكاديمية التاجر</a>
        <a href="#/about">عن المنصة</a>
        <a href="#/terms">الشروط والأحكام</a>
        <a href="#/privacy">سياسة الخصوصية</a>
        <a href="#/contact">تواصل معنا</a>
      </nav>
      <div class="nav-actions">
        <button class="btn btn-gh btn-icon" data-a="theme" aria-label="تبديل المظهر"><span class="theme-ico-moon">${ico('moon', 17)}</span><span class="theme-ico-sun">${ico('sunMoon', 17)}</span></button>
        ${me
          ? `<a class="btn btn-ac btn-sm" href="${roleHomeHash(me)}">لوحة التحكم ${ico('arrowLeft', 15)}</a>`
          : `<button class="nav-text-link hide-xs" data-a="auth" data-m="0">تسجيل الدخول</button>
             <button class="btn btn-ac btn-sm" data-a="auth" data-m="1">حساب مجاني</button>`}
      </div>
    </div>
  </header>
`;

const PUBLIC_PAGES = {
  about: () => `
    <div class="card public-prose">
      <span class="sec-kicker">عن OrderFlow</span>
      <h1>نظام التشغيل المالي واللوجستي للتاجر المصري</h1>
      <p>صُممت منصة <b>OrderFlow</b> خصيصًا لتمكين التجار والمخازن والعلامات التجارية في مصر من إدارة مبيعاتهم عبر أمازون مصر ونون وجوميا من شاشة واحدة مترابطة بالجنيه المصري.</p>
      <h3>رؤيتنا ورسالتنا</h3>
      <p>نهدف إلى القضاء على أخطاء الإكسل اليدوية وغرامات نفاد المخزون وتشتت مستحقات الدفع عند الاستلام (COD)، مع تزويد التاجر المصري بأدوات محاسبية دقيقة تحسب عمولة كل سوق وضريبة القيمة المضافة ١٤٪ ومخصص المرتجعات (RTO).</p>
      <h3>لماذا يثق بنا أكثر من ١٬٢٤٠ تاجرًا؟</h3>
      <ul>
        <li>مزامنة مركزية للمخزون والمنتجات المعتمدة عبر أمازون ونون وجوميا.</li>
        <li>مطابقة آلية لتحصيلات بوسطة وأرامكس ومايلرز مع حسابات InstaPay.</li>
        <li>إصدار فواتير ضريبية إلكترونية مبسطة برمز QR متوافقة مع منظومة الضرائب المصرية (ETA).</li>
        <li>دعم فني محلي متخصص يفهم طبيعة التجارة الإلكترونية والشحن في ٢٧ محافظة مصرية.</li>
      </ul>
    </div>
  `,
  terms: () => `
    <div class="card public-prose">
      <span class="sec-kicker">وثيقة قانونية</span>
      <h1>الشروط والأحكام</h1>
      <p>باستخدامك لمنصة <b>OrderFlow</b> فإنك توافق على الالتزام بهذه الشروط والأحكام المنظمة لاستخدام خدمات إدارة المتاجر والمخزون والفوترة.</p>
      <h3>١. شروط الحساب ومراجعة المحتوى</h3>
      <p>يلتزم التاجر بتقديم بيانات صحيحة لمتجره ورقم هاتفه وبريده الإلكتروني. تخضع المنتجات والطلبات الجديدة للمراجعة والاعتماد لضمان التوافق مع معايير الجودة، ولا تُحتسب إلا العناصر المعتمدة في أرصدة المزامنة.</p>
      <h3>٢. الاشتراكات والباقات</h3>
      <p>تتوفر باقة البداية مجانًا حتى ٥٠ منتجًا، بينما تُفوترك الباقات الاحترافية وباقات الشركات شهريًا أو سنويًا بالجنيه المصري شاملة ضريبة القيمة المضافة ١٤٪.</p>
      <h3>٣. مسؤولية الاستخدام والأمان</h3>
      <p>أنت مسؤول عن الحفاظ على سرية كلمة المرور الخاصة بك. يحق لإدارة المنصة إيقاف أي حساب يخالف السياسات أو يسيء استخدام الموارد التقنية.</p>
    </div>
  `,
  privacy: () => `
    <div class="card public-prose">
      <span class="sec-kicker">حماية البيانات</span>
      <h1>سياسة الخصوصية</h1>
      <p>نلتزم في <b>OrderFlow</b> بحماية خصوصية بيانات متجرك وعملائك وفقًا لأعلى معايير الأمان التقني وقانون حماية البيانات الشخصية المصري.</p>
      <h3>١. البيانات التي نجمعها</h3>
      <p>نحتفظ ببيانات المتجر (الاسم، الهاتف، البريد الإلكتروني، الرقم الضريبي) وبيانات الكتالوج والطلبات اللازمة لتشغيل لوحة التحكم وإصدار الفواتير وبوالص الشحن.</p>
      <h3>٢. أمان المدفوعات</h3>
      <p>لا نخزّن أرقام البطاقات البنكية الكاملة أو رموز CVV على خوادمنا إطلاقًا؛ تتم معالجة المدفوعات عبر قنوات مشفرة وتُحفظ فقط المراجع الضريبية وآخر ٤ أرقام للإيصال.</p>
      <h3>٣. عزل الحسابات وحق الحذف</h3>
      <p>بيانات كل تاجر معزولة تمامًا، ويمكنك في أي وقت تصدير بياناتك بصيغة CSV أو حذف حسابك نهائيًا من صفحة الإعدادات.</p>
    </div>
  `,
  refund: () => `
    <div class="card public-prose">
      <span class="sec-kicker">ضمان رضا التاجر</span>
      <h1>سياسة الاسترجاع وإلغاء الاشتراك</h1>
      <p>نحرص على شفافية التعامل المالي مع جميع التجار المشتركين في باقات OrderFlow المدفوعة.</p>
      <h3>١. ضمان استرداد الأموال خلال ١٤ يومًا</h3>
      <p>إذا قمت بالاشتراك في الباقة الاحترافية أو باقة الشركات لأول مرة ولم تكن راضيًا عن الخدمة، يمكنك طلب استرداد كامل المبلغ خلال ١٤ يومًا من تاريخ السداد.</p>
      <h3>٢. إلغاء التجديد التلقائي</h3>
      <p>يمكنك إيقاف التجديد التلقائي لاشتراكك في أي وقت بضغطة زر من صفحة «شباك الدفع والاشتراك»، وسيظل اشتراكك ساريًا حتى نهاية الفترة المدفوعة دون أي رسوم إضافية.</p>
      <h3>٣. طريقة الاسترداد</h3>
      <p>يُرد المبلغ بنفس وسيلة الدفع الأصلية (بطاقة بنكية، محفظة إلكترونية، أو تحويل InstaPay) خلال ٣ إلى ٧ أيام عمل.</p>
    </div>
  `,
  contact: () => `
    <div class="grid-2">
      <div class="card public-prose">
        <span class="sec-kicker">نحن هنا لمساعدتك</span>
        <h1>تواصل مع فريق OrderFlow</h1>
        <p>سواء كنت ترغب في الاستفسار عن باقات الشركات، أو طلب مساعدة في ربط متجرك، يسعد فريقنا في القاهرة بالرد عليك.</p>
        <h3>قنوات التواصل المباشر</h3>
        <ul>
          <li><b>البريد الإلكتروني:</b> <code dir="ltr">support@orderflow.eg</code></li>
          <li><b>خدمة التجار (واتساب):</b> <code dir="ltr">+20 100 000 0000</code></li>
          <li><b>المقر الرئيسي:</b> التجمع الخامس، القاهرة الجديدة، جمهورية مصر العربية</li>
          <li><b>مواعيد العمل:</b> يوميًا من ٩ صباحًا حتى ٩ مساءً بتوقيت القاهرة</li>
        </ul>
      </div>
      <div class="card">
        <h3>أرسل لنا رسالة مباشرة</h3>
        <form data-submit="contact-submit" novalidate>
          <label for="ct-name">الاسم الكامل أو اسم المتجر</label>
          <input id="ct-name" maxlength="80" placeholder="مثال: م. أحمد محمود">
          <label for="ct-contact">رقم الموبايل أو البريد الإلكتروني</label>
          <input id="ct-contact" dir="ltr" maxlength="120" placeholder="010xxxxxxxx أو name@domain.com">
          <label for="ct-subj">الموضوع</label>
          <input id="ct-subj" maxlength="140" placeholder="استفسار عن الباقات / طلب دعم فني">
          <label for="ct-msg">الرسالة</label>
          <textarea id="ct-msg" rows="4" maxlength="2000" placeholder="اكتب رسالتك هنا..."></textarea>
          <p id="ct-err" class="er-tx" style="min-height:20px;font-size:13px;font-weight:700"></p>
          <button class="btn" type="submit" style="width:100%">إرسال الرسالة</button>
        </form>
      </div>
    </div>
  `
};

const renderPublicPage = (slug) => `
  ${renderPublicHeader()}
  <main class="container public-page-wrap">
    ${PUBLIC_PAGES[slug]()}
  </main>
  ${renderSiteFooter()}
`;

const renderResetPasswordPage = (query) => {
  const token = query.get('token') || '';
  return `
    ${renderPublicHeader()}
    <main class="container public-page-wrap" style="max-width:540px">
      <div class="card">
        <span class="sec-kicker">أمان الحساب</span>
        <h2>🔑 إعادة تعيين كلمة المرور</h2>
        <p class="mu" style="font-size:13.5px;margin-bottom:14px">أدخل رمز الاستعادة المرسل إليك (صالح لمرة واحدة ولمدة ٣٠ دقيقة) وكلمة المرور الجديدة.</p>
        <form data-submit="reset-password-submit" novalidate>
          <label for="rp-token">رمز استعادة كلمة المرور (One-Time Token)</label>
          <input id="rp-token" dir="ltr" value="${esc(token)}" placeholder="أدخل الرمز المكون من 48 حرفًا">
          <label for="rp-pass">كلمة المرور الجديدة (٨ أحرف على الأقل)</label>
          <input id="rp-pass" type="password" autocomplete="new-password" placeholder="••••••••">
          <p id="rp-err" class="er-tx" style="min-height:22px;font-size:13px;font-weight:700"></p>
          <button class="btn" type="submit" style="width:100%">حفظ كلمة المرور الجديدة</button>
        </form>
      </div>
    </main>
    ${renderSiteFooter()}
  `;
};

const renderVerifyEmailPage = (query) => {
  const token = query.get('token') || '';
  return `
    ${renderPublicHeader()}
    <main class="container public-page-wrap" style="max-width:540px">
      <div class="card">
        <span class="sec-kicker">تأكيد البريد الإلكتروني</span>
        <h2>📧 توثيق البريد الإلكتروني للحساب</h2>
        <p class="mu" style="font-size:13.5px;margin-bottom:14px">أدخل رمز التوثيق المرسل إلى بريدك الإلكتروني لتأكيد ملكية البريد.</p>
        <form data-submit="verify-email-submit" novalidate>
          <label for="ve-token">رمز توثيق البريد الإلكتروني</label>
          <input id="ve-token" dir="ltr" value="${esc(token)}" placeholder="أدخل رمز التوثيق">
          <p id="ve-err" class="er-tx" style="min-height:22px;font-size:13px;font-weight:700"></p>
          <button class="btn" type="submit" style="width:100%">تأكيد وتوثيق البريد الآن ✓</button>
        </form>
      </div>
    </main>
    ${renderSiteFooter()}
  `;
};

const renderNotFoundPage = (badRoute) => `
  ${renderPublicHeader()}
  <main class="container public-page-wrap" style="max-width:640px;text-align:center">
    <div class="card" style="padding:48px 28px">
      <div style="font-size:54px;font-weight:900;color:var(--pr);line-height:1">404</div>
      <h1 style="color:var(--tx);font-size:24px;margin:12px 0 8px">الصفحة المطلوبة غير موجودة</h1>
      <p class="mu" style="margin-bottom:22px">المسار <code dir="ltr">#/${esc(badRoute)}</code> غير متاح أو ربما تم نقله.</p>
      <div class="row-wrap" style="justify-content:center;gap:12px">
        <a class="btn btn-ac" href="#/">العودة للصفحة الرئيسية</a>
        ${me ? `<a class="btn btn-gh" href="${roleHomeHash(me)}">الذهاب للوحة التحكم ◂</a>` : ''}
      </div>
    </div>
  </main>
  ${renderSiteFooter()}
`;

const renderGuidesPage = () => {
  const all = GROWTH.SELLER_GUIDES || [];
  const cats = ['الكل', ...new Set(all.map((g) => g.category))];
  const filtered = growthState.guideCategory === 'الكل' ? all : all.filter((g) => g.category === growthState.guideCategory);
  const active = all.find((g) => g.id === growthState.activeGuideId) || filtered[0] || all[0];

  return `
    ${renderPublicHeader()}
    <main class="container public-page-wrap" style="max-width:1120px">
      <div class="sec-header" style="margin-bottom:32px">
        <span class="sec-kicker">أكاديمية التاجر والمدونة</span>
        <h1 style="color:var(--tx);font-size:clamp(1.7rem,3vw,2.4rem);margin-bottom:10px">أدلة عملية للربح والنمو على أمازون ونون وجوميا</h1>
        <p class="mu">مقالات ودراسات تطبيقية مختصرة للتاجر المصري حول FBA وNoon FBPI وتقليل مرتجعات COD وضريبة ١٤٪.</p>
      </div>

      <div class="row-wrap" style="justify-content:center;margin-bottom:26px">
        <div class="seg-rail" role="group" aria-label="تصفية مقالات الأكاديمية">
          ${cats.map((c) => `
            <button type="button" class="pill ${growthState.guideCategory === c ? 'on' : ''}" data-a="filter-guide" data-v="${esc(c)}">${esc(c)}</button>
          `).join('')}
        </div>
      </div>

      <div class="guides-layout">
        <div class="guides-list">
          ${filtered.map((g) => `
            <button type="button" class="guide-item-btn ${active && active.id === g.id ? 'on' : ''}" data-a="select-guide" data-id="${g.id}">
              <div class="row" style="margin-bottom:6px">
                <span class="meta-inline pr">${g.category}</span>
                <span class="sp"></span>
                <small class="mu">${g.readMin}</small>
              </div>
              <b style="display:block;font-size:15px;line-height:1.5;margin-bottom:4px">${g.title}</b>
              <small class="mu" style="display:block;line-height:1.6">${g.summary}</small>
            </button>
          `).join('')}
        </div>

        ${active ? `
          <article class="card guide-article">
            <div class="row-wrap" style="margin-bottom:12px">
              <span class="meta-inline pr">${active.category}</span>
              <span class="mu" style="font-size:13px">${active.readMin}</span>
            </div>
            <h2 style="font-size:clamp(1.35rem,2.2vw,1.8rem);margin-bottom:12px">${active.title}</h2>
            <p class="mu" style="font-size:15px;line-height:1.8;margin-bottom:18px">${active.summary}</p>

            <div class="guide-takeaways">
              <b style="display:block;margin-bottom:8px;color:var(--pr)">أهم النقاط العملية للتطبيق الفوري:</b>
              <ul class="pricing-feats" style="margin:0;gap:8px">
                ${active.takeaways.map((t) => `<li>${ico('check', 15)}<span>${t}</span></li>`).join('')}
              </ul>
            </div>

            ${active.sections.map((s) => `
              <h3 style="margin-top:22px;margin-bottom:8px">${s.h}</h3>
              <p style="color:var(--tx-sec);line-height:1.85">${s.p}</p>
            `).join('')}

            <div class="card ai-glow" style="margin-top:26px">
              <div class="row-wrap" style="gap:12px">
                <div>
                  <b>طبّق هذه الخطوات فورًا على متجرك</b>
                  <p class="mu" style="font-size:13px;margin:2px 0 0">افتح لوحة التحكم التجريبية أو احجز استشارة نمو مجانية مع خبراء OrderFlow.</p>
                </div>
                <span class="sp"></span>
                <button type="button" class="btn btn-ac btn-sm" data-a="demo">جرب اللوحة الحية</button>
                <button type="button" class="btn btn-gh btn-sm" data-a="open-consult">احجز استشارة مجانية</button>
              </div>
            </div>
          </article>
        ` : ''}
      </div>
    </main>
    ${renderSiteFooter()}
  `;
};

/* ==========================================================================
   6. الغلاف العام للوحة التحكم وعملية الرندرة (App Shell & Router)
   ========================================================================== */
function parseRoute(rawHash) {
  const cleaned = String(rawHash || '').replace(/^#\/?/, '');
  const [pathPart, queryString = ''] = cleaned.split('?');
  const query = new URLSearchParams(queryString);
  const path = pathPart.replace(/\/+$/, '');

  if (!path) return { type: 'landing', viewKey: '', params: {}, query };
  if (path === 'guides') return { type: 'guides', viewKey: 'guides', params: {}, query };
  if (PUBLIC_PAGES[path]) return { type: 'public', viewKey: path, params: {}, query };
  if (path === 'reset-password') return { type: 'reset-password', viewKey: path, params: {}, query };
  if (path === 'verify-email') return { type: 'verify-email', viewKey: path, params: {}, query };

  const ownerClientDetail = /^owner\/clients\/(\d+)$/.exec(path);
  if (ownerClientDetail) {
    return { type: 'owner', viewKey: 'owner/client-detail', params: { id: ownerClientDetail[1] }, query };
  }
  if (path === 'owner' || path.startsWith('owner/')) {
    if (views[path]) return { type: 'owner', viewKey: path, params: {}, query };
    return { type: 'not-found', viewKey: path, params: {}, query };
  }

  if (path === 'moderator' || path.startsWith('moderator/')) {
    if (views[path]) return { type: 'moderator', viewKey: path, params: {}, query };
    return { type: 'not-found', viewKey: path, params: {}, query };
  }

  const clientDetailMatch = /^admin\/clients\/(\d+)$/.exec(path);
  if (clientDetailMatch) {
    return { type: 'owner', viewKey: 'owner/client-detail', params: { id: clientDetailMatch[1] }, query };
  }
  if (path === 'admin' || path.startsWith('admin/')) {
    const mapped = path === 'admin' ? 'owner' : path.replace(/^admin\//, 'owner/');
    if (views[mapped]) return { type: 'owner', viewKey: mapped, params: {}, query };
    return { type: 'not-found', viewKey: path, params: {}, query };
  }
  if (views[path]) {
    return { type: 'app', viewKey: path, params: {}, query };
  }
  return { type: 'not-found', viewKey: path, params: {}, query };
}

let renderSeq = 0;
async function renderApp(keepScroll = false) {
  const parsed = parseRoute(location.hash);
  const seq = ++renderSeq;
  const root = $('#app');

  if (parsed.type === 'landing') {
    root.removeAttribute('aria-busy');
    root.innerHTML = renderLanding();
    enhanceA11y(root);
    if (!keepScroll) window.scrollTo(0, 0);
    return;
  }

  if (parsed.type === 'guides') {
    root.removeAttribute('aria-busy');
    root.innerHTML = renderGuidesPage();
    enhanceA11y(root);
    if (!keepScroll) window.scrollTo(0, 0);
    return;
  }

  if (parsed.type === 'public') {
    root.removeAttribute('aria-busy');
    root.innerHTML = renderPublicPage(parsed.viewKey);
    enhanceA11y(root);
    if (!keepScroll) window.scrollTo(0, 0);
    return;
  }

  if (parsed.type === 'reset-password') {
    root.removeAttribute('aria-busy');
    root.innerHTML = renderResetPasswordPage(parsed.query);
    enhanceA11y(root);
    if (!keepScroll) window.scrollTo(0, 0);
    return;
  }

  if (parsed.type === 'verify-email') {
    root.removeAttribute('aria-busy');
    root.innerHTML = renderVerifyEmailPage(parsed.query);
    enhanceA11y(root);
    if (!keepScroll) window.scrollTo(0, 0);
    return;
  }

  if (parsed.type === 'not-found') {
    root.removeAttribute('aria-busy');
    root.innerHTML = renderNotFoundPage(parsed.viewKey);
    enhanceA11y(root);
    if (!keepScroll) window.scrollTo(0, 0);
    return;
  }

  // إخفاء لوحات المالك والمشرفين تمامًا (404 Not Found) عن أي مستخدم غير مخوّل
  if (parsed.type === 'owner') {
    if (!me || me.role !== 'owner' || me.readOnly) {
      root.removeAttribute('aria-busy');
      root.innerHTML = renderNotFoundPage(parsed.viewKey);
      enhanceA11y(root);
      if (!keepScroll) window.scrollTo(0, 0);
      return;
    }
    const { viewKey, params } = parsed;
    let data = null;
    if (loaders[viewKey]) {
      root.setAttribute('aria-busy', 'true');
      try { data = await loaders[viewKey](params); } catch (e) { data = { __error: e.message }; }
      if (seq !== renderSeq) return;
    }
    root.removeAttribute('aria-busy');
    root.innerHTML = window.OrderFlowRBAC.renderOwnerShell(viewKey, data, {
      me, state, ico, LOGO_HTML, errorState,
      renderAppContent: (k, d) => views[k](d)
    });
    enhanceA11y(root);
    if (!keepScroll) window.scrollTo(0, 0);
    return;
  }

  if (parsed.type === 'moderator') {
    const canSeeApprovals = Boolean(me && me.permissions && me.permissions.review_products_orders);
    if (!me || me.role !== 'moderator' || (parsed.viewKey === 'moderator/approvals' && !canSeeApprovals)) {
      root.removeAttribute('aria-busy');
      root.innerHTML = renderNotFoundPage(parsed.viewKey);
      enhanceA11y(root);
      if (!keepScroll) window.scrollTo(0, 0);
      return;
    }
    const { viewKey, params } = parsed;
    let data = null;
    if (loaders[viewKey]) {
      root.setAttribute('aria-busy', 'true');
      try { data = await loaders[viewKey](params); } catch (e) { data = { __error: e.message }; }
      if (seq !== renderSeq) return;
    }
    root.removeAttribute('aria-busy');
    root.innerHTML = window.OrderFlowRBAC.renderModeratorShell(viewKey, data, {
      me, state, ico, LOGO_HTML, errorState,
      renderAppContent: (k, d) => views[k](d)
    });
    enhanceA11y(root);
    if (!keepScroll) window.scrollTo(0, 0);
    return;
  }

  if (!me) {
    go('#/');
    showToast('سجّل الدخول للوصول إلى لوحة التحكم');
    actions.auth({ dataset: { m: 0 } });
    return;
  }

  // توجيه المالك والمشرف إلى لوحتهم الخاصة عند زيارة مسارات العملاء مباشرة
  if (me.role === 'owner' && !me.readOnly && !getImpersonateToken()) {
    go('#/owner');
    return;
  }
  if (me.role === 'moderator') {
    go('#/moderator');
    return;
  }

  const { viewKey, params } = parsed;
  let data = null;
  if (loaders[viewKey]) {
    root.setAttribute('aria-busy', 'true');
    try { data = await loaders[viewKey](params); } catch (e) { data = { __error: e.message }; }
    if (seq !== renderSeq) return;
  }
  root.removeAttribute('aria-busy');
  root.innerHTML = renderShell(viewKey, data);
  enhanceA11y(root);
  if (viewKey === 'ai' && growthState.aiTab === 'photo') {
    setTimeout(redrawPhotoStudioCanvas, 20);
  }
  if (!keepScroll) window.scrollTo(0, 0);
}

const boot = async () => {
  if (getStoredToken() || getImpersonateToken()) await loadSession();
  // توجيه المسار المباشر /owner أو /moderator للمخوّلين فقط
  if (!location.hash) {
    if ((location.pathname === '/owner' || location.pathname.startsWith('/owner/')) && me && me.role === 'owner') {
      history.replaceState(null, '', '/#/owner');
    } else if ((location.pathname === '/moderator' || location.pathname.startsWith('/moderator/')) && me && me.role === 'moderator') {
      history.replaceState(null, '', '/#/moderator');
    }
  }
  // العودة من صفحة بوابة الدفع: /?pay_ref=...#/pay
  const payRef = new URLSearchParams(location.search).get('pay_ref');
  if (payRef) {
    history.replaceState(null, '', `${location.pathname}#/pay`);
    if (me) {
      showToast('جارٍ التحقق من حالة الدفع...', 4000);
      const r = await pollPaymentStatus(payRef, 10, 2500).catch(() => null);
      if (r && r.status === 'paid') { pgState.lastReceipt = r.payment; showToast(`🎉 تم تأكيد الدفع وتفعيل «${planInfo.name}»`, 5000); }
      else if (r) showToast('⚠️ لم تكتمل عملية الدفع. يمكنك المحاولة مجددًا.', 5000);
      else showToast('العملية قيد التأكيد — ستظهر حالتها في سجل المدفوعات.', 5000);
    }
  }
  await renderApp();
};

const renderShell = (viewKey, data) => {
  const currentNav = NAV_LINKS.find(n => n.id === viewKey) || NAV_LINKS[0];
  const mobileQuickLinks = [
    NAV_LINKS.find(x => x.id === 'dash'),
    NAV_LINKS.find(x => x.id === 'prod'),
    NAV_LINKS.find(x => x.id === 'ord'),
    NAV_LINKS.find(x => x.id === 'pay')
  ];
  const renderNavGroup = (groupKey, label) => {
    const items = NAV_LINKS.filter(x => x.group === groupKey);
    return `
      <div class="nav-sec-label">${label}</div>
      ${items.map(item => {
        const count = item.badge ? item.badge() : '';
        return `
          <a href="#/${item.id}" class="nav-item ${item.id === viewKey ? 'on' : ''}">
            ${ico(item.icon, 18)}
            <span>${item.title}</span>
            ${count ? `<b class="nav-count">${typeof count === 'number' ? fmtNum(count) : esc(count)}</b>` : ''}
          </a>
        `;
      }).join('')}
    `;
  };
  const isImpersonating = Boolean((me && (me.readOnly || me.impersonatedBy)) || getImpersonateToken());
  return `
    <div class="shell">
      <div class="sidebar-backdrop ${state.dashMenuOpen ? 'open' : ''}" data-a="close-dash-menu"></div>
      <aside class="sidebar ${state.dashMenuOpen ? 'open' : ''}" aria-label="قائمة لوحة التحكم">
        <div class="sidebar-brand">
          ${LOGO_HTML}
          <button class="close-btn mobile-menu-btn" data-a="close-dash-menu" aria-label="إغلاق القائمة">${ico('x', 18)}</button>
        </div>
        ${renderNavGroup('ops', 'العمليات اليومية')}
        ${renderNavGroup('fin', 'المالية والمدفوعات')}
        ${renderNavGroup('tools', 'الأدوات والإعدادات')}
        <span class="sp"></span>
        <div class="store-quota-card side-extra">
          <div class="row" style="margin-bottom:4px">
            <b style="font-size:13.5px;font-family:var(--font-display)">${esc(state.storeName)}</b>
          </div>
          <p class="mu" style="font-size:12px;margin-bottom:9px">${esc(planInfo.name)} · ${fmtNum(planInfo.used)} من ${planInfo.limit == null ? 'غير محدود' : fmtNum(planInfo.limit)} منتج</p>
          <div class="progress"><i style="width:${planInfo.limit ? Math.min(100, (planInfo.used / planInfo.limit) * 100) : 4}%;background:var(--ac)"></i></div>
          <button class="btn btn-gh btn-sm" style="width:100%;margin-top:11px" data-a="upgrade-plan">${ico('pay', 15)} شباك الدفع والترقية</button>
        </div>
      </aside>

      <main>
        ${isImpersonating ? `
          <div class="impersonation-banner" role="status">
            <span>وضع المعاينة للقراءة فقط — أنت تتصفح حساب التاجر «<b>${esc(state.storeName)}</b>» بصلاحية المالك.</span>
            <button class="btn btn-er btn-sm" data-a="exit-impersonation">إنهاء المعاينة والعودة للوحة المالك</button>
          </div>
        ` : ''}
        ${me.isDemo ? demoBanner() : ''}
        <div class="topbar">
          <button class="mobile-menu-btn" data-a="toggle-dash-menu" aria-label="فتح قائمة الأقسام" title="جميع أقسام لوحة التحكم">${ico('menu', 20)}</button>
          <div class="topbar-title-wrap">
            <span class="topbar-icon-box" aria-hidden="true">${ico(currentNav.icon, 20)}</span>
            <div>
              <h2>${currentNav.title}</h2>
              <small class="mu">آخر مزامنة مع أمازون ونون وجوميا: <b>${lastSyncLabel()}</b></small>
            </div>
          </div>
          <span class="sp"></span>
          ${viewKey === 'dash' ? `
            <select data-i="dash-range" aria-label="الفترة الزمنية" style="width:auto;margin:0;padding:8px 14px;min-height:40px">
              ${[[7, 'آخر ٧ أيام'], [30, 'آخر ٣٠ يومًا'], [90, 'آخر ٩٠ يومًا']].map(r => `<option value="${r[0]}" ${state.range === r[0] ? 'selected' : ''}>${r[1]}</option>`).join('')}
            </select>
          ` : ''}
          <button class="btn btn-gh btn-sm" data-a="sync-now" title="مزامنة المخزون والطلبات">${ico('sync', 15)} مزامنة الآن</button>
          <button class="btn btn-ac btn-sm" data-a="add-prod">${ico('plus', 15)} نشر منتج</button>
          <button class="btn btn-gh btn-icon" data-a="theme" aria-label="تبديل المظهر" title="تبديل المظهر"><span class="theme-ico-moon">${ico('moon', 17)}</span><span class="theme-ico-sun">${ico('sunMoon', 17)}</span></button>
        </div>
        ${data && data.__error ? errorState(data.__error) : views[viewKey](data)}
      </main>

      <nav class="mobile-dash-bar" aria-label="التنقل السريع للجوال">
        ${mobileQuickLinks.map(item => {
          const count = item.badge ? item.badge() : '';
          const shortLabels = { dash: 'الرئيسية', prod: 'المنتجات', ord: 'الطلبات', pay: 'الدفع' };
          return `
            <a href="#/${item.id}" class="${item.id === viewKey ? 'on' : ''}">
              <span>${ico(item.icon, 18)}</span>
              <span>${shortLabels[item.id] || item.title.split(' ')[0]}</span>
              ${count ? `<b class="m-badge">${typeof count === 'number' ? fmtNum(count) : esc(count)}</b>` : ''}
            </a>
          `;
        }).join('')}
        <button type="button" class="${!mobileQuickLinks.some(x => x.id === viewKey) ? 'on' : ''}" data-a="toggle-dash-menu">
          <span>${ico('menu', 18)}</span>
          <span>المزيد</span>
        </button>
      </nav>
    </div>
  `;
};

/* ==========================================================================
   7. النوافذ المنبثقة والأحداث التفاعلية (Modals & Action Handlers)
   ========================================================================== */
const actions = {};
const inputs = {};

const openDialog = (title, bodyHtml, wide = false) => {
  dlg.classList.toggle('dlg-wide', Boolean(wide));
  dlg.innerHTML = `
    <div class="dlg-head">
      <h3 style="margin:0">${title}</h3>
      <button class="close-btn" data-a="close-dlg" aria-label="إغلاق">✕</button>
    </div>
    <div id="dlg-body-slot">${bodyHtml}</div>
  `;
  if (!dlg.open) dlg.showModal();
  enhanceA11y(dlg);
  // النافذة العريضة (الدفع): لا نقفز لأول حقل كي لا تُحجب الرأس والملخص؛ نترك التركيز للنافذة نفسها
  const first = wide ? null : dlg.querySelector('input:not([type=checkbox]):not([disabled]), select, textarea');
  if (first) first.focus();
  else if (wide) { dlg.scrollTop = 0; const h = dlg.querySelector('.dlg-head h3'); if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); } }
};

let pendingConfirmFn = null;
const openConfirmDialog = (title, message, confirmText, isDanger, onConfirm) => {
  pendingConfirmFn = onConfirm;
  openDialog(title, `
    <p class="mu" style="font-size:14.5px;margin-bottom:18px;line-height:1.7">${esc(message)}</p>
    <div class="row-wrap" style="justify-content:flex-end">
      <button type="button" class="btn btn-gh" data-a="close-dlg">إلغاء</button>
      <button type="button" class="btn ${isDanger ? 'btn-er' : 'btn-ac'}" data-a="confirm-proceed">${esc(confirmText)}</button>
    </div>
  `);
};

actions['close-dlg'] = () => dlg.close();

actions['toggle-mobile-nav'] = () => {
  state.mobileNavOpen = !state.mobileNavOpen;
  const drawer = $('#mobile-nav-drawer');
  if (drawer) drawer.classList.toggle('open', state.mobileNavOpen);
};

actions['toggle-dash-menu'] = () => {
  state.dashMenuOpen = !state.dashMenuOpen;
  const sb = $('.sidebar');
  const bd = $('.sidebar-backdrop');
  if (sb) sb.classList.toggle('open', state.dashMenuOpen);
  if (bd) bd.classList.toggle('open', state.dashMenuOpen);
};

actions['close-dash-menu'] = () => {
  state.dashMenuOpen = false;
  const sb = $('.sidebar');
  const bd = $('.sidebar-backdrop');
  if (sb) sb.classList.remove('open');
  if (bd) bd.classList.remove('open');
};

actions.scroll = (el) => {
  state.mobileNavOpen = false;
  const drawer = $('#mobile-nav-drawer');
  if (drawer) drawer.classList.remove('open');
  const target = document.getElementById(el.dataset.t);
  if (target) target.scrollIntoView({ behavior: 'smooth' });
};

actions['hero-mkt'] = (el) => {
  state.heroMarket = el.dataset.v || 'all';
  const box = $('#hero-preview-box');
  if (box) {
    box.innerHTML = renderHeroPreviewCard();
    enhanceA11y(box);
  }
};

actions['hero-sim-order'] = () => {
  const ev = HERO_SAMPLE_EVENTS[heroEventIdx % HERO_SAMPLE_EVENTS.length];
  heroEventIdx++;
  const ch = heroLiveState[ev.m];
  ch.orders += 1;
  ch.revenue += ev.price;
  ch.profit += ev.net;
  ch.cod += ev.price;
  const otherMkts = ['a', 'n', 'j'].filter(k => k !== ev.m).map(k => MARKETPLACES[k].name).join(' و');
  heroLiveState.lastEvent = `طلب جديد (${ev.gov}) على ${MARKETPLACES[ev.m].name}: «${ev.item}» بـ ${fmtEGP(ev.price)} ← خُصم المخزون فورًا من ${otherMkts} (+${fmtEGP(ev.net)} ربح صافي)`;
  const box = $('#hero-preview-box');
  if (box) {
    box.innerHTML = renderHeroPreviewCard();
    enhanceA11y(box);
  }
  showToast(`⚡ تمت محاكاة طلب جديد على ${MARKETPLACES[ev.m].name} ومزامنة المخزون لحظيًا!`);
};

actions['pricing-toggle'] = (el) => {
  state.yearlyPricing = +el.dataset.v === 1;
  renderApp(true);
};

actions['mkt-filter'] = (el) => {
  state.marketFilter = el.dataset.v;
  saveAppState();
  renderApp(true);
};

actions['prod-flt'] = (el) => {
  state.prodStockFilter = el.dataset.v;
  renderApp(true);
};

const renderModalProfitPreview = () => {
  const price = num($('#pm-price')?.value || 0);
  const cost = num($('#pm-cost')?.value || 0);
  const box = $('#pm-profit-preview');
  if (!box) return;
  if (!price) {
    box.innerHTML = '<span class="mu">أدخل سعر البيع وتكلفة الشراء لمعاينة صافي الربح التقديري بعد عمولة المنصة وضريبة ١٤٪.</span>';
    return;
  }
  const avgFee = price * 0.11 * 1.14;
  const estNet = Math.round(price - cost - avgFee);
  const margin = Math.round((estNet / price) * 100);
  box.innerHTML = `
    <div class="row-wrap" style="justify-content:space-between;font-size:13px">
      <span>صافي الربح التقديري (بعد متوسط عمولة ١١٪ + ضريبة ١٤٪):</span>
      <b class="${estNet >= 0 ? 'ok-tx' : 'er-tx'}">${fmtEGP(estNet)} (${fmtNum(margin)}٪)</b>
    </div>
  `;
};
inputs['pm-calc'] = renderModalProfitPreview;

const openProductModal = (prod = null) => {
  const isEdit = !!prod;
  const currentImg = isEdit ? (prod.image || '') : '';
  openDialog(
    isEdit ? '✎ تعديل بيانات المنتج' : '+ نشر منتج جديد على الأسواق',
    `
      <input type="hidden" id="pm-id" value="${isEdit ? prod.id : ''}">
      <label for="pm-name">اسم المنتج</label>
      <input id="pm-name" placeholder="مثال: سماعة بلوتوث لاسلكية" value="${isEdit ? esc(prod.name) : ''}">
      <div class="grid-equal" style="gap:10px">
        <div>
          <label for="pm-sku">كود المنتج (SKU)</label>
          <input id="pm-sku" dir="ltr" placeholder="SKU-105" value="${isEdit ? esc(prod.sku) : 'EG-' + (products.length + 101)}">
        </div>
        <div>
          <label for="pm-cat">الفئة</label>
          <input id="pm-cat" placeholder="إلكترونيات" value="${isEdit ? esc(prod.cat || 'إلكترونيات') : 'إلكترونيات'}">
        </div>
      </div>
      <div class="grid-equal" style="gap:10px">
        <div>
          <label for="pm-cost">تكلفة الشراء (ج.م)</label>
          <input id="pm-cost" type="number" inputmode="numeric" data-i="pm-calc" value="${isEdit ? prod.cost : ''}">
        </div>
        <div>
          <label for="pm-price">سعر البيع للعميل (ج.م)</label>
          <input id="pm-price" type="number" inputmode="numeric" data-i="pm-calc" value="${isEdit ? prod.price : ''}">
        </div>
      </div>
      <div id="pm-profit-preview" style="background:var(--bg);padding:10px 12px;border-radius:8px;margin-bottom:12px;font-size:12.5px"></div>
      <label for="pm-stock">الكمية المتاحة في المخزون</label>
      <input id="pm-stock" type="number" inputmode="numeric" value="${isEdit ? prod.stock : 20}">
      <label for="pm-image">صورة المنتج (رابط صورة أو اختر أيقونة جاهزة)</label>
      <div class="row" style="gap:10px;margin-bottom:8px">
        <div id="pm-img-preview">${renderProdThumb({ name: isEdit ? prod.name : 'منتج', image: currentImg }, 42)}</div>
        <input id="pm-image" class="sp" dir="ltr" data-i="pm-img-sync" placeholder="https://... أو data:image/..." value="${esc(currentImg)}" style="margin:0">
      </div>
      <div class="row-wrap" style="gap:6px;margin-bottom:12px">
        ${PRESET_PROD_IMAGES.map((pr, idx) => `
          <button type="button" class="btn btn-gh btn-sm" data-a="pick-preset-img" data-idx="${idx}" style="padding:4px 8px">
            <img src="${esc(pr.url)}" alt="${esc(pr.label)}" style="width:20px;height:20px;border-radius:4px">
            <span>${esc(pr.label)}</span>
          </button>
        `).join('')}
      </div>
      <label style="margin-bottom:8px">الأسواق المطلوب النشر عليها</label>
      <div class="row-wrap" style="margin-bottom:16px">
        ${['a', 'n', 'j'].map(k => `
          <label class="row" style="cursor:pointer;color:var(--tx);font-weight:600">
            <input type="checkbox" class="pm-mkt" value="${k}" style="width:auto;min-height:auto;margin:0" ${!isEdit || prod.markets.includes(k) ? 'checked' : ''}>
            ${renderMarketChip(k)} ${MARKETPLACES[k].name}
          </label>
        `).join('')}
      </div>
      <button class="btn" style="width:100%" data-a="save-prod">
        ${isEdit ? 'حفظ التعديلات ومزامنة الأسعار' : '🚀 نشر المنتج الآن'}
      </button>
      ${isEdit ? `<button class="btn btn-er" style="width:100%;margin-top:8px" data-a="delete-prod" data-id="${prod.id}">🗑 حذف المنتج</button>` : ''}
    `
  );
  renderModalProfitPreview();
};

inputs['pm-img-sync'] = (el) => {
  const prev = $('#pm-img-preview');
  if (prev) prev.innerHTML = renderProdThumb({ name: $('#pm-name')?.value || 'منتج', image: el.value.trim() }, 42);
};

actions['pick-preset-img'] = (el) => {
  const preset = PRESET_PROD_IMAGES[+el.dataset.idx];
  const inp = $('#pm-image');
  if (preset && inp) {
    inp.value = preset.url;
    inputs['pm-img-sync'](inp);
  }
};

actions['add-prod'] = () => openProductModal(null);
actions['edit-prod'] = (el) => {
  const p = products.find(x => x.id == el.dataset.id);
  if (p) openProductModal(p);
};

actions.theme = () => {
  const root = document.documentElement;
  const current = root.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  const next = current === 'dark' ? 'light' : 'dark';
  root.dataset.theme = next;
  try { localStorage.setItem('omni_theme', next); } catch (_) {}
};

const refreshPgCounterUI = () => {
  const modalSlot = $('#dlg-body-slot');
  if (dlg.open && modalSlot && dlg.classList.contains('dlg-wide')) {
    modalSlot.innerHTML = renderPaymentGatewayCounter(true);
    enhanceA11y(modalSlot);
  }
  const pageBox = $('#pay-page-counter-box');
  if (pageBox) {
    pageBox.innerHTML = renderPaymentGatewayCounter(false);
    enhanceA11y(pageBox);
  }
};

const openPaymentGatewayModal = async (planId = 'pro', cycle = null) => {
  await ensurePgGateway();
  if (planId && planId !== 'free') pgState.plan = planId;
  if (cycle) pgState.cycle = cycle;
  else if (location.hash === '' || location.hash === '#/') pgState.cycle = state.yearlyPricing ? 'yearly' : 'monthly';
  pgState.lastReceipt = null;
  state.mobileNavOpen = false;
  openDialog('💳 شباك الدفع الإلكتروني الآمن — OrderFlow Pay', renderPaymentGatewayCounter(true), true);
};

actions['open-pay-window'] = (el) => {
  openPaymentGatewayModal(el?.dataset?.p || 'pro', el?.dataset?.c || null);
};

actions['upgrade-plan'] = () => {
  go('#/pay');
};

/* ----- الإجراءات المتصلة بالخادم ----- */
const act = (name, fn) => {
  actions[name] = async (el, ev) => {
    const d = el && el.dataset;
    if (d && d.busy) return;
    if (d) d.busy = '1';
    try {
      await fn(el, ev);
    } catch (e) {
      showToast('⚠️ ' + (e.message || 'حدث خطأ غير متوقع'), 4200);
    } finally {
      if (d) delete d.busy;
    }
  };
};
const closeDlg = () => { if (dlg.open) dlg.close(); };

act('confirm-proceed', async () => {
  const fn = pendingConfirmFn;
  pendingConfirmFn = null;
  if (fn) await fn();
});

// نافذة تسجيل الدخول / إنشاء حساب
actions.auth = (el) => {
  state.authMode = +el.dataset.m;
  const up = state.authMode === 1;
  openDialog(up ? 'إنشاء حساب جديد على OrderFlow' : 'تسجيل الدخول إلى OrderFlow', `
    <form data-submit="auth-submit" novalidate>
      <p class="mu" style="margin-bottom:14px;font-size:13.5px">${up
        ? 'أنشئ حساب متجرك الآن؛ سيُراجع فريق الإدارة طلبك ويُفعّل حسابك خلال وقت قصير.'
        : 'أدخل بريدك الإلكتروني أو رقم الموبايل وكلمة المرور للدخول إلى حسابك.'}</p>
      ${up ? `
        <label for="auth-store">اسم المتجر أو العلامة التجارية</label>
        <input id="auth-store" maxlength="60" autocomplete="organization" placeholder="مثال: متجر النور للإلكترونيات">
        <label for="auth-fullname">الاسم الكامل (اختياري)</label>
        <input id="auth-fullname" maxlength="80" autocomplete="name" placeholder="مثال: أحمد محمود">
        <label for="auth-email">البريد الإلكتروني</label>
        <input id="auth-email" type="email" dir="ltr" autocomplete="email" placeholder="owner@yourstore.com">` : ''}
      <label for="auth-id">${up ? 'رقم الموبايل (واتساب)' : 'البريد الإلكتروني أو رقم الموبايل'}</label>
      <input id="auth-id" dir="ltr" autocomplete="username" ${up ? 'inputmode="tel"' : ''} placeholder="${up ? '010xxxxxxxx' : 'name@store.com أو 010xxxxxxxx'}">
      <div class="row" style="justify-content:space-between">
        <label for="auth-pass" style="margin-bottom:5px">كلمة المرور</label>
        ${!up ? `<a class="pr-tx" style="font-size:12px;font-weight:700;cursor:pointer" data-a="forgot-password">نسيت كلمة المرور؟</a>` : ''}
      </div>
      <input id="auth-pass" type="password" autocomplete="${up ? 'new-password' : 'current-password'}" placeholder="${up ? '٨ أحرف على الأقل' : '••••••••'}">
      <p id="auth-err" class="er-tx" role="alert" style="min-height:22px;margin:2px 0 8px;font-size:13px;font-weight:700"></p>
      <button class="btn" style="width:100%" type="submit">${up ? 'إرسال طلب إنشاء الحساب' : 'تسجيل الدخول'}</button>
      <p class="mu ctr" style="margin-top:14px;font-size:13px">
        ${up ? 'لديك حساب بالفعل؟' : 'ليس لديك حساب؟'}
        <a class="pr-tx" style="font-weight:700;cursor:pointer" data-a="auth" data-m="${up ? 0 : 1}">${up ? 'سجّل الدخول' : 'أنشئ حسابًا جديدًا'}</a>
      </p>
    </form>
    <hr style="border:0;border-top:1px solid var(--bd);margin:14px 0">
    <button class="btn btn-gh" style="width:100%" data-a="demo">أو جرّب لوحة تحكم تجريبية بدون تسجيل</button>
  `);
};

act('auth-submit', async () => {
  const up = state.authMode === 1;
  const err = $('#auth-err');
  err.textContent = '';
  const id = $('#auth-id').value.trim();
  const password = $('#auth-pass').value;
  let r;
  try {
    if (up) {
      r = await api('POST', '/api/auth/register', {
        store: $('#auth-store').value.trim(),
        fullName: $('#auth-fullname')?.value.trim() || '',
        email: $('#auth-email')?.value.trim() || '',
        phone: id,
        password
      });
    } else {
      r = await api('POST', '/api/auth/login', { id, password });
    }
  } catch (e) {
    err.textContent = e.message;
    return;
  }

  // دورة حياة حساب العميل: الحساب الجديد قيد المراجعة ولا يُسمح له بالدخول قبل التفعيل
  if (up && r && r.pending) {
    openDialog('تم استلام طلب التسجيل بنجاح', `
      <div class="rbac-pending-box">
        <div class="rbac-pending-icon" aria-hidden="true">${ico('clock', 26)}</div>
        <h3 style="margin:0 0 8px">حسابك الآن قيد المراجعة من قِبل الإدارة</h3>
        <p class="mu" style="font-size:14px;line-height:1.75;margin-bottom:18px">
          ${esc(r.message || 'تم حفظ بيانات حسابك بحالة «قيد المراجعة». فور موافقة الإدارة وتفعيل الحساب ستتمكن من تسجيل الدخول واستخدام المنصة بشكل طبيعي.')}
        </p>
        <div class="row-wrap" style="justify-content:center;gap:10px">
          <button type="button" class="btn btn-ac" data-a="close-dlg">حسنًا، فهمت</button>
          <button type="button" class="btn btn-gh" data-a="auth" data-m="0">الذهاب لتسجيل الدخول</button>
        </div>
      </div>
    `);
    return;
  }

  closeDlg();
  await loadSession();
  const target = (r && r.redirectTo) || roleHomeHash(me);
  go(target);
  if (me && me.role === 'owner') showToast('مرحبًا بك في لوحة تحكم المالك');
  else if (me && me.role === 'moderator') showToast('مرحبًا بك في لوحة المشرفين');
  else showToast(up ? 'مرحبًا بك في OrderFlow' : 'مرحبًا بعودتك');
});

actions['forgot-password'] = () => {
  openDialog('🔑 استعادة كلمة المرور', `
    <form data-submit="forgot-password-submit" novalidate>
      <p class="mu" style="margin-bottom:12px;font-size:13.5px">أدخل رقم الموبايل أو البريد الإلكتروني المسجل بحسابك لإصدار رمز مؤقت لاستعادة كلمة المرور (صالح لمدة ٣٠ دقيقة لمرة واحدة).</p>
      <label for="fp-id">رقم الموبايل أو البريد الإلكتروني</label>
      <input id="fp-id" dir="ltr" placeholder="010xxxxxxxx أو sales@store.com">
      <p id="fp-err" class="er-tx" role="alert" style="min-height:20px;font-size:13px;font-weight:700"></p>
      <button class="btn" style="width:100%" type="submit">إرسال رمز الاستعادة</button>
    </form>
  `);
};

act('forgot-password-submit', async () => {
  const err = $('#fp-err');
  if (err) err.textContent = '';
  const id = $('#fp-id')?.value.trim();
  if (!id) { if (err) err.textContent = 'أدخل رقم الموبايل أو البريد الإلكتروني'; return; }
  try {
    const r = await api('POST', '/api/auth/forgot-password', { id });
    closeDlg();
    showToast(r.message || 'تم إرسال رمز الاستعادة ✓');
    go(r.devToken ? `#/reset-password?token=${encodeURIComponent(r.devToken)}` : '#/reset-password');
  } catch (e) {
    if (err) err.textContent = e.message;
  }
});

act('reset-password-submit', async () => {
  const err = $('#rp-err');
  if (err) err.textContent = '';
  const token = $('#rp-token')?.value.trim();
  const password = $('#rp-pass')?.value || '';
  try {
    const r = await api('POST', '/api/auth/reset-password', { token, password });
    showToast(r.message || 'تم تعيين كلمة المرور الجديدة بنجاح ✓');
    go('#/');
    actions.auth({ dataset: { m: 0 } });
  } catch (e) {
    if (err) err.textContent = e.message;
  }
});

act('send-verify-email', async () => {
  const r = await api('POST', '/api/account/verify-email/send');
  showToast(r.message || 'تم إرسال رمز تأكيد البريد الإلكتروني ✓');
  openDialog('✉️ تأكيد البريد الإلكتروني', `
    <form data-submit="verify-email-submit" novalidate>
      <p class="mu" style="margin-bottom:12px;font-size:13.5px">أدخل رمز التأكيد الذي تم إرساله إلى بريدك الإلكتروني لتوثيق الحساب.</p>
      <label for="ve-modal-token">رمز التأكيد</label>
      <input id="ve-modal-token" dir="ltr" value="${esc(r.devToken || '')}" placeholder="أدخل الرمز">
      <p id="ve-modal-err" class="er-tx" role="alert" style="min-height:20px;font-size:13px;font-weight:700"></p>
      <button class="btn" style="width:100%" type="submit">تأكيد البريد الآن</button>
    </form>
  `);
});

act('verify-email-submit', async () => {
  const token = ($('#ve-modal-token')?.value || $('#ve-token')?.value || '').trim();
  const err = $('#ve-modal-err') || $('#ve-err');
  if (err) err.textContent = '';
  try {
    const r = await api('POST', '/api/auth/verify-email', { token });
    closeDlg();
    await loadSession();
    showToast(r.message || 'تم تأكيد البريد الإلكتروني بنجاح ✓');
    go(me ? '#/set' : '#/');
  } catch (e) {
    if (err) err.textContent = e.message;
  }
});

act('contact-submit', async () => {
  const errEl = $('#ct-err');
  if (errEl) errEl.textContent = '';
  const body = {
    name: $('#ct-name')?.value.trim(),
    contact: ($('#ct-contact')?.value || $('#ct-email')?.value || $('#ct-phone')?.value || '').trim(),
    subject: ($('#ct-subj')?.value || $('#ct-subject')?.value || '').trim(),
    message: ($('#ct-msg')?.value || $('#ct-body')?.value || '').trim()
  };
  try {
    const r = await api('POST', '/api/contact', body);
    if (errEl) { errEl.className = 'ok-tx'; errEl.textContent = r.message || 'تم استلام رسالتك بنجاح ✓'; }
    if ($('#ct-msg')) $('#ct-msg').value = '';
    showToast(r.message || 'تم إرسال رسالتك بنجاح ✓');
  } catch (e) {
    if (errEl) { errEl.className = 'er-tx'; errEl.textContent = e.message; }
  }
});

act('demo', async () => {
  try {
    const r = await api('POST', '/api/auth/demo');
    if (r && r.token) {
      try { localStorage.setItem('omni_token', r.token); } catch (_) {}
    }
    await loadSession();
    showToast('أنت الآن في حساب تجريبي ببيانات جاهزة — تصفّح بحرية', 3600);
    closeDlg();
    go('#/dash');
  } catch (err) {
    showToast('⚠️ ' + (err.message || 'تعذر فتح لوحة التحكم التجريبية'), 4500);
  }
});

act('logout', async () => {
  try { await api('POST', '/api/auth/logout'); } catch (_) {}
  clearSession();
  go('#/');
  showToast('تم تسجيل الخروج');
});

act('choose-plan', async (el) => {
  const pid = el.dataset.p || 'pro';
  if (pid === 'free') {
    if (!me) return actions.auth({ dataset: { m: 1 } });
    if (planInfo && planInfo.id === 'free') return;
    const r = await api('POST', '/api/billing/checkout', { plan: 'free', cycle: 'monthly' });
    planInfo = r.plan;
    showToast(`تم تفعيل ${r.plan.name} ✓`);
    renderApp(true);
    return;
  }
  openPaymentGatewayModal(pid, state.yearlyPricing ? 'yearly' : 'monthly');
});

/* ----- أحداث شباك الدفع الإلكتروني (OrderFlow Pay Gateway Actions) ----- */
actions['pg-select-plan'] = (el) => {
  pgState.plan = el.dataset.p || 'pro';
  refreshPgCounterUI();
};

actions['pg-select-cycle'] = (el) => {
  pgState.cycle = el.dataset.v === 'yearly' ? 'yearly' : 'monthly';
  refreshPgCounterUI();
};

actions['pg-select-method'] = (el) => {
  pgState.method = el.dataset.m || 'card';
  refreshPgCounterUI();
};

act('pg-apply-coupon', async () => {
  const code = String($('#pg-coupon-inp')?.value || pgState.couponInput || '').trim().toUpperCase();
  pgState.couponInput = code;
  if (!code) return showToast('⚠️ أدخل كود الخصم أولًا');
  try {
    const r = await api('POST', '/api/billing/coupon', { code, plan: pgState.plan, cycle: pgState.cycle });
    COUPONS_MAP[code] = { pct: r.coupon.pct, maxDiscount: r.coupon.maxDiscount, desc: r.coupon.desc };
    pgState.appliedCoupon = code;
    showToast(`🎉 تم تطبيق الكوبون ${code}: ${r.coupon.desc}`);
    refreshPgCounterUI();
  } catch (e) {
    showToast('⚠️ ' + (e.message || 'كود الخصم غير صالح'));
  }
});

actions['pg-quick-coupon'] = (el) => {
  const code = el.dataset.c;
  if (!code || !COUPONS_MAP[code]) return;
  pgState.couponInput = code;
  pgState.appliedCoupon = code;
  showToast(`🎉 تم تفعيل الكوبون ${code}: ${COUPONS_MAP[code].desc}`);
  refreshPgCounterUI();
};

actions['pg-clear-coupon'] = () => {
  pgState.couponInput = '';
  pgState.appliedCoupon = '';
  refreshPgCounterUI();
};

actions['pg-fill-demo-card'] = () => {
  pgState.cardHolder = 'AHMED ELNOOR';
  pgState.cardNumber = '4242 4242 4242 4242';
  pgState.cardExpiry = '12/30';
  pgState.cardCvv = '123';
  showToast('💳 تم تعبئة بطاقة الاختبار');
  refreshPgCounterUI();
};

actions['pg-copy-ipa'] = async (el) => {
  const v = el.dataset.v || 'orderflow.pay@instapay';
  if (await copyText(v)) showToast(`📋 تم نسخ "${v}" إلى الحافظة ✓`);
};

actions['pg-send-otp'] = () => {
  const code = String(100000 + Math.floor(Math.random() * 899999));
  pgState.walletOtp = code;
  const inp = $('#pg-wallet-otp');
  if (inp) inp.value = code;
  showToast(`📲 وصل كود التأكيد التجريبي للمحفظة: ${code}`);
};

actions['pg-new-payment'] = () => {
  pgState.lastReceipt = null;
  refreshPgCounterUI();
};

actions['pg-go-dash'] = () => {
  closeDlg();
  go('#/pay');
};

inputs['pg-coupon-typing'] = (el) => {
  pgState.couponInput = el.value;
};

inputs['pg-field-sync'] = () => {
  if ($('#pg-ipa-addr')) pgState.instaPayAddress = $('#pg-ipa-addr').value;
  if ($('#pg-ipa-ref')) pgState.transferRef = $('#pg-ipa-ref').value;
  if ($('#pg-wallet-prov')) pgState.walletProvider = $('#pg-wallet-prov').value;
  if ($('#pg-wallet-phone')) pgState.walletPhone = $('#pg-wallet-phone').value;
  if ($('#pg-wallet-otp')) pgState.walletOtp = $('#pg-wallet-otp').value;
  if ($('#pg-fawry-phone')) pgState.fawryPhone = $('#pg-fawry-phone').value;
};

inputs['pg-card-input'] = (el) => {
  if (el.id === 'pg-card-num') {
    const digits = el.value.replace(/\D/g, '').slice(0, 16);
    el.value = (digits.match(/.{1,4}/g) || []).join(' ');
    pgState.cardNumber = el.value;
  } else if (el.id === 'pg-card-exp') {
    let d = el.value.replace(/\D/g, '').slice(0, 4);
    if (d.length >= 3) d = d.slice(0, 2) + '/' + d.slice(2);
    el.value = d;
    pgState.cardExpiry = el.value;
  } else if (el.id === 'pg-card-holder') {
    pgState.cardHolder = el.value;
  } else if (el.id === 'pg-card-cvv') {
    pgState.cardCvv = el.value.replace(/\D/g, '').slice(0, 4);
    el.value = pgState.cardCvv;
  }
  const numEl = $('#pg-card-preview-num');
  if (numEl) {
    const raw = String(pgState.cardNumber || '').replace(/\D/g, '');
    numEl.textContent = (raw.padEnd(16, '•').match(/.{1,4}/g) || []).join(' ');
  }
  const bEl = $('#pg-card-preview-brand');
  if (bEl) bEl.textContent = pgCardBrand(String(pgState.cardNumber || '').replace(/\D/g, ''));
  const hEl = $('#pg-card-preview-holder');
  if (hEl) hEl.textContent = pgState.cardHolder || 'MERCHANT NAME';
  const eEl = $('#pg-card-preview-exp');
  if (eEl) eEl.textContent = pgState.cardExpiry || 'MM/YY';
};

const newIdemKey = () => (globalThis.crypto && crypto.randomUUID ? crypto.randomUUID() : `k${Date.now()}${Math.random().toString(36).slice(2, 10)}`);

/** يتابع عملية معلّقة حتى تتأكد من البوابة (الخطاف) أو تنتهي المهلة */
async function pollPaymentStatus(ref, tries = 20, gap = 3000) {
  for (let i = 0; i < tries; i++) {
    const r = await api('GET', `/api/billing/status/${encodeURIComponent(ref)}`);
    if (r.plan) planInfo = r.plan;
    if (r.me) me = r.me;
    if (r.payments) payments = r.payments;
    if (r.status !== 'pending') return r;
    await new Promise((resolve) => setTimeout(resolve, gap));
  }
  return null;
}

act('pg-submit-checkout', async () => {
  const errEl = $('#pg-err');
  if (errEl) errEl.textContent = '';
  const g = pgState.gateway;
  const fail = (msg) => { if (errEl) { errEl.textContent = msg; errEl.focus?.(); } else showToast('⚠️ ' + msg, 4200); };

  inputs['pg-field-sync']();
  if ($('#pg-card-holder')) pgState.cardHolder = $('#pg-card-holder').value.trim();
  if ($('#pg-card-num')) pgState.cardNumber = $('#pg-card-num').value.trim();
  if ($('#pg-card-exp')) pgState.cardExpiry = $('#pg-card-exp').value.trim();
  if ($('#pg-card-cvv')) pgState.cardCvv = $('#pg-card-cvv').value.trim();

  if (g.collectsCardData && pgState.method === 'card') {
    const digits = pgState.cardNumber.replace(/\D/g, '');
    if (digits.length !== 16 || !luhnOk(digits)) return fail('رقم البطاقة غير صالح، تأكد من الأرقام.');
    const m = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(pgState.cardExpiry);
    if (!m) return fail('تاريخ الانتهاء غير صالح (MM/YY).');
    const now = new Date();
    if (+m[2] < now.getFullYear() % 100 || (+m[2] === now.getFullYear() % 100 && +m[1] < now.getMonth() + 1)) return fail('البطاقة منتهية الصلاحية.');
    if (!/^\d{3,4}$/.test(pgState.cardCvv)) return fail('رمز الأمان CVV غير صالح.');
  }

  const btn = $('#btn-pg-submit');
  const restoreBtn = () => { if (btn) { btn.disabled = false; btn.innerHTML = btn.dataset.label || 'إتمام الدفع'; } };
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> جارٍ معالجة العملية...'; }

  try {
    if (!me) {
      if (!g.sandbox) {
        closeDlg();
        showToast('سجّل الدخول أو أنشئ حسابًا أولًا لإتمام الاشتراك');
        actions.auth({ dataset: { m: 0 } });
        return;
      }
      const demoRes = await api('POST', '/api/auth/demo');
      if (demoRes && demoRes.token) { try { localStorage.setItem('omni_token', demoRes.token); } catch (_) {} }
      await loadSession();
    }

    if (!pgState.idemKey) pgState.idemKey = newIdemKey();
    const payload = { plan: pgState.plan, cycle: pgState.cycle, method: pgState.method, coupon: pgState.appliedCoupon, idempotencyKey: pgState.idemKey };
    if (g.collectsCardData) {
      Object.assign(payload, {
        cardHolder: pgState.cardHolder, cardNumber: pgState.cardNumber, cardExpiry: pgState.cardExpiry, cardCvv: pgState.cardCvv,
        instaPayAddress: pgState.instaPayAddress, transferRef: pgState.transferRef,
        walletProvider: pgState.walletProvider, walletPhone: pgState.walletPhone, walletOtp: pgState.walletOtp,
        fawryPhone: pgState.fawryPhone
      });
    }

    const r = await api('POST', '/api/billing/checkout', payload);
    if (r.plan) planInfo = r.plan;
    if (r.me) me = r.me;
    if (r.payments) payments = r.payments;

    pgState.cardNumber = ''; pgState.cardCvv = ''; pgState.cardExpiry = ''; pgState.walletOtp = '';

    if (r.status === 'pending' && r.redirectUrl) {
      showToast('جارٍ تحويلك إلى صفحة الدفع الآمنة...', 4000);
      location.assign(r.redirectUrl);
      return;
    }
    if (r.status === 'pending') {
      showToast('العملية قيد التأكيد من البوابة...', 4000);
      const done = await pollPaymentStatus(r.payment.txRef);
      if (!done || done.status !== 'paid') { renderApp(true); return fail('لم يصلنا تأكيد الدفع بعد. ستجد حالة العملية في سجل المدفوعات وسيُفعَّل اشتراكك تلقائيًا عند التأكيد.'); }
      r.payment = done.payment;
    }
    pgState.idemKey = '';
    pgState.lastReceipt = r.payment;
    showToast(`🎉 تم سداد ${fmtEGP(r.payment.amount)} وتفعيل «${planInfo.name}» بنجاح!`, 4200);
    if (location.hash === '#/pay') renderApp(true); else refreshPgCounterUI();
  } catch (e) {
    pgState.idemKey = '';
    pgState.cardCvv = '';
    if (e.data && e.data.code === 'PAYMENT_UNAVAILABLE') { pgState.gateway = { ...pgState.gateway, enabled: false }; refreshPgCounterUI(); return; }
    fail(e.message);
    restoreBtn();
  }
});

act('open-receipt', async (el) => {
  const w = window.open('', '_blank');
  try {
    const r = await api('POST', `/api/billing/payments/${el.dataset.id}/receipt-link`);
    if (w) { w.opener = null; w.location.href = r.url; } else location.href = r.url;
  } catch (e) { if (w) w.close(); throw e; }
});

act('toggle-autorenew', async () => {
  const next = !(planInfo && planInfo.autoRenew);
  const r = await api('POST', '/api/billing/auto-renew', { autoRenew: next });
  planInfo = r.plan;
  showToast(next ? 'تم تفعيل التجديد التلقائي للاشتراك ✓' : 'تم إيقاف التجديد التلقائي للاشتراك');
  renderApp(true);
});

actions.retry = () => renderApp(true);

/* المنتجات والمخزون */
act('quick-restock', async (el) => {
  const r = await api('POST', `/api/products/${el.dataset.id}/restock`, { qty: 10 });
  upsertProducts([r.product]);
  applyMeta(r);
  showToast(`تم تزويد مخزون "${r.product.name}" بـ ١٠ قطع ومزامنة المنصات ✓`);
  renderApp(true);
});

act('toggle-prod-mkt', async (el) => {
  const p = products.find((x) => x.id === +el.dataset.id);
  const m = el.dataset.m;
  if (!p) return;
  let markets;
  if (p.markets.includes(m)) {
    if (p.markets.length === 1) return showToast('يجب أن يكون المنتج نشطًا على سوق واحد على الأقل');
    markets = p.markets.replace(m, '');
  } else {
    markets = ['a', 'n', 'j'].filter((k) => k === m || p.markets.includes(k)).join('');
  }
  const r = await api('PUT', `/api/products/${p.id}`, { markets });
  upsertProducts([r.product]);
  applyMeta(r);
  showToast(`تم تحديث عرض المنتج على ${MARKETPLACES[m].name} ✓`);
  renderApp(true);
});

act('save-prod', async () => {
  const id = $('#pm-id').value;
  const name = $('#pm-name').value.trim();
  const price = num($('#pm-price').value);
  if (!name || !price) return showToast('⚠️ يرجى إدخال اسم المنتج وسعر البيع');
  const cost = $('#pm-cost').value;
  const body = {
    name,
    sku: $('#pm-sku').value.trim() || 'SKU-' + Date.now().toString(36).toUpperCase(),
    cat: $('#pm-cat').value.trim() || 'عام',
    price,
    cost: cost === '' ? Math.round(price * 0.6) : num(cost),
    stock: num($('#pm-stock').value) || 0,
    image: $('#pm-image')?.value.trim() || '',
    markets: [...document.querySelectorAll('.pm-mkt:checked')].map((c) => c.value).join('') || 'a'
  };
  const r = id ? await api('PUT', `/api/products/${id}`, body) : await api('POST', '/api/products', body);
  upsertProducts([r.product]);
  applyMeta(r);
  closeDlg();
  showToast(id ? 'تم تحديث المنتج ومزامنته مع المنصات ✓' : 'تم نشر المنتج الجديد (قيد مراجعة واعتماد الإدارة) ✓');
  renderApp(true);
});

actions['delete-prod'] = (el) => {
  const p = products.find((x) => x.id === +el.dataset.id);
  if (!p) return;
  openConfirmDialog(
    '🗑 تأكيد حذف المنتج',
    `هل أنت متأكد من حذف "${p.name}" نهائيًا من الكتالوج؟ لا يمكن التراجع عن هذا الإجراء.`,
    'نعم، احذف المنتج',
    true,
    async () => {
      const r = await api('DELETE', `/api/products/${p.id}`);
      products = products.filter((x) => x.id !== p.id);
      applyMeta(r);
      closeDlg();
      showToast('تم حذف المنتج');
      renderApp(true);
    }
  );
};

actions['export-prod-csv'] = () => downloadFile('/api/products/export.csv', 'orderflow-products.csv', 'كتالوج المنتجات CSV');
actions['export-ord-csv'] = () => downloadFile('/api/orders/export.csv', 'orderflow-orders.csv', 'سجل الطلبات CSV');

/* الطلبات والفواتير والإلغاء */
actions['ord-flt'] = (el) => {
  state.orderStatusFilter = +el.dataset.v;
  state.orderPage = 1;
  renderApp(true);
};
actions['ord-page'] = (el) => {
  state.orderPage = +el.dataset.v;
  renderApp(true);
};

act('set-status', async (el) => {
  const r = await api('POST', `/api/orders/${el.dataset.id}/status`, { status: +el.dataset.s });
  upsertProducts(r.products);
  applyMeta(r);
  showToast(`تم تحديث حالة الطلب #${arDigits(r.order.no)} إلى "${ORDER_STATUS[r.order.status].label}" ✓`);
  renderApp(true);
});

actions['cancel-order'] = (el) => {
  const o = ordersById.get(+el.dataset.id);
  if (!o) return;
  openDialog(`✕ إلغاء الطلب #${arDigits(o.no)}`, `
    <form data-submit="cancel-order-submit" novalidate>
      <input type="hidden" id="co-id" value="${o.id}">
      <p class="mu" style="margin-bottom:12px;font-size:13.5px">سيتم إلغاء الطلب للعميل <b>${esc(o.customer)}</b> وإعادة الكميات المخصومة إلى المخزون تلقائيًا.</p>
      <label for="co-reason">سبب الإلغاء</label>
      <input id="co-reason" placeholder="مثال: طلب العميل إلغاء الشحنة قبل التجهيز" value="إلغاء بناءً على طلب العميل">
      <button class="btn btn-er" style="width:100%" type="submit">تأكيد إلغاء الطلب واسترجاع المخزون</button>
    </form>
  `);
};

act('cancel-order-submit', async () => {
  const id = +$('#co-id').value;
  const reason = $('#co-reason')?.value.trim() || 'إلغاء من التاجر';
  const r = await api('POST', `/api/orders/${id}/cancel`, { reason });
  upsertProducts(r.products);
  applyMeta(r);
  closeDlg();
  showToast(`تم إلغاء الطلب #${arDigits(r.order.no)} وإعادة المخزون ✓`);
  renderApp(true);
});

actions['edit-return-reason'] = (el) => {
  openDialog(`↩ سبب ارتجاع الطلب #${arDigits(el.dataset.no)}`, `
    <form data-submit="save-return-reason" novalidate>
      <input type="hidden" id="rr-id" value="${el.dataset.id}">
      <label for="rr-text">سبب المرتجع (RTO)</label>
      <input id="rr-text" value="${esc(el.dataset.reason || '')}" placeholder="مثال: العميل لم يرد على المندوب / رفض الاستلام">
      <button class="btn" style="width:100%" type="submit">حفظ سبب المرتجع</button>
    </form>
  `);
};

act('save-return-reason', async () => {
  const id = +$('#rr-id').value;
  const reason = $('#rr-text')?.value.trim() || '';
  await api('POST', `/api/returns/${id}/reason`, { reason });
  closeDlg();
  showToast('تم تحديث سبب المرتجع ✓');
  renderApp(true);
});

let custSearchTimer;
inputs['cust-search'] = (el) => {
  state.customerQuery = el.value;
  clearTimeout(custSearchTimer);
  custSearchTimer = setTimeout(() => renderApp(true), 260);
};

act('notif-read', async (el) => {
  await api('POST', `/api/notifications/${el.dataset.id}/read`);
  showToast('تم تعليم الإشعار كمقروء ✓');
  renderApp(true);
});

act('notif-read-all', async () => {
  await api('POST', '/api/notifications/read-all');
  showToast('تم تعليم كل الإشعارات كمقروءة ✓');
  renderApp(true);
});

inputs['help-search'] = (el) => {
  state.helpQuery = el.value;
  renderApp(false);
  const inp = $('#help-q');
  if (inp) { inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); }
};

act('submit-ticket', async () => {
  const subject = $('#tk-subj')?.value.trim();
  const message = $('#tk-msg')?.value.trim();
  const priority = $('#tk-prio')?.value || 'normal';
  if (!subject || !message) return showToast('⚠️ يرجى كتابة عنوان التذكرة وتفاصيل المشكلة');
  await api('POST', '/api/support/tickets', { subject, message, priority });
  showToast('تم إرسال تذكرة الدعم الفني بنجاح ✓');
  renderApp(true);
});

const orderLineHtml = (avail) => `
  <div class="row no-line" style="gap:8px;margin-bottom:8px">
    <select class="no-prod" data-i="order-total" aria-label="المنتج" style="margin:0">
      ${avail.map((p) => `<option value="${p.id}" data-price="${p.price}">${esc(p.name)} — ${fmtEGP(p.price)} (متاح ${fmtNum(p.stock)})</option>`).join('')}
    </select>
    <input class="no-qty" data-i="order-total" type="number" min="1" value="1" inputmode="numeric" aria-label="الكمية" style="width:84px;margin:0">
    <button type="button" class="btn btn-gh btn-sm" data-a="remove-order-line" aria-label="حذف المنتج">✕</button>
  </div>
`;

const updateOrderTotal = () => {
  let total = 0;
  document.querySelectorAll('#no-lines .no-line').forEach((l) => {
    const opt = l.querySelector('.no-prod').selectedOptions[0];
    total += (+(opt && opt.dataset.price) || 0) * (num(l.querySelector('.no-qty').value) || 0);
  });
  const box = $('#no-total');
  if (box) box.innerHTML = `<span class="sp mu">إجمالي الطلب</span><b style="font-size:18px">${fmtEGP(total)}</b>`;
};
inputs['order-total'] = updateOrderTotal;

const availFor = (m) => products.filter((p) => p.stock > 0 && p.markets.includes(m) && p.approvalStatus !== 'rejected');
const fillOrderLines = (m) => {
  const avail = availFor(m);
  $('#no-lines').innerHTML = avail.length
    ? orderLineHtml(avail)
    : '<p class="mu" style="font-size:13px;margin-bottom:8px">لا توجد منتجات متاحة ومنشورة على هذا السوق.</p>';
  updateOrderTotal();
};
inputs['order-market'] = (el) => fillOrderLines(el.value);

actions['new-order'] = () => {
  const market = ['a', 'n', 'j'].find((k) => availFor(k).length);
  if (!market) return showToast('أضف منتجًا متاحًا في المخزون أولًا');
  openDialog('+ تسجيل طلب جديد', `
    <form data-submit="save-order" novalidate>
      <div class="grid-equal" style="gap:10px">
        <div><label for="no-market">السوق</label>
          <select id="no-market" data-i="order-market">${['a', 'n', 'j'].map((k) => `<option value="${k}" ${k === market ? 'selected' : ''}>${MARKETPLACES[k].name}</option>`).join('')}</select></div>
        <div><label for="no-courier">شركة الشحن</label>
          <select id="no-courier">${COURIER_NAMES.map((c) => `<option>${c}</option>`).join('')}</select></div>
      </div>
      <label for="no-customer">اسم العميل</label>
      <input id="no-customer" maxlength="60" autocomplete="off">
      <div class="grid-equal" style="gap:10px">
        <div><label for="no-phone">موبايل العميل (اختياري)</label>
          <input id="no-phone" dir="ltr" inputmode="tel" placeholder="010xxxxxxxx"></div>
        <div><label for="no-gov">المحافظة</label>
          <select id="no-gov">${GOVERNORATES.map((g) => `<option>${g}</option>`).join('')}</select></div>
      </div>
      <label for="no-address">العنوان (اختياري، يظهر في بوليصة الشحن)</label>
      <input id="no-address" maxlength="200" autocomplete="off">
      <label for="no-pay">طريقة الدفع</label>
      <select id="no-pay">${PAY_METHODS.map((m) => `<option>${m}</option>`).join('')}</select>
      <label>المنتجات</label>
      <div id="no-lines">${orderLineHtml(availFor(market))}</div>
      <button type="button" class="btn btn-gh btn-sm" data-a="add-order-line" style="margin:2px 0 12px">+ منتج آخر</button>
      <div id="no-total" class="row" style="padding:8px 0;border-top:1px dashed var(--bd)"></div>
      <p id="no-err" class="er-tx" role="alert" style="min-height:22px;font-size:13px;font-weight:700"></p>
      <button class="btn" style="width:100%" type="submit">تسجيل الطلب وخصم المخزون</button>
    </form>
  `);
  updateOrderTotal();
};

actions['add-order-line'] = () => {
  const avail = availFor($('#no-market').value);
  if (!avail.length) return;
  if (!document.querySelector('#no-lines .no-line')) $('#no-lines').innerHTML = '';
  $('#no-lines').insertAdjacentHTML('beforeend', orderLineHtml(avail));
  updateOrderTotal();
};

actions['remove-order-line'] = (el) => {
  if (document.querySelectorAll('#no-lines .no-line').length > 1) {
    el.closest('.no-line').remove();
    updateOrderTotal();
  }
};

act('save-order', async () => {
  const err = $('#no-err');
  err.textContent = '';
  const items = [...document.querySelectorAll('#no-lines .no-line')].map((l) => ({
    productId: +l.querySelector('.no-prod').value,
    qty: num(l.querySelector('.no-qty').value)
  }));
  if (!items.length) { err.textContent = 'أضف منتجًا واحدًا على الأقل'; return; }
  let r;
  try {
    r = await api('POST', '/api/orders', {
      market: $('#no-market').value, courier: $('#no-courier').value, customer: $('#no-customer').value.trim(),
      phone: $('#no-phone').value.trim(), gov: $('#no-gov').value, address: $('#no-address').value.trim(),
      pay: $('#no-pay').value, items
    });
  } catch (e) {
    err.textContent = e.message;
    return;
  }
  upsertProducts(r.products);
  applyMeta(r);
  closeDlg();
  showToast(`تم تسجيل الطلب #${arDigits(r.order.no)} وخصم المخزون ✓`);
  state.orderPage = 1;
  renderApp(true);
});

actions['view-invoice'] = (el) => {
  const o = ordersById.get(+el.dataset.id);
  if (!o) return;
  const preTax = Math.round(o.total / 1.14);
  const vat = o.total - preTax;
  const invUrl = authedUrl(`/api/orders/${o.id}/invoice`);
  openDialog(`🧾 فاتورة ضريبية مبسطة #${arDigits(o.no)}`, `
    <div class="card" style="background:var(--bg);box-shadow:none">
      <div class="row" style="margin-bottom:10px">
        <div class="sp"><b>${esc(state.storeName)}</b><br><small class="mu">الرقم الضريبي: <span dir="ltr">${esc(state.taxId) || '—'}</span></small></div>
        ${renderBadge('فاتورة ضريبية QR', 'pr')}
      </div>
      <div style="font-size:13px;margin-bottom:10px"><b>العميل:</b> ${esc(o.customer)} — ${esc(o.gov)}<br><b>التاريخ:</b> ${fmtDate(o.createdAt)} · <b>الدفع:</b> ${esc(o.pay)} · <b>الشحن:</b> ${esc(o.courier)}</div>
      <div class="row" style="padding:8px 0;border-top:1px dashed var(--bd)"><span class="sp">${esc(o.items)}</span></div>
      <div class="row" style="padding:4px 0"><span class="sp mu">القيمة قبل الضريبة</span><b>${fmtEGP(preTax)}</b></div>
      <div class="row" style="padding:4px 0"><span class="sp mu">ضريبة القيمة المضافة (١٤٪)</span><b>${fmtEGP(vat)}</b></div>
      <div class="row" style="padding:8px 0 0;border-top:1px solid var(--bd)"><b class="sp">الإجمالي شامل الضريبة</b><b class="pr-tx" style="font-size:20px">${fmtEGP(o.total)}</b></div>
    </div>
    <a class="btn" style="width:100%;margin-top:12px;text-align:center;display:flex;text-decoration:none" href="${esc(invUrl)}" target="_blank" rel="noopener noreferrer">🖨️ فتح وطباعة الفاتورة الضريبية الرسمية (QR) ↗</a>
  `);
};

actions['bulk-awb'] = () => {
  const a = document.createElement('a');
  a.href = authedUrl('/api/orders/awb');
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  document.body.appendChild(a);
  a.click();
  a.remove();
  showToast(counts.pendingOrders ? `🚚 جاري تجهيز ${fmtNum(counts.pendingOrders)} بوليصة شحن للطباعة` : 'لا توجد طلبات قيد التجهيز حاليًا');
};

let ordSearchTimer;
let ordSearchSeq = 0;
inputs['ord-search'] = (el) => {
  state.orderQuery = el.value;
  state.orderPage = 1;
  clearTimeout(ordSearchTimer);
  ordSearchTimer = setTimeout(async () => {
    const seq = ++ordSearchSeq;
    try {
      const d = await loaders.ord();
      const box = $('#ord-table-box');
      if (box && seq === ordSearchSeq) { box.innerHTML = renderOrdersTable(d); enhanceA11y(box); }
    } catch (e) {
      showToast('⚠️ ' + e.message);
    }
  }, 280);
};

/* تحصيلات COD */
act('payout-cod', async (el) => {
  const r = await api('POST', `/api/cod/${el.dataset.k}/payout`);
  showToast(`💸 تم تسجيل طلب تحويل ${fmtEGP(r.net)} إلى ${r.handle} بنجاح`, 4000);
  renderApp(true);
});

/* الذكاء الاصطناعي والحلول التفاعلية */
function redrawPhotoStudioCanvas() {
  const canvas = $('#ps-canvas');
  if (!canvas) return;
  const ps = growthState.photoStudio;
  ps.lastDataUrl = GROWTH.renderStudioPhotoOnCanvas(canvas, {
    preset: ps.preset,
    ratio: ps.ratio,
    title: ps.title || 'منتج مميز عالي الجودة',
    badgeText: ps.badgeText,
    priceText: ps.priceText,
    imageElement: ps.uploadedImg
  }) || '';
}

actions['switch-solution-tab'] = (el) => {
  growthState.solutionTab = el.dataset.v || 'ai';
  const slot = $('#landing-solutions-slot');
  if (slot) {
    slot.innerHTML = renderSolutionsPanel();
    enhanceA11y(slot);
  }
};

actions['dismiss-onboarding'] = () => {
  growthState.onboardingDismissed = true;
  renderApp(true);
};

actions['switch-ai-tab'] = (el) => {
  growthState.aiTab = el.dataset.v || 'listing';
  renderApp(true);
};

actions['filter-guide'] = (el) => {
  growthState.guideCategory = el.dataset.v || 'الكل';
  growthState.activeGuideId = '';
  renderApp(true);
};

actions['select-guide'] = (el) => {
  growthState.activeGuideId = el.dataset.id || '';
  renderApp(true);
};

actions['open-consult'] = () => {
  const services = GROWTH.EXPERT_SERVICES_UI || [];
  openDialog('احجز استشارة نمو مجانية مع خبراء OrderFlow', `
    <p class="mu" style="font-size:14px;margin-bottom:16px;line-height:1.7">جلسة تشخيصية مجانية لمدة ٣٠ دقيقة لتحليل متجرك على أمازون ونون وجوميا وترينديول ورسم خطة لمضاعفة أرباحك.</p>
    <form data-submit="submit-consult">
      <div class="grid-equal" style="gap:12px">
        <div>
          <label for="con-name">الاسم الكامل</label>
          <input id="con-name" name="name" required placeholder="مثال: أحمد محمود" value="${esc(me ? state.storeName : '')}">
        </div>
        <div>
          <label for="con-phone">رقم الموبايل / واتساب</label>
          <input id="con-phone" name="phone" required placeholder="01012345678" value="${esc(me ? (state.storePhone || me.phone || '') : '')}">
        </div>
      </div>
      <div class="grid-equal" style="gap:12px">
        <div>
          <label for="con-store">اسم المتجر أو العلامة (اختياري)</label>
          <input id="con-store" name="storeName" placeholder="مثال: متجر النور للإلكترونيات">
        </div>
        <div>
          <label for="con-svc">الخدمة أو الموضوع الأهم لك</label>
          <select id="con-svc" name="serviceKey">
            ${services.map((s) => `<option value="${s.key}" ${s.key === 'growth_consult' ? 'selected' : ''}>${s.title}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="grid-equal" style="gap:12px">
        <div>
          <label for="con-plats">المنصات المستهدفة</label>
          <input id="con-plats" name="platforms" value="أمازون مصر · نون · جوميا">
        </div>
        <div>
          <label for="con-orders">متوسط الطلبات الشهري</label>
          <select id="con-orders" name="monthlyOrders">
            <option value="أبدأ من الصفر">أبدأ من الصفر</option>
            <option value="أقل من ١٠٠ طلب">أقل من ١٠٠ طلب شهريًا</option>
            <option value="١٠٠ – ٥٠٠ طلب" selected>١٠٠ – ٥٠٠ طلب شهريًا</option>
            <option value="أكثر من ٥٠٠ طلب">أكثر من ٥٠٠ طلب شهريًا</option>
          </select>
        </div>
      </div>
      <label for="con-notes">ملاحظات إضافية (اختياري)</label>
      <textarea id="con-notes" name="notes" rows="2" placeholder="أخبرنا عن فئة منتجاتك أو التحدي الذي تريد حله..."></textarea>
      <button type="submit" class="btn btn-ac" style="width:100%" id="btn-con-submit">${ico('send', 15)} تأكيد حجز الاستشارة المجانية</button>
    </form>
  `);
};

actions['select-service-card'] = (el) => {
  growthState.selectedServiceKey = el.dataset.k || 'full_management';
  renderApp(true);
  setTimeout(() => {
    const f = $('#service-req-form-card');
    if (f) f.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 40);
};

act('submit-consult', async () => {
  const name = ($('#con-name')?.value || '').trim();
  const phone = ($('#con-phone')?.value || '').trim();
  const storeName = ($('#con-store')?.value || '').trim();
  const serviceKey = $('#con-svc')?.value || 'growth_consult';
  const platforms = ($('#con-plats')?.value || '').trim();
  const monthlyOrders = $('#con-orders')?.value || '١٠٠ – ٥٠٠ طلب';
  const notes = ($('#con-notes')?.value || '').trim();
  if (name.length < 2) return showToast('يرجى كتابة الاسم الكامل');
  if (phone.length < 8) return showToast('يرجى إدخال رقم موبايل أو واتساب صحيح');
  const btn = $('#btn-con-submit');
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> جاري تسجيل طلب الاستشارة...'; }
  try {
    const r = await api('POST', '/api/consultations', { name, phone, storeName, serviceKey, platforms, monthlyOrders, notes });
    const req = r.request || {};
    openDialog('تم حجز استشارتك المجانية بنجاح', `
      <div class="consult-success-box">
        <div class="empty-icon" style="background:var(--ok-soft);color:var(--ok)">${ico('checkCircle', 26)}</div>
        <h3 style="margin:8px 0 6px">مرحبًا ${esc(name)}، تم استلام طلبك</h3>
        <p class="mu" style="font-size:14px;line-height:1.7;margin-bottom:14px">سيتواصل معك خبير نمو معتمد من OrderFlow عبر واتساب على الرقم <b dir="ltr">${esc(phone)}</b> خلال ساعات العمل لتأكيد موعد الجلسة.</p>
        <div class="consult-ref-pill">رقم المرجع: <b dir="ltr">${esc(req.ref_code || 'OF-CON')}</b></div>
        <div class="row-wrap" style="justify-content:center;gap:10px;margin-top:18px">
          <button type="button" class="btn btn-ac" data-a="close-dlg">تم، شكرًا</button>
          ${me ? '<a class="btn btn-gh" href="#/services" data-a="close-dlg">متابعة طلباتي</a>' : '<button type="button" class="btn btn-gh" data-a="demo">جرب لوحة التحكم الآن</button>'}
        </div>
      </div>
    `);
    showToast(`تم تسجيل الاستشارة المرجعية ${req.ref_code || ''} بنجاح`);
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = `${ico('send', 15)} تأكيد حجز الاستشارة المجانية`; }
  }
});

act('submit-service-req', async () => {
  const serviceKey = $('#srv-key')?.value || growthState.selectedServiceKey || 'full_management';
  const phone = ($('#srv-phone')?.value || '').trim();
  const monthlyOrders = $('#srv-orders')?.value || '٥٠ – ٣٠٠ طلب شهريًا';
  const platforms = ($('#srv-platforms')?.value || '').trim();
  const notes = ($('#srv-notes')?.value || '').trim();
  if (phone.length < 8) return showToast('يرجى إدخال رقم موبايل أو واتساب للتواصل');
  const btn = $('#btn-srv-submit');
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> جاري إرسال الطلب...'; }
  try {
    const r = await api('POST', '/api/services/requests', { serviceKey, phone, monthlyOrders, platforms, notes });
    const req = r.request || {};
    showToast(`تم تسجيل طلب «${req.service_title || 'الخدمة'}» برقم مرجعي ${req.ref_code || ''} ✓`, 4200);
    renderApp(true);
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = `${ico('send', 15)} إرسال طلب الخدمة للخبراء`; }
  }
});

act('ai-generate', async () => {
  const name = $('#ai-name') && $('#ai-name').value.trim();
  const out = $('#ai-output');
  if (!name) return showToast('اكتب اسم المنتج أولًا');
  if (!out) return;
  const btn = $('#btn-ai-gen');
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> جاري التوليد...';
  try {
    const r = await api('POST', '/api/ai/listing', { name, features: $('#ai-feats').value.trim(), tone: $('#ai-tone').value });
    aiListing = { ...r.data, source: r.source };
    aiCache.listing = aiListing;
    out.innerHTML = renderAIListingCards(aiListing);
    showToast(r.source === 'gemini' ? 'تم توليد المحتوى وشرائح A+ بواسطة Gemini' : (r.notice || 'تم توليد المحتوى وشرائح A+ بنجاح'));
  } finally {
    btn.disabled = false;
    btn.innerHTML = `${ico('ai', 16)} توليد المحتوى و A+`;
  }
});

act('ai-market-search', async () => {
  const name = ($('#ai-name') && $('#ai-name').value.trim()) || ($('#radar-name') && $('#radar-name').value.trim());
  const box = $('#ai-market-box');
  if (!name) return showToast('اكتب اسم المنتج أولًا');
  if (!box) return;
  const btn = $('#btn-ai-search') || $('#btn-radar-run');
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> جاري فحص السوق المصري...'; }
  box.innerHTML = `<div class="card"><div class="row"><span class="spinner" style="border-top-color:var(--pr)"></span><b>جاري فحص ومقارنة أسعار «${esc(name)}» في السوق المصري...</b></div></div>`;
  try {
    const r = await api('POST', '/api/ai/price-radar', { name });
    aiCache.market = r.market;
    box.innerHTML = renderMarketResearch(r.market);
    showToast('تم تحليل أسعار السوق المصري بنجاح');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = btn.id === 'btn-radar-run' ? `${ico('globe', 16)} فحص ومقارنة أسعار السوق الآن` : `${ico('globe', 16)} فحص أسعار السوق`;
    }
  }
});

actions['ai-radar-search'] = actions['ai-market-search'];

inputs['radar-select-prod'] = (el) => {
  const inp = $('#radar-name');
  if (inp && el.value) inp.value = el.value;
};

inputs['ps-select-prod'] = (el) => {
  const ps = growthState.photoStudio;
  ps.productId = el.value;
  const prod = products.find((p) => String(p.id) === String(el.value));
  if (prod) {
    ps.title = prod.name;
    ps.priceText = fmtEGP(prod.price);
    if ($('#ps-title-in')) $('#ps-title-in').value = ps.title;
    if ($('#ps-price-in')) $('#ps-price-in').value = ps.priceText;
    if (prod.image) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => { ps.uploadedImg = img; redrawPhotoStudioCanvas(); };
      img.src = prod.image;
    } else {
      ps.uploadedImg = null;
      redrawPhotoStudioCanvas();
    }
  } else {
    redrawPhotoStudioCanvas();
  }
};

inputs['ps-upload-file'] = (el) => {
  const file = el.files && el.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      growthState.photoStudio.uploadedImg = img;
      redrawPhotoStudioCanvas();
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
};

inputs['ps-text-change'] = () => {
  const ps = growthState.photoStudio;
  if ($('#ps-title-in')) ps.title = $('#ps-title-in').value;
  if ($('#ps-badge-in')) ps.badgeText = $('#ps-badge-in').value;
  if ($('#ps-price-in')) ps.priceText = $('#ps-price-in').value;
  redrawPhotoStudioCanvas();
};

actions['ps-preset'] = (el) => {
  growthState.photoStudio.preset = el.dataset.v || 'pure-white';
  renderApp(true);
};

actions['ps-ratio'] = (el) => {
  growthState.photoStudio.ratio = el.dataset.v || '1:1';
  renderApp(true);
};

actions['ps-download'] = () => {
  redrawPhotoStudioCanvas();
  const dataUrl = growthState.photoStudio.lastDataUrl;
  if (!dataUrl) return showToast('تعذّر تصدير الصورة حاليًا');
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = `orderflow-studio-${Date.now()}.jpg`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  showToast('تم تحميل صورة الاستوديو بنجاح');
};

act('ps-save-to-prod', async () => {
  const ps = growthState.photoStudio;
  if (!ps.productId) return showToast('اختر منتجًا من القائمة أولًا لحفظ الصورة عليه');
  const prod = products.find((p) => String(p.id) === String(ps.productId));
  if (!prod) return showToast('المنتج المحدد غير موجود');
  redrawPhotoStudioCanvas();
  const dataUrl = ps.lastDataUrl;
  if (!dataUrl) return showToast('تعذّر تجهيز الصورة');
  const btn = $('#btn-ps-save');
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> جاري الحفظ...'; }
  try {
    const res = await api('PUT', `/api/products/${prod.id}`, {
      name: prod.name,
      sku: prod.sku,
      cat: prod.cat,
      price: prod.price,
      cost: prod.cost,
      stock: prod.stock,
      markets: prod.markets,
      image: dataUrl
    });
    if (res && res.product) {
      const idx = products.findIndex((p) => p.id === prod.id);
      if (idx >= 0) products[idx] = res.product;
    }
    showToast(`تم حفظ صورة الاستوديو على «${prod.name}» بنجاح`);
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = `${ico('checkCircle', 16)} حفظ الصورة للمنتج في الكتالوج`; }
  }
});

async function sendSellerChatQuestion(qText) {
  const question = String(qText || '').trim();
  if (question.length < 2) return showToast('اكتب سؤالك أولًا');
  growthState.aiChat.push({ role: 'user', text: question });
  const input = $('#ai-chat-input');
  if (input) input.value = '';
  renderApp(true);
  const btn = $('#btn-ai-chat-send');
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner"></span>'; }
  try {
    const r = await api('POST', '/api/ai/chat', { question });
    growthState.aiChat.push({ role: 'assistant', text: r.answer || 'تم استلام سؤالك.' });
    renderApp(true);
    const box = $('#ai-chat-messages');
    if (box) box.scrollTop = box.scrollHeight;
  } catch (e) {
    growthState.aiChat.push({ role: 'assistant', text: e.message || 'حدث خطأ أثناء الاتصال بالمساعد.' });
    renderApp(true);
  }
}

actions['ai-chat-quick'] = (el) => {
  sendSellerChatQuestion(el.dataset.q || '');
};

actions['ai-chat-send'] = () => {
  sendSellerChatQuestion($('#ai-chat-input')?.value || '');
};

actions['toggle-thinking'] = (el) => {
  state.highThinking = el.checked;
  const btn = $('#btn-ai-advisor');
  if (btn) btn.innerHTML = `${ico('ai', 15)}<span>${state.highThinking ? 'تحليل استراتيجي فائق' : 'تحليل المتجر بالذكاء الاصطناعي'}</span>`;
};

act('ai-store-advisor', async () => {
  const panel = $('#ai-advisor-panel');
  if (!panel) return;
  const btn = $('#btn-ai-advisor');
  const thinking = Boolean(state.highThinking || $('#chk-high-thinking')?.checked);
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner"></span> ${thinking ? 'جاري التفكير العميق (Gemini 4 Argon)...' : 'جاري تحليل بيانات متجرك...'}`;
  panel.style.marginBottom = '18px';
  panel.innerHTML = `<div class="card ai-glow"><div class="row"><span class="spinner" style="border-top-color:var(--pr)"></span><b>${thinking ? 'يقوم المستشار الاستراتيجي بتشغيل وضع التفكير العميق (Gemini 4 Argon) لمقارنة عمولات الأسواق الثلاثة وتدفقات COD...' : 'يقوم المستشار الذكي بتحليل المخزون وهوامش الربح وتحصيلات الشحن...'}</b></div></div>`;
  try {
    const r = await api('POST', '/api/ai/advisor', { thinking });
    aiCache.advisor = r.advisor;
    panel.innerHTML = renderAdvisor(r.advisor);
    showToast(r.advisor.thinking ? '🧠 اكتمل تقرير التفكير العميق الاستراتيجي للمتجر ✓' : (r.advisor.source === 'gemini' ? '✨ اكتمل التحليل الذكي للمتجر بواسطة Gemini ✓' : '📊 اكتمل تحليل بيانات متجرك ✓'), 3500);
  } catch (e) {
    panel.innerHTML = '';
    panel.style.marginBottom = '0';
    throw e;
  } finally {
    btn.disabled = false;
    btn.innerHTML = state.highThinking ? '🧠 تحليل استراتيجي فائق (High Thinking)' : '✨ تحليل المتجر بالذكاء الاصطناعي';
  }
});

actions['close-advisor'] = () => {
  delete aiCache.advisor;
  const panel = $('#ai-advisor-panel');
  if (panel) { panel.innerHTML = ''; panel.style.marginBottom = '0'; }
};

act('ai-order-msg', async (el) => {
  const o = ordersById.get(+el.dataset.id);
  if (!o) return;
  openDialog(`💬 مساعد رسائل العملاء الذكي (الطلب #${arDigits(o.no)})`, `
    <div id="ai-msg-body" style="padding:16px 0;text-align:center">
      <span class="spinner" style="border-top-color:var(--pr);width:24px;height:24px"></span>
      <p class="mu" style="margin-top:8px">جاري صياغة رسالة واتساب مخصصة للعميل <b>${esc(o.customer)}</b> ...</p>
    </div>
  `);
  let r;
  try {
    r = await api('POST', '/api/ai/order-message', { orderId: o.id });
  } catch (e) {
    closeDlg();
    throw e;
  }
  const box = $('#ai-msg-body');
  if (!box) return;
  box.style.textAlign = 'start';
  const waHref = o.phone ? `https://wa.me/2${encodeURIComponent(o.phone)}?text=${encodeURIComponent(r.text)}` : '';
  box.innerHTML = `
    <div class="row-wrap" style="margin-bottom:8px">
      <span class="ai-badge">${r.source === 'gemini' ? '✨ جاهزة للإرسال عبر واتساب' : '📝 رسالة جاهزة (قالب)'}</span>
      <span class="sp"></span>
      <span class="mu" style="font-size:12px">العميل: ${esc(o.customer)} (${esc(o.gov)})</span>
    </div>
    <textarea id="ai-wa-text" rows="6" style="font-size:14px;line-height:1.7">${esc(r.text)}</textarea>
    <div class="row-wrap">
      <button class="btn sp" data-a="copy-wa-msg">📋 نسخ الرسالة</button>
      ${waHref ? `<a class="btn btn-ok" href="${esc(waHref)}" target="_blank" rel="noopener noreferrer" style="text-decoration:none">💬 فتح واتساب ↗</a>` : ''}
    </div>
  `;
});

act('copy-wa-msg', async () => {
  const ta = $('#ai-wa-text');
  if (!ta) return;
  if (await copyText(ta.value)) { closeDlg(); showToast('📋 تم نسخ رسالة الواتساب إلى الحافظة ✓'); }
  else showToast('⚠️ تعذر النسخ تلقائيًا، حدّد النص وانسخه يدويًا');
});

act('copy-tx', async (el) => {
  const t = document.getElementById(el.dataset.target);
  if (!t) return;
  showToast((await copyText(t.innerText.trim())) ? '📋 تم نسخ النص إلى الحافظة' : '⚠️ تعذر النسخ');
});

/* التكاملات ومفاتيح API للمنصات والإعدادات والحساب */
act('toggle-int', async (el) => {
  const on = !state.integrations[el.dataset.k];
  const r = await api('PUT', '/api/settings/integrations', { key: el.dataset.k, on });
  state.integrations = r.integrations;
  showToast(on ? 'تم تفعيل الربط والمزامنة ✓' : 'تم إيقاف الربط مؤقتًا');
  renderApp(true);
});

async function ensureApiSchemasLoaded() {
  if (!state.marketplaceSchemas || !Object.keys(state.marketplaceSchemas).length) {
    const r = await api('GET', '/api/integrations/connections');
    state.marketplaceSchemas = r.schemas || {};
    state.marketplaceConnections = r.connections || [];
  }
}

act('open-api-cfg', async (el) => {
  const key = el.dataset.k;
  await ensureApiSchemasLoaded();
  const schema = (state.marketplaceSchemas || {})[key];
  if (!schema) return showToast('تعذّر تحميل إعدادات هذه المنصة');
  const conn = getPlatformConnection(key);
  const creds = (conn && conn.credentials) || {};
  const isDemo = Boolean(me && me.isDemo);

  const fieldsHtml = (schema.fields || []).map((f) => {
    const id = `api-f-${key}-${f.name}`;
    const curVal = creds[f.name];
    if (f.secret) {
      const saved = curVal && typeof curVal === 'object' && curVal.configured;
      const masked = saved ? curVal.masked : '';
      return `
        <div class="api-field-row">
          <div class="row" style="justify-content:space-between;margin-bottom:4px">
            <label for="${id}" style="margin:0">${esc(f.label)} ${f.required && !saved ? '<span class="er-tx">*</span>' : ''}</label>
            ${saved ? `<span class="api-saved-pill" dir="ltr">محفوظ ومشفّر (${esc(masked)})</span>` : ''}
          </div>
          ${f.multiline
            ? `<textarea id="${id}" name="${f.name}" rows="3" dir="ltr" placeholder="${saved ? 'اتركه فارغًا للإبقاء على المفتاح المشفّر الحالي أو الصق مفتاحًا جديدًا' : esc(f.placeholder || '')}" ${isDemo ? 'disabled' : ''}></textarea>`
            : `<div class="api-secret-wrap">
                <input id="${id}" name="${f.name}" type="password" autocomplete="new-password" dir="ltr" placeholder="${saved ? 'محفوظ ومشفّر — اتركه فارغًا للإبقاء عليه' : esc(f.placeholder || '')}" ${isDemo ? 'disabled' : ''}>
                <button type="button" class="btn btn-gh btn-sm api-eye-btn" data-a="toggle-api-secret" data-target="${id}" aria-label="إظهار أو إخفاء القيمة">إظهار</button>
              </div>`
          }
        </div>
      `;
    }
    const textVal = typeof curVal === 'string' ? curVal : (f.defaultValue || '');
    return `
      <div class="api-field-row">
        <label for="${id}">${esc(f.label)} ${f.required ? '<span class="er-tx">*</span>' : ''}</label>
        <input id="${id}" name="${f.name}" type="text" dir="ltr" value="${esc(textVal)}" placeholder="${esc(f.placeholder || '')}" ${isDemo ? 'disabled' : ''}>
      </div>
    `;
  }).join('');

  const body = `
    <div class="api-modal-lead">
      ${renderMarketChip(key, 42)}
      <div class="sp">
        <b style="display:block;font-size:15px">${esc(schema.name)}</b>
        <p class="mu" style="font-size:12.5px;margin:2px 0 0">${esc(schema.docsHint || '')}</p>
      </div>
    </div>

    ${isDemo ? `
      <div class="api-hint-box api-hint-box--warn">
        <b>أنت في الحساب التجريبي:</b> يمكنك استعراض جميع حقول الربط المطلوبة هنا، ولحفظ مفاتيح API حقيقية لمتجرك أنشئ حسابك المجاني أولًا (تُشفّر مفاتيحك تلقائيًا بـ AES-256-GCM).
      </div>
    ` : `
      <div class="api-hint-box">
        ${ico('shield', 15)} <span>تُشفّر جميع المفاتيح والأسرار فورًا في قاعدة البيانات عبر <b>AES-256-GCM</b> وتُستخدم من الخادم فقط للاتصال الآمن بسيرفرات المنصة.</span>
      </div>
    `}

    <form id="api-conn-form" data-platform="${key}">
      <div class="api-field-row">
        <label for="api-env-${key}">بيئة التشغيل (Environment)</label>
        <select id="api-env-${key}" name="environment" ${isDemo ? 'disabled' : ''}>
          <option value="production" ${(conn?.environment || 'production') === 'production' ? 'selected' : ''}>الإنتاج الفعلي (Production — بيانات المتجر الحقيقية)</option>
          <option value="sandbox" ${conn?.environment === 'sandbox' ? 'selected' : ''}>بيئة الاختبار (Sandbox)</option>
        </select>
      </div>
      ${fieldsHtml}
    </form>

    <div class="row-wrap" style="justify-content:space-between;margin-top:18px;gap:10px">
      <div>
        ${conn?.configured && !isDemo ? `<button type="button" class="btn btn-er btn-sm" data-a="delete-api-conn" data-k="${key}">حذف المفاتيح وفصل الربط</button>` : ''}
      </div>
      <div class="row-wrap" style="gap:8px">
        <button type="button" class="btn btn-gh btn-sm" data-a="close-dlg">إغلاق</button>
        ${!isDemo ? `
          <button type="button" class="btn btn-gh btn-sm" data-a="save-api-conn-only" data-k="${key}">حفظ فقط</button>
          <button type="button" class="btn btn-ac btn-sm" data-a="save-api-conn" data-k="${key}">${ico('zap', 14)} حفظ واختبار الاتصال</button>
        ` : ''}
      </div>
    </div>
  `;

  openDialog(`إعداد ربط API — ${schema.name}`, body, false);
});

actions['toggle-api-secret'] = (el) => {
  const inp = document.getElementById(el.dataset.target);
  if (!inp) return;
  const isPw = inp.type === 'password';
  inp.type = isPw ? 'text' : 'password';
  el.textContent = isPw ? 'إخفاء' : 'إظهار';
};

async function submitApiConnection(key, testNow) {
  const form = document.getElementById('api-conn-form');
  if (!form) return;
  const schema = (state.marketplaceSchemas || {})[key];
  if (!schema) return;
  const credentials = {};
  for (const f of schema.fields || []) {
    const el = form.querySelector(`[name="${f.name}"]`);
    if (el) credentials[f.name] = el.value.trim();
  }
  const envEl = form.querySelector('[name="environment"]');
  const environment = envEl ? envEl.value : 'production';
  const r = await api('PUT', `/api/integrations/connections/${key}`, {
    credentials,
    environment,
    enabled: true,
    testNow
  });
  state.integrations = r.integrations || state.integrations;
  state.marketplaceConnections = r.connections || state.marketplaceConnections;
  closeDlg();
  if (r.testResult) {
    showToast(r.testResult.ok ? `✓ ${r.testResult.message}` : `⚠️ تم حفظ المفاتيح لكن فشل الاختبار: ${r.testResult.message}`, 5200);
  } else {
    showToast('🔒 تم حفظ وتشفير مفاتيح API بنجاح ✓', 3600);
  }
  renderApp(true);
}

act('save-api-conn', async (el) => submitApiConnection(el.dataset.k, true));
act('save-api-conn-only', async (el) => submitApiConnection(el.dataset.k, false));

act('test-api-conn', async (el) => {
  const key = el.dataset.k;
  const r = await api('POST', `/api/integrations/connections/${key}/test`);
  state.marketplaceConnections = r.connections || state.marketplaceConnections;
  showToast(r.ok ? `✓ ${r.message}` : `⚠️ ${r.message}`, 4800);
  renderApp(true);
});

act('sync-api-conn', async (el) => {
  const key = el.dataset.k;
  const r = await api('POST', `/api/integrations/connections/${key}/sync`);
  state.marketplaceConnections = r.connections || state.marketplaceConnections;
  await loadSession();
  showToast(`⟳ ${r.message || 'تم سحب بيانات المنصة بنجاح ✓'}`, 4500);
  renderApp(true);
});

actions['delete-api-conn'] = (el) => {
  const key = el.dataset.k;
  const schema = (state.marketplaceSchemas || {})[key];
  openConfirmDialog(
    'حذف مفاتيح API وفصل المنصة',
    `هل تريد حذف مفاتيح API المشفّرة الخاصة بمنصة "${schema?.name || key}" وإيقاف المزامنة التلقائية معها؟`,
    'نعم، احذف المفاتيح',
    true,
    async () => {
      const r = await api('DELETE', `/api/integrations/connections/${key}`);
      state.integrations = r.integrations || state.integrations;
      state.marketplaceConnections = r.connections || state.marketplaceConnections;
      closeDlg();
      showToast('تم حذف مفاتيح API وفصل الربط بنجاح');
      renderApp(true);
    }
  );
};

act('toggle-notif', async (el) => {
  const r = await api('PUT', '/api/settings/notifications', { key: el.dataset.k, on: !state.notifications[el.dataset.k] });
  state.notifications = r.notifications;
  showToast('تم حفظ تفضيل التنبيه ✓');
  renderApp(true);
});

act('sync-now', async () => {
  const r = await api('POST', '/api/sync');
  state.lastSyncAt = r.lastSyncAt;
  if (r.connections) state.marketplaceConnections = r.connections;
  if (Array.isArray(r.liveResults) && r.liveResults.length) {
    await loadSession();
  }
  showToast(r.message || `⟳ تمت المزامنة: ${fmtNum(r.products)} منتج على ${fmtNum(r.markets.length)} أسواق مفعّلة ✓`, 4000);
  renderApp(true);
});

act('save-settings', async () => {
  const body = {
    storeName: $('#set-name').value.trim() || state.storeName,
    taxId: $('#set-tax').value.trim(),
    instaPayHandle: $('#set-ipa').value.trim()
  };
  if (!me.isDemo) {
    body.storePhone = $('#set-phone').value.trim() || state.storePhone;
    body.storeEmail = $('#set-email').value.trim();
  }
  const r = await api('PUT', '/api/settings', body);
  Object.assign(state, r.settings);
  me = r.me;
  showToast('تم حفظ بيانات المتجر والإعدادات الضريبية ✓');
  renderApp(true);
});

actions['reset-demo'] = () => {
  openConfirmDialog(
    '↺ إعادة ضبط البيانات التجريبية',
    'سيتم استرجاع المنتجات والطلبات التجريبية الأصلية وحذف أي تعديلات أجريتها في الجلسة الحالية. هل تود المتابعة؟',
    'نعم، أعد ضبط البيانات',
    true,
    async () => {
      await api('POST', '/api/demo/reset');
      await loadSession();
      closeDlg();
      showToast('↺ تمت استعادة البيانات التجريبية الأصلية');
      renderApp(true);
    }
  );
};

actions['change-password'] = () => openDialog('🔑 تغيير كلمة المرور', `
  <form data-submit="change-password-submit" novalidate>
    <label for="pw-cur">كلمة المرور الحالية</label>
    <input id="pw-cur" type="password" autocomplete="current-password">
    <label for="pw-new">كلمة المرور الجديدة</label>
    <input id="pw-new" type="password" autocomplete="new-password" placeholder="٨ أحرف على الأقل">
    <p id="pw-err" class="er-tx" role="alert" style="min-height:22px;font-size:13px;font-weight:700"></p>
    <button class="btn" style="width:100%" type="submit">حفظ كلمة المرور</button>
  </form>
`);
act('change-password-submit', async () => {
  try {
    await api('POST', '/api/account/password', { current: $('#pw-cur').value, next: $('#pw-new').value });
  } catch (e) {
    $('#pw-err').textContent = e.message;
    return;
  }
  closeDlg();
  showToast('تم تغيير كلمة المرور ✓ وتم تسجيل خروجك من الأجهزة الأخرى', 4000);
});

actions['delete-account'] = () => openDialog('🗑 حذف الحساب نهائيًا', `
  <form data-submit="delete-account-submit" novalidate>
    <p class="mu" style="margin-bottom:12px;font-size:13.5px">سيتم حذف حسابك وكل منتجاتك وطلباتك نهائيًا ولا يمكن التراجع. صدّر بياناتك أولًا إن احتجتها.</p>
    <label for="del-pass">أدخل كلمة المرور للتأكيد</label>
    <input id="del-pass" type="password" autocomplete="current-password">
    <p id="del-err" class="er-tx" role="alert" style="min-height:22px;font-size:13px;font-weight:700"></p>
    <button class="btn btn-er" style="width:100%" type="submit">حذف حسابي نهائيًا</button>
  </form>
`);
act('delete-account-submit', async () => {
  try {
    await api('DELETE', '/api/account', { password: $('#del-pass').value });
  } catch (e) {
    $('#del-err').textContent = e.message;
    return;
  }
  closeDlg();
  clearSession();
  go('#/');
  showToast('تم حذف حسابك وبياناتك نهائيًا');
});

/* ----- إجراءات لوحة تحكم الإدارة (Admin Actions) ----- */
let adminClientTimer;
inputs['admin-client-search'] = (el) => {
  state.adminClientQuery = el.value;
  clearTimeout(adminClientTimer);
  adminClientTimer = setTimeout(() => renderApp(true), 260);
};

actions['admin-client-status-flt'] = (el) => {
  state.adminClientStatus = el.dataset.v || 'all';
  renderApp(true);
};

actions['admin-client-plan-flt'] = (el) => {
  state.adminClientPlan = el.dataset.v || 'all';
  renderApp(true);
};

actions['admin-appr-type'] = (el) => {
  state.adminApprovalType = el.dataset.v || 'all';
  renderApp(true);
};
actions['admin-app-type-flt'] = actions['admin-appr-type'];

actions['admin-appr-status'] = (el) => {
  state.adminApprovalStatus = el.dataset.v || 'pending';
  renderApp(true);
};
actions['admin-app-status-flt'] = actions['admin-appr-status'];

actions['admin-pay-status-flt'] = (el) => {
  state.adminPaymentStatus = el.dataset.v || 'all';
  renderApp(true);
};

let adminPayTimer;
inputs['admin-pay-search'] = (el) => {
  state.adminPaymentQuery = el.value;
  clearTimeout(adminPayTimer);
  adminPayTimer = setTimeout(() => renderApp(true), 260);
};

inputs['admin-audit-filter'] = (el) => {
  state.adminAuditAction = el.value || '';
  renderApp(true);
};

let adminAuditTimer;
inputs['admin-audit-search'] = (el) => {
  state.adminAuditQuery = el.value;
  clearTimeout(adminAuditTimer);
  adminAuditTimer = setTimeout(() => renderApp(true), 280);
};

act('admin-impersonate', async (el) => {
  const r = await api('POST', `/api/admin/clients/${el.dataset.id}/impersonate`);
  setImpersonationToken(r.impersonationToken || r.token);
  await loadSession();
  showToast(`👁️ أنت تتصفح الآن متجر «${r.client.storeName}» بوضع القراءة فقط`, 4200);
  go('#/dash');
});

act('exit-impersonation', async () => {
  setImpersonationToken('');
  await loadSession();
  showToast('تم الخروج من وضع التصفح والعودة إلى لوحة المالك ✓');
  go('#/owner/clients');
});

act('admin-toggle-client-status', async (el) => {
  const id = +el.dataset.id;
  const next = el.dataset.next || (el.dataset.status === 'suspended' ? 'active' : 'suspended');
  const r = await api('POST', `/api/admin/clients/${id}/status`, { status: next });
  showToast(r.client.status === 'suspended' ? '⏸ تم إيقاف حساب التاجر وإلغاء جلساته النشطة' : '✓ تم إعادة تفعيل حساب التاجر');
  renderApp(true);
});

actions['admin-change-plan-modal'] = (el) => {
  const curPlan = el.dataset.plan || 'free';
  openDialog(`💎 تغيير باقة متجر «${esc(el.dataset.name || el.dataset.store || '')}»`, `
    <form data-submit="admin-change-plan-submit" novalidate>
      <input type="hidden" id="acp-id" value="${el.dataset.id}">
      <label for="acp-plan">الباقة الجديدة</label>
      <select id="acp-plan">
        <option value="free" ${curPlan === 'free' ? 'selected' : ''}>الباقة المجانية (بداية)</option>
        <option value="pro" ${curPlan === 'pro' ? 'selected' : ''}>باقة التاجر المحترف (١٬٠٠٠ ج.م)</option>
        <option value="business" ${curPlan === 'business' || curPlan === 'ent' ? 'selected' : ''}>باقة الشركات (٣٬٠٠٠ ج.م)</option>
      </select>
      <label for="acp-cycle">دورة الفوترة</label>
      <select id="acp-cycle">
        <option value="monthly">شهريًا (٣٠ يوم)</option>
        <option value="yearly">سنويًا (٣٦٥ يوم)</option>
      </select>
      <button class="btn" style="width:100%" type="submit">حفظ وتفعيل الباقة للتاجر</button>
    </form>
  `);
};

act('admin-change-plan-submit', async () => {
  const id = +$('#acp-id').value;
  const plan = $('#acp-plan').value;
  const cycle = $('#acp-cycle').value;
  await api('POST', `/api/admin/clients/${id}/plan`, { plan, cycle });
  closeDlg();
  showToast('تم تحديث باقة التاجر وتسجيل العملية في سجل التدقيق ✓');
  renderApp(true);
});

act('admin-approve', async (el) => {
  const type = el.dataset.type;
  const id = +el.dataset.id;
  await api('POST', `/api/admin/approvals/${type}/${id}/approve`);
  showToast('✓ تم اعتماد العنصر وتفعيله للمزامنة والمخزون');
  renderApp(true);
});

actions['admin-reject'] = (el) => {
  openDialog(`✕ رفض ${el.dataset.type === 'product' ? 'المنتج' : 'الطلب'}: ${esc(el.dataset.name || '')}`, `
    <form data-submit="admin-reject-submit" novalidate>
      <input type="hidden" id="arj-type" value="${esc(el.dataset.type)}">
      <input type="hidden" id="arj-id" value="${el.dataset.id}">
      <p class="mu" style="margin-bottom:12px;font-size:13.5px">يرجى كتابة سبب الرفض بوضوح؛ سيظهر هذا السبب للتاجر في لوحة تحكمه مع إشعار فوري ليتمكن من تصحيحه.</p>
      <label for="arj-reason">سبب الرفض (إلزامي)</label>
      <input id="arj-reason" placeholder="مثال: بيانات المنتج غير مكتملة أو السعر غير مطابق للسياسة">
      <p id="arj-err" class="er-tx" role="alert" style="min-height:20px;font-size:13px;font-weight:700"></p>
      <button class="btn btn-er" style="width:100%" type="submit">تأكيد الرفض وإرسال السبب للتاجر</button>
    </form>
  `);
};

act('admin-reject-submit', async () => {
  const type = $('#arj-type').value;
  const id = +$('#arj-id').value;
  const reason = $('#arj-reason')?.value.trim();
  const err = $('#arj-err');
  if (!reason) { if (err) err.textContent = 'سبب الرفض مطلوب'; return; }
  await api('POST', `/api/admin/approvals/${type}/${id}/reject`, { reason });
  closeDlg();
  showToast('تم رفض العنصر وإرسال سبب الرفض للتاجر ✓');
  renderApp(true);
});

const openCouponModal = (c = null) => {
  const isEdit = !!c;
  openDialog(isEdit ? `✎ تعديل كوبون ${c.code}` : '+ إنشاء كوبون خصم جديد', `
    <form data-submit="admin-save-coupon" novalidate>
      <input type="hidden" id="acm-mode" value="${isEdit ? 'edit' : 'create'}">
      <label for="acm-code">كود الكوبون (إنجليزي وأرقام)</label>
      <input id="acm-code" dir="ltr" ${isEdit ? 'readonly' : ''} placeholder="RAMADAN30" value="${isEdit ? esc(c.code) : ''}">
      <div class="grid-equal" style="gap:10px">
        <div>
          <label for="acm-pct">نسبة الخصم (٪)</label>
          <input id="acm-pct" type="number" min="1" max="100" value="${isEdit ? c.pct : 20}">
        </div>
        <div>
          <label for="acm-max">الحد الأقصى للخصم (ج.م)</label>
          <input id="acm-max" type="number" min="1" value="${isEdit ? c.maxDiscount : 500}">
        </div>
      </div>
      <label for="acm-desc">وصف الكوبون</label>
      <input id="acm-desc" placeholder="خصم ٢٠٪ بمناسبة الشهر الكريم" value="${isEdit ? esc(c.desc) : ''}">
      <div class="grid-equal" style="gap:10px">
        <div>
          <label for="acm-limit">الحد الأقصى للاستخدام (اختياري)</label>
          <input id="acm-limit" type="number" min="1" placeholder="غير محدود" value="${isEdit && c.maxUses ? c.maxUses : ''}">
        </div>
        <div>
          <label for="acm-active">حالة الكوبون</label>
          <select id="acm-active">
            <option value="1" ${!isEdit || c.active ? 'selected' : ''}>نشط ومتاح</option>
            <option value="0" ${isEdit && !c.active ? 'selected' : ''}>موقوف</option>
          </select>
        </div>
      </div>
      <p id="acm-err" class="er-tx" role="alert" style="min-height:20px;font-size:13px;font-weight:700"></p>
      <button class="btn" style="width:100%" type="submit">حفظ الكوبون في قاعدة البيانات</button>
    </form>
  `);
};

actions['admin-open-coupon-modal'] = () => openCouponModal(null);
actions['admin-edit-coupon'] = (el) => openCouponModal({
  code: el.dataset.code,
  pct: +(el.dataset.pct || el.dataset.value || 20),
  maxDiscount: +(el.dataset.max || 500),
  desc: el.dataset.desc,
  maxUses: (el.dataset.limit || el.dataset.max) ? +(el.dataset.limit || el.dataset.max) : null,
  active: el.dataset.active === '1'
});

act('admin-save-coupon', async () => {
  const mode = $('#acm-mode').value;
  const code = $('#acm-code').value.trim().toUpperCase();
  const body = {
    code,
    pct: +$('#acm-pct').value,
    maxDiscount: +$('#acm-max').value,
    desc: $('#acm-desc').value.trim(),
    maxUses: $('#acm-limit').value ? +$('#acm-limit').value : null,
    active: $('#acm-active').value === '1'
  };
  try {
    if (mode === 'edit') await api('PUT', `/api/admin/coupons/${encodeURIComponent(code)}`, body);
    else await api('POST', '/api/admin/coupons', body);
  } catch (e) {
    $('#acm-err').textContent = e.message;
    return;
  }
  closeDlg();
  showToast('تم حفظ الكوبون في قاعدة البيانات ✓');
  renderApp(true);
});

act('admin-del-coupon', async (el) => {
  const code = el.dataset.code;
  await api('DELETE', `/api/admin/coupons/${encodeURIComponent(code)}`);
  delete COUPONS_MAP[code];
  showToast(`تم حذف الكوبون ${code} ✓`);
  renderApp(true);
});

// معالجات حقول الإدخال الفورية
inputs['prod-search'] = (el) => {
  state.prodQuery = el.value;
  $('#prod-table-box').innerHTML = renderProductsTable();
};

inputs['dash-range'] = (el) => {
  state.range = +el.value;
  saveAppState();
  renderApp(true);
};

inputs['ai-select-prod'] = (el) => {
  const p = products.find(x => x.id == el.value);
  if (p) {
    $('#ai-name').value = p.name;
    $('#ai-feats').value = `فئة ${p.cat || 'متميزة'}، خامات أصلية عالية الجودة، ضمان محلي وشحن سريع`;
    actions['ai-generate']();
  }
};

inputs['calc-run'] = () => {
  const vals = ['c-comm', 'c-price', 'c-cost', 'c-ship', 'c-rto'].map(id => +$('#' + id).value || 0);
  $('#calc-res-box').innerHTML = renderProfitCalcResult(vals);
};

inputs['calc-mkt'] = (el) => {
  $('#c-comm').value = el.value;
  inputs['calc-run']();
};

inputs['lp-calc-run'] = () => {
  const vals = ['lp-comm', 'lp-price', 'lp-cost', 'lp-ship', 'lp-rto'].map(id => +$('#' + id).value || 0);
  const box = $('#lp-calc-res-box');
  if (box) box.innerHTML = renderProfitCalcResult(vals);
};

inputs['lp-calc-mkt'] = (el) => {
  const comm = $('#lp-comm');
  if (comm) comm.value = el.value;
  inputs['lp-calc-run']();
};

/* ==========================================================================
   8. ربط المستمعين والتشغيل الأولي (Event Listeners & Bootstrap)
   ========================================================================== */
document.addEventListener('click', (ev) => {
  const btn = ev.target.closest('[data-a]');
  if (btn && actions[btn.dataset.a]) {
    actions[btn.dataset.a](btn, ev);
  }
});

document.addEventListener('input', (ev) => {
  const inp = ev.target.closest('[data-i]');
  if (inp && inputs[inp.dataset.i]) {
    inputs[inp.dataset.i](inp);
  }
});

dlg.addEventListener('click', (ev) => {
  if (ev.target === dlg) dlg.close();
});

document.addEventListener('submit', (ev) => {
  const form = ev.target.closest('[data-submit]');
  if (!form) return;
  ev.preventDefault();
  const fn = actions[form.dataset.submit];
  if (fn) fn(form, ev);
});

document.addEventListener('keydown', (ev) => {
  if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.matches('[role="button"][data-a], [role="switch"][data-a]')) {
    ev.preventDefault();
    ev.target.click();
  }
});

window.addEventListener('hashchange', () => renderApp());

try {
  const savedTheme = localStorage.getItem('omni_theme');
  if (savedTheme) document.documentElement.dataset.theme = savedTheme;
} catch (_) {}

// تحديث هادئ لعداد المبيعات في الهيرو
setInterval(() => {
  const profitEl = $('#hero-profit');
  if (!profitEl) return;
  const keys = ['a', 'n', 'j'];
  const k = keys[Math.floor(Math.random() * keys.length)];
  heroLiveState[k].orders += 1;
  heroLiveState[k].profit += 65 + Math.floor(Math.random() * 110);
  heroLiveState[k].cod += 320 + Math.floor(Math.random() * 280);
  const st = getHeroStats();
  profitEl.textContent = '+' + fmtEGP(st.profit);
  const totEl = $('#hero-total-orders');
  if (totEl) totEl.textContent = fmtNum(st.orders) + ' طلب';
  const codEl = $('#hero-cod-ready');
  if (codEl) codEl.textContent = fmtEGP(st.cod);
  keys.forEach((mk) => {
    const el = $('#hero-ord-' + mk);
    if (el) el.textContent = fmtNum(heroLiveState[mk].orders) + ' طلب اليوم';
  });
}, 3500);

window.addEventListener('focus', runSessionCheck);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') runSessionCheck();
});

if (window.OrderFlowRBAC && typeof window.OrderFlowRBAC.registerRbacViews === 'function') {
  window.OrderFlowRBAC.registerRbacViews(views, loaders, actions, inputs, {
    api,
    state,
    renderTable,
    fmtNum,
    fmtEGP,
    fmtDate,
    timeAgo,
    emptyState,
    errorState,
    openDialog,
    openConfirmDialog,
    closeDlg,
    showToast,
    renderApp,
    act,
    ico,
    setImpersonationToken,
    loadSession,
    go
  });
}

boot();
