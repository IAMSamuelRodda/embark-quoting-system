/**
 * Version Vector Helper Functions - Unit Tests
 *
 * Test scenarios based on spike-conflict-poc.js
 */

import { describe, it, expect } from 'vitest';
import {
  detectConflict,
  areVectorsEqual,
  hasGreaterVersion,
  mergeVersionVectors,
  incrementVersion,
  createVersionVector,
  formatVersionVector,
  getTotalEdits,
  getMostActiveDevice,
} from './versionVectors';

describe('versionVectors', () => {
  // ============================================================================
  // CONFLICT DETECTION
  // ============================================================================

  describe('detectConflict', () => {
    it('should return false when local is newer (no conflict)', () => {
      const local = { 'device-A': 5, 'device-B': 2 };
      const remote = { 'device-A': 4, 'device-B': 2 };

      expect(detectConflict(local, remote)).toBe(false);
    });

    it('should return false when remote is newer (no conflict)', () => {
      const local = { 'device-A': 3, 'device-B': 4 };
      const remote = { 'device-A': 3, 'device-B': 5 };

      expect(detectConflict(local, remote)).toBe(false);
    });

    it('should return true when both advanced (CONFLICT)', () => {
      const local = { 'device-A': 5, 'device-B': 2 };
      const remote = { 'device-A': 4, 'device-B': 3 };

      expect(detectConflict(local, remote)).toBe(true);
    });

    it('should return false when vectors are equal', () => {
      const local = { 'device-A': 5, 'device-B': 2 };
      const remote = { 'device-A': 5, 'device-B': 2 };

      expect(detectConflict(local, remote)).toBe(false);
    });

    it('should handle three-way conflicts', () => {
      const local = { 'device-A': 3, 'device-B': 2, 'device-C': 1 };
      const remote = { 'device-A': 2, 'device-B': 4, 'device-C': 3 };

      expect(detectConflict(local, remote)).toBe(true);
    });
  });

  describe('areVectorsEqual', () => {
    it('should return true for identical vectors', () => {
      const v1 = { 'device-A': 5, 'device-B': 2 };
      const v2 = { 'device-A': 5, 'device-B': 2 };

      expect(areVectorsEqual(v1, v2)).toBe(true);
    });

    it('should return true when missing counters are treated as 0', () => {
      const v1 = { 'device-A': 5 };
      const v2 = { 'device-A': 5, 'device-B': 0 };

      expect(areVectorsEqual(v1, v2)).toBe(true);
    });

    it('should return false for different vectors', () => {
      const v1 = { 'device-A': 5, 'device-B': 2 };
      const v2 = { 'device-A': 5, 'device-B': 3 };

      expect(areVectorsEqual(v1, v2)).toBe(false);
    });

    it('should handle empty vectors', () => {
      const v1 = {};
      const v2 = {};

      expect(areVectorsEqual(v1, v2)).toBe(true);
    });
  });

  describe('hasGreaterVersion', () => {
    it('should return true when v1 is strictly newer', () => {
      const v1 = { 'device-A': 5, 'device-B': 2 };
      const v2 = { 'device-A': 4, 'device-B': 2 };

      expect(hasGreaterVersion(v1, v2)).toBe(true);
    });

    it('should return false when v1 has lower counters', () => {
      const v1 = { 'device-A': 5, 'device-B': 2 };
      const v2 = { 'device-A': 4, 'device-B': 3 };

      expect(hasGreaterVersion(v1, v2)).toBe(false);
    });

    it('should return false when vectors are equal', () => {
      const v1 = { 'device-A': 5, 'device-B': 2 };
      const v2 = { 'device-A': 5, 'device-B': 2 };

      expect(hasGreaterVersion(v1, v2)).toBe(false);
    });

    it('should return true when v1 has new device', () => {
      const v1 = { 'device-A': 5, 'device-B': 2, 'device-C': 1 };
      const v2 = { 'device-A': 5, 'device-B': 2 };

      expect(hasGreaterVersion(v1, v2)).toBe(true);
    });
  });

  // ============================================================================
  // VECTOR OPERATIONS
  // ============================================================================

  describe('mergeVersionVectors', () => {
    it('should take max of each device counter', () => {
      const v1 = { 'device-A': 5, 'device-B': 2 };
      const v2 = { 'device-A': 4, 'device-B': 3 };

      const merged = mergeVersionVectors(v1, v2);

      expect(merged).toEqual({
        'device-A': 5,
        'device-B': 3,
      });
    });

    it('should include devices from both vectors', () => {
      const v1 = { 'device-A': 5, 'device-B': 2 };
      const v2 = { 'device-B': 3, 'device-C': 1 };

      const merged = mergeVersionVectors(v1, v2);

      expect(merged).toEqual({
        'device-A': 5,
        'device-B': 3,
        'device-C': 1,
      });
    });

    it('should handle empty vectors', () => {
      const v1 = {};
      const v2 = { 'device-A': 5 };

      const merged = mergeVersionVectors(v1, v2);

      expect(merged).toEqual({ 'device-A': 5 });
    });
  });

  describe('incrementVersion', () => {
    it('should increment existing device counter', () => {
      const vector = { 'device-A': 5, 'device-B': 2 };

      const updated = incrementVersion(vector, 'device-A');

      expect(updated).toEqual({
        'device-A': 6,
        'device-B': 2,
      });
    });

    it('should add new device with counter 1', () => {
      const vector = { 'device-A': 5 };

      const updated = incrementVersion(vector, 'device-B');

      expect(updated).toEqual({
        'device-A': 5,
        'device-B': 1,
      });
    });

    it('should not mutate original vector', () => {
      const vector = { 'device-A': 5 };
      const original = { ...vector };

      incrementVersion(vector, 'device-A');

      expect(vector).toEqual(original);
    });
  });

  describe('createVersionVector', () => {
    it('should create vector with device at version 1', () => {
      const vector = createVersionVector('device-abc123');

      expect(vector).toEqual({
        'device-abc123': 1,
      });
    });
  });

  // ============================================================================
  // UTILITIES
  // ============================================================================

  describe('formatVersionVector', () => {
    it('should format vector as readable string', () => {
      const vector = { 'device-A': 5, 'device-B': 3 };

      const formatted = formatVersionVector(vector);

      expect(formatted).toBe('device-A:5, device-B:3');
    });

    it('should truncate long device IDs', () => {
      const vector = { 'device-abc123-very-long-id': 5 };

      const formatted = formatVersionVector(vector);

      expect(formatted).toContain('device-a...');
    });

    it('should handle empty vector', () => {
      const vector = {};

      const formatted = formatVersionVector(vector);

      expect(formatted).toBe('');
    });
  });

  describe('getTotalEdits', () => {
    it('should sum all device counters', () => {
      const vector = { 'device-A': 5, 'device-B': 3, 'device-C': 1 };

      const total = getTotalEdits(vector);

      expect(total).toBe(9);
    });

    it('should return 0 for empty vector', () => {
      const vector = {};

      const total = getTotalEdits(vector);

      expect(total).toBe(0);
    });
  });

  describe('getMostActiveDevice', () => {
    it('should return device with highest counter', () => {
      const vector = { 'device-A': 5, 'device-B': 3, 'device-C': 8 };

      const mostActive = getMostActiveDevice(vector);

      expect(mostActive).toBe('device-C');
    });

    it('should return null for empty vector', () => {
      const vector = {};

      const mostActive = getMostActiveDevice(vector);

      expect(mostActive).toBeNull();
    });

    it('should handle single device', () => {
      const vector = { 'device-A': 5 };

      const mostActive = getMostActiveDevice(vector);

      expect(mostActive).toBe('device-A');
    });
  });

  // ============================================================================
  // INTEGRATION SCENARIOS (from spike-conflict-poc.js)
  // ============================================================================

  describe('Integration Scenarios', () => {
    it('Scenario 1: No conflict - local newer', () => {
      const local = { 'device-A': 5, 'device-B': 2 };
      const remote = { 'device-A': 4, 'device-B': 2 };

      expect(detectConflict(local, remote)).toBe(false);
      expect(hasGreaterVersion(local, remote)).toBe(true);
      expect(hasGreaterVersion(remote, local)).toBe(false);
    });

    it('Scenario 2: No conflict - remote newer', () => {
      const local = { 'device-A': 3, 'device-B': 4 };
      const remote = { 'device-A': 3, 'device-B': 5 };

      expect(detectConflict(local, remote)).toBe(false);
      expect(hasGreaterVersion(local, remote)).toBe(false);
      expect(hasGreaterVersion(remote, local)).toBe(true);
    });

    it('Scenario 3: Conflict - concurrent edits', () => {
      const local = { 'device-A': 6, 'device-B': 2 };
      const remote = { 'device-A': 5, 'device-B': 4 };

      expect(detectConflict(local, remote)).toBe(true);

      // After resolution, merge vectors
      const merged = mergeVersionVectors(local, remote);
      expect(merged).toEqual({ 'device-A': 6, 'device-B': 4 });

      // Increment merged vector for local device
      const resolved = incrementVersion(merged, 'device-A');
      expect(resolved).toEqual({ 'device-A': 7, 'device-B': 4 });
    });

    it('Scenario 4: Three-way conflict', () => {
      const local = { 'device-A': 3, 'device-B': 2, 'device-C': 1 };
      const remote = { 'device-A': 2, 'device-B': 4, 'device-C': 3 };

      expect(detectConflict(local, remote)).toBe(true);

      // Merge preserves all changes
      const merged = mergeVersionVectors(local, remote);
      expect(merged).toEqual({ 'device-A': 3, 'device-B': 4, 'device-C': 3 });
    });
  });
});
