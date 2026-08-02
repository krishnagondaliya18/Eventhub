const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
};

let queries = [];
let idCounter = 1;

// POST /api/queries
router.post('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id || req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const { subject, message, category } = req.body;
    const query = {
      _id: idCounter++,
      name: user.name, email: user.email, userId: user._id,
      subject, message, category: category || 'General',
      status: 'open', reply: null, createdAt: new Date()
    };
    queries.push(query);
    res.status(201).json({ success: true, query });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/queries/my
router.get('/my', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id || req.user._id);
    const userQueries = queries
      .filter(q => q.email === user.email)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ success: true, queries: userQueries });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/queries - admin
router.get('/', auth, async (req, res) => {
  try {
    res.json({ success: true, queries: [...queries].sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt)) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/queries/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id || req.user._id);
    const idx = queries.findIndex(q => q._id == req.params.id);
    if (idx === -1) return res.status(404).json({ message: 'Query not found' });
    // ફક્ત owner delete કરી શકે
    if (queries[idx].email !== user.email && user.role !== 'admin') {
      return res.status(403).json({ message: 'Permission denied' });
    }
    queries.splice(idx, 1);
    res.json({ success: true, message: 'Query deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/queries/:id/reply - admin
router.put('/:id/reply', auth, async (req, res) => {
  try {
    const query = queries.find(q => q._id == req.params.id);
    if (!query) return res.status(404).json({ message: 'Query not found' });
    query.reply = req.body.reply;
    query.status = 'resolved';
    res.json({ success: true, query });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;