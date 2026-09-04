const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: {
    type: String,
    enum: ['Music', 'Sports', 'Technology', 'Art', 'Business', 'Food', 'Films', 'Parties', 'Science', 'Other'],
    default: 'Other'
  },
  date: { type: Date, required: true },
  endDate: { type: Date },
  location: { type: String, required: true },
  address: { type: String, default: '' },
  image: { type: String, default: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800' },
  price: { type: Number, default: 0 },
  isFree: { type: Boolean, default: false },
  totalTickets: { type: Number, default: 100 },
  availableTickets: { type: Number, default: 100 },
  status: { type: String, enum: ['active', 'pending', 'rejected', 'draft', 'completed', 'cancelled', 'withdrawn'], default: 'active' },
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  tags: [String],
  isOnline: { type: Boolean, default: false },
  revenue: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);
