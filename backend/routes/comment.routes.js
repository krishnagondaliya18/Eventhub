const express = require('express');
const router  = express.Router();
const Comment = require('../models/Comment');
const { protect } = require('../middleware/auth');

// GET /api/comments/:eventId — get all comments for event
router.get('/:eventId', async (req, res) => {
  try {
    const comments = await Comment.find({ event: req.params.eventId })
      .populate('user', 'name')
      .sort({ createdAt: -1 });
    res.json({ success: true, comments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/comments/:eventId — add comment
router.post('/:eventId', protect, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ success: false, message: 'Comment text required' });

    const comment = await Comment.create({
      event: req.params.eventId,
      user:  req.user._id,
      text:  text.trim()
    });
    const populated = await Comment.findById(comment._id).populate('user', 'name');
    res.status(201).json({ success: true, comment: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/comments/:id — edit own comment
router.put('/:id', protect, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });
    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Permission denied' });
    }
    comment.text   = req.body.text.trim();
    comment.edited = true;
    await comment.save();
    const populated = await Comment.findById(comment._id).populate('user', 'name');
    res.json({ success: true, comment: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/comments/:id — delete own comment (or admin)
router.delete('/:id', protect, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });
    if (comment.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Permission denied' });
    }
    await Comment.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Comment deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
