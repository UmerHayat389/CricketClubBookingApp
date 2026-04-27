const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    date: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Event', eventSchema);