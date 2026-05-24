/**
 * Unit tests for event service
 */

import { jest } from '@jest/globals';

const mockQuery = jest.fn();

jest.unstable_mockModule('../src/utils/database.js', () => ({
  default: { query: mockQuery },
}));

jest.unstable_mockModule('../src/utils/cache.js', () => ({
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue(undefined),
  delPattern: jest.fn().mockResolvedValue(undefined),
  cacheKey: (...args) => args.join(':'),
}));

jest.unstable_mockModule('../src/utils/logger.js', () => ({
  default: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
}));

const { default: eventService } = await import('../src/services/eventService.js');

describe('Event Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getEvents', () => {
    test('should query with default parameters', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      const events = await eventService.getEvents({});
      expect(events).toEqual([]);
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    test('should apply severity filter', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await eventService.getEvents({ severity: 'critical' });
      const [, params] = mockQuery.mock.calls[0];
      expect(params).toContain('critical');
    });

    test('should return paginated results', async () => {
      const mockEvents = [{ id: 1, title: 'Event 1' }, { id: 2, title: 'Event 2' }];
      mockQuery.mockResolvedValueOnce({ rows: mockEvents });
      const events = await eventService.getEvents({ limit: 2, offset: 0 });
      expect(events).toHaveLength(2);
    });
  });

  describe('searchEvents', () => {
    test('should search with ILIKE pattern', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });
      await eventService.searchEvents('ransomware', 50);
      const [, params] = mockQuery.mock.calls[0];
      expect(params[0]).toBe('%ransomware%');
      expect(params[1]).toBe(50);
    });
  });

  describe('getEventStats', () => {
    test('should aggregate statistics', async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [{ total_events: '100', critical_count: '10', high_count: '20',
          medium_count: '30', low_count: '40', total_sources: '3',
          latest_event: '2024-06-01T00:00:00Z', last_collection: '2024-06-01T12:00:00Z' }],
      });
      const stats = await eventService.getEventStats();
      expect(stats.total_events).toBe('100');
      expect(stats.critical_count).toBe('10');
    });
  });

  describe('saveEvents', () => {
    test('should skip empty event arrays', async () => {
      const result = await eventService.saveEvents([], 'NVD');
      expect(result.saved).toBe(0);
      expect(result.skipped).toBe(0);
    });

    test('should insert events', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] });
      const events = [{
        external_id: 'CVE-2024-0001', title: 'Test', description: 'Desc',
        source: 'NVD', source_url: 'http://ex.com', event_type: 'vuln',
        severity: 'high', affected_products: [], published_date: new Date(), data: {},
      }];
      const result = await eventService.saveEvents(events, 'NVD');
      expect(result.saved).toBe(1);
    });
  });
});
