const mongoose = require('mongoose');
const dotenv   = require('dotenv');
const dns      = require('dns');
const User     = require('./models/User');
const Event    = require('./models/Event');

dns.setServers(['8.8.8.8', '1.1.1.1']);

dotenv.config();

const sampleEvents = [
  {
    title: 'Global AI & Robotics Summit 2026',
    description: 'Immerse yourself in the future of Artificial Intelligence, generative models, autonomous robotics, and neural computing with keynote sessions from industry leaders and live interactive exhibitions.',
    category: 'Technology',
    date: new Date('2026-09-15T09:00:00Z'),
    endDate: new Date('2026-09-16T18:00:00Z'),
    location: 'Jio World Convention Centre, BKC, Mumbai',
    address: 'G Block, Bandra Kurla Complex, Bandra East, Mumbai, Maharashtra 400051',
    image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80',
    price: 1499,
    isFree: false,
    totalTickets: 600,
    availableTickets: 540,
    status: 'active',
    tags: ['ai', 'robotics', 'technology', 'innovation'],
    isOnline: false
  },
  {
    title: 'Sunburn Arena EDM Night 2026',
    description: 'Experience electrifying beats and spectacular lasers featuring top international and Indian DJs. Dance the night away under vibrant festival vibes with food stalls and chill zones.',
    category: 'Music',
    date: new Date('2026-09-20T17:00:00Z'),
    endDate: new Date('2026-09-20T23:30:00Z'),
    location: 'Vagator Beachfront, North Goa',
    address: 'Vagator Beach Road, Anjuna, Goa 403509',
    image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1200&q=80',
    price: 1999,
    isFree: false,
    totalTickets: 1500,
    availableTickets: 1280,
    status: 'active',
    tags: ['edm', 'music', 'concert', 'party', 'festival'],
    isOnline: false
  },
  {
    title: 'IPL Big Screen Fan Park & Live Screening',
    description: 'Watch the high-voltage IPL rivalry on a giant stadium-size 4K LED screen with stadium-like surround sound, cheer squads, food trucks, and fun cricket trivia games.',
    category: 'Sports',
    date: new Date('2026-09-26T18:30:00Z'),
    endDate: new Date('2026-09-26T23:00:00Z'),
    location: 'VR Mall Lawn, Surat',
    address: 'Dumas Road, Magdalla, Surat, Gujarat 395007',
    image: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=1200&q=80',
    price: 299,
    isFree: false,
    totalTickets: 800,
    availableTickets: 695,
    status: 'active',
    tags: ['cricket', 'ipl', 'sports', 'fans'],
    isOnline: false
  },
  {
    title: 'Laugh Out Loud: All-Star Standup Comedy Night',
    description: 'An evening of non-stop laughter featuring premier stand-up comics delivering fresh punchlines on modern life, tech culture, relationships, and everyday chaos.',
    category: 'Films',
    date: new Date('2026-10-02T19:30:00Z'),
    endDate: new Date('2026-10-02T22:00:00Z'),
    location: 'Canvas Laugh Club, Lower Parel, Mumbai',
    address: 'High Street Phoenix, Senapati Bapat Marg, Lower Parel, Mumbai 400013',
    image: 'https://images.unsplash.com/photo-1585699324551-f6c309eedeca?auto=format&fit=crop&w=1200&q=80',
    price: 699,
    isFree: false,
    totalTickets: 250,
    availableTickets: 210,
    status: 'active',
    tags: ['comedy', 'standup', 'laughter', 'nightlife'],
    isOnline: false
  },
  {
    title: 'Craft Beer & Gourmet Food Truck Fiesta',
    description: 'Delight your taste buds with 40+ artisan food stalls, smoky barbecue grills, authentic street delicacies, handcrafted desserts, and microbrewery tasting sessions.',
    category: 'Food',
    date: new Date('2026-10-08T12:00:00Z'),
    endDate: new Date('2026-10-09T22:00:00Z'),
    location: 'Sabarmati Riverfront Event Ground, Ahmedabad',
    address: 'Behind Tagor Hall, Paldi, Ahmedabad, Gujarat 380006',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80',
    price: 199,
    isFree: false,
    totalTickets: 2000,
    availableTickets: 1850,
    status: 'active',
    tags: ['food', 'foodie', 'bbq', 'craftbeer', 'festival'],
    isOnline: false
  },
  {
    title: 'National Startup Pitch & Angel Investor Conclave',
    description: 'Connect with over 100+ active venture capitalists, angel networks, and serial entrepreneurs. Pitch your innovative product, gain mentorship, and unlock scaling opportunities.',
    category: 'Business',
    date: new Date('2026-10-14T09:30:00Z'),
    endDate: new Date('2026-10-14T18:00:00Z'),
    location: 'Sheraton Grand, Whitefield, Bengaluru',
    address: 'Prestige Shantiniketan, Hoodi, Whitefield, Bengaluru, Karnataka 560048',
    image: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=1200&q=80',
    price: 2499,
    isFree: false,
    totalTickets: 400,
    availableTickets: 330,
    status: 'active',
    tags: ['business', 'startups', 'funding', 'networking', 'entrepreneurship'],
    isOnline: false
  },
  {
    title: 'Contemporary Canvas & Modern Art Gallery Expo',
    description: 'Explore breathtaking oil paintings, interactive digital installations, modern sculptures, and live portrait painting by acclaimed national and international contemporary artists.',
    category: 'Art',
    date: new Date('2026-10-18T10:00:00Z'),
    endDate: new Date('2026-10-22T20:00:00Z'),
    location: 'Jehangir Art Gallery, Kala Ghoda, Mumbai',
    address: '161B, Mahatma Gandhi Road, Kala Ghoda, Fort, Mumbai, Maharashtra 400001',
    image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1200&q=80',
    price: 0,
    isFree: true,
    totalTickets: 500,
    availableTickets: 480,
    status: 'active',
    tags: ['art', 'painting', 'exhibition', 'sculpture', 'gallery'],
    isOnline: false
  },
  {
    title: 'Full-Stack Web3 & AI 36-Hour Hackathon',
    description: 'Form teams of 2-4 and build groundbreaking decentralised apps and generative AI agents. Win prizes worth 5 Lakhs, cloud credits, and direct interview opportunities.',
    category: 'Technology',
    date: new Date('2026-10-24T08:00:00Z'),
    endDate: new Date('2026-10-25T20:00:00Z'),
    location: 'IIT Bombay Tech Campus, Powai, Mumbai',
    address: 'Main Gate Rd, IIT Area, Powai, Mumbai, Maharashtra 400076',
    image: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=1200&q=80',
    price: 0,
    isFree: true,
    totalTickets: 300,
    availableTickets: 260,
    status: 'active',
    tags: ['hackathon', 'coding', 'web3', 'ai', 'developer'],
    isOnline: false
  },
  {
    title: 'Sufi & Classical Fusion Heritage Night',
    description: 'An enchanting musical evening under the stars with heartfelt Qawwalis, soul-stirring flute melodies, and tabla jugalbandi celebrating rich Indian classical heritage.',
    category: 'Music',
    date: new Date('2026-11-01T18:30:00Z'),
    endDate: new Date('2026-11-01T22:30:00Z'),
    location: 'Qutub Minar Amphitheatre, New Delhi',
    address: 'Seth Sarai, Mehrauli, New Delhi, Delhi 110030',
    image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80',
    price: 899,
    isFree: false,
    totalTickets: 500,
    availableTickets: 420,
    status: 'active',
    tags: ['sufi', 'music', 'heritage', 'classical', 'acoustic'],
    isOnline: false
  },
  {
    title: 'International Independent Short Film Gala',
    description: 'Premieres of hand-selected international short films and documentaries across drama, sci-fi, and animation followed by live Q&A sessions with directors and cinematographers.',
    category: 'Films',
    date: new Date('2026-11-07T14:00:00Z'),
    endDate: new Date('2026-11-08T22:00:00Z'),
    location: 'NCPA Godrej Dance Theatre, Nariman Point, Mumbai',
    address: 'NCPA Marg, Nariman Point, Mumbai, Maharashtra 400021',
    image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1200&q=80',
    price: 450,
    isFree: false,
    totalTickets: 350,
    availableTickets: 305,
    status: 'active',
    tags: ['cinema', 'film', 'filmmaking', 'screening', 'director'],
    isOnline: false
  },
  {
    title: 'Pro Night Football 5v5 Turf Championship',
    description: 'Gear up for the city fastest knockout football championship on floodlit FIFA-certified turf grounds. Cash pool prizes, trophies, jerseys, and energy refreshments included.',
    category: 'Sports',
    date: new Date('2026-11-14T16:00:00Z'),
    endDate: new Date('2026-11-15T22:00:00Z'),
    location: 'Urban Turf Arena, Adajan, Surat',
    address: 'Opposite LP Savani School, Pal, Surat, Gujarat 395009',
    image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80',
    price: 1200,
    isFree: false,
    totalTickets: 64,
    availableTickets: 52,
    status: 'active',
    tags: ['football', 'tournament', 'sports', 'turf', 'fitness'],
    isOnline: false
  },
  {
    title: 'Space & Astro-Physics Exploration Expo',
    description: 'Peer into deep space nebulae with high-powered digital telescopes, attend astrophysicist lectures on black holes and exoplanets, and explore interactive VR planetarium shows.',
    category: 'Science',
    date: new Date('2026-11-20T17:00:00Z'),
    endDate: new Date('2026-11-21T21:00:00Z'),
    location: 'Gujarat Science City, S.G. Highway, Ahmedabad',
    address: 'Science City Rd, Sola, Ahmedabad, Gujarat 380060',
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
    price: 250,
    isFree: false,
    totalTickets: 750,
    availableTickets: 670,
    status: 'active',
    tags: ['science', 'space', 'astronomy', 'astrophysics', 'planetarium'],
    isOnline: false
  },
  {
    title: 'Neon Glow Electro Music & Pool Carnival',
    description: 'An epic sunset-to-midnight pool fiesta featuring neon body paint artists, pulsating deep house tracks, glowing mocktail bars, and floating pool loungers.',
    category: 'Parties',
    date: new Date('2026-11-28T16:00:00Z'),
    endDate: new Date('2026-11-28T23:59:00Z'),
    location: 'The Leela Palace Poolside Terrace, Bengaluru',
    address: '23, HAL Old Airport Rd, HAL 2nd Stage, Kodihalli, Bengaluru 560008',
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1200&q=80',
    price: 1599,
    isFree: false,
    totalTickets: 400,
    availableTickets: 310,
    status: 'active',
    tags: ['party', 'neon', 'poolparty', 'dj', 'nightlife'],
    isOnline: false
  },
  {
    title: 'Street Photography Masterclass & Photowalk',
    description: 'Learn framing, dramatic lighting, candid portraiture, and golden hour street compositions guided by National Geographic contributors in historic Old City alleys.',
    category: 'Art',
    date: new Date('2026-12-05T06:30:00Z'),
    endDate: new Date('2026-12-05T12:00:00Z'),
    location: 'Bhadra Fort & Heritage Walkways, Ahmedabad',
    address: 'Court Rd, Bhadra, Ahmedabad, Gujarat 380001',
    image: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?auto=format&fit=crop&w=1200&q=80',
    price: 499,
    isFree: false,
    totalTickets: 50,
    availableTickets: 38,
    status: 'active',
    tags: ['photography', 'art', 'photowalk', 'camera', 'workshop'],
    isOnline: false
  },
  {
    title: 'Mastering Italian & Artisan Baking Workshop',
    description: 'Hands-on culinary masterclass teaching sourdough fermentation techniques, hand-stretched wood-fired pizzas, handmade tagliatelle pasta, and authentic classic tiramisu.',
    category: 'Food',
    date: new Date('2026-12-12T11:00:00Z'),
    endDate: new Date('2026-12-12T16:00:00Z'),
    location: 'Culinary Craft Studio, Powai, Mumbai',
    address: 'Galleria Shopping Mall, Hiranandani Gardens, Powai, Mumbai 400076',
    image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1200&q=80',
    price: 1850,
    isFree: false,
    totalTickets: 30,
    availableTickets: 22,
    status: 'active',
    tags: ['cooking', 'baking', 'food', 'pizza', 'workshop'],
    isOnline: false
  },
  {
    title: 'Cloud DevOps & Kubernetes Architecture Masterclass',
    description: 'Deep dive into microservices orchestration, CI/CD pipelines, GitOps with ArgoCD, and multi-region AWS resilience with senior Principal Cloud Engineers.',
    category: 'Technology',
    date: new Date('2026-12-19T10:00:00Z'),
    endDate: new Date('2026-12-19T17:00:00Z'),
    location: 'Online Live Interactive Webinar',
    address: 'Zoom HD Live Stream Link provided on booking',
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
    price: 799,
    isFree: false,
    totalTickets: 1000,
    availableTickets: 890,
    status: 'active',
    tags: ['cloud', 'devops', 'kubernetes', 'aws', 'docker'],
    isOnline: true
  },
  {
    title: 'Morning Yoga, Mindfulness & Sound Bath Retreat',
    description: 'Rejuvenate your mind and soul with guided Vinyasa flow, pranayama breathwork, Tibetan singing bowl sound healing, and a healthy organic sattvic brunch.',
    category: 'Other',
    date: new Date('2026-12-27T06:30:00Z'),
    endDate: new Date('2026-12-27T11:00:00Z'),
    location: 'Dumas Seaview Greens, Dumas, Surat',
    address: 'Near Old Dumas Beach, Surat, Gujarat 395007',
    image: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=1200&q=80',
    price: 399,
    isFree: false,
    totalTickets: 80,
    availableTickets: 68,
    status: 'active',
    tags: ['yoga', 'wellness', 'meditation', 'mindfulness', 'health'],
    isOnline: false
  },
  {
    title: 'New Year Grand Countdown Masquerade Gala 2027',
    description: 'Ring in the New Year with a black-tie masquerade ball, multi-cuisine 5-star buffet banquet, live celebrity bands, champagne toasts, and fireworks show at midnight.',
    category: 'Parties',
    date: new Date('2026-12-31T20:00:00Z'),
    endDate: new Date('2027-01-01T02:00:00Z'),
    location: 'Grand Hyatt Grand Ballroom, Santacruz East, Mumbai',
    address: 'Bandrakurla Complex Vicinity, Off Western Express Hwy, Santacruz East, Mumbai 400055',
    image: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1200&q=80',
    price: 3499,
    isFree: false,
    totalTickets: 800,
    availableTickets: 690,
    status: 'active',
    tags: ['newyear', 'party', 'gala', 'celebration', 'dance', 'fireworks'],
    isOnline: false
  }
];

async function seed() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB.');

    let admin = await User.findOne({ role: 'admin' });
    if (!admin) {
      console.log('Creating Admin User...');
      admin = await User.create({
        name: 'Admin User',
        email: 'admin@eventhub.com',
        password: 'admin123',
        role: 'admin',
        phone: '9999999999',
        department: 'IT',
        year: '4'
      });
    }

    console.log(`Admin found/created: ${admin.email} (${admin._id})`);

    const eventsWithOrganizer = sampleEvents.map(e => ({
      ...e,
      organizer: admin._id
    }));

    console.log('Removing old events to refresh with 18 high-definition events...');
    await Event.deleteMany({});

    const inserted = await Event.insertMany(eventsWithOrganizer);
    console.log(`SUCCESS: Successfully inserted ${inserted.length} premium events into EventHub database!`);

    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
}

seed();
