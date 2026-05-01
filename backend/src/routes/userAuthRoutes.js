const express  = require('express');
const router   = express.Router();
const AppUser  = require('../models/AppUser'); // ← separate from admin User.js

/**
 * POST /api/user-auth/register
 * Body: { name }
 * Creates a new app user with just their name.
 * Returns: { _id, name }
 */
router.post('/register', async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Name is required.' });
    }

    const trimmed = name.trim();

    // Case-insensitive duplicate check
    const existing = await AppUser.findOne({
      name: { $regex: `^${trimmed}$`, $options: 'i' },
    });

    if (existing) {
      return res.status(409).json({
        message: 'This name is already registered. Please login instead.',
      });
    }

    const user = await AppUser.create({ name: trimmed });
    res.status(201).json({ _id: user._id, name: user.name });

  } catch (err) {
    console.error('AppUser register error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

/**
 * POST /api/user-auth/login
 * Body: { name }
 * Finds app user by name (case-insensitive).
 * Returns: { _id, name }
 */
router.post('/login', async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Name is required.' });
    }

    const trimmed = name.trim();

    const user = await AppUser.findOne({
      name: { $regex: `^${trimmed}$`, $options: 'i' },
    });

    if (!user) {
      return res.status(404).json({
        message: 'Name not found. Please register first.',
      });
    }

    res.json({ _id: user._id, name: user.name });

  } catch (err) {
    console.error('AppUser login error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
});

module.exports = router;