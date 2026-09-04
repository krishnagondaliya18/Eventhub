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

// GET /api/events/my/created — organizer's own events
router.get('/my/created', protect, async (req, res) => {
  try {
    const events = await Event.find({ organizer: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, events });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/events — public (only active/approved events by default)
router.get('/', async (req, res) => {
  try {
    await syncEventStatus(); // instant check on every list fetch
    const { category, status, search, isFree, isOnline, page = 1, limit = 10 } = req.query;
    const filter = {};
    if (category) filter.category = category;
    
    // Default public search to active events only unless explicitly querying all
    if (status && (status === 'all' || status === 'any')) {
      // no status filter
    } else if (status) {
      filter.status = status;
    } else {
      filter.status = 'active';
    }

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

// POST /api/events — Organizer or Admin
router.post('/', protect, async (req, res) => {
  try {
    const isOrganizer = req.user.role === 'organizer';
    const isAdmin = req.user.role === 'admin';
    if (!isOrganizer && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Organizer or Admin access required to create events' });
    }

    // Organizers submit with 'pending' status; Admins can set active directly
    const initialStatus = isAdmin ? (req.body.status || 'active') : 'pending';

    const event = await Event.create({
      ...req.body,
      organizer: req.user._id,
      status: initialStatus
    });

    res.status(201).json({
      success: true,
      event,
      message: isOrganizer ? 'Event submitted successfully! Awaiting Admin approval.' : 'Event created successfully.'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/events/:id/status — Admin Approve / Reject
router.put('/:id/status', protect, adminOnly, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'pending', 'rejected', 'draft', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid event status' });
    }
    const event = await Event.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, message: `Event status updated to ${status}`, event });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/events/:id — Admin or Event Owner
router.put('/:id', protect, async (req, res) => {
  try {
    const existing = await Event.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Event not found' });

    const isAdmin = req.user.role === 'admin';
    const isOwner = existing.organizer && existing.organizer.toString() === req.user._id.toString();

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this event' });
    }

    // If organizer edits, require re-approval
    const updateData = { ...req.body };
    if (!isAdmin) {
      updateData.status = 'pending';
    }

    const event = await Event.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true });
    res.json({ success: true, event, message: !isAdmin ? 'Event updated and sent for Admin review.' : 'Event updated.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/events/:id — Admin or Event Owner
router.delete('/:id', protect, async (req, res) => {
  try {
    const existing = await Event.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Event not found' });

    const isAdmin = req.user.role === 'admin';
    const isOwner = existing.organizer && existing.organizer.toString() === req.user._id.toString();

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this event' });
    }

    await Event.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Event deleted successfully' });
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