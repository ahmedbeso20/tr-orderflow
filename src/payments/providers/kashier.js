'use strict';
// مزوّد بوابة كاشير الخارجية (Kashier Egypt Hosted Payment Page)
// يحوّل التاجر مباشرةً إلى صفحة الدفع المستضافة لدى كاشير (محفظة إلكترونية / بوابة كاشير)
// بدون جمع أي بيانات بطاقة أو فيزا داخل خوادم OrderFlow، ويؤكّد الدفع عبر توقيع HMAC-SHA256.
const crypto = require('node:crypto');
const { HttpError } = require('../../util');

const PAID_STATUS = new Set(['SUCCESS', 'CAPTURED', 'PAID', 'APPROVED']);
const FAILED_STATUS = new Set(['FAILURE', 'FAILED', 'DECLINED', 'REJECTED', 'ERROR']);
const CANCELLED_STATUS = new Set(['CANCELLED', 'CANCELED', 'EXPIRED', 'VOIDED']);

/**
 * توليد توقيع Kashier HPP الرسمي:
 * HMAC-SHA256 على "/?payment=<merchantId>.<orderId>.<amount>.<currency>" باستخدام Payment API Key
 */
function buildKashierOrderHash({ merchantId, orderId, amount, currency, apiKey }) {
  const path = `/?payment=${merchantId}.${orderId}.${amount}.${currency}`;
  return crypto.createHmac('sha256', String(apiKey)).update(path).digest('hex');
}

/**
 * التحقق من توقيع Webhook القادم من Kashier بزمن ثابت (timingSafeEqual)
 */
function verifyKashierWebhookSignature({ payload, signature, apiKey }) {
  if (!apiKey || !signature || !payload || typeof payload !== 'object') return false;
  const data = payload.data && typeof payload.data === 'object' ? payload.data : payload;
  const keys = Array.isArray(data.signatureKeys) ? [...data.signatureKeys].sort() : [];
  if (!keys.length) return false;

  const queryString = keys
    .map((k) => `${k}=${data[k] === undefined || data[k] === null ? '' : data[k]}`)
    .join('&');

  const expected = crypto.createHmac('sha256', String(apiKey)).update(queryString).digest('hex');
  const given = String(signature).trim();
  const a = Buffer.from(given, 'utf8');
  const b = Buffer.from(expected, 'utf8');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/**
 * بناء رابط صفحة الدفع الخارجية المستضافة لدى كاشير
 */
function buildKashierCheckoutUrl({
  merchantId,
  apiKey,
  orderId,
  amount,
  currency = 'EGP',
  mode = 'test',
  allowedMethods = 'wallet',
  merchantRedirect,
  serverWebhook
}) {
  const amountStr = Number(amount).toFixed(2);
  const curr = String(currency || 'EGP').toUpperCase();
  const hash = buildKashierOrderHash({ merchantId, orderId, amount: amountStr, currency: curr, apiKey });
  const params = new URLSearchParams({
    merchantId: String(merchantId),
    orderId: String(orderId),
    amount: amountStr,
    currency: curr,
    hash,
    mode: mode === 'live' ? 'live' : 'test',
    display: 'ar',
    allowedMethods: String(allowedMethods || 'wallet')
  });
  if (merchantRedirect) params.set('merchantRedirect', merchantRedirect);
  if (serverWebhook) params.set('serverWebhook', serverWebhook);
  return `https://checkout.kashier.io/?${params.toString()}`;
}

module.exports = function createKashier(cfg) {
  const c = cfg.payments;

  return {
    id: 'kashier',
    name: 'بوابة كاشير (Kashier)',
    mode: 'live',
    collectsCardData: false,
    methods: ['kashier', 'wallet'],

    validate() {
      return { payerInfo: 'بوابة كاشير الخارجية (Kashier)' };
    },

    async createCharge({ payment, method, returnUrl, webhookUrl }) {
      const merchantId = c.kashierMerchantId;
      const apiKey = c.kashierApiKey;
      if (!merchantId || !apiKey) {
        throw new HttpError(503, 'بوابة كاشير غير مُهيّأة بعد (أضف KASHIER_MERCHANT_ID و KASHIER_API_KEY في متغيرات البيئة).');
      }
      const allowedMethods = method === 'wallet' ? 'wallet' : (c.kashierAllowedMethods || 'wallet');
      const redirectUrl = buildKashierCheckoutUrl({
        merchantId,
        apiKey,
        orderId: payment.tx_ref,
        amount: payment.amount,
        currency: payment.currency || 'EGP',
        mode: c.kashierMode || 'test',
        allowedMethods,
        merchantRedirect: returnUrl,
        serverWebhook: webhookUrl
      });
      return {
        status: 'pending',
        providerRef: payment.tx_ref,
        redirectUrl
      };
    },

    parseWebhook({ rawBody, headers }) {
      const sig = headers['x-kashier-signature'] || headers['x-signature'] || '';
      let payload;
      try {
        payload = JSON.parse(rawBody.toString('utf8'));
      } catch {
        throw new HttpError(400, 'صيغة خطاف كاشير غير صالحة');
      }
      const secret = c.webhookSecret || c.kashierApiKey;
      if (!verifyKashierWebhookSignature({ payload, signature: sig, apiKey: secret })) {
        throw new HttpError(401, 'توقيع خطاف كاشير غير صالح');
      }
      const data = payload.data && typeof payload.data === 'object' ? payload.data : payload;
      const rawStatus = String(data.status || data.paymentStatus || '').toUpperCase();
      const status = PAID_STATUS.has(rawStatus)
        ? 'paid'
        : FAILED_STATUS.has(rawStatus)
          ? 'failed'
          : CANCELLED_STATUS.has(rawStatus)
            ? 'cancelled'
            : 'ignore';
      return {
        eventId: String(data.transactionId || data.kashierOrderId || payload.event || ''),
        txRef: String(data.merchantOrderId || data.orderId || ''),
        providerRef: String(data.kashierOrderId || data.transactionId || ''),
        status,
        amount: Number(data.amount),
        currency: String(data.currency || 'EGP').toUpperCase()
      };
    }
  };
};

module.exports.buildKashierOrderHash = buildKashierOrderHash;
module.exports.verifyKashierWebhookSignature = verifyKashierWebhookSignature;
module.exports.buildKashierCheckoutUrl = buildKashierCheckoutUrl;
