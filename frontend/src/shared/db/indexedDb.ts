/**
 * IndexedDB Configuration with Dexie.js
 *
 * Offline-first local database for quotes, jobs, and sync management
 * Matches PostgreSQL schema from BLUEPRINT.yaml
 */

import Dexie, { type Table } from 'dexie';
import type {
  Quote,
  Job,
  Financial,
  QuoteVersion,
  ChangeLogItem,
  PriceSheet,
  PriceItem,
} from '../types/models';
import type { EnhancedSyncQueueItem } from '../../features/sync/syncQueue';

/**
 * Embark Quoting System Database
 *
 * IndexedDB stores with proper indexes for offline-first functionality
 */
export class EmbarkDatabase extends Dexie {
  // Tables
  quotes!: Table<Quote, string>;
  jobs!: Table<Job, string>;
  financials!: Table<Financial, string>;
  quoteVersions!: Table<QuoteVersion, string>;
  syncQueue!: Table<EnhancedSyncQueueItem, string>;
  changeLog!: Table<ChangeLogItem, string>;
  priceSheets!: Table<PriceSheet, string>;
  priceItems!: Table<PriceItem, string>;

  constructor() {
    super('EmbarkQuotingDB');

    // Database version 1 schema
    this.version(1).stores({
      // Quotes table
      // Indexes: quote_number, status, updated_at, sync_status
      quotes: `
        id,
        quote_number,
        status,
        user_id,
        updated_at,
        sync_status,
        created_at
      `,

      // Jobs table
      // Indexes: quote_id, job_type, order_index, sync_status
      jobs: `
        id,
        quote_id,
        job_type,
        order_index,
        sync_status,
        created_at,
        updated_at
      `,

      // Financials table (one per quote)
      // Primary key: quote_id
      financials: `
        quote_id
      `,

      // Quote versions (for version history and conflict resolution)
      // Indexes: quote_id, version, created_at
      quoteVersions: `
        id,
        quote_id,
        version,
        user_id,
        created_at
      `,

      // Sync queue (pending changes to sync to server)
      // Indexes: quote_id, timestamp, operation
      syncQueue: `
        id,
        quote_id,
        operation,
        timestamp
      `,

      // Change log (for conflict detection)
      // Indexes: quote_id, timestamp, field_name
      changeLog: `
        id,
        quote_id,
        field_name,
        timestamp
      `,

      // Price sheets (material/labour pricing)
      // Indexes: version, created_at
      priceSheets: `
        id,
        version,
        created_by,
        created_at
      `,

      // Price items (individual prices)
      // Indexes: price_sheet_id, name
      priceItems: `
        id,
        price_sheet_id,
        name
      `,
    });

    // Database version 2 schema: Enhanced sync queue with priority and backoff
    this.version(2).stores({
      // Sync queue with priority and dead-letter support
      // Indexes: priority, dead_letter, next_retry_at, timestamp
      syncQueue: `
        id,
        quote_id,
        operation,
        priority,
        dead_letter,
        next_retry_at,
        timestamp
      `,
    });

    // Hooks: Auto-populate timestamps and IDs
    this.quotes.hook('creating', (_primKey, obj) => {
      if (!obj.created_at) obj.created_at = new Date();
      if (!obj.updated_at) obj.updated_at = new Date();
      if (!obj.version) obj.version = 1;
      if (!obj.device_id) obj.device_id = getDeviceId();
    });

    this.quotes.hook('updating', (modifications) => {
      return { ...modifications, updated_at: new Date() };
    });

    this.jobs.hook('creating', (_primKey, obj) => {
      if (!obj.id) obj.id = crypto.randomUUID();
      if (!obj.created_at) obj.created_at = new Date();
      if (!obj.updated_at) obj.updated_at = new Date();
      if (!obj.device_id) obj.device_id = getDeviceId();
      if (!obj.sync_status) obj.sync_status = 'pending';
    });

    this.jobs.hook('updating', (modifications) => {
      return { ...modifications, updated_at: new Date() };
    });

    this.syncQueue.hook('creating', (_primKey, obj) => {
      if (!obj.id) obj.id = crypto.randomUUID();
      if (!obj.timestamp) obj.timestamp = new Date();
      if (!obj.retry_count) obj.retry_count = 0;
      if (obj.priority === undefined) obj.priority = 3; // Default to NORMAL priority
      if (obj.dead_letter === undefined) obj.dead_letter = false;
    });

    this.changeLog.hook('creating', (_primKey, obj) => {
      if (!obj.id) obj.id = crypto.randomUUID();
      if (!obj.timestamp) obj.timestamp = new Date();
      if (!obj.device_id) obj.device_id = getDeviceId();
    });
  }

  /**
   * Clear all local data (for testing or logout)
   */
  async clearAllData(): Promise<void> {
    await Promise.all([
      this.quotes.clear(),
      this.jobs.clear(),
      this.financials.clear(),
      this.quoteVersions.clear(),
      this.syncQueue.clear(),
      this.changeLog.clear(),
    ]);
  }

  /**
   * Get sync queue size (pending changes ready to sync)
   * Only counts items that are:
   * - Not in dead-letter queue (dead_letter = 0 or false)
   * - Past their retry time (next_retry_at <= now or null)
   */
  async getSyncQueueSize(): Promise<number> {
    const now = new Date();

    // Get all active items (not in dead-letter queue)
    // Handle both boolean false and number 0 for dead_letter field
    const allItems = await this.syncQueue.toArray();
    console.log(`[getSyncQueueSize] Total items in queue: ${allItems.length}`);

    // Filter to only items ready for sync (not dead-letter, past retry time)
    const readyItems = allItems.filter((item) => {
      // Exclude dead-letter items (truthy values - handle both boolean and number)
      if (item.dead_letter) {
        console.log(`[getSyncQueueSize] Excluding dead-letter item ${item.id}`);
        return false;
      }

      // Include items with no retry time or past retry time
      if (!item.next_retry_at) {
        console.log(`[getSyncQueueSize] Including item ${item.id} (no retry time)`);
        return true;
      }
      const isReady = new Date(item.next_retry_at) <= now;
      console.log(`[getSyncQueueSize] Item ${item.id} retry check: ${isReady} (next_retry_at: ${item.next_retry_at})`);
      return isReady;
    });

    console.log(`[getSyncQueueSize] Ready items: ${readyItems.length}`);
    return readyItems.length;
  }

  /**
   * Get all quotes with sync pending
   */
  async getQuotesNeedingSync(): Promise<Quote[]> {
    return await this.quotes
      .where('sync_status')
      .equals('pending')
      .or('sync_status')
      .equals('error')
      .toArray();
  }
}

/**
 * Get or create device ID for sync tracking
 * Stored in localStorage to persist across sessions
 */
function getDeviceId(): string {
  const DEVICE_ID_KEY = 'embark_device_id';
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);

  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }

  return deviceId;
}

// Singleton database instance
export const db = new EmbarkDatabase();

// Export for convenience
export { getDeviceId };
