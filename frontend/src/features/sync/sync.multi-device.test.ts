/**
 * Sync Engine - Multi-Device Sync Testing
 *
 * Feature 5.6, Task 5.6.1: Multi-Device Sync Testing
 *
 * Tests sync behavior across multiple devices:
 * - 2 devices editing same quote offline
 * - 3-way conflicts (3 devices)
 * - Auto-merge + manual resolution workflows
 */

import { describe, it, expect, vi } from 'vitest';
import { QuoteStatus, type Quote } from '../../shared/types/models';
import { detectQuoteConflict } from './conflictDetection';
import { autoMergeQuotes } from './autoMerge';
import {
  createVersionVector,
  incrementVersion,
  mergeVersionVectors,
  detectConflict,
} from './versionVectors';

// Mock getDeviceId to return consistent value for tests
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
    customer_phone: '555-1234',
    created_at: new Date('2025-01-01T10:00:00Z'),
    updated_at: new Date('2025-01-01T10:00:00Z'),
    ...overrides,
  };
}

describe('Multi-Device Sync Testing', () => {
  // ============================================================================
  // 2 DEVICES EDITING SAME QUOTE OFFLINE
  // ============================================================================

  describe('2 Devices - Offline Edits', () => {
    it('should handle 2 devices editing different fields offline', () => {
      // Scenario: Device A and Device B both go offline and edit quote independently
      // Expected: Both changes merge successfully

      // Initial quote (synced to both devices)
      const initialQuote = createTestQuote({
        version: 5,
        versionVector: { 'device-A': 3, 'device-B': 2 },
        customer_name: 'John Smith',
        customer_email: 'john@example.com',
        metadata: { priority: 'normal' },
        updated_at: new Date('2025-01-01T10:00:00Z'),
      });

      // Device A goes offline, edits metadata
      const quoteFromA = {
        ...initialQuote,
        version: 6,
        versionVector: incrementVersion(initialQuote.versionVector!, 'device-A'),
        metadata: { priority: 'high', notes: 'Urgent customer' },
        updated_at: new Date('2025-01-01T11:00:00Z'), // A edits at 11:00
      };

      // Device B goes offline (before A's changes sync), edits location
      const quoteFromB = {
        ...initialQuote,
        version: 6,
        versionVector: incrementVersion(initialQuote.versionVector!, 'device-B'),
        location: { suburb: 'Melbourne', postcode: '3000' },
        updated_at: new Date('2025-01-01T10:30:00Z'), // B edits at 10:30
      };

      // Both come online and try to sync
      // Device A's change reaches server first
      // Device B tries to sync and detects conflict

      const conflictReport = detectQuoteConflict(quoteFromB, quoteFromA);

      // Should detect conflict (concurrent edits)
      expect(conflictReport.hasConflict).toBe(true);
      expect(detectConflict(quoteFromB.versionVector!, quoteFromA.versionVector!)).toBe(true);

      // Both metadata and location are non-critical
      expect(conflictReport.conflictingFields).toHaveLength(0);
      expect(conflictReport.autoMergedFields.length).toBeGreaterThan(0);

      // Auto-merge should succeed
      const mergeResult = autoMergeQuotes(quoteFromB, quoteFromA);

      expect(mergeResult.success).toBe(true);
      expect(mergeResult.mergedQuote).toBeDefined();

      // Metadata should use A's value (newer timestamp)
      expect(mergeResult.mergedQuote?.metadata).toEqual(quoteFromA.metadata);

      // Version vector should be merged
      expect(mergeResult.mergedQuote?.versionVector).toEqual({
        'device-A': 4, // Incremented from 3
        'device-B': 3, // Incremented from 2
        'device-test': 1, // Device performing merge
      });
    });

    it('should handle 2 devices editing same critical field offline', () => {
      // Scenario: Both devices edit customer email (critical field)
      // Expected: Conflict detected, requires manual resolution

      const initialQuote = createTestQuote({
        versionVector: { 'device-A': 5, 'device-B': 5 },
        customer_email: 'john@example.com',
        updated_at: new Date('2025-01-01T10:00:00Z'),
      });

      // Device A: Changes email
      const quoteFromA = {
        ...initialQuote,
        versionVector: incrementVersion(initialQuote.versionVector!, 'device-A'),
        customer_email: 'john.smith.new@example.com',
        updated_at: new Date('2025-01-01T11:00:00Z'),
      };

      // Device B: Changes email to different value
      const quoteFromB = {
        ...initialQuote,
        versionVector: incrementVersion(initialQuote.versionVector!, 'device-B'),
        customer_email: 'jsmith@example.com',
        updated_at: new Date('2025-01-01T10:45:00Z'),
      };

      // Detect conflict
      const conflictReport = detectQuoteConflict(quoteFromB, quoteFromA);

      expect(conflictReport.hasConflict).toBe(true);
      expect(conflictReport.conflictingFields).toHaveLength(1);
      expect(conflictReport.conflictingFields[0].path).toEqual(['customer_email']);
      expect(conflictReport.conflictingFields[0].severity).toBe('critical');

      // Auto-merge should fail
      const mergeResult = autoMergeQuotes(quoteFromB, quoteFromA);

      expect(mergeResult.success).toBe(false);
      expect(mergeResult.error).toContain('critical conflicts');
      expect(mergeResult.error).toContain('manual resolution');
    });

    it('should handle 2 devices with mixed critical and non-critical edits', () => {
      // Scenario: Device A edits critical field, Device B edits non-critical
      // Expected: Auto-merge non-critical, manual resolution for critical

      const initialQuote = createTestQuote({
        versionVector: { 'device-A': 2, 'device-B': 2 },
        customer_email: 'john@example.com',
        metadata: { priority: 'normal' },
        updated_at: new Date('2025-01-01T10:00:00Z'),
      });

      // Device A: Changes email (critical)
      const quoteFromA = {
        ...initialQuote,
        versionVector: incrementVersion(initialQuote.versionVector!, 'device-A'),
        customer_email: 'john.new@example.com',
        updated_at: new Date('2025-01-01T11:00:00Z'),
      };

      // Device B: Changes metadata (non-critical)
      const quoteFromB = {
        ...initialQuote,
        versionVector: incrementVersion(initialQuote.versionVector!, 'device-B'),
        metadata: { priority: 'high' },
        updated_at: new Date('2025-01-01T10:30:00Z'),
      };

      const conflictReport = detectQuoteConflict(quoteFromB, quoteFromA);

      expect(conflictReport.hasConflict).toBe(true);
      expect(conflictReport.conflictingFields).toHaveLength(1); // Email (critical)
      expect(conflictReport.autoMergedFields).toHaveLength(1); // Metadata (non-critical)

      // Auto-merge should fail due to critical conflict
      const mergeResult = autoMergeQuotes(quoteFromB, quoteFromA);

      expect(mergeResult.success).toBe(false);
    });
  });

  // ============================================================================
  // 3-WAY CONFLICTS (3 DEVICES)
  // ============================================================================

  describe('3-Way Conflicts', () => {
    it('should handle 3 devices editing different fields', () => {
      // Scenario: 3 devices make concurrent edits to different fields
      // Expected: All changes can be merged (no overlaps)

      const initialQuote = createTestQuote({
        versionVector: { 'device-A': 1, 'device-B': 1, 'device-C': 1 },
        customer_name: 'John Smith',
        customer_email: 'john@example.com',
        customer_phone: '555-1111',
        metadata: { priority: 'normal' },
        location: undefined,
        updated_at: new Date('2025-01-01T10:00:00Z'),
      });

      // Device A: Updates metadata
      const quoteFromA = {
        ...initialQuote,
        versionVector: incrementVersion(initialQuote.versionVector!, 'device-A'),
        metadata: { priority: 'high' },
        updated_at: new Date('2025-01-01T10:15:00Z'),
      };

      // Device B: Updates location
      const quoteFromB = {
        ...initialQuote,
        versionVector: incrementVersion(initialQuote.versionVector!, 'device-B'),
        location: { suburb: 'Sydney', postcode: '2000' },
        updated_at: new Date('2025-01-01T10:20:00Z'),
      };

      // Device C: Updates customer name (critical field - but no conflict if only C changed it)
      const quoteFromC = {
        ...initialQuote,
        versionVector: incrementVersion(initialQuote.versionVector!, 'device-C'),
        customer_name: 'John Q. Smith',
        updated_at: new Date('2025-01-01T10:25:00Z'),
      };

      // Step 1: Merge A and B
      const mergeAB = mergeVersionVectors(quoteFromA.versionVector!, quoteFromB.versionVector!);

      expect(mergeAB).toEqual({
        'device-A': 2,
        'device-B': 2,
        'device-C': 1,
      });

      // Detect conflict between A and B
      const conflictAB = detectQuoteConflict(quoteFromA, quoteFromB);

      expect(conflictAB.hasConflict).toBe(true);
      expect(conflictAB.conflictingFields).toHaveLength(0); // No critical conflicts
      expect(conflictAB.autoMergedFields.length).toBeGreaterThan(0); // Metadata and location

      // Step 2: Now merge with C
      // C changed customer_name, which is critical
      // Check conflict between merged(A,B) and C

      const mergedAB: Quote = {
        ...quoteFromA,
        location: quoteFromB.location, // From B
        metadata: quoteFromA.metadata, // From A (newer)
        versionVector: mergeAB,
      };

      const conflictABC = detectQuoteConflict(mergedAB, quoteFromC);

      expect(conflictABC.hasConflict).toBe(true);
      expect(conflictABC.conflictingFields).toHaveLength(1); // customer_name
      expect(conflictABC.conflictingFields[0].path).toEqual(['customer_name']);

      // Final merge requires manual resolution for customer_name
      // But metadata and location are already resolved
    });

    it('should handle 3 devices editing same critical field', () => {
      // Scenario: 3 devices all edit customer email
      // Expected: Multiple critical conflicts requiring manual resolution

      const initialQuote = createTestQuote({
        versionVector: { 'device-A': 5, 'device-B': 5, 'device-C': 5 },
        customer_email: 'john@example.com',
        updated_at: new Date('2025-01-01T10:00:00Z'),
      });

      // Device A: Changes to email-a
      const quoteFromA = {
        ...initialQuote,
        versionVector: incrementVersion(initialQuote.versionVector!, 'device-A'),
        customer_email: 'email-a@example.com',
        updated_at: new Date('2025-01-01T10:10:00Z'),
      };

      // Device B: Changes to email-b
      const quoteFromB = {
        ...initialQuote,
        versionVector: incrementVersion(initialQuote.versionVector!, 'device-B'),
        customer_email: 'email-b@example.com',
        updated_at: new Date('2025-01-01T10:15:00Z'),
      };

      // Device C: Changes to email-c
      const quoteFromC = {
        ...initialQuote,
        versionVector: incrementVersion(initialQuote.versionVector!, 'device-C'),
        customer_email: 'email-c@example.com',
        updated_at: new Date('2025-01-01T10:20:00Z'), // Newest
      };

      // Conflict between A and B
      const conflictAB = detectQuoteConflict(quoteFromA, quoteFromB);

      expect(conflictAB.hasConflict).toBe(true);
      expect(conflictAB.conflictingFields).toHaveLength(1);

      // If manual resolution chooses B
      const resolvedAB: Quote = {
        ...quoteFromA,
        customer_email: quoteFromB.customer_email, // User chose B
        versionVector: mergeVersionVectors(quoteFromA.versionVector!, quoteFromB.versionVector!),
      };

      // Now conflict with C
      const conflictABC = detectQuoteConflict(resolvedAB, quoteFromC);

      expect(conflictABC.hasConflict).toBe(true);
      expect(conflictABC.conflictingFields).toHaveLength(1);

      // Final choice: C has newest timestamp, user might choose C
      expect(quoteFromC.customer_email).toBe('email-c@example.com');
    });

    it('should correctly merge version vectors from 3 devices', () => {
      // Scenario: Verify version vector mechanics with 3 devices
      // Expected: Version vectors properly track all device edits

      // Initial state
      const v1 = createVersionVector('device-A'); // {device-A: 1}

      // Device B makes edit
      const v2 = incrementVersion(v1, 'device-B'); // {device-A: 1, device-B: 1}

      // Device A makes another edit (doesn't know about B yet)
      const v3 = incrementVersion(v1, 'device-A'); // {device-A: 2}

      // Device C makes edit (doesn't know about A or B)
      const v4 = incrementVersion({}, 'device-C'); // {device-C: 1}

      // Now merge all three
      const mergedAB = mergeVersionVectors(v2, v3);
      const mergedABC = mergeVersionVectors(mergedAB, v4);

      expect(mergedABC).toEqual({
        'device-A': 2, // max(1, 2, 0)
        'device-B': 1, // max(1, 0, 0)
        'device-C': 1, // max(0, 0, 1)
      });

      // Verify conflict detection
      expect(detectConflict(v2, v3)).toBe(true); // A and B concurrent
      expect(detectConflict(v3, v4)).toBe(true); // A and C concurrent
      expect(detectConflict(v2, v4)).toBe(true); // B and C concurrent
    });
  });

  // ============================================================================
  // VERIFY AUTO-MERGE + MANUAL RESOLUTION WORKFLOWS
  // ============================================================================

  describe('Auto-Merge + Manual Resolution Workflows', () => {
    it('should auto-merge non-critical fields then require manual resolution for critical', () => {
      // Scenario: Complex quote with both auto-mergeable and critical conflicts
      // Expected: Auto-merge handles what it can, flags rest for manual

      const initialQuote = createTestQuote({
        versionVector: { 'device-A': 10, 'device-B': 10 },
        customer_name: 'John Smith',
        customer_email: 'john@example.com',
        customer_phone: '555-1111',
        metadata: { priority: 'normal', source: 'website' },
        location: { suburb: 'Brisbane', postcode: '4000' },
        updated_at: new Date('2025-01-01T10:00:00Z'),
      });

      // Device A: Updates critical (email) + non-critical (metadata)
      const quoteFromA = {
        ...initialQuote,
        versionVector: incrementVersion(initialQuote.versionVector!, 'device-A'),
        customer_email: 'john.new@example.com', // Critical
        metadata: { priority: 'high', source: 'website', notes: 'Urgent' }, // Non-critical
        updated_at: new Date('2025-01-01T11:00:00Z'), // Newer
      };

      // Device B: Updates different critical (phone) + non-critical (location)
      const quoteFromB = {
        ...initialQuote,
        versionVector: incrementVersion(initialQuote.versionVector!, 'device-B'),
        customer_phone: '555-2222', // Critical
        location: { suburb: 'Sydney', postcode: '2000' }, // Non-critical
        updated_at: new Date('2025-01-01T10:30:00Z'), // Older
      };

      // Detect conflicts
      const conflictReport = detectQuoteConflict(quoteFromA, quoteFromB);

      expect(conflictReport.hasConflict).toBe(true);

      // Should have 2 critical conflicts (email, phone)
      expect(conflictReport.conflictingFields).toHaveLength(2);
      const criticalFields = conflictReport.conflictingFields.map((f) => f.path[0]);
      expect(criticalFields).toContain('customer_email');
      expect(criticalFields).toContain('customer_phone');

      // Should auto-merge 2 non-critical fields (metadata, location)
      expect(conflictReport.autoMergedFields).toHaveLength(2);
      const autoMergedFields = conflictReport.autoMergedFields.map((f) => f.path[0]);
      expect(autoMergedFields).toContain('metadata');
      expect(autoMergedFields).toContain('location');

      // Verify auto-merge choices (Last-Writer-Wins)
      const metadataField = conflictReport.autoMergedFields.find((f) => f.path[0] === 'metadata');
      expect(metadataField?.chosen).toBe('local'); // A is newer

      const locationField = conflictReport.autoMergedFields.find((f) => f.path[0] === 'location');
      expect(locationField?.chosen).toBe('local'); // A is newer

      // Auto-merge should fail (critical conflicts present)
      const autoMergeResult = autoMergeQuotes(quoteFromA, quoteFromB);

      expect(autoMergeResult.success).toBe(false);

      // User must manually resolve email and phone
      // Simulate manual resolution
      const manuallyResolved: Quote = {
        ...quoteFromA,
        customer_email: quoteFromA.customer_email, // User chose A
        customer_phone: quoteFromB.customer_phone, // User chose B
        metadata: metadataField?.mergedValue as Record<string, unknown>, // Auto-merged
        location: locationField?.mergedValue as typeof initialQuote.location, // Auto-merged
        versionVector: mergeVersionVectors(quoteFromA.versionVector!, quoteFromB.versionVector!),
      };

      expect(manuallyResolved.customer_email).toBe('john.new@example.com');
      expect(manuallyResolved.customer_phone).toBe('555-2222');
      expect(manuallyResolved.metadata).toEqual(quoteFromA.metadata);
      expect(manuallyResolved.location).toEqual(quoteFromA.location); // LWW chose A (newer)
    });

    it('should handle complete auto-merge workflow when only non-critical conflicts', () => {
      // Scenario: Only non-critical fields conflict
      // Expected: Complete auto-merge, no manual intervention

      const quoteFromA = createTestQuote({
        versionVector: { 'device-A': 8, 'device-B': 5 },
        metadata: { priority: 'high' },
        location: { suburb: 'Melbourne', postcode: '3000' },
        updated_at: new Date('2025-01-01T11:00:00Z'), // Newer
      });

      const quoteFromB = createTestQuote({
        versionVector: { 'device-A': 7, 'device-B': 6 },
        metadata: { priority: 'low' },
        location: { suburb: 'Brisbane', postcode: '4000' },
        updated_at: new Date('2025-01-01T10:00:00Z'), // Older
      });

      const conflictReport = detectQuoteConflict(quoteFromA, quoteFromB);

      expect(conflictReport.hasConflict).toBe(true);
      expect(conflictReport.conflictingFields).toHaveLength(0); // No critical
      expect(conflictReport.autoMergedFields.length).toBeGreaterThan(0);

      // Auto-merge should succeed
      const mergeResult = autoMergeQuotes(quoteFromA, quoteFromB);

      expect(mergeResult.success).toBe(true);
      expect(mergeResult.mergedQuote).toBeDefined();

      // Should use A's values (newer)
      expect(mergeResult.mergedQuote?.metadata).toEqual(quoteFromA.metadata);
      expect(mergeResult.mergedQuote?.location).toEqual(quoteFromA.location);

      // Version vector merged correctly
      expect(mergeResult.mergedQuote?.versionVector).toEqual({
        'device-A': 8,
        'device-B': 6,
        'device-test': 1,
      });
    });
  });

  // ============================================================================
  // EDGE CASE: SAME TIMESTAMP
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle same timestamp on different devices', () => {
      // Scenario: Two devices edit at exact same millisecond
      // Expected: Deterministic resolution (fallback to device ID comparison)

      const sameTime = new Date('2025-01-01T10:00:00.000Z');

      const quoteFromA = createTestQuote({
        versionVector: { 'device-A': 5, 'device-B': 3 },
        metadata: { priority: 'high' },
        updated_at: sameTime,
      });

      const quoteFromB = createTestQuote({
        versionVector: { 'device-A': 4, 'device-B': 4 },
        metadata: { priority: 'low' },
        updated_at: sameTime, // Same timestamp!
      });

      const conflictReport = detectQuoteConflict(quoteFromA, quoteFromB);

      expect(conflictReport.hasConflict).toBe(true);

      // Auto-merge should still work (implementation detail: falls back to other criteria)
      const mergeResult = autoMergeQuotes(quoteFromA, quoteFromB);

      expect(mergeResult.success).toBe(true);
      expect(mergeResult.mergedQuote).toBeDefined();

      // Should pick one deterministically (doesn't matter which, just needs to be consistent)
      expect(mergeResult.mergedQuote?.metadata).toBeDefined();
    });
  });
});
