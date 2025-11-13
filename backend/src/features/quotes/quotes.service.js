/**
 * Quotes Service
 *
 * Business logic layer for quotes
 * Handles validation, quote number generation, and business rules
 */

import * as repository from './quotes.repository.js';
import { z } from 'zod';

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const quoteStatusEnum = z.enum([
  'draft',
  'quoted',
  'booked',
  'in_progress',
  'completed',
  'cancelled',
]);

const createQuoteSchema = z.object({
  id: z.string().uuid().optional(), // Allow client-generated UUID for offline-first sync
  customer_name: z.string().min(1, 'Customer name is required'),
  customer_email: z.string().email().optional().or(z.literal('')),
  customer_phone: z.string().optional(),
  customer_address: z.string().optional(),
  location: z
    .object({
      suburb: z.string().optional(),
      postcode: z.string().optional(),
      gps: z
        .object({
          lat: z.number().optional(),
          lng: z.number().optional(),
        })
        .optional(),
    })
    .optional(),
  status: quoteStatusEnum.default('draft'),
  metadata: z.record(z.any()).optional(),
});

const updateQuoteSchema = z.object({
  customer_name: z.string().min(1).optional(),
  customer_email: z.string().email().optional().or(z.literal('')),
  customer_phone: z.string().optional(),
  customer_address: z.string().optional(),
  location: z
    .object({
      suburb: z.string().optional(),
      postcode: z.string().optional(),
      gps: z
        .object({
          lat: z.number().optional(),
          lng: z.number().optional(),
        })
        .optional(),
    })
    .optional(),
  status: quoteStatusEnum.optional(),
  metadata: z.record(z.any()).optional(),
});

// ============================================================================
// QUOTE NUMBER GENERATION
// ============================================================================

/**
 * Generate next quote number in format EE-YYYY-NNNN
 * e.g., "EE-2025-0001"
 * @returns {Promise<string>} Quote number
 */
