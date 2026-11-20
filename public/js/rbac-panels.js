/* ==========================================================================
   OrderFlow RBAC Control Panels (Owner Panel & Moderators Panel)
   - Owner Panel: #/owner/* (1 account max — full platform control)
   - Moderators Panel: #/moderator/* (3 accounts max — client approval workflow)
   ========================================================================== */
(function (global) {
  'use strict';

  const rbacState = {
    ownerClientStatus: 'all',
    ownerClientPlan: 'all',
    ownerClientQuery: '',
    ownerAuditRole: '',
    ownerAuditActorId: '',
    ownerAuditAction: '',
    ownerAuditQuery: '',
    modClientStatus: 'pending',
    modClientQuery: '',
    modApprovalStatus: 'pending'
  };

  const CLIENT_STATUS_META = {
    pending: { label: 'قيد المراجعة', cls: 'wn' },
    active: { label: 'نشط', cls: 'ok' },
    rejected: { label: 'مرفوض', cls: 'er' },
    suspended: { label: 'موقوف / محظور', cls: 'er' }
  };

  const ACTION_LABELS = {
    'client.approve': 'قبول وتفعيل عميل',
    'client.reject': 'رفض حساب عميل',
    'client.suspend': 'إيقاف / حظر عميل',
    'client.reactivate': 'إعادة تفعيل عميل',
    'client.change_plan': 'تغيير باقة عميل',
    'client.impersonate': 'معاينة حساب عميل (قراءة فقط)',
    'moderator.create': 'إنشاء حساب مشرف',
    'moderator.update': 'تعديل بيانات مشرف',
    'moderator.permissions': 'تعديل صلاحيات مشرف',
    'moderator.change_password': 'تغيير كلمة مرور مشرف',
    'moderator.suspend': 'إيقاف مشرف وإبطال جلسته',
    'moderator.reactivate': 'إعادة تفعيل مشرف',
    'moderator.delete': 'حذف مشرف نهائيًا',
    'platform.settings_update': 'تحديث إعدادات المنصة',
    'product.approve': 'اعتماد منتج',
    'product.reject': 'رفض منتج',
    'order.approve': 'اعتماد طلب',
    'order.reject': 'رفض طلب',
    'coupon.create': 'إنشاء كوبون',
    'coupon.update': 'تعديل كوبون',
    'coupon.delete': 'حذف كوبون'
  };

  const PERM_LABELS = [
    { key: 'view_pending_clients', label: 'عرض طلبات العملاء الجدد', desc: 'استعراض قائمة العملاء بانتظار التفعيل' },
    { key: 'approve_clients', label: 'قبول وتفعيل الحسابات', desc: 'تحويل حالة العميل إلى نشط ليتمكن من الدخول' },
    { key: 'reject_clients', label: 'رفض حسابات العملاء', desc: 'رفض الطلب مع كتابة سبب الرفض للعميل' },
    { key: 'review_products_orders', label: 'مراجعة المنتجات والطلبات', desc: 'اعتماد أو رفض منتجات وطلبات التجار' }
  ];

  const OWNER_NAV = [
    { id: 'owner', icon: 'shield', title: 'لوحة المالك' },
    { id: 'owner/moderators', icon: 'customers', title: 'إدارة المشرفين' },
    { id: 'owner/clients', icon: 'store', title: 'إدارة العملاء' },
    { id: 'owner/approvals', icon: 'checkCircle', title: 'المنتجات والطلبات' },
    { id: 'owner/payments', icon: 'pay', title: 'المدفوعات والاشتراكات' },
    { id: 'owner/coupons', icon: 'ticket', title: 'الكوبونات' },
    { id: 'owner/settings', icon: 'set', title: 'إعدادات المنصة' },
    { id: 'owner/audit', icon: 'scroll', title: 'سجل المراقبة' }
  ];

  function renderStatusText(status, reason) {
    const meta = CLIENT_STATUS_META[status] || { label: status || '—', cls: '' };
    return `
      <span class="rbac-status ${meta.cls}">${meta.label}</span>
      ${status === 'rejected' && reason ? `<small class="er-tx rbac-subnote">السبب: ${esc(reason)}</small>` : ''}
    `;
  }

  function renderRoleText(role) {
    if (role === 'owner') return '<span class="rbac-role-text owner">المالك</span>';
    if (role === 'moderator') return '<span class="rbac-role-text mod">مشرف</span>';
    return '<span class="rbac-role-text">عميل</span>';
  }

  function renderDetailsSummary(details) {
    if (!details || typeof details !== 'object') return '—';
    const parts = [];
    if (details.storeName) parts.push(`المتجر: ${details.storeName}`);
    if (details.fullName && details.fullName !== details.storeName) parts.push(`الاسم: ${details.fullName}`);
    if (details.email) parts.push(details.email);
    if (details.reason) parts.push(`السبب: ${details.reason}`);
    if (details.to && details.from) parts.push(`${details.from} ← ${details.to}`);
    if (details.code) parts.push(`كود: ${details.code}`);
    if (details.permissions) {
      const activePerms = Object.entries(details.permissions).filter(([, v]) => v).map(([k]) => {
        const found = PERM_LABELS.find((p) => p.key === k);
        return found ? found.label : k;
      });
      parts.push(`الصلاحيات: ${activePerms.length ? activePerms.join('، ') : 'بدون صلاحيات'}`);
    }
    return parts.length ? esc(parts.join(' · ')) : '—';
  }

  /* ========================================================================
     1. غلاف لوحة المالك (Owner Dedicated Shell)
     ======================================================================== */
  function renderOwnerShell(viewKey, data, helpers) {
    const { me, state, ico, LOGO_HTML, renderAppContent } = helpers;
    const currentNav = OWNER_NAV.find((n) => n.id === viewKey)
      || (viewKey === 'owner/client-detail' ? { id: 'owner/clients', icon: 'store', title: 'تفاصيل حساب العميل' } : OWNER_NAV[0]);

    return `
      <div class="shell rbac-shell rbac-owner-shell">
        <div class="sidebar-backdrop ${state.dashMenuOpen ? 'open' : ''}" data-a="close-dash-menu"></div>
        <aside class="sidebar ${state.dashMenuOpen ? 'open' : ''}" aria-label="قائمة لوحة المالك">
          <div class="sidebar-brand">
            ${LOGO_HTML}
            <button type="button" class="close-btn mobile-menu-btn" data-a="close-dash-menu" aria-label="إغلاق القائمة">${ico('x', 18)}</button>
          </div>
          <div class="nav-sec-label">لوحة تحكم المالك</div>
          ${OWNER_NAV.map((item) => `
            <a href="#/${item.id}" class="nav-item ${item.id === viewKey || (viewKey === 'owner/client-detail' && item.id === 'owner/clients') ? 'on' : ''}">
              ${ico(item.icon, 18)}
              <span>${item.title}</span>
            </a>
          `).join('')}
          <span class="sp"></span>
          <div class="store-quota-card side-extra">
            <div class="rbac-account-meta">
              <strong style="display:block;font-size:14px">${esc(me.fullName || me.storeName)}</strong>
              <small class="mu" dir="ltr" style="display:block;margin-top:2px">${esc(me.email || me.phone)}</small>
              <div class="rbac-inline-meta" style="margin-top:6px">
                <span>المالك الوحيد</span>
                <span aria-hidden="true">·</span>
                <span>صلاحيات كاملة</span>
              </div>
            </div>
            <button type="button" class="btn btn-gh btn-sm" style="width:100%;margin-top:12px" data-a="logout">تسجيل الخروج</button>
          </div>
        </aside>

        <main>
          <div class="topbar">
            <button type="button" class="mobile-menu-btn" data-a="toggle-dash-menu" aria-label="فتح قائمة المالك">${ico('menu', 20)}</button>
            <div class="topbar-title-wrap">
              <span class="topbar-icon-box" aria-hidden="true">${ico(currentNav.icon, 20)}</span>
              <div>
                <h2>${currentNav.title}</h2>
                <small class="mu">لوحة المالك الخاصة · تحكم كامل في المنصة والمشرفين والعملاء</small>
              </div>
            </div>
            <span class="sp"></span>
            <a class="btn btn-gh btn-sm" href="#/owner/moderators">${ico('customers', 15)} المشرفون</a>
            <a class="btn btn-ac btn-sm" href="#/owner/clients">${ico('store', 15)} مراجعة العملاء</a>
            <button type="button" class="btn btn-gh btn-icon" data-a="theme" aria-label="تبديل المظهر" title="تبديل المظهر"><span class="theme-ico-moon">${ico('moon', 17)}</span><span class="theme-ico-sun">${ico('sunMoon', 17)}</span></button>
            <button type="button" class="btn btn-gh btn-sm" data-a="logout">خروج</button>
          </div>
          ${data && data.__error ? helpers.errorState(data.__error) : renderAppContent(viewKey, data)}
        </main>
      </div>
    `;
  }

  /* ========================================================================
     2. غلاف لوحة المشرفين (Moderators Dedicated Shell)
     ======================================================================== */
  function renderModeratorShell(viewKey, data, helpers) {
    const { me, state, ico, LOGO_HTML, renderAppContent } = helpers;
    const perms = (me && me.permissions) || {};
    const modNav = [
      { id: 'moderator', icon: 'customers', title: 'طلبات العملاء الجدد' }
    ];
    if (perms.review_products_orders) {
      modNav.push({ id: 'moderator/approvals', icon: 'checkCircle', title: 'مراجعة المنتجات والطلبات' });
    }
    const currentNav = modNav.find((n) => n.id === viewKey) || modNav[0];

    return `
      <div class="shell rbac-shell rbac-mod-shell">
        <div class="sidebar-backdrop ${state.dashMenuOpen ? 'open' : ''}" data-a="close-dash-menu"></div>
        <aside class="sidebar ${state.dashMenuOpen ? 'open' : ''}" aria-label="قائمة لوحة المشرف">
          <div class="sidebar-brand">
            ${LOGO_HTML}
            <button type="button" class="close-btn mobile-menu-btn" data-a="close-dash-menu" aria-label="إغلاق القائمة">${ico('x', 18)}</button>
          </div>
          <div class="nav-sec-label">لوحة المشرف</div>
          ${modNav.map((item) => `
            <a href="#/${item.id}" class="nav-item ${item.id === viewKey ? 'on' : ''}">
              ${ico(item.icon, 18)}
              <span>${item.title}</span>
            </a>
          `).join('')}
          <span class="sp"></span>
          <div class="store-quota-card side-extra">
            <div class="rbac-account-meta">
              <strong style="display:block;font-size:14px">${esc(me.fullName || me.storeName)}</strong>
              <small class="mu" dir="ltr" style="display:block;margin-top:2px">${esc(me.email || me.phone)}</small>
              <div class="rbac-inline-meta" style="margin-top:6px">
                <span>حساب مشرف معتمد</span>
              </div>
            </div>
            <button type="button" class="btn btn-gh btn-sm" style="width:100%;margin-top:12px" data-a="logout">تسجيل الخروج</button>
          </div>
        </aside>

        <main>
          <div class="topbar">
            <button type="button" class="mobile-menu-btn" data-a="toggle-dash-menu" aria-label="فتح قائمة المشرف">${ico('menu', 20)}</button>
            <div class="topbar-title-wrap">
              <span class="topbar-icon-box" aria-hidden="true">${ico(currentNav.icon, 20)}</span>
              <div>
                <h2>${currentNav.title}</h2>
                <small class="mu">لوحة المشرفين الخاصة · مراجعة وقبول أو رفض حسابات العملاء</small>
              </div>
            </div>
            <span class="sp"></span>
            <button type="button" class="btn btn-gh btn-icon" data-a="theme" aria-label="تبديل المظهر" title="تبديل المظهر"><span class="theme-ico-moon">${ico('moon', 17)}</span><span class="theme-ico-sun">${ico('sunMoon', 17)}</span></button>
            <button type="button" class="btn btn-gh btn-sm" data-a="logout">خروج</button>
          </div>
          ${data && data.__error ? helpers.errorState(data.__error) : renderAppContent(viewKey, data)}
        </main>
      </div>
    `;
  }

  /* ========================================================================
     3. شاشات المالك (Owner Views)
     ======================================================================== */
  function registerRbacViews(views, loaders, actions, inputs, ctx) {
    const { api, renderTable, fmtNum, fmtEGP, fmtDate, timeAgo, emptyState, errorState, openDialog, openConfirmDialog, closeDlg, showToast, renderApp, act, ico } = ctx;

    // --- Loaders ---
    loaders.owner = () => api('GET', '/api/owner/dashboard');
    loaders['owner/moderators'] = () => api('GET', '/api/owner/moderators');
    loaders['owner/clients'] = () => api('GET', `/api/owner/clients?${new URLSearchParams({
      status: rbacState.ownerClientStatus === 'all' ? '' : rbacState.ownerClientStatus,
      plan: rbacState.ownerClientPlan === 'all' ? '' : rbacState.ownerClientPlan,
      q: rbacState.ownerClientQuery
    })}`);
    loaders['owner/client-detail'] = (params) => api('GET', `/api/owner/clients/${encodeURIComponent(params.id)}`);
    loaders['owner/approvals'] = () => api('GET', `/api/owner/approvals?${new URLSearchParams({
      status: ctx.state.adminApprovalStatus || 'pending',
      type: ctx.state.adminApprovalType || 'all'
    })}`);
    loaders['owner/payments'] = () => api('GET', `/api/owner/payments?${new URLSearchParams({
      status: ctx.state.adminPaymentStatus || 'all',
      q: ctx.state.adminPaymentQuery || ''
    })}`);
    loaders['owner/coupons'] = () => api('GET', '/api/owner/coupons');
    loaders['owner/settings'] = () => api('GET', '/api/owner/settings');
    loaders['owner/audit'] = () => api('GET', `/api/owner/audit?${new URLSearchParams({
      actorRole: rbacState.ownerAuditRole,
      actorId: rbacState.ownerAuditActorId,
      action: rbacState.ownerAuditAction,
      q: rbacState.ownerAuditQuery
    })}`);

    loaders.moderator = async () => {
      const dash = await api('GET', '/api/moderator/dashboard');
      const perms = (dash.moderator && dash.moderator.permissions) || {};
      let clientsRes = { clients: [], counts: dash.counts };
      if (perms.view_pending_clients) {
        clientsRes = await api('GET', `/api/moderator/clients?${new URLSearchParams({
          status: rbacState.modClientStatus,
          q: rbacState.modClientQuery
        })}`);
      }
      return { ...dash, clients: clientsRes.clients || [], queueCounts: clientsRes.counts || dash.counts };
    };
    loaders['moderator/approvals'] = () => api('GET', `/api/moderator/approvals?status=${encodeURIComponent(rbacState.modApprovalStatus)}`);

    // --- Owner Overview (#/owner) ---
    views.owner = (d) => {
      const k = (d && d.kpis) || {};
      const pending = (d && d.pendingQueue) || [];
      const audit = (d && d.recentAudit) || [];
      return `
        <div class="grid-kpi" style="margin-bottom:20px">
          <div class="card kpi-card">
            <span class="mu" style="font-size:13px;font-weight:700">طلبات حسابات قيد المراجعة</span>
            <b>${fmtNum(k.pendingClients || 0)}</b>
            <div class="rbac-inline-meta">
              <span class="${(k.pendingClients || 0) > 0 ? 'wn-tx' : 'ok-tx'}">${(k.pendingClients || 0) > 0 ? 'تحتاج قرار تفعيل' : 'لا توجد طلبات معلّقة'}</span>
            </div>
          </div>
          <div class="card kpi-card">
            <span class="mu" style="font-size:13px;font-weight:700">حسابات العملاء</span>
            <b>${fmtNum(k.totalClients || 0)}</b>
            <div class="rbac-inline-meta">
              <span class="ok-tx">${fmtNum(k.activeClients || 0)} نشط</span>
              <span aria-hidden="true">·</span>
              <span class="er-tx">${fmtNum((k.rejectedClients || 0) + (k.suspendedClients || 0))} مرفوض/موقوف</span>
            </div>
          </div>
          <div class="card kpi-card">
            <span class="mu" style="font-size:13px;font-weight:700">حسابات المشرفين</span>
            <b>${fmtNum(k.activeModerators || 0)} / ${fmtNum(k.maxModerators || 3)}</b>
            <div class="rbac-inline-meta">
              <span>إجمالي الحسابات: ${fmtNum(k.totalModerators || 0)} من ٣</span>
            </div>
          </div>
          <div class="card kpi-card">
            <span class="mu" style="font-size:13px;font-weight:700">إيرادات الاشتراكات</span>
            <b>${fmtEGP(k.totalRevenue || 0)}</b>
            <div class="rbac-inline-meta">
              <span>GMV: ${fmtEGP(k.totalGmv || 0)}</span>
            </div>
          </div>
        </div>

        <div class="grid-2">
          <div class="card">
            <div class="row" style="margin-bottom:14px">
              <h3>حسابات عملاء بانتظار المراجعة</h3>
              <span class="sp"></span>
              <a class="pr-tx" style="font-size:13px;font-weight:700" href="#/owner/clients">كل العملاء ◂</a>
            </div>
            ${pending.length ? renderTable(
              ['المتجر / العميل', 'البريد / الموبايل', 'تاريخ التسجيل', 'القرار'],
              pending.map((c) => [
                `<b>${esc(c.storeName)}</b><br><small class="mu">${esc(c.fullName || '')}</small>`,
                `<code dir="ltr">${esc(c.email || '—')}</code><br><small dir="ltr" class="mu">${esc(c.phone)}</small>`,
                `<small class="mu">${fmtDate(c.createdAt)}</small>`,
                `<div class="row" style="gap:6px;justify-content:flex-end">
                  <button type="button" class="btn btn-ok btn-sm" data-a="owner-approve-client" data-id="${c.id}" aria-label="قبول حساب ${esc(c.storeName)}">قبول</button>
                  <button type="button" class="btn btn-er btn-sm" data-a="owner-reject-client-modal" data-id="${c.id}" data-name="${esc(c.storeName)}" aria-label="رفض حساب ${esc(c.storeName)}">رفض</button>
                </div>`
              ])
            ) : '<p class="mu ctr" style="padding:20px">لا توجد حسابات عملاء بانتظار المراجعة حاليًا.</p>'}
          </div>

          <div class="card">
            <div class="row" style="margin-bottom:14px">
              <h3>آخر إجراءات سجل المراقبة</h3>
              <span class="sp"></span>
              <a class="pr-tx" style="font-size:13px;font-weight:700" href="#/owner/audit">السجل الكامل ◂</a>
            </div>
            ${audit.length ? renderTable(
              ['الوقت', 'المنفّذ', 'الإجراء', 'التفاصيل'],
              audit.slice(0, 8).map((a) => [
                `<small class="mu">${timeAgo(a.createdAt)}</small>`,
                `<b>${esc(a.actorName)}</b><br>${renderRoleText(a.actorRole)}`,
                `<span>${esc(ACTION_LABELS[a.action] || a.action)}</span>`,
                `<small class="mu">${renderDetailsSummary(a.details)}</small>`
              ])
            ) : '<p class="mu ctr" style="padding:20px">لم يتم تسجيل أي عمليات في سجل المراقبة بعد.</p>'}
          </div>
        </div>
      `;
    };

    // --- Owner Moderators Management (#/owner/moderators) ---
    views['owner/moderators'] = (d) => {
      const mods = (d && d.moderators) || [];
      const count = d ? d.count : mods.length;
      const activeCount = d ? d.activeCount : mods.filter((m) => m.status === 'active').length;
      const max = (d && d.max) || 3;
      const full = count >= max;

      return `
        <div class="card" style="margin-bottom:18px">
          <div class="rbac-mod-header-row">
            <div class="rbac-mod-header-text">
              <h3 style="margin:0 0 4px">إدارة حسابات المشرفين</h3>
              <p class="mu" style="font-size:13.5px;margin:0">
                الحد الأقصى المسموح به هو ٣ حسابات مشرفين فقط. يمكنك تخصيص مهام كل مشرف بشكل مستقل، أو إيقافه أو حذفه مع إبطال جلسته فورًا.
              </p>
            </div>
            <div class="rbac-mod-header-controls">
              <div class="rbac-slot-counter" aria-label="عدد حسابات المشرفين">
                <span class="mu" style="font-size:12.5px">المشرفون</span>
                <strong style="font-size:18px;font-family:var(--font-mono)">${fmtNum(count)} / ${fmtNum(max)}</strong>
                <small class="mu">${fmtNum(activeCount)} نشط</small>
              </div>
              <button type="button" class="btn btn-ac" data-a="owner-open-mod-modal" ${full ? 'disabled' : ''}>
                ${ico('plus', 15)} ${full ? 'اكتمل الحد الأقصى (٣ مشرفين)' : 'إضافة مشرف جديد'}
              </button>
            </div>
          </div>
        </div>

        ${mods.length ? `
          <div class="rbac-mod-grid">
            ${mods.map((m) => `
              <article class="card rbac-mod-card" data-mod-id="${m.id}">
                <div class="row-wrap" style="justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:14px">
                  <div>
                    <h3 style="margin:0 0 4px;font-size:17px">${esc(m.fullName)}</h3>
                    <div class="rbac-inline-meta">
                      <code dir="ltr">${esc(m.email)}</code>
                      <span aria-hidden="true">·</span>
                      <code dir="ltr">${esc(m.phone)}</code>
                    </div>
                  </div>
                  <div style="text-align:end">
                    ${renderStatusText(m.status)}
                    <div class="rbac-inline-meta" style="margin-top:4px;justify-content:flex-end">
                      <span>قبول: <b>${fmtNum(m.approvedCount)}</b></span>
                      <span aria-hidden="true">·</span>
                      <span>رفض: <b>${fmtNum(m.rejectedCount)}</b></span>
                    </div>
                  </div>
                </div>

                <div class="rbac-perm-section">
                  <div class="mu" style="font-size:12.5px;font-weight:700;margin-bottom:8px">الصلاحيات والمهام الممنوحة</div>
                  <div class="rbac-perm-list">
                    ${PERM_LABELS.map((p) => {
                      const on = Boolean(m.permissions && m.permissions[p.key]);
                      return `
                        <label class="rbac-perm-toggle">
                          <input type="checkbox"
                            data-a="owner-toggle-mod-perm"
                            data-id="${m.id}"
                            data-perm="${p.key}"
                            ${on ? 'checked' : ''}>
                          <span>
                            <b>${p.label}</b>
                            <small class="mu">${p.desc}</small>
                          </span>
                        </label>
                      `;
                    }).join('')}
                  </div>
                </div>

                <div class="row-wrap rbac-mod-actions">
                  <button type="button" class="btn btn-gh btn-sm"
                    data-a="owner-edit-mod-modal"
                    data-id="${m.id}"
                    data-name="${esc(m.fullName)}"
                    data-email="${esc(m.email)}"
                    data-phone="${esc(m.phone)}"
                    aria-label="تعديل بيانات ${esc(m.fullName)}">تعديل البيانات</button>
                  <button type="button" class="btn btn-gh btn-sm"
                    data-a="owner-mod-password-modal"
                    data-id="${m.id}"
                    data-name="${esc(m.fullName)}"
                    aria-label="تغيير كلمة مرور ${esc(m.fullName)}">تغيير كلمة المرور</button>
                  <button type="button" class="btn ${m.status === 'suspended' ? 'btn-ok' : 'btn-gh'} btn-sm"
                    data-a="owner-toggle-mod-status"
                    data-id="${m.id}"
                    data-status="${m.status}"
                    data-name="${esc(m.fullName)}"
                    aria-label="${m.status === 'suspended' ? 'إعادة تفعيل' : 'إيقاف'} ${esc(m.fullName)}">
                    ${m.status === 'suspended' ? 'إعادة التفعيل' : 'إيقاف مؤقت'}
                  </button>
                  <button type="button" class="btn btn-er btn-sm"
                    data-a="owner-delete-mod"
                    data-id="${m.id}"
                    data-name="${esc(m.fullName)}"
                    aria-label="حذف المشرف ${esc(m.fullName)} نهائيًا">حذف نهائي</button>
                </div>
              </article>
            `).join('')}
          </div>
        ` : emptyState('customers', 'لا يوجد مشرفون مسجّلون بعد', 'يمكنك إنشاء حتى ٣ حسابات مشرفين لمراجعة وتفعيل حسابات العملاء الجدد.')}
      `;
    };

    // --- Owner Clients Management (#/owner/clients) ---
    views['owner/clients'] = (d) => {
      const list = (d && d.clients) || [];
      const counts = (d && d.counts) || {};
      return `
        <div class="card">
          <div class="row-wrap" style="margin-bottom:16px;gap:10px">
            <input type="search" style="width:260px;margin:0" placeholder="ابحث باسم المتجر أو البريد أو الموبايل..." value="${esc(rbacState.ownerClientQuery)}" data-i="owner-client-search" aria-label="بحث في العملاء">
            <div class="seg-rail" role="group" aria-label="تصفية حالة العميل">
              ${[
                ['all', `الكل (${fmtNum(counts.allCount || 0)})`],
                ['pending', `قيد المراجعة (${fmtNum(counts.pending || 0)})`],
                ['active', `نشط (${fmtNum(counts.active || 0)})`],
                ['rejected', `مرفوض (${fmtNum(counts.rejected || 0)})`],
                ['suspended', `محظور (${fmtNum(counts.suspended || 0)})`]
              ].map(([k, lbl]) => `
                <button type="button" class="pill ${rbacState.ownerClientStatus === k ? 'on' : ''}" data-a="owner-client-status-flt" data-v="${k}">${lbl}</button>
              `).join('')}
            </div>
          </div>

          ${list.length ? renderTable(
            ['#', 'المتجر والعميل', 'البريد / الموبايل', 'الباقة', 'حالة الحساب', 'تاريخ التسجيل', 'الإجراءات'],
            list.map((c) => [
              `<b>#${c.id}</b>`,
              `<div><b>${esc(c.storeName)}</b><br><small class="mu">${esc(c.fullName || '')}</small></div>`,
              `<div><code dir="ltr">${esc(c.email || '—')}</code><br><small dir="ltr" class="mu">${esc(c.phone)}</small></div>`,
              `<span>${esc(c.planName)}</span>`,
              renderStatusText(c.status, c.rejectReason),
              `<small class="mu">${fmtDate(c.createdAt)}</small>`,
              `<div class="row" style="gap:6px;flex-wrap:wrap;justify-content:flex-end">
                ${c.status !== 'active' ? `<button type="button" class="btn btn-ok btn-sm" data-a="owner-approve-client" data-id="${c.id}" aria-label="قبول حساب ${esc(c.storeName)}">قبول وتفعيل</button>` : ''}
                ${c.status === 'pending' ? `<button type="button" class="btn btn-er btn-sm" data-a="owner-reject-client-modal" data-id="${c.id}" data-name="${esc(c.storeName)}" aria-label="رفض حساب ${esc(c.storeName)}">رفض</button>` : ''}
                ${c.status === 'active' ? `<button type="button" class="btn btn-er btn-sm" data-a="owner-suspend-client" data-id="${c.id}" data-name="${esc(c.storeName)}" aria-label="حظر حساب ${esc(c.storeName)}">حظر</button>` : ''}
                <a class="btn btn-gh btn-sm" href="#/owner/clients/${c.id}">التفاصيل</a>
              </div>`
            ])
          ) : emptyState('store', 'لا يوجد عملاء مطابقون', 'جرّب تغيير حالة التصفية أو البحث باسم المتجر أو البريد الإلكتروني.')}
        </div>
      `;
    };

    // --- Owner Client Detail (#/owner/clients/:id) ---
    views['owner/client-detail'] = (d) => {
      const c = d && d.client;
      if (!c) return errorState('حساب العميل غير موجود');
      const planObj = (d && d.plan) || { id: c.plan || 'free', name: c.planName || 'مجانية', cycle: c.planCycle || 'monthly' };
      const prods = d.products || [];
      const ords = d.orders || [];
      const logs = d.auditLogs || [];
      return `
        <div class="card" style="margin-bottom:18px">
          <div class="row-wrap" style="justify-content:space-between;gap:12px">
            <div>
              <div class="row-wrap" style="gap:10px;margin-bottom:6px">
                <a href="#/owner/clients" class="btn btn-gh btn-sm">▸ العودة للعملاء</a>
                <h3 style="margin:0">${esc(c.storeName)} (#${c.id})</h3>
                ${renderStatusText(c.status, c.rejectReason)}
              </div>
              <div class="rbac-inline-meta">
                <span>البريد: <code dir="ltr">${esc(c.email || '—')}</code></span>
                <span aria-hidden="true">·</span>
                <span>الموبايل: <code dir="ltr">${esc(c.phone)}</code></span>
                <span aria-hidden="true">·</span>
                <span>الباقة: <b>${esc(planObj.name)}</b></span>
              </div>
            </div>
            <div class="row-wrap" style="gap:8px">
              ${c.status !== 'active' ? `<button type="button" class="btn btn-ok btn-sm" data-a="owner-approve-client" data-id="${c.id}">قبول وتفعيل الحساب</button>` : ''}
              ${c.status === 'pending' ? `<button type="button" class="btn btn-er btn-sm" data-a="owner-reject-client-modal" data-id="${c.id}" data-name="${esc(c.storeName)}">رفض الحساب</button>` : ''}
              ${c.status === 'active' ? `<button type="button" class="btn btn-er btn-sm" data-a="owner-suspend-client" data-id="${c.id}" data-name="${esc(c.storeName)}">حظر الحساب</button>` : ''}
              <button type="button" class="btn btn-gh btn-sm" data-a="admin-change-plan-modal" data-id="${c.id}" data-plan="${planObj.id}" data-cycle="${planObj.cycle}" data-name="${esc(c.storeName)}">تغيير الباقة</button>
              ${c.status === 'active' ? `<button type="button" class="btn btn-ac btn-sm" data-a="owner-impersonate" data-id="${c.id}">معاينة كعميل (قراءة فقط)</button>` : ''}
            </div>
          </div>
        </div>

        <div class="grid-2">
          <div class="card">
            <h3 style="margin-bottom:12px">المنتجات (${fmtNum(prods.length)}) والطلبات (${fmtNum(ords.length)})</h3>
            <p class="mu" style="font-size:13.5px">إجمالي المدفوعات المؤكدة: <b>${fmtEGP(c.totalPaid || 0)}</b> · تاريخ الانضمام: ${fmtDate(c.createdAt)}</p>
          </div>
          <div class="card">
            <h3 style="margin-bottom:12px">سجل الإجراءات على هذا العميل</h3>
            ${logs.length ? renderTable(
              ['الوقت', 'المنفّذ', 'الإجراء', 'التفاصيل'],
              logs.map((l) => [
                `<small class="mu">${timeAgo(l.createdAt)}</small>`,
                `${esc(l.actorName)} · ${renderRoleText(l.actorRole)}`,
                esc(ACTION_LABELS[l.action] || l.action),
                `<small class="mu">${renderDetailsSummary(l.details)}</small>`
              ])
            ) : '<p class="mu">لا توجد إجراءات سابقة على هذا الحساب.</p>'}
          </div>
        </div>
      `;
    };

    // --- Owner Approvals, Payments, Coupons (reuse core tables cleanly) ---
    const adaptOwnerReuse = (html) => html
      .replace(/<div class="seg-rail"[\s\S]*?<\/div>\s*/m, '')
      .replace(/href="#\/admin\/clients\//g, 'href="#/owner/clients/');
    views['owner/approvals'] = (d) => views['admin/approvals'] ? adaptOwnerReuse(views['admin/approvals'](d)) : '';
    views['owner/payments'] = (d) => views['admin/payments'] ? adaptOwnerReuse(views['admin/payments'](d)) : '';
    views['owner/coupons'] = (d) => views['admin/coupons'] ? adaptOwnerReuse(views['admin/coupons'](d)) : '';

    // --- Owner Platform Settings (#/owner/settings) ---
    views['owner/settings'] = (d) => {
      const s = (d && d.settings) || {};
      return `
        <div class="card" style="max-width:740px">
          <h3 style="margin-bottom:6px">إعدادات المنصة العامة</h3>
          <p class="mu" style="font-size:13.5px;margin-bottom:18px">متاحة حصريًا لمالك المنصة. تُطبّق التعديلات فورًا على نظام التسجيل والمنصة بالكامل.</p>
          <form data-submit="owner-save-settings" novalidate>
            <label for="os-name">اسم المنصة</label>
            <input id="os-name" value="${esc(s.platform_name || 'OrderFlow')}" maxlength="60">
            <div class="grid-equal" style="gap:12px">
              <div>
                <label for="os-email">بريد الدعم الفني</label>
                <input id="os-email" dir="ltr" value="${esc(s.support_email || 'support@orderflow.eg')}">
              </div>
              <div>
                <label for="os-phone">هاتف الدعم الفني</label>
                <input id="os-phone" dir="ltr" value="${esc(s.support_phone || '')}">
              </div>
            </div>
            <label for="os-notice">إشعار الصيانة أو تنبيه المنصة (اختياري)</label>
            <input id="os-notice" value="${esc(s.maintenance_notice || '')}" placeholder="اتركه فارغًا في الوضع الطبيعي">

            <div class="rbac-perm-list" style="margin:16px 0 20px">
              <label class="rbac-perm-toggle">
                <input type="checkbox" id="os-reg-open" ${s.registration_open !== '0' ? 'checked' : ''}>
                <span>
                  <b>السماح بتسجيل عملاء جدد</b>
                  <small class="mu">عند التعطيل لن يتمكن الزوار من إنشاء حسابات جديدة مؤقتًا</small>
                </span>
              </label>
              <label class="rbac-perm-toggle">
                <input type="checkbox" id="os-req-approval" ${s.require_client_approval !== '0' ? 'checked' : ''}>
                <span>
                  <b>تفعيل مراجعة حسابات العملاء الجدد (Pending Flow)</b>
                  <small class="mu">يُحفظ كل حساب جديد بحالة «قيد المراجعة» ولا يدخل إلا بعد موافقة المالك أو أحد المشرفين</small>
                </span>
              </label>
            </div>
            <button type="submit" class="btn btn-ac">حفظ إعدادات المنصة</button>
          </form>
        </div>
      `;
    };

    // --- Owner Audit Log (#/owner/audit) ---
    views['owner/audit'] = (d) => {
      const logs = (d && d.logs) || [];
      const mods = (d && d.moderators) || [];
      return `
        <div class="card">
          <div class="row-wrap" style="margin-bottom:16px;gap:10px">
            <div>
              <h3 style="margin:0">سجل المراقبة (Audit Log)</h3>
              <small class="mu">يعرض جميع الإجراءات التي نفّذها كل مشرف والمالك مع التوقيت والتفاصيل الكاملة</small>
            </div>
            <span class="sp"></span>
            <select style="width:auto;margin:0" data-i="owner-audit-role" aria-label="تصفية حسب الدور">
              <option value="" ${!rbacState.ownerAuditRole ? 'selected' : ''}>كل الأدوار</option>
              <option value="moderator" ${rbacState.ownerAuditRole === 'moderator' ? 'selected' : ''}>المشرفون فقط</option>
              <option value="owner" ${rbacState.ownerAuditRole === 'owner' ? 'selected' : ''}>المالك فقط</option>
            </select>
            <select style="width:auto;margin:0" data-i="owner-audit-actor" aria-label="تصفية حسب المشرف">
              <option value="" ${!rbacState.ownerAuditActorId ? 'selected' : ''}>كل المشرفين</option>
              ${mods.map((m) => `<option value="${m.id}" ${String(rbacState.ownerAuditActorId) === String(m.id) ? 'selected' : ''}>${esc(m.full_name || m.email)}</option>`).join('')}
            </select>
            <select style="width:auto;margin:0" data-i="owner-audit-action" aria-label="تصفية حسب نوع الإجراء">
              <option value="" ${!rbacState.ownerAuditAction ? 'selected' : ''}>كل الإجراءات</option>
              ${Object.entries(ACTION_LABELS).map(([k, lbl]) => `
                <option value="${k}" ${rbacState.ownerAuditAction === k ? 'selected' : ''}>${lbl}</option>
              `).join('')}
            </select>
          </div>
          ${logs.length ? renderTable(
            ['#', 'التاريخ والوقت', 'المنفّذ والدور', 'الإجراء', 'الهدف', 'التفاصيل', 'IP'],
            logs.map((l) => {
              const targetLabels = { user: 'عميل', moderator: 'مشرف', platform: 'المنصة', product: 'منتج', order: 'طلب', coupon: 'كوبون' };
              const targetLbl = targetLabels[l.targetType] || l.targetType || '—';
              return [
                `#${l.id}`,
                `<small class="mu">${fmtDate(l.createdAt)} · ${timeAgo(l.createdAt)}</small>`,
                `<b>${esc(l.actorName)}</b><br><div class="rbac-inline-meta">${renderRoleText(l.actorRole)}${l.actorEmail ? `<span>·</span><code dir="ltr">${esc(l.actorEmail)}</code>` : ''}</div>`,
                `<b>${esc(ACTION_LABELS[l.action] || l.action)}</b>`,
                `<span>${esc(targetLbl)}${l.targetId ? ` <span class="mu">#${l.targetId}</span>` : ''}</span>`,
                `<small class="mu" style="white-space:normal;max-width:320px;display:inline-block">${renderDetailsSummary(l.details)}</small>`,
                `<code dir="ltr" style="font-size:11.5px">${esc(l.ip || '—')}</code>`
              ];
            })
          ) : emptyState('scroll', 'لا توجد سجلات مطابقة', 'كل قرار قبول أو رفض أو تعديل يُسجّل هنا تلقائيًا بالتوقيت الكامل.')}
        </div>
      `;
    };

    /* ========================================================================
       4. شاشات المشرفين (Moderators Panel Views — #/moderator)
       ======================================================================== */
    views.moderator = (d) => {
      const mod = (d && d.moderator) || {};
      const perms = mod.permissions || {};
      const counts = (d && d.counts) || {};
      const qCounts = (d && d.queueCounts) || {};
      const clients = (d && d.clients) || [];
      const activePermNames = PERM_LABELS.filter((p) => perms[p.key]).map((p) => p.label);

      return `
        <div class="grid-kpi" style="margin-bottom:18px">
          <div class="card kpi-card">
            <span class="mu" style="font-size:13px;font-weight:700">طلبات العملاء بانتظار المراجعة</span>
            <b>${fmtNum(counts.pendingClients || 0)}</b>
            <div class="rbac-inline-meta"><span class="${(counts.pendingClients || 0) > 0 ? 'wn-tx' : 'ok-tx'}">قائمة التفعيل</span></div>
          </div>
          <div class="card kpi-card">
            <span class="mu" style="font-size:13px;font-weight:700">عملاء تم قبولهم بواسطتك</span>
            <b>${fmtNum(counts.myApproved || 0)}</b>
            <div class="rbac-inline-meta"><span class="ok-tx">إجمالي العملاء النشطين: ${fmtNum(counts.activeClients || 0)}</span></div>
          </div>
          <div class="card kpi-card">
            <span class="mu" style="font-size:13px;font-weight:700">طلبات تم رفضها بواسطتك</span>
            <b>${fmtNum(counts.myRejected || 0)}</b>
            <div class="rbac-inline-meta"><span class="mu">مرفوض إجمالًا: ${fmtNum(counts.rejectedClients || 0)}</span></div>
          </div>
        </div>

        <div class="card" style="margin-bottom:18px">
          <div class="rbac-inline-meta" style="font-size:13.5px">
            <b>مهامك المفعّلة حاليًا:</b>
            <span>${activePermNames.length ? activePermNames.join(' · ') : 'لم يتم تفعيل أي مهام بعد — راجع المالك'}</span>
          </div>
        </div>

        <div class="card">
          <div class="row-wrap" style="margin-bottom:16px;gap:10px">
            <h3 style="margin:0">طلبات العملاء الجدد (Pending Accounts)</h3>
            <span class="sp"></span>
            <input type="search" style="width:240px;margin:0" placeholder="ابحث بالاسم أو البريد أو الموبايل..." value="${esc(rbacState.modClientQuery)}" data-i="mod-client-search" aria-label="بحث في طلبات العملاء">
            <div class="seg-rail" role="group" aria-label="تصفية طلبات العملاء">
              ${[
                ['pending', `قيد المراجعة (${fmtNum(qCounts.pending ?? counts.pendingClients ?? 0)})`],
                ['active', `المفعّلون (${fmtNum(qCounts.active ?? counts.activeClients ?? 0)})`],
                ['rejected', `المرفوضون (${fmtNum(qCounts.rejected ?? counts.rejectedClients ?? 0)})`]
              ].map(([k, lbl]) => `
                <button type="button" class="pill ${rbacState.modClientStatus === k ? 'on' : ''}" data-a="mod-client-status-flt" data-v="${k}">${lbl}</button>
              `).join('')}
            </div>
          </div>

          ${!perms.view_pending_clients
            ? emptyState('lock', 'صلاحية عرض الطلبات غير مفعّلة', 'قام مالك المنصة بتعطيل صلاحية عرض قائمة العملاء لحسابك مؤقتًا.')
            : clients.length ? renderTable(
              ['#', 'اسم المتجر / العميل', 'البريد الإلكتروني', 'رقم الموبايل', 'تاريخ التسجيل', 'الحالة', 'اتخاذ القرار'],
              clients.map((c) => [
                `<b>#${c.id}</b>`,
                `<b>${esc(c.storeName)}</b><br><small class="mu">${esc(c.fullName || '')}</small>`,
                `<code dir="ltr">${esc(c.email || '—')}</code>`,
                `<code dir="ltr">${esc(c.phone)}</code>`,
                `<small class="mu">${fmtDate(c.createdAt)}</small>`,
                renderStatusText(c.status, c.rejectReason),
                `<div class="row" style="gap:6px;justify-content:flex-end">
                  ${c.status !== 'active' && perms.approve_clients
                    ? `<button type="button" class="btn btn-ok btn-sm" data-a="mod-approve-client" data-id="${c.id}" aria-label="قبول حساب ${esc(c.storeName)}">قبول الحساب</button>`
                    : ''}
                  ${c.status !== 'rejected' && perms.reject_clients
                    ? `<button type="button" class="btn btn-er btn-sm" data-a="mod-reject-client-modal" data-id="${c.id}" data-name="${esc(c.storeName)}" aria-label="رفض حساب ${esc(c.storeName)}">رفض الحساب</button>`
                    : ''}
                  ${(!perms.approve_clients && !perms.reject_clients) ? '<small class="mu">عرض فقط</small>' : ''}
                </div>`
              ])
            ) : emptyState('checkCircle', 'لا توجد طلبات في هذه القائمة', 'ستظهر حسابات العملاء الجدد هنا فور تسجيلهم في الموقع.')}
        </div>
      `;
    };

    views['moderator/approvals'] = (d) => {
      const prods = (d && d.products) || [];
      const ords = (d && d.orders) || [];
      return `
        <div class="card" style="margin-bottom:18px">
          <div class="row-wrap" style="justify-content:space-between">
            <h3 style="margin:0">مراجعة المنتجات (${fmtNum(prods.length)})</h3>
            <div class="seg-rail" role="group" aria-label="تصفية حالة المراجعة">
              ${[['pending', 'قيد المراجعة'], ['approved', 'معتمد'], ['rejected', 'مرفوض']].map(([k, lbl]) => `
                <button type="button" class="pill ${rbacState.modApprovalStatus === k ? 'on' : ''}" data-a="mod-appr-status-flt" data-v="${k}">${lbl}</button>
              `).join('')}
            </div>
          </div>
          <div style="margin-top:14px">
            ${prods.length ? renderTable(
              ['المنتج', 'المتجر', 'SKU', 'السعر', 'الإجراء'],
              prods.map((p) => [
                `<b>${esc(p.name)}</b>`,
                esc(p.storeName),
                `<code dir="ltr">${esc(p.sku)}</code>`,
                fmtEGP(p.price),
                `<div class="row" style="gap:6px;justify-content:flex-end">
                  ${p.approvalStatus !== 'approved' ? `<button type="button" class="btn btn-ok btn-sm" data-a="mod-approve-item" data-type="product" data-id="${p.id}">اعتماد</button>` : ''}
                  ${p.approvalStatus !== 'rejected' ? `<button type="button" class="btn btn-er btn-sm" data-a="mod-reject-item-modal" data-type="product" data-id="${p.id}" data-name="${esc(p.name)}">رفض</button>` : ''}
                </div>`
              ])
            ) : '<p class="mu ctr" style="padding:18px">لا توجد منتجات في هذا القسم.</p>'}
          </div>
        </div>
        <div class="card">
          <h3 style="margin-bottom:12px">مراجعة الطلبات (${fmtNum(ords.length)})</h3>
          ${ords.length ? renderTable(
            ['رقم الطلب', 'المتجر', 'العميل', 'الإجمالي', 'الإجراء'],
            ords.map((o) => [
              `<b>#${o.no}</b>`,
              esc(o.storeName),
              esc(o.customer),
              fmtEGP(o.total),
              `<div class="row" style="gap:6px;justify-content:flex-end">
                ${o.approvalStatus !== 'approved' ? `<button type="button" class="btn btn-ok btn-sm" data-a="mod-approve-item" data-type="order" data-id="${o.id}">اعتماد</button>` : ''}
                ${o.approvalStatus !== 'rejected' ? `<button type="button" class="btn btn-er btn-sm" data-a="mod-reject-item-modal" data-type="order" data-id="${o.id}" data-name="طلب #${o.no}">رفض</button>` : ''}
              </div>`
            ])
          ) : '<p class="mu ctr" style="padding:18px">لا توجد طلبات في هذا القسم.</p>'}
        </div>
      `;
    };

    /* ========================================================================
       5. أحداث المالك والمشرفين (Action & Input Handlers)
       ======================================================================== */
    actions['owner-open-mod-modal'] = () => {
      openDialog('إضافة مشرف جديد', `
        <form data-submit="owner-create-mod" novalidate>
          <label for="om-name">اسم المشرف الكامل</label>
          <input id="om-name" required maxlength="80" placeholder="مثال: أ. محمود حسن">
          <label for="om-email">البريد الإلكتروني</label>
          <input id="om-email" type="email" dir="ltr" required placeholder="mod1@orderflow.eg">
          <label for="om-phone">رقم الموبايل</label>
          <input id="om-phone" dir="ltr" required placeholder="01012345678">
          <label for="om-pass">كلمة المرور (٨ أحرف على الأقل)</label>
          <input id="om-pass" type="password" autocomplete="new-password" required placeholder="••••••••">
          <div style="margin:12px 0">
            <label style="margin-bottom:8px">المهام والصلاحيات الممنوحة</label>
            <div class="rbac-perm-list">
              ${PERM_LABELS.map((p) => `
                <label class="rbac-perm-toggle">
                  <input type="checkbox" class="om-perm" value="${p.key}" ${p.key !== 'review_products_orders' ? 'checked' : ''}>
                  <span><b>${p.label}</b><small class="mu">${p.desc}</small></span>
                </label>
              `).join('')}
            </div>
          </div>
          <p id="om-err" class="er-tx" role="alert" style="min-height:20px;font-size:13px;font-weight:700"></p>
          <button type="submit" class="btn btn-ac" style="width:100%">إنشاء حساب المشرف</button>
        </form>
      `);
    };

    act('owner-create-mod', async () => {
      const err = document.querySelector('#om-err');
      if (err) err.textContent = '';
      const permissions = {};
      document.querySelectorAll('.om-perm').forEach((chk) => { permissions[chk.value] = chk.checked; });
      try {
        await api('POST', '/api/owner/moderators', {
          fullName: document.querySelector('#om-name')?.value.trim(),
          email: document.querySelector('#om-email')?.value.trim(),
          phone: document.querySelector('#om-phone')?.value.trim(),
          password: document.querySelector('#om-pass')?.value || '',
          permissions
        });
      } catch (e) {
        if (err) err.textContent = e.message;
        return;
      }
      closeDlg();
      showToast('تم إنشاء حساب المشرف بنجاح');
      renderApp(true);
    });

    actions['owner-edit-mod-modal'] = (el) => {
      openDialog(`تعديل بيانات المشرف: ${esc(el.dataset.name)}`, `
        <form data-submit="owner-save-mod-edit" novalidate>
          <input type="hidden" id="ome-id" value="${el.dataset.id}">
          <label for="ome-name">اسم المشرف الكامل</label>
          <input id="ome-name" value="${esc(el.dataset.name)}" maxlength="80">
          <label for="ome-email">البريد الإلكتروني</label>
          <input id="ome-email" dir="ltr" value="${esc(el.dataset.email)}">
          <label for="ome-phone">رقم الموبايل</label>
          <input id="ome-phone" dir="ltr" value="${esc(el.dataset.phone)}">
          <p id="ome-err" class="er-tx" role="alert" style="min-height:20px;font-size:13px;font-weight:700"></p>
          <button type="submit" class="btn btn-ac" style="width:100%">حفظ التعديلات</button>
        </form>
      `);
    };

    act('owner-save-mod-edit', async () => {
      const err = document.querySelector('#ome-err');
      if (err) err.textContent = '';
      const id = document.querySelector('#ome-id').value;
      try {
        await api('PUT', `/api/owner/moderators/${id}`, {
          fullName: document.querySelector('#ome-name')?.value.trim(),
          email: document.querySelector('#ome-email')?.value.trim(),
          phone: document.querySelector('#ome-phone')?.value.trim()
        });
      } catch (e) {
        if (err) err.textContent = e.message;
        return;
      }
      closeDlg();
      showToast('تم تحديث بيانات المشرف بنجاح');
      renderApp(true);
    });

    actions['owner-mod-password-modal'] = (el) => {
      openDialog(`تغيير كلمة مرور المشرف: ${esc(el.dataset.name)}`, `
        <form data-submit="owner-save-mod-pass" novalidate>
          <input type="hidden" id="omp-id" value="${el.dataset.id}">
          <p class="mu" style="font-size:13.5px;margin-bottom:12px">سيؤدي تغيير كلمة المرور إلى إبطال جميع جلسات المشرف الحالية فورًا.</p>
          <label for="omp-pass">كلمة المرور الجديدة (٨ أحرف على الأقل)</label>
          <input id="omp-pass" type="password" autocomplete="new-password" placeholder="••••••••">
          <p id="omp-err" class="er-tx" role="alert" style="min-height:20px;font-size:13px;font-weight:700"></p>
          <button type="submit" class="btn btn-ac" style="width:100%">حفظ كلمة المرور وإبطال الجلسات</button>
        </form>
      `);
    };

    act('owner-save-mod-pass', async () => {
      const err = document.querySelector('#omp-err');
      if (err) err.textContent = '';
      const id = document.querySelector('#omp-id').value;
      try {
        await api('POST', `/api/owner/moderators/${id}/password`, {
          password: document.querySelector('#omp-pass')?.value || ''
        });
      } catch (e) {
        if (err) err.textContent = e.message;
        return;
      }
      closeDlg();
      showToast('تم تغيير كلمة مرور المشرف وإبطال جلسته فورًا');
    });

    act('owner-toggle-mod-perm', async (el) => {
      const id = el.dataset.id;
      const perm = el.dataset.perm;
      await api('POST', `/api/owner/moderators/${id}/permissions`, {
        permissions: { [perm]: el.checked }
      });
      showToast('تم تحديث صلاحيات المشرف فورًا');
    });

    act('owner-toggle-mod-status', async (el) => {
      const id = el.dataset.id;
      const next = el.dataset.status === 'suspended' ? 'active' : 'suspended';
      await api('POST', `/api/owner/moderators/${id}/status`, { status: next });
      showToast(next === 'suspended' ? 'تم إيقاف المشرف وإبطال جلسته فورًا' : 'تمت إعادة تفعيل حساب المشرف');
      renderApp(true);
    });

    actions['owner-delete-mod'] = (el) => {
      openConfirmDialog(
        'حذف حساب المشرف نهائيًا',
        `هل أنت متأكد من حذف المشرف «${el.dataset.name}» نهائيًا؟ سيتم طرده من لوحة التحكم فورًا مع الاحتفاظ بسجل عملياته في سجل المراقبة.`,
        'حذف نهائي',
        true,
        async () => {
          await api('DELETE', `/api/owner/moderators/${el.dataset.id}`);
          closeDlg();
          showToast('تم حذف المشرف وإبطال جلسته فورًا');
          renderApp(true);
        }
      );
    };

    // --- Owner Client Actions ---
    let ownerClientTimer;
    inputs['owner-client-search'] = (el) => {
      rbacState.ownerClientQuery = el.value;
      clearTimeout(ownerClientTimer);
      ownerClientTimer = setTimeout(() => renderApp(true), 240);
    };
    actions['owner-client-status-flt'] = (el) => {
      rbacState.ownerClientStatus = el.dataset.v || 'all';
      renderApp(true);
    };

    act('owner-approve-client', async (el) => {
      await api('POST', `/api/owner/clients/${el.dataset.id}/approve`);
      showToast('تم قبول وتفعيل حساب العميل بنجاح');
      renderApp(true);
    });

    actions['owner-reject-client-modal'] = (el) => {
      openDialog(`رفض حساب العميل: ${esc(el.dataset.name || '')}`, `
        <form data-submit="owner-reject-client-submit" novalidate>
          <input type="hidden" id="orc-id" value="${el.dataset.id}">
          <label for="orc-reason">سبب الرفض (اختياري — يظهر للعميل عند محاولة الدخول)</label>
          <textarea id="orc-reason" rows="3" maxlength="300" placeholder="مثال: بيانات النشاط التجاري غير مكتملة"></textarea>
          <button type="submit" class="btn btn-er" style="width:100%">تأكيد رفض الحساب</button>
        </form>
      `);
    };

    act('owner-reject-client-submit', async () => {
      const id = document.querySelector('#orc-id').value;
      const reason = document.querySelector('#orc-reason')?.value.trim() || '';
      await api('POST', `/api/owner/clients/${id}/reject`, { reason });
      closeDlg();
      showToast('تم رفض حساب العميل وتوثيق السبب');
      renderApp(true);
    });

    act('owner-suspend-client', async (el) => {
      await api('POST', `/api/owner/clients/${el.dataset.id}/status`, { status: 'suspended' });
      showToast('تم حظر حساب العميل وإبطال جلساته');
      renderApp(true);
    });

    act('owner-impersonate', async (el) => {
      const r = await api('POST', `/api/owner/clients/${el.dataset.id}/impersonate`);
      ctx.setImpersonationToken(r.impersonationToken || r.token);
      await ctx.loadSession();
      showToast(`أنت تتصفح متجر «${r.client.storeName}» بوضع القراءة فقط`, 4000);
      ctx.go('#/dash');
    });

    act('owner-save-settings', async () => {
      await api('PUT', '/api/owner/settings', {
        platform_name: document.querySelector('#os-name')?.value.trim(),
        support_email: document.querySelector('#os-email')?.value.trim(),
        support_phone: document.querySelector('#os-phone')?.value.trim(),
        maintenance_notice: document.querySelector('#os-notice')?.value.trim(),
        registration_open: Boolean(document.querySelector('#os-reg-open')?.checked),
        require_client_approval: Boolean(document.querySelector('#os-req-approval')?.checked)
      });
      showToast('تم حفظ إعدادات المنصة بنجاح');
      renderApp(true);
    });

    inputs['owner-audit-role'] = (el) => { rbacState.ownerAuditRole = el.value; renderApp(true); };
    inputs['owner-audit-actor'] = (el) => { rbacState.ownerAuditActorId = el.value; renderApp(true); };
    inputs['owner-audit-action'] = (el) => { rbacState.ownerAuditAction = el.value; renderApp(true); };

    // --- Moderator Actions ---
    let modClientTimer;
    inputs['mod-client-search'] = (el) => {
      rbacState.modClientQuery = el.value;
      clearTimeout(modClientTimer);
      modClientTimer = setTimeout(() => renderApp(true), 240);
    };
    actions['mod-client-status-flt'] = (el) => {
      rbacState.modClientStatus = el.dataset.v || 'pending';
      renderApp(true);
    };
    actions['mod-appr-status-flt'] = (el) => {
      rbacState.modApprovalStatus = el.dataset.v || 'pending';
      renderApp(true);
    };

    act('mod-approve-client', async (el) => {
      await api('POST', `/api/moderator/clients/${el.dataset.id}/approve`);
      showToast('تم قبول وتفعيل حساب العميل بنجاح');
      renderApp(true);
    });

    actions['mod-reject-client-modal'] = (el) => {
      openDialog(`رفض حساب العميل: ${esc(el.dataset.name || '')}`, `
        <form data-submit="mod-reject-client-submit" novalidate>
          <input type="hidden" id="mrc-id" value="${el.dataset.id}">
          <label for="mrc-reason">سبب الرفض (اختياري)</label>
          <textarea id="mrc-reason" rows="3" maxlength="300" placeholder="اكتب سبب الرفض ليظهر للعميل..."></textarea>
          <button type="submit" class="btn btn-er" style="width:100%">تأكيد رفض الحساب</button>
        </form>
      `);
    };

    act('mod-reject-client-submit', async () => {
      const id = document.querySelector('#mrc-id').value;
      const reason = document.querySelector('#mrc-reason')?.value.trim() || '';
      await api('POST', `/api/moderator/clients/${id}/reject`, { reason });
      closeDlg();
      showToast('تم رفض الحساب وتسجيل القرار في سجل المراقبة');
      renderApp(true);
    });

    act('mod-approve-item', async (el) => {
      await api('POST', `/api/moderator/approvals/${el.dataset.type}/${el.dataset.id}/approve`);
      showToast('تم اعتماد العنصر بنجاح');
      renderApp(true);
    });

    actions['mod-reject-item-modal'] = (el) => {
      openDialog(`رفض: ${esc(el.dataset.name || '')}`, `
        <form data-submit="mod-reject-item-submit" novalidate>
          <input type="hidden" id="mri-type" value="${esc(el.dataset.type)}">
          <input type="hidden" id="mri-id" value="${el.dataset.id}">
          <label for="mri-reason">سبب الرفض (إلزامي)</label>
          <input id="mri-reason" placeholder="اكتب سبب الرفض بوضوح">
          <p id="mri-err" class="er-tx" role="alert" style="min-height:20px;font-size:13px;font-weight:700"></p>
          <button type="submit" class="btn btn-er" style="width:100%">تأكيد الرفض</button>
        </form>
      `);
    };

    act('mod-reject-item-submit', async () => {
      const reason = document.querySelector('#mri-reason')?.value.trim() || '';
      const err = document.querySelector('#mri-err');
      if (!reason) { if (err) err.textContent = 'سبب الرفض مطلوب'; return; }
      await api('POST', `/api/moderator/approvals/${document.querySelector('#mri-type').value}/${document.querySelector('#mri-id').value}/reject`, { reason });
      closeDlg();
      showToast('تم رفض العنصر');
      renderApp(true);
    });
  }

  global.OrderFlowRBAC = {
    rbacState,
    OWNER_NAV,
    renderOwnerShell,
    renderModeratorShell,
    registerRbacViews
  };
})(window);
