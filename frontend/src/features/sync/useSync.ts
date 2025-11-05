/**
 * Sync State Management
 *
 * Zustand store for managing sync status and operations
 * Tracks connection status, sync progress, and errors
 */

import { create } from 'zustand';
import { syncAll, enableAutoSync } from './syncService';
import { connectionMonitor } from '../../shared/utils/connection';
import type { ConnectionState } from '../../shared/utils/connection';
import { getSyncQueueSize } from '../quotes/quotesDb';

export type SyncState = 'idle' | 'syncing' | 'success' | 'error';

interface SyncStore {
  // Connection status
  isOnline: boolean;
  connectionState: ConnectionState | null;

  // Sync status
  syncState: SyncState;
  lastSyncAt: Date | null;
  pendingChanges: number;

  // Sync results
  pushedCount: number;
  pulledCount: number;
  errors: string[];

  // Actions
  sync: () => Promise<void>;
  refreshPendingCount: () => Promise<void>;
  clearErrors: () => void;
  initialize: () => void;
}

export const useSync = create<SyncStore>((set, get) => ({
  // Initial state
  isOnline: navigator.onLine,
  connectionState: null,
  syncState: 'idle',
  lastSyncAt: null,
  pendingChanges: 0,
  pushedCount: 0,
  pulledCount: 0,
  errors: [],

  // Trigger manual sync
  sync: async () => {
    if (!get().isOnline) {
      set({
        syncState: 'error',
        errors: ['Cannot sync while offline'],
      });
      return;
    }

    set({ syncState: 'syncing', errors: [] });

    try {
      const result = await syncAll();

      if (result.success) {
        set({
          syncState: 'success',
          lastSyncAt: new Date(),
          pushedCount: result.pushedCount,
          pulledCount: result.pulledCount,
          errors: [],
        });

        // Refresh pending count
        await get().refreshPendingCount();

        // Reset to idle after 3 seconds
        setTimeout(() => {
          set({ syncState: 'idle' });
        }, 3000);
      } else {
        set({
          syncState: 'error',
          errors: result.errors,
          pushedCount: result.pushedCount,
          pulledCount: result.pulledCount,
        });
      }
    } catch (error) {
      console.error('Sync failed:', error);
      set({
        syncState: 'error',
        errors: [error instanceof Error ? error.message : 'Sync failed'],
      });
    }
  },

  // Refresh pending changes count
  refreshPendingCount: async () => {
    try {
      const count = await getSyncQueueSize();
      set({ pendingChanges: count });
    } catch (error) {
      console.error('Failed to get pending count:', error);
    }
  },

  // Clear errors
  clearErrors: () => set({ errors: [], syncState: 'idle' }),

  // Initialize sync system
  initialize: () => {
    // Subscribe to connection changes
    const unsubscribeConnection = connectionMonitor.subscribe((connectionState) => {
      set({
        isOnline: connectionState.isOnline,
        connectionState,
      });
    });

    // Enable auto-sync on connection restore
    const unsubscribeAutoSync = enableAutoSync();

    // Initial pending count
    get().refreshPendingCount();

    // Store cleanup functions
    (window as Window & { __syncCleanup?: () => void }).__syncCleanup = () => {
      unsubscribeConnection();
      unsubscribeAutoSync();
    };
  },
}));
