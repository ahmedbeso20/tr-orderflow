'use strict';
const crypto = require('node:crypto');
const { HttpError, text, phone, oneOf, nowIso } = require('../util');
const { EXPERT_SERVICES } = require('../domain');

const genRef = (prefix) => `${prefix}-${new Date().getFullYear()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

module.exports = (r, app) => {
  const { q, limiter, notify } = app;

  // حجز استشارة نمو أو طلب تفعيل خدمة من الصفحة العامة (بدون تسجيل دخول)
  r.post('/api/consultations', ({ body, ip }) => {
    if (!limiter.hit(`consult:${ip}`, 10, 600_000)) {
      throw new HttpError(429, 'تم استلام عدة طلبات مؤخرًا، انتظر قليلًا قبل المحاولة مجددًا');
    }
    const name = text(body.name, 'الاسم الكامل', { min: 2, max: 80 });
    const contactPhone = phone(body.phone);
    const storeName = text(body.storeName, 'اسم المتجر أو العلامة', { max: 80, optional: true });
    const serviceKey = body.serviceKey && EXPERT_SERVICES[body.serviceKey] ? body.serviceKey : 'growth_consult';
    const svc = EXPERT_SERVICES[serviceKey];
    const platforms = text(body.platforms, 'الأسواق المستهدفة', { max: 140, optional: true }) || 'أمازون مصر · نون · جوميا';
    const monthlyOrders = text(body.monthlyOrders, 'حجم الطلبات الشهري', { max: 60, optional: true }) || 'أقل من ١٠٠ طلب';
    const notes = text(body.notes, 'ملاحظات إضافية', { max: 600, optional: true });

    const refCode = genRef('OF-CON');
    const now = nowIso();
    const info = q(`
      INSERT INTO service_requests
        (user_id, ref_code, service_key, service_title, name, phone, store_name, platforms, monthly_orders, notes, status, created_at)
      VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', ?)
    `).run(refCode, svc.key, svc.title, name, contactPhone, storeName, platforms, monthlyOrders, notes, now);

    return {
      ok: true,
      request: q('SELECT * FROM service_requests WHERE id = ?').get(info.lastInsertRowid)
    };
  }, { auth: false });

  // قائمة طلبات خدمات الخبراء الخاصة بالتاجر المسجّل
  r.get('/api/services/requests', ({ user }) => {
    const requests = q('SELECT * FROM service_requests WHERE user_id = ? ORDER BY id DESC LIMIT 40').all(user.id);
    return {
      services: Object.values(EXPERT_SERVICES),
      requests
    };
  });

  // تقديم طلب خدمة إدارة حساب أو PPC أو A+ من داخل لوحة التحكم
  r.post('/api/services/requests', ({ user, body }) => {
    if (!limiter.hit(`svc:${user.id}`, 12, 600_000)) {
      throw new HttpError(429, 'طلبات كثيرة، انتظر قليلًا قبل إرسال طلب جديد');
    }
    const serviceKey = oneOf(body.serviceKey, Object.keys(EXPERT_SERVICES), 'نوع الخدمة');
    const svc = EXPERT_SERVICES[serviceKey];
    const contactPhone = body.phone ? phone(body.phone) : user.phone;
    const platforms = text(body.platforms, 'المنصات المطلوبة', { max: 160, optional: true }) || 'أمازون مصر · نون مصر';
    const monthlyOrders = text(body.monthlyOrders, 'حجم الطلبات الشهري', { max: 60, optional: true }) || '١٠٠ - ٥٠٠ طلب';
    const notes = text(body.notes, 'تفاصيل الطلب', { max: 800, optional: true });

    const refCode = genRef('OF-SRV');
    const now = nowIso();
    const info = q(`
      INSERT INTO service_requests
        (user_id, ref_code, service_key, service_title, name, phone, store_name, platforms, monthly_orders, notes, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    `).run(user.id, refCode, svc.key, svc.title, user.store_name, contactPhone, user.store_name, platforms, monthlyOrders, notes, now);

    notify(
      user.id,
      'success',
      `تم استلام طلب خدمة: ${svc.short} (${refCode})`,
      `سيقوم خبير التجارة الإلكترونية بالتواصل معك خلال ${svc.sla} لتأكيد خطة التنفيذ.`,
      '#/services'
    );

    return {
      ok: true,
      request: q('SELECT * FROM service_requests WHERE id = ?').get(info.lastInsertRowid)
    };
  });
};
