/**
 * Version Vector Helper Functions
 *
 * Task 5.2.1: Version vector algorithms for distributed conflict detection
 *
 * Based on proven algorithms from:
 * - docs/spike-conflict-poc.js (lines 59-132)
 * - docs/spike-conflict-resolution-design.md (Section 2.2)
 *
 * Version vectors track per-device edit counters to detect concurrent edits:
 * Example: {device-A: 5, device-B: 3} means device A made 5 edits, device B made 3 edits
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Version vector: maps device ID to version counter
 *
 * @example
 * {
 *   "device-abc123": 5,
 *   "device-xyz789": 3
 * }
 */
export interface VersionVector {
  [deviceId: string]: number;
}

// ============================================================================
// CONFLICT DETECTION
// ============================================================================

/**
 * Detect if two version vectors represent concurrent edits (conflict)
 *
 * Returns true if:
 * - Neither vector is strictly newer than the other AND
 * - The vectors are different
 *
 * This indicates both devices edited since their last sync.
 *
 * @param local - Local device's version vector
 * @param remote - Remote server's version vector
 * @returns true if conflict detected, false otherwise
 *
 * @example
 * detectConflict({A: 5, B: 2}, {A: 4, B: 2}) // false (local newer)
 * detectConflict({A: 5, B: 2}, {A: 4, B: 3}) // true (CONFLICT - both advanced)
 */
export function detectConflict(local: VersionVector, remote: VersionVector): boolean {
  const localNewer = hasGreaterVersion(local, remote);
  const remoteNewer = hasGreaterVersion(remote, local);

  // If local is strictly newer, no conflict
  if (localNewer) return false;

  // If remote is strictly newer, no conflict
  if (remoteNewer) return false;

  // Neither is strictly newer - check if they're equal
  // If different but neither newer = CONFLICT (concurrent edits)
  return !areVectorsEqual(local, remote);
}

/**
 * Check if two version vectors are equal
 *
 * Vectors are equal if all device counters match.
 *
 * @param v1 - First version vector
 * @param v2 - Second version vector
 * @returns true if vectors are identical
 *
 * @example
 * areVectorsEqual({A: 5, B: 2}, {A: 5, B: 2}) // true
 * areVectorsEqual({A: 5}, {A: 5, B: 0}) // true (missing = 0)
 * areVectorsEqual({A: 5, B: 2}, {A: 5, B: 3}) // false
 */
export function areVectorsEqual(v1: VersionVector, v2: VersionVector): boolean {
  // Get union of all device IDs from both vectors
  const allDeviceIds = new Set([...Object.keys(v1), ...Object.keys(v2)]);

  for (const deviceId of allDeviceIds) {
    const count1 = v1[deviceId] || 0;
    const count2 = v2[deviceId] || 0;

    if (count1 !== count2) {
      return false;
    }
  }

  return true;
}

/**
 * Check if v1 is strictly greater than v2
 *
 * v1 > v2 if:
 * - v1 has at least one higher counter than v2 AND
 * - v1 has no lower counters than v2
 *
 * This means v1 includes all changes from v2 plus additional changes.
 *
 * @param v1 - First version vector
 * @param v2 - Second version vector
 * @returns true if v1 is strictly newer
 *
 * @example
 * hasGreaterVersion({A: 5, B: 2}, {A: 4, B: 2}) // true (A advanced)
 * hasGreaterVersion({A: 5, B: 2}, {A: 4, B: 3}) // false (A higher but B lower)
 * hasGreaterVersion({A: 5, B: 2}, {A: 5, B: 2}) // false (equal, not greater)
 */
export function hasGreaterVersion(v1: VersionVector, v2: VersionVector): boolean {
  // Get union of all device IDs from both vectors
  const allDeviceIds = new Set([...Object.keys(v1), ...Object.keys(v2)]);

  let hasHigher = false;

  for (const deviceId of allDeviceIds) {
    const v1Count = v1[deviceId] || 0;
    const v2Count = v2[deviceId] || 0;

    if (v1Count > v2Count) {
      hasHigher = true; // Found at least one higher counter
    }

    if (v1Count < v2Count) {
      return false; // Found a lower counter - not strictly greater
    }
  }

  return hasHigher;
}

