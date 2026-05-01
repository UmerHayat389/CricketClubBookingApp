const express = require('express');
const router  = express.Router();

const {
  createBooking,
  getBookings,
  getBookedSlots,
  approveBooking,
  rejectBooking,
  getDashboardStats,
} = require('../controllers/bookingController');

const upload = require('../middleware/uploadMiddleware');

// Stats MUST be before /:id style routes
router.get('/stats',        getDashboardStats);
router.get('/booked-slots', getBookedSlots);
router.get('/',             getBookings);
router.post('/',            upload.single('paymentScreenshot'), createBooking);
router.put('/approve/:id',  approveBooking);
router.put('/reject/:id',   rejectBooking);

module.exports = router;