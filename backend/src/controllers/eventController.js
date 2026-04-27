const Event = require('../models/Event');
const { getIO } = require('../config/socket');

exports.createEvent = async (req, res) => {
  try {
    const event = await Event.create(req.body);

    getIO().emit('eventCreated', event);

    res.json(event);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getEvents = async (req, res) => {
  const events = await Event.find().sort({ createdAt: -1 });
  res.json(events);
};