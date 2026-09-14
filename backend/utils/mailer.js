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

/**
 * Sends instant Booking Confirmation Email with embedded QR and attached PDF Ticket.
 * @param {Object} params
 * @param {Object} params.booking
 * @param {Object} params.event
 * @param {Object} params.user
 */
async function sendBookingConfirmationEmail({ booking, event, user }) {
  const { generateTicketPdf } = require('./ticketPdf');
  const QRCode = require('qrcode');

  const recipientEmail = user?.email || booking?.paymentDetails?.email;
  const attendeeName   = user?.name || booking?.paymentDetails?.attendee || 'Valued Attendee';

  if (!recipientEmail) {
    console.warn('[MAIL WARNING] No recipient email provided for booking confirmation.');
    return { sent: false, reason: 'No recipient email' };
  }

  const transporter = getTransporter();

  // Generate official PDF buffer
  let pdfBuffer = null;
  try {
    pdfBuffer = await generateTicketPdf({ booking, event, user });
  } catch (pdfErr) {
    console.error('[PDF GENERATION ERROR]', pdfErr.message);
  }

  // Generate inline QR Code data URI for HTML email
  let qrDataUri = '';
  try {
    const qrPayload = JSON.stringify({
      bookingId: booking.bookingId,
      eventId: event?._id,
      tickets: booking.quantity,
      attendee: attendeeName,
      status: 'VALID'
    });
    qrDataUri = await QRCode.toDataURL(qrPayload, { width: 180, margin: 1 });
  } catch (qrErr) {
    console.error('[QR GENERATION ERROR]', qrErr.message);
  }

  const eventDateStr = event?.date
    ? new Date(event.date).toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
      })
    : 'See Event Page';

  const amountStr = `₹${Number(booking.totalAmount || 0).toLocaleString('en-IN')}`;

  const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #0b0f19; margin: 0; padding: 20px; color: #f1f5f9; }
      .container { max-width: 620px; margin: 0 auto; background: #111827; border-radius: 16px; overflow: hidden; border: 1px solid #1f2937; box-shadow: 0 15px 35px rgba(0,0,0,0.5); }
      .header { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 32px 24px; text-align: center; }
      .header h1 { margin: 0; font-size: 24px; color: #ffffff; font-weight: 800; letter-spacing: -0.5px; }
      .header p { margin: 8px 0 0; font-size: 14px; color: #dbeafe; }
      .content { padding: 28px 24px; }
      .success-badge { display: inline-flex; align-items: center; background: #166534; color: #bbf7d0; font-size: 12px; font-weight: 800; padding: 5px 12px; border-radius: 20px; text-transform: uppercase; margin-bottom: 18px; letter-spacing: 0.5px; }
      .event-card { background: #1f2937; border-radius: 12px; padding: 20px; margin-bottom: 24px; border: 1px solid #374151; }
      .event-title { margin: 0 0 6px; font-size: 20px; font-weight: 800; color: #ffffff; }
      .event-meta { font-size: 13px; color: #9ca3af; margin-bottom: 16px; }
      .grid-table { width: 100%; border-collapse: collapse; margin-top: 12px; border-top: 1px solid #374151; }
      .grid-table td { padding: 10px 0; font-size: 13px; }
      .grid-table td.lbl { color: #9ca3af; font-weight: 600; width: 40%; }
      .grid-table td.val { color: #f3f4f6; font-weight: 700; text-align: right; width: 60%; }
      .grid-table td.total { font-size: 16px; color: #4ade80; }
      .qr-section { background: #1f2937; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px; border: 1px dashed #4b5563; }
      .qr-img { background: #ffffff; padding: 10px; border-radius: 12px; display: inline-block; margin-bottom: 12px; }
      .qr-hint { font-size: 12px; color: #9ca3af; margin: 0; }
      .qr-code-text { font-size: 14px; font-weight: 800; color: #f87171; letter-spacing: 1px; margin-bottom: 6px; }
      .btn-wrap { text-align: center; margin: 24px 0 10px; }
      .btn { display: inline-block; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: #ffffff !important; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 800; font-size: 15px; box-shadow: 0 6px 20px rgba(239,68,68,0.4); }
      .footer { background: #0b0f19; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #1f2937; line-height: 1.5; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>🎪 EventHub Ticket Confirmation</h1>
        <p>Your booking is confirmed! See you at the event.</p>
      </div>
      <div class="content">
        <span class="success-badge">✓ Payment Received &amp; Verified</span>
        <p style="margin: 0 0 18px; font-size: 15px; color: #e2e8f0;">Hello <strong>${attendeeName}</strong>, thank you for booking through EventHub. Your digital entry pass is ready!</p>

        <div class="event-card">
          <div class="event-title">${event?.title || 'Event Booking'}</div>
          <div class="event-meta">${(event?.category || 'Live Event').toUpperCase()} &bull; ${event?.location || 'Venue'}</div>
          <table class="grid-table">
            <tr>
              <td class="lbl">Date &amp; Time</td>
              <td class="val">${eventDateStr}</td>
            </tr>
            <tr>
              <td class="lbl">Venue Location</td>
              <td class="val">${event?.location || 'Main Venue'}</td>
            </tr>
            <tr>
              <td class="lbl">Tickets Admitted</td>
              <td class="val">${booking.quantity} Ticket${booking.quantity > 1 ? 's' : ''}</td>
            </tr>
            <tr>
              <td class="lbl">Booking Reference</td>
              <td class="val" style="color: #f87171; font-family: monospace;">#${booking.bookingId}</td>
            </tr>
            <tr>
              <td class="lbl">Payment Method</td>
              <td class="val">${booking.paymentMethod || 'Razorpay Direct'}</td>
            </tr>
            <tr>
              <td class="lbl">Transaction Reference</td>
              <td class="val" style="font-family: monospace;">${booking.razorpayPaymentId || 'N/A'}</td>
            </tr>
            <tr>
              <td class="lbl" style="font-size: 15px; color: #ffffff;">Total Amount Paid</td>
              <td class="val total">${amountStr}</td>
            </tr>
          </table>
        </div>

        ${qrDataUri ? `
        <div class="qr-section">
          <div class="qr-code-text">ADMISSION PASS: #${booking.bookingId}</div>
          <div class="qr-img">
            <img src="${qrDataUri}" alt="Ticket QR Code" width="160" height="160" style="display: block;" />
          </div>
          <p class="qr-hint">Scan this QR code at the venue gate for admission. A printable PDF ticket is also attached to this email.</p>
        </div>` : ''}

        <div class="btn-wrap">
          <a href="http://localhost:4200/bookings" class="btn">View Booking &amp; Download Pass &rarr;</a>
        </div>
      </div>
      <div class="footer">
        EventHub Ticketing System &bull; Attached: Official PDF Admission Pass<br>
        Need help? Contact support anytime at ${ADMIN_NOTIFICATION_EMAIL}
      </div>
    </div>
  </body>
  </html>
  `;

  if (!transporter) {
    console.log(`[MAIL MOCK] Booking confirmation email logged for ${recipientEmail} (Booking #${booking.bookingId})`);
    return { sent: false, reason: 'No live SMTP configured' };
  }

  try {
    const mailOptions = {
      from: `"EventHub Tickets" <${process.env.SMTP_USER || process.env.EMAIL_USER}>`,
      to: recipientEmail,
      subject: `🎟️ Booking Confirmed: ${event?.title || 'Event'} (Pass #${booking.bookingId})`,
      html: htmlContent,
      attachments: []
    };

    if (pdfBuffer) {
      mailOptions.attachments.push({
        filename: `EventHub-Ticket-${booking.bookingId}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      });
    }

    const info = await transporter.sendMail(mailOptions);
    console.log(`[BOOKING MAIL SUCCESS] Sent to ${recipientEmail} (${info.messageId}) with PDF ticket.`);
    return { sent: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[BOOKING MAIL ERROR] Failed to send to ${recipientEmail}:`, error.message);
    return { sent: false, error: error.message };
  }
}

/**
 * Sends event reminder email 1 day prior to the scheduled event.
 * @param {Object} params
 * @param {Object} params.booking
 * @param {Object} params.event
 * @param {Object} params.user
 */
async function sendEventReminderEmail({ booking, event, user }) {
  const { generateTicketPdf } = require('./ticketPdf');
  const QRCode = require('qrcode');

  const recipientEmail = user?.email || booking?.paymentDetails?.email;
  const attendeeName   = user?.name || booking?.paymentDetails?.attendee || 'Attendee';

  if (!recipientEmail) return { sent: false, reason: 'No recipient email' };

  const transporter = getTransporter();

  // Generate PDF buffer
  let pdfBuffer = null;
  try {
    pdfBuffer = await generateTicketPdf({ booking, event, user });
  } catch (e) {}

  // Generate inline QR Code
  let qrDataUri = '';
  try {
    const qrPayload = JSON.stringify({
      bookingId: booking.bookingId,
      eventId: event?._id,
      tickets: booking.quantity,
      attendee: attendeeName,
      status: 'VALID'
    });
    qrDataUri = await QRCode.toDataURL(qrPayload, { width: 170, margin: 1 });
  } catch (e) {}

  const eventDateStr = event?.date
    ? new Date(event.date).toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
      })
    : 'Tomorrow';

  const htmlContent = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0b0f19; margin: 0; padding: 20px; color: #f1f5f9; }
      .container { max-width: 620px; margin: 0 auto; background: #111827; border-radius: 16px; overflow: hidden; border: 1px solid #1f2937; }
      .header { background: linear-gradient(135deg, #b91c1c 0%, #ef4444 100%); padding: 32px 24px; text-align: center; }
      .header h1 { margin: 0; font-size: 24px; color: #ffffff; font-weight: 800; }
      .header p { margin: 8px 0 0; font-size: 14px; color: #fee2e2; }
      .content { padding: 28px 24px; }
      .card { background: #1f2937; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
      .qr-box { background: #1f2937; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 20px; }
      .btn { display: inline-block; background: #ef4444; color: #ffffff !important; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 800; }
      .footer { background: #0b0f19; padding: 18px; text-align: center; font-size: 12px; color: #6b7280; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>⏰ Tomorrow: ${event?.title || 'Your Event'}</h1>
        <p>Here is your 24-hour reminder &amp; digital admission pass</p>
      </div>
      <div class="content">
        <p style="font-size: 15px;">Hello <strong>${attendeeName}</strong>, your scheduled event is happening tomorrow! Please find your entry pass details below:</p>
        <div class="card">
          <h3 style="margin: 0 0 8px; color: #ffffff;">${event?.title}</h3>
          <p style="margin: 0 0 12px; font-size: 13px; color: #9ca3af;">📍 <strong>Venue:</strong> ${event?.location || 'See Event Details'}</p>
          <p style="margin: 0 0 12px; font-size: 13px; color: #9ca3af;">📅 <strong>Date &amp; Time:</strong> ${eventDateStr}</p>
          <p style="margin: 0; font-size: 13px; color: #9ca3af;">🎟️ <strong>Admission:</strong> ${booking.quantity} Person${booking.quantity > 1 ? 's' : ''} &bull; Pass #${booking.bookingId}</p>
        </div>

        ${qrDataUri ? `
        <div class="qr-box">
          <p style="font-weight: 700; color: #f87171; margin: 0 0 10px;">GATE ENTRY PASS</p>
          <img src="${qrDataUri}" alt="Entry QR Pass" width="160" height="160" style="background:#fff; padding:8px; border-radius:8px;" />
          <p style="font-size: 12px; color: #9ca3af; margin: 10px 0 0;">Present this QR code or the attached PDF ticket at the entrance gate.</p>
        </div>` : ''}

        <div style="text-align: center; margin: 20px 0;">
          <a href="http://localhost:4200/bookings" class="btn">View Booking in Portal &rarr;</a>
        </div>
      </div>
      <div class="footer">
        EventHub Reminders &bull; Questions? Email us at ${ADMIN_NOTIFICATION_EMAIL}
      </div>
    </div>
  </body>
  </html>
  `;

  if (!transporter) {
    console.log(`[REMINDER MOCK] Sent reminder to ${recipientEmail} for event ${event?.title}`);
    return { sent: false, reason: 'No SMTP configured' };
  }

  try {
    const mailOptions = {
      from: `"EventHub Reminders" <${process.env.SMTP_USER || process.env.EMAIL_USER}>`,
      to: recipientEmail,
      subject: `⏰ Tomorrow: Reminder for ${event?.title || 'Event'} (Pass #${booking.bookingId})`,
      html: htmlContent,
      attachments: []
    };

    if (pdfBuffer) {
      mailOptions.attachments.push({
        filename: `EventHub-Ticket-${booking.bookingId}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      });
    }

    const info = await transporter.sendMail(mailOptions);
    console.log(`[REMINDER MAIL SUCCESS] Sent to ${recipientEmail} (${info.messageId})`);
    return { sent: true, messageId: info.messageId };
  } catch (err) {
    console.error(`[REMINDER MAIL ERROR] Failed to send to ${recipientEmail}:`, err.message);
    return { sent: false, error: err.message };
  }
}

module.exports = {
  ADMIN_NOTIFICATION_EMAIL,
  sendContactNotificationEmail,
  sendBookingConfirmationEmail,
  sendEventReminderEmail
};
