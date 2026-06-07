import express from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { schemas, validate } from '../validators/index.js';
import * as analysisService from '../services/analysisService.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * GET /api/analysis/clusters
 * Get event clusters
 */
router.get('/clusters', async (req, res) => {
  try {
    const clusters = await analysisService.clusterEvents();

    res.json({
      success: true,
      data: clusters,
      count: clusters.length,
    });
  } catch (error) {
    logger.error(`Error fetching clusters: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch clusters',
    });
  }
});

/**
 * POST /api/analysis/tags/:eventId
 * Tag an event
 */
router.post('/tags/:eventId', authenticateToken, requireRole('analyst'), validate(schemas.addTag), async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const { tag_name, severity } = req.body;

    if (!tag_name) {
      return res.status(400).json({
        success: false,
        error: 'tag_name is required',
      });
    }

    const tag = await analysisService.tagEvent(eventId, tag_name, severity);

    res.status(201).json({
      success: true,
      message: 'Tag added successfully',
      data: tag,
    });
  } catch (error) {
    logger.error(`Error tagging event: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to tag event',
    });
  }
});

/**
 * GET /api/analysis/tags/:eventId
 * Get event tags
 */
router.get('/tags/:eventId', async (req, res) => {
  try {
    const eventId = req.params.eventId;
    const tags = await analysisService.getEventTags(eventId);

    res.json({
      success: true,
      data: tags,
      count: tags.length,
    });
  } catch (error) {
    logger.error(`Error fetching tags: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tags',
    });
  }
});

/**
 * GET /api/analysis/trends
 * Get event trends
 */
router.get('/trends', validate(schemas.trendsQuery, 'query'), async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const trends = await analysisService.analyzeTrends(parseInt(days));

    res.json({
      success: true,
      data: trends,
      period_days: parseInt(days),
    });
  } catch (error) {
    logger.error(`Error analyzing trends: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze trends',
    });
  }
});

/**
 * GET /api/analysis/severity-distribution
 * Get severity distribution
 */
router.get('/severity-distribution', async (req, res) => {
  try {
    const distribution = await analysisService.analyzeSeverityDistribution();

    res.json({
      success: true,
      data: distribution,
    });
  } catch (error) {
    logger.error(`Error analyzing severity distribution: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze severity distribution',
    });
  }
});

export default router;
