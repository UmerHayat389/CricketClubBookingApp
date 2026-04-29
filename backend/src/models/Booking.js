const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    userName: { type: String, required: true },
    phone: { type: String, required: true },
    slotTime: { type: String, required: true },
    date: { type: String, required: true },         // "YYYY-MM-DD"
    duration: { type: Number, default: 1 },         // hours
    numberOfPlayers: { type: Number, default: 1 },
    notes: { type: String, default: '' },
    totalAmount: { type: Number, default: 0 },
    paymentScreenshot: { type: String },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Booking', bookingSchema);