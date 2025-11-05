/**
 * Sync Service
 *
 * Orchestrates synchronization between local IndexedDB and remote API
 * Handles push (local → remote) and pull (remote → local) operations
 *
 * Feature 2.6: Basic Sync (Online Only)
 * - No conflict resolution (happy path only)
 * - Manual resolution will be added in Epic 5
 */

import { db } from '../../shared/db/indexedDb';
import { api, ApiError } from '../../shared/api/apiClient';
import { connectionMonitor } from '../../shared/utils/connection';
import { SyncOperation, SyncStatus } from '../../shared/types/models';
import { markQuoteAsSynced, markQuoteAsSyncError } from '../quotes/quotesDb';

export interface SyncResult {
  success: boolean;
  pushedCount: number;
  pulledCount: number;
  errors: string[];
}

/**
 * Maximum retry attempts for failed syncs
 */
const MAX_RETRY_COUNT = 3;

/**
 * Push local changes to remote API
 * Processes the sync queue in order
 */
export async function pushChanges(): Promise<{
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

  // Get sync queue items (ordered by timestamp)
  const queueItems = await db.syncQueue.orderBy('timestamp').toArray();

  const errors: string[] = [];
  let successCount = 0;

  // Process each queue item
  for (const item of queueItems) {
    try {
      // Skip if exceeded retry count
      if (item.retry_count >= MAX_RETRY_COUNT) {
        errors.push(`Quote ${item.quote_id}: Max retry count exceeded (${MAX_RETRY_COUNT})`);
        continue;
      }

      // Execute operation based on type
      switch (item.operation) {
        case SyncOperation.CREATE:
          await api.quotes.create(item.data);
          break;

        case SyncOperation.UPDATE:
          await api.quotes.update(item.quote_id, item.data);
          break;

        case SyncOperation.DELETE:
          await api.quotes.delete(item.quote_id);
          break;

        default:
          throw new Error(`Unknown operation: ${item.operation}`);
      }

      // Mark as synced and remove from queue
      await markQuoteAsSynced(item.quote_id);
      successCount++;
    } catch (error) {
      console.error(`Sync error for quote ${item.quote_id}:`, error);

      // Handle errors
      let errorMessage = 'Unknown error';
      if (error instanceof ApiError) {
        errorMessage = error.response?.message || error.statusText;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      errors.push(`Quote ${item.quote_id}: ${errorMessage}`);

      // Mark as error and increment retry count
      await markQuoteAsSyncError(item.quote_id, errorMessage);
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
 * For Feature 2.6: Simple pull without conflict detection
 */
export async function pullChanges(): Promise<{
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

  const errors: string[] = [];
  let updatedCount = 0;

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
          // Only update if local is synced (no pending changes)
          // For Feature 2.6: Skip if local has pending changes (avoid conflicts)
          if (remoteQuote.version > localQuote.version) {
            await db.quotes.update(remoteQuote.id, {
              ...remoteQuote,
              sync_status: SyncStatus.SYNCED,
              last_synced_at: new Date(),
            });
            updatedCount++;
          }
        }
        // If local has pending changes, skip to avoid conflicts
        // Conflict resolution will be added in Epic 5
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
      errors,
    };
  } catch (error) {
    console.error('Pull changes error:', error);

    let errorMessage = 'Failed to pull changes from server';
    if (error instanceof ApiError) {
      errorMessage = error.response?.message || error.statusText;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }

    return {
      success: false,
      count: 0,
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
