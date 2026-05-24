/**
 * Unit tests for analysis service
 */

import { jest } from '@jest/globals';

const mockQuery = jest.fn();

jest.unstable_mockModule('../src/utils/database.js', () => ({
  default: { query: mockQuery },
}));

jest.unstable_mockModule('../src/utils/cache.js', () => ({
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(undefined),
  cacheKey: (...args) => args.join(':'),
}));

jest.unstable_mockModule('../src/utils/logger.js', () => ({
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

const { default: analysisService } = await import('../src/services/analysisService.js');

describe('Analysis Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('clusterEvents', () => {
    test('should cluster events by CVEs', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          { id: 1, title: 'CVE-2024-0001 RCE', description: 'Remote code execution', source: 'NVD', severity: 'critical' },
          { id: 2, title: 'CVE-2024-0001 patch', description: 'Patch for vulnerability', source: 'NVD', severity: 'high' },
          { id: 3, title: 'Unrelated event', description: 'Something else', source: 'RSS', severity: 'low' },
        ],
      });

      const clusters = await analysisService.clusterEvents();
      expect(clusters.length).toBeGreaterThan(0);
      const cveCluster = clusters.find((c) => c.common_cves.includes('CVE-2024-0001'));
      expect(cveCluster).toBeDefined();
      expect(cveCluster.cluster_size).toBeGreaterThanOrEqual(2);
    });

    test('should return empty array for no events', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const clusters = await analysisService.clusterEvents();
      expect(clusters).toEqual([]);
    });
  });

  describe('analyzeSeverityDistribution', () => {
    test('should return severity counts', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          { severity: 'critical', count: '5' },
          { severity: 'high', count: '10' },
        ],
      });
      const distribution = await analysisService.analyzeSeverityDistribution();
      expect(distribution.critical).toBe(5);
      expect(distribution.high).toBe(10);
    });
  });

  describe('analyzeTrends', () => {
    test('should use parameterized days', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await analysisService.analyzeTrends(7);
      const [sql, params] = mockQuery.mock.calls[0];
      expect(sql).toContain("INTERVAL '1 day' * $1");
      expect(params[0]).toBe(7);
    });

    test('should return trend data', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          { date: new Date('2024-01-01'), severity: 'critical', count: '2' },
          { date: new Date('2024-01-01'), severity: 'high', count: '5' },
        ],
      });
      const trends = await analysisService.analyzeTrends(30);
      expect(typeof trends).toBe('object');
      expect(Object.keys(trends).length).toBeGreaterThan(0);
    });
  });

  describe('tagEvent', () => {
    test('should insert a tag', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1, event_id: '123', tag_name: 'zeroday', severity: 'critical' }],
      });
      const tag = await analysisService.tagEvent('123', 'zeroday', 'critical');
      expect(tag.tag_name).toBe('zeroday');
    });
  });

  describe('getEventTags', () => {
    test('should fetch tags', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 1, event_id: '123', tag_name: 'zeroday' }],
      });
      const tags = await analysisService.getEventTags('123');
      expect(tags).toHaveLength(1);
    });
  });
});
