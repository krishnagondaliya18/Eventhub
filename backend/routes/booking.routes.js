const express  = require('express');
const router   = express.Router();
const Booking  = require('../models/Booking');
const Event    = require('../models/Event');
const { protect, adminOnly } = require('../middleware/auth');
const Razorpay = require('razorpay');
const crypto   = require('crypto');
const { sendBookingConfirmationEmail, sendBookingCancellationEmail } = require('../utils/mailer');
const { generateTicketPdf }           = require('../utils/ticketPdf');

const getRazorpayInstance = () => {
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_TSk0Vle1oG7U1A',
    key_secret: process.env.RAZORPAY_KEY_SECRET || 'ZDSmneQYfMU6jOyhVVjpSxjc'
  });
};

// POST /api/bookings/create-order — Create Razorpay Order
router.post('/create-order', protect, async (req, res) => {
  try {
    const { eventId, quantity } = req.body;
    const qty = Math.max(1, Math.min(10, parseInt(quantity) || 1));

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    if (event.availableTickets < qty) {
      return res.status(400).json({ success: false, message: `Only ${event.availableTickets} tickets available` });
    }

    if (event.isFree || event.price === 0) {
      return res.status(400).json({ success: false, message: 'This event is free. Use free registration.' });
    }

    const totalAmount = event.price * qty;
    const finalAmount = totalAmount + Math.max(50, Math.round(totalAmount * 0.025)) + Math.round(totalAmount * 0.085);
    const options = {
      amount: Math.round(finalAmount * 100),
      currency: 'INR',
      receipt: `rcpt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      notes: {
        eventId: event._id.toString(),
        userId: req.user._id.toString(),
        eventTitle: event.title,
        quantity: qty
      }
    };

    const razorpay = getRazorpayInstance();
    const order = await razorpay.orders.create(options);

    res.json({
      success: true,
      order,
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_TSk0Vle1oG7U1A',
      amount: finalAmount,
      currency: 'INR',
      directPaymentUrl: 'https://checkout.razorpay.com',
      merchantName: process.env.RAZORPAY_MERCHANT_NAME || 'EventHub'
    });
  } catch (err) {
    console.error('Razorpay Create Order Error:', err);
    res.status(500).json({ success: false, message: err.message || 'Error creating Razorpay order' });
  }
});

// GET /api/bookings/payment-config — Public config for direct transfer
router.get('/payment-config', (req, res) => {
  res.json({
    success: true,
    directPaymentUrl: 'https://checkout.razorpay.com',
    merchantName: process.env.RAZORPAY_MERCHANT_NAME || 'EventHub',
    keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_TSk0Vle1oG7U1A'
  });
});

// POST /api/bookings/verify-payment — Verify Razorpay signature & Confirm Booking
router.post('/verify-payment', protect, async (req, res) => {
  try {
    const {
      eventId,
      quantity,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    if (!eventId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing required payment verification parameters'
      });
    }

    const qty = Math.max(1, Math.min(10, parseInt(quantity) || 1));
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    if (event.availableTickets < qty) {
      return res.status(400).json({ success: false, message: `Only ${event.availableTickets} tickets available` });
    }

    // Verify HMAC SHA256 signature using timing-safe comparison to prevent timing attacks
    const secret = process.env.RAZORPAY_KEY_SECRET || 'ZDSmneQYfMU6jOyhVVjpSxjc';
    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    let isMatch = false;
    try {
      isMatch = crypto.timingSafeEqual(
        Buffer.from(generatedSignature, 'utf8'),
        Buffer.from(razorpay_signature, 'utf8')
      );
    } catch {
      isMatch = (generatedSignature === razorpay_signature);
    }

    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Payment verification failed: Invalid signature' });
    }

    // Idempotency: Check if this payment was already processed to prevent duplicate orders
    const existingBooking = await Booking.findOne({ razorpayPaymentId: razorpay_payment_id });
    if (existingBooking) {
      const populated = await Booking.findById(existingBooking._id)
        .populate('event', 'title date location price image category isFree')
        .populate('user',  'name email phone');
      return res.status(200).json({
        success: true,
        message: 'Payment already verified and booking confirmed',
        booking: populated
      });
    }

    const totalAmount = event.price * qty;

    // Atomically decrement available tickets to guarantee no overselling under concurrent load
    const updatedEvent = await Event.findOneAndUpdate(
      { _id: event._id, availableTickets: { $gte: qty } },
      {
        $inc: { availableTickets: -qty, revenue: totalAmount },
        $addToSet: { participants: req.user._id }
      },
      { new: true }
    );

    if (!updatedEvent) {
      return res.status(400).json({
        success: false,
        message: 'Tickets sold out! Please contact support for an immediate refund if payment was debited.'
      });
    }

    const booking = await Booking.create({
      user: req.user._id,
      event: event._id,
      quantity: qty,
      totalAmount,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      paymentMethod: 'Razorpay Online',
      paymentStatus: 'paid',
      status: 'confirmed'
    });

    const populated = await Booking.findById(booking._id)
      .populate('event', 'title date location price image category isFree')
      .populate('user',  'name email phone');

    // Send instant confirmation email with attached PDF ticket asynchronously
    sendBookingConfirmationEmail({
      booking: populated,
      event: populated.event,
      user: populated.user
    }).catch(mErr => console.error('[CONFIRMATION EMAIL ERROR]', mErr.message));

    res.status(201).json({ success: true, message: 'Payment verified and booking confirmed', booking: populated });
  } catch (err) {
    console.error('Payment Verification Error:', err);
    res.status(500).json({ success: false, message: err.message || 'Payment verification failed' });
  }
});

// POST /api/bookings/webhook — Razorpay Cloud Webhook Notification
router.post('/webhook', async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;

    if (!signature || !webhookSecret) {
      return res.status(400).json({ success: false, message: 'Missing webhook signature or secret' });
    }

    const rawBody = req.rawBody || JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawBody)
      .digest('hex');

    let isMatch = false;
    try {
      isMatch = crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'utf8'),
        Buffer.from(signature, 'utf8')
      );
    } catch {
      isMatch = (expectedSignature === signature);
    }

    if (!isMatch) {
      console.warn('[Razorpay Webhook] Invalid signature rejected');
      return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
    }

    const eventType = req.body.event;
    const payload   = req.body.payload;

    console.log(`[Razorpay Webhook] Processed event: ${eventType}`);

    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      const payment   = payload?.payment?.entity;
      const orderId   = payment?.order_id;
      const paymentId = payment?.id;

      if (paymentId) {
        let booking = await Booking.findOne({
          $or: [{ razorpayPaymentId: paymentId }, { razorpayOrderId: orderId }]
        });

        if (booking && booking.paymentStatus !== 'paid') {
          booking.paymentStatus = 'paid';
          booking.status = 'confirmed';
          if (!booking.razorpayPaymentId) booking.razorpayPaymentId = paymentId;
          await booking.save();

          const populated = await Booking.findById(booking._id)
            .populate('event', 'title date location price image category isFree')
            .populate('user',  'name email phone');

          sendBookingConfirmationEmail({
            booking: populated,
            event: populated.event,
            user: populated.user
          }).catch(mErr => console.error('[WEBHOOK CONFIRMATION EMAIL ERROR]', mErr.message));

          console.log(`[Razorpay Webhook] Booking ${booking._id} status updated to paid & confirmation email sent`);
        }
      }
    } else if (eventType === 'payment.failed') {
      const payment = payload?.payment?.entity;
      console.warn(`[Razorpay Webhook] Payment failed: ${payment?.id} - Reason: ${payment?.error_description}`);
    } else if (eventType === 'refund.processed') {
      const refund = payload?.refund?.entity;
      if (refund?.payment_id) {
        const b = await Booking.findOneAndUpdate(
          { razorpayPaymentId: refund.payment_id },
          { paymentStatus: 'refunded', status: 'cancelled', refundId: refund.id, cancelledAt: new Date() },
          { new: true }
        )
          .populate('event', 'title date location price image category isFree')
          .populate('user',  'name email phone');

        if (b) {
          sendBookingCancellationEmail({
            booking: b,
            event: b.event,
            user: b.user,
            reason: 'Refund confirmed by Razorpay'
          }).catch(mErr => console.error('[WEBHOOK REFUND CANCELLATION EMAIL ERROR]', mErr.message));
        }

        console.log(`[Razorpay Webhook] Payment ${refund.payment_id} marked as refunded & cancellation email sent`);
      }
    }

    res.json({ status: 'ok' });
  } catch (err) {
    console.error('[Razorpay Webhook Error]:', err.message);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// POST /api/bookings/:id/refund — Process Razorpay Refund
router.post('/:id/refund', protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    const isOwner = booking.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Permission denied' });
    }

    if (booking.paymentStatus === 'refunded') {
      return res.status(400).json({ success: false, message: 'Booking is already refunded' });
    }

    if (booking.paymentStatus !== 'paid' || !booking.razorpayPaymentId) {
      return res.status(400).json({ success: false, message: 'No paid online transaction found to refund' });
    }

    const rzp = getRazorpayInstance();
    const refundAmountPaise = Math.round(booking.totalAmount * 100);

    const refund = await rzp.payments.refund(booking.razorpayPaymentId, {
      amount: refundAmountPaise,
      notes: {
        reason: req.body.reason || 'Booking cancellation refund',
        bookingId: booking._id.toString(),
        userId: req.user._id.toString()
      }
    });

    booking.paymentStatus = 'refunded';
    booking.status        = 'cancelled';
    booking.refundId      = refund.id;
    booking.refundAmount  = booking.totalAmount;
    booking.cancelledAt   = new Date();
    await booking.save();

    // Restore event tickets
    await Event.findByIdAndUpdate(booking.event, {
      $inc: { availableTickets: booking.quantity, revenue: -booking.totalAmount }
    });

    const populated = await Booking.findById(booking._id)
      .populate('event', 'title date location price image category isFree')
      .populate('user',  'name email phone');

    // Send cancellation & refund email notification
    sendBookingCancellationEmail({
      booking: populated,
      event: populated.event,
      user: populated.user,
      reason: req.body.reason || 'Booking cancellation & refund processed'
    }).catch(mErr => console.error('[REFUND CANCELLATION EMAIL ERROR]', mErr.message));

    res.json({
      success: true,
      message: 'Refund processed successfully',
      refund,
      booking: populated
    });
  } catch (err) {
    console.error('Razorpay Refund Error:', err);
    res.status(500).json({ success: false, message: err.message || 'Refund processing failed' });
  }
});

// POST /api/bookings — Universal Booking / Multi-Option Payment
router.post('/', protect, async (req, res) => {
  try {
    const {
      eventId,
      quantity,
      upiId,
      paymentMethod = 'Online Payment',
      paymentDetails = {},
      razorpayOrderId = '',
      razorpayPaymentId = '',
      razorpaySignature = ''
    } = req.body;

    const qty = Math.max(1, Math.min(10, parseInt(quantity) || 1));

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    if (event.availableTickets < qty) {
      return res.status(400).json({ success: false, message: `Only ${event.availableTickets} tickets available` });
    }

    const totalAmount = event.isFree ? 0 : (req.body.totalAmount ? Number(req.body.totalAmount) : (event.price * qty));

    const booking = await Booking.create({
      user: req.user._id,
      event: event._id,
      quantity: qty,
      totalAmount,
      upiId: upiId || paymentDetails?.upiId || '',
      paymentMethod: event.isFree ? 'Free Registration' : (paymentMethod || 'Razorpay Online Checkout'),
      paymentDetails: {
        ...paymentDetails,
        merchantName: process.env.RAZORPAY_MERCHANT_NAME || 'EventHub'
      },
      razorpayOrderId: razorpayOrderId || '',
      razorpayPaymentId: razorpayPaymentId || `pay_rzp_${Date.now()}`,
      razorpaySignature: razorpaySignature || '',
      paymentStatus: event.isFree ? 'free' : 'paid',
      status: 'confirmed'
    });

    // Reduce available tickets and track revenue
    event.availableTickets -= qty;
    event.revenue = (event.revenue || 0) + totalAmount;
    if (!event.participants.includes(req.user._id)) {
      event.participants.push(req.user._id);
    }
    await event.save();

    const populated = await Booking.findById(booking._id)
      .populate('event', 'title date location price image category isFree')
      .populate('user',  'name email phone');

    // Send instant confirmation email with attached PDF ticket
    sendBookingConfirmationEmail({
      booking: populated,
      event: populated.event,
      user: populated.user
    }).catch(mErr => console.error('[CONFIRMATION EMAIL ERROR]', mErr.message));

    res.status(201).json({ success: true, message: 'Booking confirmed successfully!', booking: populated });
  } catch (err) {
    console.error('Booking creation error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/bookings/:id/ticket-pdf — Download official PDF ticket pass
router.get('/:id/ticket-pdf', protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('event')
      .populate('user', 'name email phone');

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });

    // Authorization check: owner or admin
    if (booking.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Permission denied' });
    }

    const pdfBuffer = await generateTicketPdf({
      booking,
      event: booking.event,
      user: booking.user
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="EventHub-Ticket-${booking.bookingId}.pdf"`);
    res.send(pdfBuffer);
  } catch (err) {
    console.error('PDF ticket download error:', err.message);
    res.status(500).json({ success: false, message: err.message || 'Error downloading PDF ticket' });
  }
});

