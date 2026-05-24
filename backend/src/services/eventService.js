import pool from '../utils/database.js';
import logger from '../utils/logger.js';
import { get, set, delPattern, cacheKey } from '../utils/cache.js';

/**
 * Save events to database, handling duplicates
 */
export async function saveEvents(events, source) {
  if (!events || events.length === 0) {
    logger.info(`No events to save from ${source}`);
    return { saved: 0, skipped: 0, errors: [] };
  }

  const stats = {
    saved: 0,
    skipped: 0,
    errors: [],
  };

  for (const event of events) {
    try {
      const result = await pool.query(
        `INSERT INTO events (
          external_id, title, description, source, source_url,
          event_type, severity, affected_products, published_date,
          thumbnail_url, ai_relevance_score, content_hash, data
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (external_id) DO UPDATE SET
          last_updated = CURRENT_TIMESTAMP,
          ai_relevance_score = EXCLUDED.ai_relevance_score,
          data = EXCLUDED.data
        RETURNING id`,
        [
          event.external_id,
          event.title,
          event.description,
          event.source,
          event.source_url,
          event.event_type,
          event.severity,
          event.affected_products,
          event.published_date,
          event.thumbnail_url || null,
          event.ai_relevance_score || 0,
          event.content_hash || null,
          JSON.stringify(event.data || {}),
        ]
      );

      if (result.rows.length > 0) {
        stats.saved++;
      } else {
        stats.skipped++;
      }
    } catch (error) {
      stats.errors.push(`Failed to save ${event.external_id}: ${error.message}`);
      logger.error(`Error saving event ${event.external_id}: ${error.message}`);
    }
  }

  logger.info(`Saved ${stats.saved} events from ${source}, skipped ${stats.skipped}`);

  if (stats.saved > 0) {
    await delPattern(cacheKey('events', '*'));
    await delPattern(cacheKey('stats', '*'));
    await delPattern(cacheKey('search', '*'));
    await delPattern(cacheKey('analysis', '*'));
  }

  return stats;
}

/**
 * Get events from database with optional filtering
 */
export async function getEvents(options = {}) {
  const {
    limit = 100,
    offset = 0,
    severity = null,
    source = null,
    eventType = null,
    sortBy = 'published_date',
    sortOrder = 'DESC',
  } = options;

  const ck = cacheKey('events', severity || 'all', source || 'all', eventType || 'all', sortBy, sortOrder, limit, offset);
  const cached = await get(ck);
  if (cached) return cached;

  try {
    let query = 'SELECT * FROM events WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (severity) {
      query += ` AND severity = $${paramIndex++}`;
      params.push(severity);
    }

    if (source) {
      query += ` AND source = $${paramIndex++}`;
      params.push(source);
    }

    if (eventType) {
      query += ` AND event_type = $${paramIndex++}`;
      params.push(eventType);
    }

    // Validate sort column to prevent SQL injection
    const validSortColumns = ['published_date', 'collected_date', 'severity', 'title'];
    const finalSortBy = validSortColumns.includes(sortBy) ? sortBy : 'published_date';
    const finalSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    query += ` ORDER BY ${finalSortBy} ${finalSortOrder}`;
    query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);
    await set(ck, result.rows, 300);
    return result.rows;
  } catch (error) {
    logger.error(`Error fetching events: ${error.message}`);
    throw error;
  }
}

/**
 * Get event by ID
 */
export async function getEventById(id) {
  try {
    const ck = cacheKey('event', id);
    const cached = await get(ck);
    if (cached) return cached;

    const result = await pool.query('SELECT * FROM events WHERE id = $1', [id]);
    const event = result.rows[0] || null;
    if (event) await set(ck, event, 600);
    return event;
  } catch (error) {
    logger.error(`Error fetching event ${id}: ${error.message}`);
    throw error;
  }
}

/**
 * Search events by keyword
 */
