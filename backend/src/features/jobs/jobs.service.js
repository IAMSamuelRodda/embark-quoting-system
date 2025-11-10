/**
 * Jobs Service
 *
 * Business logic layer for jobs
 * Handles validation, job ordering, and business rules
 */

import * as repository from './jobs.repository.js';
import * as quoteRepository from '../quotes/quotes.repository.js';
import { z } from 'zod';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const jobTypeEnum = z.enum(['retaining_wall', 'driveway', 'trenching', 'stormwater', 'site_prep']);

// Base job schema
const createJobSchema = z.object({
  quote_id: z.string().uuid('Invalid quote ID'),
  job_type: jobTypeEnum,
  order_index: z.number().int().nonnegative().optional(), // Auto-calculated if not provided
  parameters: z.record(z.string(), z.unknown()).default({}),
  materials: z.array(z.record(z.string(), z.unknown())).default([]),
  labour: z.record(z.string(), z.unknown()).default({}),
  calculations: z.record(z.string(), z.unknown()).default({}),
  subtotal: z.string().default('0.00'), // Stored as string (Postgres decimal)
});

const updateJobSchema = z.object({
  job_type: jobTypeEnum.optional(),
  order_index: z.number().int().nonnegative().optional(),
  parameters: z.record(z.string(), z.unknown()).optional(),
  materials: z.array(z.record(z.string(), z.unknown())).optional(),
  labour: z.record(z.string(), z.unknown()).optional(),
  calculations: z.record(z.string(), z.unknown()).optional(),
  subtotal: z.string().optional(),
});

const reorderJobsSchema = z.array(
  z.object({
    id: z.string().uuid(),
    order_index: z.number().int().nonnegative(),
  }),
);

// ============================================================================
// BUSINESS LOGIC
// ============================================================================

/**
 * Create a new job for a quote
 * @param {Object} jobData - Job data
 * @param {string} userId - User ID creating the job
 * @param {boolean} isAdmin - Whether user is admin
 * @returns {Promise<Object>} Created job
 */
export async function createJob(jobData, userId, isAdmin) {
  // Debug: log the incoming data
  console.log('createJob called with jobData:', JSON.stringify(jobData, null, 2));

  // Validate input
  const result = createJobSchema.safeParse(jobData);

  if (!result.success) {
    console.error('Zod validation failed:', result.error);
    throw result.error;
  }

  const validated = result.data;

  // Check quote exists and user has permission
  const quote = await quoteRepository.getQuoteById(validated.quote_id);

  if (!quote) {
    throw new Error('NOT_FOUND: Quote not found');
  }

  // Authorization: Only owner or admin can add jobs
  if (!isAdmin && quote.user_id !== userId) {
    throw new Error('FORBIDDEN: You do not have permission to add jobs to this quote');
  }

  // Auto-calculate order_index if not provided
  if (validated.order_index === undefined) {
    const jobCount = await repository.countJobsByQuoteId(validated.quote_id);
    validated.order_index = jobCount; // Start at 0, next is 1, etc.
  }

  // Create job
  const newJob = await repository.createJob(validated);

  return newJob;
}

/**
 * Get all jobs for a quote with authorization
 * @param {string} quoteId - Quote ID
 * @param {string} userId - User ID requesting the jobs
 * @param {boolean} isAdmin - Whether user is admin
 * @returns {Promise<Array>} Array of jobs
 */
export async function getJobsByQuoteId(quoteId, userId, isAdmin) {
  // Check quote exists and user has permission
  const quote = await quoteRepository.getQuoteById(quoteId);

  if (!quote) {
    throw new Error('NOT_FOUND: Quote not found');
  }

  // Authorization: Only owner or admin can view jobs
  if (!isAdmin && quote.user_id !== userId) {
    throw new Error('FORBIDDEN: You do not have permission to view jobs for this quote');
  }

  return await repository.getJobsByQuoteId(quoteId);
}

/**
 * Get a single job by ID with authorization
 * @param {string} jobId - Job ID
 * @param {string} userId - User ID requesting the job
 * @param {boolean} isAdmin - Whether user is admin
 * @returns {Promise<Object|null>} Job with quote details
 */
