/**
 * Unit tests for event collector - severity conversion and normalization
 */

import { jest } from '@jest/globals';

const mockAxiosGet = jest.fn();

jest.unstable_mockModule('axios', () => ({
  default: { get: mockAxiosGet },
}));

jest.unstable_mockModule('../src/utils/logger.js', () => ({
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

// Mock rss-parser to prevent network calls
jest.unstable_mockModule('rss-parser', () => ({
  default: jest.fn().mockImplementation(() => ({
    parseURL: jest.fn().mockResolvedValue({ items: [] }),
  })),
}));

const collectorModule = await import('../src/services/eventCollector.js');
const {
  fetchNVDVulnerabilities,
  fetchCISAExploitedVulnerabilities,
  fetchSecurityRSSFeeds,
  collectAllEvents,
} = collectorModule;

describe('Event Collector', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('NVD API Integration', () => {
    test('should fetch and normalize NVD vulnerabilities', async () => {
      mockAxiosGet.mockResolvedValueOnce({
        data: {
          totalResults: 2,
          vulnerabilities: [
            {
              cve: {
                id: 'CVE-2024-1234',
                descriptions: [{ value: 'Test vulnerability' }],
                published: '2024-01-15T00:00:00Z',
                metrics: {
                  cvssV3: [{ cvssData: { baseScore: 9.8, vectorString: 'AV:N/AC:L' } }],
                },
                configurations: [],
                weaknesses: [],
              },
            },
            {
              cve: {
                id: 'CVE-2024-5678',
                descriptions: [{ value: 'Another test' }],
                published: '2024-01-16T00:00:00Z',
                metrics: {
                  cvssV3: [{ cvssData: { baseScore: 5.5, vectorString: 'AV:L/AC:L' } }],
                },
                configurations: [],
                weaknesses: [],
              },
            },
          ],
        },
      });

      const result = await fetchNVDVulnerabilities(0, 100);
      expect(result.events).toHaveLength(2);
      expect(result.events[0].external_id).toBe('CVE-2024-1234');
      expect(result.events[0].severity).toBe('critical');
      expect(result.events[0].source).toBe('NVD');
      expect(result.events[1].severity).toBe('medium');
    });
  });

  describe('Severity Level Conversion', () => {
    test.each([
      [9.0, 'critical'],
      [7.0, 'high'],
      [4.0, 'medium'],
      [0.1, 'low'],
      [0, 'unknown'],
    ])('CVSS score %f → %s', async (score, expected) => {
      mockAxiosGet.mockResolvedValueOnce({
        data: {
          totalResults: 1,
          vulnerabilities: [
            {
              cve: {
                id: 'CVE-2024-TEST',
                descriptions: [{ value: 'Severity test' }],
                published: '2024-01-01T00:00:00Z',
                metrics: { cvssV3: [{ cvssData: { baseScore: score } }] },
                configurations: [],
                weaknesses: [],
              },
            },
          ],
        },
      });

      const result = await fetchNVDVulnerabilities(0, 1);
      expect(result.events[0].severity).toBe(expected);
    });
  });

  describe('CISA API Integration', () => {
    test('should fetch and normalize CISA vulnerabilities', async () => {
      mockAxiosGet.mockResolvedValueOnce({
        data: {
          vulnerabilities: [
            {
              cveID: 'CVE-2024-9999',
              vulnerabilityName: 'Test CISA vuln',
              dateAdded: '2024-03-01',
              affectedProduct: 'Windows',
              requiredAction: 'Apply patch',
              notes: 'Critical',
            },
          ],
        },
      });

      const events = await fetchCISAExploitedVulnerabilities();
      expect(events).toHaveLength(1);
      expect(events[0].source).toBe('CISA');
      expect(events[0].severity).toBe('high');
      expect(events[0].external_id).toBe('CISA-CVE-2024-9999');
    });
  });

  describe('RSS Feed Collection', () => {
    test('should return events from mocked RSS feeds', async () => {
      const events = await fetchSecurityRSSFeeds();
      expect(Array.isArray(events)).toBe(true);
    });
  });

  describe('collectAllEvents', () => {
    test('should collect from all sources', async () => {
      mockAxiosGet.mockResolvedValueOnce({
        data: {
          totalResults: 1,
          vulnerabilities: [
            {
              cve: {
                id: 'CVE-2024-0001', descriptions: [{ value: 'NVD test' }],
                published: '2024-01-01T00:00:00Z',
                metrics: { cvssV3: [{ cvssData: { baseScore: 7.5 } }] },
                configurations: [], weaknesses: [],
              },
            },
          ],
        },
      });
      mockAxiosGet.mockResolvedValueOnce({
        data: {
          vulnerabilities: [
            { cveID: 'CVE-2024-0002', vulnerabilityName: 'CISA test', dateAdded: '2024-01-01' },
          ],
        },
      });

      const result = await collectAllEvents();
      expect(result.stats.totalEvents).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(result.nvd)).toBe(true);
      expect(Array.isArray(result.cisa)).toBe(true);
      expect(Array.isArray(result.rss)).toBe(true);
    });
  });
});