export async function searchEvents(keyword, limit = 50) {
  try {
    const ck = cacheKey('search', keyword, limit);
    const cached = await get(ck);
    if (cached) return cached;

    const query = `
      SELECT * FROM events
      WHERE title ILIKE $1
         OR description ILIKE $1
         OR affected_products::text ILIKE $1
      ORDER BY published_date DESC
      LIMIT $2
    `;
    const searchPattern = `%${keyword}%`;
    const result = await pool.query(query, [searchPattern, limit]);
    await set(ck, result.rows, 120);
    return result.rows;
  } catch (error) {
    logger.error(`Error searching events: ${error.message}`);
    throw error;
  }
}

/**
 * Get event statistics
 */
export async function getEventStats() {
  try {
    const ck = cacheKey('stats');
    const cached = await get(ck);
    if (cached) return cached;

    const result = await pool.query(`
      SELECT
        COUNT(*) as total_events,
        COUNT(CASE WHEN severity = 'critical' THEN 1 END) as critical_count,
        COUNT(CASE WHEN severity = 'high' THEN 1 END) as high_count,
        COUNT(CASE WHEN severity = 'medium' THEN 1 END) as medium_count,
        COUNT(CASE WHEN severity = 'low' THEN 1 END) as low_count,
        COUNT(DISTINCT source) as total_sources,
        MAX(published_date) as latest_event,
        MAX(collected_date) as last_collection
      FROM events
    `);
    await set(ck, result.rows[0], 600);
    return result.rows[0];
  } catch (error) {
    logger.error(`Error fetching event stats: ${error.message}`);
    throw error;
  }
}

/**
 * Get events by source
 */
export async function getEventsBySource(source, limit = 100) {
  try {
    const result = await pool.query(
      `SELECT * FROM events WHERE source = $1 ORDER BY published_date DESC LIMIT $2`,
      [source, limit]
    );
    return result.rows;
  } catch (error) {
    logger.error(`Error fetching events from ${source}: ${error.message}`);
    throw error;
  }
}

/**
 * Update collection task status
 */
export async function updateCollectionTask(taskName, source, status, stats = {}) {
  try {
    const query = `
      INSERT INTO collection_tasks (
        task_name, source, status, items_processed, 
        items_failed, last_run_date, next_run_date
      ) VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (task_name, source) DO UPDATE SET
        status = EXCLUDED.status,
        items_processed = EXCLUDED.items_processed,
        items_failed = EXCLUDED.items_failed,
        last_run_date = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id
    `;

    const result = await pool.query(query, [
      taskName,
      source,
      status,
      stats.saved || 0,
      stats.errors?.length || 0,
    ]);

    return result.rows[0];
  } catch (error) {
    logger.error(`Error updating collection task: ${error.message}`);
    throw error;
  }
}

/**
 * Get events by their external_ids.
 */
export async function getEventsByExternalIds(externalIds) {
  if (!externalIds || externalIds.length === 0) return [];
  try {
    const placeholders = externalIds.map((_, i) => `$${i + 1}`).join(',');
    const result = await pool.query(
      `SELECT id, external_id FROM events WHERE external_id IN (${placeholders})`,
      externalIds
    );
    return result.rows || [];
  } catch (error) {
    logger.error(`Error fetching events by external ids: ${error.message}`);
    return [];
  }
}

/**
 * Save tags for an event into the event_tags table.
 */
export async function saveEventTags(eventId, tags) {
  if (!tags || tags.length === 0) return { saved: 0 };

  let saved = 0;
  for (const tag of tags) {
    try {
      await pool.query(
        `INSERT INTO event_tags (event_id, tag_name) VALUES ($1, $2)
         ON CONFLICT (event_id, tag_name) DO NOTHING`,
        [eventId, tag]
      );
      saved++;
    } catch {
      // duplicate tag, skip
    }
  }
  return { saved };
}

export default {
  saveEvents,
  getEvents,
  getEventById,
  searchEvents,
  getEventStats,
  getEventsBySource,
  updateCollectionTask,
  getEventsByExternalIds,
  saveEventTags,
};
