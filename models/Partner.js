const mongoose = require('mongoose');

const PartnerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: [true, 'Please provide partner name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  phone: {
    type: String
  },
  relationshipType: {
    type: String,
    enum: ['Partner',
    'Spouse',
    'Friend',
    'Family',
    'Caregiver',
    'Other'],
    default: 'Partner'
  },
  consent: {
    type: Boolean,
    default: false
  },
  notificationPreferences: {
    type: [String],
    enum: ['email', 'sms', 'whatsapp', 'none'],
    default: ['email']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Partner', PartnerSchema);