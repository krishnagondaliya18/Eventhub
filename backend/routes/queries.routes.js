const express  = require('express');
const router   = express.Router();
const Feedback = require('../models/Feedback');
const { protect, adminOnly } = require('../middleware/auth');

// POST /api/queries — create query
router.post('/', protect, async (req, res) => {
  try {
    const { subject, message, category } = req.body;
    if (!subject || !message) {
      return res.status(400).json({ success: false, message: 'Subject and message are required' });
    }

    const item = await Feedback.create({
      user:    req.user._id,
      name:    req.user.name,
      email:   req.user.email,
      subject: subject,
      message: `[${category || 'General'}] ${message}`,
      rating:  5,
      type:    'query',
      status:  'pending'
    });

    res.status(201).json({ success: true, item });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/queries/my — user's own queries
router.get('/my', protect, async (req, res) => {
  try {
    const queries = await Feedback.find({
      user: req.user._id,
      type: 'query'
    }).sort({ createdAt: -1 });

    res.json({ success: true, queries });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/queries — admin: all queries
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const queries = await Feedback.find({ type: 'query' })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, queries });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/queries/:id — edit own query
router.put('/:id', protect, async (req, res) => {
  try {
    const query = await Feedback.findById(req.params.id);

    if (!query) {
      return res.status(404).json({ success: false, message: 'Query not found' });
    }
    if (query.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Permission denied' });
    }
    if (query.status === 'resolved') {
      return res.status(400).json({ success: false, message: 'Cannot edit resolved query' });
    }

    const { subject, message, category } = req.body;
    if (subject) query.subject = subject;
    if (message) query.message = `[${category || 'General'}] ${message}`;

    await query.save();
    res.json({ success: true, item: query });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/queries/:id — delete own query (or admin)
router.delete('/:id', protect, async (req, res) => {
  try {
    const query = await Feedback.findById(req.params.id);

    if (!query) {
      return res.status(404).json({ success: false, message: 'Query not found' });
    }
    if (
      query.user.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ success: false, message: 'Permission denied' });
    }

    await Feedback.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Query deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/queries/:id/resolve — admin reply & resolve
router.put('/:id/resolve', protect, adminOnly, async (req, res) => {
  try {
    const { adminReply } = req.body;

    const query = await Feedback.findByIdAndUpdate(
      req.params.id,
      {
        status:     'resolved',
        adminReply: adminReply || ''
      },
      { new: true }
    );

    if (!query) {
      return res.status(404).json({ success: false, message: 'Query not found' });
    }

    res.json({ success: true, query });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;