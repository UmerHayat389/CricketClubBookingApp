const Booking = require('../models/Booking');
const { getIO } = require('../config/socket');

// Create booking
exports.createBooking = async (req, res) => {
  try {
    const { userName, slotTime, date } = req.body;

    const booking = new Booking({
      userName,
      slotTime,
      date,
      paymentScreenshot: req.file ? req.file.filename : '',
    });

    await booking.save();

    // 🔥 realtime
    getIO().emit('bookingCreated', booking);

    res.json({ message: 'Booking created', booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all bookings
exports.getBookings = async (req, res) => {
  try {
    const bookings = await Booking.find().sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Approve
exports.approveBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: 'approved' },
      { new: true }
    );

    getIO().emit('bookingUpdated', booking);

    res.json({ message: 'Approved', booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Reject
exports.rejectBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected' },
      { new: true }
    );

    getIO().emit('bookingUpdated', booking);

    res.json({ message: 'Rejected', booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};