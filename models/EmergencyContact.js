// models/EmergencyContact.js
const mongoose = require('mongoose');

const EmergencyContactSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  contactMethod: {
    type: String,
    required: true,
    enum: ['phone', 'email']
  },
  contactInfo: {
    type: String,
    required: [true, 'Please add contact information'],
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Validate phone number if contactMethod is phone
EmergencyContactSchema.path('contactInfo').validate(function(value) {
  if (this.contactMethod === 'phone') {
    return /^\+?[0-9\s\-]+$/.test(value);
  }
  return true;
}, 'Invalid phone number format');

// Validate email if contactMethod is email
EmergencyContactSchema.path('contactInfo').validate(function(value) {
  if (this.contactMethod === 'email') {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }
  return true;
}, 'Invalid email format');

module.exports = mongoose.model('EmergencyContact', EmergencyContactSchema);