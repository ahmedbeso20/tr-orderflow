'use strict';
const { HttpError, bad, text, integer, phone, oneOf, latin, round2, toCsv, nowIso } = require('../util');
const { MARKETS, COURIERS, PAYMENTS, STATUS_NEXT } = require('../domain');
const { invoicePage, awbPage } = require('../pages');
const { sendText } = require('../http');

const STATUS_LABEL = ['قيد التجهيز', 'تم الشحن', 'تم التسليم', 'مرتجع', 'ملغي'];

module.exports = (r, { q, tx, model }) => {
  const find = (uid, id) => {
    const o = q('SELECT * FROM orders WHERE id = ? AND user_id = ?').get(Number(id) || 0, uid);
    if (!o) throw new HttpError(404, 'الطلب غير موجود');
    return o;
  };
  const productsByIds = (uid, ids) => ids.map((id) => q('SELECT * FROM products WHERE id = ? AND user_id = ?').get(id, uid)).filter(Boolean).map(model.productOf);

  const restoreOrderStock = (orderId, uid) => {
    const restored = [];
    for (const it of q('SELECT * FROM order_items WHERE order_id = ? AND product_id IS NOT NULL').all(orderId)) {
      q('UPDATE products SET stock = stock + ?, updated_at = ? WHERE id = ? AND user_id = ?').run(it.qty, nowIso(), it.product_id, uid);
      restored.push(it.product_id);
    }
    return restored;
  };

  r.get('/api/orders', ({ user, query }) => {
    const where = ['user_id = ?'];
    const args = [user.id];
    const status = Number(query.status);
    if (Number.isInteger(status) && status >= 0 && status <= 4) { where.push('status = ?'); args.push(status); }
    if (query.approval && ['pending', 'approved', 'rejected'].includes(query.approval)) {
      where.push('approval_status = ?');
      args.push(query.approval);
    }
    const search = String(query.q ?? '').trim().slice(0, 60);
    if (search) {
      const like = `%${search.replace(/[\\%_]/g, '\\$&')}%`;
      const no = Number(latin(search));
      where.push(`(customer LIKE ? ESCAPE '\\' OR gov LIKE ? ESCAPE '\\' OR courier LIKE ? ESCAPE '\\' OR phone LIKE ? ESCAPE '\\'${Number.isInteger(no) ? ' OR no = ?' : ''})`);
      args.push(like, like, like, like);
      if (Number.isInteger(no)) args.push(no);
    }
    const perPage = Math.min(100, Math.max(5, Number(query.limit) || 25));
    const total = q(`SELECT COUNT(*) n FROM orders WHERE ${where.join(' AND ')}`).get(...args).n;
    const pages = Math.max(1, Math.ceil(total / perPage));
    const page = Math.min(pages, Math.max(1, Number(query.page) || 1));
    const items = q(`SELECT * FROM orders WHERE ${where.join(' AND ')} ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`)
      .all(...args, perPage, (page - 1) * perPage).map(model.orderOf);
    return { items, total, page, pages, perPage, counts: model.counts(user.id) };
  });

  r.post('/api/orders', ({ user, body }) => {
    const market = oneOf(body.market, Object.keys(MARKETS), 'السوق');
    const customer = text(body.customer, 'اسم العميل', { min: 2, max: 60 });
    const ph = phone(body.phone, { optional: true });
    const gov = text(body.gov, 'المحافظة', { min: 2, max: 40 });
    const address = text(body.address, 'العنوان', { max: 200, optional: true });
    const pay = oneOf(body.pay, PAYMENTS, 'طريقة الدفع');
    const courier = oneOf(body.courier, Object.keys(COURIERS), 'شركة الشحن');
    if (!Array.isArray(body.items) || !body.items.length || body.items.length > 20) throw bad('أضف منتجًا واحدًا على الأقل (حتى ٢٠ منتجًا)');
    const wanted = new Map();
    for (const it of body.items) {
      const pid = integer(it?.productId, 'المنتج', { min: 1, max: 2 ** 31 });
      wanted.set(pid, (wanted.get(pid) || 0) + integer(it?.qty, 'الكمية', { min: 1, max: 999 }));
    }

    const order = tx(() => { // خصم المخزون وتسجيل الطلب معًا: إما ينجح الاثنان أو لا شيء
      const now = nowIso();
      const lines = [];
      let total = 0, cost = 0;
      for (const [pid, qty] of wanted) {
        const p = q('SELECT * FROM products WHERE id = ? AND user_id = ?').get(pid, user.id);
        if (!p) throw bad('أحد المنتجات غير موجود');
        if (p.approval_status === 'rejected') throw new HttpError(409, `المنتج "${p.name}" مرفوض ولا يمكن الطلب منه`);
        if (!p.markets.includes(market)) throw bad(`"${p.name}" غير منشور على ${MARKETS[market].name}`);
        if (!q('UPDATE products SET stock = stock - ?, updated_at = ? WHERE id = ? AND stock >= ?').run(qty, now, p.id, qty).changes) {
          throw new HttpError(409, `المخزون غير كافٍ لـ "${p.name}" (المتاح ${p.stock} قطعة)`);
        }
        total += p.price * qty; cost += p.cost * qty;
        lines.push({ p, qty });
      }
      const no = q('UPDATE users SET order_seq = order_seq + 1 WHERE id = ? RETURNING order_seq').get(user.id).order_seq;
      const itemsText = lines.map(({ p, qty }) => `${p.name}${qty > 1 ? ` (${qty} قطع)` : ''}`).join(' + ').slice(0, 500);
      const approvalStatus = user.role === 'admin' ? 'approved' : 'pending';
      const id = q(`INSERT INTO orders (user_id,no,market,customer,phone,gov,address,pay,courier,total,cost_total,ship_fee,status,items,approval_status,reject_reason,created_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,0,?,?,?,?)`).run(user.id, no, market, customer, ph, gov, address, pay, courier,
        Math.round(total * 100) / 100, Math.round(cost * 100) / 100, COURIERS[courier].fee, itemsText, approvalStatus, '', now).lastInsertRowid;
      for (const { p, qty } of lines) q('INSERT INTO order_items (order_id,product_id,name,qty,price,cost) VALUES (?,?,?,?,?,?)').run(id, p.id, p.name, qty, p.price, p.cost);
      return q('SELECT * FROM orders WHERE id = ?').get(id);
    });
    const ids = [...wanted.keys()];
    return { order: model.orderOf(order), products: productsByIds(user.id, ids), counts: model.counts(user.id) };
  });

  r.post('/api/orders/:id/status', ({ user, params, body }) => {
    const next = integer(body.status, 'الحالة', { min: 1, max: 4 });
    const reason = body.reason ? text(body.reason, 'السبب', { max: 200, optional: true }) : '';
    const changed = tx(() => {
      const o = find(user.id, params.id);
      if (!(STATUS_NEXT[o.status] || []).includes(next)) throw new HttpError(409, `لا يمكن نقل الطلب من "${STATUS_LABEL[o.status]}" إلى "${STATUS_LABEL[next]}"`);
      if (next === 4) {
        q('UPDATE orders SET status = 4, cancel_reason = ?, cancelled_at = ? WHERE id = ?').run(reason || 'إلغاء الطلب قبل الشحن', nowIso(), o.id);
      } else if (next === 3) {
        q('UPDATE orders SET status = 3, return_reason = COALESCE(NULLIF(?, \'\'), return_reason) WHERE id = ?').run(reason, o.id);
      } else {
        q('UPDATE orders SET status = ? WHERE id = ?').run(next, o.id);
      }
      let restored = [];
      if ((next === 3 || next === 4) && o.approval_status !== 'rejected') {
        restored = restoreOrderStock(o.id, user.id);
      }
      return { id: o.id, restored };
    });
    return { order: model.orderOf(find(user.id, changed.id)), products: productsByIds(user.id, changed.restored), counts: model.counts(user.id) };
  });

  // إلغاء الطلب قبل الشحن واستعادة المخزون
  r.post('/api/orders/:id/cancel', ({ user, params, body }) => {
    const reason = text(body.reason || 'إلغاء بناءً على طلب العميل', 'سبب الإلغاء', { min: 2, max: 200 });
    const changed = tx(() => {
      const o = find(user.id, params.id);
      if (o.status !== 0) throw new HttpError(409, `لا يمكن إلغاء الطلب في مرحلة "${STATUS_LABEL[o.status]}"؛ يُسمح بالإلغاء للطلبات قيد التجهيز فقط.`);
      q('UPDATE orders SET status = 4, cancel_reason = ?, cancelled_at = ? WHERE id = ?').run(reason, nowIso(), o.id);
      const restored = o.approval_status !== 'rejected' ? restoreOrderStock(o.id, user.id) : [];
      return { id: o.id, restored };
    });
    return { order: model.orderOf(find(user.id, changed.id)), products: productsByIds(user.id, changed.restored), counts: model.counts(user.id) };
  });

  // صفحة المرتجعات وتحليلات RTO
  r.get('/api/returns', ({ user, query }) => {
    const search = String(query.q ?? '').trim().slice(0, 60);
    const where = ['user_id = ?', 'status = 3'];
    const args = [user.id];
    if (search) {
      const like = `%${search.replace(/[\\%_]/g, '\\$&')}%`;
      where.push(`(customer LIKE ? ESCAPE '\\' OR gov LIKE ? ESCAPE '\\' OR courier LIKE ? ESCAPE '\\' OR items LIKE ? ESCAPE '\\')`);
      args.push(like, like, like, like);
    }
    const returns = q(`SELECT * FROM orders WHERE ${where.join(' AND ')} ORDER BY created_at DESC, id DESC LIMIT 100`).all(...args).map(model.orderOf);
    const stats = q(`SELECT
        COALESCE(SUM(status = 3), 0) totalReturns,
        COALESCE(SUM(status = 2), 0) totalDelivered,
        COALESCE(SUM(CASE WHEN status = 3 THEN total ELSE 0 END), 0) returnsValue,
        COALESCE(SUM(CASE WHEN status = 3 THEN ship_fee * 1.8 ELSE 0 END), 0) shipLoss
      FROM orders WHERE user_id = ?`).get(user.id);
    const finished = stats.totalReturns + stats.totalDelivered;
    const returnRate = finished ? Math.round((stats.totalReturns / finished) * 1000) / 10 : 0;
    const byCourier = q('SELECT courier, COUNT(*) n, COALESCE(SUM(ship_fee * 1.8), 0) loss FROM orders WHERE user_id = ? AND status = 3 GROUP BY courier').all(user.id);
    return {
      returns,
      summary: {
        count: stats.totalReturns,
        totalReturns: stats.totalReturns,
        returnRate,
        totalAmount: round2(stats.returnsValue),
        returnsValue: round2(stats.returnsValue),
        shipLoss: round2(stats.shipLoss)
      },
      byCourier
    };
  });

  r.post('/api/returns/:id/reason', ({ user, params, body }) => {
    const o = find(user.id, params.id);
    const reason = text(body.reason, 'سبب المرتجع', { min: 2, max: 200 });
    q('UPDATE orders SET return_reason = ? WHERE id = ?').run(reason, o.id);
    return { order: model.orderOf(find(user.id, o.id)) };
  });

  // صفحة العملاء وتحليل الولاء
  r.get('/api/customers', ({ user, query }) => {
    const rows = q(`SELECT
        customer AS name,
        MAX(phone) AS phone,
        MAX(gov) AS gov,
        MAX(address) AS address,
        COUNT(*) AS ordersCount,
        SUM(status = 2) AS deliveredCount,
        SUM(status = 3) AS returnedCount,
        SUM(status = 4) AS cancelledCount,
        COALESCE(SUM(CASE WHEN status NOT IN (3, 4) THEN total ELSE 0 END), 0) AS totalSpent,
        MAX(created_at) AS lastOrderAt,
        GROUP_CONCAT(DISTINCT market) AS markets
      FROM orders
      WHERE user_id = ?
      GROUP BY customer
      ORDER BY totalSpent DESC, ordersCount DESC`).all(user.id);

    const search = String(query.q ?? '').trim().toLowerCase();
    const seg = String(query.segment ?? 'all');
    const filtered = rows.filter((c) => {
      if (search && !(`${c.name} ${c.phone} ${c.gov}`).toLowerCase().includes(search)) return false;
      if (seg === 'vip' && c.totalSpent < 1500 && c.ordersCount < 3) return false;
      if (seg === 'repeat' && c.ordersCount < 2) return false;
      if (seg === 'rto' && c.returnedCount < 1) return false;
      return true;
    }).map((c) => ({
      ...c,
      customer: c.name,
      totalOrders: c.ordersCount,
      returnedOrders: (c.returnedCount || 0) + (c.cancelledCount || 0),
      totalSpent: round2(c.totalSpent),
      markets: String(c.markets || '').split(',').filter(Boolean)
    }));

    return {
      customers: filtered.slice(0, 100),
      summary: {
        totalCustomers: rows.length,
        repeatCustomers: rows.filter((c) => c.ordersCount >= 2).length,
        vipCustomers: rows.filter((c) => c.totalSpent >= 1500 || c.ordersCount >= 3).length,
        avgLtv: rows.length ? round2(rows.reduce((s, c) => s + c.totalSpent, 0) / rows.length) : 0
      }
    };
  });

  r.get('/api/orders/export.csv', ({ user, res }) => {
    const rows = [['رقم الطلب', 'التاريخ', 'السوق', 'العميل', 'الموبايل', 'المحافظة', 'الدفع', 'الشحن', 'الإجمالي', 'الحالة', 'حالة الاعتماد', 'المنتجات']];
    for (const o of q('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC, id DESC').all(user.id)) {
      rows.push([o.no, o.created_at.slice(0, 10), MARKETS[o.market]?.name, o.customer, o.phone, o.gov, o.pay, o.courier, o.total, STATUS_LABEL[o.status], o.approval_status, o.items]);
    }
    res.writeHead(200, { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="omniarab-orders.csv"', 'Cache-Control': 'no-store' });
    res.end(toCsv(rows));
  });

  r.get('/api/orders/awb', ({ user, res }) => {
    const list = q('SELECT * FROM orders WHERE user_id = ? AND status = 0 ORDER BY created_at LIMIT 200').all(user.id);
    sendText(res, 200, awbPage(list, user), { 'Content-Type': 'text/html; charset=utf-8' });
  });

  r.get('/api/orders/:id/invoice', ({ user, params, res }) => {
    const o = find(user.id, params.id);
    const items = q('SELECT name, qty, price FROM order_items WHERE order_id = ?').all(o.id);
    sendText(res, 200, invoicePage(o, items, user), { 'Content-Type': 'text/html; charset=utf-8' });
  });
};

