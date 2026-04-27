const express = require('express');
const router = express.Router();

const {
  createBooking,
  getBookings,
  approveBooking,
  rejectBooking,
} = require('../controllers/bookingController');

const upload = require('../middleware/uploadMiddleware');

// 🔥 Create booking + upload payment screenshot
router.post('/', upload.single('paymentScreenshot'), createBooking);

// Get all bookings
router.get('/', getBookings);

// Approve booking
router.put('/approve/:id', approveBooking);

// Reject booking
router.put('/reject/:id', rejectBooking);

module.exports = router;