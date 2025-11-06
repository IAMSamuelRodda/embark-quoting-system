/**
 * Financial Settings Service
 *
 * Business logic for managing price sheet defaults
 * Handles validation, authorization, and versioning
 */

import * as repository from './settings.repository.js';

/**
 * Get current active settings
 */
export async function getCurrentSettings() {
  const settings = await repository.getCurrentSettings();

  // If no settings exist, return defaults (but don't create yet)
  if (!settings) {
    return {
      id: null,
      version: 0,
      defaults: repository.DEFAULT_SETTINGS,
      created_at: null,
      created_by: null,
      is_default: true,
    };
  }

  return {
    ...settings,
    is_default: false,
  };
}

/**
 * Get settings by ID
 */
export async function getSettingsById(id) {
  const settings = await repository.getSettingsById(id);

  if (!settings) {
    throw new Error('NOT_FOUND: Price sheet not found');
  }

  return settings;
}

/**
 * Get all settings (version history)
 * Admin only
 */
export async function getAllSettings(isAdmin) {
  if (!isAdmin) {
    throw new Error('FORBIDDEN: Only admins can view settings history');
  }

  return await repository.getAllSettings();
}

/**
 * Create new settings version
 * Admin only
 */
export async function createSettings(defaults, userId, isAdmin) {
  if (!isAdmin) {
    throw new Error('FORBIDDEN: Only admins can create price sheets');
  }

  // Validate settings
  const errors = repository.validateSettings(defaults);
  if (errors.length > 0) {
    const error = new Error('Validation failed');
    error.name = 'ValidationError';
    error.errors = errors;
    throw error;
  }

  // Create new version
  const newSettings = await repository.createSettings(defaults, userId);

  console.log(
    `Created price sheet version ${newSettings.version} by user ${userId}`,
  );

  return newSettings;
}

/**
 * Initialize default settings
 * Called during app startup or first admin action
 */
export async function initializeDefaults(userId) {
  return await repository.initializeDefaultSettings(userId);
}

/**
 * Get Profit-First percentages from current settings
 * Helper function for calculation engine
 */
export async function getProfitFirstConfig() {
  const settings = await getCurrentSettings();
  return settings.defaults.profit_first;
}

/**
 * Get GST rate from current settings
 * Helper function for calculation engine
 */
export async function getGstRate() {
  const settings = await getCurrentSettings();
  return settings.defaults.gst;
}

/**
 * Get rounding increment from current settings
 * Helper function for calculation engine
 */
export async function getRoundingIncrement() {
  const settings = await getCurrentSettings();
  return settings.defaults.rounding_increment;
}

/**
 * Get overhead multiplier from current settings
 * Helper function for calculation engine
 */
export async function getOverheadMultiplier() {
  const settings = await getCurrentSettings();
  return settings.defaults.overhead_multiplier;
}

/**
 * Get all calculation parameters
 * Returns everything needed for quote calculations
 */
export async function getCalculationParameters() {
  const settings = await getCurrentSettings();

  return {
    profit_first: settings.defaults.profit_first,
    gst: settings.defaults.gst,
    rounding_increment: settings.defaults.rounding_increment,
    overhead_multiplier: settings.defaults.overhead_multiplier,
    deposit_options: settings.defaults.deposit_options,
    default_deposit: settings.defaults.default_deposit,
  };
}
