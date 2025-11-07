/**
 * Sync Service
 *
 * Orchestrates synchronization between local IndexedDB and remote API
 * Handles push (local → remote) and pull (remote → local) operations
 *
 * Feature 5.1: Enhanced Sync with Priority Queue and Exponential Backoff
 * - Priority-based queue (critical > high > normal > low)
 * - Exponential backoff retry logic (1s, 2s, 4s, 8s, 30s, 60s)
 * - Dead-letter queue for failed items
 */

import { db } from '../../shared/db/indexedDb';
import { api, ApiError } from '../../shared/api/apiClient';
import { connectionMonitor } from '../../shared/utils/connection';
import { SyncOperation, SyncStatus } from '../../shared/types/models';
import type { Quote } from '../../shared/types/models';
import { markQuoteAsSynced, markQuoteAsSyncError } from '../quotes/quotesDb';
import * as syncQueue from './syncQueue';
import { detectQuoteConflict, hasCriticalConflicts, canAutoResolve } from './conflictDetection';
import { autoMergeQuotes } from './autoMerge';

// Type guard for API error response
interface ApiErrorResponse {
  message?: string;
  error?: string;
}

function isApiErrorResponse(response: unknown): response is ApiErrorResponse {
  return (
    typeof response === 'object' &&
    response !== null &&
    ('message' in response || 'error' in response)
  );
}

export interface SyncResult {
  success: boolean;
  pushedCount: number;
  pulledCount: number;
  conflictsDetected: number; // Feature 5.3: Track conflicts
  errors: string[];
}

/**
 * Push local changes to remote API using priority queue with exponential backoff
 * Processes items in priority order (critical > high > normal > low)
 */
