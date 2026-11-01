const mongoose = require('mongoose');
const dns = require('dns');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Configure reliable DNS servers for SRV resolution on Windows
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Ignore if already set or in restricted environment
}

// Test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'eventhub_test_jwt_secret_key_2026';
process.env.JWT_EXPIRE = '1d';
process.env.RAZORPAY_KEY_ID = 'rzp_test_MOCK_KEY_ID';
process.env.RAZORPAY_KEY_SECRET = 'mock_razorpay_secret_123456789';

const TEST_DB_URI = process.env.MONGODB_TEST_URI ||
  'mongodb+srv://gondaliyakishan839_db_user:TEST1234@cluster0.meceppg.mongodb.net/eventhub_automated_tests?appName=Cluster0';

/**
 * Connect to isolated test database
 */
const connectTestDB = async () => {
  try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  } catch (e) {}

  if (mongoose.connection.readyState === 0) {
    try {
      await mongoose.connect(TEST_DB_URI);
    } catch (err) {
      // Retry with brief pause for transient DNS resolution
      await new Promise(r => setTimeout(r, 1500));
      try {
        dns.setServers(['8.8.8.8', '1.1.1.1']);
      } catch (e) {}
      await mongoose.connect(TEST_DB_URI);
    }
  }
};

/**
 * Clean all collections in test database between test suites
 */
const clearTestDB = async () => {
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      try {
        await collections[key].deleteMany({});
      } catch (err) {
        // Ignore collection not found
      }
    }
  }
};

/**
 * Disconnect from test database
 */
const closeTestDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
};

/**
 * Helper to generate test JWT token
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

/**
 * Helper to create a user and return the user document + bearer token
 */
const createTestUser = async (role = 'user', overrides = {}) => {
  const timestamp = Date.now() + Math.random().toString(36).substring(2, 7);
  const userData = {
    name: `Test ${role} ${timestamp}`,
    email: `test_${role}_${timestamp}@eventhub.test`,
    password: 'password123',
    role: role,
    phone: '9876543210',
    ...overrides
  };
  const user = await User.create(userData);
  const token = generateToken(user._id);
  return { user, token, rawPassword: userData.password };
};

// Global mocks for third-party external services
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'mock_mail_id_123' })
  })
}));

jest.mock('razorpay', () => {
  return jest.fn().mockImplementation(() => ({
    orders: {
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
    }
  }));
});

module.exports = {
  connectTestDB,
  clearTestDB,
  closeTestDB,
  generateToken,
  createTestUser,
  TEST_DB_URI
};
