import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import * as collectionScheduler from '../tasks/collectionScheduler.js';
import logger from '../utils/logger.js';

const router = express.Router();

router.use(authenticateToken);
router.use(requireRole('admin'));

/**
 * GET /api/admin/collection/status
 * Get data collection task status
 */
router.get('/collection/status', (req, res) => {
  try {
    const status = collectionScheduler.getTaskStatus();
    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    logger.error(`Error getting collection status: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to get collection status',
    });
  }
});

/**
 * POST /api/admin/collection/run
 * Manually trigger data collection
 */
router.post('/collection/run', async (req, res) => {
  try {
    logger.info('Manual data collection triggered');
    const result = await collectionScheduler.executeCollectionTask();

    res.json({
      success: result.success,
      data: result.stats || result.error,
      message: result.success ? 'Data collection completed' : 'Data collection failed',
    });
  } catch (error) {
    logger.error(`Error running manual collection: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to run data collection',
      message: error.message,
    });
  }
});

/**
 * POST /api/admin/collection/schedule
 * Update collection frequency
 */
router.post('/collection/schedule', (req, res) => {
  try {
    const { frequency } = req.body;

    if (!frequency) {
      return res.status(400).json({
        success: false,
        error: 'Frequency parameter is required',
      });
    }

    const validFrequencies = [
      'hourly',
      'every-4-hours',
      'daily',
      'twice-daily',
      'weekly',
      'monthly',
    ];

    if (!validFrequencies.includes(frequency)) {
      return res.status(400).json({
        success: false,
        error: `Invalid frequency. Allowed values: ${validFrequencies.join(', ')}`,
      });
    }

    logger.info(`Updating collection frequency to: ${frequency}`);
    const status = collectionScheduler.updateCollectionFrequency(frequency);

    res.json({
      success: true,
      data: status,
      message: `Collection frequency updated to: ${frequency}`,
    });
  } catch (error) {
    logger.error(`Error updating collection frequency: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to update collection frequency',
      message: error.message,
    });
  }
});

/**
 * POST /api/admin/collection/stop
 * Stop scheduled collection
 */
router.post('/collection/stop', (req, res) => {
  try {
    logger.info('Stopping data collection task');
    const cancelled = collectionScheduler.cancelCollectionTask();

    res.json({
      success: cancelled,
      message: cancelled ? 'Collection task stopped' : 'No active collection task',
    });
  } catch (error) {
    logger.error(`Error stopping collection: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to stop collection',
    });
  }
});

/**
 * GET /api/admin/health
 * System health check
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

export default router;
