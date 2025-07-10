const express = require('express');
const router = express.Router();
const {
  getPartner,
  setupPartner,
  sendPartnerMessage,
  deletePartner
} = require('../controllers/partnerController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getPartner)
  .post(protect, setupPartner)
  .delete(protect, deletePartner);

router.post('/send', protect, sendPartnerMessage);

module.exports = router;