const Booking = require('../models/Booking');
const { getIO } = require('../config/socket');

// Create booking
exports.createBooking = async (req, res) => {
  try {
    const { userName, phone, slotTime, date, duration, numberOfPlayers, notes, totalAmount } = req.body;

    const existing = await Booking.findOne({
      slotTime, date, status: { $in: ['pending', 'approved'] },
    });
    if (existing) return res.status(400).json({ message: 'This slot is already booked' });

    const booking = new Booking({
      userName, phone, slotTime, date,
      duration: duration || 1,
      numberOfPlayers: numberOfPlayers || 1,
      notes: notes || '',
      totalAmount: totalAmount || 0,
      paymentScreenshot: req.file ? req.file.filename : '',
      status: 'pending',
    });
    await booking.save();

    getIO().emit('bookingCreated', booking);
    getIO().emit('slotBooked', { date, slotTime });
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
      date, status: { $in: ['pending', 'approved'] },
    }).select('slotTime date status');
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Approve
exports.approveBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(req.params.id, { status: 'approved' }, { new: true });
    getIO().emit('bookingUpdated', booking);
    res.json({ message: 'Approved', booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Reject
exports.rejectBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(req.params.id, { status: 'rejected' }, { new: true });
    getIO().emit('bookingUpdated', booking);
    getIO().emit('slotFreed', { date: booking.date, slotTime: booking.slotTime });
    res.json({ message: 'Rejected', booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Dashboard stats ────────────────────────────────────────────────────────
// GET /api/bookings/stats?filter=today|week|month
exports.getDashboardStats = async (req, res) => {
  try {
    const { filter = 'week' } = req.query;

    const now   = new Date();
    let   start = new Date();

    if (filter === 'today') {
      start.setHours(0, 0, 0, 0);
    } else if (filter === 'month') {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
    } else {
      // week — default
      start.setDate(now.getDate() - 6);
      start.setHours(0, 0, 0, 0);
    }

    // All bookings in range
    const bookings = await Booking.find({
      createdAt: { $gte: start, $lte: now },
    }).sort({ createdAt: -1 });

    // Counts by status
    const total     = bookings.length;
    const pending   = bookings.filter(b => b.status === 'pending').length;
    const approved  = bookings.filter(b => b.status === 'approved').length;
    const rejected  = bookings.filter(b => b.status === 'rejected').length;

    // Revenue: sum of approved bookings
    const revenue = bookings
      .filter(b => b.status === 'approved')
      .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

    // Recent 5 bookings
    const recent = bookings.slice(0, 5);

    res.json({ total, pending, approved, rejected, revenue, recent, filter });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};