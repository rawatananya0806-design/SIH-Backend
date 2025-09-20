const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema({
  question: {
    type: String,
    required: [true, 'Question is required'],
    trim: true
  },
  options: {
    type: [String],
    required: [true, 'Options are required'],
    validate: {
      validator: function(options) {
        return options.length === 4;
      },
      message: 'Quiz must have exactly 4 options'
    }
  },
  answer: {
    type: Number,
    required: [true, 'Answer index is required'],
    min: [0, 'Answer index must be between 0 and 3'],
    max: [3, 'Answer index must be between 0 and 3']
  },
  category: {
    type: String,
    enum: ['general', 'fire', 'earthquake', 'flood', 'medical', 'weather'],
    default: 'general'
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium'
  },
  points: {
    type: Number,
    default: 10
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Quiz', quizSchema);