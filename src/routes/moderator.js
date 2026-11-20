'use strict';
// واجهة المشرفين (/api/moderator/*): محمية بالكامل بـ requireModerator + فحص الصلاحيات المخصصة لكل مهمة
// يُمنع المشرف برمجيًا من الوصول للوحة المالك أو إعدادات المنصة أو رؤية/تعديل المشرفين الآخرين أو المالك
const { ROLES, MODERATOR_PERMISSION_META, normalizePermissions, assertNotOwnerTarget } = require('../rbac');
const { HttpError, bad, text, integer, nowIso } = require('../util');
const { PLANS } = require('../domain');

module.exports = (r, app) => {
  const { q, tx, notify, logAudit, model } = app;

  const pendingClientRowOf = (u) => ({
    id: u.id,
    storeName: u.store_name,
    fullName: u.full_name || u.store_name,
    phone: u.phone,
    email: u.email || '',
    status: u.status,
    rejectReason: u.reject_reason || '',
    plan: u.plan,
    planName: (PLANS[u.plan] || PLANS.free).name,
    reviewedAt: u.reviewed_at || null,
    createdAt: u.created_at
  });

  const findClientOnly = (id) => {
    const u = q("SELECT * FROM users WHERE id = ? AND role = 'client' AND is_demo = 0").get(Number(id) || 0);
    if (!u) throw new HttpError(404, 'طلب العميل غير موجود');
    assertNotOwnerTarget(u);
    return u;
  };

  // 1. لوحة المشرف: إحصاءات طلبات العملاء + صلاحياته المفعّلة + سجل قراراته الشخصية فقط
  r.get('/api/moderator/dashboard', ({ user }) => {
    const perms = normalizePermissions(user.permissions);
    const counts = q(`SELECT
        COALESCE(SUM(status = 'pending'), 0) pendingClients,
        COALESCE(SUM(status = 'active'), 0) activeClients,
        COALESCE(SUM(status = 'rejected'), 0) rejectedClients,
        COUNT(*) totalClients
      FROM users WHERE role = 'client' AND is_demo = 0`).get();

    const myStats = q(`SELECT
        COALESCE(SUM(action = 'client.approve'), 0) myApproved,
        COALESCE(SUM(action = 'client.reject'), 0) myRejected
      FROM audit_log WHERE admin_id = ?`).get(user.id);

    const myRecentActions = q(`SELECT a.*
      FROM audit_log a
      WHERE a.admin_id = ?
      ORDER BY a.id DESC LIMIT 10`).all(user.id).map(model.auditOf);

    const pendingProducts = perms.review_products_orders
      ? q("SELECT COUNT(*) n FROM products p JOIN users u ON u.id = p.user_id WHERE u.is_demo = 0 AND p.approval_status = 'pending'").get().n
      : 0;
    const pendingOrders = perms.review_products_orders
      ? q("SELECT COUNT(*) n FROM orders o JOIN users u ON u.id = o.user_id WHERE u.is_demo = 0 AND o.approval_status = 'pending'").get().n
      : 0;

    return {
      moderator: {
        id: user.id,
        fullName: user.full_name || user.store_name,
        email: user.email || '',
        permissions: perms,
        permissionMeta: MODERATOR_PERMISSION_META
      },
      counts: {
        pendingClients: counts.pendingClients,
        activeClients: counts.activeClients,
        rejectedClients: counts.rejectedClients,
        totalClients: counts.totalClients,
        myApproved: myStats.myApproved,
        myRejected: myStats.myRejected,
        pendingProducts,
        pendingOrders
      },
      myRecentActions
    };
  }, { moderator: true });

  // 2. جدول طلبات العملاء الجدد (Pending Accounts) مع التصفية والبحث — لا يعرض أبدًا المالك أو المشرفين الآخرين
  r.get('/api/moderator/clients', ({ query }) => {
    const statusFilter = ['pending', 'active', 'rejected', 'all'].includes(query.status) ? query.status : 'pending';
    const where = ["role = 'client'", 'is_demo = 0'];
    const args = [];
    if (statusFilter !== 'all') {
      where.push('status = ?');
      args.push(statusFilter);
    }
    const search = String(query.q ?? '').trim().slice(0, 60);
    if (search) {
      const like = `%${search.replace(/[\\%_]/g, '\\$&')}%`;
      where.push(`(store_name LIKE ? ESCAPE '\\' OR full_name LIKE ? ESCAPE '\\' OR phone LIKE ? ESCAPE '\\' OR COALESCE(email, '') LIKE ? ESCAPE '\\')`);
      args.push(like, like, like, like);
    }

    const clients = q(`SELECT * FROM users WHERE ${where.join(' AND ')} ORDER BY id DESC LIMIT 100`)
      .all(...args)
      .map(pendingClientRowOf);

    const counts = q(`SELECT
        COALESCE(SUM(status = 'pending'), 0) pending,
        COALESCE(SUM(status = 'active'), 0) active,
        COALESCE(SUM(status = 'rejected'), 0) rejected
      FROM users WHERE role = 'client' AND is_demo = 0`).get();

    return { clients, counts };
  }, { moderator: true, permission: 'view_pending_clients' });

  // 3. قبول حساب العميل (Approve) -> تحويل الحالة إلى active + توثيق في سجل المراقبة
  r.post('/api/moderator/clients/:id/approve', ({ user, params, ip }) => {
    const u = findClientOnly(params.id);
    if (u.status === 'suspended') {
      throw new HttpError(403, 'هذا الحساب موقوف بقرار من مالك المنصة، ولا يمكن تفعيله إلا عبر المالك.');
    }
    const now = nowIso();
    q("UPDATE users SET status = 'active', reject_reason = '', reviewed_by = ?, reviewed_at = ? WHERE id = ?")
      .run(user.id, now, u.id);
    logAudit(user.id, 'client.approve', 'user', u.id, {
      storeName: u.store_name,
      fullName: u.full_name || u.store_name,
      email: u.email || '',
      phone: u.phone
    }, ip);
    notify(
      u.id,
      'ok',
      'تم تفعيل حسابك بنجاح ✓',
      'تمت مراجعة حسابك والموافقة عليه. يمكنك الآن تسجيل الدخول واستخدام جميع خدمات OrderFlow.',
      '#/dash'
    );
    return { ok: true, client: pendingClientRowOf(findClientOnly(u.id)) };
  }, { moderator: true, permission: 'approve_clients' });

  // 4. رفض حساب العميل (Reject) مع إمكانية إضافة سبب الرفض + توثيق في سجل المراقبة
  r.post('/api/moderator/clients/:id/reject', ({ user, params, body, ip }) => {
    const u = findClientOnly(params.id);
    if (u.status === 'suspended') {
      throw new HttpError(403, 'هذا الحساب موقوف بقرار من مالك المنصة.');
    }
    const reason = text(body.reason || '', 'سبب الرفض', { max: 300, optional: true });
    const now = nowIso();
    q("UPDATE users SET status = 'rejected', reject_reason = ?, reviewed_by = ?, reviewed_at = ?, token_ver = token_ver + 1 WHERE id = ?")
      .run(reason, user.id, now, u.id);
    logAudit(user.id, 'client.reject', 'user', u.id, {
      storeName: u.store_name,
      fullName: u.full_name || u.store_name,
      email: u.email || '',
      phone: u.phone,
      reason
    }, ip);
    return { ok: true, client: pendingClientRowOf(findClientOnly(u.id)) };
  }, { moderator: true, permission: 'reject_clients' });

  // 5. مراجعة المنتجات والطلبات (متاحة فقط إذا فعّل المالك صلاحية review_products_orders للمشرف)
  r.get('/api/moderator/approvals', ({ query }) => {
    const statusFilter = ['pending', 'approved', 'rejected', 'all'].includes(query.status) ? query.status : 'pending';
    const whereSql = statusFilter === 'all'
      ? "u.role = 'client' AND u.is_demo = 0"
      : "u.role = 'client' AND u.is_demo = 0 AND x.approval_status = ?";
    const args = statusFilter === 'all' ? [] : [statusFilter];
    const products = q(`SELECT x.*, u.store_name, u.phone AS user_phone
      FROM products x JOIN users u ON u.id = x.user_id
      WHERE ${whereSql} ORDER BY x.id DESC LIMIT 60`).all(...args).map((p) => ({
      ...model.productOf(p), userId: p.user_id, storeName: p.store_name, storePhone: p.user_phone
    }));
    const orders = q(`SELECT x.*, u.store_name, u.phone AS user_phone
      FROM orders x JOIN users u ON u.id = x.user_id
      WHERE ${whereSql} ORDER BY x.id DESC LIMIT 60`).all(...args).map((o) => ({
      ...model.orderOf(o), userId: o.user_id, storeName: o.store_name, storePhone: o.user_phone
    }));
    return { products, orders };
  }, { moderator: true, permission: 'review_products_orders' });

  const handleModItemDecision = ({ modUser, rawType, itemId, decision, reasonText, ip }) => {
    const isProd = rawType === 'product' || rawType === 'products';
    const isOrd = rawType === 'order' || rawType === 'orders';
    if (!isProd && !isOrd) throw bad('نوع العنصر غير صالح');
    const id = integer(itemId, 'المعرّف', { min: 1 });
    const reason = decision === 'rejected' ? text(reasonText, 'سبب الرفض', { min: 2, max: 300 }) : '';

    return tx(() => {
      if (isProd) {
        const p = q("SELECT p.* FROM products p JOIN users u ON u.id = p.user_id WHERE p.id = ? AND u.role = 'client' AND u.is_demo = 0").get(id);
        if (!p) throw new HttpError(404, 'المنتج غير موجود');
        q('UPDATE products SET approval_status = ?, reject_reason = ?, updated_at = ? WHERE id = ?')
          .run(decision, reason, nowIso(), p.id);
        logAudit(modUser.id, decision === 'approved' ? 'product.approve' : 'product.reject', 'product', p.id, { name: p.name, sku: p.sku, reason }, ip);
        return { ok: true, type: 'product', item: model.productOf(q('SELECT * FROM products WHERE id = ?').get(p.id)) };
      }
      const o = q("SELECT o.* FROM orders o JOIN users u ON u.id = o.user_id WHERE o.id = ? AND u.role = 'client' AND u.is_demo = 0").get(id);
      if (!o) throw new HttpError(404, 'الطلب غير موجود');
      q('UPDATE orders SET approval_status = ?, reject_reason = ? WHERE id = ?').run(decision, reason, o.id);
      logAudit(modUser.id, decision === 'approved' ? 'order.approve' : 'order.reject', 'order', o.id, { no: o.no, customer: o.customer, reason }, ip);
      return { ok: true, type: 'order', item: model.orderOf(q('SELECT * FROM orders WHERE id = ?').get(o.id)) };
    });
  };

  r.post('/api/moderator/approvals/:type/:id/approve', ({ user, params, ip }) =>
    handleModItemDecision({ modUser: user, rawType: params.type, itemId: params.id, decision: 'approved', reasonText: '', ip }),
    { moderator: true, permission: 'review_products_orders' });

  r.post('/api/moderator/approvals/:type/:id/reject', ({ user, params, body, ip }) =>
    handleModItemDecision({ modUser: user, rawType: params.type, itemId: params.id, decision: 'rejected', reasonText: body.reason, ip }),
    { moderator: true, permission: 'review_products_orders' });
};
