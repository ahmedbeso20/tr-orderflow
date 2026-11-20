'use strict';
const { HttpError } = require('./util');

const ROLES = Object.freeze({
  OWNER: 'owner',
  MODERATOR: 'moderator',
  CLIENT: 'client'
});

const CLIENT_STATUSES = Object.freeze(['pending', 'active', 'rejected', 'suspended']);
const MODERATOR_STATUSES = Object.freeze(['active', 'suspended']);

const MAX_OWNERS = 1;
const MAX_MODERATORS = 3;

const MODERATOR_PERMISSION_META = Object.freeze([
  {
    key: 'view_pending_clients',
    label: 'عرض طلبات العملاء الجدد',
    desc: 'الاطلاع على قائمة الحسابات المسجّلة حديثًا وبانتظار التفعيل'
  },
  {
    key: 'approve_clients',
    label: 'قبول وتفعيل حسابات العملاء',
    desc: 'تحويل حالة حساب العميل من قيد المراجعة إلى نشط للسماح له بالدخول'
  },
  {
    key: 'reject_clients',
    label: 'رفض حسابات العملاء',
    desc: 'رفض طلب تسجيل العميل مع إمكانية كتابة سبب الرفض'
  },
  {
    key: 'review_products_orders',
    label: 'مراجعة المنتجات والطلبات',
    desc: 'اعتماد أو رفض المنتجات والطلبات المعلّقة في طابور المراجعة'
  }
]);

const PERMISSION_KEYS = Object.freeze(MODERATOR_PERMISSION_META.map((p) => p.key));

const DEFAULT_MODERATOR_PERMISSIONS = Object.freeze({
  view_pending_clients: true,
  approve_clients: true,
  reject_clients: true,
  review_products_orders: false
});

function normalizePermissions(raw, fallback = DEFAULT_MODERATOR_PERMISSIONS) {
  let obj = raw;
  if (typeof raw === 'string') {
    try { obj = JSON.parse(raw); } catch { obj = {}; }
  }
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) obj = {};
  const out = {};
  for (const key of PERMISSION_KEYS) {
    if (key in obj) out[key] = Boolean(obj[key]);
    else out[key] = Boolean(fallback[key]);
  }
  return out;
}

function hasPermission(user, permKey) {
  if (!user || user.status !== 'active' || user._readOnly) return false;
  if (user.role === ROLES.OWNER) return true;
  if (user.role !== ROLES.MODERATOR) return false;
  const perms = normalizePermissions(user.permissions);
  return Boolean(perms[permKey]);
}

function getLoginRedirect(user) {
  if (!user) return '#/';
  if (user.role === ROLES.OWNER) return '#/owner';
  if (user.role === ROLES.MODERATOR) return '#/moderator';
  return '#/dash';
}

function checkLoginStatus(user) {
  if (!user) {
    return { allowed: false, status: 401, code: 'BAD_LOGIN', message: 'بيانات الدخول غير صحيحة' };
  }
  if (user.status === 'pending') {
    return {
      allowed: false,
      status: 403,
      code: 'PENDING_APPROVAL',
      message: 'حسابك قيد المراجعة من قِبل الإدارة حاليًا. ستتمكن من تسجيل الدخول فور الموافقة عليه وتفعيله.'
    };
  }
  if (user.status === 'rejected') {
    const reason = String(user.reject_reason || '').trim();
    return {
      allowed: false,
      status: 403,
      code: 'REJECTED',
      reason,
      message: reason
        ? `تم رفض طلب تفعيل حسابك من قِبل الإدارة. السبب: ${reason}`
        : 'تم رفض طلب تفعيل حسابك من قِبل الإدارة.'
    };
  }
  if (user.status === 'suspended') {
    return {
      allowed: false,
      status: 403,
      code: 'SUSPENDED',
      message: 'تم إيقاف هذا الحساب من قِبل الإدارة. تواصل مع الدعم الفني للمساعدة.'
    };
  }
  if (user.status !== 'active') {
    return {
      allowed: false,
      status: 403,
      code: 'INACTIVE',
      message: 'الحساب غير نشط حاليًا.'
    };
  }
  return { allowed: true, status: 200, code: 'OK', message: '' };
}

/**
 * يتحقق مما إذا كان المسار المباشر في شريط العنوان ينتمي لإحدى لوحات التحكم المحمية
 * ويعيد الدور المطلوب ('owner' أو 'moderator') أو null للمسارات العامة.
 */
function requiredRoleForPath(pathname) {
  const clean = String(pathname || '/').replace(/\/+$/, '') || '/';
  if (clean === '/owner' || clean.startsWith('/owner/')) return ROLES.OWNER;
  if (clean === '/admin' || clean.startsWith('/admin/')) return ROLES.OWNER;
  if (clean === '/moderator' || clean.startsWith('/moderator/')) return ROLES.MODERATOR;
  return null;
}

function canAccessPanel(user, requiredRole) {
  if (!requiredRole) return true;
  if (!user || user.status !== 'active' || user._readOnly) return false;
  return user.role === requiredRole;
}

function assertModeratorLimit(currentCount, max = MAX_MODERATORS) {
  if (Number(currentCount) >= max) {
    throw new HttpError(
      409,
      `لا يمكن إنشاء أكثر من ${max} حسابات مشرفين في النظام. احذف أحد المشرفين الحاليين لإضافة مشرف جديد.`,
      { code: 'MODERATOR_LIMIT_REACHED', max }
    );
  }
}

function assertActiveModeratorLimit(activeCount, max = MAX_MODERATORS) {
  if (Number(activeCount) >= max) {
    throw new HttpError(
      409,
      `الحد الأقصى هو ${max} حسابات مشرفين نشطة فقط.`,
      { code: 'MODERATOR_LIMIT_REACHED', max }
    );
  }
}

function assertNotOwnerTarget(targetUser) {
  if (targetUser && targetUser.role === ROLES.OWNER) {
    throw new HttpError(404, 'المستخدم غير موجود');
  }
}

module.exports = {
  ROLES,
  CLIENT_STATUSES,
  MODERATOR_STATUSES,
  MAX_OWNERS,
  MAX_MODERATORS,
  MODERATOR_PERMISSION_META,
  PERMISSION_KEYS,
  DEFAULT_MODERATOR_PERMISSIONS,
  normalizePermissions,
  hasPermission,
  getLoginRedirect,
  checkLoginStatus,
  requiredRoleForPath,
  canAccessPanel,
  assertModeratorLimit,
  assertActiveModeratorLimit,
  assertNotOwnerTarget
};
