const Event    = require('../models/Event');
const { getIO } = require('../config/socket');
const fs       = require('fs');
const path     = require('path');

// GET /events
exports.getEvents = async (req, res) => {
  try {
    const events = await Event.find().sort({ createdAt: -1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /events  (multipart/form-data — banner via multer)
exports.createEvent = async (req, res) => {
  try {
    const { title, description, date, location, entryFee } = req.body;
    const event = await Event.create({
      title,
      description: description || '',
      date:        date        || '',
      location:    location    || '',
      entryFee:    entryFee    ? Number(entryFee) : 0,
      banner:      req.file   ? req.file.filename : '',
    });
    getIO().emit('eventCreated', event);
    res.json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /events/:id  (edit — banner replacement optional)
exports.updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, date, location, entryFee } = req.body;

    const existing = await Event.findById(id);
    if (!existing) return res.status(404).json({ message: 'Event not found' });

    // If a new banner was uploaded, delete the old one
    if (req.file && existing.banner) {
      const oldPath = path.join(__dirname, '../uploads/events', existing.banner);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    const updated = await Event.findByIdAndUpdate(
      id,
      {
        title:       title        ?? existing.title,
        description: description  ?? existing.description,
        date:        date         ?? existing.date,
        location:    location     ?? existing.location,
        entryFee:    entryFee !== undefined ? Number(entryFee) : existing.entryFee,
        banner:      req.file ? req.file.filename : existing.banner,
      },
      { new: true }
    );

    getIO().emit('eventUpdated', updated);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /events/:id
exports.deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await Event.findById(id);
    if (!existing) return res.status(404).json({ message: 'Event not found' });

    // Remove banner file from disk
    if (existing.banner) {
      const filePath = path.join(__dirname, '../uploads/events', existing.banner);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await Event.findByIdAndDelete(id);
    getIO().emit('eventDeleted', { _id: id });
    res.json({ message: 'Event deleted', _id: id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /events/:id/toggle-free  — toggles entryFee between 0 and previous value
exports.toggleFree = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await Event.findById(id);
    if (!existing) return res.status(404).json({ message: 'Event not found' });

    const newFee = existing.entryFee > 0 ? 0 : (req.body.restoreFee || 0);
    const updated = await Event.findByIdAndUpdate(
      id,
      { entryFee: Number(newFee) },
      { new: true }
    );

    getIO().emit('eventUpdated', updated);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};