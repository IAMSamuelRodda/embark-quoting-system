import { create } from 'zustand';
import {
  getAllQuotes,
  searchQuotes,
  getQuotesByStatus,
  createQuote,
  getQuoteWithDetails,
  updateQuote,
  deleteQuote,
  getSyncQueueSize,
} from './quotesDb';
import type {
  QuoteListItem,
  QuoteWithDetails,
  Quote,
  QuoteStatus,
} from '../../shared/types/models';

interface QuotesState {
  // Data
  quotes: QuoteListItem[];
  selectedQuote: QuoteWithDetails | null;
  syncQueueSize: number;

  // UI State
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  statusFilter: QuoteStatus | 'all';

  // Actions
  loadQuotes: () => Promise<void>;
  searchQuotesAction: (query: string) => Promise<void>;
  filterByStatus: (status: QuoteStatus | 'all') => Promise<void>;
  createNewQuote: (data: Partial<Quote>) => Promise<Quote>;
  loadQuoteDetails: (id: string) => Promise<void>;
  updateQuoteAction: (id: string, updates: Partial<Quote>) => Promise<void>;
  deleteQuoteAction: (id: string) => Promise<void>;
  refreshSyncStatus: () => Promise<void>;
  clearError: () => void;
  clearSelectedQuote: () => void;
  setSearchQuery: (query: string) => void;
}

export const useQuotes = create<QuotesState>((set, get) => ({
  // Initial state
  quotes: [],
  selectedQuote: null,
  syncQueueSize: 0,
  isLoading: false,
  error: null,
  searchQuery: '',
  statusFilter: 'all',

  // Load all quotes
  loadQuotes: async () => {
    set({ isLoading: true, error: null });
    try {
      const quotes = await getAllQuotes();
      const syncQueueSize = await getSyncQueueSize();
      set({ quotes, syncQueueSize, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load quotes',
        isLoading: false,
      });
      throw error;
    }
  },

  // Search quotes
  searchQuotesAction: async (query: string) => {
    set({ isLoading: true, error: null, searchQuery: query });
    try {
      if (query.trim() === '') {
        // If empty query, load all quotes
        const quotes = await getAllQuotes();
        set({ quotes, isLoading: false });
      } else {
        const quotes = await searchQuotes(query);
        set({ quotes, isLoading: false });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to search quotes',
        isLoading: false,
      });
      throw error;
    }
  },

  // Filter by status
  filterByStatus: async (status: QuoteStatus | 'all') => {
    set({ isLoading: true, error: null, statusFilter: status });
    try {
      if (status === 'all') {
        const quotes = await getAllQuotes();
        set({ quotes, isLoading: false });
      } else {
        const quotes = await getQuotesByStatus(status);
        set({ quotes, isLoading: false });
      }
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to filter quotes',
        isLoading: false,
      });
      throw error;
    }
  },

  // Create new quote
  createNewQuote: async (data: Partial<Quote>) => {
    set({ isLoading: true, error: null });
    try {
      const newQuote = await createQuote(data);
      // Reload quotes to include the new one
      await get().loadQuotes();
      set({ isLoading: false });
      return newQuote;
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create quote',
        isLoading: false,
      });
      throw error;
    }
  },

  // Load quote details
  loadQuoteDetails: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const quote = await getQuoteWithDetails(id);
      if (!quote) {
        throw new Error('Quote not found');
      }
      set({ selectedQuote: quote, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to load quote',
        isLoading: false,
      });
      throw error;
    }
  },

  // Update quote
  updateQuoteAction: async (id: string, updates: Partial<Quote>) => {
    set({ isLoading: true, error: null });
    try {
      await updateQuote(id, updates);
      // Reload quotes to reflect changes
      await get().loadQuotes();
      // If this quote is currently selected, reload its details
      if (get().selectedQuote?.id === id) {
        await get().loadQuoteDetails(id);
      }
      set({ isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update quote',
        isLoading: false,
      });
      throw error;
    }
  },

  // Delete quote
  deleteQuoteAction: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await deleteQuote(id);
      // Reload quotes to remove deleted one
      await get().loadQuotes();
      // Clear selected quote if it was deleted
      if (get().selectedQuote?.id === id) {
        set({ selectedQuote: null });
      }
      set({ isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete quote',
        isLoading: false,
      });
      throw error;
    }
  },

  // Refresh sync status
  refreshSyncStatus: async () => {
    try {
      const syncQueueSize = await getSyncQueueSize();
      set({ syncQueueSize });
    } catch (error) {
      console.error('Failed to refresh sync status:', error);
    }
  },

  // Clear error
  clearError: () => set({ error: null }),

  // Clear selected quote
  clearSelectedQuote: () => set({ selectedQuote: null }),

  // Set search query (without triggering search)
  setSearchQuery: (query: string) => set({ searchQuery: query }),
}));
