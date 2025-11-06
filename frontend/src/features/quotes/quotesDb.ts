/**
 * Quote Database Operations
 *
 * Data access layer for quotes in IndexedDB
 * Provides CRUD operations, search, filtering, and sync management
 *
 * Epic 5: Version vector tracking for conflict detection
 */

import { db, getDeviceId } from '../../shared/db/indexedDb';
import {
  QuoteStatus,
  SyncStatus,
  SyncOperation,
  type Quote,
  type QuoteWithDetails,
  type QuoteListItem,
} from '../../shared/types/models';
import { createVersionVector, incrementVersion } from '../sync/versionVectors';

/**
 * Generate next quote number in format EE-YYYY-NNNN
 * e.g., "EE-2025-0001"
 */
async function generateQuoteNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `EE-${year}-`;

  // Get all quotes for this year
  const quotesThisYear = await db.quotes.where('quote_number').startsWith(prefix).toArray();

  // Extract sequence numbers
  const sequences = quotesThisYear.map((q) => {
    const match = q.quote_number.match(/EE-\d{4}-(\d{4})/);
    return match ? parseInt(match[1], 10) : 0;
  });

  // Get next sequence
  const nextSeq = sequences.length > 0 ? Math.max(...sequences) + 1 : 1;

  // Format with leading zeros
  return `${prefix}${nextSeq.toString().padStart(4, '0')}`;
}

// ============================================================================
// CRUD OPERATIONS
// ============================================================================

/**
 * Create a new quote
 */
export async function createQuote(data: Partial<Quote>): Promise<Quote> {
  const deviceId = getDeviceId();

  const quote: Quote = {
    id: crypto.randomUUID(),
    quote_number: await generateQuoteNumber(),
    version: 1,
    versionVector: createVersionVector(deviceId), // Epic 5: Initialize version vector
    status: data.status || QuoteStatus.DRAFT,
    user_id: data.user_id || '',
    customer_name: data.customer_name || '',
    customer_email: data.customer_email,
    customer_phone: data.customer_phone,
    customer_address: data.customer_address,
    location: data.location,
    metadata: data.metadata,
    created_at: new Date(),
    updated_at: new Date(),
    sync_status: SyncStatus.PENDING,
    device_id: deviceId,
  };

  await db.quotes.add(quote);

  // Add to sync queue
  await db.syncQueue.add({
    id: crypto.randomUUID(),
    quote_id: quote.id,
    operation: SyncOperation.CREATE,
    data: quote,
    timestamp: new Date(),
    retry_count: 0,
  });

  return quote;
}

/**
 * Get quote by ID
 */
export async function getQuoteById(id: string): Promise<Quote | undefined> {
  return await db.quotes.get(id);
}

/**
 * Get quote with all related data (jobs, financials)
 */
export async function getQuoteWithDetails(id: string): Promise<QuoteWithDetails | undefined> {
  const quote = await db.quotes.get(id);
  if (!quote) return undefined;

  const jobs = await db.jobs.where('quote_id').equals(id).toArray();
  const financials = await db.financials.get(id);

  return {
    ...quote,
    jobs,
    financials,
  };
}

/**
 * Get all quotes (lightweight, for list view)
 */
export async function getAllQuotes(): Promise<QuoteListItem[]> {
  const quotes = await db.quotes.toArray();

  // Get financials for total amounts
  const quotesWithTotals = await Promise.all(
    quotes.map(async (quote) => {
      const financial = await db.financials.get(quote.id);
      return {
        id: quote.id,
        quote_number: quote.quote_number,
        customer_name: quote.customer_name,
        status: quote.status,
        total_inc_gst: financial?.total_inc_gst,
        created_at: quote.created_at,
        updated_at: quote.updated_at,
        sync_status: quote.sync_status,
      };
    }),
  );

  // Sort by updated_at descending (most recent first)
  return quotesWithTotals.sort((a, b) => b.updated_at.getTime() - a.updated_at.getTime());
}

/**
 * Update an existing quote
 */
export async function updateQuote(id: string, updates: Partial<Quote>): Promise<void> {
  const quote = await db.quotes.get(id);
  if (!quote) throw new Error(`Quote ${id} not found`);

  const deviceId = getDeviceId();

  // Increment version vector for this device
  const newVersionVector = incrementVersion(quote.versionVector || {}, deviceId);

  // Update version and sync status
  const updatedQuote = {
    ...updates,
    version: quote.version + 1,
    versionVector: newVersionVector, // Epic 5: Increment version vector
    updated_at: new Date(),
    sync_status: SyncStatus.PENDING,
  };

  await db.quotes.update(id, updatedQuote);

  // Add to sync queue
  await db.syncQueue.add({
    id: crypto.randomUUID(),
    quote_id: id,
    operation: SyncOperation.UPDATE,
    data: updatedQuote,
    timestamp: new Date(),
    retry_count: 0,
  });

  // Create version snapshot with version vector
  await db.quoteVersions.add({
    id: crypto.randomUUID(),
    quote_id: id,
    version: updatedQuote.version,
    versionVector: newVersionVector,
    data: { ...quote, ...updatedQuote },
    user_id: quote.user_id,
    device_id: deviceId,
    created_at: new Date(),
  });
}

