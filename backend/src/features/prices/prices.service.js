/**
 * Prices Service
 *
 * Business logic for price management
 * Handles price updates, versioning, and notifications
 */

import * as repository from './prices.repository.js';
import { db } from '../../shared/db/postgres.js';
import { users } from '../../shared/db/schema.js';
import { eq } from 'drizzle-orm';

// ============================================================================
// PRICE SHEETS
// ============================================================================

/**
 * Get the currently active price sheet
 * @returns {Promise<Object>} Active price sheet with items
 */
export async function getActivePriceSheet() {
  const sheet = await repository.getLatestPriceSheet();
  if (!sheet) {
    throw new Error('No price sheet found. Please create the initial price sheet.');
  }
  return sheet;
}

/**
 * Get price sheet by ID
 * @param {string} sheetId - Price sheet UUID
 * @returns {Promise<Object>} Price sheet with items
 */
export async function getPriceSheetById(sheetId) {
  const sheet = await repository.getPriceSheetById(sheetId);
  if (!sheet) {
    throw new Error(`Price sheet not found: ${sheetId}`);
  }
  return sheet;
}

/**
 * Get price sheet version history
 * @param {number} [limit=10] - Limit results
 * @returns {Promise<Array>} Array of price sheets
 */
export async function getPriceSheetHistory(limit = 10) {
  return await repository.getPriceSheetHistory(limit);
}

/**
 * Create a new price sheet version
 * Used when making bulk price changes or creating initial sheet
 *
 * @param {Object} data - Price sheet data
 * @param {string} data.created_by - User UUID
 * @param {Object} data.defaults - Default values (JSONB)
 * @param {Array<Object>} data.items - Array of price items
 * @param {boolean} [sendNotifications=true] - Whether to send email notifications
 * @returns {Promise<Object>} Created price sheet with items
 */
export async function createPriceSheetVersion(data, sendNotifications = true) {
  const { created_by, defaults, items } = data;

  // Validate user exists
  const [user] = await db.select().from(users).where(eq(users.id, created_by)).limit(1);
  if (!user) {
    throw new Error(`User not found: ${created_by}`);
  }

  // Create new price sheet
  const sheet = await repository.createPriceSheet({
    created_by,
    defaults: defaults || {},
  });

  // Create price items for this sheet
  if (items && items.length > 0) {
    const itemsData = items.map((item) => ({
      ...item,
      price_sheet_id: sheet.id,
      last_checked: item.last_checked || new Date(),
    }));
    await repository.bulkCreatePriceItems(itemsData);
  }

  // Get the complete sheet with items
  const completeSheet = await repository.getPriceSheetById(sheet.id);

  // Send notifications to all users about price change (async, don't block)
  if (sendNotifications && sheet.version > 1) {
    notifyPriceChange(completeSheet).catch((err) =>
      console.error('Failed to send price change notifications:', err),
    );
  }

  return completeSheet;
}

// ============================================================================
// PRICE ITEMS
// ============================================================================

/**
 * Update a single price item
 * Creates a new price sheet version with the updated item
 *
 * @param {string} itemId - Price item UUID
 * @param {Object} updates - Fields to update
 * @param {string} userId - User making the change
 * @returns {Promise<Object>} New price sheet with updated item
 */
export async function updatePriceItem(itemId, updates, userId) {
  // Get the current active price sheet
  const currentSheet = await repository.getLatestPriceSheet();
  if (!currentSheet) {
    throw new Error('No active price sheet found');
  }

  // Find the item to update
  const itemToUpdate = currentSheet.items.find((item) => item.id === itemId);
  if (!itemToUpdate) {
    throw new Error(`Price item not found in active sheet: ${itemId}`);
  }

  // Create new price sheet version with all items
  const newItems = currentSheet.items.map((item) => ({
    name: item.name,
    price: item.id === itemId ? updates.price || item.price : item.price,
    unit: item.id === itemId ? updates.unit || item.unit : item.unit,
    last_checked: item.id === itemId ? new Date() : item.last_checked,
    notes:
      item.id === itemId ? (updates.notes !== undefined ? updates.notes : item.notes) : item.notes,
  }));

  return await createPriceSheetVersion(
    {
      created_by: userId,
      defaults: currentSheet.defaults,
      items: newItems,
    },
    true, // Send notifications
  );
}

