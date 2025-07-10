// models/PcosAssessment.js
const mongoose = require('mongoose');

const PcosAssessmentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  age: {
    type: Number,
    required: true
  },
  cycleRegularity: {
    type: Boolean,
    required: true
  },
  cycleLength: {
    type: Number,
    required: true
  },
  bmi: {
    type: Number,
    required: true
  },
  weightGain: {
    type: Boolean,
    required: true
  },
  hairGrowth: {
    type: Boolean,
    required: true
  },
  pimples: {
    type: Boolean,
    required: true
  },
  hairLoss: {
    type: Boolean,
    required: true
  },
  skinDarkening: {
    type: Boolean,
    required: true
  },
  fastFood: {
    type: Boolean,
    required: true
  },
  exercise: {
    type: Boolean,
    required: true
  },
  riskLevel: {
    type: String,
    enum: ['low', 'medium', 'high'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  showDoctor: {
    type: Boolean,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('PcosAssessment', PcosAssessmentSchema);