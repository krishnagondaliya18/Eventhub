const request = require('supertest');
const app = require('../app');
const { connectTestDB, clearTestDB, closeTestDB, createTestUser } = require('./setup');
const Feedback = require('../models/Feedback');

let user, userToken, admin, adminToken;

beforeAll(async () => {
  await connectTestDB();
  await clearTestDB();

  const userRes = await createTestUser('user', { email: 'feedback_user@eventhub.test' });
  user = userRes.user;
  userToken = userRes.token;

  const adminRes = await createTestUser('admin', { email: 'feedback_admin@eventhub.test' });
  admin = adminRes.user;
  adminToken = adminRes.token;
});

afterAll(async () => {
  await clearTestDB();
  await closeTestDB();
});

describe('Feedback & Customer Support API (/api/feedback)', () => {
  let createdFeedbackId;

  it('should submit valid feedback (POST /api/feedback) with 201 status', async () => {
    const res = await request(app)
      .post('/api/feedback')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        subject: 'Excellent Event Experience',
        message: 'The ticketing and seating flow was seamless. Great platform!',
        rating: 5
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.item).toBeDefined();
    expect(res.body.item.subject).toBe('Excellent Event Experience');
    expect(res.body.item.rating).toBe(5);
    expect(res.body.item.name).toBe(user.name);
    createdFeedbackId = res.body.item._id;
  });

  it('should reject feedback submission when message is missing (400)', async () => {
    const res = await request(app)
      .post('/api/feedback')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        subject: 'No message provided'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Message is required/i);
  });

  it('should fetch user own submitted feedback (GET /api/feedback/my)', async () => {
    const res = await request(app)
      .get('/api/feedback/my')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.feedbacks)).toBe(true);
    expect(res.body.feedbacks.some(f => f._id === createdFeedbackId)).toBe(true);
  });

  it('should reject non-admin users from accessing all feedbacks (403)', async () => {
    const res = await request(app)
      .get('/api/feedback')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Admin access required/i);
  });

  it('should allow admin users to fetch all feedback items (GET /api/feedback)', async () => {
    const res = await request(app)
      .get('/api/feedback')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.feedbacks)).toBe(true);
  });

  it('should allow user to update their own feedback (PUT /api/feedback/:id)', async () => {
    const res = await request(app)
      .put(`/api/feedback/${createdFeedbackId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        subject: 'Updated: Outstanding Experience',
        rating: 4
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.item.subject).toBe('Updated: Outstanding Experience');
    expect(res.body.item.rating).toBe(4);
  });

  it('should allow user to delete their own feedback (DELETE /api/feedback/:id)', async () => {
    const res = await request(app)
      .delete(`/api/feedback/${createdFeedbackId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/Feedback deleted/i);

    const check = await Feedback.findById(createdFeedbackId);
    expect(check).toBeNull();
  });
});
