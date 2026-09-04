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
    const {
      category,
      status,
      search,
      location,
      budget,
      minPrice,
      maxPrice,
      isFree,
      isOnline,
      page = 1,
      limit = 10
    } = req.query;

    const filter = {};

    // Category filter
    if (category && category !== 'all' && category !== 'All' && category !== 'All Categories') {
      filter.category = category;
    }
    
    // Default public search to active events only unless explicitly querying all
    if (status && (status === 'all' || status === 'any')) {
      // no status filter
    } else if (status) {
      filter.status = status;
    } else {
      filter.status = 'active';
    }

    if (isFree !== undefined && isFree !== '') {
      filter.isFree = isFree === 'true';
    }
    if (isOnline !== undefined && isOnline !== '') {
      filter.isOnline = isOnline === 'true';
    }

    // Location filter
    if (location && location.trim() && location.toLowerCase() !== 'all' && location.toLowerCase() !== 'all locations' && location.toLowerCase() !== 'all cities') {
      filter.location = { $regex: location.trim(), $options: 'i' };
    }

    // Budget / Price filter
    if (budget) {
      if (budget === 'free') {
        filter.isFree = true;
      } else if (budget === 'under500') {
        filter.price = { $lte: 500 };
      } else if (budget === '500-1000') {
        filter.price = { $gte: 500, $lte: 1000 };
      } else if (budget === '1000-2000') {
        filter.price = { $gte: 1000, $lte: 2000 };
      } else if (budget === 'above2000') {
        filter.price = { $gte: 2000 };
      }
    } else if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined && minPrice !== '') filter.price.$gte = Number(minPrice);
      if (maxPrice !== undefined && maxPrice !== '') filter.price.$lte = Number(maxPrice);
      if (Object.keys(filter.price).length === 0) delete filter.price;
    }

    // Multi-field search (title, description, location, category, tags)
    if (search && search.trim()) {
      const q = search.trim();
      const sRegex = new RegExp(q, 'i');
      filter.$or = [
        { title: sRegex },
        { description: sRegex },
        { location: sRegex },
        { category: sRegex },
        { tags: { $in: [sRegex] } }
      ];
    }

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

// GET /api/events/suggestions — quick live autocomplete recommendations
router.get('/suggestions', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || !q.trim()) {
      return res.json({ success: true, suggestions: [] });
    }
    const query = q.trim();
    const searchRegex = new RegExp(query, 'i');
    const filter = {
      status: 'active',
      $or: [
        { title: searchRegex },
        { category: searchRegex },
        { location: searchRegex },
        { tags: { $in: [searchRegex] } }
      ]
    };
    const suggestions = await Event.find(filter)
      .select('title category location date image price isFree')
      .sort({ date: 1 })
      .limit(6);

    res.json({ success: true, suggestions });
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

// POST /api/events — Any authenticated user can host/submit an event for Admin review
router.post('/', protect, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    
    // If regular user hosts an event, automatically set role to 'organizer'
    if (req.user.role === 'user') {
      req.user.role = 'organizer';
      await req.user.save();
    }

    // Non-admin events always start with 'pending' status for admin approval
    const initialStatus = isAdmin ? (req.body.status || 'active') : 'pending';

    const totalTickets = Number(req.body.totalTickets) || 100;
    const availableTickets = req.body.availableTickets !== undefined 
      ? Number(req.body.availableTickets) 
      : totalTickets;

    const event = await Event.create({
      title: req.body.title,
      description: req.body.description,
      category: req.body.category || 'Music',
      date: new Date(req.body.date),
      endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
      location: req.body.location,
      address: req.body.address || '',
      image: req.body.image || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
      price: req.body.isFree ? 0 : (Number(req.body.price) || 0),
      isFree: req.body.isFree === true || req.body.isFree === 'true',
      isOnline: req.body.isOnline === true || req.body.isOnline === 'true',
      totalTickets,
      availableTickets,
      organizer: req.user._id,
      status: initialStatus
    });

    console.log(`[EventHub] Event created by ${req.user.name} (${req.user.role}): "${event.title}" [Status: ${event.status}]`);

    res.status(201).json({
      success: true,
      event,
      userRole: req.user.role,
      message: isAdmin 
        ? 'Event created successfully.' 
        : 'Event submitted successfully! It is now pending Admin approval.'
    });
  } catch (err) {
    console.error('[EventHub] Event creation error:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to create event' });
  }
});

// PUT /api/events/:id/status — Admin (all statuses) or Event Owner (cancel/withdraw)
router.put('/:id/status', protect, async (req, res) => {
  try {
    const { status, reason } = req.body;
    const allowedStatuses = ['active', 'pending', 'rejected', 'draft', 'completed', 'cancelled', 'withdrawn'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid event status' });
    }

    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    const isAdmin = req.user.role === 'admin';
    const isOwner = event.organizer && event.organizer.toString() === req.user._id.toString();

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ success: false, message: 'Not authorized to change status for this event' });
    }

    // Non-admins can only cancel or withdraw their own event
    if (!isAdmin && !['cancelled', 'withdrawn'].includes(status)) {
      return res.status(403).json({ success: false, message: 'Organizers can only cancel or withdraw their own events' });
    }

    event.status = status;
    await event.save();

    const actionName = status === 'withdrawn' ? 'withdrawn' : status === 'cancelled' ? 'cancelled' : status;
    console.log(`[EventHub] ${isAdmin ? 'Admin' : 'Organizer'} ${req.user.name} marked event "${event.title}" as ${status}`);

    res.json({
      success: true,
      message: `Event has been successfully ${actionName}.`,
      event
    });
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