/**
 * Add a new price item to the active sheet
 * Creates a new price sheet version with the new item
 *
 * @param {Object} itemData - Price item data
 * @param {string} itemData.name - Item name
 * @param {number} itemData.price - Item price
 * @param {string} itemData.unit - Item unit
 * @param {string} [itemData.notes] - Notes
 * @param {string} userId - User making the change
 * @returns {Promise<Object>} New price sheet with new item
 */
export async function addPriceItem(itemData, userId) {
  // Get the current active price sheet
  const currentSheet = await repository.getLatestPriceSheet();
  if (!currentSheet) {
    throw new Error('No active price sheet found');
  }

  // Create new price sheet version with all items plus new one
  const newItems = [
    ...currentSheet.items.map((item) => ({
      name: item.name,
      price: item.price,
      unit: item.unit,
      last_checked: item.last_checked,
      notes: item.notes,
    })),
    {
      name: itemData.name,
      price: itemData.price,
      unit: itemData.unit,
      last_checked: new Date(),
      notes: itemData.notes || null,
    },
  ];

  return await createPriceSheetVersion(
    {
      created_by: userId,
      defaults: currentSheet.defaults,
      items: newItems,
    },
    true, // Send notifications
  );
}

/**
 * Remove a price item from the active sheet
 * Creates a new price sheet version without the item
 *
 * @param {string} itemId - Price item UUID
 * @param {string} userId - User making the change
 * @returns {Promise<Object>} New price sheet without the removed item
 */
export async function removePriceItem(itemId, userId) {
  // Get the current active price sheet
  const currentSheet = await repository.getLatestPriceSheet();
  if (!currentSheet) {
    throw new Error('No active price sheet found');
  }

  // Filter out the item to remove
  const newItems = currentSheet.items
    .filter((item) => item.id !== itemId)
    .map((item) => ({
      name: item.name,
      price: item.price,
      unit: item.unit,
      last_checked: item.last_checked,
      notes: item.notes,
    }));

  if (newItems.length === currentSheet.items.length) {
    throw new Error(`Price item not found in active sheet: ${itemId}`);
  }

  return await createPriceSheetVersion(
    {
      created_by: userId,
      defaults: currentSheet.defaults,
      items: newItems,
    },
    true, // Send notifications
  );
}

// ============================================================================
// NOTIFICATIONS
// ============================================================================

/**
 * Send price change notifications to all users
 * TODO: Implement AWS SES integration
 *
 * @param {Object} newSheet - New price sheet with items
 * @returns {Promise<void>}
 */
async function notifyPriceChange(newSheet) {
  // Get all users to notify
  const allUsers = await db.select({ email: users.email, name: users.name }).from(users);

  console.log(`[Price Change Notification] Version ${newSheet.version} created`);
  console.log(`[Price Change Notification] Would notify ${allUsers.length} users`);
  console.log(`[Price Change Notification] Item count: ${newSheet.items.length}`);

  // TODO: Implement AWS SES email sending
  // For now, just log the notification
  // In production, this will send emails via AWS SES
  // See Feature 6.2 for email template implementation

  /*
  const emailService = require('../../shared/services/email.service.js');
  const emailPromises = allUsers.map(user =>
    emailService.sendPriceChangeNotification({
      to: user.email,
      userName: user.name,
      priceSheetVersion: newSheet.version,
      itemCount: newSheet.items.length,
      createdAt: newSheet.created_at,
    })
  );
  await Promise.allSettled(emailPromises);
  */
}
