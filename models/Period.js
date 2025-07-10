const mongoose = require('mongoose');

const periodSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  startDate: {
    type: Date,
    // required: true
  },
  endDate: {
    type: Date,
    // required: true
  },
  symptoms: {
    type: [String],
    default: []
  },
  notes: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
periodSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

const Period = mongoose.model('Period', periodSchema);

module.exports = Period;