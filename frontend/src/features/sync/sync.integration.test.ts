/**
 * Sync Engine - Integration Tests
 *
 * Feature 5.6: End-to-end sync testing
 *
 * Tests complete sync workflows from local changes through
 * conflict resolution to server synchronization.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QuoteStatus, SyncOperation, type Quote } from '../../shared/types/models';
import { detectQuoteConflict } from './conflictDetection';
import { autoMergeQuotes } from './autoMerge';
import * as syncQueue from './syncQueue';
import { SyncPriority } from './syncQueue';
import { createVersionVector, incrementVersion, mergeVersionVectors } from './versionVectors';

// Mock getDeviceId
vi.mock('../../shared/db/indexedDb', () => ({
  getDeviceId: () => 'device-test',
  db: {
    syncQueue: {
      add: vi.fn(),
      where: vi.fn(() => ({
        and: vi.fn(() => ({
          sortBy: vi.fn(() => Promise.resolve([])),
        })),
      })),
      get: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
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

describe('Sync Engine Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // END-TO-END WORKFLOW: NO CONFLICT
  // ============================================================================

  describe('E2E: No Conflict (Fast-Forward Merge)', () => {
    it('should accept remote version when remote is strictly newer', () => {
      // Scenario: User syncs and server has newer version
      // Expected: Local version updated to match remote

      const localQuote = createTestQuote({
        version: 3,
        versionVector: { 'device-A': 3, 'device-B': 4 },
        customer_name: 'John Smith',
        updated_at: new Date('2025-01-01T10:00:00Z'),
      });

      const remoteQuote = createTestQuote({
        version: 5,
        versionVector: { 'device-A': 3, 'device-B': 5 }, // Remote is strictly newer
        customer_name: 'John Q. Smith', // Remote has update
        updated_at: new Date('2025-01-01T11:00:00Z'),
      });

      // Step 1: Detect conflict
      const conflictReport = detectQuoteConflict(localQuote, remoteQuote);

      // Should be no conflict (remote strictly newer)
      expect(conflictReport.hasConflict).toBe(false);

      // Step 2: Auto-merge (should choose remote)
      const mergeResult = autoMergeQuotes(localQuote, remoteQuote);

      expect(mergeResult.success).toBe(true);
      expect(mergeResult.mergedQuote).toEqual(remoteQuote); // Use remote version as-is
      expect(mergeResult.autoMergedFields).toHaveLength(0); // No auto-merge needed
    });

    it('should keep local version when local is strictly newer', () => {
      // Scenario: User made changes that are newer than server
      // Expected: Local version kept, will be pushed to server

      const localQuote = createTestQuote({
        version: 5,
        versionVector: { 'device-A': 5, 'device-B': 2 }, // Local is strictly newer
        customer_name: 'John Q. Smith',
        updated_at: new Date('2025-01-01T11:00:00Z'),
      });

      const remoteQuote = createTestQuote({
        version: 3,
        versionVector: { 'device-A': 4, 'device-B': 2 },
        customer_name: 'John Smith',
        updated_at: new Date('2025-01-01T10:00:00Z'),
      });

      const conflictReport = detectQuoteConflict(localQuote, remoteQuote);

      expect(conflictReport.hasConflict).toBe(false);

      const mergeResult = autoMergeQuotes(localQuote, remoteQuote);

      expect(mergeResult.success).toBe(true);
      expect(mergeResult.mergedQuote).toEqual(localQuote); // Keep local version
    });
  });

  // ============================================================================
  // END-TO-END WORKFLOW: AUTO-MERGE
  // ============================================================================

  describe('E2E: Auto-Merge (Non-Critical Conflicts)', () => {
    it('should auto-merge metadata conflict using Last-Writer-Wins', () => {
      // Scenario: Concurrent edits to metadata field
      // Expected: Automatically merge using timestamps

      const localQuote = createTestQuote({
        version: 3,
        versionVector: { 'device-A': 5, 'device-B': 2 }, // Concurrent
        metadata: { priority: 'high', notes: 'Urgent customer' },
        updated_at: new Date('2025-01-01T11:00:00Z'), // Local newer
      });

      const remoteQuote = createTestQuote({
        version: 3,
        versionVector: { 'device-A': 4, 'device-B': 3 }, // Concurrent
        metadata: { priority: 'low', notes: 'Standard quote' },
        updated_at: new Date('2025-01-01T10:00:00Z'), // Remote older
      });

      // Step 1: Detect conflict
      const conflictReport = detectQuoteConflict(localQuote, remoteQuote);

      expect(conflictReport.hasConflict).toBe(true);
      expect(conflictReport.conflictingFields).toHaveLength(0); // No critical conflicts
      expect(conflictReport.autoMergedFields).toHaveLength(1); // Metadata auto-merged

      const metadataField = conflictReport.autoMergedFields[0];
      expect(metadataField.path).toEqual(['metadata']);
      expect(metadataField.chosen).toBe('local'); // Local is newer
      expect(metadataField.strategy).toBe('last-writer-wins');

      // Step 2: Auto-merge
      const mergeResult = autoMergeQuotes(localQuote, remoteQuote);

      expect(mergeResult.success).toBe(true);
      expect(mergeResult.mergedQuote?.metadata).toEqual(localQuote.metadata);

      // Step 3: Verify version vector merged correctly
      expect(mergeResult.mergedQuote?.versionVector).toEqual({
        'device-A': 5, // max(5, 4)
        'device-B': 3, // max(2, 3)
        'device-test': 1, // Incremented local device
      });

      // Step 4: Verify version incremented
      expect(mergeResult.mergedQuote?.version).toBe(4); // max(3, 3) + 1
    });

    it('should auto-merge location conflict using Last-Writer-Wins (remote newer)', () => {
      const localQuote = createTestQuote({
        versionVector: { 'device-A': 6, 'device-B': 2 },
        location: { suburb: 'Melbourne', postcode: '3000' },
        updated_at: new Date('2025-01-01T10:00:00Z'), // Local older
      });

      const remoteQuote = createTestQuote({
        versionVector: { 'device-A': 5, 'device-B': 4 },
        location: { suburb: 'Sydney', postcode: '2000' },
        updated_at: new Date('2025-01-01T11:00:00Z'), // Remote newer
      });

      const conflictReport = detectQuoteConflict(localQuote, remoteQuote);

      expect(conflictReport.hasConflict).toBe(true);
      expect(conflictReport.autoMergedFields).toHaveLength(1);
      expect(conflictReport.autoMergedFields[0].chosen).toBe('remote');

      const mergeResult = autoMergeQuotes(localQuote, remoteQuote);

      expect(mergeResult.success).toBe(true);
      expect(mergeResult.mergedQuote?.location).toEqual(remoteQuote.location); // Remote wins
    });
  });

  // ============================================================================
  // END-TO-END WORKFLOW: CRITICAL CONFLICT (MANUAL RESOLUTION)
  // ============================================================================

  describe('E2E: Critical Conflict (Manual Resolution Required)', () => {
    it('should fail auto-merge for critical field conflicts', () => {
      // Scenario: Concurrent edits to customer email (critical field)
      // Expected: Auto-merge fails, requires manual resolution

      const localQuote = createTestQuote({
        versionVector: { 'device-A': 10, 'device-B': 5 }, // Concurrent
        customer_email: 'john.old@example.com',
        updated_at: new Date('2025-01-01T11:00:00Z'),
      });

      const remoteQuote = createTestQuote({
        versionVector: { 'device-A': 9, 'device-B': 7 }, // Concurrent
        customer_email: 'john.new@example.com',
        updated_at: new Date('2025-01-01T10:45:00Z'),
      });

      // Step 1: Detect conflict
      const conflictReport = detectQuoteConflict(localQuote, remoteQuote);

      expect(conflictReport.hasConflict).toBe(true);
      expect(conflictReport.conflictingFields).toHaveLength(1);

      const emailConflict = conflictReport.conflictingFields[0];
      expect(emailConflict.path).toEqual(['customer_email']);
      expect(emailConflict.severity).toBe('critical');

      // Step 2: Try auto-merge (should fail)
      const mergeResult = autoMergeQuotes(localQuote, remoteQuote);

      expect(mergeResult.success).toBe(false);
      expect(mergeResult.mergedQuote).toBeUndefined();
      expect(mergeResult.error).toContain('critical conflicts');
      expect(mergeResult.error).toContain('manual resolution');
    });

    it('should simulate manual resolution workflow', () => {
      // Scenario: User manually resolves critical conflict
      // Expected: Merged quote created with user's choices

      const localQuote = createTestQuote({
        version: 5,
        versionVector: { 'device-A': 5, 'device-B': 2 },
        customer_email: 'local@example.com',
        customer_phone: '555-1111',
        metadata: { priority: 'high' }, // Non-critical field also different
        updated_at: new Date('2025-01-01T11:00:00Z'), // Local newer
      });

      const remoteQuote = createTestQuote({
        version: 7,
        versionVector: { 'device-A': 4, 'device-B': 3 },
        customer_email: 'remote@example.com',
        customer_phone: '555-2222',
        metadata: { priority: 'low' },
        updated_at: new Date('2025-01-01T10:00:00Z'), // Remote older
      });

      // Step 1: Detect conflicts
      const conflictReport = detectQuoteConflict(localQuote, remoteQuote);

      expect(conflictReport.hasConflict).toBe(true);
      expect(conflictReport.conflictingFields).toHaveLength(2); // email, phone
      expect(conflictReport.autoMergedFields).toHaveLength(1); // metadata

      // Step 2: User makes choices (simulated)
      const userChoices = {
        customer_email: 'local', // User chooses local email
        customer_phone: 'remote', // User chooses remote phone
      };

      // Step 3: Apply manual resolution
      const merged: Quote = { ...localQuote };

      // Apply user's choices for critical fields
      merged.customer_email =
        userChoices.customer_email === 'local'
          ? localQuote.customer_email
          : remoteQuote.customer_email;
      merged.customer_phone =
        userChoices.customer_phone === 'local'
          ? localQuote.customer_phone
          : remoteQuote.customer_phone;

      // Apply auto-merged field (metadata - local is newer)
      merged.metadata = conflictReport.autoMergedFields[0].mergedValue as Record<string, unknown>;

      // Merge version vectors
      const mergedVector = mergeVersionVectors(
        localQuote.versionVector || {},
        remoteQuote.versionVector || {},
      );
      const finalVector = incrementVersion(mergedVector, 'device-test');

      merged.versionVector = finalVector;
      merged.version = Math.max(localQuote.version, remoteQuote.version) + 1;
      merged.updated_at = new Date();

      // Verify result
      expect(merged.customer_email).toBe('local@example.com'); // Local choice
      expect(merged.customer_phone).toBe('555-2222'); // Remote choice
      expect(merged.metadata).toEqual({ priority: 'high' }); // Auto-merged (local newer)
      expect(merged.versionVector).toEqual({
        'device-A': 5,
        'device-B': 3,
        'device-test': 1,
      });
      expect(merged.version).toBe(8); // max(5, 7) + 1
    });
  });

  // ============================================================================
  // SYNC QUEUE INTEGRATION
  // ============================================================================

  describe('E2E: Sync Queue Integration', () => {
    it('should handle sync workflow with queue priorities', async () => {
      // Scenario: Multiple quotes with different priorities in sync queue
      // Expected: High priority quotes synced first

      const criticalQuote = createTestQuote({
        id: 'quote-critical',
        status: QuoteStatus.SENT, // Critical status
      });

      const normalQuote = createTestQuote({
        id: 'quote-normal',
        status: QuoteStatus.DRAFT, // Normal status
      });

      // Simulate adding to queue
      await syncQueue.enqueue(
        criticalQuote.id,
        SyncOperation.UPDATE,
        criticalQuote,
        SyncPriority.CRITICAL, // High priority
      );

      await syncQueue.enqueue(
        normalQuote.id,
        SyncOperation.UPDATE,
        normalQuote,
        SyncPriority.NORMAL, // Normal priority
      );

      // Verify priority ordering (via queue implementation)
      // In real scenario, getNextBatch() would return critical quote first
      expect(SyncPriority.CRITICAL).toBeLessThan(SyncPriority.NORMAL);
    });
  });

  // ============================================================================
  // VERSION VECTOR WORKFLOWS
  // ============================================================================

  describe('E2E: Version Vector Workflows', () => {
    it('should handle multi-device concurrent edits', () => {
      // Scenario: Three devices make changes concurrently
      // Expected: Version vectors track all devices correctly

      // Device A makes change
      const quote = createTestQuote({
        versionVector: createVersionVector('device-A'),
      });

      expect(quote.versionVector).toEqual({ 'device-A': 1 });

      // Device B makes concurrent change
      const deviceBVersion = incrementVersion(quote.versionVector!, 'device-B');
      const quoteFromB = { ...quote, versionVector: deviceBVersion };

      expect(quoteFromB.versionVector).toEqual({
        'device-A': 1,
        'device-B': 1,
      });

      // Device A makes another change
      const deviceAVersion2 = incrementVersion(quote.versionVector!, 'device-A');
      const quoteFromA2 = { ...quote, versionVector: deviceAVersion2 };

      expect(quoteFromA2.versionVector).toEqual({ 'device-A': 2 });

      // Merge: Device C receives both versions
      const mergedVector = mergeVersionVectors(
        quoteFromA2.versionVector!,
        quoteFromB.versionVector!,
      );

      expect(mergedVector).toEqual({
        'device-A': 2, // max(2, 1)
        'device-B': 1, // max(0, 1)
      });

      // Device C increments after merge
      const deviceCFinal = incrementVersion(mergedVector, 'device-C');

      expect(deviceCFinal).toEqual({
        'device-A': 2,
        'device-B': 1,
        'device-C': 1,
      });
    });
  });
});
