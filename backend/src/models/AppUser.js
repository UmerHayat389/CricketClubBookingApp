const mongoose = require('mongoose');

// Separate from the admin User model (User.js)
// This stores cricket app users identified only by name
const appUserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AppUser', appUserSchema);