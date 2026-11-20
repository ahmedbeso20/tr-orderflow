'use strict';
const { HttpError, oneOf, parseJson } = require('../util');
const { PLANS } = require('../domain');
const { PLATFORM_KEYS, PLATFORM_SCHEMAS } = require('../connectors');

module.exports = (r, app) => {
  const { q, connectors, limiter, logAudit } = app;
  const noDemo = (u) => {
    if (u.is_demo) throw new HttpError(403, 'حفظ مفاتيح API الحقيقية متاح للحسابات المسجّلة فقط (أنشئ حسابًا مجانيًا أولًا).');
  };

  /** قائمة المنصات الخمس مع مخطط الحقول وحالة الاتصال (دون كشف أي أسرار) */
  r.get('/api/integrations/connections', ({ user }) => ({
    schemas: PLATFORM_SCHEMAS,
    connections: connectors.listForUser(user.id),
    integrations: parseJson(user.integrations, {})
  }));

  /** حفظ أو تحديث مفاتيح API لمنصة محددة (تُشفّر بـ AES-256-GCM في قاعدة البيانات) */
  r.put('/api/integrations/connections/:platform', async ({ user, params, body, ip }) => {
    noDemo(user);
    const platform = oneOf(params.platform, PLATFORM_KEYS, 'المنصة');
    if (!limiter.hit(`conn-save:${user.id}`, 30, 600_000)) {
      throw new HttpError(429, 'طلبات كثيرة لتحديث بيانات الربط، انتظر قليلًا');
    }

    const curInts = parseJson(user.integrations, {});
    const plan = PLANS[user.plan] || PLANS.free;
    const enableMarket = body?.enabled !== false;
    if (enableMarket) {
      const otherActive = PLATFORM_KEYS.filter((k) => k !== platform && curInts[k]).length;
      if (otherActive >= plan.markets) {
        throw new HttpError(402, `${plan.name} تتيح ربط ${plan.markets} أسواق فقط. رقّ باقتك لربط المزيد.`, { code: 'PLAN_LIMIT' });
      }
    }

    const connection = connectors.saveConnection(user.id, platform, {
      credentials: body?.credentials || {},
      environment: body?.environment || 'production',
      enabled: enableMarket
    });

    curInts[platform] = enableMarket ? 1 : 0;
    q('UPDATE users SET integrations = ? WHERE id = ?').run(JSON.stringify(curInts), user.id);

    logAudit(user.id, 'integration.credentials_saved', 'marketplace', null, {
      platform,
      environment: connection.environment,
      enabled: enableMarket
    }, ip);

    let testResult = null;
    if (body?.testNow) {
      testResult = await connectors.testConnection(user.id, platform);
    }

    return {
      ok: true,
      connection: testResult ? testResult.connection : connection,
      testResult,
      integrations: curInts,
      connections: connectors.listForUser(user.id)
    };
  });

  /** اختبار الاتصال الحقيقي بسيرفر المنصة باستخدام المفاتيح المشفرة */
  r.post('/api/integrations/connections/:platform/test', async ({ user, params, ip }) => {
    noDemo(user);
    const platform = oneOf(params.platform, PLATFORM_KEYS, 'المنصة');
    if (!limiter.hit(`conn-test:${user.id}`, 20, 600_000)) {
      throw new HttpError(429, 'محاولات كثيرة لاختبار الاتصال، انتظر قليلًا');
    }
    const result = await connectors.testConnection(user.id, platform);
    logAudit(user.id, 'integration.connection_tested', 'marketplace', null, {
      platform,
      ok: result.ok
    }, ip);
    return {
      ...result,
      connections: connectors.listForUser(user.id)
    };
  });

  /** سحب ومزامنة المنتجات والطلبات الحقيقية من المنصة مباشرةً */
  r.post('/api/integrations/connections/:platform/sync', async ({ user, params, ip }) => {
    noDemo(user);
    const platform = oneOf(params.platform, PLATFORM_KEYS, 'المنصة');
    if (!limiter.hit(`conn-sync:${user.id}`, 15, 600_000)) {
      throw new HttpError(429, 'طلبات مزامنة كثيرة، انتظر قليلًا');
    }
    const result = await connectors.syncPlatform(user.id, platform);
    if (!result.live) {
      throw new HttpError(400, result.reason || 'أضف مفتاح API لهذه المنصة أولًا لبدء سحب البيانات.');
    }
    if (!result.ok) {
      throw new HttpError(502, result.error || 'تعذّر سحب البيانات من المنصة');
    }
    logAudit(user.id, 'integration.live_sync', 'marketplace', null, {
      platform,
      importedProducts: result.importedProducts,
      updatedProducts: result.updatedProducts,
      importedOrders: result.importedOrders
    }, ip);
    return {
      ...result,
      connections: connectors.listForUser(user.id),
      message: `تم سحب البيانات من ${result.name}: +${result.importedProducts} منتج جديد، ${result.updatedProducts} محدّث، +${result.importedOrders} طلب جديد.`
    };
  });

  /** حذف مفاتيح API المشفرة وفصل المنصة بالكامل */
  r.delete('/api/integrations/connections/:platform', ({ user, params, ip }) => {
    noDemo(user);
    const platform = oneOf(params.platform, PLATFORM_KEYS, 'المنصة');
    connectors.deleteConnection(user.id, platform);
    const curInts = parseJson(user.integrations, {});
    curInts[platform] = 0;
    q('UPDATE users SET integrations = ? WHERE id = ?').run(JSON.stringify(curInts), user.id);
    logAudit(user.id, 'integration.credentials_deleted', 'marketplace', null, { platform }, ip);
    return {
      ok: true,
      integrations: curInts,
      connections: connectors.listForUser(user.id)
    };
  });
};
