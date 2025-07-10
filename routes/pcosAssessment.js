// routes/pcosAssessment.js
const express = require('express');
const router = express.Router();
const PcosAssessment = require('../models/PcosAssessment');
const { protect } = require('../middleware/authMiddleware');

// Apply authentication middleware to all routes
router.use(protect);
// Save a new PCOS assessment
router.post('/', async (req, res) => {
  try {
    const {
      age,
      isRegular,
      cycleLength,
      BMI,
      weightGain,
      hairGrowth,
      pimples,
      hairLoss,
      skinDarkening,
      fastFood,
      exercise,
      riskLevel,
      message,
      showDoctor
    } = req.body;

    const assessment = new PcosAssessment({
      user: req.user.id,
      age,
      cycleRegularity: isRegular,
      cycleLength,
      bmi:BMI,
      weightGain,
      hairGrowth,
      pimples,
      hairLoss,
      skinDarkening,
      fastFood,
      exercise,
      riskLevel,
      message,
      showDoctor
    });

    await assessment.save();
    res.json(assessment);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Get all assessments for a user
router.get('/', async (req, res) => {
  try {
    const assessments = await PcosAssessment.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(10);
    res.json(assessments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Get the latest assessment
router.get('/latest', async (req, res) => {
  try {
    const assessment = await PcosAssessment.findOne({ user: req.user.id })
      .sort({ createdAt: -1 });
      
    if (!assessment) {
      return res.status(200).json({ msg: 'No assessments found', code:"200" });
    }
    
    res.json(assessment);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;