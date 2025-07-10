const express = require('express');
const router = express.Router();
const {
  getMoodInsights,
  getPainTrends,
  exportToPDF
} = require('../controllers/insightsController');
const { protect } = require('../middleware/authMiddleware');

router.get('/mood', protect, getMoodInsights);
router.get('/pain-trend', protect, getPainTrends);
router.get('/export-pdf', protect, exportToPDF);

module.exports = router;