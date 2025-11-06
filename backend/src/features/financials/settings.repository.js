/**
 * Financial Settings Repository
 *
 * Data access layer for price sheet defaults (Profit-First configuration)
 * Manages configurable financial parameters used in quote calculations
 */

import { db } from '../../shared/db/postgres.js';
import { priceSheets } from '../../shared/db/schema.js';
import { eq, desc, sql } from 'drizzle-orm';

/**
 * Default financial settings (Profit-First model for <$250K revenue)
 * Source: docs/financial-model.md
 */
export const DEFAULT_SETTINGS = {
  gst: 0.1, // 10% GST (Australia)
  profit_first: {
    profit: 0.05, // 5%
    owner: 0.5, // 50%
    tax: 0.15, // 15%
    opex: 0.3, // 30%
  },
  overhead_multiplier: 1.0, // No markup by default
  deposit_options: [0.2, 0.25, 0.3], // 20%, 25%, 30%
  default_deposit: 0.25, // 25%
  rounding_increment: 10, // Round to nearest $10
  travel_cost_per_km: 2.0, // $2 per km
  dumping_per_load: 150.0, // $150 per load
  access_multiplier: 1.1, // 10% markup for tight access
};

/**
 * Get the current active price sheet (highest version)
 */
export async function getCurrentSettings() {
  const result = await db.select().from(priceSheets).orderBy(desc(priceSheets.version)).limit(1);

  if (result.length === 0) {
    return null;
  }

  return result[0];
}

/**
 * Get price sheet by ID
 */
export async function getSettingsById(id) {
  const result = await db.select().from(priceSheets).where(eq(priceSheets.id, id)).limit(1);

  if (result.length === 0) {
    return null;
  }

  return result[0];
}

/**
 * Get all price sheets (for version history)
 */
export async function getAllSettings() {
  return await db.select().from(priceSheets).orderBy(desc(priceSheets.version));
}

/**
 * Create new price sheet version
 * Returns the newly created price sheet
 */
export async function createSettings(defaults, userId) {
  // Get highest version
  const maxVersionResult = await db
    .select({ maxVersion: sql`COALESCE(MAX(${priceSheets.version}), 0)` })
    .from(priceSheets);

  const nextVersion = Number(maxVersionResult[0].maxVersion) + 1;

  // Insert new version
  const result = await db
    .insert(priceSheets)
    .values({
      version: nextVersion,
      created_by: userId,
      defaults: defaults,
    })
    .returning();

  return result[0];
}

/**
 * Initialize default settings if no price sheets exist
 * Called during app startup or first admin login
 */
export async function initializeDefaultSettings(userId) {
  const current = await getCurrentSettings();

  if (!current) {
    console.log('No price sheets found. Initializing with defaults...');
    return await createSettings(DEFAULT_SETTINGS, userId);
  }

  return current;
}

/**
 * Validate settings structure
 * Ensures all required fields are present and within valid ranges
 */
export function validateSettings(defaults) {
  const errors = [];

  // Required fields
  if (typeof defaults.gst !== 'number' || defaults.gst < 0 || defaults.gst > 1) {
    errors.push('GST rate must be a number between 0 and 1');
  }

  if (!defaults.profit_first) {
    errors.push('profit_first configuration is required');
  } else {
    const { profit, owner, tax, opex } = defaults.profit_first;

    if (
      typeof profit !== 'number' ||
      typeof owner !== 'number' ||
      typeof tax !== 'number' ||
      typeof opex !== 'number'
    ) {
      errors.push('All profit_first percentages must be numbers');
    }

    // Check sum equals 100% (with small tolerance for floating point)
    const sum = (profit + owner + tax + opex).toFixed(2);
    if (Math.abs(sum - 1.0) > 0.01) {
      errors.push(
        `Profit-First percentages must sum to 100% (currently ${(sum * 100).toFixed(1)}%)`,
      );
    }

    // Check all percentages are positive
    if (profit < 0 || owner < 0 || tax < 0 || opex < 0) {
      errors.push('All profit_first percentages must be positive');
    }
  }

  if (typeof defaults.overhead_multiplier !== 'number' || defaults.overhead_multiplier < 1) {
    errors.push('Overhead multiplier must be a number >= 1.0');
  }

  if (!Array.isArray(defaults.deposit_options) || defaults.deposit_options.length === 0) {
    errors.push('At least one deposit option is required');
  } else {
    // Validate each deposit option
    const invalidDeposits = defaults.deposit_options.filter(
      (d) => typeof d !== 'number' || d <= 0 || d > 1,
    );
    if (invalidDeposits.length > 0) {
      errors.push('All deposit options must be numbers between 0 and 1');
    }
  }

  if (
    typeof defaults.default_deposit !== 'number' ||
    defaults.default_deposit <= 0 ||
    defaults.default_deposit > 1
  ) {
    errors.push('Default deposit must be a number between 0 and 1');
  }

  if (typeof defaults.rounding_increment !== 'number' || defaults.rounding_increment <= 0) {
    errors.push('Rounding increment must be a positive number');
  }

  return errors;
}
