const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Event = require('../models/Event');
const Participant = require('../models/Participant');
const Feedback = require('../models/Feedback');
const { protect, adminOnly } = require('../middleware/auth');

// All admin routes are protected
router.use(protect, adminOnly);

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const [totalUsers, totalEvents, totalParticipants, totalAdmins, feedbackCount, pendingQueries] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Event.countDocuments(),
      Participant.countDocuments(),
      User.countDocuments({ role: 'admin' }),
      Feedback.countDocuments({ type: 'feedback' }),
      Feedback.countDocuments({ type: 'query', status: 'pending' }),
    ]);

    // Revenue stats
    const revenueResult = await Event.aggregate([{ $group: { _id: null, total: { $sum: '$revenue' } } }]);
    const totalRevenue = revenueResult[0]?.total || 0;

    // Events by category
    const eventsByCategory = await Event.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Monthly participants (last 7 months)
    const monthlyData = await Participant.aggregate([
      {
        $group: {
          _id: { month: { $month: '$registeredAt' }, year: { $year: '$registeredAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 7 }
    ]);

    res.json({
      success: true,
      stats: { totalUsers, totalEvents, totalParticipants, totalAdmins, totalRevenue, feedbackCount, pendingQueries },
      eventsByCategory,
      monthlyData
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- USERS ---
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/users', async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.status(201).json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/users/:id', async (req, res) => {
  try {
    const { password, ...data } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, data, { new: true });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- PARTICIPANTS ---
router.get('/participants', async (req, res) => {
  try {
    const participants = await Participant.find()
      .populate('user', 'name email phone department year')
      .populate('event', 'title date location')
      .sort({ registeredAt: -1 });
    res.json({ success: true, participants });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- FEEDBACK & QUERIES ---
router.get('/feedback', async (req, res) => {
  try {
    const { type } = req.query;
    const filter = type ? { type } : {};
    const items = await Feedback.find(filter).populate('event', 'title').sort({ createdAt: -1 });
    res.json({ success: true, items });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/feedback/:id', async (req, res) => {
  try {
    const item = await Feedback.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, item });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
