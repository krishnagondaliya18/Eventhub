const request = require('supertest');
const app = require('../app');
const { connectTestDB, clearTestDB, closeTestDB, createTestUser } = require('./setup');
const User = require('../models/User');

let user, userToken, rawPassword;

beforeAll(async () => {
  await connectTestDB();
  await clearTestDB();

  const userRes = await createTestUser('user', {
    name: 'Profile Owner',
    email: 'profile_test@eventhub.test',
    phone: '9123456780'
  });
  user = userRes.user;
  userToken = userRes.token;
  rawPassword = userRes.rawPassword;
});

afterAll(async () => {
  await clearTestDB();
  await closeTestDB();
});

describe('User Profile & Password Management (/api/auth)', () => {
  it('should fetch the authenticated user profile (GET /api/auth/me)', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.name).toBe('Profile Owner');
    expect(res.body.user.email).toBe('profile_test@eventhub.test');
    expect(res.body.user.phone).toBe('9123456780');
    expect(res.body.user.password).toBeUndefined();
  });

  it('should reject profile access without valid authentication token (401)', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Not authorized/i);
  });

  it('should update profile information (PUT /api/auth/profile) for authenticated user', async () => {
    const res = await request(app)
      .put('/api/auth/profile')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        name: 'Profile Owner Updated',
        phone: '9998887776'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.name).toBe('Profile Owner Updated');
    expect(res.body.user.phone).toBe('9998887776');

    // Confirm changes in database
    const dbUser = await User.findById(user._id);
    expect(dbUser.name).toBe('Profile Owner Updated');
    expect(dbUser.phone).toBe('9998887776');
  });

  it('should reject password change when current password is incorrect (400)', async () => {
    const res = await request(app)
      .put('/api/auth/change-password')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        currentPassword: 'wrong_current_password',
        newPassword: 'newBrandPassword2026!'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Current password is incorrect/i);
  });

  it('should successfully update password when valid current password is provided (200)', async () => {
    const res = await request(app)
      .put('/api/auth/change-password')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        currentPassword: rawPassword,
        newPassword: 'newBrandPassword2026!'
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/Password updated successfully/i);

    // Verify login works with the new password
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'profile_test@eventhub.test',
        password: 'newBrandPassword2026!'
      });

    expect(loginRes.statusCode).toBe(200);
    expect(loginRes.body.success).toBe(true);
    expect(loginRes.body.token).toBeDefined();
  });
});
