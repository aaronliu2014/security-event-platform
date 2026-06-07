import axios from 'axios';
import crypto from 'crypto';
import logger from '../utils/logger.js';

const NVD_API_BASE = 'https://services.nvd.nist.gov/rest/json/cves/2.0';
const CISA_API_BASE = 'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json';

const RATE_LIMIT_DELAY = 1000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// News feed configuration: AI security focused sources
const NEWS_FEEDS = [
  // AI / tech security (primary sources)
  { url: 'https://simonwillison.net/atom/everything/', source: 'SimonWillison', category: 'ai-security' },
  { url: 'https://www.schneier.com/feed/atom/', source: 'SchneierOnSecurity', category: 'ai-security' },
  // Security news (broad coverage including AI)
  { url: 'https://krebsonsecurity.com/feed/', source: 'KrebsOnSecurity', category: 'security-news' },
  { url: 'https://www.darkreading.com/rss.xml', source: 'DarkReading', category: 'security-news' },
  { url: 'https://www.bleepingcomputer.com/feed/', source: 'BleepingComputer', category: 'security-news' },
  { url: 'https://feeds.feedburner.com/TheHackersNews', source: 'TheHackerNews', category: 'security-news' },
  { url: 'https://www.securityweek.com/feed/', source: 'SecurityWeek', category: 'security-news' },
  // Security research (often covers AI/ML security)
  { url: 'https://blog.trailofbits.com/feed/', source: 'TrailOfBits', category: 'security-research' },
  // AI/ML specific publications
  { url: 'https://www.artificialintelligence-news.com/feed/', source: 'AI News', category: 'ai-news' },
  { url: 'https://blog.google/technology/ai/rss/', source: 'Google AI Blog', category: 'ai-news' },
  { url: 'https://openai.com/blog/rss.xml', source: 'OpenAI Blog', category: 'ai-news' },
  { url: 'https://www.anthropic.com/blog/rss.xml', source: 'Anthropic Blog', category: 'ai-news' },
  { url: 'https://unit42.paloaltonetworks.com/feed/', source: 'Unit42', category: 'security-research' },
  { url: 'https://www.csoonline.com/feed/', source: 'CSO Online', category: 'security-news' },
];

/**
 * Compute a content hash for deduplication across feeds.
 */
function computeContentHash(title, url) {
  const normalized = `${(title || '').toLowerCase().trim().slice(0, 200)}|${(url || '').toLowerCase().trim()}`;
  return crypto.createHash('sha256').update(normalized).digest('hex').substring(0, 64);
}

/**
 * Extract thumbnail URL from RSS feed item metadata.
 */
function extractThumbnail(item) {
  if (item.mediaContent && item.mediaContent.$ && item.mediaContent.$.url) {
    return item.mediaContent.$.url;
  }
  if (item.mediaThumbnail && item.mediaThumbnail.$ && item.mediaThumbnail.$.url) {
    return item.mediaThumbnail.$.url;
  }
  if (item.enclosure && item.enclosure.url) {
    return item.enclosure.url;
  }
  return null;
}

/**
 * Normalize NVD vulnerability to standard event format
 */
function normalizeNVDEvent(vuln) {
  const cveData = vuln.cve;
  const metrics = cveData.metrics?.cvssMetricV31 || cveData.metrics?.cvssMetricV30 || [];
  const v2Metrics = cveData.metrics?.cvssMetricV2 || [];
  const allMetrics = [...metrics, ...v2Metrics];

  const cvssData = allMetrics[0]?.cvssData || allMetrics[0]?.cvssData;
  let maxScore = 0;
  for (const m of allMetrics) {
    const s = m.cvssData?.baseScore || 0;
    if (s > maxScore) maxScore = s;
  }

  if (maxScore === 0 && metrics.length > 0) {
    maxScore = metrics[0].cvssData?.baseScore || 0;
  }
  if (maxScore === 0 && v2Metrics.length > 0) {
    maxScore = v2Metrics[0].cvssData?.baseScore || 0;
  }

  const severity = getSeverityLevel(maxScore);

  return {
    external_id: cveData.id,
    title: cveData.id,
    description: cveData.descriptions?.[0]?.value || '',
    source: 'NVD',
    source_url: `https://nvd.nist.gov/vuln/detail/${cveData.id}`,
    event_type: 'vulnerability',
    severity,
    affected_products: extractAffectedProducts(cveData.configurations),
    published_date: new Date(cveData.published),
    data: {
      cvss_score: maxScore,
      cvss_vector: allMetrics[0]?.cvssData?.vectorString || null,
      cwe_ids: cveData.weaknesses?.map((w) => w.description?.[0]?.value) || [],
    },
  };
}

