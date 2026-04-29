const express = require('express');
const router = express.Router();

const {
  createBooking,
  getBookings,
  getBookedSlots,
  approveBooking,
  rejectBooking,
} = require('../controllers/bookingController');

const upload = require('../middleware/uploadMiddleware');

router.post('/', upload.single('paymentScreenshot'), createBooking);
router.get('/', getBookings);
router.get('/booked-slots', getBookedSlots);
router.put('/approve/:id', approveBooking);
router.put('/reject/:id', rejectBooking);

module.exports = router;