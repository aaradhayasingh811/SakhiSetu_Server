const User = require('../models/User');
const jwt = require('jsonwebtoken');
const config = require('../config/db');
const { calculateNextPeriod } = require('../utils/cycleUtils');
const nodemailer = require('nodemailer');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const { Post } = require('../models/community');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password, age, avgCycleLength } = req.body;

  // Create user
  const user = await User.create({
    name,
    email,
    password,
    age,
    avgCycleLength,
    lastPeriodStart: req.body.lastPeriodStart || null
  });

  // Create token
  const token = user.getSignedJwtToken();

  res.status(201).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      age: user.age,
      avgCycleLength: user.avgCycleLength
    }
  });
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Validate email & password
  if (!email || !password) {
    return next(new ErrorResponse('Please provide an email and password', 400));
  }

  // Check for user
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);

  if (!isMatch) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Create token
  const token = user.getSignedJwtToken();

  res.status(200).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      age: user.age,
      avgCycleLength: user.avgCycleLength
    }
  });
});

// @desc    Send OTP for password reset
// @route   POST /api/auth/send-reset-otp
// @access  Public
exports.sendResetOtp = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    return next(new ErrorResponse('No user found with this email', 404));
  }

  // Get reset token
  const otp = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  // Create reset URL
  const resetUrl = `${req.protocol}://${req.get('host')}/api/auth/reset-password`;

  const message = `You are receiving this email because you (or someone else) has requested to reset your password. 
  Please use the following OTP to complete the process: \n\n ${otp} \n\nThis OTP is valid for 10 minutes.`;

  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Password Reset OTP',
      text: message
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ success: true, data: 'Email sent' });
  } catch (err) {
    console.error(err);
    user.resetPasswordOtp = undefined;
    user.resetPasswordExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(new ErrorResponse('Email could not be sent', 500));
  }
});

// @desc    Reset password with OTP
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  const { email, otp, newPassword } = req.body;

  const user = await User.findOne({
    email,
    resetPasswordOtp: otp,
    resetPasswordExpires: { $gt: Date.now() }
  });

  if (!user) {
    return next(new ErrorResponse('Invalid OTP or OTP has expired', 400));
  }

  // Set new password
  user.password = newPassword;
  user.resetPasswordOtp = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  // Create token
  const token = user.getSignedJwtToken();

  res.status(200).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      age: user.age,
      avgCycleLength: user.avgCycleLength
    }
  });
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Update user cycle info
// @route   PUT /api/auth/cycle
// @access  Private
exports.updateCycleInfo = asyncHandler(async (req, res, next) => {
  const { avgCycleLength, lastPeriodStart } = req.body;
  
  const nextPeriodPredicted = calculateNextPeriod(lastPeriodStart, avgCycleLength);
  
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { avgCycleLength, lastPeriodStart, nextPeriodPredicted },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    data: user
  });
});


// @route   PUT /api/auth/update
// @desc    Update user profile
exports.update = async (req, res) => {
  try {
    const { username, avatar, isAnonymous } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { username, avatar, isAnonymous },
      { new: true, runValidators: true }
    ).select('-password');

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};


exports.getUserProfile = async (req, res) => {
  try {
    if (!req.params.id) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    const user = await User.findById(req.params.id).select('-password').lean();
    const post = await Post.find({ author: req.params.id }).populate({
    path: 'comments',
    populate: {
      path: 'author',
      select: 'name avatar'
    }
  })
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    return res.status(200).json({data : user , posts: post});
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
    
  }
}


exports.updateUser = async (req, res) => {
  try {
    const { name, email, username, age, bio, password } = req.body;
    
    // Find the user
    let user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if email is already taken by another user
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use'
        });
      }
    }

    // Check if username is already taken by another user
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Username already taken'
        });
      }
    }

    // Update user fields
    user.name = name || user.name;
    user.email = email || user.email;
    user.username = username || user.username;
    user.age = age !== undefined ? age : user.age;
    user.bio = bio !== undefined ? bio : user.bio;

    // Update password if provided
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();

    // Return user data without password
    const userData = user.toObject();
    delete userData.password;
    delete userData.__v;

    res.status(200).json({
      success: true,
      data: userData,
      message: 'Profile updated successfully'
    });

  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};
