/**
 * ConflictResolver Component Tests
 *
 * Feature 5.5: Manual Conflict Resolution UI
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ConflictResolver } from './ConflictResolver';
import type { Quote } from '../../shared/types/models';
import type { ConflictReport } from './conflictDetection';
import { QuoteStatus } from '../../shared/types/models';

describe('ConflictResolver', () => {
  const mockLocalQuote: Quote = {
    id: 'quote-1',
    quote_number: 'EE-2025-0001',
    version: 5,
    versionVector: { 'device-A': 5, 'device-B': 2 },
    status: QuoteStatus.DRAFT,
    user_id: 'user-1',
    customer_name: 'Local Customer',
    customer_email: 'local@example.com',
    customer_phone: '0400 000 000',
    customer_address: '123 Local St',
    created_at: new Date('2025-01-01'),
    updated_at: new Date('2025-01-10'),
  };

  const mockRemoteQuote: Quote = {
    id: 'quote-1',
    quote_number: 'EE-2025-0001',
    version: 6,
    versionVector: { 'device-A': 3, 'device-B': 6 },
    status: QuoteStatus.DRAFT,
    user_id: 'user-1',
    customer_name: 'Remote Customer',
    customer_email: 'remote@example.com',
    customer_phone: '0400 111 111',
    customer_address: '456 Remote Ave',
    created_at: new Date('2025-01-01'),
    updated_at: new Date('2025-01-11'),
  };

  const mockConflictReport: ConflictReport = {
    hasConflict: true,
    conflictingFields: [
      {
        path: ['customer_name'],
        localValue: 'Local Customer',
        remoteValue: 'Remote Customer',
        localTimestamp: new Date('2025-01-10'),
        remoteTimestamp: new Date('2025-01-11'),
        severity: 'critical' as const,
      },
      {
        path: ['customer_email'],
        localValue: 'local@example.com',
        remoteValue: 'remote@example.com',
        localTimestamp: new Date('2025-01-10'),
        remoteTimestamp: new Date('2025-01-11'),
        severity: 'critical' as const,
      },
    ],
    autoMergedFields: [],
    localVector: { 'device-A': 5, 'device-B': 2 },
    remoteVector: { 'device-A': 3, 'device-B': 6 },
  };

  const mockOnResolve = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the conflict resolver modal', () => {
      render(
        <ConflictResolver
          localQuote={mockLocalQuote}
          remoteQuote={mockRemoteQuote}
          conflictReport={mockConflictReport}
          onResolve={mockOnResolve}
          onCancel={mockOnCancel}
        />,
      );

      expect(screen.getByText('Resolve Sync Conflict')).toBeInTheDocument();
      expect(
        screen.getByText(
          'This quote was edited on multiple devices. Please choose which changes to keep.',
        ),
      ).toBeInTheDocument();
    });

    it('displays version vectors', () => {
      render(
        <ConflictResolver
          localQuote={mockLocalQuote}
          remoteQuote={mockRemoteQuote}
          conflictReport={mockConflictReport}
          onResolve={mockOnResolve}
          onCancel={mockOnCancel}
        />,
      );

      expect(screen.getByText(/Local Version:/)).toBeInTheDocument();
      expect(screen.getByText(/Remote Version:/)).toBeInTheDocument();
    });

    it('displays quick action buttons', () => {
      render(
        <ConflictResolver
          localQuote={mockLocalQuote}
          remoteQuote={mockRemoteQuote}
          conflictReport={mockConflictReport}
          onResolve={mockOnResolve}
          onCancel={mockOnCancel}
        />,
      );

      expect(screen.getByText('Accept Local')).toBeInTheDocument();
      expect(screen.getByText('Accept Remote')).toBeInTheDocument();
      expect(screen.getByText('Manual Merge')).toBeInTheDocument();
    });

    it('displays conflict summary', () => {
      render(
        <ConflictResolver
          localQuote={mockLocalQuote}
          remoteQuote={mockRemoteQuote}
          conflictReport={mockConflictReport}
          onResolve={mockOnResolve}
          onCancel={mockOnCancel}
        />,
      );

      expect(screen.getByText('Conflict Summary')).toBeInTheDocument();
      expect(screen.getByText(/fields require manual resolution/)).toBeInTheDocument();
    });
  });

  describe('Accept Local', () => {
    it('calls onResolve with local quote when Accept Local is clicked', async () => {
      render(
        <ConflictResolver
          localQuote={mockLocalQuote}
          remoteQuote={mockRemoteQuote}
          conflictReport={mockConflictReport}
          onResolve={mockOnResolve}
          onCancel={mockOnCancel}
        />,
      );

      const acceptLocalButton = screen.getByText('Accept Local');
      fireEvent.click(acceptLocalButton);

      await waitFor(() => {
        expect(mockOnResolve).toHaveBeenCalledTimes(1);
      });

      // Check that the resolved quote has local values
      const resolvedQuote = mockOnResolve.mock.calls[0][0] as Quote;
      expect(resolvedQuote.customer_name).toBe('Local Customer');
      expect(resolvedQuote.customer_email).toBe('local@example.com');
      expect(resolvedQuote.version).toBeGreaterThan(
        Math.max(mockLocalQuote.version, mockRemoteQuote.version),
      );
    });
  });

  describe('Accept Remote', () => {
    it('calls onResolve with remote quote when Accept Remote is clicked', async () => {
      render(
        <ConflictResolver
          localQuote={mockLocalQuote}
          remoteQuote={mockRemoteQuote}
          conflictReport={mockConflictReport}
          onResolve={mockOnResolve}
          onCancel={mockOnCancel}
        />,
      );

      const acceptRemoteButton = screen.getByText('Accept Remote');
      fireEvent.click(acceptRemoteButton);

      await waitFor(() => {
        expect(mockOnResolve).toHaveBeenCalledTimes(1);
      });

      // Check that the resolved quote has remote values
      const resolvedQuote = mockOnResolve.mock.calls[0][0] as Quote;
      expect(resolvedQuote.customer_name).toBe('Remote Customer');
      expect(resolvedQuote.customer_email).toBe('remote@example.com');
      expect(resolvedQuote.version).toBeGreaterThan(
        Math.max(mockLocalQuote.version, mockRemoteQuote.version),
      );
    });
  });

  describe('Manual Merge', () => {
    it('displays field-by-field comparison when Manual Merge is clicked', () => {
      render(
        <ConflictResolver
          localQuote={mockLocalQuote}
          remoteQuote={mockRemoteQuote}
          conflictReport={mockConflictReport}
          onResolve={mockOnResolve}
          onCancel={mockOnCancel}
        />,
      );

      const manualMergeButton = screen.getByText('Manual Merge');
      fireEvent.click(manualMergeButton);

      expect(screen.getByText('Choose Values for Each Field')).toBeInTheDocument();
      expect(screen.getByText('Customer Name')).toBeInTheDocument();
      expect(screen.getByText('Customer Email')).toBeInTheDocument();
    });

    it('displays local and remote values side-by-side', () => {
      render(
        <ConflictResolver
          localQuote={mockLocalQuote}
          remoteQuote={mockRemoteQuote}
          conflictReport={mockConflictReport}
          onResolve={mockOnResolve}
          onCancel={mockOnCancel}
        />,
      );

      const manualMergeButton = screen.getByText('Manual Merge');
      fireEvent.click(manualMergeButton);

      expect(screen.getByText('Local Customer')).toBeInTheDocument();
      expect(screen.getByText('Remote Customer')).toBeInTheDocument();
      expect(screen.getByText('local@example.com')).toBeInTheDocument();
      expect(screen.getByText('remote@example.com')).toBeInTheDocument();
    });

    it('allows selecting local or remote for each field', () => {
      render(
        <ConflictResolver
          localQuote={mockLocalQuote}
          remoteQuote={mockRemoteQuote}
          conflictReport={mockConflictReport}
          onResolve={mockOnResolve}
          onCancel={mockOnCancel}
        />,
      );

      const manualMergeButton = screen.getByText('Manual Merge');
      fireEvent.click(manualMergeButton);

      // Click on local value for customer_name
      const localNameButton = screen.getByText('Local Customer').closest('button');
      fireEvent.click(localNameButton!);

      // Click on remote value for customer_email
      const remoteEmailButton = screen.getByText('remote@example.com').closest('button');
      fireEvent.click(remoteEmailButton!);

      // Resolve button should now be enabled
      const resolveButton = screen.getByText(/Resolve \(2\/2 fields selected\)/);
      expect(resolveButton).not.toBeDisabled();
    });

    it('requires all fields to be resolved before allowing submission', () => {
      render(
        <ConflictResolver
          localQuote={mockLocalQuote}
          remoteQuote={mockRemoteQuote}
          conflictReport={mockConflictReport}
          onResolve={mockOnResolve}
          onCancel={mockOnCancel}
        />,
      );

      const manualMergeButton = screen.getByText('Manual Merge');
      fireEvent.click(manualMergeButton);

      // Select only one field
      const localNameButton = screen.getByText('Local Customer').closest('button');
      fireEvent.click(localNameButton!);

      // Resolve button should be disabled
      const resolveButton = screen.getByText(/Resolve \(1\/2 fields selected\)/);
      expect(resolveButton).toBeDisabled();
    });

    it('calls onResolve with manually merged quote', async () => {
      render(
        <ConflictResolver
          localQuote={mockLocalQuote}
          remoteQuote={mockRemoteQuote}
          conflictReport={mockConflictReport}
          onResolve={mockOnResolve}
          onCancel={mockOnCancel}
        />,
      );

      const manualMergeButton = screen.getByText('Manual Merge');
      fireEvent.click(manualMergeButton);

      // Select local for customer_name, remote for customer_email
      const localNameButton = screen.getByText('Local Customer').closest('button');
      fireEvent.click(localNameButton!);

      const remoteEmailButton = screen.getByText('remote@example.com').closest('button');
      fireEvent.click(remoteEmailButton!);

      // Click resolve
      const resolveButton = screen.getByText(/Resolve \(2\/2 fields selected\)/);
      fireEvent.click(resolveButton);

      await waitFor(() => {
        expect(mockOnResolve).toHaveBeenCalledTimes(1);
      });

      // Check that the resolved quote has mixed values
      const resolvedQuote = mockOnResolve.mock.calls[0][0] as Quote;
      expect(resolvedQuote.customer_name).toBe('Local Customer');
      expect(resolvedQuote.customer_email).toBe('remote@example.com');
      expect(resolvedQuote.version).toBeGreaterThan(
        Math.max(mockLocalQuote.version, mockRemoteQuote.version),
      );
    });
  });

  describe('Cancel', () => {
    it('calls onCancel when close button is clicked', () => {
      render(
        <ConflictResolver
          localQuote={mockLocalQuote}
          remoteQuote={mockRemoteQuote}
          conflictReport={mockConflictReport}
          onResolve={mockOnResolve}
          onCancel={mockOnCancel}
        />,
      );

      const closeButton = screen.getByRole('button', { name: '' }).parentElement!.querySelector(
        'svg',
      )!.parentElement!;
      fireEvent.click(closeButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('returns to quick actions when Cancel is clicked in manual mode', () => {
      render(
        <ConflictResolver
          localQuote={mockLocalQuote}
          remoteQuote={mockRemoteQuote}
          conflictReport={mockConflictReport}
          onResolve={mockOnResolve}
          onCancel={mockOnCancel}
        />,
      );

      const manualMergeButton = screen.getByText('Manual Merge');
      fireEvent.click(manualMergeButton);

      // Should show manual merge UI
      expect(screen.getByText('Choose Values for Each Field')).toBeInTheDocument();

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      // Should return to quick actions
      expect(screen.getByText('Choose Resolution Method')).toBeInTheDocument();
      expect(screen.queryByText('Choose Values for Each Field')).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('shows error message when onResolve fails', async () => {
      const mockOnResolveWithError = vi.fn().mockRejectedValue(new Error('Failed to save'));
      const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

      render(
        <ConflictResolver
          localQuote={mockLocalQuote}
          remoteQuote={mockRemoteQuote}
          conflictReport={mockConflictReport}
          onResolve={mockOnResolveWithError}
          onCancel={mockOnCancel}
        />,
      );

      const acceptLocalButton = screen.getByText('Accept Local');
      fireEvent.click(acceptLocalButton);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Failed to save resolution. Please try again.');
      });

      alertSpy.mockRestore();
    });
  });
});
