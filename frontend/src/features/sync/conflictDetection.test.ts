/**
 * Conflict Detection - Unit Tests
 *
 * Test scenarios based on SPIKE POC
 */

import { describe, it, expect } from 'vitest';
import {
  detectQuoteConflict,
  isFieldCritical,
  canAutoMergeField,
  hasCriticalConflicts,
  canAutoResolve,
  ConflictSeverity,
} from './conflictDetection';
import { QuoteStatus, type Quote } from '../../shared/types/models';

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

describe('conflictDetection', () => {
  // ============================================================================
  // FIELD CLASSIFICATION
  // ============================================================================

  describe('isFieldCritical', () => {
    it('should identify critical fields', () => {
      expect(isFieldCritical('customer_name')).toBe(true);
      expect(isFieldCritical('customer_email')).toBe(true);
      expect(isFieldCritical('customer_phone')).toBe(true);
      expect(isFieldCritical('status')).toBe(true);
      expect(isFieldCritical('jobs')).toBe(true);
      expect(isFieldCritical('financials')).toBe(true);
    });

    it('should identify non-critical fields', () => {
      expect(isFieldCritical('metadata')).toBe(false);
      expect(isFieldCritical('location')).toBe(false);
      expect(isFieldCritical('created_at')).toBe(false);
    });
  });

  describe('canAutoMergeField', () => {
    it('should identify auto-mergeable fields', () => {
      expect(canAutoMergeField('metadata')).toBe(true);
      expect(canAutoMergeField('location')).toBe(true);
    });

    it('should not auto-merge critical fields', () => {
      expect(canAutoMergeField('customer_email')).toBe(false);
      expect(canAutoMergeField('status')).toBe(false);
    });
  });

  // ============================================================================
  // NO CONFLICT SCENARIOS
  // ============================================================================

  describe('detectQuoteConflict - No Conflict', () => {
    it('should return no conflict when local is strictly newer', () => {
      const local = createTestQuote({
        versionVector: { 'device-A': 5, 'device-B': 2 },
        updated_at: new Date('2025-01-01T11:00:00Z'),
      });

      const remote = createTestQuote({
        versionVector: { 'device-A': 4, 'device-B': 2 },
        updated_at: new Date('2025-01-01T10:00:00Z'),
      });

      const report = detectQuoteConflict(local, remote);

      expect(report.hasConflict).toBe(false);
      expect(report.conflictingFields).toHaveLength(0);
      expect(report.autoMergedFields).toHaveLength(0);
    });

    it('should return no conflict when remote is strictly newer', () => {
      const local = createTestQuote({
        versionVector: { 'device-A': 3, 'device-B': 4 },
        updated_at: new Date('2025-01-01T10:00:00Z'),
      });

      const remote = createTestQuote({
        versionVector: { 'device-A': 3, 'device-B': 5 },
        updated_at: new Date('2025-01-01T11:00:00Z'),
      });

      const report = detectQuoteConflict(local, remote);

      expect(report.hasConflict).toBe(false);
      expect(report.conflictingFields).toHaveLength(0);
      expect(report.autoMergedFields).toHaveLength(0);
    });

    it('should return no conflict when versions are equal', () => {
      const local = createTestQuote({
        versionVector: { 'device-A': 5, 'device-B': 2 },
        customer_name: 'John Smith',
      });

      const remote = createTestQuote({
        versionVector: { 'device-A': 5, 'device-B': 2 },
        customer_name: 'John Smith',
      });

      const report = detectQuoteConflict(local, remote);

      expect(report.hasConflict).toBe(false);
      expect(report.conflictingFields).toHaveLength(0);
      expect(report.autoMergedFields).toHaveLength(0);
    });
  });

  // ============================================================================
  // AUTO-MERGE SCENARIOS (Non-Critical Conflicts)
  // ============================================================================

  describe('detectQuoteConflict - Auto-Merge', () => {
    it('should auto-merge metadata using Last-Writer-Wins', () => {
      const local = createTestQuote({
        versionVector: { 'device-A': 6, 'device-B': 2 }, // Concurrent
        metadata: { priority: 'high', notes: 'Customer prefers morning' },
        updated_at: new Date('2025-01-01T11:00:00Z'), // Local newer
      });

      const remote = createTestQuote({
        versionVector: { 'device-A': 5, 'device-B': 4 }, // Concurrent
        metadata: { priority: 'low', notes: 'Flexible schedule' },
        updated_at: new Date('2025-01-01T10:30:00Z'), // Remote older
      });

      const report = detectQuoteConflict(local, remote);

      expect(report.hasConflict).toBe(true);
      expect(report.conflictingFields).toHaveLength(0); // No critical conflicts
      expect(report.autoMergedFields).toHaveLength(1);

      const metadataField = report.autoMergedFields[0];
      expect(metadataField.path).toEqual(['metadata']);
      expect(metadataField.strategy).toBe('last-writer-wins');
      expect(metadataField.chosen).toBe('local'); // Local is newer
      expect(metadataField.mergedValue).toEqual(local.metadata);
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

      const report = detectQuoteConflict(local, remote);

      expect(report.hasConflict).toBe(true);
      expect(report.autoMergedFields).toHaveLength(1);

      const locationField = report.autoMergedFields[0];
      expect(locationField.chosen).toBe('remote'); // Remote is newer
      expect(locationField.mergedValue).toEqual(remote.location);
    });

    it('should auto-merge multiple non-critical fields', () => {
      const local = createTestQuote({
        versionVector: { 'device-A': 6, 'device-B': 2 },
        metadata: { priority: 'high' },
        location: { suburb: 'Melbourne' },
        updated_at: new Date('2025-01-01T11:00:00Z'),
      });

      const remote = createTestQuote({
        versionVector: { 'device-A': 5, 'device-B': 4 },
        metadata: { priority: 'low' },
        location: { suburb: 'Sydney' },
        updated_at: new Date('2025-01-01T10:00:00Z'),
      });

      const report = detectQuoteConflict(local, remote);

      expect(report.hasConflict).toBe(true);
      expect(report.autoMergedFields).toHaveLength(2);
      expect(report.conflictingFields).toHaveLength(0);
    });
  });

  // ============================================================================
  // CRITICAL CONFLICT SCENARIOS
  // ============================================================================

  describe('detectQuoteConflict - Critical Conflicts', () => {
    it('should flag customer_email conflict as critical', () => {
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

      const report = detectQuoteConflict(local, remote);

      expect(report.hasConflict).toBe(true);
      expect(report.conflictingFields).toHaveLength(1);

      const emailConflict = report.conflictingFields[0];
      expect(emailConflict.path).toEqual(['customer_email']);
      expect(emailConflict.severity).toBe(ConflictSeverity.CRITICAL);
      expect(emailConflict.localValue).toBe('bob@oldcompany.com');
      expect(emailConflict.remoteValue).toBe('bob@newcompany.com');
    });

    it('should flag multiple critical conflicts', () => {
      const local = createTestQuote({
        versionVector: { 'device-A': 10, 'device-B': 5 },
        customer_email: 'bob@oldcompany.com',
        customer_phone: '555-1111',
        status: QuoteStatus.DRAFT,
        updated_at: new Date('2025-01-01T11:00:00Z'),
      });

      const remote = createTestQuote({
        versionVector: { 'device-A': 9, 'device-B': 7 },
        customer_email: 'bob@newcompany.com',
        customer_phone: '555-2222',
        status: QuoteStatus.SENT,
        updated_at: new Date('2025-01-01T10:45:00Z'),
      });

      const report = detectQuoteConflict(local, remote);

      expect(report.hasConflict).toBe(true);
      expect(report.conflictingFields).toHaveLength(3);

      const fields = report.conflictingFields.map((f) => f.path[0]);
      expect(fields).toContain('customer_email');
      expect(fields).toContain('customer_phone');
      expect(fields).toContain('status');
    });

    it('should handle mixed critical and non-critical conflicts', () => {
      const local = createTestQuote({
        versionVector: { 'device-A': 10, 'device-B': 5 },
        customer_email: 'bob@oldcompany.com', // Critical
        metadata: { priority: 'high' }, // Non-critical
        updated_at: new Date('2025-01-01T11:00:00Z'),
      });

      const remote = createTestQuote({
        versionVector: { 'device-A': 9, 'device-B': 7 },
        customer_email: 'bob@newcompany.com', // Critical
        metadata: { priority: 'low' }, // Non-critical
        updated_at: new Date('2025-01-01T10:45:00Z'),
      });

      const report = detectQuoteConflict(local, remote);

      expect(report.hasConflict).toBe(true);
      expect(report.conflictingFields).toHaveLength(1); // customer_email
      expect(report.autoMergedFields).toHaveLength(1); // metadata
    });
  });

  // ============================================================================
  // CONFLICT RESOLUTION HELPERS
  // ============================================================================

  describe('hasCriticalConflicts', () => {
    it('should return true when critical conflicts exist', () => {
      const local = createTestQuote({
        versionVector: { 'device-A': 5, 'device-B': 2 },
        customer_email: 'old@example.com',
      });

      const remote = createTestQuote({
        versionVector: { 'device-A': 4, 'device-B': 3 },
        customer_email: 'new@example.com',
      });

      const report = detectQuoteConflict(local, remote);

      expect(hasCriticalConflicts(report)).toBe(true);
    });

    it('should return false when only non-critical conflicts exist', () => {
      const local = createTestQuote({
        versionVector: { 'device-A': 5, 'device-B': 2 },
        metadata: { priority: 'high' },
      });

      const remote = createTestQuote({
        versionVector: { 'device-A': 4, 'device-B': 3 },
        metadata: { priority: 'low' },
      });

      const report = detectQuoteConflict(local, remote);

      expect(hasCriticalConflicts(report)).toBe(false);
    });
  });

  describe('canAutoResolve', () => {
    it('should return true for non-critical conflicts only', () => {
      const local = createTestQuote({
        versionVector: { 'device-A': 5, 'device-B': 2 },
        metadata: { priority: 'high' },
      });

      const remote = createTestQuote({
        versionVector: { 'device-A': 4, 'device-B': 3 },
        metadata: { priority: 'low' },
      });

      const report = detectQuoteConflict(local, remote);

      expect(canAutoResolve(report)).toBe(true);
    });

    it('should return false when critical conflicts exist', () => {
      const local = createTestQuote({
        versionVector: { 'device-A': 5, 'device-B': 2 },
        customer_email: 'old@example.com',
      });

      const remote = createTestQuote({
        versionVector: { 'device-A': 4, 'device-B': 3 },
        customer_email: 'new@example.com',
      });

      const report = detectQuoteConflict(local, remote);

      expect(canAutoResolve(report)).toBe(false);
    });

    it('should return false when no conflicts exist', () => {
      const local = createTestQuote({
        versionVector: { 'device-A': 5, 'device-B': 2 },
      });

      const remote = createTestQuote({
        versionVector: { 'device-A': 4, 'device-B': 2 },
      });

      const report = detectQuoteConflict(local, remote);

      expect(canAutoResolve(report)).toBe(false);
    });
  });
});
