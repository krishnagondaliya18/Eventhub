const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  ticketCount: { type: Number, default: 1 },
  totalPaid: { type: Number, default: 0 },
  status: { type: String, enum: ['confirmed', 'pending', 'cancelled'], default: 'confirmed' },
  registeredAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Participant', participantSchema);
