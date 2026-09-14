const Booking = require('../models/Booking');
const Event   = require('../models/Event');
const { sendEventReminderEmail } = require('./mailer');

/**
 * Checks for upcoming events scheduled within the next 24-48 hours (tomorrow)
 * and sends reminder emails with QR passes to all confirmed attendees.
 */
async function checkAndSendReminders() {
  try {
    const now = new Date();
    // 24 to 48 hours ahead window
    const windowStart = new Date(now.getTime() + 18 * 60 * 60 * 1000); // 18h ahead
    const windowEnd   = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48h ahead

    const upcomingEvents = await Event.find({
      date: { $gte: windowStart, $lte: windowEnd },
      status: 'active'
    });

    if (upcomingEvents.length === 0) {
      return { success: true, count: 0, message: 'No events scheduled for tomorrow.' };
    }

    let sentCount = 0;
    for (const event of upcomingEvents) {
      const bookings = await Booking.find({
        event: event._id,
        status: 'confirmed',
        reminderSent: { $ne: true }
      }).populate('user', 'name email phone');

      for (const booking of bookings) {
        try {
          const res = await sendEventReminderEmail({
            booking,
            event,
            user: booking.user
          });

          if (res?.sent) {
            booking.reminderSent = true;
            await booking.save();
            sentCount++;
            console.log(`[REMINDER SENT] Successfully notified ${booking.user?.email} for "${event.title}"`);
          }
        } catch (mailErr) {
          console.error(`[REMINDER ERROR] Failed for booking ${booking.bookingId}:`, mailErr.message);
        }
      }
    }

    return {
      success: true,
      eventsChecked: upcomingEvents.length,
      remindersSent: sentCount
    };
  } catch (err) {
    console.error('[REMINDER SCHEDULER ERROR]', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Initializes the reminder scheduler loop.
 * Runs on server start and repeats every 30 minutes.
 */
function startReminderScheduler() {
  console.log('⏰ Event Reminder Scheduler initialized (running every 30 mins)');
  // Run initial check after 10 seconds
  setTimeout(() => {
    checkAndSendReminders();
  }, 10000);

  // Periodic check every 30 minutes
  setInterval(() => {
    checkAndSendReminders();
  }, 30 * 60 * 1000);
}

module.exports = {
  checkAndSendReminders,
  startReminderScheduler
};
