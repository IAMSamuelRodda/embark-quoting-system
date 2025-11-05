import { Link } from 'react-router-dom';
import type { QuoteListItem } from '../../shared/types/models';
import { QuoteStatus, SyncStatus } from '../../shared/types/models';

interface QuoteCardProps {
  quote: QuoteListItem;
}

export function QuoteCard({ quote }: QuoteCardProps) {
  // Format currency
  const formatCurrency = (amount?: number) => {
    if (amount === undefined) return 'No price';
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(amount);
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-AU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

  // Status badge styling
  const getStatusStyles = (status: string) => {
    switch (status) {
      case QuoteStatus.DRAFT:
        return 'bg-gray-100 text-gray-800';
      case QuoteStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case QuoteStatus.SENT:
        return 'bg-blue-100 text-blue-800';
      case QuoteStatus.APPROVED:
        return 'bg-green-100 text-green-800';
      case QuoteStatus.REJECTED:
        return 'bg-red-100 text-red-800';
      case QuoteStatus.ARCHIVED:
        return 'bg-gray-100 text-gray-600';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Sync status indicator
  const getSyncIndicator = () => {
    if (!quote.sync_status) return null;

    switch (quote.sync_status) {
      case SyncStatus.SYNCED:
        return (
          <span className="text-green-600 text-xs" title="Synced to cloud">
            ☁️ Synced
          </span>
        );
      case SyncStatus.PENDING:
        return (
          <span className="text-yellow-600 text-xs" title="Pending sync">
            📤 Pending
          </span>
        );
      case SyncStatus.ERROR:
        return (
          <span className="text-red-600 text-xs" title="Sync error">
            ⚠️ Error
          </span>
        );
      case SyncStatus.CONFLICT:
        return (
          <span className="text-orange-600 text-xs" title="Sync conflict">
            ⚡ Conflict
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <Link
      to={`/quotes/${quote.id}`}
      className="block bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow p-4"
    >
      {/* Header: Quote Number + Status */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{quote.quote_number}</h3>
          <p className="text-sm text-gray-600">{quote.customer_name}</p>
        </div>
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusStyles(quote.status)}`}
        >
          {quote.status.charAt(0).toUpperCase() + quote.status.slice(1)}
        </span>
      </div>

      {/* Price */}
      <div className="mb-3">
        <p className="text-2xl font-bold text-primary-600">{formatCurrency(quote.total_inc_gst)}</p>
      </div>

      {/* Footer: Dates + Sync Status */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="space-y-1">
          <p>Created: {formatDate(quote.created_at)}</p>
          <p>Updated: {formatDate(quote.updated_at)}</p>
        </div>
        <div>{getSyncIndicator()}</div>
      </div>
    </Link>
  );
}
