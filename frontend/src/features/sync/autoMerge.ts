/**
 * Auto-Merge Service
 *
 * Feature 5.4: Automatically merge non-critical conflicts
 *
 * Uses Last-Writer-Wins strategy for metadata and location fields.
 * Merges version vectors and increments local device counter after resolution.
 */

import type { Quote } from '../../shared/types/models';
import { getDeviceId } from '../../shared/db/indexedDb';
import {
  type ConflictReport,
  type AutoMergedField,
  detectQuoteConflict,
  canAutoResolve,
} from './conflictDetection';
import { mergeVersionVectors, incrementVersion } from './versionVectors';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Auto-merge result
 */
export interface AutoMergeResult {
  success: boolean;
  mergedQuote?: Quote;
  autoMergedFields: AutoMergedField[];
  error?: string;
}

// ============================================================================
// AUTO-MERGE
// ============================================================================

/**
 * Attempt to automatically merge two quote versions
 *
 * Returns success if:
 * - No conflicts exist (fast-forward merge)
 * - Only non-critical conflicts exist (auto-merge with Last-Writer-Wins)
 *
 * Returns failure if:
 * - Critical conflicts exist (requires manual resolution)
 *
 * @param localQuote - Local quote from IndexedDB
 * @param remoteQuote - Remote quote from server
 * @returns Auto-merge result with merged quote or error
 */
export function autoMergeQuotes(localQuote: Quote, remoteQuote: Quote): AutoMergeResult {
  // Step 1: Detect conflicts
  const conflictReport = detectQuoteConflict(localQuote, remoteQuote);

  // Step 2: Check if auto-merge is possible
  if (!canAutoResolve(conflictReport)) {
    if (!conflictReport.hasConflict) {
      // No conflict - determine which version to use
      return handleNoConflict(localQuote, remoteQuote);
    }

    // Has critical conflicts - cannot auto-merge
    return {
      success: false,
      autoMergedFields: [],
      error: `Cannot auto-merge: ${conflictReport.conflictingFields.length} critical conflicts require manual resolution`,
    };
  }

  // Step 3: Apply auto-merge for non-critical fields
  const mergedQuote = applyAutoMerge(localQuote, remoteQuote, conflictReport);

  console.log(
    `[AutoMerge] Successfully merged ${conflictReport.autoMergedFields.length} non-critical fields`,
  );

  return {
    success: true,
    mergedQuote,
    autoMergedFields: conflictReport.autoMergedFields,
  };
}

/**
 * Handle no-conflict scenario (fast-forward merge)
 *
 * Determines which version is newer and returns it
 */
function handleNoConflict(localQuote: Quote, remoteQuote: Quote): AutoMergeResult {
  // Use remote if it's strictly newer
  const useRemote = remoteQuote.updated_at > localQuote.updated_at;

  console.log(`[AutoMerge] No conflict detected, using ${useRemote ? 'remote' : 'local'} version`);

  return {
    success: true,
    mergedQuote: useRemote ? remoteQuote : localQuote,
    autoMergedFields: [],
  };
}

/**
 * Apply auto-merge for non-critical fields
 *
 * Uses Last-Writer-Wins strategy based on updated_at timestamp
 */
function applyAutoMerge(
  localQuote: Quote,
  remoteQuote: Quote,
  conflictReport: ConflictReport,
): Quote {
  const deviceId = getDeviceId();

  // Start with local quote as base
  const merged: Quote = { ...localQuote };

  // Apply auto-merged fields
  for (const field of conflictReport.autoMergedFields) {
    const fieldName = field.path[0]; // Top-level field
    (merged as unknown as Record<string, unknown>)[fieldName] = field.mergedValue;

    console.log(
      `[AutoMerge] Field '${fieldName}': ${field.strategy} (chose ${field.chosen} version)`,
    );
  }

  // Merge version vectors (take max of each device counter)
  const mergedVector = mergeVersionVectors(
    localQuote.versionVector || {},
    remoteQuote.versionVector || {},
  );

  // Increment local device counter (this device is resolving the conflict)
  const finalVector = incrementVersion(mergedVector, deviceId);

  // Update metadata
  merged.versionVector = finalVector;
  merged.version =
    (localQuote.version > remoteQuote.version ? localQuote.version : remoteQuote.version) + 1;
  merged.updated_at = new Date();

  return merged;
}

// ============================================================================
// BATCH AUTO-MERGE
// ============================================================================

/**
 * Auto-merge multiple quote pairs in batch
 *
 * Useful when syncing multiple quotes at once
 *
 * @param quotePairs - Array of [local, remote] quote pairs
 * @returns Results for each pair
 */
export function autoMergeBatch(
  quotePairs: Array<[Quote, Quote]>,
): Array<AutoMergeResult & { quoteId: string }> {
  return quotePairs.map(([local, remote]) => {
    const result = autoMergeQuotes(local, remote);
    return {
      ...result,
      quoteId: local.id,
    };
  });
}

/**
 * Get summary statistics from batch auto-merge
 */
export function getBatchMergeStats(results: Array<AutoMergeResult & { quoteId: string }>): {
  totalQuotes: number;
  successfulMerges: number;
  failedMerges: number;
  totalAutoMergedFields: number;
} {
  return {
    totalQuotes: results.length,
    successfulMerges: results.filter((r) => r.success).length,
    failedMerges: results.filter((r) => !r.success).length,
    totalAutoMergedFields: results.reduce((sum, r) => sum + r.autoMergedFields.length, 0),
  };
}
