const express = require('express');
const router = express.Router();
const {
  answerQuestion,
  getMoodAdvice,
  generatePartnerMessage
} = require('../controllers/gptController');
const { protect } = require('../middleware/authMiddleware');

router.post('/ask', protect, answerQuestion);
router.post('/mood-advice', protect, getMoodAdvice);
router.post('/partner-message', protect, generatePartnerMessage);

module.exports = router;