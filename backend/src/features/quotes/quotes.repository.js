/**
 * Quotes Repository
 *
 * Data access layer for quotes using Drizzle ORM
 * Handles all database operations for quotes, jobs, and financials
 */

import { db } from '../../shared/db/postgres.js';
import { quotes, jobs, financials, quoteVersions } from '../../shared/db/schema.js';
import { eq, and, desc, sql } from 'drizzle-orm';

// ============================================================================
// CREATE
// ============================================================================

/**
 * Create a new quote
 * @param {Object} quoteData - Quote data
 * @returns {Promise<Object>} Created quote
 */
export async function createQuote(quoteData) {
  const [quote] = await db.insert(quotes).values(quoteData).returning();
  return quote;
}

/**
 * Create a new job for a quote
 * @param {Object} jobData - Job data
 * @returns {Promise<Object>} Created job
 */
export async function createJob(jobData) {
  const [job] = await db.insert(jobs).values(jobData).returning();
  return job;
}

/**
 * Create financial record for a quote
 * @param {Object} financialData - Financial data
 * @returns {Promise<Object>} Created financial record
 */
export async function createFinancials(financialData) {
  const [financial] = await db.insert(financials).values(financialData).returning();
  return financial;
}

// ============================================================================
// READ
// ============================================================================

/**
 * Get all quotes with optional filtering
 * @param {Object} filters - Filter options
 * @param {string} [filters.status] - Filter by status
 * @param {string} [filters.user_id] - Filter by user
 * @param {number} [filters.limit=100] - Limit results
 * @param {number} [filters.offset=0] - Offset for pagination
 * @returns {Promise<Array>} Array of quotes
 */
export async function getAllQuotes(filters = {}) {
  const { status, user_id, limit = 100, offset = 0 } = filters;

  let query = db
    .select({
      id: quotes.id,
      quote_number: quotes.quote_number,
      version: quotes.version,
      status: quotes.status,
      user_id: quotes.user_id,
      customer_name: quotes.customer_name,
      customer_email: quotes.customer_email,
      customer_phone: quotes.customer_phone,
      customer_address: quotes.customer_address,
      location: quotes.location,
      metadata: quotes.metadata,
      created_at: quotes.created_at,
      updated_at: quotes.updated_at,
      // Include total from financials if exists
      total_inc_gst: financials.total_inc_gst,
    })
    .from(quotes)
    .leftJoin(financials, eq(quotes.id, financials.quote_id))
    .orderBy(desc(quotes.updated_at))
    .limit(limit)
    .offset(offset);

  // Apply filters
  const conditions = [];
  if (status) conditions.push(eq(quotes.status, status));
  if (user_id) conditions.push(eq(quotes.user_id, user_id));

  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  return await query;
}

/**
 * Get quote by ID with all related data (jobs, financials)
 * @param {string} quoteId - Quote ID
 * @returns {Promise<Object|null>} Quote with jobs and financials
 */
export async function getQuoteById(quoteId) {
  // Get quote
  const [quote] = await db
    .select()
    .from(quotes)
    .where(eq(quotes.id, quoteId));

  if (!quote) return null;

  // Get jobs for this quote
  const quoteJobs = await db
    .select()
    .from(jobs)
    .where(eq(jobs.quote_id, quoteId))
    .orderBy(jobs.order_index);

  // Get financials
  const [quoteFinancials] = await db
    .select()
    .from(financials)
    .where(eq(financials.quote_id, quoteId));

  return {
    ...quote,
    jobs: quoteJobs || [],
    financials: quoteFinancials || null,
  };
}

/**
 * Get quote by quote number
 * @param {string} quoteNumber - Quote number (e.g., EE-2025-0001)
 * @returns {Promise<Object|null>} Quote
 */
export async function getQuoteByNumber(quoteNumber) {
  const [quote] = await db
    .select()
    .from(quotes)
    .where(eq(quotes.quote_number, quoteNumber));

  return quote || null;
}

/**
 * Search quotes by customer name or quote number
 * @param {string} searchTerm - Search term
 * @param {number} limit - Max results
 * @returns {Promise<Array>} Matching quotes
 */
export async function searchQuotes(searchTerm, limit = 50) {
  const searchPattern = `%${searchTerm}%`;

  return await db
    .select({
      id: quotes.id,
      quote_number: quotes.quote_number,
      status: quotes.status,
      customer_name: quotes.customer_name,
      customer_email: quotes.customer_email,
      created_at: quotes.created_at,
      updated_at: quotes.updated_at,
      total_inc_gst: financials.total_inc_gst,
    })
    .from(quotes)
    .leftJoin(financials, eq(quotes.id, financials.quote_id))
    .where(
      sql`${quotes.customer_name} ILIKE ${searchPattern} OR ${quotes.quote_number} ILIKE ${searchPattern}`
    )
    .orderBy(desc(quotes.updated_at))
    .limit(limit);
}

// ============================================================================
// UPDATE
// ============================================================================

/**
 * Update a quote
 * @param {string} quoteId - Quote ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated quote
 */
export async function updateQuote(quoteId, updates) {
  const [updated] = await db
    .update(quotes)
    .set({
      ...updates,
      updated_at: new Date(),
    })
    .where(eq(quotes.id, quoteId))
    .returning();

  return updated;
}

/**
 * Update a job
 * @param {string} jobId - Job ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated job
 */
export async function updateJob(jobId, updates) {
  const [updated] = await db
    .update(jobs)
    .set(updates)
    .where(eq(jobs.id, jobId))
    .returning();

  return updated;
}

/**
 * Update financials for a quote
 * @param {string} quoteId - Quote ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated financials
 */
export async function updateFinancials(quoteId, updates) {
  const [updated] = await db
    .update(financials)
    .set(updates)
    .where(eq(financials.quote_id, quoteId))
    .returning();

  return updated;
}

// ============================================================================
// DELETE
// ============================================================================

/**
 * Delete a quote and all related data (cascade)
 * @param {string} quoteId - Quote ID
 * @returns {Promise<Object>} Deleted quote
 */
export async function deleteQuote(quoteId) {
  // Delete jobs (cascade)
  await db.delete(jobs).where(eq(jobs.quote_id, quoteId));

  // Delete financials
  await db.delete(financials).where(eq(financials.quote_id, quoteId));

  // Delete quote versions
  await db.delete(quoteVersions).where(eq(quoteVersions.quote_id, quoteId));

  // Delete quote
  const [deleted] = await db
    .delete(quotes)
    .where(eq(quotes.id, quoteId))
    .returning();

  return deleted;
}

/**
 * Delete a single job
 * @param {string} jobId - Job ID
 * @returns {Promise<Object>} Deleted job
 */
export async function deleteJob(jobId) {
  const [deleted] = await db
    .delete(jobs)
    .where(eq(jobs.id, jobId))
    .returning();

  return deleted;
}

// ============================================================================
// VERSION TRACKING
// ============================================================================

/**
 * Create a version snapshot of a quote
 * @param {Object} versionData - Version data
 * @returns {Promise<Object>} Created version
 */
export async function createQuoteVersion(versionData) {
  const [version] = await db
    .insert(quoteVersions)
    .values(versionData)
    .returning();

  return version;
}

/**
 * Get all versions of a quote
 * @param {string} quoteId - Quote ID
 * @returns {Promise<Array>} Array of versions
 */
export async function getQuoteVersions(quoteId) {
  return await db
    .select()
    .from(quoteVersions)
    .where(eq(quoteVersions.quote_id, quoteId))
    .orderBy(desc(quoteVersions.created_at));
}
