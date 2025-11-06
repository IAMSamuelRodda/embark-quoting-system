/**
 * Auto-Merge - Unit Tests
 *
 * Test Last-Writer-Wins merge strategy
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { autoMergeQuotes, autoMergeBatch, getBatchMergeStats } from './autoMerge';
import { QuoteStatus, type Quote } from '../../shared/types/models';

// Mock getDeviceId
vi.mock('../../shared/db/indexedDb', () => ({
  getDeviceId: () => 'device-test',
}));

// Helper to create test quote
function createTestQuote(overrides: Partial<Quote> = {}): Quote {
  return {
    id: 'quote-123',
    quote_number: 'EE-2025-0001',
    version: 1,
    versionVector: { 'device-A': 1 },
    status: QuoteStatus.DRAFT,
    user_id: 'user-1',
    customer_name: 'John Smith',
    customer_email: 'john@example.com',
    created_at: new Date('2025-01-01T10:00:00Z'),
    updated_at: new Date('2025-01-01T10:00:00Z'),
    ...overrides,
  };
}

describe('autoMerge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // NO CONFLICT (FAST-FORWARD)
  // ============================================================================

  describe('autoMergeQuotes - No Conflict', () => {
    it('should use local version when local is strictly newer', () => {
      const local = createTestQuote({
        versionVector: { 'device-A': 5, 'device-B': 2 },
        customer_name: 'Alice Local',
        updated_at: new Date('2025-01-01T11:00:00Z'),
      });

      const remote = createTestQuote({
        versionVector: { 'device-A': 4, 'device-B': 2 },
        customer_name: 'Alice Remote',
        updated_at: new Date('2025-01-01T10:00:00Z'),
      });

      const result = autoMergeQuotes(local, remote);

      expect(result.success).toBe(true);
      expect(result.mergedQuote).toEqual(local);
      expect(result.autoMergedFields).toHaveLength(0);
    });

    it('should use remote version when remote is strictly newer', () => {
      const local = createTestQuote({
        versionVector: { 'device-A': 3, 'device-B': 4 },
        customer_name: 'Bob Local',
        updated_at: new Date('2025-01-01T10:00:00Z'),
      });

      const remote = createTestQuote({
        versionVector: { 'device-A': 3, 'device-B': 5 },
        customer_name: 'Bob Remote',
        updated_at: new Date('2025-01-01T11:00:00Z'),
      });

      const result = autoMergeQuotes(local, remote);

      expect(result.success).toBe(true);
      expect(result.mergedQuote).toEqual(remote);
      expect(result.autoMergedFields).toHaveLength(0);
    });
  });

  // ============================================================================
  // AUTO-MERGE (NON-CRITICAL CONFLICTS)
  // ============================================================================

  describe('autoMergeQuotes - Auto-Merge', () => {
    it('should auto-merge metadata using Last-Writer-Wins (local newer)', () => {
      const local = createTestQuote({
        versionVector: { 'device-A': 6, 'device-B': 2 },
        metadata: { priority: 'high', notes: 'Important' },
        updated_at: new Date('2025-01-01T11:00:00Z'), // Local newer
      });

      const remote = createTestQuote({
        versionVector: { 'device-A': 5, 'device-B': 4 },
        metadata: { priority: 'low', notes: 'Standard' },
        updated_at: new Date('2025-01-01T10:00:00Z'), // Remote older
      });

      const result = autoMergeQuotes(local, remote);

      expect(result.success).toBe(true);
      expect(result.autoMergedFields).toHaveLength(1);
      expect(result.autoMergedFields[0].path).toEqual(['metadata']);
      expect(result.autoMergedFields[0].chosen).toBe('local');

      // Verify merged quote
      expect(result.mergedQuote?.metadata).toEqual(local.metadata);
      expect(result.mergedQuote?.versionVector).toEqual({
        'device-A': 6,
        'device-B': 4,
        'device-test': 1, // Local device incremented
      });
    });

    it('should auto-merge location using Last-Writer-Wins (remote newer)', () => {
      const local = createTestQuote({
        versionVector: { 'device-A': 6, 'device-B': 2 },
        location: { suburb: 'Melbourne', postcode: '3000' },
        updated_at: new Date('2025-01-01T10:00:00Z'), // Local older
      });

      const remote = createTestQuote({
        versionVector: { 'device-A': 5, 'device-B': 4 },
        location: { suburb: 'Sydney', postcode: '2000' },
        updated_at: new Date('2025-01-01T11:00:00Z'), // Remote newer
      });

      const result = autoMergeQuotes(local, remote);

      expect(result.success).toBe(true);
      expect(result.autoMergedFields).toHaveLength(1);
      expect(result.autoMergedFields[0].chosen).toBe('remote');
      expect(result.mergedQuote?.location).toEqual(remote.location);
    });

    it('should merge version vectors correctly', () => {
      const local = createTestQuote({
        versionVector: { 'device-A': 6, 'device-B': 2, 'device-C': 5 },
        metadata: { priority: 'high' },
        updated_at: new Date('2025-01-01T11:00:00Z'),
      });

      const remote = createTestQuote({
        versionVector: { 'device-A': 5, 'device-B': 4, 'device-D': 3 },
        metadata: { priority: 'low' },
        updated_at: new Date('2025-01-01T10:00:00Z'),
      });

      const result = autoMergeQuotes(local, remote);

      expect(result.success).toBe(true);

      // Version vector should have max of each device + incremented local device
      expect(result.mergedQuote?.versionVector).toEqual({
        'device-A': 6, // max(6, 5)
        'device-B': 4, // max(2, 4)
        'device-C': 5, // max(5, 0)
        'device-D': 3, // max(0, 3)
        'device-test': 1, // Incremented local device
      });
    });

    it('should increment version number', () => {
      const local = createTestQuote({
        version: 5,
        versionVector: { 'device-A': 6, 'device-B': 2 },
        metadata: { priority: 'high' },
      });

      const remote = createTestQuote({
        version: 7,
        versionVector: { 'device-A': 5, 'device-B': 4 },
        metadata: { priority: 'low' },
      });

      const result = autoMergeQuotes(local, remote);

      expect(result.success).toBe(true);
      expect(result.mergedQuote?.version).toBe(8); // max(5, 7) + 1
    });

    it('should update timestamp', () => {
      const local = createTestQuote({
        versionVector: { 'device-A': 6, 'device-B': 2 },
        metadata: { priority: 'high' },
        updated_at: new Date('2025-01-01T10:00:00Z'),
      });

      const remote = createTestQuote({
        versionVector: { 'device-A': 5, 'device-B': 4 },
        metadata: { priority: 'low' },
        updated_at: new Date('2025-01-01T09:00:00Z'),
      });

      const beforeMerge = Date.now();
      const result = autoMergeQuotes(local, remote);
      const afterMerge = Date.now();

      expect(result.success).toBe(true);
      const mergedTime = result.mergedQuote?.updated_at.getTime() || 0;
      expect(mergedTime).toBeGreaterThanOrEqual(beforeMerge);
      expect(mergedTime).toBeLessThanOrEqual(afterMerge);
    });
  });

  // ============================================================================
  // CRITICAL CONFLICTS (CANNOT AUTO-MERGE)
  // ============================================================================

  describe('autoMergeQuotes - Critical Conflicts', () => {
    it('should fail when critical conflicts exist', () => {
      const local = createTestQuote({
        versionVector: { 'device-A': 10, 'device-B': 5 },
        customer_email: 'bob@oldcompany.com',
        updated_at: new Date('2025-01-01T11:00:00Z'),
      });

      const remote = createTestQuote({
        versionVector: { 'device-A': 9, 'device-B': 7 },
        customer_email: 'bob@newcompany.com',
        updated_at: new Date('2025-01-01T10:45:00Z'),
      });

      const result = autoMergeQuotes(local, remote);

      expect(result.success).toBe(false);
      expect(result.mergedQuote).toBeUndefined();
      expect(result.error).toContain('critical conflicts');
      expect(result.error).toContain('manual resolution');
    });

    it('should fail with mixed critical and non-critical conflicts', () => {
      const local = createTestQuote({
        versionVector: { 'device-A': 10, 'device-B': 5 },
        customer_email: 'bob@oldcompany.com', // Critical
        metadata: { priority: 'high' }, // Non-critical
        updated_at: new Date('2025-01-01T11:00:00Z'),
      });

      const remote = createTestQuote({
        versionVector: { 'device-A': 9, 'device-B': 7 },
        customer_email: 'bob@newcompany.com', // Critical conflict
        metadata: { priority: 'low' }, // Non-critical conflict
        updated_at: new Date('2025-01-01T10:45:00Z'),
      });

      const result = autoMergeQuotes(local, remote);

      expect(result.success).toBe(false);
      expect(result.error).toContain('1 critical conflicts'); // Just the email
    });
  });

  // ============================================================================
  // BATCH AUTO-MERGE
  // ============================================================================

  describe('autoMergeBatch', () => {
    it('should merge multiple quote pairs', () => {
      const pairs: Array<[Quote, Quote]> = [
        [
          createTestQuote({
            id: 'quote-1',
            versionVector: { 'device-A': 5, 'device-B': 2 },
            metadata: { priority: 'high' },
          }),
          createTestQuote({
            id: 'quote-1',
            versionVector: { 'device-A': 4, 'device-B': 3 },
            metadata: { priority: 'low' },
          }),
        ],
        [
          createTestQuote({
            id: 'quote-2',
            versionVector: { 'device-A': 3, 'device-B': 2 },
            metadata: { priority: 'medium' },
          }),
          createTestQuote({
            id: 'quote-2',
            versionVector: { 'device-A': 2, 'device-B': 3 },
            metadata: { priority: 'low' },
          }),
        ],
      ];

      const results = autoMergeBatch(pairs);

      expect(results).toHaveLength(2);
      expect(results[0].quoteId).toBe('quote-1');
      expect(results[0].success).toBe(true);
      expect(results[1].quoteId).toBe('quote-2');
      expect(results[1].success).toBe(true);
    });

    it('should handle mixed success and failure in batch', () => {
      const pairs: Array<[Quote, Quote]> = [
        // Pair 1: Auto-merge success (non-critical conflict)
        [
          createTestQuote({
            id: 'quote-1',
            versionVector: { 'device-A': 5, 'device-B': 2 },
            metadata: { priority: 'high' },
          }),
          createTestQuote({
            id: 'quote-1',
            versionVector: { 'device-A': 4, 'device-B': 3 },
            metadata: { priority: 'low' },
          }),
        ],
        // Pair 2: Auto-merge failure (critical conflict)
        [
          createTestQuote({
            id: 'quote-2',
            versionVector: { 'device-A': 5, 'device-B': 2 },
            customer_email: 'old@example.com',
          }),
          createTestQuote({
            id: 'quote-2',
            versionVector: { 'device-A': 4, 'device-B': 3 },
            customer_email: 'new@example.com',
          }),
        ],
      ];

      const results = autoMergeBatch(pairs);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
    });
  });

  describe('getBatchMergeStats', () => {
    it('should calculate batch statistics', () => {
      const results = [
        {
          quoteId: 'quote-1',
          success: true,
          autoMergedFields: [
            {
              path: ['metadata'],
              mergedValue: {},
              strategy: 'last-writer-wins' as const,
              chosen: 'local' as const,
            },
          ],
        },
        {
          quoteId: 'quote-2',
          success: true,
          autoMergedFields: [
            {
              path: ['location'],
              mergedValue: {},
              strategy: 'last-writer-wins' as const,
              chosen: 'remote' as const,
            },
            {
              path: ['metadata'],
              mergedValue: {},
              strategy: 'last-writer-wins' as const,
              chosen: 'local' as const,
            },
          ],
        },
        {
          quoteId: 'quote-3',
          success: false,
          autoMergedFields: [],
          error: 'Critical conflicts',
        },
      ];

      const stats = getBatchMergeStats(results);

      expect(stats.totalQuotes).toBe(3);
      expect(stats.successfulMerges).toBe(2);
      expect(stats.failedMerges).toBe(1);
      expect(stats.totalAutoMergedFields).toBe(3); // 1 + 2 + 0
    });
  });
});
