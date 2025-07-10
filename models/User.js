const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/db');
const { Notification } = require('./community');

const UserSchema = new mongoose.Schema({
  // Personal Information
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  age: {
    type: Number,
    required: [true, 'Please provide your age'],
    min: [13, 'You must be at least 13 years old'],
    max: [60, 'Age cannot be more than 60']
  },

  // Menstrual Health Tracking
  avgCycleLength: {
    type: Number,
  },
  lastPeriodStart: {
    type: Date
  },
  firstPeriodDate: {
    type: String
  },
  nextPeriodPredicted: {
    type: Date
  },
  cycleHistory: [{
    startDate: Date,
    endDate: Date,
    symptoms: [String],
    flowIntensity: {
      type: String,
      enum: ['light', 'medium', 'heavy']
    },
    mood: {
      type: String,
      enum: ['happy', 'sad', 'anxious', 'irritable', 'neutral']
    }
  }],

  // Community Profile
  username: {
    type: String,
    unique: true,
    trim: true,
    maxlength: [30, 'Username cannot be more than 30 characters'],
    default: () => 'user_' + Math.random().toString(36).substring(2, 9)

  },
  avatar: {
    type: String,
    default: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSJ2MN75zQkPhIz5PMJ8ObHwyUOaakWizbIWw&s'
  },
  bio: {
    type: String,
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  badges: {
    type: [String],
    default: ['new-member']
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  lastActive: {
    type: Date,
    default: Date.now
  },

  // Account Security
  resetPasswordOtp: {
    type: String
  },
  resetPasswordExpires: {
    type: Date
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: {
    type: String
  },

  // Moderation & Privacy
  isModerator: {
    type: Boolean,
    default: false
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  blockedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  privacySettings: {
    showMenstrualInfo: {
      type: Boolean,
      default: true
    },
    profileVisibility: {
      type: String,
      enum: ['public', 'community-only', 'private'],
      default: 'community-only'
    }
  },

  // Preferences
  notificationPreferences: {
    email: {
      replies: { type: Boolean, default: true },
      reactions: { type: Boolean, default: true },
      announcements: { type: Boolean, default: true }
    },
    push: {
      replies: { type: Boolean, default: true },
      reactions: { type: Boolean, default: true }
    }
  },
  uiPreferences: {
    darkMode: {
      type: Boolean,
      default: false
    },
    fontSize: {
      type: String,
      enum: ['small', 'medium', 'large'],
      default: 'medium'
    }
  },

  // Social Features
  socialLinks: {
    website: String,
    twitter: String,
    instagram: String,
    tiktok: String
  },
  followingCategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
  }],
  followingTags: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tag'
  }],
  savedPosts: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post'
  }],
  followedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for post count
UserSchema.virtual('postCount', {
  ref: 'Post',
  localField: '_id',
  foreignField: 'author',
  count: true
});

// Virtual for comment count
UserSchema.virtual('commentCount', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'author',
  count: true
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  
  // Generate username if not provided
  if (!this.username && this.name) {
    const baseUsername = this.name.toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[^a-z0-9]/g, '');
    let username = baseUsername;
    let counter = 1;
    
    // Check if username exists and find a unique one
    while (true) {
      try {
        const existingUser = await this.constructor.findOne({ username });
        if (!existingUser) break;
        username = `${baseUsername}${counter}`;
        counter++;
      } catch (err) {
        break;
      }
    }
    
    this.username = username;
  }
});

// Generate JWT token
UserSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { id: this._id, isModerator: this.isModerator, isAdmin: this.isAdmin },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
};

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash password reset token
UserSchema.methods.getResetPasswordToken = function() {
  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Set expire to 10 minutes
  this.resetPasswordOtp = otp;
  this.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  return otp;
};

// Generate email verification token
UserSchema.methods.generateVerificationToken = function() {
  const token = jwt.sign(
    { id: this._id },
    config.jwtSecret,
    { expiresIn: '1d' }
  );
  this.verificationToken = token;
  return token;
};

// Update last active timestamp
UserSchema.methods.updateLastActive = async function() {
  this.lastActive = new Date();
  await this.save();
};

// Check if user is blocking another user
UserSchema.methods.isBlocking = function(userId) {
  return this.blockedUsers.some(id => id.equals(userId));
};

// Get user's unread notifications count
UserSchema.methods.getUnreadNotificationCount = async function() {
  return await Notification.countDocuments({
    recipient: this._id,
    isRead: false
  });
};

// Follow/Unfollow user
UserSchema.methods.followUser = async function(userId) {
  if (!this.followedUsers.includes(userId)) {
    this.followedUsers.push(userId);
    await this.save();
  }
};

UserSchema.methods.unfollowUser = async function(userId) {
  this.followedUsers = this.followedUsers.filter(id => !id.equals(userId));
  await this.save();
};

// Block/Unblock user
UserSchema.methods.blockUser = async function(userId) {
  if (!this.blockedUsers.includes(userId)) {
    this.blockedUsers.push(userId);
    await this.save();
  }
};

UserSchema.methods.unblockUser = async function(userId) {
  this.blockedUsers = this.blockedUsers.filter(id => !id.equals(userId));
  await this.save();
};

// Add/Remove badge
UserSchema.methods.addBadge = async function(badgeName) {
  if (!this.badges.includes(badgeName)) {
    this.badges.push(badgeName);
    await this.save();
  }
};

UserSchema.methods.removeBadge = async function(badgeName) {
  this.badges = this.badges.filter(badge => badge !== badgeName);
  await this.save();
};

module.exports = mongoose.model('User', UserSchema);