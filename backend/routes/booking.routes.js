const express  = require('express');
const router   = express.Router();
const Booking  = require('../models/Booking');
const Event    = require('../models/Event');
const { protect, adminOnly } = require('../middleware/auth');
const Razorpay = require('razorpay');
const crypto   = require('crypto');

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
      currency: 'INR'
    });
  } catch (err) {
    console.error('Razorpay Create Order Error:', err);
    res.status(500).json({ success: false, message: err.message || 'Error creating Razorpay order' });
  }
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

    const qty = Math.max(1, Math.min(10, parseInt(quantity) || 1));
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    if (event.availableTickets < qty) {
      return res.status(400).json({ success: false, message: `Only ${event.availableTickets} tickets available` });
    }

    // Verify HMAC SHA256 signature
    const secret = process.env.RAZORPAY_KEY_SECRET || 'ZDSmneQYfMU6jOyhVVjpSxjc';
    const generatedSignature = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment verification failed: Invalid signature' });
    }

    const totalAmount = event.price * qty;

    const booking = await Booking.create({
      user: req.user._id,
      event: event._id,
      quantity: qty,
      totalAmount,
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      paymentStatus: 'paid',
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
      .populate('user',  'name email');

    res.status(201).json({ success: true, message: 'Payment verified and booking confirmed', booking: populated });
  } catch (err) {
    console.error('Payment Verification Error:', err);
    res.status(500).json({ success: false, message: err.message || 'Payment verification failed' });
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

    const totalAmount = event.isFree ? 0 : event.price * qty;

    const booking = await Booking.create({
      user: req.user._id,
      event: event._id,
      quantity: qty,
      totalAmount,
      upiId: upiId || paymentDetails?.upiId || '',
      paymentMethod: event.isFree ? 'Free Registration' : paymentMethod,
      paymentDetails: paymentDetails || {},
      razorpayOrderId: razorpayOrderId || '',
      razorpayPaymentId: razorpayPaymentId || '',
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

    res.status(201).json({ success: true, message: 'Booking confirmed successfully!', booking: populated });
  } catch (err) {
    console.error('Booking creation error:', err);
    res.status(500).json({ success: false, message: err.message });
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
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Permission denied' });
    }
    if (booking.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Already cancelled' });
    }

    booking.status      = 'cancelled';
    booking.cancelledAt = new Date();
    await booking.save();

    // Restore tickets
    await Event.findByIdAndUpdate(booking.event, {
      $inc: { availableTickets: booking.quantity }
    });

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