import axios from 'axios';
import logger from './logger.js';

// NVD API configuration
const NVD_API_BASE = 'https://services.nvd.nist.gov/rest/json/cves/2.0';
const CISA_API_BASE = 'https://raw.githubusercontent.com/cisagov/cisa-known-exploited-vulnerabilities-catalog/main/known_exploited_vulnerabilities.json';

/**
 * Fetches vulnerabilities from NVD API
 * @param {number} startIndex - Starting index for pagination
 * @param {number} resultsPerPage - Number of results per page
 * @returns {Promise<Object>} NVD response data
 */
export async function fetchNVDVulnerabilities(startIndex = 0, resultsPerPage = 100) {
  try {
    const response = await axios.get(NVD_API_BASE, {
      params: {
        startIndex,
        resultsPerPage,
      },
      timeout: 10000,
    });
    logger.info(`Fetched ${response.data.vulnerabilities?.length || 0} vulnerabilities from NVD`);
    return response.data;
  } catch (error) {
    logger.error(`Failed to fetch NVD vulnerabilities: ${error.message}`);
    throw error;
  }
}

/**
 * Fetches known exploited vulnerabilities from CISA catalog
 * @returns {Promise<Array>} Array of CISA exploited vulnerabilities
 */
export async function fetchCISAExploitedVulnerabilities() {
  try {
    const response = await axios.get(CISA_API_BASE, {
      timeout: 10000,
    });
    logger.info(`Fetched ${response.data.vulnerabilities?.length || 0} exploited vulnerabilities from CISA`);
    return response.data.vulnerabilities || [];
  } catch (error) {
    logger.error(`Failed to fetch CISA vulnerabilities: ${error.message}`);
    throw error;
  }
}

/**
 * Fetches security events from RSS feeds (placeholder)
 * @returns {Promise<Array>} Array of security events from feeds
 */
export async function fetchSecurityRSSFeeds() {
  try {
    // Placeholder for RSS/feed aggregation
    logger.info('RSS feed fetching not yet implemented');
    return [];
  } catch (error) {
    logger.error(`Failed to fetch RSS feeds: ${error.message}`);
    throw error;
  }
}

export default {
  fetchNVDVulnerabilities,
  fetchCISAExploitedVulnerabilities,
  fetchSecurityRSSFeeds,
};