/**
 * Delete a quote and all related data
 */
export async function deleteQuote(id: string): Promise<void> {
  // Delete related jobs
  const jobs = await db.jobs.where('quote_id').equals(id).toArray();
  await Promise.all(jobs.map((job) => db.jobs.delete(job.id)));

  // Delete financials
  await db.financials.delete(id);

  // Delete quote
  await db.quotes.delete(id);

  // Add to sync queue
  await db.syncQueue.add({
    id: crypto.randomUUID(),
    quote_id: id,
    operation: SyncOperation.DELETE,
    data: { id },
    timestamp: new Date(),
    retry_count: 0,
  });
}

// ============================================================================
// SEARCH & FILTER
// ============================================================================

/**
 * Search quotes by quote number or customer name
 */
export async function searchQuotes(query: string): Promise<QuoteListItem[]> {
  const lowerQuery = query.toLowerCase();

  const quotes = await db.quotes
    .filter(
      (quote) =>
        quote.quote_number.toLowerCase().includes(lowerQuery) ||
        quote.customer_name.toLowerCase().includes(lowerQuery),
    )
    .toArray();

  // Get financials for total amounts
  const quotesWithTotals = await Promise.all(
    quotes.map(async (quote) => {
      const financial = await db.financials.get(quote.id);
      return {
        id: quote.id,
        quote_number: quote.quote_number,
        customer_name: quote.customer_name,
        status: quote.status,
        total_inc_gst: financial?.total_inc_gst,
        created_at: quote.created_at,
        updated_at: quote.updated_at,
        sync_status: quote.sync_status,
      };
    }),
  );

  return quotesWithTotals.sort((a, b) => b.updated_at.getTime() - a.updated_at.getTime());
}

/**
 * Filter quotes by status
 */
export async function getQuotesByStatus(status: QuoteStatus): Promise<QuoteListItem[]> {
  const quotes = await db.quotes.where('status').equals(status).toArray();

  const quotesWithTotals = await Promise.all(
    quotes.map(async (quote) => {
      const financial = await db.financials.get(quote.id);
      return {
        id: quote.id,
        quote_number: quote.quote_number,
        customer_name: quote.customer_name,
        status: quote.status,
        total_inc_gst: financial?.total_inc_gst,
        created_at: quote.created_at,
        updated_at: quote.updated_at,
        sync_status: quote.sync_status,
      };
    }),
  );

  return quotesWithTotals.sort((a, b) => b.updated_at.getTime() - a.updated_at.getTime());
}

/**
 * Get quotes within date range
 */
export async function getQuotesByDateRange(
  startDate: Date,
  endDate: Date,
): Promise<QuoteListItem[]> {
  const quotes = await db.quotes
    .where('created_at')
    .between(startDate, endDate, true, true)
    .toArray();

  const quotesWithTotals = await Promise.all(
    quotes.map(async (quote) => {
      const financial = await db.financials.get(quote.id);
      return {
        id: quote.id,
        quote_number: quote.quote_number,
        customer_name: quote.customer_name,
        status: quote.status,
        total_inc_gst: financial?.total_inc_gst,
        created_at: quote.created_at,
        updated_at: quote.updated_at,
        sync_status: quote.sync_status,
      };
    }),
  );

  return quotesWithTotals.sort((a, b) => b.updated_at.getTime() - a.updated_at.getTime());
}

// ============================================================================
// SYNC OPERATIONS
// ============================================================================

/**
 * Mark quote as synced
 */
export async function markQuoteAsSynced(id: string): Promise<void> {
  await db.quotes.update(id, {
    sync_status: SyncStatus.SYNCED,
    last_synced_at: new Date(),
  });

  // Remove from sync queue
  await db.syncQueue.where('quote_id').equals(id).delete();
}

/**
 * Mark quote as sync error
 */
export async function markQuoteAsSyncError(id: string, _errorMessage: string): Promise<void> {
  await db.quotes.update(id, {
    sync_status: SyncStatus.ERROR,
  });

  // Update sync queue retry count
  const queueItems = await db.syncQueue.where('quote_id').equals(id).toArray();
  for (const item of queueItems) {
    await db.syncQueue.update(item.id, {
      retry_count: item.retry_count + 1,
    });
  }
}

/**
 * Get quotes that need syncing
 */
export async function getQuotesNeedingSync(): Promise<Quote[]> {
  return await db.getQuotesNeedingSync();
}

/**
 * Get sync queue size
 */
export async function getSyncQueueSize(): Promise<number> {
  return await db.getSyncQueueSize();
}
