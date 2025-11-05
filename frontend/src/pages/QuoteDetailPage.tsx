import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuotes } from '../features/quotes/useQuotes';
import { FinancialSummary } from '../features/financials/FinancialSummary';

export function QuoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { selectedQuote, isLoading, error, loadQuoteDetails, clearSelectedQuote } = useQuotes();

  useEffect(() => {
    if (id) {
      loadQuoteDetails(id);
    }
    return () => {
      clearSelectedQuote();
    };
  }, [id, loadQuoteDetails, clearSelectedQuote]);

  const handleBack = () => {
    navigate('/dashboard');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center">
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
          <span className="text-lg text-gray-600">Loading quote...</span>
        </div>
      </div>
    );
  }

  if (error || !selectedQuote) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 p-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quote Not Found</h2>
            <p className="text-gray-600 mb-6">
              {error || 'The requested quote could not be found.'}
            </p>
            <button onClick={handleBack} className="btn-primary">
              Back to Quotes
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-AU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // Format currency
  const formatCurrency = (amount?: number) => {
    if (amount === undefined) return 'Not calculated';
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={handleBack}
            className="text-primary-600 hover:text-primary-700 mb-4 flex items-center gap-2"
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Quotes
          </button>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{selectedQuote.quote_number}</h1>
              <p className="text-gray-600 mt-2">{selectedQuote.customer_name}</p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                selectedQuote.status === 'draft'
                  ? 'bg-gray-100 text-gray-800'
                  : selectedQuote.status === 'approved'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-blue-100 text-blue-800'
              }`}
            >
              {selectedQuote.status.charAt(0).toUpperCase() + selectedQuote.status.slice(1)}
            </span>
          </div>
        </div>

        {/* Customer Information */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Customer Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Name</label>
              <p className="mt-1 text-gray-900">{selectedQuote.customer_name}</p>
            </div>
            {selectedQuote.customer_email && (
              <div>
                <label className="text-sm font-medium text-gray-700">Email</label>
                <p className="mt-1 text-gray-900">{selectedQuote.customer_email}</p>
              </div>
            )}
            {selectedQuote.customer_phone && (
              <div>
                <label className="text-sm font-medium text-gray-700">Phone</label>
                <p className="mt-1 text-gray-900">{selectedQuote.customer_phone}</p>
              </div>
            )}
            {selectedQuote.customer_address && (
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Address</label>
                <p className="mt-1 text-gray-900">{selectedQuote.customer_address}</p>
              </div>
            )}
            {selectedQuote.location?.suburb && (
              <div>
                <label className="text-sm font-medium text-gray-700">Suburb</label>
                <p className="mt-1 text-gray-900">{selectedQuote.location.suburb}</p>
              </div>
            )}
            {selectedQuote.location?.postcode && (
              <div>
                <label className="text-sm font-medium text-gray-700">Postcode</label>
                <p className="mt-1 text-gray-900">{selectedQuote.location.postcode}</p>
              </div>
            )}
            {selectedQuote.location?.gps && (
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-700">GPS Coordinates</label>
                <p className="mt-1 text-gray-900">
                  {selectedQuote.location.gps.latitude.toFixed(6)},{' '}
                  {selectedQuote.location.gps.longitude.toFixed(6)}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Jobs Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Jobs</h2>
          {selectedQuote.jobs && selectedQuote.jobs.length > 0 ? (
            <div className="space-y-4">
              {selectedQuote.jobs.map((job, index) => (
                <div key={job.id} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">
                    Job {index + 1}: {job.job_type.replace('_', ' ').toUpperCase()}
                  </h3>
                  <p className="text-sm text-gray-600">Subtotal: {formatCurrency(job.subtotal)}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No jobs added yet</p>
              <p className="text-sm mt-2">Add jobs to calculate the quote total</p>
            </div>
          )}
        </div>

        {/* Financials */}
        {selectedQuote.financials && (
          <div className="mb-6">
            <FinancialSummary
              financials={selectedQuote.financials as any}
              jobs={selectedQuote.jobs || []}
            />
          </div>
        )}

        {/* Metadata */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quote Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <label className="text-gray-700 font-medium">Version</label>
              <p className="mt-1 text-gray-900">{selectedQuote.version}</p>
            </div>
            <div>
              <label className="text-gray-700 font-medium">Sync Status</label>
              <p className="mt-1 text-gray-900">{selectedQuote.sync_status || 'Not synced'}</p>
            </div>
            <div>
              <label className="text-gray-700 font-medium">Created</label>
              <p className="mt-1 text-gray-900">{formatDate(selectedQuote.created_at)}</p>
            </div>
            <div>
              <label className="text-gray-700 font-medium">Last Updated</label>
              <p className="mt-1 text-gray-900">{formatDate(selectedQuote.updated_at)}</p>
            </div>
          </div>
        </div>

        {/* Coming Soon */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <p className="text-yellow-800 font-medium">🚧 Job Editor Coming Soon</p>
          <p className="text-sm text-yellow-600 mt-2">
            Epic 3 will add job creation, material selection, and financial calculations
          </p>
        </div>
      </div>
    </div>
  );
}
