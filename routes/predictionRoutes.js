const express = require('express');
const router = express.Router();
const {
  predictSymptoms,
  estimateHormones,
  checkPCOS,
  predictCycle
} = require('../controllers/predictionController');
const { protect } = require('../middleware/authMiddleware');

router.post('/symptoms', protect, predictSymptoms);
router.post('/hormones', protect, estimateHormones);
router.post('/pcos-check', protect, checkPCOS);
router.get('/predict-next-cycle', protect, predictCycle);

module.exports = router;