const nodemailer = require('nodemailer');

const ADMIN_NOTIFICATION_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || 'gondaliyakishan839@gmail.com';

/**
 * Creates nodemailer transporter based on environment variables.
 * Supports:
 * - SMTP_USER / SMTP_PASS (with optional SMTP_HOST, SMTP_PORT)
 * - EMAIL_USER / EMAIL_PASS (defaults to Gmail)
 */
function getTransporter() {
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;

  if (!user || !pass) {
    return null;
  }

  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user, pass }
    });
  }

  // Default: Gmail service
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass }
  });
}

/**
 * Sends notification email to the administrator when a new contact inquiry / query arrives.
 * @param {Object} queryData
 * @param {string} queryData.name
 * @param {string} queryData.email
 * @param {string} [queryData.phone]
 * @param {string} [queryData.subject]
 * @param {string} queryData.message
 * @param {string} [queryData.category]
 */
async function sendContactNotificationEmail(queryData) {
  const {
    name,
    email,
    phone = 'N/A',
    subject = 'General Contact Inquiry',
    message,
    category = 'Contact Us'
  } = queryData;

  const transporter = getTransporter();
  const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #0f172a; margin: 0; padding: 24px; color: #f8fafc; }
      .email-container { max-width: 600px; margin: 0 auto; background: #1e293b; border-radius: 12px; overflow: hidden; border: 1px solid #334155; box-shadow: 0 10px 25px rgba(0,0,0,0.4); }
      .header { background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); padding: 28px 24px; text-align: center; }
      .header h1 { margin: 0; font-size: 24px; color: #ffffff; font-weight: 800; letter-spacing: -0.5px; }
      .header p { margin: 6px 0 0 0; font-size: 14px; color: rgba(255,255,255,0.85); }
      .body { padding: 28px 24px; }
      .badge-new { display: inline-block; background: #f59e0b; color: #0f172a; font-size: 12px; font-weight: 800; padding: 4px 10px; border-radius: 20px; text-transform: uppercase; margin-bottom: 16px; }
      .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
      .meta-table td { padding: 10px 12px; border-bottom: 1px solid #334155; font-size: 14px; }
      .meta-table td.label { width: 30%; color: #94a3b8; font-weight: 600; }
      .meta-table td.value { width: 70%; color: #ffffff; font-weight: 500; }
      .message-title { font-size: 14px; font-weight: 700; color: #cbd5e1; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
      .message-box { background: #0f172a; border-left: 4px solid #6366f1; padding: 16px; border-radius: 6px; font-size: 15px; line-height: 1.6; color: #e2e8f0; white-space: pre-wrap; word-break: break-word; }
      .cta-wrap { text-align: center; margin-top: 32px; }
      .cta-btn { display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 700; font-size: 14px; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4); }
      .footer { background: #0f172a; padding: 18px 24px; text-align: center; border-top: 1px solid #1e293b; font-size: 12px; color: #64748b; }
    </style>
  </head>
  <body>
    <div class="email-container">
      <div class="header">
        <h1>🎪 EventHub Admin Notification</h1>
        <p>New customer inquiry received via Contact Us</p>
      </div>
      <div class="body">
        <span class="badge-new">New Message</span>
        <table class="meta-table">
          <tr>
            <td class="label">Sender Name</td>
            <td class="value"><strong>${name}</strong></td>
          </tr>
          <tr>
            <td class="label">Sender Email</td>
            <td class="value"><a href="mailto:${email}" style="color: #818cf8; text-decoration: none;">${email}</a></td>
          </tr>
          <tr>
            <td class="label">Phone Number</td>
            <td class="value">${phone}</td>
          </tr>
          <tr>
            <td class="label">Subject</td>
            <td class="value"><strong>${subject}</strong></td>
          </tr>
          <tr>
            <td class="label">Category</td>
            <td class="value">${category}</td>
          </tr>
          <tr>
            <td class="label">Received At</td>
            <td class="value">${timestamp} (IST)</td>
          </tr>
        </table>

        <div class="message-title">Inquiry Message</div>
        <div class="message-box">${message}</div>

        <div class="cta-wrap">
          <a href="http://localhost:4200/admin/queries" class="cta-btn">View in Admin Panel &rarr;</a>
        </div>
      </div>
      <div class="footer">
        EventHub Platform &bull; Automated notification delivered to ${ADMIN_NOTIFICATION_EMAIL}
      </div>
    </div>
  </body>
  </html>
  `;

  if (!transporter) {
    console.log(`\n======================================================`);
    console.log(`[MAIL NOTIFICATION] Target Admin: ${ADMIN_NOTIFICATION_EMAIL}`);
    console.log(`[FROM] ${name} <${email}> | Phone: ${phone}`);
    console.log(`[SUBJECT] ${subject}`);
    console.log(`[MESSAGE] ${message}`);
    console.log(`[NOTE] Set EMAIL_USER & EMAIL_PASS in backend/.env to send via live Gmail SMTP.`);
    console.log(`======================================================\n`);
    return { sent: false, reason: 'No SMTP credentials configured. Notification logged to console.' };
  }

  try {
    const info = await transporter.sendMail({
      from: `"EventHub Support" <${process.env.SMTP_USER || process.env.EMAIL_USER}>`,
      to: ADMIN_NOTIFICATION_EMAIL,
      replyTo: email,
      subject: `[EventHub Inquiry] ${subject} - from ${name}`,
      html: htmlContent
    });
    console.log(`[MAIL SUCCESS] Message sent to ${ADMIN_NOTIFICATION_EMAIL}: ${info.messageId}`);
    return { sent: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[MAIL ERROR] Failed to send email to ${ADMIN_NOTIFICATION_EMAIL}:`, error.message);
    return { sent: false, error: error.message };
  }
}

module.exports = {
  ADMIN_NOTIFICATION_EMAIL,
  sendContactNotificationEmail
};
