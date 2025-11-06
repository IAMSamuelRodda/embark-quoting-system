/**
 * Conflict Detection Service
 *
 * Feature 5.3: Detect conflicts using version vectors
 *
 * Identifies concurrent edits between local and remote quotes
 * and categorizes conflicts by severity (critical vs non-critical)
 */

import type { Quote } from '../../shared/types/models';
import { detectConflict, formatVersionVector } from './versionVectors';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Conflict severity levels
 *
 * Critical: Requires manual resolution (customer info, financials, jobs)
 * NonCritical: Can be auto-merged (metadata, location)
 */
export enum ConflictSeverity {
  CRITICAL = 'critical',
  NON_CRITICAL = 'non-critical',
}

/**
 * Individual field conflict
 */
export interface ConflictField {
  path: string[]; // Field path (e.g., ["customer_email"] or ["jobs", "0", "parameters"])
  localValue: unknown;
  remoteValue: unknown;
  localTimestamp: Date;
  remoteTimestamp: Date;
  severity: ConflictSeverity;
}

/**
 * Conflict detection result
 */
export interface ConflictReport {
  hasConflict: boolean;
  conflictingFields: ConflictField[];
  autoMergedFields: AutoMergedField[];
  localVector: Record<string, number>;
  remoteVector: Record<string, number>;
}

/**
 * Auto-merged field (non-critical)
 */
export interface AutoMergedField {
  path: string[];
  mergedValue: unknown;
  strategy: 'last-writer-wins' | 'concatenate';
  chosen: 'local' | 'remote';
}

// ============================================================================
// FIELD CLASSIFICATION
// ============================================================================

/**
 * Critical fields that require manual resolution
 * Based on SPIKE findings (docs/spike-conflict-resolution-design.md Section 2.1)
 */
const CRITICAL_FIELDS = new Set([
  'customer_name',
  'customer_email',
  'customer_phone',
  'customer_address',
  'status',
  'jobs', // Array - any change requires review
  'financials', // Financial totals must be exact
]);

/**
 * Non-critical fields that can be auto-merged
 */
const AUTO_MERGE_FIELDS = new Set([
  'metadata',
  'location',
]);

/**
 * Determine if a field is critical
 */
export function isFieldCritical(fieldName: string): boolean {
  return CRITICAL_FIELDS.has(fieldName);
}

/**
 * Determine if a field can be auto-merged
 */
export function canAutoMergeField(fieldName: string): boolean {
  return AUTO_MERGE_FIELDS.has(fieldName);
}

// ============================================================================
// CONFLICT DETECTION
// ============================================================================

/**
 * Detect conflicts between local and remote quotes
 *
 * Returns:
 * - No conflict: If one version is strictly newer (can fast-forward)
 * - Conflict: If both have concurrent edits (requires resolution)
 *
 * @param localQuote - Local quote from IndexedDB
 * @param remoteQuote - Remote quote from server
 * @returns Conflict report with details
 */
export function detectQuoteConflict(localQuote: Quote, remoteQuote: Quote): ConflictReport {
  const localVector = localQuote.versionVector || {};
  const remoteVector = remoteQuote.versionVector || {};

  // Step 1: Check if version vectors indicate a conflict
  const hasVersionConflict = detectConflict(localVector, remoteVector);

  console.log(`[ConflictDetection] Comparing quotes:
    Local:  ${formatVersionVector(localVector)} (updated: ${localQuote.updated_at})
    Remote: ${formatVersionVector(remoteVector)} (updated: ${remoteQuote.updated_at})
    Conflict: ${hasVersionConflict ? 'YES' : 'NO'}`);

  // If no version conflict, return early
  if (!hasVersionConflict) {
    return {
      hasConflict: false,
      conflictingFields: [],
      autoMergedFields: [],
      localVector,
      remoteVector,
    };
  }

  // Step 2: Perform field-level diff
  const { conflictingFields, autoMergedFields } = compareQuoteFields(localQuote, remoteQuote);

  return {
    hasConflict: conflictingFields.length > 0 || autoMergedFields.length > 0,
    conflictingFields,
    autoMergedFields,
    localVector,
    remoteVector,
  };
}

/**
 * Compare quote fields and categorize differences
 *
 * @param localQuote - Local quote
 * @param remoteQuote - Remote quote
 * @returns Conflicting and auto-merged fields
 */
