import axios from 'axios';
import logger from '../utils/logger.js';

const NVD_API_BASE = 'https://services.nvd.nist.gov/rest/json/cves/2.0';
const CISA_API_BASE = 'https://raw.githubusercontent.com/cisagov/cisa-known-exploited-vulnerabilities-catalog/main/known_exploited_vulnerabilities.json';

// Rate limiting to avoid API throttling
const RATE_LIMIT_DELAY = 1000; // 1 second between requests

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Normalize NVD vulnerability to standard event format
 */
function normalizeNVDEvent(vuln) {
  const cveData = vuln.cve;
  const cvssScores = cveData.metrics?.cvssV3 || cveData.metrics?.cvssV2 || [];
  const maxScore = cvssScores.reduce((max, metric) => {
    return Math.max(max, metric.cvssData?.baseScore || 0);
  }, 0);

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
      cvss_vector: cvssScores[0]?.cvssData?.vectorString || null,
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
      params: {
        startIndex,
        resultsPerPage,
      },
      timeout: 30000,
      headers: {
        'User-Agent': 'SecurityEventPlatform/1.0',
      },
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
      headers: {
        'User-Agent': 'SecurityEventPlatform/1.0',
      },
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
 * Fetch security news from RSS feeds using rss-parser
 */
export async function fetchSecurityRSSFeeds() {
  try {
    logger.info('Fetching security RSS feeds');
    const Parser = (await import('rss-parser')).default;
    const parser = new Parser();

    const feeds = [
      'https://feeds.feedburner.com/TheHackersNews',
      'https://www.bleepingcomputer.com/feed/',
      'https://therecord.media/feed/',
    ];

    const events = [];

    for (const feedUrl of feeds) {
      try {
        const feed = await parser.parseURL(feedUrl);
        logger.info(`RSS feed ${feedUrl}: ${feed.items?.length || 0} items`);

        const feedEvents = (feed.items || []).map((item) => ({
          external_id: `RSS-${Buffer.from(item.link || item.guid || item.title).toString('base64').substring(0, 64)}`,
          title: item.title || 'Untitled',
          description: item.contentSnippet || item.content || item.summary || '',
          source: 'RSS',
          source_url: item.link || feedUrl,
          event_type: 'news',
          severity: detectRSSSeverity(item.title + ' ' + (item.contentSnippet || '')),
          affected_products: [],
          published_date: new Date(item.pubDate || item.isoDate || Date.now()),
          data: {
            feed_source: feed.title || feedUrl,
            creator: item.creator,
            categories: item.categories || [],
          },
        }));
        events.push(...feedEvents);
      } catch (feedError) {
        logger.error(`Failed to parse RSS feed ${feedUrl}: ${feedError.message}`);
      }
    }

    logger.info(`RSS feed collection completed: ${events.length} events from ${feeds.length} feeds`);
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
    // Fetch NVD (with rate limiting)
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

    // Fetch CISA (with rate limiting)
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

    // Fetch RSS feeds
    try {
      logger.info('Starting RSS feed collection');
      results.rss = await fetchSecurityRSSFeeds();
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
};
