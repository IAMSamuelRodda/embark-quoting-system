/**
 * Financial Settings Routes
 *
 * REST API endpoints for price sheet defaults management
 * All routes require authentication
 * Admin-only routes require admin role
 */

import { Router } from 'express';
import { authenticateToken, requireAdmin } from '../../shared/middleware/auth.middleware.js';
import * as controller from './settings.controller.js';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// ============================================================================
// SETTINGS ENDPOINTS
// ============================================================================

/**
 * GET /api/settings
 * Get current active settings
 * Available to all authenticated users
 */
router.get('/', controller.getCurrentSettings);

/**
 * GET /api/settings/parameters
 * Get all calculation parameters (helper endpoint)
 * Available to all authenticated users
 * MUST be defined before /:id route to avoid conflict
 */
router.get('/parameters', controller.getCalculationParameters);

/**
 * GET /api/settings/history
 * Get all settings versions
 * Admin only
 */
router.get('/history', requireAdmin, controller.getAllSettings);

/**
 * GET /api/settings/:id
 * Get settings by ID
 * Admin only
 */
router.get('/:id', requireAdmin, controller.getSettingsById);

/**
 * POST /api/settings
 * Create new settings version
 * Admin only
 * Body: Complete defaults object (profit_first, gst, deposit_options, etc.)
 */
router.post('/', requireAdmin, controller.createSettings);

export default router;