function compareQuoteFields(
  localQuote: Quote,
  remoteQuote: Quote,
): {
  conflictingFields: ConflictField[];
  autoMergedFields: AutoMergedField[];
} {
  const conflictingFields: ConflictField[] = [];
  const autoMergedFields: AutoMergedField[] = [];

  // Get all field names from both quotes
  const allFields = new Set([...Object.keys(localQuote), ...Object.keys(remoteQuote)]);

  for (const field of allFields) {
    // Skip system fields
    if (isSystemField(field)) {
      continue;
    }

    const localValue = (localQuote as Record<string, unknown>)[field];
    const remoteValue = (remoteQuote as Record<string, unknown>)[field];

    // Skip if values are identical
    if (JSON.stringify(localValue) === JSON.stringify(remoteValue)) {
      continue;
    }

    // Categorize field
    if (isFieldCritical(field)) {
      // Critical field - flag for manual resolution
      conflictingFields.push({
        path: [field],
        localValue,
        remoteValue,
        localTimestamp: localQuote.updated_at,
        remoteTimestamp: remoteQuote.updated_at,
        severity: ConflictSeverity.CRITICAL,
      });
    } else if (canAutoMergeField(field)) {
      // Non-critical field - auto-merge with Last-Writer-Wins
      const useLocal = localQuote.updated_at > remoteQuote.updated_at;

      autoMergedFields.push({
        path: [field],
        mergedValue: useLocal ? localValue : remoteValue,
        strategy: 'last-writer-wins',
        chosen: useLocal ? 'local' : 'remote',
      });
    }
  }

  return { conflictingFields, autoMergedFields };
}

/**
 * Check if a field is system-managed (should not be compared)
 */
function isSystemField(fieldName: string): boolean {
  const systemFields = new Set([
    'id',
    'quote_number',
    'created_at',
    'updated_at',
    'version',
    'versionVector',
    'sync_status',
    'last_synced_at',
    'device_id',
    'user_id',
  ]);

  return systemFields.has(fieldName);
}

// ============================================================================
// CONFLICT RESOLUTION HELPERS
// ============================================================================

/**
 * Check if a conflict report has critical conflicts
 * (requires manual resolution)
 */
export function hasCriticalConflicts(report: ConflictReport): boolean {
  return report.conflictingFields.some((field) => field.severity === ConflictSeverity.CRITICAL);
}

/**
 * Check if a conflict report can be auto-resolved
 * (only non-critical conflicts)
 */
export function canAutoResolve(report: ConflictReport): boolean {
  return report.hasConflict && !hasCriticalConflicts(report);
}

/**
 * Format conflict report for logging/debugging
 */
export function formatConflictReport(report: ConflictReport): string {
  const lines: string[] = [];

  lines.push('=== CONFLICT REPORT ===');
  lines.push(`Has Conflict: ${report.hasConflict ? 'YES' : 'NO'}`);
  lines.push(`Local Vector:  ${formatVersionVector(report.localVector)}`);
  lines.push(`Remote Vector: ${formatVersionVector(report.remoteVector)}`);

  if (report.conflictingFields.length > 0) {
    lines.push('\nCritical Conflicts (Manual Resolution Required):');
    report.conflictingFields.forEach((field) => {
      lines.push(`  - ${field.path.join('.')}`);
      lines.push(`    Local:  ${JSON.stringify(field.localValue)}`);
      lines.push(`    Remote: ${JSON.stringify(field.remoteValue)}`);
    });
  }

  if (report.autoMergedFields.length > 0) {
    lines.push('\nAuto-Merged Fields (Non-Critical):');
    report.autoMergedFields.forEach((field) => {
      lines.push(`  - ${field.path.join('.')}: ${field.strategy} (chose ${field.chosen})`);
    });
  }

  return lines.join('\n');
}

/**
 * Get summary statistics from conflict report
 */
export function getConflictStats(report: ConflictReport): {
  totalConflicts: number;
  criticalConflicts: number;
  autoMergedFields: number;
} {
  return {
    totalConflicts: report.conflictingFields.length + report.autoMergedFields.length,
    criticalConflicts: report.conflictingFields.length,
    autoMergedFields: report.autoMergedFields.length,
  };
}
