const express   = require('express');
const cors      = require('cors');
const dotenv    = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();

app.use(cors({ origin: 'http://localhost:4200', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth',     require('./routes/auth.routes'));
app.use('/api/events',   require('./routes/events.routes'));
app.use('/api/admin',    require('./routes/admin.routes'));
app.use('/api/feedback', require('./routes/feedback.routes'));
app.use('/api/queries',  require('./routes/queries.routes'));
app.use('/api/bookings', require('./routes/booking.routes'));
app.use('/api/comments', require('./routes/comment.routes'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'EventHub API running' }));

// Seed
app.get('/api/seed', async (req, res) => {
  try {
    const User  = require('./models/User');
    const Event = require('./models/Event');

    const adminExists = await User.findOne({ email: 'admin@eventhub.com' });
    if (!adminExists) {
      await User.create({
        name: 'Admin User', email: 'admin@eventhub.com',
        password: 'admin123', role: 'admin',
        phone: '9999999999', department: 'IT', year: '4'
      });
    }

    const eventsCount = await Event.countDocuments();
    if (eventsCount === 0) {
      const admin = await User.findOne({ role: 'admin' });
      const sampleEvents = [
        { title: 'Watching IPL in Theatre', description: 'Watch IPL RCB VS SRH with fellow cricket fans.', category: 'Sports', date: new Date('2026-06-08'), location: 'VR Mall Surat', price: 999, totalTickets: 1000, availableTickets: 1000, image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800', organizer: admin._id, status: 'active', tags: ['cricket', 'ipl', 'sports'] },
        { title: 'AI Summit', description: 'Explore cutting-edge AI demos, robotics, AR/VR.', category: 'Technology', date: new Date('2026-06-09'), location: 'Jio Conventional Center Mumbai', price: 1999, totalTickets: 500, availableTickets: 500, image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800', organizer: admin._id, status: 'active' },
        { title: 'Melody Mania', description: 'Free entry music showcase for emerging artists', category: 'Music', date: new Date('2026-06-24'), location: 'Mumbai', isFree: true, price: 0, totalTickets: 200, availableTickets: 200, image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800', organizer: admin._id, status: 'active' },
      ];
      await Event.insertMany(sampleEvents);
    }

    res.json({ success: true, message: 'Seeded: admin@eventhub.com / admin123' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Auto-complete past events every 10 seconds ──
const autoCompleteEvents = async () => {
  try {
    const Event = require('./models/Event');
    await Event.updateMany(
      { date: { $lt: new Date() }, status: 'active' },
      { $set: { status: 'completed' } }
    );
  } catch (err) {
    console.error('Auto-complete error:', err.message);
  }
};

autoCompleteEvents();
setInterval(autoCompleteEvents, 10 * 1000); // every 10 seconds

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`EventHub Server running on http://localhost:${PORT}`));