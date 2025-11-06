/**
 * Sync Queue Manager
 *
 * Feature 5.1: Priority-based queue with exponential backoff
 *
 * Features:
 * - Priority system: critical > high > normal > low
 * - Exponential backoff: 1s, 2s, 4s, 8s, 30s, 60s
 * - Dead-letter queue after 6 failed attempts
 * - Automatic retry scheduling
 */

import { db } from '../../shared/db/indexedDb';
import { SyncOperation, type Quote, type Job, type Financial } from '../../shared/types/models';

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

/**
 * Sync priority levels
 * Lower number = higher priority
 */
export enum SyncPriority {
  CRITICAL = 1, // User-initiated sync, quote status changes
  HIGH = 2, // Customer info updates, financials
  NORMAL = 3, // Job additions/edits
  LOW = 4, // Metadata updates, notes
}

/**
 * Enhanced sync queue item with priority and backoff
 */
export interface EnhancedSyncQueueItem {
  id: string;
  quote_id: string;
  operation: SyncOperation;
  data: Partial<Quote | Job | Financial>;
  priority: SyncPriority;
  timestamp: Date;
  retry_count: number;
  next_retry_at?: Date;
  last_error?: string;
  dead_letter: boolean; // True if exceeded max retries
}

/**
 * Dead-letter queue item (failed after max retries)
 */
export interface DeadLetterQueueItem extends EnhancedSyncQueueItem {
  dead_letter: true;
  failed_at: Date;
  failure_reason: string;
}

/**
 * Maximum retry attempts before moving to dead-letter queue
 */
const MAX_RETRY_COUNT = 6;

/**
 * Exponential backoff delays (in milliseconds)
 * Attempt 1: 1s
 * Attempt 2: 2s
 * Attempt 3: 4s
 * Attempt 4: 8s
 * Attempt 5: 30s
 * Attempt 6: 60s
 */
const BACKOFF_DELAYS = [1000, 2000, 4000, 8000, 30000, 60000];

// ============================================================================
// QUEUE OPERATIONS
// ============================================================================

/**
 * Add item to sync queue with priority
 */
export async function enqueue(
  quoteId: string,
  operation: SyncOperation,
  data: Partial<Quote | Job | Financial>,
  priority: SyncPriority = SyncPriority.NORMAL,
): Promise<string> {
  const item: EnhancedSyncQueueItem = {
    id: crypto.randomUUID(),
    quote_id: quoteId,
    operation,
    data,
    priority,
    timestamp: new Date(),
    retry_count: 0,
    dead_letter: false,
  };

  // Add to IndexedDB sync queue
  await db.syncQueue.add(item);

  console.log(`[SyncQueue] Enqueued ${operation} for quote ${quoteId} with priority ${priority}`);

  return item.id;
}

/**
 * Get next batch of items to sync (ordered by priority, then timestamp)
 * Returns items that are:
 * - Not in dead-letter queue
 * - Past their next_retry_at time (or have no next_retry_at)
 */
export async function getNextBatch(batchSize: number = 10): Promise<EnhancedSyncQueueItem[]> {
  const now = new Date();

  // Get all active queue items
  const allItems = await db.syncQueue.where('dead_letter').equals(0).toArray();

  // Filter items ready for retry
  const readyItems = allItems.filter((item) => {
    // If no next_retry_at, it's ready
    if (!item.next_retry_at) return true;

    // Check if retry time has passed
    return new Date(item.next_retry_at) <= now;
  });

  // Sort by priority (lower = higher priority), then by timestamp (older first)
  const sortedItems = readyItems.sort((a, b) => {
    if (a.priority !== b.priority) {
      return a.priority - b.priority; // Lower priority number = higher priority
    }
    return a.timestamp.getTime() - b.timestamp.getTime(); // Older first
  });

  // Return batch
  return sortedItems.slice(0, batchSize);
}

/**
 * Mark item as successfully synced and remove from queue
 */
export async function markSynced(itemId: string): Promise<void> {
  await db.syncQueue.delete(itemId);
  console.log(`[SyncQueue] Item ${itemId} successfully synced and removed from queue`);
}

/**
 * Mark item as failed and schedule retry with exponential backoff
 * Moves to dead-letter queue if max retries exceeded
 */
export async function markFailed(itemId: string, error: string): Promise<void> {
  const item = await db.syncQueue.get(itemId);

  if (!item) {
    console.error(`[SyncQueue] Item ${itemId} not found in queue`);
    return;
  }

  const newRetryCount = item.retry_count + 1;

  // Check if exceeded max retries
  if (newRetryCount > MAX_RETRY_COUNT) {
    // Move to dead-letter queue
    const deadLetterItem: DeadLetterQueueItem = {
      ...item,
      retry_count: newRetryCount,
      dead_letter: true,
      failed_at: new Date(),
      failure_reason: error,
      last_error: error,
    };

    await db.syncQueue.update(itemId, deadLetterItem);

    console.error(
      `[SyncQueue] Item ${itemId} moved to dead-letter queue after ${newRetryCount} failed attempts: ${error}`,
    );

    return;
  }

  // Calculate next retry time with exponential backoff
  const delayMs = BACKOFF_DELAYS[newRetryCount - 1] || BACKOFF_DELAYS[BACKOFF_DELAYS.length - 1];
  const nextRetryAt = new Date(Date.now() + delayMs);

  // Update item
  await db.syncQueue.update(itemId, {
    retry_count: newRetryCount,
    next_retry_at: nextRetryAt,
    last_error: error,
  });

  console.warn(
    `[SyncQueue] Item ${itemId} failed (attempt ${newRetryCount}/${MAX_RETRY_COUNT}). Next retry at ${nextRetryAt.toLocaleTimeString()}. Error: ${error}`,
  );
}

