const express = require('express');
const router  = express.Router();
const Event   = require('../models/Event');
const Participant = require('../models/Participant');
const { protect, adminOnly } = require('../middleware/auth');

// Helper: auto-complete past events on every request
const syncEventStatus = async () => {
  await Event.updateMany(
    { date: { $lt: new Date() }, status: 'active' },
    { $set: { status: 'completed' } }
  );
};

// GET /api/events — public
router.get('/', async (req, res) => {
  try {
    await syncEventStatus(); // instant check on every list fetch
    const { category, status, search, isFree, isOnline, page = 1, limit = 10 } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (status)   filter.status   = status;
    if (isFree    !== undefined) filter.isFree    = isFree    === 'true';
    if (isOnline  !== undefined) filter.isOnline  = isOnline  === 'true';
    if (search)   filter.title = { $regex: search, $options: 'i' };

    const skip  = (page - 1) * limit;
    const total = await Event.countDocuments(filter);
    const events = await Event.find(filter)
      .populate('organizer', 'name email avatar')
      .sort({ date: 1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({ success: true, total, page: Number(page), events });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/events/:id
router.get('/:id', async (req, res) => {
  try {
    await syncEventStatus(); // instant check on single event fetch
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'name email avatar');
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, event });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/events — admin
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const event = await Event.create({ ...req.body, organizer: req.user._id });
    res.status(201).json({ success: true, event });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/events/:id — admin
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(
      req.params.id, req.body, { new: true, runValidators: true }
    );
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, event });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/events/:id — admin
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/events/:id/register
router.post('/:id/register', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    if (event.availableTickets <= 0) return res.status(400).json({ success: false, message: 'No tickets available' });

    const existing = await Participant.findOne({ user: req.user._id, event: event._id });
    if (existing) return res.status(400).json({ success: false, message: 'Already registered' });

    const totalPaid = event.isFree ? 0 : event.price;
    await Participant.create({ user: req.user._id, event: event._id, totalPaid });
    event.availableTickets -= 1;
    event.participants.push(req.user._id);
    event.revenue += totalPaid;
    await event.save();

    res.json({ success: true, message: 'Registered successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;