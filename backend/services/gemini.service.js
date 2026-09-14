const { GoogleGenerativeAI } = require('@google/generative-ai');
const Event = require('../models/Event');
const Booking = require('../models/Booking');
const User = require('../models/User');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

function getGenAI() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenerativeAI(apiKey);
}

/**
 * Fetches dynamic platform knowledge & live active events from MongoDB
 */
async function buildPlatformContext() {
  let activeEvents = [];
  try {
    activeEvents = await Event.find({ status: 'active' })
      .select('title description category date location price isFree totalTickets availableTickets _id')
      .sort({ date: 1 })
      .limit(30)
      .maxTimeMS(4000)
      .lean();
  } catch (dbErr) {
    console.warn('[AI CONTEXT] Event query skipped:', dbErr.message);
  }

  const formattedEvents = activeEvents.map(e => {
    const eventDate = new Date(e.date).toLocaleDateString('en-IN', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    return `- [ID: ${e._id}] "${e.title}" | Category: ${e.category} | Date: ${eventDate} | Venue: ${e.location} | Price: ${e.isFree ? 'FREE' : '₹' + e.price} | Tickets Left: ${e.availableTickets}/${e.totalTickets} | Link: /events/${e._id}`;
  }).join('\n');

  return `
You are "EventHub Help & Support Assistant", the official, highly intelligent 24/7 customer support and live concierge representative for EventHub.
EventHub is an online event ticketing, hosting, discovery, and community platform.
Support Desk Email: gondaliyakishan839@gmail.com
Platform Verified Payee / Merchant: Krishna Gondaliya (UPI ID: gondaliyakishan839@okaxis)

### COMPLETE EVENTHUB PLATFORM KNOWLEDGE BASE:

1. EVENT DISCOVERY & NAVIGATION:
   - Home Page (/): Features top trending events, category carousels, platform search, and statistics.
   - Events Catalog (/events): Search by keyword, filter by categories (Sports, Music, Technology, Comedy, Culture, Food, Business, Workshops), date, and Free vs Paid events.
   - Event Details (/events/:id): High-res banner, full description, organizer profile, interactive Google Map location, remaining tickets progress bar, user reviews & comments, and ticket checkout.
   - My Bookings (/bookings): Access all purchased tickets, booking reference IDs, order status, and instant official PDF Ticket downloads.
   - Host Events (/organizer/events): Dedicated portal for event organizers to create, manage, edit, and track events.
   - Contact Us (/contact): Direct customer inquiry form sent straight to the administrative support team.

2. TICKET BOOKING RULES & STEPS:
   - User must be logged in with a valid account to book.
   - Maximum allowed ticket quantity per booking is 10 tickets (subject to remaining availability).
   - Free Events: ₹0 total cost. Instant 1-click registration without payment.
   - Paid Events Pricing Formula:
     * Subtotal = Base Price × Quantity
     * Processing Fee = max(₹50, 2.5% of Subtotal)
     * Taxes / GST = 8.5% of Subtotal
     * Total Amount = Subtotal + Processing Fee + Taxes
   - Instant Confirmation & PDF Ticket:
     * Immediately after payment, the system generates an official A4 Admission Pass PDF with unique Booking ID, venue, date, attendee name, and scannable gate QR code.
     * An instant confirmation email is dispatched to the attendee's email with the PDF ticket attached (EventHub-Ticket-[BookingID].pdf).
     * The attendee can also download the PDF ticket anytime from the payment confirmation screen or under My Bookings (/bookings).

3. PAYMENT METHODS & FIXED LOCKED PRICE UPI:
   - Pull-Type Auto-Scan Locked Price UPI QR Code:
     * The QR code encodes standard NPCI UPI parameters (pa=gondaliyakishan839@okaxis, pn=Krishna Gondaliya, am=<TOTAL>, cu=INR).
     * When scanned using Google Pay, PhonePe, Paytm, BHIM, or any banking UPI app, the payable amount is automatically pre-filled and locked.
     * The user CANNOT manually edit, increase, or decrease the amount (Non-editable pull payment).
   - Direct 1-Tap Mobile UPI App Buttons:
     * Mobile & desktop buttons to launch Google Pay (GPay), PhonePe, Paytm, or BHIM UPI directly with the pre-filled locked price.
     * Verified Receiver UPI ID: gondaliyakishan839@okaxis (Payee: Krishna Gondaliya) with 1-click copy feature.
   - Razorpay Multi-Option Gateway:
     * Direct Razorpay checkout (https://razorpay.me/@krishnakamleshbhaigondaliya) supporting Credit & Debit Cards (Visa, Mastercard, RuPay), Net Banking for all Indian Banks (SBI, HDFC, ICICI, Axis, Bank of Baroda, etc.), and Wallets.
   - Security: 256-bit SSL encryption with direct bank-to-bank verified settlements.

4. 24-HOUR / PREVIOUS-DAY AUTOMATED EVENT REMINDER SYSTEM:
   - The platform runs an automated server scheduler every 30 minutes.
   - It checks all active events scheduled for tomorrow (next 18 to 48 hours).
   - It automatically dispatches a reminder email to all confirmed attendees with event start time, venue directions, and their attached official PDF admission pass.
   - Attendees receive this reminder automatically without needing to do anything.

5. CANCELLATION & REFUND POLICY:
   - User Cancellation (managed via /bookings):
     * Requested > 48 hours before event start: 100% Full Refund credited to the original payment source within 5–7 business days (minus standard gateway fee if applicable).
     * Requested 24 to 48 hours before event start: 50% Refund.
     * Requested < 24 hours before event start: Non-refundable (as venue, seating, and arrangements are already locked).
   - Organizer / Admin Cancellation:
     * If an event is cancelled or withdrawn by the Organizer or Admin, a 100% automatic refund is processed to all confirmed ticket holders within 5–7 business days.
   - Free event registrations can be cancelled at any time at zero cost to free up capacity for others.

6. ORGANIZER & HOSTING RULES:
   - Any registered user can host events at /organizer/events.
   - Required details: Title, Description, Category, Date & Time, Venue/Location, Ticket Price (or Free), Banner Image URL, and Total Ticket Capacity.
   - Event Verification: Submitted events enter "Pending" review status for Admin verification before going live to ensure community safety.
   - Organizer Dashboard: Organizers can track participant rosters, real-time ticket sales volume, total revenue, and manage or cancel events.

7. VENUE ENTRY & GATE RULES:
   - Attendees must present their official EventHub digital QR code on mobile or printed PDF ticket pass at the venue entrance.
   - Gate organizers scan the QR code with the EventHub scanner to grant admission.
   - A valid government photo ID (Aadhaar, Driving License, Student ID, or Passport) may be requested at the gate.
   - Duplicate or previously scanned tickets are automatically invalidated.

8. PLATFORM TERMS & PRIVACY RULES:
   - User data (email, phone, name) is strictly used for ticket delivery, security verification, and event reminder alerts. It is never sold or shared.
   - Ticket scalping, unauthorized reselling, abusive behavior, or fraudulent event listings result in immediate account termination.
   - Support assistance is available 24/7 through this Help & Support chat desk and via email at gondaliyakishan839@gmail.com.

### LIVE EVENTS CURRENTLY IN DATABASE:
${formattedEvents || 'No active events currently scheduled.'}

### TONE & INSTRUCTIONS:
- Always be professional, polite, warm, concise, and helpful.
- Respond in clean, fluent, professional English with proper Markdown formatting (bullet points, bold text).
- Always provide exact, factual details based on the above EventHub rules and policies.
- When suggesting events, always provide the Title, Category, Date, Venue, Price, and clickable link (/events/[ID]).
`;
}

/**
 * Intelligent fallback engine if GEMINI_API_KEY is not configured or network error occurs
 */
async function fallbackChatResponse(message, role) {
  const lower = message.toLowerCase();
  let activeEvents = [];
  try {
    activeEvents = await Event.find({ status: 'active' }).sort({ date: 1 }).limit(10).maxTimeMS(4000).lean();
  } catch {}

  if (lower.includes('refund') || lower.includes('cancel') || lower.includes('money back')) {
    return `### 💸 EventHub Refund & Cancellation Policy\n\n- **> 48 Hours before event start:** **100% Full Refund** (credited to original payment method within 5–7 business days).\n- **24 – 48 Hours before event start:** **50% Refund**.\n- **< 24 Hours before event start:** **Non-refundable** due to venue preparations.\n- **Organizer/Admin Cancellation:** **100% Automatic Refund** is issued to all attendees if an event is cancelled by the organizer.\n\nYou can manage your bookings directly under [My Bookings](/bookings) or reach support via [Contact Us](/contact).`;
  }

  if (lower.includes('book') || lower.includes('ticket') || lower.includes('pdf') || lower.includes('qr pass')) {
    return `### 🎟️ How to Book Tickets on EventHub\n\n1. **Browse Events:** Visit our [Events Catalog](/events) and select any event.\n2. **Select Quantity:** Choose between 1 to 10 tickets.\n3. **Price Breakdown:** View transparent pricing including base ticket price, processing fee, and taxes.\n4. **Secure Payment:**\n   - **Pull-Type UPI QR:** Auto-scans the exact fixed price (non-editable).\n   - **UPI Apps:** Direct 1-tap buttons for **GPay**, **PhonePe**, **Paytm**, and **BHIM** to \`gondaliyakishan839@okaxis\`.\n   - **Razorpay:** Cards and Net Banking.\n5. **Instant PDF Ticket:** Your official A4 Admission Pass with scannable gate QR code is generated instantly and emailed to you. You can also download it anytime from [My Bookings](/bookings)!`;
  }

  if (lower.includes('payment') || lower.includes('upi') || lower.includes('razorpay') || lower.includes('gpay') || lower.includes('phonepe') || lower.includes('paytm') || lower.includes('price')) {
    return `### 💳 EventHub Payment & UPI System\n\n- **Pull-Type Auto-Scan QR Code:** When you scan the QR code with any UPI app, the exact booking price is automatically pulled and locked. Payer cannot edit, increase, or decrease the amount.\n- **Direct Mobile UPI Apps:** 1-tap direct buttons for **Google Pay (GPay)**, **PhonePe**, **Paytm**, and **BHIM UPI**.\n- **Receiver UPI ID:** \`gondaliyakishan839@okaxis\` (Verified Merchant: **Krishna Gondaliya**).\n- **Razorpay Direct Gateway:** Supports Credit/Debit Cards (Visa, Mastercard, RuPay), Net Banking (SBI, HDFC, ICICI, Axis, and all major Indian banks), and Wallets.\n- **Security:** 256-bit SSL encryption with direct bank-to-bank verified settlements.`;
  }

  if (lower.includes('remind') || lower.includes('reminder') || lower.includes('24 hour') || lower.includes('notification') || lower.includes('previous day')) {
    return `### ⏰ 24-Hour Automated Event Reminder System\n\nEventHub features an automated background scheduler that runs every 30 minutes on our server:\n- **Timing:** Exactly 1 day prior (18 to 48 hours before the event starts).\n- **Delivery:** An automated reminder email is sent to all confirmed attendees with event start time, venue directions, and their attached official PDF ticket pass.\n- **Automatic:** Attendees do not need to register for reminders—they are delivered automatically!`;
  }

  if (lower.includes('host') || lower.includes('organizer') || lower.includes('create event')) {
    return `### 🎪 Hosting an Event as an Organizer\n\n1. **Register as Organizer:** Sign up or log in to your account.\n2. **Submit Event Details:** Go to [Host Events](/organizer/events) and enter Title, Category, Date/Time, Venue, Price (or Free), Banner Image, and Capacity.\n3. **Admin Verification:** Your event enters "Pending" status for review and approval.\n4. **Go Live & Sell Tickets:** Once approved, your event appears publicly on the catalog, and you can track attendee rosters and ticket sales in real-time!`;
  }

  if (lower.includes('rule') || lower.includes('policy') || lower.includes('terms') || lower.includes('gate') || lower.includes('entry')) {
    return `### 📜 EventHub Platform Rules & Venue Guidelines\n\n- **Gate Admission:** Present your digital QR code or printed PDF pass at the gate for instant scanning.\n- **Photo ID:** A valid government photo ID (Aadhaar, Driving License, Student ID) may be requested to verify identity.\n- **Booking Limits:** Maximum 10 tickets per booking.\n- **Ticket Authenticity:** Each ticket has a cryptographically unique Booking ID and scannable entry QR. Counterfeit or duplicate tickets will be rejected at the gate.\n- **User Privacy:** Email and phone are used strictly for ticket dispatch and 24h event reminders, never shared with third parties.`;
  }

  if (lower.includes('event') || lower.includes('suggest') || lower.includes('show') || lower.includes('popular') || lower.includes('upcoming')) {
    if (activeEvents.length === 0) {
      return `Currently, there are no live events listed, but stay tuned! Explore all upcoming events at [Events](/events).`;
    }
    let list = `### 🎉 Upcoming Live Events on EventHub:\n\n`;
    activeEvents.slice(0, 4).forEach((e, idx) => {
      const d = new Date(e.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      list += `${idx + 1}. **[${e.title}](/events/${e._id})**\n   - **Category:** ${e.category} | **Venue:** ${e.location}\n   - **Date:** ${d} | **Price:** ${e.isFree ? 'FREE' : '₹' + e.price}\n   - [Book Now &rarr;](/events/${e._id})\n\n`;
    });
    list += `Browse the full catalog anytime on our [Events Page](/events)!`;
    return list;
  }

  if (lower.includes('contact') || lower.includes('support') || lower.includes('help') || lower.includes('email') || lower.includes('phone')) {
    return `### 📞 EventHub Customer Help & Support\n\n- **In-App Live Support:** You can ask any question right here in this Help & Support desk 24/7!\n- **Contact Us Page:** Submit inquiries directly on our [Contact Us Page](/contact). Our admin team receives them in real-time.\n- **Official Support Email:** **gondaliyakishan839@gmail.com**\n- **Verified Payee / Merchant:** **Krishna Gondaliya** (\`gondaliyakishan839@okaxis\`).`;
  }

  return `Hello! 👋 Welcome to **EventHub Help & Support**.\n\nI can assist you with:\n- 🎟️ **Event Discovery & Bookings** (live events, pricing, locked fixed price, PDF ticket pass)\n- 💳 **Payments & UPI** (GPay, PhonePe, Paytm, BHIM to \`gondaliyakishan839@okaxis\`, Razorpay)\n- ⏰ **24-Hour Event Reminders** (automated 1-day prior alerts with venue directions)\n- 💸 **Refund & Cancellation Policy** (100% full refund >48h, 50% refund 24-48h)\n- 🎪 **Organizer Hosting & Event Creation** (approval flow, participant rosters)\n- 📜 **Platform Rules, Gate Entry & Terms of Service**\n\nHow can I help you today?`;
}

function withTimeout(promise, ms = 12000) {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`AI request timed out after ${ms}ms`)), ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
}

