// Mock Razorpay before requiring the app
jest.mock('razorpay', () => {
  return function () {
    this.orders = {
      create: jest.fn().mockImplementation((opts) => Promise.resolve({
        id: `order_mock_${Date.now()}`,
        entity: 'order',
        amount: opts.amount,
        amount_paid: 0,
        amount_due: opts.amount,
        currency: opts.currency || 'INR',
        receipt: opts.receipt,
        status: 'created',
        attempts: 0
      }))
    };
    this.payments = {
      refund: jest.fn().mockImplementation((paymentId, opts) => Promise.resolve({
        id: `rfnd_mock_${Date.now()}`,
        entity: 'refund',
        amount: opts.amount,
        currency: 'INR',
        payment_id: paymentId,
        status: 'processed'
      }))
    };
  };
});

const request = require('supertest');
const app = require('../app');
const crypto = require('crypto');
const { connectTestDB, clearTestDB, closeTestDB, createTestUser } = require('./setup');
const Event = require('../models/Event');
const Booking = require('../models/Booking');

let user, token, paidEvent;

beforeAll(async () => {
  await connectTestDB();
  await clearTestDB();

  const userRes = await createTestUser('user', { email: 'payment_tester@eventhub.test' });
  user = userRes.user;
  token = userRes.token;

  paidEvent = await Event.create({
    title: 'International Film Gala',
    description: 'Exclusive red carpet film screening.',
    category: 'Films',
    date: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
    location: 'Goa Convention Hall',
    price: 1000,
    totalTickets: 100,
    availableTickets: 100,
    status: 'active'
  });
});

afterAll(async () => {
  await clearTestDB();
  await closeTestDB();
});

describe('Payment & Razorpay Gateway Workflow (/api/bookings)', () => {
  let razorpayOrderId;

  it('should fetch public payment configuration (GET /api/bookings/payment-config)', async () => {
    const res = await request(app).get('/api/bookings/payment-config');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.keyId).toBeDefined();
    expect(res.body.directPaymentUrl).toBeDefined();
    expect(res.body.merchantName).toBeDefined();
  });

  it('should create a Razorpay order with mocked service (POST /api/bookings/create-order)', async () => {
    const res = await request(app)
      .post('/api/bookings/create-order')
      .set('Authorization', `Bearer ${token}`)
      .send({
        eventId: paidEvent._id,
        quantity: 2
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.order).toBeDefined();
    expect(res.body.order.id).toBeDefined();
    expect(res.body.amount).toBeDefined();
    expect(res.body.currency).toBe('INR');
    razorpayOrderId = res.body.order.id;
  });

  it('should reject create-order if event does not exist (404)', async () => {
    const fakeId = '507f1f77bcf86cd799439011';
    const res = await request(app)
      .post('/api/bookings/create-order')
      .set('Authorization', `Bearer ${token}`)
      .send({
        eventId: fakeId,
        quantity: 1
      });

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Event not found/i);
  });

  it('should reject payment verification when HMAC signature is invalid (400)', async () => {
    const res = await request(app)
      .post('/api/bookings/verify-payment')
      .set('Authorization', `Bearer ${token}`)
      .send({
        eventId: paidEvent._id,
        quantity: 2,
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: 'pay_test_invalid_12345',
        razorpay_signature: 'invalid_tampered_signature_hex'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Invalid signature/i);
  });

  it('should successfully verify valid HMAC SHA256 signature and confirm booking (201)', async () => {
    const paymentId = `pay_valid_${Date.now()}`;
    const secret = process.env.RAZORPAY_KEY_SECRET || 'ZDSmneQYfMU6jOyhVVjpSxjc';

    // Generate valid HMAC SHA256 signature
    const validSignature = crypto
      .createHmac('sha256', secret)
      .update(`${razorpayOrderId}|${paymentId}`)
      .digest('hex');

    const res = await request(app)
      .post('/api/bookings/verify-payment')
      .set('Authorization', `Bearer ${token}`)
      .send({
        eventId: paidEvent._id,
        quantity: 2,
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: validSignature
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/Payment verified and booking confirmed/i);
    expect(res.body.booking).toBeDefined();
    expect(res.body.booking.paymentStatus).toBe('paid');
    expect(res.body.booking.status).toBe('confirmed');
    expect(res.body.booking.razorpayPaymentId).toBe(paymentId);
    expect(res.body.booking.razorpaySignature).toBe(validSignature);

    // Verify event available tickets and revenue in database
    const updatedEvent = await Event.findById(paidEvent._id);
    expect(updatedEvent.availableTickets).toBe(98);
    expect(updatedEvent.revenue).toBe(2000);

    // Test Idempotency: Resubmitting the same verified payment should return 200 without double decrementing
    const duplicateRes = await request(app)
      .post('/api/bookings/verify-payment')
      .set('Authorization', `Bearer ${token}`)
      .send({
        eventId: paidEvent._id,
        quantity: 2,
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: paymentId,
        razorpay_signature: validSignature
      });

    expect(duplicateRes.statusCode).toBe(200);
    expect(duplicateRes.body.success).toBe(true);
    expect(duplicateRes.body.message).toMatch(/already verified/i);

    // Verify tickets were NOT decremented again
    const eventAfterDuplicate = await Event.findById(paidEvent._id);
    expect(eventAfterDuplicate.availableTickets).toBe(98);
  });

  it('should reject webhook requests with invalid or missing signature (400)', async () => {
    const res = await request(app)
      .post('/api/bookings/webhook')
      .set('x-razorpay-signature', 'invalid_signature_hex')
      .send({
        event: 'payment.captured',
        payload: { payment: { entity: { id: 'pay_test_webhook' } } }
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should process booking refund successfully (POST /api/bookings/:id/refund)', async () => {
    // Find the confirmed booking created in earlier test
    const booking = await Booking.findOne({ user: user._id, paymentStatus: 'paid' });
    expect(booking).toBeDefined();

    const res = await request(app)
      .post(`/api/bookings/${booking._id}/refund`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'Customer requested cancellation' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/Refund processed successfully/i);
    expect(res.body.booking.paymentStatus).toBe('refunded');
    expect(res.body.booking.status).toBe('cancelled');

    // Tickets should be restored
    const eventAfterRefund = await Event.findById(paidEvent._id);
    expect(eventAfterRefund.availableTickets).toBe(100);
  });
});
