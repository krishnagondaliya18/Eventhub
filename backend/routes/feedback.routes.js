const express  = require('express');
const router   = express.Router();
const Feedback = require('../models/Feedback');
const { protect, adminOnly } = require('../middleware/auth');

// POST /api/feedback — create (user)
router.post('/', protect, async (req, res) => {
  try {
    const { subject, message, rating, eventId } = req.body;
    if (!message) return res.status(400).json({ success: false, message: 'Message is required' });

    const item = await Feedback.create({
      user:    req.user._id,
      event:   eventId || null,
      name:    req.user.name,
      email:   req.user.email,
      subject: subject || 'General Feedback',
      message,
      rating:  rating || 5,
      type:    'feedback'
    });
    res.status(201).json({ success: true, item });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/feedback/my — current user's feedbacks
router.get('/my', protect, async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ user: req.user._id, type: 'feedback' }).sort({ createdAt: -1 });
    res.json({ success: true, feedbacks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/feedback/:id — edit own feedback
router.put('/:id', protect, async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) return res.status(404).json({ success: false, message: 'Feedback not found' });
    if (feedback.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Permission denied' });
    }
    const { subject, message, rating } = req.body;
    if (subject) feedback.subject = subject;
    if (message) feedback.message = message;
    if (rating)  feedback.rating  = rating;
    await feedback.save();
    res.json({ success: true, item: feedback });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/feedback/:id — delete own feedback (or admin)
router.delete('/:id', protect, async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) return res.status(404).json({ success: false, message: 'Feedback not found' });
    if (feedback.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Permission denied' });
    }
    await Feedback.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Feedback deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/feedback — admin: all feedbacks
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const feedbacks = await Feedback.find({ type: 'feedback' }).sort({ createdAt: -1 });
    res.json({ success: true, feedbacks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/feedback/:id/resolve — admin: mark resolved
router.put('/:id/resolve', protect, adminOnly, async (req, res) => {
  try {
    const feedback = await Feedback.findByIdAndUpdate(req.params.id, { status: 'resolved' }, { new: true });
    res.json({ success: true, feedback });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