/**
 * Normalize CISA event to standard format
 */
function normalizeCISAEvent(vuln) {
  const dateAdded = new Date(vuln.dateAdded);

  return {
    external_id: `CISA-${vuln.cveID}`,
    title: `${vuln.cveID} - ${vuln.vulnerabilityName}`,
    description: vuln.vulnerabilityName,
    source: 'CISA',
    source_url: `https://nvd.nist.gov/vuln/detail/${vuln.cveID}`,
    event_type: 'known-exploited-vulnerability',
    severity: 'high',
    affected_products: vuln.affectedProduct ? [vuln.affectedProduct] : [],
    published_date: dateAdded,
    data: {
      date_added: dateAdded,
      required_action: vuln.requiredAction,
      notes: vuln.notes,
    },
  };
}

/**
 * Convert CVSS score to severity level
 */
function getSeverityLevel(score) {
  if (score >= 9.0) return 'critical';
  if (score >= 7.0) return 'high';
  if (score >= 4.0) return 'medium';
  if (score > 0) return 'low';
  return 'unknown';
}

/**
 * Extract affected products from NVD configurations
 */
function extractAffectedProducts(configurations) {
  const products = new Set();
  if (!configurations) return [];

  configurations.forEach((config) => {
    config.nodes?.forEach((node) => {
      node.cpeMatch?.forEach((match) => {
        if (match.criteria) {
          const cpe = match.criteria.split(':');
          if (cpe.length >= 5) {
            products.add(`${cpe[4]}:${cpe[5]}`);
          }
        }
      });
    });
  });

  return Array.from(products);
}

/**
 * Fetch vulnerabilities from NVD API with pagination
 */
export async function fetchNVDVulnerabilities(startIndex = 0, resultsPerPage = 100) {
  try {
    logger.info(`Fetching NVD vulnerabilities: start=${startIndex}, limit=${resultsPerPage}`);

    const response = await axios.get(NVD_API_BASE, {
      params: { startIndex, resultsPerPage },
      timeout: 30000,
      headers: { 'User-Agent': 'SecurityEventPlatform/1.0' },
    });

    const vulnerabilities = response.data.vulnerabilities || [];
    const events = vulnerabilities.map(normalizeNVDEvent);

    logger.info(`Successfully fetched ${events.length} events from NVD`);
    return {
      events,
      totalResults: response.data.totalResults || 0,
      resultIndex: response.data.resultsIndex || startIndex,
    };
  } catch (error) {
    logger.error(`Failed to fetch NVD vulnerabilities: ${error.message}`);
    throw error;
  }
}

/**
 * Fetch all exploited vulnerabilities from CISA catalog
 */
export async function fetchCISAExploitedVulnerabilities() {
  try {
    logger.info('Fetching CISA known exploited vulnerabilities');

    const response = await axios.get(CISA_API_BASE, {
      timeout: 30000,
      headers: { 'User-Agent': 'SecurityEventPlatform/1.0' },
    });

    const vulnerabilities = response.data.vulnerabilities || [];
    const events = vulnerabilities.map(normalizeCISAEvent);

    logger.info(`Successfully fetched ${events.length} events from CISA`);
    return events;
  } catch (error) {
    logger.error(`Failed to fetch CISA vulnerabilities: ${error.message}`);
    throw error;
  }
}

/**
 * Fetch security news from RSS feeds. Each feed preserves its own source identity.
 */
