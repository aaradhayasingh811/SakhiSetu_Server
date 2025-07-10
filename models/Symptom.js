const mongoose = require('mongoose');

const symptomSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, required: true },
  history: [{
    date: { type: Date, required: true },
    severity: { type: Number, min: 1, max: 5 },
    notes: { type: String }
  }]
});

module.exports = mongoose.model('Symptom', symptomSchema);