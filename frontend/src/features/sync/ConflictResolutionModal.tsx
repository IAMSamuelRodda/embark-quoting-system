/**
 * Conflict Resolution Modal
 *
 * Feature 5.5: Manual conflict resolution UI
 *
 * Displays side-by-side comparison of conflicting quotes and allows
 * users to manually resolve critical conflicts field-by-field.
 */

import { useState } from 'react';
import type { Quote } from '../../shared/types/models';
import type { ConflictReport, ConflictField } from './conflictDetection';
import { formatVersionVector } from './versionVectors';
import { mergeVersionVectors, incrementVersion } from './versionVectors';
import { getDeviceId } from '../../shared/db/indexedDb';

interface ConflictResolutionModalProps {
  localQuote: Quote;
  remoteQuote: Quote;
  conflictReport: ConflictReport;
  onResolve: (resolvedQuote: Quote) => void;
  onCancel: () => void;
}

type FieldChoice = 'local' | 'remote';

/**
 * Manual conflict resolution modal
 *
 * Shows side-by-side comparison and allows field-by-field resolution
 */
export function ConflictResolutionModal({
  localQuote,
  remoteQuote,
  conflictReport,
  onResolve,
  onCancel,
}: ConflictResolutionModalProps) {
  // Track user's choice for each conflicting field
  const [fieldChoices, setFieldChoices] = useState<Map<string, FieldChoice>>(new Map());

  /**
   * Handle field choice selection
   */
  const handleFieldChoice = (fieldPath: string, choice: FieldChoice) => {
    const newChoices = new Map(fieldChoices);
    newChoices.set(fieldPath, choice);
    setFieldChoices(newChoices);
  };

  /**
   * Check if all critical conflicts have been resolved
   */
  const allConflictsResolved = () => {
    return conflictReport.conflictingFields.every((field) => {
      const fieldPath = field.path.join('.');
      return fieldChoices.has(fieldPath);
    });
  };

  /**
   * Apply user's choices and create merged quote
   */
  const handleResolve = () => {
    const deviceId = getDeviceId();

    // Start with local quote as base
    const merged: Quote = { ...localQuote };

    // Apply user's field choices
    for (const conflict of conflictReport.conflictingFields) {
      const fieldPath = conflict.path.join('.');
      const choice = fieldChoices.get(fieldPath);

      if (!choice) {
        console.error(`No choice for field ${fieldPath}`);
        continue;
      }

      const fieldName = conflict.path[0];
      const value = choice === 'local' ? conflict.localValue : conflict.remoteValue;

      (merged as Record<string, unknown>)[fieldName] = value;

      console.log(`[ConflictResolution] Field '${fieldName}': chose ${choice} version`);
    }

    // Merge version vectors (take max of each device counter)
    const mergedVector = mergeVersionVectors(
      localQuote.versionVector || {},
      remoteQuote.versionVector || {},
    );

    // Increment local device counter (this device is resolving the conflict)
    const finalVector = incrementVersion(mergedVector, deviceId);

    // Update metadata
    merged.versionVector = finalVector;
    merged.version =
      (localQuote.version > remoteQuote.version ? localQuote.version : remoteQuote.version) + 1;
    merged.updated_at = new Date();

    console.log('[ConflictResolution] Manual merge complete');
    onResolve(merged);
  };

  /**
   * Format field value for display
   */
  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) {
      return '(empty)';
    }

    if (typeof value === 'object') {
      return JSON.stringify(value, null, 2);
    }

    return String(value);
  };

  /**
   * Render individual conflict field
   */
  const renderConflictField = (conflict: ConflictField) => {
    const fieldPath = conflict.path.join('.');
    const choice = fieldChoices.get(fieldPath);

    return (
      <div key={fieldPath} className="conflict-field">
        <h4>{fieldPath}</h4>

        <div className="conflict-comparison">
          {/* Local version */}
          <div className={`version-box ${choice === 'local' ? 'selected' : ''}`}>
            <div className="version-header">
              <strong>Local Version</strong>
              <button
                type="button"
                onClick={() => handleFieldChoice(fieldPath, 'local')}
                className={choice === 'local' ? 'btn-selected' : 'btn-choose'}
              >
                {choice === 'local' ? '✓ Selected' : 'Choose Local'}
              </button>
            </div>
            <div className="version-value">
              <pre>{formatValue(conflict.localValue)}</pre>
            </div>
            <div className="version-timestamp">
              Updated: {conflict.localTimestamp.toLocaleString()}
            </div>
          </div>

          {/* Remote version */}
          <div className={`version-box ${choice === 'remote' ? 'selected' : ''}`}>
            <div className="version-header">
              <strong>Remote Version</strong>
              <button
                type="button"
                onClick={() => handleFieldChoice(fieldPath, 'remote')}
                className={choice === 'remote' ? 'btn-selected' : 'btn-choose'}
              >
                {choice === 'remote' ? '✓ Selected' : 'Choose Remote'}
              </button>
            </div>
            <div className="version-value">
              <pre>{formatValue(conflict.remoteValue)}</pre>
            </div>
            <div className="version-timestamp">
              Updated: {conflict.remoteTimestamp.toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content conflict-resolution-modal">
        <h2>Resolve Conflicts</h2>

        <div className="conflict-info">
          <p>
            The following fields have conflicting changes from different devices. Please choose
            which version to keep for each field.
          </p>

          {/* Version vector info */}
          <div className="version-vectors">
            <div>
              <strong>Local Vector:</strong> {formatVersionVector(conflictReport.localVector)}
            </div>
            <div>
              <strong>Remote Vector:</strong> {formatVersionVector(conflictReport.remoteVector)}
            </div>
          </div>
        </div>

        {/* Conflicting fields */}
        <div className="conflicts-list">
          {conflictReport.conflictingFields.map((conflict) => renderConflictField(conflict))}
        </div>

        {/* Action buttons */}
        <div className="modal-actions">
          <button type="button" onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleResolve}
            disabled={!allConflictsResolved()}
            className="btn-primary"
          >
            Resolve Conflicts
          </button>
        </div>

        {/* Progress indicator */}
        <div className="resolution-progress">
          {fieldChoices.size} of {conflictReport.conflictingFields.length} conflicts resolved
        </div>
      </div>
    </div>
  );
}
