const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      required: true,
    },
    slotTime: {
      type: String,
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    paymentScreenshot: {
      type: String,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Booking', bookingSchema);