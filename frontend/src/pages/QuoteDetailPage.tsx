import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuotes } from '../features/quotes/useQuotes';
import { useJobs } from '../features/jobs/useJobs';
import { JobSelector } from '../features/jobs/JobSelector';
import { FinancialSummary, type FinancialData } from '../features/financials/FinancialSummary';
import { ConflictResolver } from '../features/sync/ConflictResolver';
import { type Job, type Quote, SyncStatus } from '../shared/types/models';
import type {
  ConflictReport,
  ConflictField,
  AutoMergedField,
} from '../features/sync/conflictDetection';
import { db, getDeviceId } from '../shared/db/indexedDb';
import { mergeVersionVectors, incrementVersion } from '../features/sync/versionVectors';

export function QuoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { selectedQuote, isLoading, error, loadQuoteDetails, clearSelectedQuote } = useQuotes();
  const { jobs, loadJobsForQuote, createJob, deleteJob, clearJobs } = useJobs();
  const [isAddingJob, setIsAddingJob] = useState(false);

  // Feature 5.5: Conflict Resolution
  const [showConflictResolver, setShowConflictResolver] = useState(false);
  const [conflictData, setConflictData] = useState<{
    remoteQuote: Quote;
    conflictReport: ConflictReport;
  } | null>(null);

  useEffect(() => {
    if (id) {
      loadQuoteDetails(id);
      loadJobsForQuote(id);
    }
    return () => {
      clearSelectedQuote();
      clearJobs();
    };
    // Only depend on `id` - Zustand actions are stable and don't need to be in deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Feature 5.5: Check for conflict data when quote is loaded
  useEffect(() => {
    if (selectedQuote && selectedQuote.sync_status === SyncStatus.CONFLICT) {
      // Parse conflict data from metadata
      const metadata = selectedQuote.metadata as
        | {
            conflictData?: {
              remoteQuote: {
                id: string;
                quote_number: string;
                version: number;
                versionVector?: Record<string, number>;
                status: string;
                user_id: string;
                customer_name: string;
                customer_email?: string;
                customer_phone?: string;
                customer_address?: string;
                location?: unknown;
                metadata?: Record<string, unknown>;
                created_at: string;
                updated_at: string;
                sync_status?: string;
                last_synced_at?: string;
                device_id?: string;
              };
              conflictReport: {
                hasConflict: boolean;
                conflictingFields: {
                  path: string[];
                  localValue: unknown;
                  remoteValue: unknown;
                  localTimestamp: string;
                  remoteTimestamp: string;
                  severity: string;
                }[];
                autoMergedFields: AutoMergedField[];
                localVector: Record<string, number>;
                remoteVector: Record<string, number>;
              };
              detectedAt: string;
            };
          }
        | undefined;

      if (metadata?.conflictData) {
        // Convert ISO strings back to Date objects
        const remoteQuote: Quote = {
          ...metadata.conflictData.remoteQuote,
          created_at: new Date(metadata.conflictData.remoteQuote.created_at),
          updated_at: new Date(metadata.conflictData.remoteQuote.updated_at),
          last_synced_at: metadata.conflictData.remoteQuote.last_synced_at
            ? new Date(metadata.conflictData.remoteQuote.last_synced_at)
            : undefined,
        } as Quote;

        const conflictReport: ConflictReport = {
          ...metadata.conflictData.conflictReport,
          conflictingFields: metadata.conflictData.conflictReport.conflictingFields.map(
            (field) =>
              ({
                ...field,
                localTimestamp: new Date(field.localTimestamp),
                remoteTimestamp: new Date(field.remoteTimestamp),
              }) as ConflictField,
          ),
        };

        setConflictData({ remoteQuote, conflictReport });
        setShowConflictResolver(true);
      }
    }
  }, [selectedQuote]);

  const handleBack = () => {
    navigate('/dashboard');
  };

  const handleSaveJob = async (jobData: Partial<Job>) => {
    console.log('[Sync] handleSaveJob - Starting:', jobData.job_type);
    try {
      const newJob = await createJob(jobData);
      console.log('[Sync] handleSaveJob - Job created:', newJob.id);

      setIsAddingJob(false);
      console.log('[Sync] handleSaveJob - Modal closed');

      // Don't reload - createJob already updated the store
      // Reloading causes unnecessary churn
    } catch (error) {
      console.error('[Sync] handleSaveJob - ERROR:', error);
      alert('Failed to save job. Please try again.');
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (confirm('Are you sure you want to delete this job?')) {
      try {
        await deleteJob(jobId);
        // Reload quote to get updated financials
        if (id) {
          await loadQuoteDetails(id);
        }
      } catch (error) {
        console.error('Failed to delete job:', error);
        alert('Failed to delete job. Please try again.');
      }
    }
  };

  // Feature 5.5: Handle conflict resolution
  const handleResolveConflict = async (resolvedQuote: Quote) => {
    try {
      if (!selectedQuote) return;

      const deviceId = getDeviceId();

      // Merge version vectors
      const mergedVector = mergeVersionVectors(
        selectedQuote.versionVector || {},
        conflictData?.remoteQuote.versionVector || {},
      );

      // Increment local device counter
      const finalVector = incrementVersion(mergedVector, deviceId);

      // Update quote in IndexedDB
      await db.quotes.update(selectedQuote.id, {
        ...resolvedQuote,
        versionVector: finalVector,
        sync_status: SyncStatus.PENDING, // Mark for sync
        last_synced_at: new Date(),
        metadata: {
          // Clear conflict data from metadata
          ...(selectedQuote.metadata || {}),
          conflictData: undefined,
        },
      });

      // Close modal and reload quote
      setShowConflictResolver(false);
      setConflictData(null);

      if (id) {
        await loadQuoteDetails(id);
      }

      // Show success message
      alert('Conflict resolved successfully. Changes will be synced to the server.');
    } catch (error) {
      console.error('Failed to save resolved quote:', error);
      throw error; // Let ConflictResolver handle the error
    }
  };

  const handleCancelConflictResolution = () => {
    setShowConflictResolver(false);
    // Don't clear conflict data - user might want to come back
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Jobs</h2>
            {!isAddingJob && (
              <button
                onClick={() => setIsAddingJob(true)}
                className="btn-primary text-sm flex items-center gap-2"
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Job
              </button>
            )}
          </div>

          {isAddingJob ? (
            <JobSelector
              quoteId={id!}
              onSave={handleSaveJob}
              onCancel={() => setIsAddingJob(false)}
            />
          ) : jobs.length > 0 ? (
            <div className="space-y-4">
              {jobs.map((job, index) => (
                <div key={job.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-2">
                        Job {index + 1}: {job.job_type.replace(/_/g, ' ').toUpperCase()}
                      </h3>
                      <p className="text-sm text-gray-600" data-testid="job-subtotal">
                        Subtotal: {formatCurrency(job.subtotal)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteJob(job.id)}
                      className="text-red-600 hover:text-red-700 p-2"
                      title="Delete job"
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
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No jobs added yet</p>
              <p className="text-sm mt-2">Click "Add Job" to add work to this quote</p>
            </div>
          )}
        </div>

        {/* Financials */}
        {selectedQuote.financials && (
          <div className="mb-6">
            <FinancialSummary
              financials={selectedQuote.financials as FinancialData}
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
      </div>

      {/* Feature 5.5: Conflict Resolution Modal */}
      {showConflictResolver && conflictData && selectedQuote && (
        <ConflictResolver
          localQuote={selectedQuote}
          remoteQuote={conflictData.remoteQuote}
          conflictReport={conflictData.conflictReport}
          onResolve={handleResolveConflict}
          onCancel={handleCancelConflictResolution}
        />
      )}
    </div>
  );
}

export default QuoteDetailPage;
