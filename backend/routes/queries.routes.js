const express  = require('express');
const router   = express.Router();
const Feedback = require('../models/Feedback');
const User     = require('../models/User');
const jwt      = require('jsonwebtoken');
const { protect, adminOnly } = require('../middleware/auth');
const { sendContactNotificationEmail } = require('../utils/mailer');

// POST /api/queries/contact — public contact form submission
router.post('/contact', async (req, res) => {
  try {
    const { name, email, phone, subject, message, category } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: 'Name, email, and message are required' });
    }

    const item = await Feedback.create({
      name:    name.trim(),
      email:   email.trim().toLowerCase(),
      phone:   (phone || '').trim(),
      subject: (subject || 'General Contact Inquiry').trim(),
      message: message.trim(),
      rating:  5,
      type:    'query',
      status:  'pending'
    });

    // Asynchronously dispatch notification email to admin (gondaliyakishan839@gmail.com)
    sendContactNotificationEmail({
      name:     item.name,
      email:    item.email,
      phone:    item.phone,
      subject:  item.subject,
      message:  item.message,
      category: category || 'Contact Inquiry'
    }).catch(err => console.error('[MAIL DISPATCH ERROR]', err.message));

    res.status(201).json({
      success: true,
      message: 'Inquiry submitted successfully! Our team will respond shortly.',
      item
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/queries — create query (supports both logged-in user and guest)
router.post('/', async (req, res) => {
  try {
    let user = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        user = await User.findById(decoded.id);
      } catch (e) {
        // Invalid or expired token; proceed as guest if email provided
      }
    }

    const { subject, message, category, name, email, phone } = req.body;
    const queryName  = user ? user.name : (name || 'Guest User');
    const queryEmail = user ? user.email : (email || '');
    const queryPhone = user ? (user.phone || phone || '') : (phone || '');

    if (!queryEmail || !message) {
      return res.status(400).json({ success: false, message: 'Email and message are required' });
    }

    const item = await Feedback.create({
      user:    user ? user._id : undefined,
      name:    queryName,
      email:   queryEmail,
      phone:   queryPhone,
      subject: subject || 'General Query',
      message: category ? `[${category}] ${message}` : message,
      rating:  5,
      type:    'query',
      status:  'pending'
    });

    // Send email notification to admin (gondaliyakishan839@gmail.com)
    sendContactNotificationEmail({
      name:     item.name,
      email:    item.email,
      phone:    item.phone,
      subject:  item.subject,
      message:  item.message,
      category: category || 'General Query'
    }).catch(err => console.error('[MAIL DISPATCH ERROR]', err.message));

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