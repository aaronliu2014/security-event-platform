import express from 'express';
import * as newsService from '../services/newsService.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * GET /api/news
 * Get paginated news articles with optional filtering.
 */
router.get('/', async (req, res) => {
  try {
    const {
      limit = 20,
      offset = 0,
      tag,
      source,
      minRelevance,
      sortBy = 'published_date',
      sortOrder = 'DESC',
    } = req.query;

    const result = await newsService.getNewsArticles({
      limit: Math.min(parseInt(limit), 50),
      offset: parseInt(offset),
      tag,
      source,
      minRelevance: minRelevance !== undefined ? parseFloat(minRelevance) : 0.01,
      sortBy,
      sortOrder,
    });

    res.json({ success: true, data: result.rows, total: result.total });
  } catch (error) {
    logger.error(`Error fetching news: ${error.message}`);
    res.status(500).json({ success: false, error: 'Failed to fetch news', message: error.message });
  }
});

/**
 * GET /api/news/featured
 * Get top AI-relevant featured articles.
 */
router.get('/featured', async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    const articles = await newsService.getFeaturedNews(Math.min(parseInt(limit), 10));
    res.json({ success: true, data: articles });
  } catch (error) {
    logger.error(`Error fetching featured news: ${error.message}`);
    res.status(500).json({ success: false, error: 'Failed to fetch featured news', message: error.message });
  }
});

/**
 * GET /api/news/tags
 * Get trending AI topic tags.
 */
router.get('/tags', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const tags = await newsService.getTrendingTags(Math.min(parseInt(limit), 30));
    res.json({ success: true, data: tags });
  } catch (error) {
    logger.error(`Error fetching trending tags: ${error.message}`);
    res.status(500).json({ success: false, error: 'Failed to fetch tags', message: error.message });
  }
});

/**
 * GET /api/news/search
 * Search news articles.
 */
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 50 } = req.query;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Search keyword is required' });
    }

    const articles = await newsService.searchNews(q, Math.min(parseInt(limit), 100));
    res.json({ success: true, data: articles, count: articles.length, query: q });
  } catch (error) {
    logger.error(`Error searching news: ${error.message}`);
    res.status(500).json({ success: false, error: 'Failed to search news', message: error.message });
  }
});

export default router;
