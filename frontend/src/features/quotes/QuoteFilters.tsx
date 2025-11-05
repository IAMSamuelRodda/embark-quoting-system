import { useState } from 'react';
import { QuoteStatus } from '../../shared/types/models';
import type { QuoteStatus as QuoteStatusType } from '../../shared/types/models';

interface QuoteFiltersProps {
  searchQuery: string;
  statusFilter: QuoteStatusType | 'all';
  onSearchChange: (query: string) => void;
  onStatusChange: (status: QuoteStatusType | 'all') => void;
  onSearch: () => void;
  syncQueueSize: number;
}

export function QuoteFilters({
  searchQuery,
  statusFilter,
  onSearchChange,
  onStatusChange,
  onSearch,
  syncQueueSize,
}: QuoteFiltersProps) {
  const [searchInput, setSearchInput] = useState(searchQuery);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchChange(searchInput);
    onSearch();
  };

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
    // Clear search if input is empty
    if (e.target.value === '') {
      onSearchChange('');
      onSearch();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      {/* Sync Status Indicator */}
      {syncQueueSize > 0 && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2">
          <span className="text-yellow-600">📤</span>
          <p className="text-sm text-yellow-800">
            {syncQueueSize} {syncQueueSize === 1 ? 'change' : 'changes'} pending
            sync
          </p>
        </div>
      )}

      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="mb-4">
        <div className="relative">
          <input
            type="text"
            value={searchInput}
            onChange={handleSearchInput}
            placeholder="Search by quote number or customer name..."
            className="input-field pr-10"
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            aria-label="Search"
          >
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
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </button>
        </div>
      </form>

      {/* Status Filter */}
      <div className="flex items-center gap-2">
        <label htmlFor="status-filter" className="text-sm font-medium text-gray-700">
          Status:
        </label>
        <select
          id="status-filter"
          value={statusFilter}
          onChange={(e) =>
            onStatusChange(e.target.value as QuoteStatusType | 'all')
          }
          className="input-field flex-1"
        >
          <option value="all">All Quotes</option>
          <option value={QuoteStatus.DRAFT}>Draft</option>
          <option value={QuoteStatus.PENDING}>Pending</option>
          <option value={QuoteStatus.SENT}>Sent</option>
          <option value={QuoteStatus.APPROVED}>Approved</option>
          <option value={QuoteStatus.REJECTED}>Rejected</option>
          <option value={QuoteStatus.ARCHIVED}>Archived</option>
        </select>
      </div>

      {/* Active Filters Summary */}
      {(searchQuery || statusFilter !== 'all') && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-600">Active filters:</span>
            {searchQuery && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                Search: "{searchQuery}"
                <button
                  onClick={() => {
                    setSearchInput('');
                    onSearchChange('');
                    onSearch();
                  }}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                  aria-label="Clear search"
                >
                  ✕
                </button>
              </span>
            )}
            {statusFilter !== 'all' && (
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                Status: {statusFilter}
                <button
                  onClick={() => onStatusChange('all')}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                  aria-label="Clear status filter"
                >
                  ✕
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
