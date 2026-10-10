const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const connectDB = require('./config/db');
const { initializeSeedIfNeeded } = require('./services/seedService');
const { authenticate } = require('./middleware/auth');

// Route imports
const authRoutes = require('./routes/authRoutes');
const demoRoutes = require('./routes/demoRoutes');
const donationRoutes = require('./routes/donationRoutes');
const claimRoutes = require('./routes/claimRoutes');
const clockRoutes = require('./routes/clockRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const leaderboardRoutes = require('./routes/leaderboardRoutes');
const communityHeroRoutes = require('./routes/communityHeroRoutes');

const app = express();
const PORT = process.env.PORT || 5001;

// Core Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Global Persona & Auth Context Middleware
app.use(authenticate);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/session', authRoutes);
app.use('/api/demo', demoRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api/clock', clockRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/leaderboards', leaderboardRoutes);
app.use('/api/community-heroes', communityHeroRoutes);
app.use('/api/profile', communityHeroRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    app: 'SurplusLink API',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Serve frontend build if available (single-container / hosted ready)
const clientBuildPath = path.resolve(__dirname, '../../client/dist');
app.use(express.static(clientBuildPath));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(clientBuildPath, 'index.html'), (err) => {
    if (err) {
      res.status(200).send('SurplusLink API is running. Client build not found at dist.');
    }
  });
});

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    errors: err.errors || [err.message]
  });
});

async function startServer() {
  try {
    await connectDB();
    await initializeSeedIfNeeded();

    const server = app.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(` SurplusLink Backend running on port ${PORT}`);
      console.log(` API Health: http://localhost:${PORT}/api/health`);
      console.log(`===============================================`);
    });

    return server;
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = { app, startServer };
