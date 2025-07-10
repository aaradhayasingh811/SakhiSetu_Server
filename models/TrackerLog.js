const mongoose = require('mongoose');

const TrackerLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: [true, 'Please provide a date'],
    default: Date.now
  },
  painLevel: {
    type: Number,
    min:0,
    max:10,
    default: 0
  },
  mood: {
    type: String,
    enum: [ 'happy', 'neutral', 'sad', 'angry', 'anxious', 'irritated'],
    default: 'neutral'
  },
  energyLevel: {
   type: Number,
    min:0,
    max:10,
    default: 8
  },
  notes: {
    type: String,
    maxlength: [500, 'Notes cannot be more than 500 characters']
  },
  flow: {
    type: String,
    enum: ['none', 'light', 'medium', 'heavy'],
    default: 'none'
  },
  periodStatus: {
    type: String,
    enum: ['none', 'start', 'end', 'ongoing'],
    default: 'none'
  },
  sleepHours: {
    type: Number,
    min: [0, 'Sleep hours cannot be negative'],
    max: [24, 'Sleep hours cannot be more than 24']
  },
  symptoms: {
    type: [String],
    enum: [
      'headache', 'bloating', 'cramps', 'tender-breasts', 'acne', 
      'food-cravings', 'fatigue', 'back-pain', 'nausea', 'constipation',
      'diarrhea', 'dizziness', 'insomnia', 'anxiety', 'mood-swings'
    ]
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure one log per user per day
TrackerLogSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('TrackerLog', TrackerLogSchema);