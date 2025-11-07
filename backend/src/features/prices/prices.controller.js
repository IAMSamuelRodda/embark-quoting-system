/**
 * Prices Controller
 *
 * HTTP request handlers for price management endpoints
 * Handles request parsing, response formatting, and error handling
 */

import * as service from './prices.service.js';

// ============================================================================
// PRICE SHEETS
// ============================================================================

/**
 * GET /api/prices/active
 * Get the currently active price sheet with all items
 * Authorization: Admin only
 */
export async function getActivePriceSheet(req, res) {
  try {
    const sheet = await service.getActivePriceSheet();

    res.status(200).json({
      success: true,
      data: sheet,
    });
  } catch (error) {
    console.error('Get active price sheet error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
}

/**
 * GET /api/prices/sheets/:id
 * Get a specific price sheet by ID
 * Authorization: Admin only
 */
export async function getPriceSheetById(req, res) {
  try {
    const { id } = req.params;
    const sheet = await service.getPriceSheetById(id);

    res.status(200).json({
      success: true,
      data: sheet,
    });
  } catch (error) {
    console.error('Get price sheet error:', error);
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: statusCode === 404 ? 'Not found' : 'Internal server error',
      message: error.message,
    });
  }
}

/**
 * GET /api/prices/history
 * Get price sheet version history
 * Authorization: Admin only
 */
export async function getPriceSheetHistory(req, res) {
  try {
    const { limit } = req.query;
    const history = await service.getPriceSheetHistory(limit ? parseInt(limit, 10) : 10);

    res.status(200).json({
      success: true,
      data: history,
      count: history.length,
    });
  } catch (error) {
    console.error('Get price sheet history error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
}

/**
 * POST /api/prices/sheets
 * Create a new price sheet version
 * Authorization: Admin only
 * Body: { defaults, items: [{ name, price, unit, notes }] }
 */
export async function createPriceSheetVersion(req, res) {
  try {
    const userId = req.user.sub;
    const { defaults, items } = req.body;

    // Validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Items array is required and must not be empty',
      });
    }

    // Validate each item
    for (const item of items) {
      if (!item.name || typeof item.name !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: 'Each item must have a name (string)',
        });
      }
      if (item.price === undefined || typeof item.price !== 'number') {
        return res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: 'Each item must have a price (number)',
        });
      }
      if (!item.unit || typeof item.unit !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Bad Request',
          message: 'Each item must have a unit (string)',
        });
      }
    }

    const sheet = await service.createPriceSheetVersion({
      created_by: userId,
      defaults: defaults || {},
      items,
    });

    res.status(201).json({
      success: true,
      data: sheet,
      message: `Price sheet version ${sheet.version} created successfully`,
    });
  } catch (error) {
    console.error('Create price sheet error:', error);
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: statusCode === 404 ? 'Not found' : 'Internal server error',
      message: error.message,
    });
  }
}

// ============================================================================
// PRICE ITEMS
// ============================================================================

/**
 * PUT /api/prices/items/:id
 * Update a single price item (creates new price sheet version)
 * Authorization: Admin only
 * Body: { price, unit, notes }
 */
export async function updatePriceItem(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.sub;
    const updates = req.body;

    // Validation
    if (updates.price !== undefined && typeof updates.price !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Price must be a number',
      });
    }

    const newSheet = await service.updatePriceItem(id, updates, userId);

    res.status(200).json({
      success: true,
      data: newSheet,
      message: `Price item updated. New price sheet version ${newSheet.version} created.`,
    });
  } catch (error) {
    console.error('Update price item error:', error);
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: statusCode === 404 ? 'Not found' : 'Internal server error',
      message: error.message,
    });
  }
}

/**
 * POST /api/prices/items
 * Add a new price item (creates new price sheet version)
 * Authorization: Admin only
 * Body: { name, price, unit, notes }
 */
export async function addPriceItem(req, res) {
  try {
    const userId = req.user.sub;
    const { name, price, unit, notes } = req.body;

    // Validation
    if (!name || typeof name !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Name is required (string)',
      });
    }
    if (price === undefined || typeof price !== 'number') {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Price is required (number)',
      });
    }
    if (!unit || typeof unit !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Unit is required (string)',
      });
    }

    const newSheet = await service.addPriceItem({ name, price, unit, notes }, userId);

    res.status(201).json({
      success: true,
      data: newSheet,
      message: `Price item added. New price sheet version ${newSheet.version} created.`,
    });
  } catch (error) {
    console.error('Add price item error:', error);
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: statusCode === 404 ? 'Not found' : 'Internal server error',
      message: error.message,
    });
  }
}

/**
 * DELETE /api/prices/items/:id
 * Remove a price item (creates new price sheet version)
 * Authorization: Admin only
 */
export async function removePriceItem(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.sub;

    const newSheet = await service.removePriceItem(id, userId);

    res.status(200).json({
      success: true,
      data: newSheet,
      message: `Price item removed. New price sheet version ${newSheet.version} created.`,
    });
  } catch (error) {
    console.error('Remove price item error:', error);
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: statusCode === 404 ? 'Not found' : 'Internal server error',
      message: error.message,
    });
  }
}
