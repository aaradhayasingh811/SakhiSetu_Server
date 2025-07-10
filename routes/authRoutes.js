const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateCycleInfo,
  sendResetOtp,
  resetPassword,
  getUserProfile,
  updateUser
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { body } = require('express-validator');

router.post('/register', [
  body('name').notEmpty().withMessage('Please provide a name'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('age').isInt({ min: 13, max: 60 }).withMessage('Age must be between 13 and 60'),
  body('avgCycleLength').isInt({ min: 21, max: 35 }).withMessage('Cycle length must be between 21 and 35 days')
], register);

router.post('/login', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Please provide a password')
], login);

router.post('/send-reset-otp', [
  body('email').isEmail().withMessage('Please provide a valid email')
], sendResetOtp);

router.post('/reset-password', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], resetPassword);

router.get('/me', protect, getMe);
router.put('/cycle', protect, updateCycleInfo);

router.get('/users/:id',protect , getUserProfile);
router.put('/update',protect , updateUser);

module.exports = router;