import pool from '../utils/database.js';
import logger from '../utils/logger.js';
import { get, set, cacheKey } from '../utils/cache.js';

/**
 * Get paginated news articles with optional AI topic and source filtering.
 * Returns { rows, total } for pagination. Defaults to AI-relevant content only.
 */
export async function getNewsArticles(options = {}) {
  const {
    limit = 20,
    offset = 0,
    tag = null,
    source = null,
    minRelevance = 0.01,
    sortBy = 'published_date',
    sortOrder = 'DESC',
  } = options;

  const ck = cacheKey('news', tag || 'all', source || 'all', String(minRelevance), sortBy, sortOrder, limit, offset);
  const cached = await get(ck);
  if (cached) return cached;

  try {
    const params = [];
    let paramIndex = 1;

    const whereClauses = ["e.event_type = 'news'"];

    if (minRelevance !== null && minRelevance !== undefined && minRelevance > 0) {
      whereClauses.push(`e.ai_relevance_score >= $${paramIndex++}`);
      params.push(Number(minRelevance));
    }

    if (tag) {
      whereClauses.push(`e.id IN (SELECT event_id FROM event_tags WHERE tag_name = $${paramIndex++})`);
      params.push(tag);
    }

    if (source) {
      whereClauses.push(`e.source = $${paramIndex++}`);
      params.push(source);
    }

    const whereSQL = whereClauses.join(' AND ');

    const validSortColumns = ['published_date', 'collected_date', 'ai_relevance_score', 'severity', 'title'];
    const finalSortBy = validSortColumns.includes(sortBy) ? sortBy : 'published_date';
    const finalSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) as total FROM events e WHERE ${whereSQL}`,
      params
    );
    const total = parseInt(countResult.rows[0]?.total || 0);

    // Get paginated rows
    const dataParams = [...params];
    const dataQuery = `SELECT e.*, COALESCE(
      (SELECT json_group_array(et.tag_name)
       FROM event_tags et WHERE et.event_id = e.id), '[]'
    ) as tags
    FROM events e
    WHERE ${whereSQL}
    ORDER BY e.${finalSortBy} ${finalSortOrder}
    LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    dataParams.push(limit, offset);

    const result = await pool.query(dataQuery, dataParams);
    const rows = (result.rows || []).map(parseNewsRow);

    const data = { rows, total };
    await set(ck, data, 300);
    return data;
  } catch (error) {
    logger.error(`Error fetching news articles: ${error.message}`);
    throw error;
  }
}

/**
 * Get featured (top AI-relevant) news articles for the hero section.
 */
export async function getFeaturedNews(limit = 5) {
  const ck = cacheKey('news', 'featured', limit);
  const cached = await get(ck);
  if (cached) return cached;

  try {
    const result = await pool.query(
      `SELECT e.*, COALESCE(
        (SELECT json_group_array(et.tag_name)
         FROM event_tags et WHERE et.event_id = e.id), '[]'
      ) as tags
      FROM events e
      WHERE e.event_type = 'news'
      ORDER BY e.ai_relevance_score DESC, e.published_date DESC
      LIMIT $1`,
      [limit]
    );
    const rows = (result.rows || []).map(parseNewsRow);
    await set(ck, rows, 300);
    return rows;
  } catch (error) {
    logger.error(`Error fetching featured news: ${error.message}`);
    throw error;
  }
}

/**
 * Get trending AI topic tags with article counts.
 */
export async function getTrendingTags(limit = 20) {
  const ck = cacheKey('news', 'tags', limit);
  const cached = await get(ck);
  if (cached) return cached;

  try {
    const result = await pool.query(
      `SELECT et.tag_name, COUNT(*) as article_count
       FROM event_tags et
       JOIN events e ON et.event_id = e.id
       WHERE e.event_type = 'news'
       GROUP BY et.tag_name
       ORDER BY article_count DESC
       LIMIT $1`,
      [limit]
    );
    await set(ck, result.rows || [], 600);
    return result.rows || [];
  } catch (error) {
    logger.error(`Error fetching trending tags: ${error.message}`);
    return [];
  }
}

/**
 * Search news articles by keyword.
 */
export async function searchNews(keyword, limit = 50) {
  const ck = cacheKey('news', 'search', keyword, limit);
  const cached = await get(ck);
  if (cached) return cached;

  try {
    const query = `
      SELECT e.*, COALESCE(
        (SELECT json_group_array(et.tag_name)
         FROM event_tags et WHERE et.event_id = e.id), '[]'
      ) as tags
      FROM events e
      WHERE e.event_type = 'news'
        AND (e.title ILIKE $1 OR e.description ILIKE $1)
      ORDER BY e.published_date DESC
      LIMIT $2
    `;
    const searchPattern = `%${keyword}%`;
    const result = await pool.query(query, [searchPattern, limit]);
    const rows = (result.rows || []).map(parseNewsRow);
    await set(ck, rows, 120);
    return rows;
  } catch (error) {
    logger.error(`Error searching news: ${error.message}`);
    throw error;
  }
}

function parseNewsRow(row) {
  if (!row) return row;
  let tags = [];
  if (row.tags) {
    try {
      tags = typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags;
    } catch {
      tags = [];
    }
  }
  return { ...row, tags };
}

export default {
  getNewsArticles,
  getFeaturedNews,
  getTrendingTags,
  searchNews,
};
