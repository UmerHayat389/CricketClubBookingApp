const Booking = require('../models/Booking');
const { getIO } = require('../config/socket');

// Create booking
exports.createBooking = async (req, res) => {
  try {
    const { userName, phone, slotTime, date, duration, numberOfPlayers, notes, totalAmount } = req.body;

    // Check if slot is already booked (approved or pending)
    const existing = await Booking.findOne({
      slotTime,
      date,
      status: { $in: ['pending', 'approved'] },
    });

    if (existing) {
      return res.status(400).json({ message: 'This slot is already booked' });
    }

    const booking = new Booking({
      userName,
      phone,
      slotTime,
      date,
      duration: duration || 1,
      numberOfPlayers: numberOfPlayers || 1,
      notes: notes || '',
      totalAmount: totalAmount || 0,
      paymentScreenshot: req.file ? req.file.filename : '',
      status: 'pending',
    });

    await booking.save();

    // Emit realtime to all clients
    getIO().emit('bookingCreated', booking);
    getIO().emit('slotBooked', { date, slotTime }); // so other users see slot as taken

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

// Get booked slots for a specific date
exports.getBookedSlots = async (req, res) => {
  try {
    const { date } = req.query;
    const bookings = await Booking.find({
      date,
      status: { $in: ['pending', 'approved'] },
    }).select('slotTime date status');
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
    // Emit slot freed so other users can book it
    getIO().emit('bookingUpdated', booking);
    getIO().emit('slotFreed', { date: booking.date, slotTime: booking.slotTime });
    res.json({ message: 'Rejected', booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};