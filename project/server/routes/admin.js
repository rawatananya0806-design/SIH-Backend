const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Adjust path as needed
const { isAdmin } = require('../middleware/auth'); // Middleware to check admin access

// Get all users
router.get('/users', isAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user role
router.patch('/user/:id/role', isAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Award a badge to a user
router.post('/user/:id/badge', isAdmin, async (req, res) => {
  try {
    const { badge } = req.body;

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.awardBadge(badge);
    user.calculateProgress();
    await user.save();

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete user
router.delete('/user/:id', isAdmin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
