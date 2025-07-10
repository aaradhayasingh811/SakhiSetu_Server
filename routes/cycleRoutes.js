const express = require('express');
const router = express.Router();
const cycleController = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

router.get('/current', protect, cycleController.getCurrentCycle);
router.get('/hormones', protect, cycleController.getHormoneData);
router.get('/trends', protect, cycleController.getSymptomTrends);

module.exports = router;