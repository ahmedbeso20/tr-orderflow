'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const rbac = require('../src/rbac');
const { createApp } = require('../src/app');

class Client {
  constructor(base, ip) { this.base = base; this.ip = ip; this.jar = ''; }
  async call(method, path, body, extra = {}) {
    const headers = { 'x-forwarded-for': this.ip, ...extra };
    if (method !== 'GET' && !('x-requested-with' in headers)) headers['x-requested-with'] = 'omniarab';
    if (this.jar) headers.cookie = this.jar;
    if (body !== undefined) headers['content-type'] = 'application/json';
    const res = await fetch(this.base + path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    const sc = res.headers.get('set-cookie');
    if (sc) { const pair = sc.split(';')[0]; this.jar = pair.endsWith('=') ? '' : pair; }
    const ct = res.headers.get('content-type') || '';
    const data = ct.includes('json') ? await res.json() : await res.text();
    return { status: res.status, data, headers: res.headers };
  }
  get(p, extra) { return this.call('GET', p, undefined, extra); }
  post(p, b = {}, extra) { return this.call('POST', p, b, extra); }
  put(p, b = {}, extra) { return this.call('PUT', p, b, extra); }
  del(p, b = {}, extra) { return this.call('DELETE', p, b, extra); }
}

async function start(opts = {}) {
  const app = createApp({
    dbFile: ':memory:',
    secret: 'r'.repeat(48),
    trustProxy: true,
    geminiKey: '',
    ownerName: 'مالك المنصة',
    ownerEmail: 'owner@orderflow.eg',
    ownerPhone: '01099990000',
    ownerPassword: 'OwnerPassword@2026',
    ...opts
  });
  await new Promise((r) => app.server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${app.server.address().port}`;
  let n = 10;
  return { app, base, client: () => new Client(base, `10.9.0.${++n}`) };
}

/* ============================================================================
   1. اختبارات الوحدة الصافية لوحدة الصلاحيات (src/rbac.js)
   ============================================================================ */
test('وحدة RBAC الصافية: الأدوار والحدود والصلاحيات والتوجيه وحراسة المسارات', () => {
  assert.equal(rbac.MAX_OWNERS, 1);
  assert.equal(rbac.MAX_MODERATORS, 3);
  assert.equal(rbac.ROLES.OWNER, 'owner');
  assert.equal(rbac.ROLES.MODERATOR, 'moderator');
  assert.equal(rbac.ROLES.CLIENT, 'client');

  // التوجيه التلقائي حسب الدور
  assert.equal(rbac.getLoginRedirect({ role: 'owner', status: 'active' }), '#/owner');
  assert.equal(rbac.getLoginRedirect({ role: 'moderator', status: 'active' }), '#/moderator');
  assert.equal(rbac.getLoginRedirect({ role: 'client', status: 'active' }), '#/dash');

  // حالات الحساب عند الدخول
  assert.equal(rbac.checkLoginStatus({ status: 'active' }).allowed, true);
  assert.equal(rbac.checkLoginStatus({ status: 'pending' }).code, 'PENDING_APPROVAL');
  const rej = rbac.checkLoginStatus({ status: 'rejected', reject_reason: 'بيانات ناقصة' });
  assert.equal(rej.allowed, false);
  assert.equal(rej.code, 'REJECTED');
  assert.match(rej.message, /بيانات ناقصة/);
  assert.equal(rbac.checkLoginStatus({ status: 'suspended' }).code, 'SUSPENDED');

  // الصلاحيات المستقلة للمشرف
  const owner = { role: 'owner', status: 'active' };
  const mod = { role: 'moderator', status: 'active', permissions: JSON.stringify({ view_pending_clients: true, approve_clients: true, reject_clients: false }) };
  const client = { role: 'client', status: 'active' };
  assert.equal(rbac.hasPermission(owner, 'reject_clients'), true);
  assert.equal(rbac.hasPermission(mod, 'approve_clients'), true);
  assert.equal(rbac.hasPermission(mod, 'reject_clients'), false);
  assert.equal(rbac.hasPermission(client, 'approve_clients'), false);

  // حد المشرفين الأقصى (3)
  assert.doesNotThrow(() => rbac.assertModeratorLimit(2));
  assert.throws(() => rbac.assertModeratorLimit(3), (e) => e.status === 409 && e.extra?.code === 'MODERATOR_LIMIT_REACHED');
  assert.throws(() => rbac.assertActiveModeratorLimit(3), (e) => e.status === 409 && e.extra?.code === 'MODERATOR_LIMIT_REACHED');

  // حماية المالك المطلقة
  assert.throws(() => rbac.assertNotOwnerTarget({ role: 'owner' }), (e) => e.status === 404);
  assert.doesNotThrow(() => rbac.assertNotOwnerTarget({ role: 'client' }));

  // مسارات اللوحات المحمية
  assert.equal(rbac.requiredRoleForPath('/owner'), 'owner');
  assert.equal(rbac.requiredRoleForPath('/owner/moderators'), 'owner');
  assert.equal(rbac.requiredRoleForPath('/moderator'), 'moderator');
  assert.equal(rbac.requiredRoleForPath('/admin'), 'owner');
  assert.equal(rbac.requiredRoleForPath('/'), null);

  assert.equal(rbac.canAccessPanel(owner, 'owner'), true);
  assert.equal(rbac.canAccessPanel(mod, 'owner'), false);
  assert.equal(rbac.canAccessPanel(client, 'owner'), false);
  assert.equal(rbac.canAccessPanel(mod, 'moderator'), true);
  assert.equal(rbac.canAccessPanel(owner, 'moderator'), false);
  assert.equal(rbac.canAccessPanel(client, 'moderator'), false);
});

/* ============================================================================
   2. حماية المالك الوحيد (1 Owner Only) ومنع رؤيته أو تعديله أو حذفه
   ============================================================================ */
test('المالك الوحيد: قيد قاعدة البيانات الفريد ومنع الحذف الذاتي والحماية المطلقة', async (t) => {
  const s = await start();
  t.after(() => s.app.close());

  const owners = s.app.db.prepare("SELECT * FROM users WHERE role = 'owner'").all();
  assert.equal(owners.length, 1);
  assert.equal(owners[0].email, 'owner@orderflow.eg');

  // محاولة إدراج مالك ثانٍ مباشرة في قاعدة البيانات تفشل بقيد الفهرس الفريد الجزئي
  assert.throws(() => {
    s.app.db.prepare(
      "INSERT INTO users(phone, email, full_name, store_name, pass_hash, role, status) VALUES(?, ?, ?, ?, ?, 'owner', 'active')"
    ).run('01088887777', 'second@owner.eg', 'Second Owner', 'Second', 'hash');
  });

  const owner = s.client();
  const login = await owner.post('/api/auth/login', { id: 'owner@orderflow.eg', password: 'OwnerPassword@2026' });
  assert.equal(login.status, 200);
  assert.equal(login.data.me.role, 'owner');
  assert.equal(login.data.redirectTo, '#/owner');

  // لا يمكن للمالك حذف حسابه عبر نقطة حذف الحساب
  const selfDel = await owner.del('/api/account', { password: 'OwnerPassword@2026' });
  assert.equal(selfDel.status, 403);
  assert.equal(selfDel.data.code, 'OWNER_PROTECTED');
});

/* ============================================================================
   3. دورة حياة حساب العميل (Pending -> Blocked -> Approved -> Active / Rejected)
   ============================================================================ */
test('دورة حياة العميل: تسجيل تلقائي بحالة قيد المراجعة، منع الدخول، قبول ورفض مع السبب', async (t) => {
  const s = await start();
  t.after(() => s.app.close());

  const owner = s.client();
  await owner.post('/api/auth/login', { id: 'owner@orderflow.eg', password: 'OwnerPassword@2026' });

  // إنشاء مشرف معتمد
  const createMod = await owner.post('/api/owner/moderators', {
    fullName: 'محمود المشرف',
    email: 'mod1@orderflow.eg',
    phone: '01011112222',
    password: 'ModPassword@1'
  });
  assert.equal(createMod.status, 200);

  const mod = s.client();
  const modLogin = await mod.post('/api/auth/login', { id: 'mod1@orderflow.eg', password: 'ModPassword@1' });
  assert.equal(modLogin.status, 200);
  assert.equal(modLogin.data.me.role, 'moderator');
  assert.equal(modLogin.data.redirectTo, '#/moderator');

  // عميل ١ يسجّل حسابًا جديدًا
  const c1 = s.client();
  const reg1 = await c1.post('/api/auth/register', {
    store: 'متجر السلام',
    fullName: 'أحمد السلام',
    email: 'salam@client.eg',
    phone: '01022223333',
    password: 'ClientPass@1'
  });
  assert.equal(reg1.status, 200);
  assert.equal(reg1.data.pending, true);
  assert.equal(reg1.data.status, 'pending');
  assert.equal(reg1.data.token, undefined, 'لا تُصدر جلسة للحساب قيد المراجعة');

  // العميل ١ ممنوع من الدخول قبل الموافقة
  const blocked1 = await c1.post('/api/auth/login', { id: 'salam@client.eg', password: 'ClientPass@1' });
  assert.equal(blocked1.status, 403);
  assert.equal(blocked1.data.code, 'PENDING_APPROVAL');
  assert.match(blocked1.data.error, /قيد المراجعة/);

  // عميل ٢ يسجّل حسابًا جديدًا (سيُرفض)
  const c2 = s.client();
  const reg2 = await c2.post('/api/auth/register', {
    store: 'متجر مرفوض',
    fullName: 'سعيد مرفوض',
    email: 'rejected@client.eg',
    phone: '01033334444',
    password: 'ClientPass@2'
  });
  assert.equal(reg2.status, 200);
  assert.equal(reg2.data.pending, true);

  // المشرف يرى العميلين في طابور Pending فقط (ولا يرى المالك ولا المشرفين)
  const pendingList = await mod.get('/api/moderator/clients?status=pending');
  assert.equal(pendingList.status, 200);
  assert.equal(pendingList.data.clients.length, 2);
  assert.equal(pendingList.data.clients.every((u) => u.email !== 'owner@orderflow.eg' && u.email !== 'mod1@orderflow.eg'), true);

  const client1Row = pendingList.data.clients.find((u) => u.email === 'salam@client.eg');
  const client2Row = pendingList.data.clients.find((u) => u.email === 'rejected@client.eg');

  // المشرف يقبل العميل ١
  const app1 = await mod.post(`/api/moderator/clients/${client1Row.id}/approve`);
  assert.equal(app1.status, 200);
  assert.equal(app1.data.client.status, 'active');

  // العميل ١ يستطيع الآن الدخول وتوجيهه تلقائيًا للموقع العادي (#/dash)
  const login1 = await c1.post('/api/auth/login', { id: 'salam@client.eg', password: 'ClientPass@1' });
  assert.equal(login1.status, 200);
  assert.equal(login1.data.me.role, 'client');
  assert.equal(login1.data.me.status, 'active');
  assert.equal(login1.data.redirectTo, '#/dash');

  // المشرف يرفض العميل ٢ مع كتابة سبب
  const rej2 = await mod.post(`/api/moderator/clients/${client2Row.id}/reject`, { reason: 'بيانات السجل التجاري غير واضحة' });
  assert.equal(rej2.status, 200);
  assert.equal(rej2.data.client.status, 'rejected');

  // العميل ٢ يُمنع من الدخول ويظهر له سبب الرفض
  const login2 = await c2.post('/api/auth/login', { id: 'rejected@client.eg', password: 'ClientPass@2' });
  assert.equal(login2.status, 403);
  assert.equal(login2.data.code, 'REJECTED');
  assert.match(login2.data.error, /بيانات السجل التجاري غير واضحة/);
});

/* ============================================================================
   4. إدارة المشرفين (حد 3 كحد أقصى، تخصيص المهام، الإيقاف/الحذف، إبطال الجلسة فورًا، سجل المراقبة)
   ============================================================================ */
test('إدارة المشرفين: الحد الأقصى 3، تخصيص الصلاحيات، الطرد الفوري، وحفظ سجل المراقبة بعد الحذف', async (t) => {
  const s = await start();
  t.after(() => s.app.close());

  const owner = s.client();
  await owner.post('/api/auth/login', { id: 'owner@orderflow.eg', password: 'OwnerPassword@2026' });

  // إنشاء 3 مشرفين
  const m1 = (await owner.post('/api/owner/moderators', { fullName: 'مشرف ١', email: 'm1@of.eg', phone: '01010000001', password: 'Password@1' })).data.moderator;
  const m2 = (await owner.post('/api/owner/moderators', { fullName: 'مشرف ٢', email: 'm2@of.eg', phone: '01010000002', password: 'Password@2' })).data.moderator;
  const m3 = (await owner.post('/api/owner/moderators', { fullName: 'مشرف ٣', email: 'm3@of.eg', phone: '01010000003', password: 'Password@3' })).data.moderator;
  assert.ok(m1.id && m2.id && m3.id);

  // محاولة إنشاء مشرف رابع تُرفض بـ 409 MODERATOR_LIMIT_REACHED
  const m4 = await owner.post('/api/owner/moderators', { fullName: 'مشرف ٤', email: 'm4@of.eg', phone: '01010000004', password: 'Password@4' });
  assert.equal(m4.status, 409);
  assert.equal(m4.data.code, 'MODERATOR_LIMIT_REACHED');

  // تسجيل دخول مشرف ١
  const mod1 = s.client();
  assert.equal((await mod1.post('/api/auth/login', { id: 'm1@of.eg', password: 'Password@1' })).status, 200);

  // عميل جديد بانتظار التفعيل
  const pendingClient = s.client();
  await pendingClient.post('/api/auth/register', { store: 'متجر المهام', email: 'task@client.eg', phone: '01055556666', password: 'Password@9' });
  const cid = (await owner.get('/api/owner/clients?status=pending')).data.clients[0].id;

  // المالك يسحب صلاحية القبول (approve_clients) من مشرف ١ فقط
  const permUpdate = await owner.post(`/api/owner/moderators/${m1.id}/permissions`, {
    permissions: { view_pending_clients: true, approve_clients: false, reject_clients: true }
  });
  assert.equal(permUpdate.status, 200);

  // مشرف ١ لا يستطيع القبول (403 PERMISSION_DENIED) لكن يستطيع الرفض
  const deniedApprove = await mod1.post(`/api/moderator/clients/${cid}/approve`);
  assert.equal(deniedApprove.status, 403);
  assert.equal(deniedApprove.data.code, 'PERMISSION_DENIED');

  const okReject = await mod1.post(`/api/moderator/clients/${cid}/reject`, { reason: 'اختبار صلاحية الرفض' });
  assert.equal(okReject.status, 200);

  // تغيير كلمة مرور مشرف ١ يبطل جلسته فورًا
  assert.equal((await owner.post(`/api/owner/moderators/${m1.id}/password`, { password: 'NewModPass@99' })).status, 200);
  const checkAfterPass = await mod1.get('/api/auth/session-check');
  assert.equal(checkAfterPass.status, 401);
  assert.equal(checkAfterPass.data.code, 'SESSION_REVOKED');

  // يدخل بكلمة المرور الجديدة ثم يقوم المالك بإيقافه مؤقتًا -> طرد فوري
  assert.equal((await mod1.post('/api/auth/login', { id: 'm1@of.eg', password: 'NewModPass@99' })).status, 200);
  assert.equal((await owner.post(`/api/owner/moderators/${m1.id}/status`, { status: 'suspended' })).status, 200);
  const checkAfterSusp = await mod1.get('/api/moderator/dashboard');
  assert.equal(checkAfterSusp.status, 401);
  assert.equal(checkAfterSusp.data.code, 'SESSION_REVOKED');

  // حذف مشرف ١ نهائيًا يفتح خانة جديدة ويحافظ على سجل المراقبة (Audit Log) الخاص به
  assert.equal((await owner.del(`/api/owner/moderators/${m1.id}`)).status, 200);
  const audit = await owner.get('/api/owner/audit?actorRole=moderator');
  assert.equal(audit.status, 200);
  const rejectLog = audit.data.logs.find((l) => l.action === 'client.reject');
  assert.ok(rejectLog, 'سجل عمليات المشرف يجب أن يبقى محفوظًا بعد حذفه');
  assert.equal(rejectLog.actorName, 'مشرف ١');
  assert.equal(rejectLog.actorEmail, 'm1@of.eg');
  assert.equal(rejectLog.actorRole, 'moderator');

  // يمكن الآن إنشاء مشرف بديل في الخانة الثالثة
  const mNew = await owner.post('/api/owner/moderators', { fullName: 'مشرف بديل', email: 'mnew@of.eg', phone: '01010000009', password: 'Password@9' });
  assert.equal(mNew.status, 200);
});

/* ============================================================================
   5. الأمان وإخفاء الصفحات (404 Stealth) وحدود الصلاحيات ومعدل محاولات الدخول
   ============================================================================ */
test('الأمان وإخفاء اللوحات (404 Not Found): الروابط المباشرة والـ API ومعدل المحاولات', async (t) => {
  const s = await start();
  t.after(() => s.app.close());

  const owner = s.client();
  await owner.post('/api/auth/login', { id: 'owner@orderflow.eg', password: 'OwnerPassword@2026' });
  const ownerId = s.app.db.prepare("SELECT id FROM users WHERE role = 'owner'").get().id;

  const modRes = await owner.post('/api/owner/moderators', {
    fullName: 'مشرف اختبار', email: 'modsec@of.eg', phone: '01077778888', password: 'ModSecPassword@1'
  });
  const mod = s.client();
  await mod.post('/api/auth/login', { id: 'modsec@of.eg', password: 'ModSecPassword@1' });

  // عميل نشط
  const client = s.client();
  await client.post('/api/auth/register', { store: 'متجر عميل', email: 'csec@of.eg', phone: '01066667777', password: 'ClientSec@1' });
  const cId = (await owner.get('/api/owner/clients?status=pending')).data.clients[0].id;
  await owner.post(`/api/owner/clients/${cId}/approve`);
  await client.post('/api/auth/login', { id: 'csec@of.eg', password: 'ClientSec@1' });

  const visitor = s.client();

  // 1) الوصول المباشر للروابط /owner و /moderator و /admin يرجع 404 Not Found لغير المخوّلين
  assert.equal((await visitor.get('/owner')).status, 404);
  assert.equal((await visitor.get('/owner/moderators')).status, 404);
  assert.equal((await visitor.get('/moderator')).status, 404);
  assert.equal((await visitor.get('/admin')).status, 404);

  assert.equal((await client.get('/owner')).status, 404);
  assert.equal((await client.get('/moderator')).status, 404);
  assert.equal((await mod.get('/owner')).status, 404);
  assert.equal((await mod.get('/owner/settings')).status, 404);
  assert.equal((await owner.get('/moderator')).status, 404);

  // المخوّلون فقط يحصلون على 200
  assert.equal((await owner.get('/owner')).status, 200);
  assert.equal((await mod.get('/moderator')).status, 200);

  // 2) نقاط الـ API ترجع 404 لغير المخوّلين
  assert.equal((await visitor.get('/api/owner/dashboard')).status, 404);
  assert.equal((await visitor.get('/api/moderator/dashboard')).status, 404);
  assert.equal((await client.get('/api/owner/moderators')).status, 404);
  assert.equal((await client.get('/api/moderator/clients')).status, 404);
  assert.equal((await mod.get('/api/owner/dashboard')).status, 404);
  assert.equal((await mod.get('/api/owner/moderators')).status, 404);
  assert.equal((await mod.put('/api/owner/settings', { platform_name: 'Hacked' })).status, 404);
  assert.equal((await mod.del(`/api/owner/moderators/${modRes.data.moderator.id}`)).status, 404);

  // 3) لا يمكن للمشرف استهداف المالك عبر مسارات العملاء
  assert.equal((await mod.post(`/api/moderator/clients/${ownerId}/reject`, { reason: 'try' })).status, 404);
  assert.equal((await mod.post(`/api/moderator/clients/${ownerId}/approve`)).status, 404);

  // 4) تحديد محاولات الدخول الفاشلة (5 محاولات ثم 429)
  const brute = s.client();
  for (let i = 0; i < 5; i++) {
    const r = await brute.post('/api/auth/login', { id: 'owner@orderflow.eg', password: `wrong-${i}` });
    assert.equal(r.status, 401);
  }
  const locked = await brute.post('/api/auth/login', { id: 'owner@orderflow.eg', password: 'OwnerPassword@2026' });
  assert.equal(locked.status, 429);
});
