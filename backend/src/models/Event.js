const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true },
    description: { type: String, default: '' },
    date:        { type: String, default: '' },
    location:    { type: String, default: '' },
    entryFee:    { type: Number, default: 0 },
    banner:      { type: String, default: '' }, // uploaded filename
  },
  { timestamps: true }
);

module.exports = mongoose.model('Event', eventSchema);