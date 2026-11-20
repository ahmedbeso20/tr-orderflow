'use strict';
// واجهة الإدارة (/api/admin/*): محمية بالكامل بـ requireAdmin، وكل إجراء يُوثَّق في جدول audit_log
const { HttpError, bad, text, money, integer, oneOf, latin, round2, nowIso } = require('../util');
const { PLANS } = require('../domain');

const DAY_MS = 86400_000;

module.exports = (r, app) => {
  const { q, tx, cipher, session, notify, logAudit, model } = app;
  const dec = (v) => (cipher ? cipher.decrypt(v) : String(v || ''));

  const clientRowOf = (u) => ({
    id: u.id,
    storeName: u.store_name,
    phone: u.phone,
    email: u.email || '',
    emailVerified: Boolean(u.email_verified_at),
    role: u.role || 'client',
    status: u.status || 'active',
    plan: u.plan,
    planName: (PLANS[u.plan] || PLANS.free).name,
    planCycle: u.plan_cycle || 'monthly',
    planExpiresAt: u.plan_expires_at || null,
    taxId: dec(u.tax_id),
    instaPayHandle: dec(u.instapay),
    isDemo: Boolean(u.is_demo),
    productsCount: u.products_count ?? q('SELECT COUNT(*) n FROM products WHERE user_id = ?').get(u.id).n,
    approvedProductsCount: u.approved_products_count ?? q("SELECT COUNT(*) n FROM products WHERE user_id = ? AND approval_status = 'approved'").get(u.id).n,
    ordersCount: u.orders_count ?? q('SELECT COUNT(*) n FROM orders WHERE user_id = ?').get(u.id).n,
    totalPaid: round2(u.total_paid ?? q("SELECT COALESCE(SUM(amount), 0) s FROM plan_payments WHERE user_id = ? AND status = 'paid'").get(u.id).s),
    createdAt: u.created_at,
    lastSyncAt: u.last_sync_at || null
  });

  const findClient = (id) => {
    const u = q("SELECT * FROM users WHERE id = ? AND role = 'client'").get(Number(id) || 0);
    if (!u) throw new HttpError(404, 'العميل غير موجود');
    return u;
  };

  // 1. لوحة تحكم الإدارة والإحصاءات الشاملة
  r.get('/api/admin/dashboard', () => {
    const stats = q(`SELECT
        COUNT(*) totalUsers,
        COALESCE(SUM(role = 'client' AND is_demo = 0), 0) totalClients,
        COALESCE(SUM(role = 'client' AND is_demo = 0 AND status = 'pending'), 0) pendingClients,
        COALESCE(SUM(role = 'client' AND is_demo = 0 AND status = 'active'), 0) activeClients,
        COALESCE(SUM(role = 'client' AND is_demo = 0 AND status = 'rejected'), 0) rejectedClients,
        COALESCE(SUM(role = 'client' AND is_demo = 0 AND status = 'suspended'), 0) suspendedClients,
        COALESCE(SUM(is_demo = 1), 0) demoUsers,
        COALESCE(SUM(role = 'client' AND is_demo = 0 AND plan = 'free'), 0) freeCount,
        COALESCE(SUM(role = 'client' AND is_demo = 0 AND plan = 'pro'), 0) proCount,
        COALESCE(SUM(role = 'client' AND is_demo = 0 AND plan = 'business'), 0) businessCount
      FROM users`).get();

    const prodStats = q(`SELECT
        COUNT(*) totalProducts,
        COALESCE(SUM(approval_status = 'pending'), 0) pendingProducts,
        COALESCE(SUM(approval_status = 'approved'), 0) approvedProducts,
        COALESCE(SUM(approval_status = 'rejected'), 0) rejectedProducts
      FROM products WHERE user_id IN (SELECT id FROM users WHERE is_demo = 0)`).get();

    const ordStats = q(`SELECT
        COUNT(*) totalOrders,
        COALESCE(SUM(approval_status = 'pending'), 0) pendingOrders,
        COALESCE(SUM(approval_status = 'approved'), 0) approvedOrders,
        COALESCE(SUM(approval_status = 'rejected'), 0) rejectedOrders,
        COALESCE(SUM(CASE WHEN status NOT IN (3, 4) AND approval_status != 'rejected' THEN total ELSE 0 END), 0) totalGmv
      FROM orders WHERE user_id IN (SELECT id FROM users WHERE is_demo = 0)`).get();

    const payStats = q(`SELECT
        COUNT(*) totalPayments,
        COALESCE(SUM(status = 'paid'), 0) paidCount,
        COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) totalRevenue
      FROM plan_payments WHERE user_id IN (SELECT id FROM users WHERE is_demo = 0)`).get();

    const recentClients = q("SELECT * FROM users WHERE role = 'client' AND is_demo = 0 ORDER BY id DESC LIMIT 6").all().map(clientRowOf);
    const recentAudit = q(`SELECT a.*, u.store_name AS admin_name, u.phone AS admin_phone, u.email AS admin_email, u.role AS user_role
      FROM audit_log a LEFT JOIN users u ON u.id = a.admin_id
      ORDER BY a.id DESC LIMIT 10`).all().map(model.auditOf);

    const kpis = {
      totalClients: stats.totalClients,
      pendingClients: stats.pendingClients,
      activeClients: stats.activeClients,
      rejectedClients: stats.rejectedClients,
      suspendedClients: stats.suspendedClients,
      demoUsers: stats.demoUsers,
      pendingProducts: prodStats.pendingProducts,
      pendingOrders: ordStats.pendingOrders,
      pendingTotal: prodStats.pendingProducts + ordStats.pendingOrders,
      pendingApprovals: prodStats.pendingProducts + ordStats.pendingOrders,
      approvedProducts: prodStats.approvedProducts,
      approvedOrders: ordStats.approvedOrders,
      totalProducts: prodStats.totalProducts,
      totalOrders: prodStats.totalOrders,
      totalGmv: round2(ordStats.totalGmv),
      totalRevenue: round2(payStats.totalRevenue),
      totalSubscriptionsEGP: round2(payStats.totalRevenue),
      paidSubscriptions: payStats.paidCount
    };

    return {
      kpis,
      stats: kpis,
      planBreakdown: {
        free: stats.freeCount,
        pro: stats.proCount,
        business: stats.businessCount
      },
      recentClients,
      recentAudit
    };
  }, { owner: true });

  // 2. قائمة وبحث التجار/العملاء (لا تشمل المالك أو المشرفين أبدًا)
  r.get('/api/admin/clients', ({ query }) => {
    const where = ['u.is_demo = 0', "u.role = 'client'"];
    const args = [];
    if (query.status && ['pending', 'active', 'rejected', 'suspended'].includes(query.status)) {
      where.push('u.status = ?');
      args.push(query.status);
    }
    if (query.plan && PLANS[query.plan]) {
      where.push('u.plan = ?');
      args.push(query.plan);
    }
    const search = String(query.q ?? '').trim().slice(0, 60);
    if (search) {
      const like = `%${search.replace(/[\\%_]/g, '\\$&')}%`;
      where.push(`(u.store_name LIKE ? ESCAPE '\\' OR u.phone LIKE ? ESCAPE '\\' OR COALESCE(u.email, '') LIKE ? ESCAPE '\\' OR u.tax_id LIKE ? ESCAPE '\\')`);
      args.push(like, like, like, like);
    }
    const perPage = Math.min(100, Math.max(5, Number(query.limit) || 25));
    const total = q(`SELECT COUNT(*) n FROM users u WHERE ${where.join(' AND ')}`).get(...args).n;
    const pages = Math.max(1, Math.ceil(total / perPage));
    const page = Math.min(pages, Math.max(1, Number(query.page) || 1));

    const rows = q(`SELECT u.*,
        (SELECT COUNT(*) FROM products p WHERE p.user_id = u.id) AS products_count,
        (SELECT COUNT(*) FROM products p WHERE p.user_id = u.id AND p.approval_status = 'approved') AS approved_products_count,
        (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id) AS orders_count,
        (SELECT COALESCE(SUM(amount), 0) FROM plan_payments pp WHERE pp.user_id = u.id AND pp.status = 'paid') AS total_paid
      FROM users u
      WHERE ${where.join(' AND ')}
      ORDER BY u.id DESC LIMIT ? OFFSET ?`).all(...args, perPage, (page - 1) * perPage);

    return { clients: rows.map(clientRowOf), total, page, pages };
  }, { owner: true });

  // 3. تفاصيل عميل محدد
  r.get('/api/admin/clients/:id', ({ params }) => {
    const u = findClient(params.id);
    const products = q('SELECT * FROM products WHERE user_id = ? ORDER BY id DESC LIMIT 100').all(u.id).map(model.productOf);
    const orders = q('SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC LIMIT 100').all(u.id).map(model.orderOf);
    const payments = model.paymentsOf(u.id);
    const auditLogs = q(`SELECT a.*, adm.store_name AS admin_name, adm.phone AS admin_phone
      FROM audit_log a LEFT JOIN users adm ON adm.id = a.admin_id
      WHERE a.target_type = 'user' AND a.target_id = ?
      ORDER BY a.id DESC LIMIT 30`).all(u.id).map(model.auditOf);

    return {
      client: clientRowOf(u),
      settings: model.settingsOf(u),
      plan: model.planOf(u),
      counts: model.counts(u.id),
      products,
      orders,
      payments,
      auditLogs
    };
  }, { owner: true });

  // 4. تعليق أو إعادة تفعيل حساب عميل
  const setClientStatus = (adminUser, targetId, nextStatus, reason, ip) => {
    const u = findClient(targetId);
    if (u.id === adminUser.id) throw bad('لا يمكنك تعليق حسابك الشخصي');
    const st = oneOf(nextStatus, ['active', 'suspended', 'rejected', 'pending'], 'حالة الحساب');
    if (st === 'suspended' || st === 'rejected') {
      q('UPDATE users SET status = ?, reject_reason = ?, token_ver = token_ver + 1, reviewed_by = ?, reviewed_at = ? WHERE id = ?')
        .run(st, reason || '', adminUser.id, nowIso(), u.id);
    } else {
      q('UPDATE users SET status = ?, reject_reason = ?, reviewed_by = ?, reviewed_at = ? WHERE id = ?')
        .run(st, '', adminUser.id, nowIso(), u.id);
    }
    const action = st === 'suspended' ? 'client.suspend' : st === 'rejected' ? 'client.reject' : 'client.reactivate';
    logAudit(adminUser.id, action, 'user', u.id, { status: st, reason: reason || '', storeName: u.store_name }, ip);
    notify(
      u.id,
      st === 'suspended' ? 'warning' : 'ok',
      st === 'suspended' ? 'تم تعليق الحساب مؤقتًا' : 'تمت إعادة تفعيل حسابك بنجاح ✓',
      reason || (st === 'suspended' ? 'تواصل مع الإدارة لمزيد من التفاصيل.' : 'يمكنك الآن متابعة إدارة متجرك بشكل طبيعي.')
    );
    return clientRowOf(findClient(u.id));
  };

  r.post('/api/admin/clients/:id/status', ({ user, params, body, ip }) => {
    const client = setClientStatus(user, params.id, body.status, body.reason, ip);
    return { ok: true, client };
  }, { admin: true });

  r.post('/api/admin/clients/:id/suspend', ({ user, params, body, ip }) => {
    const client = setClientStatus(user, params.id, 'suspended', body.reason, ip);
    return { ok: true, client };
  }, { admin: true });

  r.post('/api/admin/clients/:id/reactivate', ({ user, params, body, ip }) => {
    const client = setClientStatus(user, params.id, 'active', body.reason, ip);
    return { ok: true, client };
  }, { admin: true });

  // 5. تغيير باقة العميل من الإدارة
  const updateClientPlan = ({ user, params, body, ip }) => {
    const u = findClient(params.id);
    const normalizedPlan = body.plan === 'ent' ? 'business' : body.plan;
    const targetPlan = PLANS[oneOf(normalizedPlan, Object.keys(PLANS), 'الباقة')];
    const cycle = body.cycle === 'yearly' ? 'yearly' : 'monthly';
    const expiresAt = targetPlan.id === 'free' ? null : new Date(Date.now() + (cycle === 'yearly' ? 365 : 30) * DAY_MS).toISOString();
    const prevPlan = u.plan;
    q('UPDATE users SET plan = ?, plan_cycle = ?, plan_expires_at = ? WHERE id = ?').run(targetPlan.id, cycle, expiresAt, u.id);
    logAudit(user.id, 'client.change_plan', 'user', u.id, { from: prevPlan, to: targetPlan.id, cycle, storeName: u.store_name }, ip);
    notify(u.id, 'ok', `تم تحديث باقة متجرك إلى «${targetPlan.name}»`, `تم تفعيل ${targetPlan.name} (${cycle === 'yearly' ? 'سنوي' : 'شهري'}) بواسطة إدارة المنصة.`, '#/pay');
    const fresh = findClient(u.id);
    return { ok: true, client: clientRowOf(fresh), plan: model.planOf(fresh) };
  };

  r.post('/api/admin/clients/:id/plan', updateClientPlan, { admin: true });
  r.put('/api/admin/clients/:id/plan', updateClientPlan, { admin: true });

  // 6. معاينة حساب العميل بوضع القراءة فقط (Read-Only Impersonation — مسجّلة في سجل المراجعة)
  r.post('/api/admin/clients/:id/impersonate', ({ user, params, ip }) => {
    const u = findClient(params.id);
    const token = session.issueImpersonation(user, u);
    logAudit(user.id, 'client.impersonate', 'user', u.id, { storeName: u.store_name, phone: u.phone, readOnly: true }, ip);
    return {
      ok: true,
      token,
      impersonationToken: token,
      readOnly: true,
      client: clientRowOf(u),
      me: model.meOf({ ...u, _impersonatedBy: user.id, _readOnly: true })
    };
  }, { admin: true });

  // 7. طابور الاعتمادات (المنتجات والطلبات)
  r.get('/api/admin/approvals', ({ query }) => {
    const statusFilter = ['pending', 'approved', 'rejected', 'all'].includes(query.status) ? query.status : 'pending';
    const typeFilter = ['all', 'product', 'order'].includes(query.type) ? query.type : 'all';
    const search = String(query.q ?? '').trim().slice(0, 60);

    const buildWhere = (alias, nameCol) => {
      const w = ['u.is_demo = 0'];
      const a = [];
      if (statusFilter !== 'all') { w.push(`${alias}.approval_status = ?`); a.push(statusFilter); }
      if (search) {
        const like = `%${search.replace(/[\\%_]/g, '\\$&')}%`;
        w.push(`(${alias}.${nameCol} LIKE ? ESCAPE '\\' OR u.store_name LIKE ? ESCAPE '\\' OR u.phone LIKE ? ESCAPE '\\')`);
        a.push(like, like, like);
      }
      return { sql: w.join(' AND '), args: a };
    };

    let products = [];
    if (typeFilter === 'all' || typeFilter === 'product') {
      const pw = buildWhere('p', 'name');
      products = q(`SELECT p.*, u.store_name, u.phone AS user_phone
        FROM products p JOIN users u ON u.id = p.user_id
        WHERE ${pw.sql} ORDER BY p.id DESC LIMIT 100`).all(...pw.args).map((p) => ({
        ...model.productOf(p),
        userId: p.user_id,
        storeName: p.store_name,
        userPhone: p.user_phone
      }));
    }

    let orders = [];
    if (typeFilter === 'all' || typeFilter === 'order') {
      const ow = buildWhere('o', 'customer');
      orders = q(`SELECT o.*, u.store_name, u.phone AS user_phone
        FROM orders o JOIN users u ON u.id = o.user_id
        WHERE ${ow.sql} ORDER BY o.id DESC LIMIT 100`).all(...ow.args).map((o) => ({
        ...model.orderOf(o),
        userId: o.user_id,
        storeName: o.store_name,
        userPhone: o.user_phone
      }));
    }

    const pendingProducts = q("SELECT COUNT(*) n FROM products p JOIN users u ON u.id = p.user_id WHERE u.is_demo = 0 AND p.approval_status = 'pending'").get().n;
    const pendingOrders = q("SELECT COUNT(*) n FROM orders o JOIN users u ON u.id = o.user_id WHERE u.is_demo = 0 AND o.approval_status = 'pending'").get().n;

    return {
      products,
      orders,
      counts: {
        pendingProducts,
        pendingOrders,
        totalPending: pendingProducts + pendingOrders
      }
    };
  }, { admin: true });

  // تنفيذ الاعتماد أو الرفض مع السبب والتوثيق في سجل المراجعة
  function handleApprovalDecision({ adminUser, rawType, itemId, decision, reasonText, ip }) {
    const isProd = rawType === 'product' || rawType === 'products';
    const isOrd = rawType === 'order' || rawType === 'orders';
    if (!isProd && !isOrd) throw bad('نوع العنصر غير صالح (product أو order)');
    const id = integer(itemId, 'المعرّف', { min: 1 });
    const reason = decision === 'rejected' ? text(reasonText, 'سبب الرفض', { min: 2, max: 300 }) : '';

    return tx(() => {
      if (isProd) {
        const p = q('SELECT * FROM products WHERE id = ?').get(id);
        if (!p) throw new HttpError(404, 'المنتج غير موجود');
        q('UPDATE products SET approval_status = ?, reject_reason = ?, updated_at = ? WHERE id = ?')
          .run(decision, reason, nowIso(), p.id);
        const action = decision === 'approved' ? 'product.approve' : 'product.reject';
        logAudit(adminUser.id, action, 'product', p.id, { name: p.name, sku: p.sku, userId: p.user_id, reason }, ip);
        notify(
          p.user_id,
          decision === 'approved' ? 'ok' : 'warning',
          decision === 'approved' ? `تم اعتماد منتجك «${p.name}» ✓` : `تم رفض منتجك «${p.name}»`,
          decision === 'approved' ? 'المنتج الآن نشط ويدخل ضمن المخزون المتزامن مع الأسواق.' : `سبب الرفض: ${reason}`,
          '#/prod'
        );
        return { ok: true, type: 'product', item: model.productOf(q('SELECT * FROM products WHERE id = ?').get(p.id)) };
      }

      const o = q('SELECT * FROM orders WHERE id = ?').get(id);
      if (!o) throw new HttpError(404, 'الطلب غير موجود');
      const prevApproval = o.approval_status;
      q('UPDATE orders SET approval_status = ?, reject_reason = ? WHERE id = ?')
        .run(decision, reason, o.id);

      // إذا رُفض الطلب وكان قد خُصم من المخزون، نُعيد الكميات للمنتجات
      if (decision === 'rejected' && prevApproval !== 'rejected' && o.status !== 3 && o.status !== 4) {
        for (const it of q('SELECT * FROM order_items WHERE order_id = ? AND product_id IS NOT NULL').all(o.id)) {
          q('UPDATE products SET stock = stock + ?, updated_at = ? WHERE id = ?').run(it.qty, nowIso(), it.product_id);
        }
      } else if (decision === 'approved' && prevApproval === 'rejected' && o.status !== 3 && o.status !== 4) {
        for (const it of q('SELECT * FROM order_items WHERE order_id = ? AND product_id IS NOT NULL').all(o.id)) {
          q('UPDATE products SET stock = MAX(0, stock - ?), updated_at = ? WHERE id = ?').run(it.qty, nowIso(), it.product_id);
        }
      }

      const action = decision === 'approved' ? 'order.approve' : 'order.reject';
      logAudit(adminUser.id, action, 'order', o.id, { no: o.no, customer: o.customer, userId: o.user_id, reason }, ip);
      notify(
        o.user_id,
        decision === 'approved' ? 'ok' : 'warning',
        decision === 'approved' ? `تم اعتماد الطلب #${o.no} ✓` : `تم رفض الطلب #${o.no}`,
        decision === 'approved' ? `الطلب الخاص بالعميل ${o.customer} معتمد وجاهز للمزامنة والشحن.` : `سبب الرفض: ${reason}`,
        '#/ord'
      );
      return { ok: true, type: 'order', item: model.orderOf(q('SELECT * FROM orders WHERE id = ?').get(o.id)) };
    });
  }

  r.post('/api/admin/approvals/:type/:id/approve', ({ user, params, ip }) =>
    handleApprovalDecision({ adminUser: user, rawType: params.type, itemId: params.id, decision: 'approved', reasonText: '', ip }), { admin: true });

  r.post('/api/admin/approvals/:type/:id/reject', ({ user, params, body, ip }) =>
    handleApprovalDecision({ adminUser: user, rawType: params.type, itemId: params.id, decision: 'rejected', reasonText: body.reason, ip }), { admin: true });

  r.post('/api/admin/products/:id/approve', ({ user, params, ip }) =>
    handleApprovalDecision({ adminUser: user, rawType: 'product', itemId: params.id, decision: 'approved', reasonText: '', ip }), { admin: true });

  r.post('/api/admin/products/:id/reject', ({ user, params, body, ip }) =>
    handleApprovalDecision({ adminUser: user, rawType: 'product', itemId: params.id, decision: 'rejected', reasonText: body.reason, ip }), { admin: true });

  r.post('/api/admin/orders/:id/approve', ({ user, params, ip }) =>
    handleApprovalDecision({ adminUser: user, rawType: 'order', itemId: params.id, decision: 'approved', reasonText: '', ip }), { admin: true });

  r.post('/api/admin/orders/:id/reject', ({ user, params, body, ip }) =>
    handleApprovalDecision({ adminUser: user, rawType: 'order', itemId: params.id, decision: 'rejected', reasonText: body.reason, ip }), { admin: true });

  // 8. نظرة عامة على المدفوعات والاشتراكات
  r.get('/api/admin/payments', ({ query }) => {
    const where = ['u.is_demo = 0'];
    const args = [];
    if (query.status && ['paid', 'pending', 'failed', 'cancelled', 'review'].includes(query.status)) {
      where.push('p.status = ?');
      args.push(query.status);
    }
    const search = String(query.q ?? '').trim().slice(0, 60);
    if (search) {
      const like = `%${search.replace(/[\\%_]/g, '\\$&')}%`;
      where.push(`(p.tx_ref LIKE ? ESCAPE '\\' OR u.store_name LIKE ? ESCAPE '\\' OR u.phone LIKE ? ESCAPE '\\' OR p.coupon LIKE ? ESCAPE '\\')`);
      args.push(like, like, like, like);
    }

    const payments = q(`SELECT p.*, u.store_name, u.phone AS user_phone
      FROM plan_payments p JOIN users u ON u.id = p.user_id
      WHERE ${where.join(' AND ')}
      ORDER BY p.id DESC LIMIT 100`).all(...args).map(model.paymentOf);

    const summary = q(`SELECT
        COALESCE(SUM(CASE WHEN p.status = 'paid' THEN p.amount ELSE 0 END), 0) totalPaid,
        COALESCE(SUM(CASE WHEN p.status = 'paid' THEN p.vat ELSE 0 END), 0) totalVat,
        COALESCE(SUM(CASE WHEN p.status = 'paid' THEN p.discount ELSE 0 END), 0) totalDiscount,
        COALESCE(SUM(p.status = 'paid'), 0) countPaid,
        COALESCE(SUM(p.status = 'pending'), 0) countPending,
        COALESCE(SUM(p.status IN ('failed', 'cancelled', 'review')), 0) countFailed
      FROM plan_payments p JOIN users u ON u.id = p.user_id
      WHERE u.is_demo = 0`).get();

    return {
      payments,
      summary: {
        totalPaid: round2(summary.totalPaid),
        paidTotal: round2(summary.totalPaid),
        totalVat: round2(summary.totalVat),
        totalDiscount: round2(summary.totalDiscount),
        countPaid: summary.countPaid,
        paidCount: summary.countPaid,
        countPending: summary.countPending,
        countFailed: summary.countFailed
      }
    };
  }, { admin: true });

  // 9. إدارة الكوبونات (CRUD كامل في قاعدة البيانات)
  r.get('/api/admin/coupons', () => {
    const coupons = q('SELECT * FROM coupons ORDER BY id DESC').all().map(model.couponOf);
    return { coupons };
  }, { admin: true });

  r.post('/api/admin/coupons', ({ user, body, ip }) => {
    const code = latin(text(body.code, 'كود الكوبون', { min: 2, max: 30 })).toUpperCase().replace(/\s+/g, '');
    if (!/^[A-Z0-9_-]{2,30}$/.test(code)) throw bad('كود الكوبون يجب أن يتكون من حروف إنجليزية وأرقام فقط');
    const type = oneOf(body.type || 'pct', ['pct', 'fixed'], 'نوع الخصم');
    const rawVal = body.value !== undefined ? body.value : body.pct;
    const value = money(rawVal, 'قيمة الخصم', { min: 1, max: type === 'pct' ? 100 : 100_000 });
    const desc = text(body.desc || '', 'وصف الكوبون', { max: 140, optional: true }) || (type === 'pct' ? `خصم ${value}٪` : `خصم ${value} ج.م`);
    const oncePerUser = body.oncePerUser ? 1 : 0;
    const active = body.active === undefined ? 1 : (body.active ? 1 : 0);
    const maxUses = body.maxUses == null || body.maxUses === '' ? null : integer(body.maxUses, 'الحد الأقصى للاستخدام', { min: 1, max: 1_000_000 });
    const expiresAt = body.expiresAt ? String(body.expiresAt).trim() : null;

    let id;
    try {
      id = Number(q('INSERT INTO coupons (code, type, value, desc, once_per_user, active, max_uses, expires_at, created_at) VALUES (?,?,?,?,?,?,?,?,?)')
        .run(code, type, value, desc, oncePerUser, active, maxUses, expiresAt, nowIso()).lastInsertRowid);
    } catch (e) {
      if (/UNIQUE/i.test(e.message)) throw new HttpError(409, 'كود الكوبون موجود بالفعل');
      throw e;
    }
    logAudit(user.id, 'coupon.create', 'coupon', id, { code, type, value }, ip);
    return { ok: true, coupon: model.couponOf(q('SELECT * FROM coupons WHERE id = ?').get(id)) };
  }, { admin: true });

  r.put('/api/admin/coupons/:id', ({ user, params, body, ip }) => {
    const cur = q('SELECT * FROM coupons WHERE id = ? OR code = ?').get(Number(params.id) || 0, String(params.id).toUpperCase());
    if (!cur) throw new HttpError(404, 'الكوبون غير موجود');
    const code = body.code !== undefined ? latin(text(body.code, 'كود الكوبون', { min: 2, max: 30 })).toUpperCase().replace(/\s+/g, '') : cur.code;
    const type = body.type !== undefined ? oneOf(body.type, ['pct', 'fixed'], 'نوع الخصم') : cur.type;
    const rawVal = body.value !== undefined ? body.value : body.pct;
    const value = rawVal !== undefined ? money(rawVal, 'قيمة الخصم', { min: 1, max: type === 'pct' ? 100 : 100_000 }) : cur.value;
    const desc = body.desc !== undefined ? text(body.desc, 'وصف الكوبون', { max: 140, optional: true }) : cur.desc;
    const oncePerUser = body.oncePerUser !== undefined ? (body.oncePerUser ? 1 : 0) : cur.once_per_user;
    const active = body.active !== undefined ? (body.active ? 1 : 0) : cur.active;
    const maxUses = body.maxUses !== undefined ? (body.maxUses === '' || body.maxUses == null ? null : integer(body.maxUses, 'الحد الأقصى', { min: 1, max: 1_000_000 })) : cur.max_uses;
    const expiresAt = body.expiresAt !== undefined ? (body.expiresAt ? String(body.expiresAt).trim() : null) : cur.expires_at;

    q('UPDATE coupons SET code = ?, type = ?, value = ?, desc = ?, once_per_user = ?, active = ?, max_uses = ?, expires_at = ? WHERE id = ?')
      .run(code, type, value, desc, oncePerUser, active, maxUses, expiresAt, cur.id);
    logAudit(user.id, 'coupon.update', 'coupon', cur.id, { code, type, value, active: Boolean(active) }, ip);
    return { ok: true, coupon: model.couponOf(q('SELECT * FROM coupons WHERE id = ?').get(cur.id)) };
  }, { admin: true });

  r.delete('/api/admin/coupons/:id', ({ user, params, ip }) => {
    const cur = q('SELECT * FROM coupons WHERE id = ? OR code = ?').get(Number(params.id) || 0, String(params.id).toUpperCase());
    if (!cur) throw new HttpError(404, 'الكوبون غير موجود');
    q('DELETE FROM coupons WHERE id = ?').run(cur.id);
    logAudit(user.id, 'coupon.delete', 'coupon', cur.id, { code: cur.code }, ip);
    return { ok: true };
  }, { admin: true });

  // 10. سجل المراجعة الإدارية (Audit Log)
  const getAuditLogs = ({ query }) => {
    const where = ['1 = 1'];
    const args = [];
    if (query.action) {
      where.push('a.action = ?');
      args.push(String(query.action));
    }
    const search = String(query.q ?? '').trim().slice(0, 60);
    if (search) {
      const like = `%${search.replace(/[\\%_]/g, '\\$&')}%`;
      where.push(`(a.action LIKE ? ESCAPE '\\' OR a.details LIKE ? ESCAPE '\\' OR COALESCE(u.store_name, '') LIKE ? ESCAPE '\\')`);
      args.push(like, like, like);
    }
    const limit = Math.min(200, Math.max(10, Number(query.limit) || 100));
    const logs = q(`SELECT a.*, u.store_name AS admin_name, u.phone AS admin_phone
      FROM audit_log a LEFT JOIN users u ON u.id = a.admin_id
      WHERE ${where.join(' AND ')}
      ORDER BY a.id DESC LIMIT ?`).all(...args, limit).map(model.auditOf);
    return { logs, items: logs };
  };

  r.get('/api/admin/audit', getAuditLogs, { admin: true });
  r.get('/api/admin/audit-log', getAuditLogs, { admin: true });
};