export async function pushChanges(batchSize: number = 10): Promise<{
  success: boolean;
  count: number;
  errors: string[];
}> {
  // Check if online
  if (!connectionMonitor.isOnline()) {
    return {
      success: false,
      count: 0,
      errors: ['Device is offline'],
    };
  }

  // Get next batch of items ready for sync (priority-ordered, past retry time)
  const queueItems = await syncQueue.getNextBatch(batchSize);

  if (queueItems.length === 0) {
    return {
      success: true,
      count: 0,
      errors: [],
    };
  }

  const errors: string[] = [];
  let successCount = 0;

  console.log(`[SyncService] Processing ${queueItems.length} items from queue`);

  // Process each queue item
  for (const item of queueItems) {
    try {
      // Execute operation based on type
      switch (item.operation) {
        case SyncOperation.CREATE:
          await api.quotes.create(item.data as Partial<Quote>);
          break;

        case SyncOperation.UPDATE:
          await api.quotes.update(item.quote_id, item.data as Partial<Quote>);
          break;

        case SyncOperation.DELETE:
          await api.quotes.delete(item.quote_id);
          break;

        default:
          throw new Error(`Unknown operation: ${item.operation}`);
      }

      // Mark as synced and remove from queue
      await syncQueue.markSynced(item.id);
      await markQuoteAsSynced(item.quote_id);
      successCount++;
    } catch (error) {
      console.error(`Sync error for quote ${item.quote_id}:`, error);

      // Handle errors
      let errorMessage = 'Unknown error';
      if (error instanceof ApiError) {
        if (isApiErrorResponse(error.response)) {
          errorMessage = error.response.message || error.response.error || error.statusText;
        } else {
          errorMessage = error.statusText;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      errors.push(`Quote ${item.quote_id}: ${errorMessage}`);

      // Mark as failed with exponential backoff
      await syncQueue.markFailed(item.id, errorMessage);
      await markQuoteAsSyncError(item.quote_id, errorMessage);

      // Auto-prioritize items that keep failing
      await syncQueue.autoPrioritize(item.id);
    }
  }

  return {
    success: errors.length === 0,
    count: successCount,
    errors,
  };
}

/**
 * Pull remote changes from API and update local storage
 * Feature 5.3: With conflict detection using version vectors
 */
export async function pullChanges(): Promise<{
  success: boolean;
  count: number;
  conflictsDetected: number;
  errors: string[];
}> {
  // Check if online
  if (!connectionMonitor.isOnline()) {
    return {
      success: false,
      count: 0,
      conflictsDetected: 0,
      errors: ['Device is offline'],
    };
  }

  const errors: string[] = [];
  let updatedCount = 0;
  let conflictsDetected = 0;

  try {
    // Fetch all quotes from API
    const response = await api.quotes.getAll();

    if (!response.success || !response.data) {
      throw new Error('Failed to fetch quotes from server');
    }

    const remoteQuotes = response.data;

    // Update local storage with remote data
    for (const remoteQuote of remoteQuotes) {
      try {
        // Get local version
        const localQuote = await db.quotes.get(remoteQuote.id);

        if (!localQuote) {
          // New quote from server - add to local storage
          await db.quotes.add({
            ...remoteQuote,
            sync_status: SyncStatus.SYNCED,
            last_synced_at: new Date(),
          });
          updatedCount++;
        } else if (localQuote.sync_status === SyncStatus.SYNCED) {
          // Local has no pending changes - safe to update
          await db.quotes.update(remoteQuote.id, {
            ...remoteQuote,
            sync_status: SyncStatus.SYNCED,
            last_synced_at: new Date(),
          });
          updatedCount++;
        } else {
          // Local has pending changes - check for conflicts using version vectors
          const conflictReport = detectQuoteConflict(localQuote, remoteQuote);

          if (!conflictReport.hasConflict) {
            // No conflict - remote is strictly newer, can fast-forward
            await db.quotes.update(remoteQuote.id, {
              ...remoteQuote,
              sync_status: SyncStatus.SYNCED,
              last_synced_at: new Date(),
            });
            updatedCount++;
          } else if (canAutoResolve(conflictReport)) {
            // Non-critical conflicts only - can auto-merge
            console.log(`[Sync] Auto-mergeable conflict detected for quote ${remoteQuote.id}`);

            // Apply auto-merge
            const mergeResult = autoMergeQuotes(localQuote, remoteQuote);

            if (mergeResult.success && mergeResult.mergedQuote) {
              // Save merged quote to local storage
              await db.quotes.update(remoteQuote.id, {
                ...mergeResult.mergedQuote,
                sync_status: SyncStatus.SYNCED,
                last_synced_at: new Date(),
              });
              updatedCount++;

              console.log(
                `[Sync] Auto-merged ${mergeResult.autoMergedFields.length} fields for quote ${remoteQuote.id}`,
              );
            } else {
              // Auto-merge failed (shouldn't happen if canAutoResolve returned true)
              console.error(
                `[Sync] Auto-merge failed for quote ${remoteQuote.id}: ${mergeResult.error}`,
              );
              conflictsDetected++;
            }
          } else if (hasCriticalConflicts(conflictReport)) {
            // Critical conflicts - requires manual resolution
            console.log(`[Sync] Critical conflict detected for quote ${remoteQuote.id}`);
            conflictsDetected++;
            // Mark quote as having conflict for user to resolve
            await db.quotes.update(remoteQuote.id, {
              sync_status: SyncStatus.CONFLICT,
              last_synced_at: new Date(),
            });
            // TODO: Feature 5.5 - Show conflict resolution UI
          }
        }
      } catch (error) {
        console.error(`Error updating quote ${remoteQuote.id}:`, error);
        errors.push(
          `Quote ${remoteQuote.id}: ${error instanceof Error ? error.message : 'Update failed'}`,
        );
      }
    }

    return {
      success: errors.length === 0,
      count: updatedCount,
      conflictsDetected,
      errors,
    };
  } catch (error) {
    console.error('Pull changes error:', error);

    let errorMessage = 'Failed to pull changes from server';
    if (error instanceof ApiError) {
      if (isApiErrorResponse(error.response)) {
        errorMessage = error.response.message || error.response.error || error.statusText;
      } else {
        errorMessage = error.statusText;
      }
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return {
      success: false,
      count: 0,
      conflictsDetected: 0,
      errors: [errorMessage],
    };
  }
}

/**
 * Full sync: push then pull
 * This is the main sync operation called by the app
 */
export async function syncAll(): Promise<SyncResult> {
  console.log('Starting full sync...');

  // Push local changes first
  const pushResult = await pushChanges();
  console.log('Push complete:', pushResult);

  // Then pull remote changes
  const pullResult = await pullChanges();
  console.log('Pull complete:', pullResult);

  return {
    success: pushResult.success && pullResult.success,
    pushedCount: pushResult.count,
    pulledCount: pullResult.count,
    conflictsDetected: pullResult.conflictsDetected,
    errors: [...pushResult.errors, ...pullResult.errors],
  };
}

/**
 * Auto-sync when connection restored
 * Call this once at app startup to enable auto-sync
 */
export function enableAutoSync(): () => void {
  let syncInProgress = false;

  const unsubscribe = connectionMonitor.subscribe(async (state) => {
    // Only sync when coming back online
    if (state.isOnline && !syncInProgress) {
      // Check if there are pending changes
      const queueSize = await db.getSyncQueueSize();
      if (queueSize > 0) {
        console.log(`Connection restored. Auto-syncing ${queueSize} pending changes...`);
        syncInProgress = true;

        try {
          await syncAll();
        } catch (error) {
          console.error('Auto-sync failed:', error);
        } finally {
          syncInProgress = false;
        }
      }
    }
  });

  return unsubscribe;
}