// GET /api/bookings/my — user booking history
router.get('/my', protect, async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('event', 'title date location price image category isFree')
      .sort({ createdAt: -1 });
    res.json({ success: true, bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/bookings/:id/cancel — cancel booking
router.put('/:id/cancel', protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('event', 'title date location price image category isFree')
      .populate('user',  'name email phone');

    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    
    const bookingUserId = booking.user?._id ? booking.user._id.toString() : booking.user.toString();
    if (bookingUserId !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Permission denied' });
    }
    if (booking.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Already cancelled' });
    }

    booking.status      = 'cancelled';
    booking.cancelledAt = new Date();
    await booking.save();

    // Restore tickets
    const eventId = booking.event?._id || booking.event;
    await Event.findByIdAndUpdate(eventId, {
      $inc: { availableTickets: booking.quantity }
    });

    // Send cancellation email notification asynchronously
    sendBookingCancellationEmail({
      booking,
      event: booking.event,
      user: booking.user,
      reason: req.body.reason || 'Cancelled by attendee'
    }).catch(mErr => console.error('[CANCELLATION EMAIL ERROR]', mErr.message));

    res.json({ success: true, message: 'Booking cancelled successfully', booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/bookings — admin: all bookings
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('event', 'title date location price')
      .populate('user',  'name email')
      .sort({ createdAt: -1 });
    res.json({ success: true, bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/bookings/:id — admin: delete booking
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    res.json({ success: true, message: 'Booking deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

// PUT /api/bookings/:id — update ticket quantity
router.put('/:id', protect, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Permission denied' });
    }
    if (booking.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Cannot update cancelled booking' });
    }

    const newQty = Math.max(1, Math.min(10, parseInt(req.body.quantity)));
    const diff   = newQty - booking.quantity; // positive = increase, negative = decrease

    const event = await Event.findById(booking.event);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    if (diff > 0 && event.availableTickets < diff) {
      return res.status(400).json({ success: false, message: `Only ${event.availableTickets} more tickets available` });
    }

    // Update available tickets
    event.availableTickets -= diff;
    event.revenue = (event.revenue || 0) + (diff * (event.isFree ? 0 : event.price));
    await event.save();

    booking.quantity    = newQty;
    booking.totalAmount = event.isFree ? 0 : event.price * newQty;
    await booking.save();

    const populated = await Booking.findById(booking._id)
      .populate('event', 'title date location price image category isFree')
      .populate('user', 'name email');

    res.json({ success: true, booking: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});