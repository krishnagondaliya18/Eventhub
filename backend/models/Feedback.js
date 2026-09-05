const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  event:   { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
  name:    { type: String, required: true },
  email:   { type: String, required: true },
  phone:   { type: String, default: '' },
  subject: { type: String, default: 'General Feedback' },
  message: { type: String, required: true },
  rating:  { type: Number, min: 1, max: 5, default: 5 },
  type:    { type: String, enum: ['feedback', 'query'], default: 'feedback' },
  status:  { type: String, enum: ['pending', 'resolved'], default: 'pending' },
  adminReply: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Feedback', feedbackSchema);