export async function fetchSecurityRSSFeeds() {
  try {
    logger.info('Fetching security RSS feeds');
    const Parser = (await import('rss-parser')).default;
    const parser = new Parser({
      customFields: {
        item: [
          ['media:content', 'mediaContent'],
          ['media:thumbnail', 'mediaThumbnail'],
          ['enclosure', 'enclosure'],
        ],
      },
    });

    const events = [];

    for (const feedConfig of NEWS_FEEDS) {
      try {
        const feed = await parser.parseURL(feedConfig.url);
        logger.info(`RSS feed ${feedConfig.source}: ${feed.items?.length || 0} items`);

        const feedEvents = (feed.items || []).map((item) => {
          const title = item.title || 'Untitled';
          const link = item.link || item.guid || '';
          const contentHash = computeContentHash(title, link);

          return {
            external_id: `RSS-${contentHash}`,
            title,
            description: item.contentSnippet || item.content || item.summary || '',
            source: feedConfig.source,
            source_url: link,
            event_type: 'news',
            severity: detectRSSSeverity(title + ' ' + (item.contentSnippet || '')),
            affected_products: [],
            published_date: new Date(item.pubDate || item.isoDate || Date.now()),
            thumbnail_url: extractThumbnail(item),
            content_hash: contentHash,
            ai_relevance_score: 0,
            data: {
              feed_source: feed.title || feedConfig.source,
              feed_category: feedConfig.category,
              creator: item.creator,
              categories: item.categories || [],
            },
          };
        });
        events.push(...feedEvents);
      } catch (feedError) {
        logger.error(`Failed to parse RSS feed ${feedConfig.source}: ${feedError.message}`);
      }
    }

    logger.info(`RSS feed collection completed: ${events.length} events from ${NEWS_FEEDS.length} feeds`);
    return events;
  } catch (error) {
    logger.error(`Failed to fetch RSS feeds: ${error.message}`);
    throw error;
  }
}

/**
 * Auto-detect severity from RSS item text
 */
function detectRSSSeverity(text) {
  const lower = text.toLowerCase();
  if (/critical|zero.day|remote.code.execution|actively.exploited/.test(lower)) return 'critical';
  if (/high.severity|ransomware|severe|emergency/.test(lower)) return 'high';
  if (/medium|moderate|patch.tuesday/.test(lower)) return 'medium';
  if (/low|minor|informational/.test(lower)) return 'low';
  return 'info';
}

/**
 * Get the news feed configurations.
 */
export function getNewsFeedConfigs() {
  return NEWS_FEEDS;
}

/**
 * Main function to collect events from all sources
 */
export async function collectAllEvents() {
  const results = {
    nvd: [],
    cisa: [],
    rss: [],
    stats: {
      totalEvents: 0,
      errors: [],
    },
  };

  try {
    try {
      logger.info('Starting NVD data collection');
      const nvdResult = await fetchNVDVulnerabilities(0, 100);
      results.nvd = nvdResult.events;
      results.stats.totalEvents += nvdResult.events.length;
      logger.info(`NVD collection completed: ${nvdResult.events.length} events`);
    } catch (error) {
      results.stats.errors.push(`NVD fetch failed: ${error.message}`);
      logger.error(`NVD collection failed: ${error.message}`);
    }

    await sleep(RATE_LIMIT_DELAY);

    try {
      logger.info('Starting CISA data collection');
      results.cisa = await fetchCISAExploitedVulnerabilities();
      results.stats.totalEvents += results.cisa.length;
      logger.info(`CISA collection completed: ${results.cisa.length} events`);
    } catch (error) {
      results.stats.errors.push(`CISA fetch failed: ${error.message}`);
      logger.error(`CISA collection failed: ${error.message}`);
    }

    await sleep(RATE_LIMIT_DELAY);

    try {
      logger.info('Starting RSS feed collection');
      results.rss = await fetchSecurityRSSFeeds();

      // Run AI tagging on RSS news items and filter non-AI content
      try {
        const { batchTagEvents: tagEvents } = await import('./aiTaggingService.js');
        results.rss = tagEvents(results.rss);
        const totalBeforeFilter = results.rss.length;
        // Keep only AI-relevant articles (score > 0)
        results.rss = results.rss.filter((e) => e.ai_relevance_score > 0);
        const filtered = totalBeforeFilter - results.rss.length;
        logger.info(`AI tagging: ${results.rss.length} AI-relevant articles kept, ${filtered} non-AI articles filtered out`);
      } catch (tagError) {
        logger.warn(`AI tagging skipped: ${tagError.message}`);
      }

      results.stats.totalEvents += results.rss.length;
      logger.info(`RSS collection completed: ${results.rss.length} events`);
    } catch (error) {
      results.stats.errors.push(`RSS fetch failed: ${error.message}`);
      logger.error(`RSS collection failed: ${error.message}`);
    }

    logger.info(`Total events collected: ${results.stats.totalEvents}`);
    return results;
  } catch (error) {
    logger.error(`Critical error during data collection: ${error.message}`);
    throw error;
  }
}

export default {
  fetchNVDVulnerabilities,
  fetchCISAExploitedVulnerabilities,
  fetchSecurityRSSFeeds,
  collectAllEvents,
  getNewsFeedConfigs,
};
