const mongoose = require('mongoose');

const cycleSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  symptoms: [{
    date: { type: Date, required: true },
    symptomType: { type: String, required: true },
    severity: { type: Number, min: 1, max: 5 },
    notes: { type: String }
  }],
  predictions: [{
    date: { type: Date, required: true },
    prediction: { type: String, required: true },
    accuracy: { type: Number, min: 0, max: 1 }
  }],
  completed: { type: Boolean, default: false }
});

module.exports = mongoose.model('Cycle', cycleSchema);