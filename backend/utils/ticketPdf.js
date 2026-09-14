const PDFDocument = require('pdfkit');
const QRCode      = require('qrcode');

/**
 * Generates an official PDF Ticket Pass buffer for a booking.
 * @param {Object} params
 * @param {Object} params.booking
 * @param {Object} params.event
 * @param {Object} params.user
 * @returns {Promise<Buffer>}
 */
async function generateTicketPdf({ booking, event, user }) {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        info: {
          Title: `EventHub Ticket - ${event?.title || 'Event'}`,
          Author: 'EventHub Ticketing System',
          Subject: `Admission Pass #${booking.bookingId}`
        }
      });

      const buffers = [];
      doc.on('data', chunk => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', err => reject(err));

      const primaryColor   = '#1e293b';
      const accentColor    = '#ef4444';
      const textLightColor = '#64748b';
      const darkColor      = '#0f172a';

      // ── OUTER TICKET CONTAINER ──
      doc.roundedRect(40, 40, 515, 760, 16)
         .lineWidth(2)
         .strokeColor('#e2e8f0')
         .stroke();

      // ── HEADER BANNER ──
      doc.roundedRect(40, 40, 515, 90, 16)
         .fill(primaryColor);
      // Square off bottom corners of header
      doc.rect(40, 90, 515, 40)
         .fill(primaryColor);

      // Logo & Brand
      doc.fillColor('#ffffff')
         .fontSize(22)
         .font('Helvetica-Bold')
         .text('🎪 EVENTHUB', 65, 60);

      doc.fillColor('#94a3b8')
         .fontSize(10)
         .font('Helvetica')
         .text('OFFICIAL DIGITAL ADMISSION PASS', 65, 88);

      // Category / Status Badge on Right
      doc.roundedRect(415, 65, 115, 28, 14)
         .fill(accentColor);
      doc.fillColor('#ffffff')
         .fontSize(10)
         .font('Helvetica-Bold')
         .text('CONFIRMED', 415, 74, { width: 115, align: 'center' });

      // ── EVENT TITLE & MAIN DETAILS ──
      let y = 150;
      doc.fillColor(darkColor)
         .fontSize(20)
         .font('Helvetica-Bold')
         .text(event?.title || 'Event Admission', 65, y, { width: 465 });

      y = doc.y + 8;
      doc.fillColor(accentColor)
         .fontSize(11)
         .font('Helvetica-Bold')
         .text(`CATEGORY: ${(event?.category || 'General').toUpperCase()}`, 65, y);

      // ── PERFORATION DIVIDER LINE ──
      y += 24;
      doc.strokeColor('#cbd5e1')
         .lineWidth(1)
         .dash(5, { space: 3 })
         .moveTo(65, y)
         .lineTo(530, y)
         .stroke()
         .undash();

      // ── 2-COLUMN METADATA GRID ──
      y += 20;
      const col1X = 65;
      const col2X = 310;

      // Event Date & Time
      const eventDateStr = event?.date
        ? new Date(event.date).toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
          })
        : 'See Event Details';

      // Row 1: Date & Booking ID
      doc.fillColor(textLightColor).fontSize(9).font('Helvetica-Bold').text('DATE & TIME', col1X, y);
      doc.fillColor(darkColor).fontSize(11).font('Helvetica').text(eventDateStr, col1X, y + 14, { width: 220 });

      doc.fillColor(textLightColor).fontSize(9).font('Helvetica-Bold').text('BOOKING REFERENCE', col2X, y);
      doc.fillColor(accentColor).fontSize(13).font('Helvetica-Bold').text(`#${booking.bookingId}`, col2X, y + 14);

      y += 48;

      // Row 2: Location & Quantity
      doc.fillColor(textLightColor).fontSize(9).font('Helvetica-Bold').text('VENUE & LOCATION', col1X, y);
      doc.fillColor(darkColor).fontSize(11).font('Helvetica').text(event?.location || 'Main Venue', col1X, y + 14, { width: 220 });

      doc.fillColor(textLightColor).fontSize(9).font('Helvetica-Bold').text('TICKETS ADMITTED', col2X, y);
      doc.fillColor(darkColor).fontSize(12).font('Helvetica-Bold').text(`${booking.quantity} Person${booking.quantity > 1 ? 's' : ''}`, col2X, y + 14);

      y += 48;

      // Row 3: Attendee Name & Total Paid
      const attendeeName = user?.name || booking.paymentDetails?.attendee || 'Valued Attendee';
      const attendeeEmail = user?.email || booking.paymentDetails?.email || '';

      doc.fillColor(textLightColor).fontSize(9).font('Helvetica-Bold').text('ATTENDEE NAME', col1X, y);
      doc.fillColor(darkColor).fontSize(11).font('Helvetica-Bold').text(attendeeName, col1X, y + 14);
      if (attendeeEmail) {
        doc.fillColor(textLightColor).fontSize(9).font('Helvetica').text(attendeeEmail, col1X, y + 28);
      }

      doc.fillColor(textLightColor).fontSize(9).font('Helvetica-Bold').text('TOTAL AMOUNT PAID', col2X, y);
      doc.fillColor('#16a34a').fontSize(14).font('Helvetica-Bold').text(`₹${Number(booking.totalAmount || 0).toLocaleString('en-IN')}`, col2X, y + 14);

      y += 56;

      // Row 4: Payment Method & Payment Ref ID
      doc.fillColor(textLightColor).fontSize(9).font('Helvetica-Bold').text('PAYMENT METHOD', col1X, y);
      doc.fillColor(darkColor).fontSize(10).font('Helvetica').text(booking.paymentMethod || 'Razorpay Direct', col1X, y + 14);

      if (booking.razorpayPaymentId) {
        doc.fillColor(textLightColor).fontSize(9).font('Helvetica-Bold').text('TRANSACTION ID', col2X, y);
        doc.fillColor(darkColor).fontSize(10).font('Helvetica').text(booking.razorpayPaymentId, col2X, y + 14);
      }

      // ── PERFORATION DIVIDER ──
      y += 42;
      doc.strokeColor('#cbd5e1')
         .lineWidth(1)
         .dash(5, { space: 3 })
         .moveTo(65, y)
         .lineTo(530, y)
         .stroke()
         .undash();

      // ── QR CODE ENTRY SECTION ──
      y += 18;
      const qrData = JSON.stringify({
        bookingId: booking.bookingId,
        eventId: event?._id,
        tickets: booking.quantity,
        attendee: attendeeName,
        status: 'VALID'
      });

      const qrBuffer = await QRCode.toBuffer(qrData, {
        width: 170,
        margin: 1,
        color: { dark: '#0f172a', light: '#ffffff' }
      });

      const qrX = (595.28 - 170) / 2; // Center horizontally on A4
      doc.image(qrBuffer, qrX, y, { width: 170, height: 170 });

      y += 180;
      doc.fillColor(darkColor)
         .fontSize(11)
         .font('Helvetica-Bold')
         .text('SCAN FOR GATE ADMISSION', 65, y, { width: 465, align: 'center' });

      y += 16;
      doc.fillColor(textLightColor)
         .fontSize(9)
         .font('Helvetica')
         .text(`Ticket #${booking.bookingId} • Present this QR code at the venue gate for instant scanning`, 65, y, { width: 465, align: 'center' });

      // ── FOOTER TERMS & CONDITIONS ──
      y = 730;
      doc.rect(41, y, 513, 69)
         .fill('#f8fafc');

      doc.fillColor('#94a3b8')
         .fontSize(7.5)
         .font('Helvetica')
         .text('IMPORTANT TERMS: This admission pass is non-transferable and subject to EventHub platform guidelines. Attendees must carry a valid photo ID matching the attendee name. Cancellations requested >48h prior to event are eligible for full refund under platform policy. For support, email gondaliyakishan839@gmail.com.', 60, y + 14, { width: 475, align: 'center', lineGap: 3 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  generateTicketPdf
};
