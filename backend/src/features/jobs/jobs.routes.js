/**
 * Jobs Routes
 *
 * REST API endpoints for job management
 * All routes require authentication
 */

import { Router } from 'express';
import { authenticateToken } from '../../shared/middleware/auth.middleware.js';
import * as controller from './jobs.controller.js';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// ============================================================================
// JOBS CRUD
// ============================================================================

/**
 * GET /api/jobs/:id
 * Get single job by ID with quote details
 * Authorization: Quote owner or admin only
 */
router.get('/:id', controller.getJobById);

/**
 * PUT /api/jobs/:id
 * Update an existing job
 * Authorization: Quote owner or admin only
 * Body: Partial job data { job_type, order_index, parameters, materials, labour, calculations, subtotal }
 */
router.put('/:id', controller.updateJob);

/**
 * DELETE /api/jobs/:id
 * Delete a job (and re-index remaining jobs)
 * Authorization: Quote owner or admin only
 */
router.delete('/:id', controller.deleteJob);

/**
 * PATCH /api/jobs/:id/parameters
 * Update job parameters only (without recalculating materials/labour)
 * Authorization: Quote owner or admin only
 * Body: { ...parameters }
 */
router.patch('/:id/parameters', controller.updateJobParameters);

/**
 * PATCH /api/jobs/:id/calculations
 * Update job calculations (materials, labour, subtotal)
 * Authorization: Quote owner or admin only
 * Body: { materials: [], labour: {}, calculations: {}, subtotal: "123.45" }
 */
router.patch('/:id/calculations', controller.updateJobCalculations);

export default router;