// ============================================================================
// VECTOR OPERATIONS
// ============================================================================

/**
 * Merge two version vectors (take max of each device counter)
 *
 * Used after resolving conflicts to create a new vector that
 * includes all changes from both sides.
 *
 * @param v1 - First version vector
 * @param v2 - Second version vector
 * @returns Merged vector with max counters
 *
 * @example
 * mergeVersionVectors({A: 5, B: 2}, {A: 4, B: 3})
 * // Returns: {A: 5, B: 3}
 */
export function mergeVersionVectors(v1: VersionVector, v2: VersionVector): VersionVector {
  // Get union of all device IDs
  const allDeviceIds = new Set([...Object.keys(v1), ...Object.keys(v2)]);

  const merged: VersionVector = {};

  for (const deviceId of allDeviceIds) {
    // Take the maximum counter for each device
    merged[deviceId] = Math.max(v1[deviceId] || 0, v2[deviceId] || 0);
  }

  return merged;
}

/**
 * Increment the version counter for a specific device
 *
 * Used when a device makes a local edit - increments its own counter.
 *
 * @param vector - Current version vector
 * @param deviceId - ID of the device making the edit
 * @returns New vector with incremented counter
 *
 * @example
 * incrementVersion({A: 5, B: 2}, 'A')
 * // Returns: {A: 6, B: 2}
 *
 * incrementVersion({A: 5}, 'B')
 * // Returns: {A: 5, B: 1} (new device)
 */
export function incrementVersion(vector: VersionVector, deviceId: string): VersionVector {
  return {
    ...vector,
    [deviceId]: (vector[deviceId] || 0) + 1,
  };
}

/**
 * Create an empty version vector for a new quote
 *
 * @param deviceId - Initial device ID
 * @returns New vector with single device at version 1
 *
 * @example
 * createVersionVector('device-abc123')
 * // Returns: {device-abc123: 1}
 */
export function createVersionVector(deviceId: string): VersionVector {
  return {
    [deviceId]: 1,
  };
}

// ============================================================================
// DEBUGGING & UTILITIES
// ============================================================================

/**
 * Format version vector as human-readable string
 *
 * @param vector - Version vector to format
 * @returns Formatted string
 *
 * @example
 * formatVersionVector({A: 5, B: 3, C: 1})
 * // Returns: "A:5, B:3, C:1"
 */
export function formatVersionVector(vector: VersionVector): string {
  return Object.entries(vector)
    .map(([deviceId, count]) => {
      // Shorten device ID for readability (show first 8 chars)
      const shortId = deviceId.length > 8 ? deviceId.substring(0, 8) + '...' : deviceId;
      return `${shortId}:${count}`;
    })
    .join(', ');
}

/**
 * Get the total number of edits across all devices
 *
 * @param vector - Version vector
 * @returns Sum of all device counters
 *
 * @example
 * getTotalEdits({A: 5, B: 3, C: 1})
 * // Returns: 9
 */
export function getTotalEdits(vector: VersionVector): number {
  return Object.values(vector).reduce((sum, count) => sum + count, 0);
}

/**
 * Determine which device made the most recent edit
 *
 * Note: This assumes device counters represent chronological edits,
 * which is not always true in distributed systems. Use with caution.
 *
 * @param vector - Version vector
 * @returns Device ID with highest counter, or null if empty
 *
 * @example
 * getMostActiveDevice({A: 5, B: 3, C: 8})
 * // Returns: 'C'
 */
export function getMostActiveDevice(vector: VersionVector): string | null {
  if (Object.keys(vector).length === 0) {
    return null;
  }

  let maxDeviceId: string | null = null;
  let maxCount = -1;

  for (const [deviceId, count] of Object.entries(vector)) {
    if (count > maxCount) {
      maxCount = count;
      maxDeviceId = deviceId;
    }
  }

  return maxDeviceId;
}
