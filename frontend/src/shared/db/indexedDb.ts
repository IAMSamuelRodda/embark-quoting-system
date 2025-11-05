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
  SyncQueueItem,
  ChangeLogItem,
  PriceSheet,
  PriceItem,
} from '../types/models';

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
  syncQueue!: Table<SyncQueueItem, string>;
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
      // Indexes: quote_id, job_type, order_index
      jobs: `
        id,
        quote_id,
        job_type,
        order_index
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
    });

    this.syncQueue.hook('creating', (_primKey, obj) => {
      if (!obj.id) obj.id = crypto.randomUUID();
      if (!obj.timestamp) obj.timestamp = new Date();
      if (!obj.retry_count) obj.retry_count = 0;
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
   * Get sync queue size (pending changes)
   */
  async getSyncQueueSize(): Promise<number> {
    return await this.syncQueue.count();
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
