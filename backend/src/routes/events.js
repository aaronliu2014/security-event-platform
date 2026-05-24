import express from 'express';
import * as eventService from '../services/eventService.js';
import { schemas, validate } from '../validators/index.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * GET /api/events
 * Get events with optional filtering
 */
router.get('/', validate(schemas.eventsQuery, 'query'), async (req, res) => {
  try {
    const {
      limit = 50,
      offset = 0,
      severity,
      source,
      eventType,
      sortBy = 'published_date',
      sortOrder = 'DESC',
    } = req.query;

    const events = await eventService.getEvents({
      limit: Math.min(parseInt(limit), 200),
      offset: parseInt(offset),
      severity,
      source,
      eventType,
      sortBy,
      sortOrder,
    });

    res.json({
      success: true,
      data: events,
      count: events.length,
    });
  } catch (error) {
    logger.error(`Error fetching events: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch events',
      message: error.message,
    });
  }
});

/**
 * GET /api/events/search
 * Search events by keyword
 */
router.get('/search', validate(schemas.searchQuery, 'query'), async (req, res) => {
  try {
    const { q, limit = 50 } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Search keyword is required',
      });
    }

    const events = await eventService.searchEvents(q, Math.min(parseInt(limit), 200));

    res.json({
      success: true,
      data: events,
      count: events.length,
      query: q,
    });
  } catch (error) {
    logger.error(`Error searching events: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to search events',
      message: error.message,
    });
  }
});

/**
 * GET /api/events/stats
 * Get event statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await eventService.getEventStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error(`Error fetching stats: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics',
      message: error.message,
    });
  }
});

/**
 * GET /api/events/source/:source
 * Get events by source
 */
router.get('/source/:source', async (req, res) => {
  try {
    const { source } = req.params;
    const { limit = 100 } = req.query;

    const events = await eventService.getEventsBySource(source, Math.min(parseInt(limit), 500));

    res.json({
      success: true,
      data: events,
      count: events.length,
      source,
    });
  } catch (error) {
    logger.error(`Error fetching events by source: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch events',
      message: error.message,
    });
  }
});

/**
 * GET /api/events/:id
 * Get event by ID — MUST be last to not shadow /search, /stats, /source
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const event = await eventService.getEventById(id);

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found',
      });
    }

    res.json({
      success: true,
      data: event,
    });
  } catch (error) {
    logger.error(`Error fetching event ${req.params.id}: ${error.message}`);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch event',
      message: error.message,
    });
  }
});

export default router;