/**
 * Get all items in dead-letter queue
 */
export async function getDeadLetterQueue(): Promise<DeadLetterQueueItem[]> {
  const items = await db.syncQueue.where('dead_letter').equals(1).toArray();
  return items as DeadLetterQueueItem[];
}

/**
 * Retry a dead-letter queue item (reset retry count and priority)
 */
export async function retryDeadLetterItem(
  itemId: string,
  newPriority: SyncPriority = SyncPriority.CRITICAL,
): Promise<void> {
  const item = await db.syncQueue.get(itemId);

  if (!item || !item.dead_letter) {
    console.error(`[SyncQueue] Item ${itemId} not found in dead-letter queue`);
    return;
  }

  // Reset item to active queue with critical priority
  await db.syncQueue.update(itemId, {
    dead_letter: false,
    retry_count: 0,
    next_retry_at: undefined,
    priority: newPriority,
    timestamp: new Date(), // Reset timestamp for immediate processing
  });

  console.log(
    `[SyncQueue] Item ${itemId} removed from dead-letter queue and re-queued with priority ${newPriority}`,
  );
}

/**
 * Remove item from dead-letter queue permanently
 */
export async function removeDeadLetterItem(itemId: string): Promise<void> {
  await db.syncQueue.delete(itemId);
  console.log(`[SyncQueue] Item ${itemId} permanently removed from dead-letter queue`);
}

/**
 * Get queue statistics
 */
export async function getQueueStats(): Promise<{
  total: number;
  active: number;
  deadLetter: number;
  byPriority: Record<SyncPriority, number>;
  oldestPendingItem?: Date;
}> {
  const allItems = await db.syncQueue.toArray();
  const activeItems = allItems.filter((item) => !item.dead_letter);
  const deadLetterItems = allItems.filter((item) => item.dead_letter);

  // Count by priority
  const byPriority: Record<SyncPriority, number> = {
    [SyncPriority.CRITICAL]: 0,
    [SyncPriority.HIGH]: 0,
    [SyncPriority.NORMAL]: 0,
    [SyncPriority.LOW]: 0,
  };

  activeItems.forEach((item) => {
    byPriority[item.priority] = (byPriority[item.priority] || 0) + 1;
  });

  // Find oldest pending item
  const oldestItem = activeItems.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())[0];

  return {
    total: allItems.length,
    active: activeItems.length,
    deadLetter: deadLetterItems.length,
    byPriority,
    oldestPendingItem: oldestItem?.timestamp,
  };
}

/**
 * Clear all dead-letter queue items
 * CAUTION: This permanently deletes failed sync attempts
 */
export async function clearDeadLetterQueue(): Promise<number> {
  const deadLetterItems = await getDeadLetterQueue();
  const count = deadLetterItems.length;

  for (const item of deadLetterItems) {
    await db.syncQueue.delete(item.id);
  }

  console.warn(`[SyncQueue] Cleared ${count} items from dead-letter queue`);

  return count;
}

// ============================================================================
// PRIORITY HELPERS
// ============================================================================

/**
 * Determine sync priority based on operation type and data
 */
export function determinePriority(
  operation: SyncOperation,
  data: Partial<Quote | Job | Financial>,
): SyncPriority {
  // DELETE operations are always high priority
  if (operation === SyncOperation.DELETE) {
    return SyncPriority.HIGH;
  }

  // Check if quote data
  if ('status' in data || 'customer_email' in data || 'customer_phone' in data) {
    // Critical customer info or status changes
    if (data.status || data.customer_email || data.customer_phone) {
      return SyncPriority.CRITICAL;
    }
  }

  // Check if financial data
  if ('total_inc_gst' in data || 'deposit' in data) {
    return SyncPriority.HIGH;
  }

  // Check if job data
  if ('job_type' in data || 'parameters' in data) {
    return SyncPriority.NORMAL;
  }

  // Default to normal priority
  return SyncPriority.NORMAL;
}

/**
 * Auto-prioritize an existing queue item based on retry count
 * Items that keep failing get higher priority (user may have fixed connectivity)
 */
export async function autoPrioritize(itemId: string): Promise<void> {
  const item = await db.syncQueue.get(itemId);

  if (!item || item.dead_letter) {
    return;
  }

  // After 3 retries, bump to high priority
  if (item.retry_count >= 3 && item.priority > SyncPriority.HIGH) {
    await db.syncQueue.update(itemId, {
      priority: SyncPriority.HIGH,
    });
    console.log(
      `[SyncQueue] Auto-promoted item ${itemId} to HIGH priority after ${item.retry_count} retries`,
    );
  }
}