export async function getJobById(jobId, userId, isAdmin) {
  const job = await repository.getJobWithQuote(jobId);

  if (!job) {
    return null;
  }

  // Get full quote for authorization check
  const quote = await quoteRepository.getQuoteById(job.quote_id);

  if (!quote) {
    throw new Error('NOT_FOUND: Parent quote not found');
  }

  // Authorization: Only owner or admin can view
  if (!isAdmin && quote.user_id !== userId) {
    throw new Error('FORBIDDEN: You do not have permission to view this job');
  }

  return job;
}

/**
 * Update a job
 * @param {string} jobId - Job ID
 * @param {Object} updates - Updates to apply
 * @param {string} userId - User ID making the update
 * @param {boolean} isAdmin - Whether user is admin
 * @returns {Promise<Object>} Updated job
 */
export async function updateJob(jobId, updates, userId, isAdmin) {
  // Validate updates
  const validated = updateJobSchema.parse(updates);

  // Get existing job
  const existing = await repository.getJobById(jobId);

  if (!existing) {
    throw new Error('NOT_FOUND: Job not found');
  }

  // Check quote authorization
  const quote = await quoteRepository.getQuoteById(existing.quote_id);

  if (!quote) {
    throw new Error('NOT_FOUND: Parent quote not found');
  }

  // Authorization: Only owner or admin can update
  if (!isAdmin && quote.user_id !== userId) {
    throw new Error('FORBIDDEN: You do not have permission to update this job');
  }

  // Update job
  const updated = await repository.updateJob(jobId, validated);

  // Update quote's updated_at timestamp
  await quoteRepository.updateQuote(existing.quote_id, {});

  return updated;
}

/**
 * Delete a job
 * @param {string} jobId - Job ID
 * @param {string} userId - User ID deleting the job
 * @param {boolean} isAdmin - Whether user is admin
 * @returns {Promise<Object>} Deleted job
 */
export async function deleteJob(jobId, userId, isAdmin) {
  // Get existing job
  const existing = await repository.getJobById(jobId);

  if (!existing) {
    throw new Error('NOT_FOUND: Job not found');
  }

  // Check quote authorization
  const quote = await quoteRepository.getQuoteById(existing.quote_id);

  if (!quote) {
    throw new Error('NOT_FOUND: Parent quote not found');
  }

  // Authorization: Only owner or admin can delete
  if (!isAdmin && quote.user_id !== userId) {
    throw new Error('FORBIDDEN: You do not have permission to delete this job');
  }

  // Delete job
  const deleted = await repository.deleteJob(jobId);

  // Re-index remaining jobs
  const remainingJobs = await repository.getJobsByQuoteId(existing.quote_id);
  if (remainingJobs.length > 0) {
    const reindexed = remainingJobs.map((job, index) => ({
      id: job.id,
      order_index: index,
    }));
    await repository.reorderJobs(reindexed);
  }

  // Update quote's updated_at timestamp
  await quoteRepository.updateQuote(existing.quote_id, {});

  return deleted;
}

/**
 * Reorder jobs for a quote
 * @param {string} quoteId - Quote ID
 * @param {Array<{id: string, order_index: number}>} jobOrders - New job order
 * @param {string} userId - User ID reordering
 * @param {boolean} isAdmin - Whether user is admin
 * @returns {Promise<Array>} Updated jobs
 */
export async function reorderJobs(quoteId, jobOrders, userId, isAdmin) {
  // Validate input
  const validated = reorderJobsSchema.parse(jobOrders);

  // Check quote authorization
  const quote = await quoteRepository.getQuoteById(quoteId);

  if (!quote) {
    throw new Error('NOT_FOUND: Quote not found');
  }

  // Authorization: Only owner or admin can reorder
  if (!isAdmin && quote.user_id !== userId) {
    throw new Error('FORBIDDEN: You do not have permission to reorder jobs for this quote');
  }

  // Verify all jobs belong to this quote
  const existingJobs = await repository.getJobsByQuoteId(quoteId);
  const existingJobIds = new Set(existingJobs.map((j) => j.id));

  for (const jobOrder of validated) {
    if (!existingJobIds.has(jobOrder.id)) {
      throw new Error(`INVALID: Job ${jobOrder.id} does not belong to quote ${quoteId}`);
    }
  }

  // Verify all jobs are included in reorder
  if (validated.length !== existingJobs.length) {
    throw new Error('INVALID: All jobs must be included in reorder operation');
  }

  // Reorder jobs
  const updated = await repository.reorderJobs(validated);

  // Update quote's updated_at timestamp
  await quoteRepository.updateQuote(quoteId, {});

  return updated;
}

