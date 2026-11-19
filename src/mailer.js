'use strict';
// مرسل بريد/رسائل قابل للتوصيل: يطبع في الطرفية أثناء التطوير ويحفظ آخر الرسائل في الذاكرة للاختبارات

function createMailer(cfg = {}) {
  const sent = [];

  async function send({ to, subject, text, token, url, type }) {
    const entry = {
      to: String(to || ''),
      subject: String(subject || ''),
      text: String(text || ''),
      token: token || null,
      url: url || null,
      type: type || 'general',
      sentAt: new Date().toISOString()
    };
    sent.push(entry);
    if (sent.length > 200) sent.shift();

    if (typeof cfg.mailTransport === 'function') {
      await cfg.mailTransport(entry);
      return entry;
    }

    if (!cfg.production) {
      console.log(`[mailer] To: ${entry.to} | Subject: ${entry.subject}${entry.token ? ` | Token: ${entry.token}` : ''}${entry.url ? ` | URL: ${entry.url}` : ''}`);
    }
    return entry;
  }

  return {
    send,
    sent,
    last: () => sent.at(-1) || null,
    clear: () => { sent.length = 0; }
  };
}

module.exports = { createMailer };
