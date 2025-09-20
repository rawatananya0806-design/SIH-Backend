const express = require('express');
const Chat = require('../models/Chat');
const User = require('../models/User');
const { authMiddleware } = require('../middleware/auth');
const geminiService = require('../services/geminiService');

const router = express.Router();

// Send message and get AI response
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }

    // Get recent chat history for context
    const recentChats = await Chat.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5);

    // Generate AI response
    const aiResponse = await geminiService.chatResponse(message, recentChats.reverse());

    // Determine message category and sentiment (simple classification)
    let category = 'general';
    let sentiment = 'neutral';

    const emergencyKeywords = ['emergency', 'urgent', 'help', 'danger', 'fire', 'earthquake'];
    const preparationKeywords = ['prepare', 'kit', 'plan', 'supplies', 'ready'];
    const medicalKeywords = ['medical', 'first aid', 'injury', 'health'];

    const lowerMessage = message.toLowerCase();
    if (emergencyKeywords.some(keyword => lowerMessage.includes(keyword))) {
      category = 'emergency';
      sentiment = 'urgent';
    } else if (preparationKeywords.some(keyword => lowerMessage.includes(keyword))) {
      category = 'preparation';
    } else if (medicalKeywords.some(keyword => lowerMessage.includes(keyword))) {
      category = 'medical';
    }

    // Save chat to database
    const chat = new Chat({
      userId: req.user._id,
      message: message.trim(),
      response: aiResponse,
      category,
      sentiment
    });

    await chat.save();
    await chat.populate('userId', 'username');

    // Award Community Helper badge after 5 chats
    const userChatCount = await Chat.countDocuments({ userId: req.user._id });
    if (userChatCount >= 5) {
      const user = await User.findById(req.user._id);
      if (!user.badges.includes('Community Helper')) {
        user.awardBadge('Community Helper');
        await user.save();
      }
    }

    res.json({
      message: 'Chat processed successfully',
      chat,
      aiResponse
    });
  } catch (error) {
    console.error('Chat processing error:', error);
    res.status(500).json({ message: 'Failed to process chat message' });
  }
});

// Get chat history for user
router.get('/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, page = 1 } = req.query;

    // Users can only view their own chats unless they're admin
    if (req.user._id.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const chats = await Chat.find({ userId })
      .populate('userId', 'username')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const totalChats = await Chat.countDocuments({ userId });

    res.json({
      chats: chats.reverse(), // Reverse to show oldest first
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalChats / parseInt(limit)),
        totalChats,
        hasNext: parseInt(page) * parseInt(limit) < totalChats
      }
    });
  } catch (error) {
    console.error('Get chat history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get chat statistics (admin only)
router.get('/stats/overview', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const totalChats = await Chat.countDocuments();
    const chatsByCategory = await Chat.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    const chatsBySentiment = await Chat.aggregate([
      { $group: { _id: '$sentiment', count: { $sum: 1 } } }
    ]);

    // Get most active users
    const activeUsers = await Chat.aggregate([
      { $group: { _id: '$userId', chatCount: { $sum: 1 } } },
      { $sort: { chatCount: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { username: '$user.username', chatCount: 1 } }
    ]);

    res.json({
      totalChats,
      chatsByCategory,
      chatsBySentiment,
      activeUsers
    });
  } catch (error) {
    console.error('Chat stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;