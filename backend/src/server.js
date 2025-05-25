require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const questionRoutes = require('./routes/questions');
const surveyRoutes = require('./routes/survey');
const surveyPublicRoutes = require('./routes/surveys');
const evaluationRoutes = require('./routes/evaluation');
const llmConfigRoutes = require('./routes/llm-config');
const responseRoutes = require('./routes/responses');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/question', questionRoutes);
app.use('/api/survey', surveyRoutes);
app.use('/api/surveys', surveyPublicRoutes);
app.use('/api/evaluation', evaluationRoutes);
app.use('/api/llm-config', llmConfigRoutes);
app.use('/api/responses', responseRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'ReadyBot API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred'
  });
});

// Database connection and server start
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Sync database models (in development only)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync();
      console.log('Database models synchronized.');
    }
    
    app.listen(PORT, () => {
      console.log(`ReadyBot server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app; // For testing
