const jwt = require('jsonwebtoken');
const config = require('../config/db');

// Generate token
exports.generateToken = (userId) => {
  return jwt.sign({ id: userId }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn
  });
};

// Verify token
exports.verifyToken = (token) => {
  return jwt.verify(token, config.jwtSecret);
};