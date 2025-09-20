const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Alert title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Alert description is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['drill', 'emergency', 'warning', 'info'],
    required: [true, 'Alert type is required']
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  location: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  expiresAt: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Index for efficient queries
alertSchema.index({ type: 1, isActive: 1, createdAt: -1 });

module.exports = mongoose.model('Alert', alertSchema);