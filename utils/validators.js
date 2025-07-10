const validator = require('validator');
const moment = require('moment');

exports.validateRegisterInput = (data) => {
  const errors = {};
  
  if (!validator.isLength(data.name, { min: 2, max: 30 })) {
    errors.name = 'Name must be between 2 and 30 characters';
  }

  if (!validator.isEmail(data.email)) {
    errors.email = 'Email is invalid';
  }

  if (!validator.isLength(data.password, { min: 6 })) {
    errors.password = 'Password must be at least 6 characters';
  }

  if (data.age < 13 || data.age > 60) {
    errors.age = 'Age must be between 13 and 60';
  }

  if (data.avgCycleLength < 21 || data.avgCycleLength > 35) {
    errors.avgCycleLength = 'Cycle length is typically between 21-35 days';
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0
  };
};

exports.validateTrackerLog = (data) => {
  const errors = {};
  
  if (!moment(data.date, moment.ISO_8601, true).isValid()) {
    errors.date = 'Invalid date format';
  }

  const validMoods = ['very-happy', 'happy', 'neutral', 'sad', 'very-sad', 'anxious', 'irritable'];
  if (data.mood && !validMoods.includes(data.mood)) {
    errors.mood = 'Invalid mood value';
  }

  const validFlow = ['none', 'light', 'medium', 'heavy'];
  if (data.flow && !validFlow.includes(data.flow)) {
    errors.flow = 'Invalid flow value';
  }

  return {
    errors,
    isValid: Object.keys(errors).length === 0
  };
};