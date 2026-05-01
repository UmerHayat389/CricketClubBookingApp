const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true },
    designation: { type: String, required: true },   // e.g. "Head Coach", "Groundsman"
    phone:       { type: String, default: '' },
    email:       { type: String, default: '' },
    salary:      { type: Number, default: 0 },
    joinDate:    { type: String, default: '' },       // "YYYY-MM-DD"
    address:     { type: String, default: '' },
    photo:       { type: String, default: '' },       // filename from multer
    status:      { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Employee', employeeSchema);