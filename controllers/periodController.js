const Period = require('../models/Period');
const { validationResult } = require('express-validator');

// Get all periods for the authenticated user
exports.getAllPeriods = async (req, res) => {
  try {
    const periods = await Period.find({ userId: req.user.id }).sort({ startDate: -1 });
    res.json({
      success: true,
      data: periods
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// Create a new period
exports.createPeriod = async (req, res) => {
  // Validate input
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  try {
    const { startDate, endDate, symptoms, notes } = req.body;

    const newPeriod = new Period({
      userId: req.user.id,
      startDate,
      endDate,
      symptoms: symptoms || [],
      notes: notes || ''
    });

    const period = await newPeriod.save();
    
    res.status(201).json({
      success: true,
      data: period
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// Update a period
exports.updatePeriod = async (req, res) => {
  try {
    const { startDate, endDate, symptoms, notes } = req.body;

    let period = await Period.findById(req.params.id);

    if (!period) {
      return res.status(404).json({
        success: false,
        message: 'Period not found'
      });
    }

    // Make sure user owns the period
    if (period.userId.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    period = await Period.findByIdAndUpdate(
      req.params.id,
      {
        startDate,
        endDate,
        symptoms: symptoms || [],
        notes: notes || ''
      },
      { new: true }
    );

    res.json({
      success: true,
      data: period
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// Delete a period
exports.deletePeriod = async (req, res) => {
  try {
    const period = await Period.findById(req.params.id);

    if (!period) {
      return res.status(404).json({
        success: false,
        message: 'Period not found'
      });
    }

    // Make sure user owns the period
    if (period.userId.toString() !== req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized'
      });
    }

    await period.deleteOne({
        _id: req.params.id
    });

    res.json({
      success: true,
      message: 'Period removed'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};