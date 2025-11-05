import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuotes } from './useQuotes';
import { QuoteCard } from './QuoteCard';
import { QuoteFilters } from './QuoteFilters';

export function QuoteList() {
  const navigate = useNavigate();
  const {
    quotes,
    isLoading,
    error,
    searchQuery,
    statusFilter,
    syncQueueSize,
    loadQuotes,
    searchQuotesAction,
    filterByStatus,
    setSearchQuery,
    clearError,
  } = useQuotes();

  // Load quotes on mount
  useEffect(() => {
    loadQuotes();
  }, [loadQuotes]);

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      searchQuotesAction(searchQuery);
    } else if (statusFilter !== 'all') {
      filterByStatus(statusFilter);
    } else {
      loadQuotes();
    }
  };

  const handleStatusChange = (status: typeof statusFilter) => {
    filterByStatus(status);
  };

  const handleCreateQuote = () => {
    navigate('/quotes/new');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">Quotes</h1>
            <button onClick={handleCreateQuote} className="btn-primary flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              New Quote
            </button>
          </div>

          {/* Offline Indicator */}
          {!navigator.onLine && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
              <p className="text-yellow-800 text-sm">
                📵 You're offline. Changes will sync when you're back online.
              </p>
            </div>
          )}
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start justify-between">
              <p className="text-red-800 text-sm">{error}</p>
              <button
                onClick={clearError}
                className="text-red-600 hover:text-red-800"
                aria-label="Dismiss error"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        <QuoteFilters
          searchQuery={searchQuery}
          statusFilter={statusFilter}
          onSearchChange={handleSearchChange}
          onStatusChange={handleStatusChange}
          onSearch={handleSearch}
          syncQueueSize={syncQueueSize}
        />

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3">
              <svg
                className="animate-spin h-8 w-8 text-primary-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span className="text-lg text-gray-600">Loading quotes...</span>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && quotes.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="max-w-md mx-auto">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-16 w-16 mx-auto text-gray-400 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {searchQuery || statusFilter !== 'all' ? 'No quotes found' : 'No quotes yet'}
              </h2>
              <p className="text-gray-600 mb-6">
                {searchQuery || statusFilter !== 'all'
                  ? 'Try adjusting your filters or search query.'
                  : 'Get started by creating your first quote.'}
              </p>
              {!searchQuery && statusFilter === 'all' && (
                <button onClick={handleCreateQuote} className="btn-primary">
                  Create Your First Quote
                </button>
              )}
            </div>
          </div>
        )}

        {/* Quote Grid */}
        {!isLoading && quotes.length > 0 && (
          <div>
            <div className="mb-4 text-sm text-gray-600">
              Showing {quotes.length} {quotes.length === 1 ? 'quote' : 'quotes'}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quotes.map((quote) => (
                <QuoteCard key={quote.id} quote={quote} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
