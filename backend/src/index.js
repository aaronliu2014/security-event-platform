import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import bodyParser from 'body-parser';
import logger from './utils/logger.js';
import { config } from './config/index.js';
import * as collectionScheduler from './tasks/collectionScheduler.js';
import * as userModel from './models/User.js';
import { initWebSocket } from './utils/websocket.js';

// Import routes
import eventRoutes from './routes/events.js';
import adminRoutes from './routes/admin.js';
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import analysisRoutes from './routes/analysis.js';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.js';

const app = express();

const isProduction = config.env === 'production';

const allowedOrigins = isProduction
  ? [process.env.FRONTEND_URL || 'https://localhost']
  : ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001'];

// Middleware
app.use(helmet({
  contentSecurityPolicy: isProduction ? undefined : false,
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: isProduction ? allowedOrigins : true,
  credentials: true,
}));

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later' },
});

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many login attempts, please try again later' },
});

app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Trust proxy for rate limiting behind nginx
app.set('trust proxy', 1);

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
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString(),
  });
});

// Swagger API documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api-docs.json', (req, res) => res.json(swaggerSpec));

// Routes
app.use('/api/events', eventRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/analysis', analysisRoutes);

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
const server = http.createServer(app);
initWebSocket(server);

const PORT = config.port;
server.listen(PORT, async () => {
  logger.info(`Server running on port ${PORT} in ${config.env} mode`);

  // Initialize database tables
  try {
    await userModel.initializeUserTables();
    logger.info('User tables initialized');
  } catch (error) {
    logger.error(`Failed to initialize user tables: ${error.message}`);
  }

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
