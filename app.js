// const express = require('express');
// const cors = require('cors');
// const helmet = require('helmet');
// const morgan = require('morgan');
// const cookieParser = require('cookie-parser');

// const authRoutes = require('./routes/authRoutes');
// const trackerRoutes = require('./routes/trackerRoutes');
// const gptRoutes = require('./routes/gptRoutes');
// const partnerRoutes = require('./routes/partnerRoutes');
// const emergencyRoutes = require('./routes/emergencyRoutes');
// const predictionRoutes = require('./routes/predictionRoutes');
// const insightsRoutes = require('./routes/insightsRoutes');
// const cycleRoutes = require('./routes/cycleRoutes')
// const periodRoutes = require('./routes/periodRoutes');
// const errorHandler = require('./middleware/errorMiddleware');
// const pcosAssessment = require('./routes/pcosAssessment')
// const app = express();
// const socketio = require('socket.io');
// const http = require('http');
// // Middleware
// app.use(cors({
//   origin: process.env.FRONTEND_URL,
//   credentials: true
// }));
// app.use(helmet());
// app.use(morgan('dev'));
// app.use(express.json());
// app.use(cookieParser());

// // Routes
// app.use('/api/auth', authRoutes);
// app.use('/api/tracker', trackerRoutes);
// app.use('/api/gpt', gptRoutes);
// app.use('/api/partner', partnerRoutes);
// app.use('/api/emergency', emergencyRoutes);
// app.use('/api/prediction', predictionRoutes);
// app.use('/api/insights', insightsRoutes);
// app.use('/api/cycles', cycleRoutes);
// app.use('/api/period-tracker', periodRoutes);
// app.use('/api/pcos-assessment', pcosAssessment);
// // Error handling
// // app.use(errorHandler);

// module.exports = app;


const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const { createServer } = require('http');
const { Server } = require('socket.io');

// Route imports
const authRoutes = require('./routes/authRoutes');
const trackerRoutes = require('./routes/trackerRoutes');
const gptRoutes = require('./routes/gptRoutes');
const partnerRoutes = require('./routes/partnerRoutes');
const emergencyRoutes = require('./routes/emergencyRoutes');
const predictionRoutes = require('./routes/predictionRoutes');
const insightsRoutes = require('./routes/insightsRoutes');
const cycleRoutes = require('./routes/cycleRoutes');
const periodRoutes = require('./routes/periodRoutes');
const pcosAssessment = require('./routes/pcosAssessment');
const communityRoutes = require('./routes/community');
const errorHandler = require('./middleware/errorMiddleware');

// Initialize app
dotenv.config();
const app = express();
const httpServer = createServer(app);

// Socket.io setup
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }
});

// Real-time functionality
io.on('connection', (socket) => {
  console.log('A user connected');
  
  // Join user-specific room for notifications
  socket.on('joinUserRoom', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined their room`);
  });
  
  // Community-specific events
  socket.on('joinPostRoom', (postId) => {
    socket.join(`post_${postId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());

// Make io accessible in routes
app.set('io', io);



// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tracker', trackerRoutes);
app.use('/api/gpt', gptRoutes);
app.use('/api/partner', partnerRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/prediction', predictionRoutes);
app.use('/api/insights', insightsRoutes);
app.use('/api/cycles', cycleRoutes);
app.use('/api/period-tracker', periodRoutes);
app.use('/api/pcos-assessment', pcosAssessment);
app.use('/api/community', communityRoutes);

// Error handling
app.use(errorHandler);

module.exports = httpServer;