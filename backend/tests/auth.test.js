const request = require('supertest');
const app = require('../app');
const { connectTestDB, clearTestDB, closeTestDB, createTestUser } = require('./setup');
const User = require('../models/User');

beforeAll(async () => {
  await connectTestDB();
});

afterEach(async () => {
  await clearTestDB();
});

afterAll(async () => {
  await closeTestDB();
});

describe('Authentication API (/api/auth)', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user with valid details and return 201 with JWT token', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Jane Doe',
          email: 'janedoe@example.com',
          password: 'securepassword123',
          phone: '9988776655',
          role: 'user'
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe('janedoe@example.com');
      expect(res.body.user.role).toBe('user');
      expect(res.body.user.password).toBeUndefined(); // password should be sanitized in toJSON
    });

    it('should reject registration with a duplicate email and return 400', async () => {
      await User.create({
        name: 'Existing User',
        email: 'duplicate@example.com',
        password: 'password123'
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Another User',
          email: 'duplicate@example.com',
          password: 'newpassword123'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already registered/i);
    });

    it('should reject registration if required fields like name are missing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'noname@example.com',
          password: 'password123'
        });

      expect(res.statusCode).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials and return 200 with JWT token', async () => {
      const { user, rawPassword } = await createTestUser('user', {
        email: 'login_success@example.com'
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login_success@example.com',
          password: rawPassword
        });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe('login_success@example.com');
    });

    it('should reject login with incorrect password and return 401', async () => {
      await createTestUser('user', { email: 'wrongpass@example.com' });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'wrongpass@example.com',
          password: 'thisisnotthepassword'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Invalid email or password/i);
    });

    it('should reject login with non-existent email and return 401', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'doesnotexist@example.com',
          password: 'anyPassword123'
        });

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Invalid email or password/i);
    });

    it('should reject login when missing email or password and return 400', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'onlyemail@example.com'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Provide email and password/i);
    });
  });

  describe('Protected API Requests & JWT Authentication', () => {
    it('should reject access to protected endpoint without Authorization header (401)', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Not authorized/i);
    });

    it('should reject access with an invalid/malformed token (401)', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid_random_token_string');

      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Token invalid/i);
    });

    it('should accept valid JWT authentication and return current user details (200)', async () => {
      const { user, token } = await createTestUser('user', {
        name: 'Verified User',
        email: 'verified@example.com'
      });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.user).toBeDefined();
      expect(res.body.user._id).toBe(user._id.toString());
      expect(res.body.user.email).toBe('verified@example.com');
    });
  });
});
