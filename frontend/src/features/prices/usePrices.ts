/**
 * Prices State Management - Zustand Hook
 *
 * Manages price sheet state including:
 * - Active price sheet and items
 * - Version history
 * - CRUD operations for price items
 * - Loading and error states
 */

import { create } from 'zustand';
import api from '../../shared/api/apiClient';
import type { PriceSheet, PriceItem } from '../../shared/types/models';

interface PriceSheetWithItems extends PriceSheet {
  items: PriceItem[];
}

interface PricesState {
  // Data
  activePriceSheet: PriceSheetWithItems | null;
  history: PriceSheet[];

  // UI State
  loading: boolean;
  error: string | null;

  // Actions
  fetchActive: () => Promise<void>;
  fetchHistory: () => Promise<void>;
  updateItem: (itemId: string, updates: Partial<PriceItem>) => Promise<void>;
  addItem: (data: Omit<PriceItem, 'id' | 'price_sheet_id'>) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearError: () => void;
}

export const usePrices = create<PricesState>((set, get) => ({
  // Initial state
  activePriceSheet: null,
  history: [],
  loading: false,
  error: null,

  // Fetch active price sheet with items
  fetchActive: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get<PriceSheetWithItems>('/api/prices/active');
      if (response.success && response.data) {
        set({ activePriceSheet: response.data, loading: false });
      } else {
        throw new Error(response.error || 'Failed to fetch active price sheet');
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load active price sheet',
        loading: false,
      });
      throw error;
    }
  },

  // Fetch price sheet version history
  fetchHistory: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get<PriceSheet[]>('/api/prices/history');
      if (response.success && response.data) {
        set({ history: response.data, loading: false });
      } else {
        throw new Error(response.error || 'Failed to fetch price sheet history');
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load price sheet history',
        loading: false,
      });
      throw error;
    }
  },

  // Update a price item
  updateItem: async (itemId: string, updates: Partial<PriceItem>) => {
    set({ loading: true, error: null });
    try {
      const response = await api.put<PriceItem>(`/api/prices/items/${itemId}`, updates);
      if (response.success && response.data) {
        // Update the item in the active price sheet
        const { activePriceSheet } = get();
        if (activePriceSheet) {
          const updatedItems = activePriceSheet.items.map((item) =>
            item.id === itemId ? { ...item, ...updates } : item,
          );
          set({
            activePriceSheet: {
              ...activePriceSheet,
              items: updatedItems,
            },
            loading: false,
          });
        } else {
          set({ loading: false });
        }
      } else {
        throw new Error(response.error || 'Failed to update price item');
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update price item',
        loading: false,
      });
      throw error;
    }
  },

  // Add a new price item
  addItem: async (data: Omit<PriceItem, 'id' | 'price_sheet_id'>) => {
    set({ loading: true, error: null });
    try {
      const { activePriceSheet } = get();
      if (!activePriceSheet) {
        throw new Error('No active price sheet');
      }

      const response = await api.post<PriceItem>('/api/prices/items', {
        ...data,
        price_sheet_id: activePriceSheet.id,
      });

      if (response.success && response.data) {
        // Add the new item to the active price sheet
        set({
          activePriceSheet: {
            ...activePriceSheet,
            items: [...activePriceSheet.items, response.data],
          },
          loading: false,
        });
      } else {
        throw new Error(response.error || 'Failed to add price item');
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to add price item',
        loading: false,
      });
      throw error;
    }
  },

  // Remove a price item
  removeItem: async (itemId: string) => {
    set({ loading: true, error: null });
    try {
      const response = await api.delete<{ success: boolean }>(`/api/prices/items/${itemId}`);
      if (response.success) {
        // Remove the item from the active price sheet
        const { activePriceSheet } = get();
        if (activePriceSheet) {
          const updatedItems = activePriceSheet.items.filter((item) => item.id !== itemId);
          set({
            activePriceSheet: {
              ...activePriceSheet,
              items: updatedItems,
            },
            loading: false,
          });
        } else {
          set({ loading: false });
        }
      } else {
        throw new Error(response.error || 'Failed to remove price item');
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to remove price item',
        loading: false,
      });
      throw error;
    }
  },

  // Clear error
  clearError: () => set({ error: null }),
}));
