/**
 * Quotes Controller
 *
 * HTTP request handlers for quote endpoints
 * Handles request parsing, response formatting, and error handling
 */

import * as service from './quotes.service.js';

// ============================================================================
// QUOTES ENDPOINTS
// ============================================================================

/**
 * GET /api/quotes
 * List all quotes with optional filtering
 */
export async function getAllQuotes(req, res) {
  try {
    const { status, limit, offset } = req.query;
    const userId = req.user.sub;
    const isAdmin = req.user.role === 'admin';

    const filters = {
      status,
      limit: limit ? parseInt(limit, 10) : 100,
      offset: offset ? parseInt(offset, 10) : 0,
    };

    const quotes = await service.getAllQuotes(filters, userId, isAdmin);

    res.status(200).json({
      success: true,
      data: quotes,
      count: quotes.length,
    });
  } catch (error) {
    console.error('Get all quotes error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
}

/**
 * GET /api/quotes/:id
 * Get single quote by ID with all related data
 */
export async function getQuoteById(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.sub;
    const isAdmin = req.user.role === 'admin';

    const quote = await service.getQuoteById(id, userId, isAdmin);

    if (!quote) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: 'Quote not found',
      });
    }

    res.status(200).json({
      success: true,
      data: quote,
    });
  } catch (error) {
    console.error('Get quote by ID error:', error);

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
 * POST /api/quotes
 * Create a new quote
 */
export async function createQuote(req, res) {
  try {
    const quoteData = req.body;
    const userId = req.user.sub;

    const newQuote = await service.createQuote(quoteData, userId);

    res.status(201).json({
      success: true,
      data: newQuote,
      message: 'Quote created successfully',
    });
  } catch (error) {
    console.error('Create quote error:', error);

    // Validation errors
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
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
 * PUT /api/quotes/:id
 * Update an existing quote
 */
export async function updateQuote(req, res) {
  try {
    const { id } = req.params;
    const updates = req.body;
    const userId = req.user.sub;
    const isAdmin = req.user.role === 'admin';

    const updated = await service.updateQuote(id, updates, userId, isAdmin);

    res.status(200).json({
      success: true,
      data: updated,
      message: 'Quote updated successfully',
    });
  } catch (error) {
    console.error('Update quote error:', error);

    // Validation errors
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    }

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
 * DELETE /api/quotes/:id
 * Delete a quote and all related data
 */
export async function deleteQuote(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.sub;
    const isAdmin = req.user.role === 'admin';

    const deleted = await service.deleteQuote(id, userId, isAdmin);

    res.status(200).json({
      success: true,
      data: deleted,
      message: 'Quote deleted successfully',
    });
  } catch (error) {
    console.error('Delete quote error:', error);

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
 * GET /api/quotes/search
 * Search quotes by customer name or quote number
 */
export async function searchQuotes(req, res) {
  try {
    const { q } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Bad request',
        message: 'Search term must be at least 2 characters',
      });
    }

    const userId = req.user.sub;
    const isAdmin = req.user.role === 'admin';

    const results = await service.searchQuotes(q.trim(), userId, isAdmin);

    res.status(200).json({
      success: true,
      data: results,
      count: results.length,
    });
  } catch (error) {
    console.error('Search quotes error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
}

// ============================================================================
// JOBS ENDPOINTS
// ============================================================================

/**
 * POST /api/quotes/:id/jobs
 * Add a job to a quote
 */
export async function addJob(req, res) {
  try {
    const { id } = req.params;
    const jobData = req.body;
    const userId = req.user.sub;
    const isAdmin = req.user.role === 'admin';

    const job = await service.addJob(id, jobData, userId, isAdmin);

    res.status(201).json({
      success: true,
      data: job,
      message: 'Job added successfully',
    });
  } catch (error) {
    console.error('Add job error:', error);

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

// ============================================================================
// FINANCIALS ENDPOINTS
// ============================================================================

/**
 * PUT /api/quotes/:id/financials
 * Create or update financials for a quote
 */
export async function upsertFinancials(req, res) {
  try {
    const { id } = req.params;
    const financialData = req.body;
    const userId = req.user.sub;
    const isAdmin = req.user.role === 'admin';

    const financials = await service.upsertFinancials(
      id,
      financialData,
      userId,
      isAdmin
    );

    res.status(200).json({
      success: true,
      data: financials,
      message: 'Financials updated successfully',
    });
  } catch (error) {
    console.error('Upsert financials error:', error);

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
