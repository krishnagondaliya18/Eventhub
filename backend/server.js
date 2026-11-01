const app       = require('./app');
const dotenv    = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

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

// ── Event Reminder System (Previous Day / 24h prior notification) ──
const { startReminderScheduler } = require('./utils/reminderScheduler');
startReminderScheduler();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`EventHub Server running on http://localhost:${PORT}`));
