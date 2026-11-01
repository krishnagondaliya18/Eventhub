const request = require('supertest');
const app = require('../app');
const { connectTestDB, clearTestDB, closeTestDB, createTestUser } = require('./setup');
const Event = require('../models/Event');
const mongoose = require('mongoose');

let adminUser, adminToken, normalUser, userToken;

beforeAll(async () => {
  await connectTestDB();
  await clearTestDB();
  const adminRes = await createTestUser('admin', { email: 'admin_event_test@eventhub.test' });
  adminUser = adminRes.user;
  adminToken = adminRes.token;

  const userRes = await createTestUser('user', { email: 'user_event_test@eventhub.test' });
  normalUser = userRes.user;
  userToken = userRes.token;
});

afterAll(async () => {
  await clearTestDB();
  await closeTestDB();
});

describe('Events API (/api/events)', () => {
  let createdEvent;

  it('should create an event with admin authentication (POST /api/events) and return 201', async () => {
    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Global Tech Summit 2026',
        description: 'Premier technology conference featuring AI, cloud, and quantum computing.',
        category: 'Technology',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        location: 'Mumbai Tech Park',
        price: 1500,
        isFree: false,
        totalTickets: 250,
        availableTickets: 250
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.event).toBeDefined();
    expect(res.body.event.title).toBe('Global Tech Summit 2026');
    expect(res.body.event.status).toBe('active'); // Admins create active events
    createdEvent = res.body.event;
  });

  it('should reject unauthorized event creation without authentication (401)', async () => {
    const res = await request(app)
      .post('/api/events')
      .send({
        title: 'Unauthenticated Event',
        description: 'Should fail',
        date: new Date().toISOString(),
        location: 'Surat'
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should create an event with user authentication and set status to pending (201)', async () => {
    const res = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'Community Music Jam',
        description: 'Acoustic jam session for indie musicians.',
        category: 'Music',
        date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        location: 'Bengaluru',
        price: 0,
        isFree: true,
        totalTickets: 50
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.event.status).toBe('pending'); // Non-admins create pending events
    expect(res.body.message).toMatch(/pending Admin approval/i);
  });

  it('should fetch all active events (GET /api/events) with pagination', async () => {
    const res = await request(app).get('/api/events');

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.events)).toBe(true);
    expect(res.body.total).toBeGreaterThanOrEqual(1);
    const found = res.body.events.find(e => e._id === createdEvent._id);
    expect(found).toBeDefined();
  });

  it('should fetch event details by valid ID (GET /api/events/:id)', async () => {
    const res = await request(app).get(`/api/events/${createdEvent._id}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.event._id).toBe(createdEvent._id);
    expect(res.body.event.title).toBe(createdEvent.title);
  });

  it('should handle missing event and return 404 (GET /api/events/:id)', async () => {
    const nonExistentId = new mongoose.Types.ObjectId();
    const res = await request(app).get(`/api/events/${nonExistentId}`);

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Event not found/i);
  });

  it('should handle invalid ObjectId format gracefully (500)', async () => {
    const res = await request(app).get('/api/events/invalid_mongo_id_123');

    expect(res.statusCode).toBe(500);
    expect(res.body.success).toBe(false);
  });

  it('should update an existing event by admin (PUT /api/events/:id)', async () => {
    const res = await request(app)
      .put(`/api/events/${createdEvent._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Global Tech Summit 2026 - Extended Edition',
        price: 1800
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.event.title).toBe('Global Tech Summit 2026 - Extended Edition');
    expect(res.body.event.price).toBe(1800);
  });

  it('should reject update if unauthorized user attempts to edit another organizer event (403)', async () => {
    const res = await request(app)
      .put(`/api/events/${createdEvent._id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        title: 'Malicious Overwrite'
      });

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Not authorized to edit/i);
  });

  it('should auto-complete expired past events when date is in the past', async () => {
    // Insert a past active event
    const pastEvent = await Event.create({
      title: 'Historical Past Concert 2020',
      description: 'Event from the past',
      category: 'Music',
      date: new Date('2020-01-01'),
      location: 'Ahmedabad',
      price: 500,
      totalTickets: 100,
      availableTickets: 100,
      status: 'active'
    });

    // Calling GET /api/events/:id triggers syncEventStatus()
    const res = await request(app).get(`/api/events/${pastEvent._id}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.event.status).toBe('completed');
  });

  it('should delete an event by admin (DELETE /api/events/:id)', async () => {
    const toDelete = await Event.create({
      title: 'Temporary Event to Delete',
      description: 'Will be deleted in test',
      category: 'Other',
      date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      location: 'Goa',
      organizer: adminUser._id
    });

    const res = await request(app)
      .delete(`/api/events/${toDelete._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/Event deleted successfully/i);

    // Verify it is gone
    const check = await Event.findById(toDelete._id);
    expect(check).toBeNull();
  });
});
