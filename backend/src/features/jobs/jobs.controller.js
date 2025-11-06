/**
 * Jobs Controller
 *
 * HTTP request handlers for job endpoints
 * Handles request parsing, response formatting, and error handling
 */

import * as service from './jobs.service.js';

// ============================================================================
// JOBS ENDPOINTS
// ============================================================================

/**
 * GET /api/quotes/:quoteId/jobs
 * List all jobs for a quote
 */
export async function getJobsByQuoteId(req, res) {
  try {
    const { quoteId } = req.params;
    const userId = req.user.sub;
    const isAdmin = req.user.role === 'admin';

    const jobs = await service.getJobsByQuoteId(quoteId, userId, isAdmin);

    res.status(200).json({
      success: true,
      data: jobs,
      count: jobs.length,
    });
  } catch (error) {
    console.error('Get jobs by quote ID error:', error);

    if (error.message.startsWith('NOT_FOUND')) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: error.message.replace('NOT_FOUND: ', ''),
      });
    }

    if (error.message.startsWith('FORBIDDEN')) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: error.message.replace('FORBIDDEN: ', ''),
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
}

/**
 * GET /api/jobs/:id
 * Get single job by ID
 */
export async function getJobById(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.sub;
    const isAdmin = req.user.role === 'admin';

    const job = await service.getJobById(id, userId, isAdmin);

    if (!job) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Job not found',
      });
    }

    res.status(200).json({
      success: true,
      data: job,
    });
  } catch (error) {
    console.error('Get job by ID error:', error);

    if (error.message.startsWith('NOT_FOUND')) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: error.message.replace('NOT_FOUND: ', ''),
      });
    }

    if (error.message.startsWith('FORBIDDEN')) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: error.message.replace('FORBIDDEN: ', ''),
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
}

/**
 * POST /api/quotes/:quoteId/jobs
 * Create a new job for a quote
 */
export async function createJob(req, res) {
  try {
    const { quoteId } = req.params;
    const userId = req.user.sub;
    const isAdmin = req.user.role === 'admin';

    // Merge quoteId from URL into body data
    const jobData = {
      ...req.body,
      quote_id: quoteId,
    };

    const job = await service.createJob(jobData, userId, isAdmin);

    res.status(201).json({
      success: true,
      data: job,
      message: 'Job created successfully',
    });
  } catch (error) {
    console.error('Create job error:', error);

    if (error.message.startsWith('NOT_FOUND')) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: error.message.replace('NOT_FOUND: ', ''),
      });
    }

    if (error.message.startsWith('FORBIDDEN')) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: error.message.replace('FORBIDDEN: ', ''),
      });
    }

    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'Invalid job data',
        details: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
}

/**
 * PUT /api/jobs/:id
 * Update an existing job
 */
export async function updateJob(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.sub;
    const isAdmin = req.user.role === 'admin';

    const job = await service.updateJob(id, req.body, userId, isAdmin);

    res.status(200).json({
      success: true,
      data: job,
      message: 'Job updated successfully',
    });
  } catch (error) {
    console.error('Update job error:', error);

    if (error.message.startsWith('NOT_FOUND')) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: error.message.replace('NOT_FOUND: ', ''),
      });
    }

    if (error.message.startsWith('FORBIDDEN')) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: error.message.replace('FORBIDDEN: ', ''),
      });
    }

    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'Invalid job data',
        details: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
}

/**
 * DELETE /api/jobs/:id
 * Delete a job
 */
export async function deleteJob(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.sub;
    const isAdmin = req.user.role === 'admin';

    const deleted = await service.deleteJob(id, userId, isAdmin);

    res.status(200).json({
      success: true,
      data: deleted,
      message: 'Job deleted successfully',
    });
  } catch (error) {
    console.error('Delete job error:', error);

    if (error.message.startsWith('NOT_FOUND')) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: error.message.replace('NOT_FOUND: ', ''),
      });
    }

    if (error.message.startsWith('FORBIDDEN')) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: error.message.replace('FORBIDDEN: ', ''),
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
}

/**
 * POST /api/quotes/:quoteId/jobs/reorder
 * Reorder jobs for a quote
 * Body: [{ id: "job-uuid", order_index: 0 }, ...]
 */
export async function reorderJobs(req, res) {
  try {
    const { quoteId } = req.params;
    const userId = req.user.sub;
    const isAdmin = req.user.role === 'admin';
    const jobOrders = req.body;

    const updated = await service.reorderJobs(quoteId, jobOrders, userId, isAdmin);

    res.status(200).json({
      success: true,
      data: updated,
      message: 'Jobs reordered successfully',
    });
  } catch (error) {
    console.error('Reorder jobs error:', error);

    if (error.message.startsWith('NOT_FOUND')) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: error.message.replace('NOT_FOUND: ', ''),
      });
    }

    if (error.message.startsWith('FORBIDDEN')) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: error.message.replace('FORBIDDEN: ', ''),
      });
    }

    if (error.message.startsWith('INVALID')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        message: error.message.replace('INVALID: ', ''),
      });
    }

    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'Invalid reorder data',
        details: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
}

/**
 * PATCH /api/jobs/:id/parameters
 * Update job parameters only (without recalculating)
 */
export async function updateJobParameters(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.sub;
    const isAdmin = req.user.role === 'admin';

    const job = await service.updateJobParameters(id, req.body, userId, isAdmin);

    res.status(200).json({
      success: true,
      data: job,
      message: 'Job parameters updated successfully',
    });
  } catch (error) {
    console.error('Update job parameters error:', error);

    if (error.message.startsWith('NOT_FOUND')) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: error.message.replace('NOT_FOUND: ', ''),
      });
    }

    if (error.message.startsWith('FORBIDDEN')) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: error.message.replace('FORBIDDEN: ', ''),
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
}

/**
 * PATCH /api/jobs/:id/calculations
 * Update job calculations (materials, labour, subtotal)
 */
export async function updateJobCalculations(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.sub;
    const isAdmin = req.user.role === 'admin';

    const job = await service.updateJobCalculations(id, req.body, userId, isAdmin);

    res.status(200).json({
      success: true,
      data: job,
      message: 'Job calculations updated successfully',
    });
  } catch (error) {
    console.error('Update job calculations error:', error);

    if (error.message.startsWith('NOT_FOUND')) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: error.message.replace('NOT_FOUND: ', ''),
      });
    }

    if (error.message.startsWith('FORBIDDEN')) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: error.message.replace('FORBIDDEN: ', ''),
      });
    }

    if (error.message.startsWith('INVALID')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        message: error.message.replace('INVALID: ', ''),
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
}

/**
 * GET /api/quotes/:quoteId/jobs/counts
 * Get job counts by type for a quote
 */
export async function getJobCountsByType(req, res) {
  try {
    const { quoteId } = req.params;
    const userId = req.user.sub;
    const isAdmin = req.user.role === 'admin';

    const counts = await service.getJobCountsByType(quoteId, userId, isAdmin);

    res.status(200).json({
      success: true,
      data: counts,
    });
  } catch (error) {
    console.error('Get job counts by type error:', error);

    if (error.message.startsWith('NOT_FOUND')) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: error.message.replace('NOT_FOUND: ', ''),
      });
    }

    if (error.message.startsWith('FORBIDDEN')) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: error.message.replace('FORBIDDEN: ', ''),
      });
    }

    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
}
