/**
 * Financial Settings Controller
 *
 * HTTP request handlers for price sheet defaults endpoints
 * Handles admin-only operations for configuring financial parameters
 */

import * as service from './settings.service.js';

/**
 * GET /api/settings
 * Get current active settings
 * Available to all authenticated users
 */
export async function getCurrentSettings(req, res) {
  try {
    const settings = await service.getCurrentSettings();

    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Get current settings error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
}

/**
 * GET /api/settings/:id
 * Get settings by ID
 * Admin only
 */
export async function getSettingsById(req, res) {
  try {
    const { id } = req.params;
    const isAdmin = req.user.role === 'admin';

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Only admins can view historical price sheets',
      });
    }

    const settings = await service.getSettingsById(id);

    res.status(200).json({
      success: true,
      data: settings,
    });
  } catch (error) {
    console.error('Get settings by ID error:', error);

    if (error.message.startsWith('NOT_FOUND')) {
      return res.status(404).json({
        success: false,
        error: 'Not found',
        message: error.message.replace('NOT_FOUND: ', ''),
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
 * GET /api/settings/history
 * Get all settings versions
 * Admin only
 */
export async function getAllSettings(req, res) {
  try {
    const isAdmin = req.user.role === 'admin';

    const settings = await service.getAllSettings(isAdmin);

    res.status(200).json({
      success: true,
      data: settings,
      count: settings.length,
    });
  } catch (error) {
    console.error('Get all settings error:', error);

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
 * POST /api/settings
 * Create new settings version
 * Admin only
 */
export async function createSettings(req, res) {
  try {
    const defaults = req.body;
    const userId = req.user.sub;
    const isAdmin = req.user.role === 'admin';

    const newSettings = await service.createSettings(defaults, userId, isAdmin);

    res.status(201).json({
      success: true,
      data: newSettings,
      message: 'Settings created successfully',
    });
  } catch (error) {
    console.error('Create settings error:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
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
 * GET /api/settings/parameters
 * Get all calculation parameters
 * Helper endpoint for frontend
 * Available to all authenticated users
 */
export async function getCalculationParameters(req, res) {
  try {
    const parameters = await service.getCalculationParameters();

    res.status(200).json({
      success: true,
      data: parameters,
    });
  } catch (error) {
    console.error('Get calculation parameters error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
    });
  }
}
