const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  event:       { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  quantity:          { type: Number, required: true, min: 1, max: 10, default: 1 },
  totalAmount:       { type: Number, required: true, default: 0 },
  upiId:             { type: String, default: '' },
  bookingId:         { type: String, unique: true },
  razorpayOrderId:   { type: String, default: '' },
  razorpayPaymentId: { type: String, default: '' },
  razorpaySignature: { type: String, default: '' },
  paymentMethod:     { type: String, default: 'online' },
  paymentDetails:    { type: Object, default: {} },
  paymentStatus:     { type: String, enum: ['pending', 'paid', 'free', 'failed'], default: 'paid' },
  status:            { type: String, enum: ['confirmed', 'cancelled'], default: 'confirmed' },
  cancelledAt:       { type: Date }
}, { timestamps: true });

bookingSchema.pre('save', function (next) {
  if (!this.bookingId) {
    this.bookingId = 'EH' + Date.now() + Math.random().toString(36).substr(2, 4).toUpperCase();
  }
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);
