const express = require('express');
const router = express.Router();
const {
  getLogs,
  getLog,
  createLog,
  updateLog,
  deleteLog
} = require('../controllers/trackerController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getLogs)
  .post(protect, createLog);

router.route('/:id')
  .get(protect, getLog)
  .put(protect, updateLog)
  .delete(protect, deleteLog);

module.exports = router;