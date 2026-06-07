import pool from '../utils/database.js';
import logger from '../utils/logger.js';
import { get, set, cacheKey } from '../utils/cache.js';

// Extract CVE IDs from text
const extractCVEs = (text) => {
  const cveRegex = /CVE-\d{4}-\d{4,}/gi;
  const matches = text.match(cveRegex);
  return matches ? matches.map(m => m.toUpperCase()) : [];
};

// Extract keywords from text
const extractKeywords = (text) => {
  // Common security terms to extract as keywords
  const keywords = [
    'vulnerability', 'exploit', 'patch', 'security', 'malware',
    'breach', 'attack', 'threat', 'critical', 'zero-day',
    'remote', 'execution', 'denial', 'service', 'injection',
    'xss', 'sql', 'authentication', 'privilege', 'escalation'
  ];

  const foundKeywords = new Set();
  keywords.forEach(kw => {
    if (text.toLowerCase().includes(kw)) {
      foundKeywords.add(kw);
    }
  });

  return Array.from(foundKeywords);
};

// Similarity score calculation (Jaccard similarity)
const calculateSimilarity = (keywords1, keywords2) => {
  const set1 = new Set(keywords1);
  const set2 = new Set(keywords2);

  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  if (union.size === 0) return 0;
  return intersection.size / union.size;
};

// Cluster events by similar keywords and CVE IDs
export const clusterEvents = async (eventIds = null) => {
  try {
    const ck = cacheKey('analysis', 'clusters');
    const cached = await get(ck);
    if (cached && !eventIds) return cached;

    // Fetch events
    let query = 'SELECT id, title, description, source, severity FROM events';
    let params = [];

    if (eventIds && eventIds.length > 0) {
      const placeholders = eventIds.map((_, i) => `$${i + 1}`).join(',');
      query += ` WHERE id IN (${placeholders})`;
      params = eventIds;
    }

    const result = await pool.query(query, params);
    const events = result.rows;

    if (events.length === 0) return [];

    // Extract metadata for each event
    const eventData = events.map(event => ({
      ...event,
      cves: extractCVEs(event.title + ' ' + (event.description || '')),
      keywords: extractKeywords(event.title + ' ' + (event.description || '')),
    }));

    // Cluster events
    const clusters = [];
    const visited = new Set();

    eventData.forEach((event, index) => {
      if (visited.has(index)) return;

      const cluster = [event];
      visited.add(index);

      // Find similar events
      eventData.forEach((otherEvent, otherIndex) => {
        if (visited.has(otherIndex) || index === otherIndex) return;

        // Check CVE similarity
        const commonCVEs = event.cves.filter(cve => otherEvent.cves.includes(cve));
        if (commonCVEs.length > 0) {
          cluster.push(otherEvent);
          visited.add(otherIndex);
          return;
        }

        // Check keyword similarity
        const similarity = calculateSimilarity(event.keywords, otherEvent.keywords);
        if (similarity >= 0.3) {
          cluster.push(otherEvent);
          visited.add(otherIndex);
        }
      });

      clusters.push({
        cluster_id: `cluster_${Date.now()}_${index}`,
        events: cluster.map(e => ({
          id: e.id,
          title: e.title,
          source: e.source,
          severity: e.severity,
        })),
        cluster_size: cluster.length,
        common_cves: [...new Set(cluster.flatMap(e => e.cves))],
        common_keywords: [...new Set(cluster.flatMap(e => e.keywords))],
      });
    });

    logger.info(`Clustered ${events.length} events into ${clusters.length} clusters`);
    if (!eventIds) await set(ck, clusters, 1800);
    return clusters;
  } catch (error) {
    logger.error(`Error clustering events: ${error.message}`);
    throw error;
  }
};

// Add tags to events
export const tagEvent = async (eventId, tagName, severity = 'unknown') => {
  try {
    const result = await pool.query(
      `INSERT INTO event_tags (event_id, tag_name, severity)
      VALUES ($1, $2, $3)
      ON CONFLICT (event_id, tag_name) DO UPDATE SET severity = $3
      RETURNING *`,
      [eventId, tagName, severity]
    );
    return result.rows[0];
  } catch (error) {
    logger.error(`Error tagging event: ${error.message}`);
    throw error;
  }
};

// Get tags for an event
export const getEventTags = async (eventId) => {
  try {
    const result = await pool.query(
      'SELECT * FROM event_tags WHERE event_id = $1',
      [eventId]
    );
    return result.rows;
  } catch (error) {
    logger.error(`Error fetching event tags: ${error.message}`);
    throw error;
  }
};

// Analyze trends - count events by severity over time
export const analyzeTrends = async (days = 30) => {
  try {
    const ck = cacheKey('analysis', 'trends', days);
    const cached = await get(ck);
    if (cached) return cached;

    const result = await pool.query(
      `SELECT
        DATE(published_date) as date,
        severity,
        COUNT(*) as count
      FROM events
      WHERE published_date >= NOW() - INTERVAL '1 day' * $1
      GROUP BY DATE(published_date), severity
      ORDER BY date DESC, severity`,
      [days]
    );

    const trends = {};
    result.rows.forEach(row => {
      const date = row.date.toISOString().split('T')[0];
      if (!trends[date]) {
        trends[date] = {};
      }
      trends[date][row.severity || 'unknown'] = parseInt(row.count);
    });

    logger.info(`Analyzed trends for last ${days} days`);
    await set(ck, trends, 1800);
    return trends;
  } catch (error) {
    logger.error(`Error analyzing trends: ${error.message}`);
    throw error;
  }
};

// Analyze severity distribution
export const analyzeSeverityDistribution = async () => {
  try {
    const ck = cacheKey('analysis', 'distribution');
    const cached = await get(ck);
    if (cached) return cached;

    const result = await pool.query(
      `SELECT severity, COUNT(*) as count
      FROM events
      GROUP BY severity
      ORDER BY count DESC`
    );

    const distribution = {};
    result.rows.forEach(row => {
      distribution[row.severity || 'unknown'] = parseInt(row.count);
    });

    logger.info('Analyzed severity distribution');
    await set(ck, distribution, 1800);
    return distribution;
  } catch (error) {
    logger.error(`Error analyzing severity distribution: ${error.message}`);
    throw error;
  }
};

export default {
  clusterEvents,
  tagEvent,
  getEventTags,
  analyzeTrends,
  analyzeSeverityDistribution,
};
