const express = require('express');
const router = express.Router();
const periodController = require('../controllers/periodController');
const { protect } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(protect);

// Period routes
router.get('/', periodController.getAllPeriods);
router.post('/', periodController.createPeriod);
router.put('/:id', periodController.updatePeriod);
router.delete('/:id', periodController.deletePeriod);

module.exports = router;