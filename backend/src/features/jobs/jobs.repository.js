/**
 * Jobs Repository
 *
 * Data access layer for jobs using Drizzle ORM
 * Handles all database operations for individual jobs
 */

import { db } from '../../shared/db/postgres.js';
import { jobs, quotes } from '../../shared/db/schema.js';
import { eq, and, asc, sql } from 'drizzle-orm';

// ============================================================================
// CREATE
// ============================================================================

/**
 * Create a new job for a quote
 * @param {Object} jobData - Job data
 * @param {string} jobData.quote_id - Quote ID
 * @param {string} jobData.job_type - Job type (retaining_wall, driveway, etc.)
 * @param {number} jobData.order_index - Position in job list
 * @param {Object} jobData.parameters - Job-specific parameters (JSONB)
 * @param {Array} jobData.materials - Materials array (JSONB[])
 * @param {Object} jobData.labour - Labour estimates (JSONB)
 * @param {Object} jobData.calculations - Calculation details (JSONB)
 * @param {string} jobData.subtotal - Job subtotal
 * @returns {Promise<Object>} Created job
 */
export async function createJob(jobData) {
  const [job] = await db.insert(jobs).values(jobData).returning();
  return job;
}

// ============================================================================
// READ
// ============================================================================

/**
 * Get all jobs for a quote
 * @param {string} quoteId - Quote ID
 * @returns {Promise<Array>} Array of jobs ordered by order_index
 */
export async function getJobsByQuoteId(quoteId) {
  return await db.select().from(jobs).where(eq(jobs.quote_id, quoteId)).orderBy(asc(jobs.order_index));
}

/**
 * Get a single job by ID
 * @param {string} jobId - Job ID
 * @returns {Promise<Object|null>} Job or null if not found
 */
export async function getJobById(jobId) {
  const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId));
  return job || null;
}

/**
 * Get job with quote details
 * @param {string} jobId - Job ID
 * @returns {Promise<Object|null>} Job with quote details
 */
export async function getJobWithQuote(jobId) {
  const result = await db
    .select({
      // Job fields
      id: jobs.id,
      quote_id: jobs.quote_id,
      job_type: jobs.job_type,
      order_index: jobs.order_index,
      parameters: jobs.parameters,
      materials: jobs.materials,
      labour: jobs.labour,
      calculations: jobs.calculations,
      subtotal: jobs.subtotal,
      // Quote fields
      quote_number: quotes.quote_number,
      quote_status: quotes.status,
      customer_name: quotes.customer_name,
    })
    .from(jobs)
    .leftJoin(quotes, eq(jobs.quote_id, quotes.id))
    .where(eq(jobs.id, jobId));

  return result[0] || null;
}

/**
 * Count jobs for a quote
 * @param {string} quoteId - Quote ID
 * @returns {Promise<number>} Job count
 */
export async function countJobsByQuoteId(quoteId) {
  const result = await db
    .select({ count: sql`count(*)::int` })
    .from(jobs)
    .where(eq(jobs.quote_id, quoteId));

  return result[0]?.count || 0;
}

/**
 * Get jobs by type for a quote
 * @param {string} quoteId - Quote ID
 * @param {string} jobType - Job type filter
 * @returns {Promise<Array>} Filtered jobs
 */
export async function getJobsByType(quoteId, jobType) {
  return await db
    .select()
    .from(jobs)
    .where(and(eq(jobs.quote_id, quoteId), eq(jobs.job_type, jobType)))
    .orderBy(asc(jobs.order_index));
}

// ============================================================================
// UPDATE
// ============================================================================

/**
 * Update a job
 * @param {string} jobId - Job ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated job
 */
export async function updateJob(jobId, updates) {
  const [updated] = await db.update(jobs).set(updates).where(eq(jobs.id, jobId)).returning();

  return updated;
}

/**
 * Update job order_index
 * @param {string} jobId - Job ID
 * @param {number} newOrderIndex - New order index
 * @returns {Promise<Object>} Updated job
 */
export async function updateJobOrder(jobId, newOrderIndex) {
  const [updated] = await db
    .update(jobs)
    .set({ order_index: newOrderIndex })
    .where(eq(jobs.id, jobId))
    .returning();

  return updated;
}

/**
 * Reorder jobs for a quote
 * @param {Array<{id: string, order_index: number}>} jobOrders - Array of job IDs with new order indices
 * @returns {Promise<Array>} Updated jobs
 */
export async function reorderJobs(jobOrders) {
  const updates = await Promise.all(
    jobOrders.map(({ id, order_index }) =>
      db.update(jobs).set({ order_index }).where(eq(jobs.id, id)).returning(),
    ),
  );

  return updates.map((result) => result[0]);
}

/**
 * Update job parameters
 * @param {string} jobId - Job ID
 * @param {Object} parameters - New parameters (JSONB)
 * @returns {Promise<Object>} Updated job
 */
export async function updateJobParameters(jobId, parameters) {
  const [updated] = await db.update(jobs).set({ parameters }).where(eq(jobs.id, jobId)).returning();

  return updated;
}

/**
 * Update job calculations (materials, labour, subtotal)
 * @param {string} jobId - Job ID
 * @param {Object} calculationData - Calculation data
 * @param {Array} calculationData.materials - Materials array
 * @param {Object} calculationData.labour - Labour object
 * @param {Object} calculationData.calculations - Calculations object
 * @param {string} calculationData.subtotal - Subtotal
 * @returns {Promise<Object>} Updated job
 */
export async function updateJobCalculations(jobId, calculationData) {
  const { materials, labour, calculations, subtotal } = calculationData;

  const [updated] = await db
    .update(jobs)
    .set({
      materials,
      labour,
      calculations,
      subtotal,
    })
    .where(eq(jobs.id, jobId))
    .returning();

  return updated;
}

// ============================================================================
// DELETE
// ============================================================================

/**
 * Delete a single job
 * @param {string} jobId - Job ID
 * @returns {Promise<Object>} Deleted job
 */
export async function deleteJob(jobId) {
  const [deleted] = await db.delete(jobs).where(eq(jobs.id, jobId)).returning();

  return deleted;
}

/**
 * Delete all jobs for a quote
 * @param {string} quoteId - Quote ID
 * @returns {Promise<number>} Number of deleted jobs
 */
export async function deleteJobsByQuoteId(quoteId) {
  const deleted = await db.delete(jobs).where(eq(jobs.quote_id, quoteId)).returning();

  return deleted.length;
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Check if job belongs to quote
 * @param {string} jobId - Job ID
 * @param {string} quoteId - Quote ID
 * @returns {Promise<boolean>} True if job belongs to quote
 */
export async function jobBelongsToQuote(jobId, quoteId) {
  const [job] = await db
    .select({ quote_id: jobs.quote_id })
    .from(jobs)
    .where(and(eq(jobs.id, jobId), eq(jobs.quote_id, quoteId)));

  return !!job;
}

/**
 * Check if quote exists
 * @param {string} quoteId - Quote ID
 * @returns {Promise<boolean>} True if quote exists
 */
export async function quoteExists(quoteId) {
  const [quote] = await db.select({ id: quotes.id }).from(quotes).where(eq(quotes.id, quoteId));

  return !!quote;
}
