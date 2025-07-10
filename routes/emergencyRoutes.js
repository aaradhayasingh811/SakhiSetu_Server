// // routes/emergencyRoutes.js
// const express = require('express');
// const router = express.Router();
// const {
//   getEmergencyConfig,
//   addEmergencyContact,
//   updateEmergencyContact,
//   deleteEmergencyContact,
//   triggerEmergency,
//   updateEmergencySettings
// } = require('../controllers/emergencyController');
// const { protect } = require('../middleware/authMiddleware');

// router.route('/config')
//   .get(protect, getEmergencyConfig)
//   .post(protect, addEmergencyContact);

// router.route('/config/:id')
//   .put(protect, updateEmergencyContact)
//   .delete(protect, deleteEmergencyContact);

// router.post('/sos', protect, triggerEmergency);
// router.put('/settings', protect, updateEmergencySettings);

// module.exports = router;


const express = require('express');
const router = express.Router();
const {
  getEmergencyConfig,
  addEmergencyContact,
  updateEmergencyContact,
  deleteEmergencyContact,
  triggerEmergency,
  updateEmergencySettings
} = require('../controllers/emergencyController');
const { protect } = require('../middleware/authMiddleware');

router.route('/config')
  .get(protect, getEmergencyConfig)
  .post(protect, addEmergencyContact);

router.route('/config/:id')
  .put(protect, updateEmergencyContact)
  .delete(protect, deleteEmergencyContact);

router.post('/sos', protect, triggerEmergency);
router.put('/settings', protect, updateEmergencySettings);

module.exports = router;