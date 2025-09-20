const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [20, 'Username cannot exceed 20 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user'
  },
  streak: {
    type: Number,
    default: 0,
    min: 0
  },
  points: {
    type: Number,
    default: 0,
    min: 0
  },
  badges: [{
    type: String,
    enum: [
      'First Quiz', 'Quiz Master', 'Streak Keeper', 'Emergency Expert',
      'Community Helper', 'Alert Watcher', 'Safety Scholar', 'Preparedness Pro'
    ]
  }],
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  lastQuizDate: {
    type: Date
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Calculate progress based on activities
userSchema.methods.calculateProgress = function() {
  const baseProgress = Math.min(this.points / 10, 50); // Max 50% from points
  const streakBonus = Math.min(this.streak * 2, 30); // Max 30% from streak
  const badgeBonus = Math.min(this.badges.length * 2.5, 20); // Max 20% from badges
  
  this.progress = Math.min(baseProgress + streakBonus + badgeBonus, 100);
  return this.progress;
};

// Award badge method
userSchema.methods.awardBadge = function(badgeName) {
  if (!this.badges.includes(badgeName)) {
    this.badges.push(badgeName);
    this.points += 50; // Bonus points for earning a badge
  }
};

module.exports = mongoose.model('User', userSchema);