/**
 * Update job parameters (without recalculating materials/labour)
 * @param {string} jobId - Job ID
 * @param {Object} parameters - New parameters
 * @param {string} userId - User ID
 * @param {boolean} isAdmin - Whether user is admin
 * @returns {Promise<Object>} Updated job
 */
export async function updateJobParameters(jobId, parameters, userId, isAdmin) {
  // Get existing job
  const existing = await repository.getJobById(jobId);

  if (!existing) {
    throw new Error('NOT_FOUND: Job not found');
  }

  // Check quote authorization
  const quote = await quoteRepository.getQuoteById(existing.quote_id);

  if (!quote) {
    throw new Error('NOT_FOUND: Parent quote not found');
  }

  // Authorization: Only owner or admin can update
  if (!isAdmin && quote.user_id !== userId) {
    throw new Error('FORBIDDEN: You do not have permission to update this job');
  }

  // Update parameters
  const updated = await repository.updateJobParameters(jobId, parameters);

  // Update quote's updated_at timestamp
  await quoteRepository.updateQuote(existing.quote_id, {});

  return updated;
}

/**
 * Update job calculations (materials, labour, subtotal)
 * NOTE: This will be expanded in Epic 4 (Calculation Engine)
 * @param {string} jobId - Job ID
 * @param {Object} calculationData - Calculation data
 * @param {string} userId - User ID
 * @param {boolean} isAdmin - Whether user is admin
 * @returns {Promise<Object>} Updated job
 */
export async function updateJobCalculations(jobId, calculationData, userId, isAdmin) {
  // Get existing job
  const existing = await repository.getJobById(jobId);

  if (!existing) {
    throw new Error('NOT_FOUND: Job not found');
  }

  // Check quote authorization
  const quote = await quoteRepository.getQuoteById(existing.quote_id);

  if (!quote) {
    throw new Error('NOT_FOUND: Parent quote not found');
  }

  // Authorization: Only owner or admin can update
  if (!isAdmin && quote.user_id !== userId) {
    throw new Error('FORBIDDEN: You do not have permission to update this job');
  }

  // Validate calculation data has required fields
  if (!calculationData.materials || !calculationData.labour || !calculationData.subtotal) {
    throw new Error('INVALID: Calculation data must include materials, labour, and subtotal');
  }

  // Update calculations
  const updated = await repository.updateJobCalculations(jobId, calculationData);

  // Update quote's updated_at timestamp
  await quoteRepository.updateQuote(existing.quote_id, {});

  return updated;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get count of jobs by type for a quote
 * @param {string} quoteId - Quote ID
 * @param {string} userId - User ID
 * @param {boolean} isAdmin - Whether user is admin
 * @returns {Promise<Object>} Job counts by type
 */
export async function getJobCountsByType(quoteId, userId, isAdmin) {
  // Check authorization
  const quote = await quoteRepository.getQuoteById(quoteId);

  if (!quote) {
    throw new Error('NOT_FOUND: Quote not found');
  }

  if (!isAdmin && quote.user_id !== userId) {
    throw new Error('FORBIDDEN: You do not have permission to view jobs for this quote');
  }

  // Get all jobs
  const jobs = await repository.getJobsByQuoteId(quoteId);

  // Count by type
  const counts = {
    retaining_wall: 0,
    driveway: 0,
    trenching: 0,
    stormwater: 0,
    site_prep: 0,
  };

  for (const job of jobs) {
    if (counts[job.job_type] !== undefined) {
      counts[job.job_type]++;
    }
  }

  return counts;
}
