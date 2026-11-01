const request = require('supertest');
const app = require('../app');
const { connectTestDB, clearTestDB, closeTestDB, createTestUser } = require('./setup');
const Event = require('../models/Event');
const Booking = require('../models/Booking');
const Participant = require('../models/Participant');

let userA, tokenA, userB, tokenB, testEvent, soldOutEvent;

beforeAll(async () => {
  await connectTestDB();
  await clearTestDB();

  const resA = await createTestUser('user', { email: 'booker_a@eventhub.test' });
  userA = resA.user;
  tokenA = resA.token;

  const resB = await createTestUser('user', { email: 'booker_b@eventhub.test' });
  userB = resB.user;
  tokenB = resB.token;

  testEvent = await Event.create({
    title: 'Standup Comedy Night',
    description: 'An evening of laughs and entertainment.',
    category: 'Other',
    date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    location: 'Surat Auditorium',
    price: 499,
    totalTickets: 20,
    availableTickets: 20,
    status: 'active'
  });

  soldOutEvent = await Event.create({
    title: 'Sold Out Exclusive Concert',
    description: 'Completely sold out event.',
    category: 'Music',
    date: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
    location: 'Mumbai Arena',
    price: 1200,
    totalTickets: 10,
    availableTickets: 0,
    status: 'active'
  });
});

afterAll(async () => {
  await clearTestDB();
  await closeTestDB();
});

describe('Booking API (/api/bookings)', () => {
  let createdBookingId;

  it('should successfully book an available event (POST /api/bookings) and decrease availableTickets', async () => {
    const initialTickets = testEvent.availableTickets;
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        eventId: testEvent._id,
        quantity: 2,
        paymentMethod: 'UPI Direct',
        paymentDetails: { upiId: 'booker_a@okhdfcbank' }
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.booking).toBeDefined();
    expect(res.body.booking.quantity).toBe(2);
    expect(res.body.booking.status).toBe('confirmed');
    expect(res.body.booking.bookingId).toMatch(/^EH/);
    createdBookingId = res.body.booking._id;

    // Check availableTickets was decremented by 2
    const updated = await Event.findById(testEvent._id);
    expect(updated.availableTickets).toBe(initialTickets - 2);
    expect(updated.revenue).toBe(499 * 2);
  });

  it('should reject booking when requested quantity exceeds available capacity (400)', async () => {
    const res = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        eventId: soldOutEvent._id,
        quantity: 1
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Only 0 tickets available/i);
  });

  it('should reject direct participant registration when user is already registered (400)', async () => {
    // First registration
    const regRes1 = await request(app)
      .post(`/api/events/${testEvent._id}/register`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(regRes1.statusCode).toBe(200);

    // Duplicate registration attempt
    const regRes2 = await request(app)
      .post(`/api/events/${testEvent._id}/register`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(regRes2.statusCode).toBe(400);
    expect(regRes2.body.message).toMatch(/Already registered/i);
  });

  it('should fetch user own bookings (GET /api/bookings/my) and validate ownership', async () => {
    const resA = await request(app)
      .get('/api/bookings/my')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(resA.statusCode).toBe(200);
    expect(resA.body.success).toBe(true);
    expect(Array.isArray(resA.body.bookings)).toBe(true);
    expect(resA.body.bookings.some(b => b._id.toString() === createdBookingId.toString())).toBe(true);

    // User B should not see User A's booking
    const resB = await request(app)
      .get('/api/bookings/my')
      .set('Authorization', `Bearer ${tokenB}`);

    expect(resB.statusCode).toBe(200);
    expect(resB.body.bookings.some(b => b._id.toString() === createdBookingId.toString())).toBe(false);
  });

  it('should reject unauthorized cancellation when user attempts to cancel another user booking (403)', async () => {
    const res = await request(app)
      .put(`/api/bookings/${createdBookingId}/cancel`)
      .set('Authorization', `Bearer ${tokenB}`); // User B attempting to cancel User A's booking

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Permission denied/i);
  });

  it('should allow the owner to cancel their booking (PUT /api/bookings/:id/cancel) and restore tickets', async () => {
    const eventBefore = await Event.findById(testEvent._id);
    const ticketsBefore = eventBefore.availableTickets;

    const res = await request(app)
      .put(`/api/bookings/${createdBookingId}/cancel`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.booking.status).toBe('cancelled');
    expect(res.body.booking.cancelledAt).toBeDefined();

    // Verify tickets restored (by 2)
    const eventAfter = await Event.findById(testEvent._id);
    expect(eventAfter.availableTickets).toBe(ticketsBefore + 2);
  });

  it('should reject cancelling an already cancelled booking (400)', async () => {
    const res = await request(app)
      .put(`/api/bookings/${createdBookingId}/cancel`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Already cancelled/i);
  });
});
