/**
 * Job Database Operations
 *
 * Data access layer for jobs in IndexedDB
 * Provides CRUD operations and sync management
 *
 * Pattern: Offline-first (same as quotesDb.ts)
 * - Save to IndexedDB immediately
 * - Queue for sync to backend
 * - Handle sync status tracking
 */

import { db, getDeviceId } from '../../shared/db/indexedDb';
import { SyncStatus, SyncOperation, type Job } from '../../shared/types/models';

// ============================================================================
// CRUD OPERATIONS
// ============================================================================

/**
 * Create a new job
 * @param data - Partial job data
 * @param quoteId - Quote ID this job belongs to
 * @returns Created job
 */
export async function createJob(data: Partial<Job>, quoteId: string): Promise<Job> {
  const deviceId = getDeviceId();

  const job: Job = {
    id: crypto.randomUUID(),
    quote_id: quoteId,
    job_type: data.job_type!,
    order_index: data.order_index ?? (await getNextOrderIndex(quoteId)),
    parameters: data.parameters || {},
    materials: data.materials,
    labour: data.labour,
    calculations: data.calculations || {},
    subtotal: data.subtotal ?? 0,
    created_at: new Date(),
    updated_at: new Date(),
    sync_status: SyncStatus.PENDING,
    device_id: deviceId,
  };

  // Save to IndexedDB
  await db.jobs.add(job);

  // Add to sync queue with NORMAL priority
  await db.syncQueue.add({
    id: crypto.randomUUID(),
    quote_id: quoteId,
    operation: SyncOperation.CREATE,
    data: job,
    priority: 3, // SyncPriority.NORMAL
    timestamp: new Date(),
    retry_count: 0,
    dead_letter: false,
  });

  console.log(`[jobsDb] Created job ${job.id} for quote ${quoteId} (offline-first)`);

  return job;
}

/**
 * Get next order index for a quote
 */
async function getNextOrderIndex(quoteId: string): Promise<number> {
  const existingJobs = await db.jobs.where('quote_id').equals(quoteId).toArray();
  return existingJobs.length;
}

/**
 * Get job by ID
 */
export async function getJobById(id: string): Promise<Job | undefined> {
  return await db.jobs.get(id);
}

/**
 * Get all jobs for a quote
 * @param quoteId - Quote ID
 * @returns Jobs sorted by order_index
 */
export async function getJobsByQuoteId(quoteId: string): Promise<Job[]> {
  return await db.jobs.where('quote_id').equals(quoteId).sortBy('order_index');
}

/**
 * Update an existing job
 * @param jobId - Job ID
 * @param updates - Partial updates
 */
export async function updateJob(jobId: string, updates: Partial<Job>): Promise<void> {
  const job = await db.jobs.get(jobId);
  if (!job) throw new Error(`Job ${jobId} not found`);

  // Update in IndexedDB
  await db.jobs.update(jobId, {
    ...updates,
    updated_at: new Date(),
    sync_status: SyncStatus.PENDING,
  });

  // Add to sync queue
  await db.syncQueue.add({
    id: crypto.randomUUID(),
    quote_id: job.quote_id,
    operation: SyncOperation.UPDATE,
    data: { ...updates, id: jobId },
    priority: 3, // SyncPriority.NORMAL
    timestamp: new Date(),
    retry_count: 0,
    dead_letter: false,
  });

  console.log(`[jobsDb] Updated job ${jobId} (offline-first)`);
}

/**
 * Delete a job
 * @param jobId - Job ID
 */
export async function deleteJob(jobId: string): Promise<void> {
  const job = await db.jobs.get(jobId);
  if (!job) return;

  // Delete from IndexedDB
  await db.jobs.delete(jobId);

  // Add to sync queue with HIGH priority (deletions are important)
  await db.syncQueue.add({
    id: crypto.randomUUID(),
    quote_id: job.quote_id,
    operation: SyncOperation.DELETE,
    data: { id: jobId },
    priority: 2, // SyncPriority.HIGH
    timestamp: new Date(),
    retry_count: 0,
    dead_letter: false,
  });

  console.log(`[jobsDb] Deleted job ${jobId} (offline-first)`);
}

/**
 * Reorder jobs for a quote
 * @param quoteId - Quote ID
 * @param jobOrders - Array of {id, order_index}
 */
export async function reorderJobs(
  quoteId: string,
  jobOrders: { id: string; order_index: number }[],
): Promise<void> {
  // Update all jobs in IndexedDB
  await Promise.all(
    jobOrders.map((jobOrder) =>
      db.jobs.update(jobOrder.id, {
        order_index: jobOrder.order_index,
        updated_at: new Date(),
        sync_status: SyncStatus.PENDING,
      }),
    ),
  );

  // Add to sync queue
  await db.syncQueue.add({
    id: crypto.randomUUID(),
    quote_id: quoteId,
    operation: SyncOperation.UPDATE,
    data: { reorder: jobOrders } as any, // Type assertion for custom reorder payload
    priority: 3, // SyncPriority.NORMAL
    timestamp: new Date(),
    retry_count: 0,
    dead_letter: false,
  });

  console.log(`[jobsDb] Reordered ${jobOrders.length} jobs for quote ${quoteId}`);
}

// ============================================================================
// SYNC OPERATIONS
// ============================================================================

/**
 * Mark job as synced
 * @param jobId - Job ID
 */
export async function markJobAsSynced(jobId: string): Promise<void> {
  await db.jobs.update(jobId, {
    sync_status: SyncStatus.SYNCED,
    last_synced_at: new Date(),
  });
}

/**
 * Mark job as sync error
 * @param jobId - Job ID
 * @param errorMessage - Error message
 */
export async function markJobAsSyncError(jobId: string, _errorMessage: string): Promise<void> {
  await db.jobs.update(jobId, {
    sync_status: SyncStatus.ERROR,
  });
}

/**
 * Get jobs that need syncing
 * @param quoteId - Optional: filter by quote ID
 * @returns Jobs with pending or error sync status
 */
export async function getJobsNeedingSync(quoteId?: string): Promise<Job[]> {
  let query = db.jobs.where('sync_status').equals(SyncStatus.PENDING);

  if (quoteId) {
    const allJobs = await query.toArray();
    return allJobs.filter((job) => job.quote_id === quoteId);
  }

  return await query.toArray();
}
