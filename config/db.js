module.exports = {
  mongoURI: process.env.MONGO_URI || 'mongodb://localhost:27017/menstrual-health',
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key-here',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '30d',
  mlServerUrl: process.env.ML_SERVER_URL || 'http://localhost:5001'
};