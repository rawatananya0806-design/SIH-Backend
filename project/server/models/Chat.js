const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
    trim: true
  },
  response: {
    type: String,
    required: [true, 'Response is required'],
    trim: true
  },
  category: {
    type: String,
    enum: ['general', 'emergency', 'preparation', 'medical', 'technical'],
    default: 'general'
  },
  sentiment: {
    type: String,
    enum: ['positive', 'neutral', 'negative', 'urgent'],
    default: 'neutral'
  }
}, {
  timestamps: true
});

// Index for efficient user chat history queries
chatSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Chat', chatSchema);