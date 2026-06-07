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
import { runMigrations } from './utils/migrations.js';
import { initWebSocket } from './utils/websocket.js';

// Import routes
import eventRoutes from './routes/events.js';
import adminRoutes from './routes/admin.js';
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import analysisRoutes from './routes/analysis.js';
import newsRoutes from './routes/news.js';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './config/swagger.js';

const app = express();

const isProduction = config.env === 'production';

const allowedOrigins = isProduction
  ? [
      process.env.FRONTEND_URL || 'https://aaronliu2014.github.io',
      'https://aaronliu2014.github.io',
      'https://aaronliu2014.github.io/security-event-platform',
    ]
  : ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001'];

// Middleware
app.use(helmet({
  contentSecurityPolicy: isProduction
    ? {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", 'https://aaronliu2014.github.io'],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://aaronliu2014.github.io'],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'", 'https://aaronliu2014.github.io'],
        },
      }
    : false,
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: isProduction
    ? (origin, callback) => {
        if (
          !origin ||
          allowedOrigins.includes(origin) ||
          origin.startsWith('https://aaronliu2014.github.io')
        ) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      }
    : true,
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
app.use('/api/news', newsRoutes);

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

// Catch unhandled errors so the process never crashes silently
process.on('uncaughtException', (err) => {
  logger.error(`Uncaught exception: ${err.message}`, err);
});
process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled rejection: ${reason?.message || reason}`);
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

  // Run migrations
  try {
    await runMigrations();
  } catch (error) {
    logger.error(`Failed to run migrations: ${error.message}`);
  }

  // Initialize data collection scheduler
  try {
    const collectionFrequency = process.env.COLLECTION_FREQUENCY || 'daily';
    logger.info(`Initializing collection scheduler with frequency: ${collectionFrequency}`);
    collectionScheduler.scheduleCollectionTask(collectionFrequency);
    logger.info('Data collection scheduler initialized successfully');

    // Run initial collection on startup if database has no news
    try {
      const { default: pool } = await import('./utils/database.js');
      const result = await pool.query("SELECT COUNT(*) as count FROM events WHERE event_type = 'news'");
      const newsCount = parseInt(result.rows[0]?.count || 0);
      if (newsCount === 0) {
        logger.info('No news in database, running initial data collection...');
        collectionScheduler.executeCollectionTask().then((res) => {
          logger.info(`Initial collection result: ${JSON.stringify(res)}`);
        });
      } else {
        logger.info(`Database already has ${newsCount} news articles, skipping initial collection`);
      }
    } catch (initErr) {
      logger.warn(`Could not check for initial data: ${initErr.message}`);
    }
  } catch (error) {
    logger.error(`Failed to initialize collection scheduler: ${error.message}`);
  }
});

export default app;
