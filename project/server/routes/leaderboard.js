const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');

const router = express.Router();

// Get leaderboard
router.get('/', async (req, res) => {
  try {
    const { limit = 50, category = 'points' } = req.query;
    
    let sortField = 'points';
    if (category === 'streak') sortField = 'streak';
    if (category === 'badges') sortField = 'badges';
    if (category === 'progress') sortField = 'progress';

    const users = await User.find({ role: 'user' })
      .select('username points streak badges progress createdAt')
      .sort({ [sortField]: -1, createdAt: 1 }) // Secondary sort by creation date for ties
      .limit(parseInt(limit));

    // Add ranking position
    const leaderboard = users.map((user, index) => ({
      rank: index + 1,
      id: user._id,
      username: user.username,
      points: user.points,
      streak: user.streak,
      badges: user.badges,
      badgeCount: user.badges.length,
      progress: user.progress,
      joinedAt: user.createdAt
    }));

    // Get current week's top performers
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const weeklyTop = await User.find({ 
      role: 'user',
      lastQuizDate: { $gte: weekAgo }
    })
      .select('username points streak')
      .sort({ points: -1 })
      .limit(5);

    res.json({
      leaderboard,
      weeklyTop,
      stats: {
        totalUsers: users.length,
        category,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's leaderboard position
router.get('/position/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate userId
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid userId' });
    }

    const user = await User.findById(userId)
      .select('username points streak badges progress');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find user's position in points leaderboard
    const higherRankedCount = await User.countDocuments({ 
      role: 'user',
      points: { $gt: user.points }
    });

    const position = higherRankedCount + 1;

    // Get nearby users (3 above, 3 below)
    const nearbyUsers = await User.find({ role: 'user' })
      .select('username points streak badges progress')
      .sort({ points: -1, createdAt: 1 })
      .skip(Math.max(0, position - 4))
      .limit(7);

    const nearbyLeaderboard = nearbyUsers.map((u, index) => ({
      rank: Math.max(0, position - 3) + index + 1,
      id: u._id,
      username: u.username,
      points: u.points,
      streak: u.streak,
      badges: u.badges,
      badgeCount: u.badges.length,
      progress: u.progress,
      isCurrentUser: u._id.toString() === userId
    }));

    res.json({
      userPosition: {
        rank: position,
        user: {
          id: user._id,
          username: user.username,
          points: user.points,
          streak: user.streak,
          badges: user.badges,
          badgeCount: user.badges.length,
          progress: user.progress
        }
      },
      nearbyUsers: nearbyLeaderboard
    });
  } catch (error) {
    console.error('Get user position error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
