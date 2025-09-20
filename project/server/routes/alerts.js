const express = require('express');
const Alert = require('../models/Alert');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const geminiService = require('../services/geminiService');

const router = express.Router();

// Get all alerts
router.get('/', async (req, res) => {
  try {
    const { type, severity, active = 'true' } = req.query;
    
    const filter = {};
    if (type) filter.type = type;
    if (severity) filter.severity = severity;
    if (active !== 'all') filter.isActive = active === 'true';

    const alerts = await Alert.find(filter)
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ alerts });
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new alert (admin only)
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { title, description, type, severity, location, expiresAt } = req.body;

    const alert = new Alert({
      title,
      description,
      type,
      severity,
      location,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      createdBy: req.user._id
    });

    await alert.save();
    await alert.populate('createdBy', 'username');

    res.status(201).json({
      message: 'Alert created successfully',
      alert
    });
  } catch (error) {
    console.error('Create alert error:', error);
    res.status(400).json({ message: error.message });
  }
});

// AI-generated alert
router.post('/ai', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { textContent } = req.body;

    if (!textContent) {
      return res.status(400).json({ message: 'Text content is required' });
    }

    // Analyze with Gemini AI
    const aiResult = await geminiService.analyzeAlert(textContent);

    // If AI suggests creating an alert, save it
    if (aiResult.alert) {
      const alert = new Alert({
        title: aiResult.title,
        description: aiResult.description,
        type: aiResult.type,
        severity: aiResult.severity || 'medium',
        createdBy: req.user._id
      });

      await alert.save();
      await alert.populate('createdBy', 'username');

      res.json({
        message: 'Alert analyzed and created successfully',
        aiResult,
        alert
      });
    } else {
      res.json({
        message: 'Content analyzed - no alert needed',
        aiResult
      });
    }
  } catch (error) {
    console.error('AI alert generation error:', error);
    res.status(500).json({ message: 'Failed to analyze content with AI' });
  }
});

// Update alert status
router.patch('/:id/status', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { isActive } = req.body;
    
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    ).populate('createdBy', 'username');

    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }

    res.json({
      message: `Alert ${isActive ? 'activated' : 'deactivated'} successfully`,
      alert
    });
  } catch (error) {
    console.error('Update alert status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;