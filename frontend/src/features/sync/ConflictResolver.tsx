/**
 * Conflict Resolver Component
 *
 * Feature 5.5: Manual Conflict Resolution UI
 *
 * Displays side-by-side comparison of conflicting fields and allows user to:
 * - Accept local version
 * - Accept remote version
 * - Manually pick field-by-field
 */

import { useState } from 'react';
import type { Quote } from '../../shared/types/models';
import type { ConflictReport, ConflictField } from './conflictDetection';
import { formatVersionVector } from './versionVectors';

// ============================================================================
// TYPES
// ============================================================================

export interface ConflictResolverProps {
  localQuote: Quote;
  remoteQuote: Quote;
  conflictReport: ConflictReport;
  onResolve: (resolvedQuote: Quote) => Promise<void>;
  onCancel: () => void;
}

type ResolutionMode = 'accept-local' | 'accept-remote' | 'manual';

// ============================================================================
// COMPONENT
// ============================================================================

export function ConflictResolver({
  localQuote,
  remoteQuote,
  conflictReport,
  onResolve,
  onCancel,
}: ConflictResolverProps) {
  const [resolutionMode, setResolutionMode] = useState<ResolutionMode | null>(null);
  const [fieldResolutions, setFieldResolutions] = useState<Map<string, 'local' | 'remote'>>(
    new Map(),
  );
  const [isResolving, setIsResolving] = useState(false);

  // Get conflicting fields (critical fields only - auto-merged fields are already handled)
  const conflictingFields = conflictReport.conflictingFields;

  /**
   * Handle "Accept Local" - use all local values
   */
  const handleAcceptLocal = async () => {
    setIsResolving(true);
    try {
      // Use local quote with updated metadata
      const resolvedQuote: Quote = {
        ...localQuote,
        version: Math.max(localQuote.version, remoteQuote.version) + 1,
        updated_at: new Date(),
      };

      await onResolve(resolvedQuote);
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
      alert('Failed to save resolution. Please try again.');
      setIsResolving(false);
    }
  };

  /**
   * Handle "Accept Remote" - use all remote values
   */
  const handleAcceptRemote = async () => {
    setIsResolving(true);
    try {
      // Use remote quote with updated metadata
      const resolvedQuote: Quote = {
        ...remoteQuote,
        version: Math.max(localQuote.version, remoteQuote.version) + 1,
        updated_at: new Date(),
      };

      await onResolve(resolvedQuote);
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
      alert('Failed to save resolution. Please try again.');
      setIsResolving(false);
    }
  };

  /**
   * Handle manual field-by-field resolution
   */
  const handleManualResolve = async () => {
    // Validate all fields have been resolved
    const unresolvedFields = conflictingFields.filter(
      (field) => !fieldResolutions.has(field.path.join('.')),
    );

    if (unresolvedFields.length > 0) {
      alert(
        `Please resolve all conflicts. ${unresolvedFields.length} field(s) still need resolution.`,
      );
      return;
    }

    setIsResolving(true);
    try {
      // Build merged quote by picking selected values for each field
      const resolvedQuote: Quote = { ...localQuote };

      for (const [fieldPath, selectedSource] of fieldResolutions.entries()) {
        const sourceQuote = selectedSource === 'local' ? localQuote : remoteQuote;
        (resolvedQuote as unknown as Record<string, unknown>)[fieldPath] = (
          sourceQuote as unknown as Record<string, unknown>
        )[fieldPath];
      }

      // Update version and timestamp
      resolvedQuote.version = Math.max(localQuote.version, remoteQuote.version) + 1;
      resolvedQuote.updated_at = new Date();

      await onResolve(resolvedQuote);
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
      alert('Failed to save resolution. Please try again.');
      setIsResolving(false);
    }
  };

  /**
   * Toggle field resolution selection
   */
  const toggleFieldResolution = (field: ConflictField, selectedSource: 'local' | 'remote') => {
    const newResolutions = new Map(fieldResolutions);
    newResolutions.set(field.path.join('.'), selectedSource);
    setFieldResolutions(newResolutions);
  };

  /**
   * Format field value for display
   */
  const formatFieldValue = (value: unknown): string => {
    if (value === undefined || value === null) {
      return '(empty)';
    }

    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }

    return String(value);
  };

  /**
   * Get field label for display
   */
  const getFieldLabel = (fieldPath: string[]): string => {
    const field = fieldPath[0];

    const labels: Record<string, string> = {
      customer_name: 'Customer Name',
      customer_email: 'Customer Email',
      customer_phone: 'Customer Phone',
      customer_address: 'Customer Address',
      status: 'Quote Status',
      jobs: 'Jobs',
      financials: 'Financials',
    };

    return labels[field] || field;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-yellow-50 border-b border-yellow-200 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Resolve Sync Conflict</h2>
              <p className="text-gray-600">
                This quote was edited on multiple devices. Please choose which changes to keep.
              </p>
            </div>
            <button
              onClick={onCancel}
              disabled={isResolving}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Version Info */}
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Local Version: </span>
              <span className="text-gray-600">
                {formatVersionVector(conflictReport.localVector)}
              </span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Remote Version: </span>
              <span className="text-gray-600">
                {formatVersionVector(conflictReport.remoteVector)}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Quick Actions */}
          {!resolutionMode && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Choose Resolution Method</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={handleAcceptLocal}
                  disabled={isResolving}
                  className="p-4 border-2 border-blue-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors disabled:opacity-50"
                >
                  <div className="text-center">
                    <div className="text-blue-600 font-semibold mb-2">Accept Local</div>
                    <div className="text-sm text-gray-600">
                      Keep changes from this device (updated{' '}
                      {new Date(localQuote.updated_at).toLocaleString()})
                    </div>
                  </div>
                </button>

                <button
                  onClick={handleAcceptRemote}
                  disabled={isResolving}
                  className="p-4 border-2 border-green-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors disabled:opacity-50"
                >
                  <div className="text-center">
                    <div className="text-green-600 font-semibold mb-2">Accept Remote</div>
                    <div className="text-sm text-gray-600">
                      Keep changes from other device (updated{' '}
                      {new Date(remoteQuote.updated_at).toLocaleString()})
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setResolutionMode('manual')}
                  disabled={isResolving}
                  className="p-4 border-2 border-purple-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors disabled:opacity-50"
                >
                  <div className="text-center">
                    <div className="text-purple-600 font-semibold mb-2">Manual Merge</div>
                    <div className="text-sm text-gray-600">
                      Choose which changes to keep for each field
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Manual Resolution Mode */}
          {resolutionMode === 'manual' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Choose Values for Each Field
                </h3>
                <button
                  onClick={() => setResolutionMode(null)}
                  disabled={isResolving}
                  className="text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
                >
                  ← Back to quick actions
                </button>
              </div>

              <div className="space-y-4">
                {conflictingFields.map((field) => {
                  const fieldPath = field.path.join('.');
                  const selectedValue = fieldResolutions.get(fieldPath);

                  return (
                    <div
                      key={fieldPath}
                      className="border border-gray-200 rounded-lg overflow-hidden"
                    >
                      {/* Field Label */}
                      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                        <h4 className="font-medium text-gray-900">{getFieldLabel(field.path)}</h4>
                      </div>

                      {/* Side-by-side comparison */}
                      <div className="grid grid-cols-2 divide-x divide-gray-200">
                        {/* Local Value */}
                        <button
                          onClick={() => toggleFieldResolution(field, 'local')}
                          disabled={isResolving}
                          className={`p-4 text-left hover:bg-blue-50 transition-colors disabled:opacity-50 ${
                            selectedValue === 'local' ? 'bg-blue-50 border-2 border-blue-500' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="text-sm font-medium text-gray-700">Local (This Device)</div>
                            {selectedValue === 'local' && (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 text-blue-600"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                          </div>
                          <div className="text-sm text-gray-900 whitespace-pre-wrap break-words">
                            {formatFieldValue(field.localValue)}
                          </div>
                          <div className="text-xs text-gray-500 mt-2">
                            Updated: {new Date(field.localTimestamp).toLocaleString()}
                          </div>
                        </button>

                        {/* Remote Value */}
                        <button
                          onClick={() => toggleFieldResolution(field, 'remote')}
                          disabled={isResolving}
                          className={`p-4 text-left hover:bg-green-50 transition-colors disabled:opacity-50 ${
                            selectedValue === 'remote' ? 'bg-green-50 border-2 border-green-500' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="text-sm font-medium text-gray-700">Remote (Other Device)</div>
                            {selectedValue === 'remote' && (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 text-green-600"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            )}
                          </div>
                          <div className="text-sm text-gray-900 whitespace-pre-wrap break-words">
                            {formatFieldValue(field.remoteValue)}
                          </div>
                          <div className="text-xs text-gray-500 mt-2">
                            Updated: {new Date(field.remoteTimestamp).toLocaleString()}
                          </div>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Manual Resolution Actions */}
              <div className="mt-6 flex items-center justify-end gap-4">
                <button
                  onClick={() => setResolutionMode(null)}
                  disabled={isResolving}
                  className="btn-secondary disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleManualResolve}
                  disabled={isResolving || fieldResolutions.size !== conflictingFields.length}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isResolving ? (
                    <span className="flex items-center gap-2">
                      <svg
                        className="animate-spin h-5 w-5"
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
                      Resolving...
                    </span>
                  ) : (
                    `Resolve (${fieldResolutions.size}/${conflictingFields.length} fields selected)`
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Summary */}
          {!resolutionMode && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Conflict Summary</h4>
              <div className="text-sm text-gray-600">
                <p className="mb-1">
                  <span className="font-medium">{conflictingFields.length}</span> field
                  {conflictingFields.length !== 1 ? 's' : ''} require{conflictingFields.length === 1 ? 's' : ''} manual resolution
                </p>
                {conflictReport.autoMergedFields.length > 0 && (
                  <p>
                    <span className="font-medium">{conflictReport.autoMergedFields.length}</span>{' '}
                    field{conflictReport.autoMergedFields.length !== 1 ? 's' : ''} automatically merged
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ConflictResolver;
