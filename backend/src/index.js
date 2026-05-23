import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import logger from './utils/logger.js';
import { config } from './config/index.js';
import * as collectionScheduler from './tasks/collectionScheduler.js';

// Import routes
import eventRoutes from './routes/events.js';
import adminRoutes from './routes/admin.js';

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    environment: config.env,
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/api/events', eventRoutes);
app.use('/api/admin', adminRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`Error: ${err.message}`, err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    status: err.status || 500,
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    status: 404,
  });
});

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT} in ${config.env} mode`);

  // Initialize data collection scheduler
  try {
    const collectionFrequency = process.env.COLLECTION_FREQUENCY || 'daily';
    logger.info(`Initializing collection scheduler with frequency: ${collectionFrequency}`);
    collectionScheduler.scheduleCollectionTask(collectionFrequency);
    logger.info('Data collection scheduler initialized successfully');
  } catch (error) {
    logger.error(`Failed to initialize collection scheduler: ${error.message}`);
  }
});

export default app;