async function generateQuoteNumber() {
  const year = new Date().getFullYear();
  const prefix = `EE-${year}-`;

  // Get all quotes for this year to find the highest sequence
  const quotesThisYear = await repository.searchQuotes(prefix, 10000);

  // Extract sequence numbers
  const sequences = quotesThisYear
    .map((q) => {
      const match = q.quote_number.match(/EE-\d{4}-(\d{4})/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter((seq) => seq > 0);

  // Get next sequence
  const nextSeq = sequences.length > 0 ? Math.max(...sequences) + 1 : 1;

  // Format with leading zeros
  return `${prefix}${nextSeq.toString().padStart(4, '0')}`;
}

// ============================================================================
// BUSINESS LOGIC
// ============================================================================

/**
 * Create a new quote
 * @param {Object} quoteData - Quote data
 * @param {string} userId - User ID creating the quote
 * @returns {Promise<Object>} Created quote
 */
export async function createQuote(quoteData, userId) {
  // Validate input
  const validated = createQuoteSchema.parse(quoteData);

  // Generate quote number
  const quote_number = await generateQuoteNumber();

  // Create quote
  // Note: Client-generated UUID (from crypto.randomUUID()) is accepted for offline-first sync.
  // If id is provided by client, use it; otherwise PostgreSQL generates one via gen_random_uuid().
  const newQuote = await repository.createQuote({
    ...validated, // Includes client id if provided
    quote_number,
    user_id: userId,
    version: 1,
  });

  return newQuote;
}

/**
 * Get all quotes with filtering
 * @param {Object} filters - Filter options
 * @param {string} userId - User ID (for filtering)
 * @param {boolean} isAdmin - Whether user is admin
 * @returns {Promise<Array>} Quotes
 */
export async function getAllQuotes(filters, userId, isAdmin) {
  // Non-admin users can only see their own quotes
  if (!isAdmin) {
    filters.user_id = userId;
  }

  return await repository.getAllQuotes(filters);
}

/**
 * Get quote by ID with authorization check
 * @param {string} quoteId - Quote ID
 * @param {string} userId - User ID requesting the quote
 * @param {boolean} isAdmin - Whether user is admin
 * @returns {Promise<Object|null>} Quote with jobs and financials
 */
export async function getQuoteById(quoteId, userId, isAdmin) {
  const quote = await repository.getQuoteById(quoteId);

  if (!quote) {
    return null;
  }

  // Authorization: Only owner or admin can view
  if (!isAdmin && quote.user_id !== userId) {
    throw new Error('FORBIDDEN: You do not have permission to view this quote');
  }

  return quote;
}

/**
 * Update a quote
 * @param {string} quoteId - Quote ID
 * @param {Object} updates - Updates to apply
 * @param {string} userId - User ID making the update
 * @param {boolean} isAdmin - Whether user is admin
 * @returns {Promise<Object>} Updated quote
 */
export async function updateQuote(quoteId, updates, userId, isAdmin) {
  // Validate updates
  const validated = updateQuoteSchema.parse(updates);

  // Get existing quote for authorization check
  const existing = await repository.getQuoteById(quoteId);

  if (!existing) {
    throw new Error('NOT_FOUND: Quote not found');
  }

  // Authorization: Only owner or admin can update
  if (!isAdmin && existing.user_id !== userId) {
    throw new Error('FORBIDDEN: You do not have permission to update this quote');
  }

  // Increment version
  const newVersion = existing.version + 1;

  // Update quote
  const updated = await repository.updateQuote(quoteId, {
    ...validated,
    version: newVersion,
  });

  // Create version snapshot
  await repository.createQuoteVersion({
    quote_id: quoteId,
    version: newVersion,
    data: updated,
    user_id: userId,
    device_id: 'backend-api', // Backend updates get special device ID
  });

  return updated;
}

/**
 * Delete a quote
 * @param {string} quoteId - Quote ID
 * @param {string} userId - User ID requesting deletion
 * @param {boolean} isAdmin - Whether user is admin
 * @returns {Promise<Object>} Deleted quote
 */
export async function deleteQuote(quoteId, userId, isAdmin) {
  // Get existing quote for authorization check
  const existing = await repository.getQuoteById(quoteId);

  if (!existing) {
    throw new Error('NOT_FOUND: Quote not found');
  }

  // Authorization: Only owner or admin can delete
  if (!isAdmin && existing.user_id !== userId) {
    throw new Error('FORBIDDEN: You do not have permission to delete this quote');
  }

  // Delete quote (cascades to jobs and financials)
  return await repository.deleteQuote(quoteId);
}

/**
 * Search quotes by customer name or quote number
 * @param {string} searchTerm - Search term
 * @param {string} userId - User ID searching
 * @param {boolean} isAdmin - Whether user is admin
 * @returns {Promise<Array>} Matching quotes
 */
export async function searchQuotes(searchTerm, userId, isAdmin) {
  const results = await repository.searchQuotes(searchTerm);

  // Non-admin users can only see their own quotes
  if (!isAdmin) {
    return results.filter((quote) => quote.user_id === userId);
  }

  return results;
}

// ============================================================================
// JOBS MANAGEMENT
// ============================================================================

/**
 * Add a job to a quote
 * @param {string} quoteId - Quote ID
 * @param {Object} jobData - Job data
 * @param {string} userId - User ID
 * @param {boolean} isAdmin - Whether user is admin
 * @returns {Promise<Object>} Created job
 */
export async function addJob(quoteId, jobData, userId, isAdmin) {
  // Check quote ownership
  const quote = await repository.getQuoteById(quoteId);

  if (!quote) {
    throw new Error('NOT_FOUND: Quote not found');
  }

  if (!isAdmin && quote.user_id !== userId) {
    throw new Error('FORBIDDEN: You do not have permission to modify this quote');
  }

  // Create job
  const job = await repository.createJob({
    quote_id: quoteId,
    ...jobData,
  });

  return job;
}

/**
 * Update a job
 * @param {string} jobId - Job ID
 * @param {Object} updates - Updates to apply
 * @param {string} _userId - User ID (reserved for future authorization)
 * @param {boolean} _isAdmin - Whether user is admin (reserved for future authorization)
 * @returns {Promise<Object>} Updated job
 */
export async function updateJob(jobId, updates, _userId, _isAdmin) {
  // TODO: Implement authorization check via quote ownership
  return await repository.updateJob(jobId, updates);
}

/**
 * Delete a job
 * @param {string} jobId - Job ID
 * @param {string} _userId - User ID (reserved for future authorization)
 * @param {boolean} _isAdmin - Whether user is admin (reserved for future authorization)
 * @returns {Promise<Object>} Deleted job
 */
export async function deleteJob(jobId, _userId, _isAdmin) {
  // TODO: Implement authorization check via quote ownership
  return await repository.deleteJob(jobId);
}

// ============================================================================
// FINANCIALS MANAGEMENT
// ============================================================================

/**
 * Create or update financials for a quote
 * @param {string} quoteId - Quote ID
 * @param {Object} financialData - Financial data
 * @param {string} userId - User ID
 * @param {boolean} isAdmin - Whether user is admin
 * @returns {Promise<Object>} Financial record
 */
export async function upsertFinancials(quoteId, financialData, userId, isAdmin) {
  // Check quote ownership
  const quote = await repository.getQuoteById(quoteId);

  if (!quote) {
    throw new Error('NOT_FOUND: Quote not found');
  }

  if (!isAdmin && quote.user_id !== userId) {
    throw new Error('FORBIDDEN: You do not have permission to modify this quote');
  }

  // Create or update financials
  if (quote.financials) {
    return await repository.updateFinancials(quoteId, financialData);
  } else {
    return await repository.createFinancials({
      quote_id: quoteId,
      ...financialData,
    });
  }
}

// ============================================================================
// OUTPUTS (PDF & EMAIL)
// ============================================================================

/**
 * Generate PDF for a quote
 * @param {Object} quote - Quote with all related data
 * @returns {Promise<Buffer>} PDF file buffer
 */
export async function generateQuotePDF(quote) {
  const { generateQuotePDF: pdfGenerator } = await import('../../shared/services/pdfService.js');
  return await pdfGenerator(quote);
}

/**
 * Send quote via email with PDF attachment
 * @param {string} quoteId - Quote ID
 * @param {string} userId - User ID
 * @param {boolean} isAdmin - Whether user is admin
 * @param {string} customEmail - Optional custom email override
 * @returns {Promise<Object>} Email send result
 */
export async function sendQuoteEmail(quoteId, userId, isAdmin, customEmail) {
  // Import email service
  const { sendQuoteEmail: emailSender } = await import('../../shared/services/emailService.js');
  const { generateQuotePDF: pdfGenerator } = await import('../../shared/services/pdfService.js');

  // Get quote with full details (includes authorization check)
  const quote = await getQuoteById(quoteId, userId, isAdmin);

  if (!quote) {
    throw new Error('NOT_FOUND: Quote not found');
  }

  // Determine recipient email
  const recipientEmail = customEmail || quote.customer_email;

  if (!recipientEmail) {
    throw new Error('INVALID_EMAIL: No customer email on file and no custom email provided');
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(recipientEmail)) {
    throw new Error('INVALID_EMAIL: Invalid email address format');
  }

  // Generate PDF
  const pdfBuffer = await pdfGenerator(quote);

  // Prepare email parameters
  const depositAmount = quote.financials?.deposit
    ? formatCurrency(quote.financials.deposit.amount)
    : null;
  const depositPercentage = quote.financials?.deposit?.percentage || null;

  const emailParams = {
    to: recipientEmail,
    customerName: quote.customer_name,
    quoteNumber: quote.quote_number,
    totalAmount: formatCurrency(quote.financials?.rounded_total || 0),
    quoteDate: formatDate(quote.created_at),
    jobCount: quote.jobs?.length || 0,
    depositAmount,
    depositPercentage,
    pdfAttachment: pdfBuffer,
    pdfFilename: `${quote.quote_number}.pdf`,
  };

  // Send email
  const result = await emailSender(emailParams);

  // Update quote status to 'sent'
  await repository.updateQuote(quoteId, { status: 'sent' });

  return {
    ...result,
    quoteId,
    quoteNumber: quote.quote_number,
  };
}

// Helper functions for formatting
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(amount);
}

function formatDate(date) {
  return new Intl.DateTimeFormat('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date));
}
