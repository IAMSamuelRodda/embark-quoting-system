/**
 * Prices Routes
 *
 * REST API endpoints for price management (Admin only)
 * All routes require authentication and admin role
 */

import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../../shared/middleware/auth.middleware.js';
import * as controller from './prices.controller.js';

const router = Router();

// All routes require authentication AND admin role
router.use(authenticateToken);
router.use(requireAdmin);

// ============================================================================
// PRICE SHEETS
// ============================================================================

/**
 * GET /api/prices/active
 * Get the currently active price sheet with all items
 * Authorization: Admin only
 */
router.get('/active', controller.getActivePriceSheet);

/**
 * GET /api/prices/history
 * Get price sheet version history
 * Authorization: Admin only
 * Query params: ?limit=10
 * MUST be defined before /sheets/:id to avoid conflict
 */
router.get('/history', controller.getPriceSheetHistory);

/**
 * GET /api/prices/sheets/:id
 * Get a specific price sheet by ID
 * Authorization: Admin only
 */
router.get('/sheets/:id', controller.getPriceSheetById);

/**
 * POST /api/prices/sheets
 * Create a new price sheet version
 * Authorization: Admin only
 * Body: { defaults, items: [{ name, price, unit, notes }] }
 */
router.post('/sheets', controller.createPriceSheetVersion);

// ============================================================================
// PRICE ITEMS
// ============================================================================

/**
 * POST /api/prices/items
 * Add a new price item (creates new price sheet version)
 * Authorization: Admin only
 * Body: { name, price, unit, notes }
 */
router.post('/items', controller.addPriceItem);

/**
 * PUT /api/prices/items/:id
 * Update a price item (creates new price sheet version)
 * Authorization: Admin only
 * Body: { price, unit, notes }
 */
router.put('/items/:id', controller.updatePriceItem);

/**
 * DELETE /api/prices/items/:id
 * Remove a price item (creates new price sheet version)
 * Authorization: Admin only
 */
router.delete('/items/:id', controller.removePriceItem);

export default router;
