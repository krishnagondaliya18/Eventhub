const mongoose = require('mongoose');
const dotenv   = require('dotenv');
const dns      = require('dns');
const User     = require('./models/User');
const Event    = require('./models/Event');

dns.setServers(['8.8.8.8', '1.1.1.1']);
dotenv.config();

async function test() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected.');

    // 1. Find or create an organizer user
    let organizer = await User.findOne({ email: 'testorganizer@eventhub.com' });
    if (!organizer) {
      organizer = await User.create({
        name: 'Test Organizer',
        email: 'testorganizer@eventhub.com',
        password: 'password123',
        role: 'organizer',
        phone: '9876543210'
      });
      console.log('Created test organizer:', organizer.email, organizer._id);
    } else {
      console.log('Found test organizer:', organizer.email, organizer._id);
    }

    // 2. Simulate Organizer creating an event
    const newEvent = await Event.create({
      title: 'Surat Garba Mahotsav 2026',
      description: 'Grand Navratri Garba Celebration in Surat with traditional beats and orchestra.',
      category: 'Music',
      date: new Date('2026-10-15T19:00:00.000Z'),
      location: 'Surat International Exhibition Centre, Sarsana, Surat',
      price: 500,
      totalTickets: 1000,
      availableTickets: 1000,
      image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800',
      organizer: organizer._id,
      status: 'pending'
    });

    console.log(`Created pending event: "${newEvent.title}" (ID: ${newEvent._id}) with status "${newEvent.status}"`);

    // 3. Verify organizer's created events query
    const myEvents = await Event.find({ organizer: organizer._id });
    console.log(`Organizer has ${myEvents.length} events. Status of latest: ${myEvents[0].status}`);

    // 4. Verify Admin pending events query
    const pendingEvents = await Event.find({ status: 'pending' }).populate('organizer', 'name email');
    console.log(`Admin pending query found ${pendingEvents.length} pending events:`);
    pendingEvents.forEach(e => console.log(` - [${e._id}] "${e.title}" by ${e.organizer?.name} (${e.organizer?.email})`));

    // 5. Simulate Admin Approval
    newEvent.status = 'active';
    await newEvent.save();
    console.log(`Admin approved event "${newEvent.title}". Status is now: "${newEvent.status}"`);

    // 6. Verify event is now active and live in public query
    const publicEvents = await Event.find({ status: 'active', _id: newEvent._id });
    console.log(`Public active query found event: ${publicEvents.length > 0 ? 'YES (Live!)' : 'NO'}`);

    console.log('\nALL DATABASE OPERATIONS COMPLETED SUCCESSFULLY!');
    process.exit(0);
  } catch (err) {
    console.error('Test Error:', err);
    process.exit(1);
  }
}

test();
