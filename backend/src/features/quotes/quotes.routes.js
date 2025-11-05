/**
 * Quotes Routes
 *
 * REST API endpoints for quote management
 * All routes require authentication
 */

import { Router } from 'express';
import { authenticateToken } from '../../shared/middleware/auth.middleware.js';
// import { requireAdmin } from '../../shared/middleware/auth.middleware.js'; // Available for admin-only routes
import * as controller from './quotes.controller.js';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// ============================================================================
// QUOTES CRUD
// ============================================================================

/**
 * GET /api/quotes
 * List all quotes (admins see all, field workers see only their own)
 * Query params: ?status=draft&limit=50&offset=0
 */
router.get('/', controller.getAllQuotes);

/**
 * GET /api/quotes/search
 * Search quotes by customer name or quote number
 * Query params: ?q=search_term
 * MUST be defined before /:id route to avoid conflict
 */
router.get('/search', controller.searchQuotes);

/**
 * GET /api/quotes/:id
 * Get single quote with all related data (jobs, financials)
 * Authorization: Owner or admin only
 */
router.get('/:id', controller.getQuoteById);

/**
 * POST /api/quotes
 * Create a new quote
 * Body: { customer_name, customer_email, customer_phone, customer_address, location, status, metadata }
 */
router.post('/', controller.createQuote);

/**
 * PUT /api/quotes/:id
 * Update an existing quote
 * Authorization: Owner or admin only
 * Body: Partial quote data
 */
router.put('/:id', controller.updateQuote);

/**
 * DELETE /api/quotes/:id
 * Delete a quote and all related data (cascade)
 * Authorization: Owner or admin only
 */
router.delete('/:id', controller.deleteQuote);

// ============================================================================
// JOBS (Sub-resources of quotes)
// ============================================================================

/**
 * POST /api/quotes/:id/jobs
 * Add a job to a quote
 * Authorization: Quote owner or admin only
 * Body: { job_type, order_index, parameters, materials, labour, calculations, subtotal }
 */
router.post('/:id/jobs', controller.addJob);

// ============================================================================
// FINANCIALS (Sub-resources of quotes)
// ============================================================================

/**
 * PUT /api/quotes/:id/financials
 * Create or update financials for a quote
 * Authorization: Quote owner or admin only
 * Body: { direct_cost, overhead_multiplier, profit_first, gst_rate, gst_amount, total_inc_gst, rounded_total, deposit }
 */
router.put('/:id/financials', controller.upsertFinancials);

export default router;