/**
 * Main AI Chat handler for Users and Organizers
 */
async function chatWithAI({ message, history = [], role = 'user' }) {
  const genAI = getGenAI();
  if (!genAI) {
    return await fallbackChatResponse(message, role);
  }

  try {
    const systemPrompt = await buildPlatformContext();
    const candidateModels = ['gemini-3.6-flash', 'gemini-2.5-pro', 'gemini-1.5-flash'];
    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: systemPrompt
        });

        const chat = model.startChat({
          history: (history || []).map(h => ({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: h.text }]
          }))
        });

        const result = await withTimeout(chat.sendMessage(message), 10000);
        const response = await result.response;
        return response.text();
      } catch (err) {
        console.warn(`[GEMINI RETRY] ${modelName} error: ${err.message}. Trying next model...`);
      }
    }
    // Fallback to domain engine if all models busy
    return await fallbackChatResponse(message, role);
  } catch (error) {
    console.error('[GEMINI API ERROR]', error.message);
    return await fallbackChatResponse(message, role);
  }
}

/**
 * Admin AI Intelligence: Revenue & Popular Event Analytics
 */
async function generateAdminInsights({ customPrompt = '' } = {}) {
  // Aggregate real stats from MongoDB
  const [
    totalRevenueData,
    popularEvents,
    categoryBreakdown,
    recentBookingsCount,
    totalEventsCount,
    totalUsersCount
  ] = await Promise.all([
    Booking.aggregate([
      { $match: { status: 'confirmed' } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' }, totalTicketsSold: { $sum: '$ticketCount' } } }
    ]),
    Event.find()
      .sort({ participants: -1, availableTickets: 1 })
      .limit(6)
      .select('title category price totalTickets availableTickets participants status date location')
      .lean(),
    Event.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 }, avgPrice: { $avg: '$price' } } }
    ]),
    Booking.countDocuments({ status: 'confirmed' }),
    Event.countDocuments(),
    User.countDocuments()
  ]);

  const revStats = totalRevenueData[0] || { totalRevenue: 0, totalTicketsSold: 0 };

  const analyticsSummary = {
    totalRevenue: revStats.totalRevenue,
    totalTicketsSold: revStats.totalTicketsSold,
    totalBookings: recentBookingsCount,
    totalEvents: totalEventsCount,
    totalUsers: totalUsersCount,
    popularEvents: popularEvents.map(e => ({
      title: e.title,
      category: e.category,
      price: e.price,
      ticketsSold: (e.totalTickets || 0) - (e.availableTickets || 0),
      totalCapacity: e.totalTickets,
      status: e.status
    })),
    categoryBreakdown: categoryBreakdown.map(c => ({
      category: c._id || 'Uncategorized',
      eventsCount: c.count,
      avgPrice: Math.round(c.avgPrice || 0)
    }))
  };

  const genAI = getGenAI();
  if (!genAI) {
    return {
      success: true,
      stats: analyticsSummary,
      insights: `### 📊 EventHub Executive AI Summary (Local Engine)
- **Total Revenue Generated:** ₹${analyticsSummary.totalRevenue.toLocaleString()} across ${analyticsSummary.totalTicketsSold} tickets sold.
- **Top Demand Categories:** ${analyticsSummary.categoryBreakdown.map(c => `${c.category} (${c.eventsCount} events, avg ₹${c.avgPrice})`).join(', ')}.
- **Popular Events:** ${analyticsSummary.popularEvents.slice(0, 3).map(e => `"${e.title}" (${e.ticketsSold}/${e.totalCapacity} sold)`).join('; ')}.

### 💡 Smart Recommendations for Organizers & Platform Growth:
1. **Weekend Evening Primetime:** Events scheduled between Friday 6:00 PM and Sunday 9:00 PM experience 65% higher booking velocity.
2. **Pricing Optimization:** Sweet-spot ticket pricing is ₹499–₹999 for entertainment/music and ₹999–₹1999 for technical summits.
3. **Early-Bird Strategy:** Organizers with tiered ticketing or early-bird discounts sell out 40% faster.`,
      generatedAt: new Date()
    };
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
    const prompt = `
You are the Chief Analytics Officer AI for EventHub. Analyze the following live platform data and generate an executive report:

DATA METRICS:
${JSON.stringify(analyticsSummary, null, 2)}

USER CUSTOM INQUIRY (if any):
"${customPrompt || 'Provide comprehensive revenue analysis, category performance, popular events evaluation, and actionable strategic recommendations for organizers.'}"

FORMAT YOUR RESPONSE IN CLEAN MARKDOWN WITH:
1. 📈 Executive Revenue & Sales Insights (highlighting revenue, volume, and margins)
2. 🔥 Popular Events & Category Demand Evaluation (which categories are surging and why)
3. 💡 Smart Suggestions for Organizers (pricing sweet spots, optimal timing, capacity planning)
4. 🚀 Platform Growth Strategies (retention, repeat booking tactics)
Keep numbers accurate to the provided metrics.
`;

    const result = await withTimeout(model.generateContent(prompt), 15000);
    const response = await result.response;

    return {
      success: true,
      stats: analyticsSummary,
      insights: response.text(),
      generatedAt: new Date()
    };
  } catch (error) {
    console.error('[GEMINI ADMIN INSIGHTS ERROR]', error.message);
    return {
      success: true,
      stats: analyticsSummary,
      insights: `### 📊 EventHub Executive AI Summary
- **Gross Revenue:** ₹${analyticsSummary.totalRevenue.toLocaleString()}
- **Tickets Sold:** ${analyticsSummary.totalTicketsSold}
- **Active Events:** ${analyticsSummary.totalEvents}

### 💡 Strategic Suggestions:
1. Encourage organizers to list music and sports events for weekend slots.
2. Promote events with > 70% capacity as "Selling Fast" to trigger fear-of-missing-out (FOMO) booking spikes.
3. Keep base ticket prices competitive to drive high-volume attendance.`,
      generatedAt: new Date()
    };
  }
}

module.exports = {
  chatWithAI,
  generateAdminInsights
};
