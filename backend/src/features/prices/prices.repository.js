/**
 * Prices Repository
 *
 * Data access layer for price sheets and price items using Drizzle ORM
 * Handles all database operations for price management
 */

import { db } from '../../shared/db/postgres.js';
import { priceSheets, priceItems, users } from '../../shared/db/schema.js';
import { eq, desc } from 'drizzle-orm';

// ============================================================================
// PRICE SHEETS
// ============================================================================

/**
 * Get the latest (active) price sheet with all items
 * @returns {Promise<Object|null>} Latest price sheet with items
 */
export async function getLatestPriceSheet() {
  const [sheet] = await db
    .select({
      id: priceSheets.id,
      version: priceSheets.version,
      created_by: priceSheets.created_by,
      defaults: priceSheets.defaults,
      created_at: priceSheets.created_at,
      creator_name: users.name,
      creator_email: users.email,
    })
    .from(priceSheets)
    .leftJoin(users, eq(priceSheets.created_by, users.id))
    .orderBy(desc(priceSheets.version))
    .limit(1);

  if (!sheet) {
    return null;
  }

  // Get all items for this sheet
  const items = await db
    .select()
    .from(priceItems)
    .where(eq(priceItems.price_sheet_id, sheet.id))
    .orderBy(priceItems.name);

  return {
    ...sheet,
    items,
  };
}

/**
 * Get price sheet by ID with all items
 * @param {string} sheetId - Price sheet UUID
 * @returns {Promise<Object|null>} Price sheet with items
 */
export async function getPriceSheetById(sheetId) {
  const [sheet] = await db
    .select({
      id: priceSheets.id,
      version: priceSheets.version,
      created_by: priceSheets.created_by,
      defaults: priceSheets.defaults,
      created_at: priceSheets.created_at,
      creator_name: users.name,
      creator_email: users.email,
    })
    .from(priceSheets)
    .leftJoin(users, eq(priceSheets.created_by, users.id))
    .where(eq(priceSheets.id, sheetId));

  if (!sheet) {
    return null;
  }

  // Get all items for this sheet
  const items = await db
    .select()
    .from(priceItems)
    .where(eq(priceItems.price_sheet_id, sheet.id))
    .orderBy(priceItems.name);

  return {
    ...sheet,
    items,
  };
}

/**
 * Get price sheet version history
 * @param {number} [limit=10] - Limit results
 * @returns {Promise<Array>} Array of price sheets (without items)
 */
export async function getPriceSheetHistory(limit = 10) {
  return await db
    .select({
      id: priceSheets.id,
      version: priceSheets.version,
      created_by: priceSheets.created_by,
      created_at: priceSheets.created_at,
      creator_name: users.name,
      creator_email: users.email,
      // Count items in this sheet
      item_count: db
        .select({ count: priceItems.id })
        .from(priceItems)
        .where(eq(priceItems.price_sheet_id, priceSheets.id)),
    })
    .from(priceSheets)
    .leftJoin(users, eq(priceSheets.created_by, users.id))
    .orderBy(desc(priceSheets.version))
    .limit(limit);
}

/**
 * Create a new price sheet (version increment)
 * @param {Object} sheetData - Price sheet data
 * @param {string} sheetData.created_by - User UUID
 * @param {Object} sheetData.defaults - Default values (JSONB)
 * @returns {Promise<Object>} Created price sheet
 */
export async function createPriceSheet(sheetData) {
  // Get the current max version
  const [maxVersion] = await db
    .select({ max: priceSheets.version })
    .from(priceSheets)
    .orderBy(desc(priceSheets.version))
    .limit(1);

  const nextVersion = maxVersion?.max ? maxVersion.max + 1 : 1;

  const [sheet] = await db
    .insert(priceSheets)
    .values({
      ...sheetData,
      version: nextVersion,
    })
    .returning();

  return sheet;
}

// ============================================================================
// PRICE ITEMS
// ============================================================================

/**
 * Get all price items for a price sheet
 * @param {string} sheetId - Price sheet UUID
 * @returns {Promise<Array>} Array of price items
 */
export async function getPriceItemsBySheetId(sheetId) {
  return await db
    .select()
    .from(priceItems)
    .where(eq(priceItems.price_sheet_id, sheetId))
    .orderBy(priceItems.name);
}

/**
 * Get a single price item by ID
 * @param {string} itemId - Price item UUID
 * @returns {Promise<Object|null>} Price item
 */
export async function getPriceItemById(itemId) {
  const [item] = await db.select().from(priceItems).where(eq(priceItems.id, itemId));
  return item || null;
}

/**
 * Create a new price item
 * @param {Object} itemData - Price item data
 * @param {string} itemData.price_sheet_id - Price sheet UUID
 * @param {string} itemData.name - Item name
 * @param {number} itemData.price - Item price
 * @param {string} itemData.unit - Item unit (e.g., "per m³", "per load")
 * @param {Date} [itemData.last_checked] - Last checked date
 * @param {string} [itemData.notes] - Notes
 * @returns {Promise<Object>} Created price item
 */
export async function createPriceItem(itemData) {
  const [item] = await db.insert(priceItems).values(itemData).returning();
  return item;
}

/**
 * Update a price item
 * @param {string} itemId - Price item UUID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object|null>} Updated price item
 */
export async function updatePriceItem(itemId, updates) {
  const [item] = await db
    .update(priceItems)
    .set(updates)
    .where(eq(priceItems.id, itemId))
    .returning();
  return item || null;
}

/**
 * Delete a price item
 * @param {string} itemId - Price item UUID
 * @returns {Promise<Object|null>} Deleted price item
 */
export async function deletePriceItem(itemId) {
  const [item] = await db.delete(priceItems).where(eq(priceItems.id, itemId)).returning();
  return item || null;
}

/**
 * Bulk create price items
 * @param {Array<Object>} itemsData - Array of price item data
 * @returns {Promise<Array>} Created price items
 */
export async function bulkCreatePriceItems(itemsData) {
  return await db.insert(priceItems).values(itemsData).returning();
}
