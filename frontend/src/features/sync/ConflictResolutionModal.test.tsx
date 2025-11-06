/**
 * Conflict Resolution Modal - Unit Tests
 *
 * Test manual conflict resolution UI
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConflictResolutionModal } from './ConflictResolutionModal';
import { QuoteStatus, type Quote } from '../../shared/types/models';
import type { ConflictReport } from './conflictDetection';
import { ConflictSeverity } from './conflictDetection';

// Mock getDeviceId
vi.mock('../../shared/db/indexedDb', () => ({
  getDeviceId: () => 'device-test',
}));

// Helper to create test quote
function createTestQuote(overrides: Partial<Quote> = {}): Quote {
  return {
    id: 'quote-123',
    quote_number: 'EE-2025-0001',
    version: 1,
    versionVector: { 'device-A': 1 },
    status: QuoteStatus.DRAFT,
    user_id: 'user-1',
    customer_name: 'John Smith',
    customer_email: 'john@example.com',
    created_at: new Date('2025-01-01T10:00:00Z'),
    updated_at: new Date('2025-01-01T10:00:00Z'),
    ...overrides,
  };
}

describe('ConflictResolutionModal', () => {
  const mockOnResolve = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // RENDERING
  // ============================================================================

  describe('Rendering', () => {
    it('should render modal with conflict information', () => {
      const localQuote = createTestQuote({
        versionVector: { 'device-A': 5, 'device-B': 2 },
        customer_email: 'old@example.com',
      });

      const remoteQuote = createTestQuote({
        versionVector: { 'device-A': 4, 'device-B': 3 },
        customer_email: 'new@example.com',
      });

      const conflictReport: ConflictReport = {
        hasConflict: true,
        conflictingFields: [
          {
            path: ['customer_email'],
            localValue: 'old@example.com',
            remoteValue: 'new@example.com',
            localTimestamp: new Date('2025-01-01T11:00:00Z'),
            remoteTimestamp: new Date('2025-01-01T10:00:00Z'),
            severity: ConflictSeverity.CRITICAL,
          },
        ],
        autoMergedFields: [],
        localVector: { 'device-A': 5, 'device-B': 2 },
        remoteVector: { 'device-A': 4, 'device-B': 3 },
      };

      render(
        <ConflictResolutionModal
          localQuote={localQuote}
          remoteQuote={remoteQuote}
          conflictReport={conflictReport}
          onResolve={mockOnResolve}
          onCancel={mockOnCancel}
        />,
      );

      // Check title
      expect(screen.getByRole('heading', { name: 'Resolve Conflicts' })).toBeInTheDocument();

      // Check field name
      expect(screen.getByText('customer_email')).toBeInTheDocument();

      // Check version vectors
      expect(screen.getByText(/Local Vector:/)).toBeInTheDocument();
      expect(screen.getByText(/Remote Vector:/)).toBeInTheDocument();
    });

    it('should show both local and remote values', () => {
      const localQuote = createTestQuote({
        customer_email: 'local@example.com',
      });

      const remoteQuote = createTestQuote({
        customer_email: 'remote@example.com',
      });

      const conflictReport: ConflictReport = {
        hasConflict: true,
        conflictingFields: [
          {
            path: ['customer_email'],
            localValue: 'local@example.com',
            remoteValue: 'remote@example.com',
            localTimestamp: new Date('2025-01-01T11:00:00Z'),
            remoteTimestamp: new Date('2025-01-01T10:00:00Z'),
            severity: ConflictSeverity.CRITICAL,
          },
        ],
        autoMergedFields: [],
        localVector: {},
        remoteVector: {},
      };

      render(
        <ConflictResolutionModal
          localQuote={localQuote}
          remoteQuote={remoteQuote}
          conflictReport={conflictReport}
          onResolve={mockOnResolve}
          onCancel={mockOnCancel}
        />,
      );

      expect(screen.getByText('local@example.com')).toBeInTheDocument();
      expect(screen.getByText('remote@example.com')).toBeInTheDocument();
    });

    it('should show multiple conflicting fields', () => {
      const localQuote = createTestQuote({
        customer_email: 'old@example.com',
        customer_phone: '555-1111',
      });

      const remoteQuote = createTestQuote({
        customer_email: 'new@example.com',
        customer_phone: '555-2222',
      });

      const conflictReport: ConflictReport = {
        hasConflict: true,
        conflictingFields: [
          {
            path: ['customer_email'],
            localValue: 'old@example.com',
            remoteValue: 'new@example.com',
            localTimestamp: new Date('2025-01-01T11:00:00Z'),
            remoteTimestamp: new Date('2025-01-01T10:00:00Z'),
            severity: ConflictSeverity.CRITICAL,
          },
          {
            path: ['customer_phone'],
            localValue: '555-1111',
            remoteValue: '555-2222',
            localTimestamp: new Date('2025-01-01T11:00:00Z'),
            remoteTimestamp: new Date('2025-01-01T10:00:00Z'),
            severity: ConflictSeverity.CRITICAL,
          },
        ],
        autoMergedFields: [],
        localVector: {},
        remoteVector: {},
      };

      render(
        <ConflictResolutionModal
          localQuote={localQuote}
          remoteQuote={remoteQuote}
          conflictReport={conflictReport}
          onResolve={mockOnResolve}
          onCancel={mockOnCancel}
        />,
      );

      expect(screen.getByText('customer_email')).toBeInTheDocument();
      expect(screen.getByText('customer_phone')).toBeInTheDocument();
    });
  });

  // ============================================================================
  // INTERACTION
  // ============================================================================

  describe('Interaction', () => {
    it('should allow selecting local version', () => {
      const localQuote = createTestQuote({
        customer_email: 'local@example.com',
      });

      const remoteQuote = createTestQuote({
        customer_email: 'remote@example.com',
      });

      const conflictReport: ConflictReport = {
        hasConflict: true,
        conflictingFields: [
          {
            path: ['customer_email'],
            localValue: 'local@example.com',
            remoteValue: 'remote@example.com',
            localTimestamp: new Date('2025-01-01T11:00:00Z'),
            remoteTimestamp: new Date('2025-01-01T10:00:00Z'),
            severity: ConflictSeverity.CRITICAL,
          },
        ],
        autoMergedFields: [],
        localVector: {},
        remoteVector: {},
      };

      render(
        <ConflictResolutionModal
          localQuote={localQuote}
          remoteQuote={remoteQuote}
          conflictReport={conflictReport}
          onResolve={mockOnResolve}
          onCancel={mockOnCancel}
        />,
      );

      // Click "Choose Local" button
      const chooseLocalButton = screen.getByText('Choose Local');
      fireEvent.click(chooseLocalButton);

      // Button should change to "✓ Selected"
      expect(screen.getByText('✓ Selected')).toBeInTheDocument();
    });

    it('should allow selecting remote version', () => {
      const localQuote = createTestQuote({
        customer_email: 'local@example.com',
      });

      const remoteQuote = createTestQuote({
        customer_email: 'remote@example.com',
      });

      const conflictReport: ConflictReport = {
        hasConflict: true,
        conflictingFields: [
          {
            path: ['customer_email'],
            localValue: 'local@example.com',
            remoteValue: 'remote@example.com',
            localTimestamp: new Date('2025-01-01T11:00:00Z'),
            remoteTimestamp: new Date('2025-01-01T10:00:00Z'),
            severity: ConflictSeverity.CRITICAL,
          },
        ],
        autoMergedFields: [],
        localVector: {},
        remoteVector: {},
      };

      render(
        <ConflictResolutionModal
          localQuote={localQuote}
          remoteQuote={remoteQuote}
          conflictReport={conflictReport}
          onResolve={mockOnResolve}
          onCancel={mockOnCancel}
        />,
      );

      // Click "Choose Remote" button
      const chooseRemoteButton = screen.getByText('Choose Remote');
      fireEvent.click(chooseRemoteButton);

      // Button should change to "✓ Selected"
      expect(screen.getByText('✓ Selected')).toBeInTheDocument();
    });

    it('should disable resolve button until all conflicts resolved', () => {
      const localQuote = createTestQuote({
        customer_email: 'old@example.com',
        customer_phone: '555-1111',
      });

      const remoteQuote = createTestQuote({
        customer_email: 'new@example.com',
        customer_phone: '555-2222',
      });

      const conflictReport: ConflictReport = {
        hasConflict: true,
        conflictingFields: [
          {
            path: ['customer_email'],
            localValue: 'old@example.com',
            remoteValue: 'new@example.com',
            localTimestamp: new Date('2025-01-01T11:00:00Z'),
            remoteTimestamp: new Date('2025-01-01T10:00:00Z'),
            severity: ConflictSeverity.CRITICAL,
          },
          {
            path: ['customer_phone'],
            localValue: '555-1111',
            remoteValue: '555-2222',
            localTimestamp: new Date('2025-01-01T11:00:00Z'),
            remoteTimestamp: new Date('2025-01-01T10:00:00Z'),
            severity: ConflictSeverity.CRITICAL,
          },
        ],
        autoMergedFields: [],
        localVector: {},
        remoteVector: {},
      };

      render(
        <ConflictResolutionModal
          localQuote={localQuote}
          remoteQuote={remoteQuote}
          conflictReport={conflictReport}
          onResolve={mockOnResolve}
          onCancel={mockOnCancel}
        />,
      );

      // Resolve button should be disabled initially
      const resolveButton = screen.getByRole('button', { name: 'Resolve Conflicts' });
      expect(resolveButton).toBeDisabled();

      // Select first field
      const chooseLocalButtons = screen.getAllByText('Choose Local');
      fireEvent.click(chooseLocalButtons[0]);

      // Still disabled (only 1 of 2 resolved)
      expect(resolveButton).toBeDisabled();

      // Select second field
      fireEvent.click(chooseLocalButtons[1]);

      // Now enabled (all resolved)
      expect(resolveButton).toBeEnabled();
    });

    it('should call onCancel when cancel button clicked', () => {
      const localQuote = createTestQuote();
      const remoteQuote = createTestQuote();

      const conflictReport: ConflictReport = {
        hasConflict: true,
        conflictingFields: [
          {
            path: ['customer_email'],
            localValue: 'local@example.com',
            remoteValue: 'remote@example.com',
            localTimestamp: new Date('2025-01-01T11:00:00Z'),
            remoteTimestamp: new Date('2025-01-01T10:00:00Z'),
            severity: ConflictSeverity.CRITICAL,
          },
        ],
        autoMergedFields: [],
        localVector: {},
        remoteVector: {},
      };

      render(
        <ConflictResolutionModal
          localQuote={localQuote}
          remoteQuote={remoteQuote}
          conflictReport={conflictReport}
          onResolve={mockOnResolve}
          onCancel={mockOnCancel}
        />,
      );

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledOnce();
    });
  });

  // ============================================================================
  // RESOLUTION
  // ============================================================================

  describe('Resolution', () => {
    it('should call onResolve with merged quote choosing local', () => {
      const localQuote = createTestQuote({
        version: 5,
        versionVector: { 'device-A': 5, 'device-B': 2 },
        customer_email: 'local@example.com',
        updated_at: new Date('2025-01-01T11:00:00Z'),
      });

      const remoteQuote = createTestQuote({
        version: 7,
        versionVector: { 'device-A': 4, 'device-B': 3 },
        customer_email: 'remote@example.com',
        updated_at: new Date('2025-01-01T10:00:00Z'),
      });

      const conflictReport: ConflictReport = {
        hasConflict: true,
        conflictingFields: [
          {
            path: ['customer_email'],
            localValue: 'local@example.com',
            remoteValue: 'remote@example.com',
            localTimestamp: new Date('2025-01-01T11:00:00Z'),
            remoteTimestamp: new Date('2025-01-01T10:00:00Z'),
            severity: ConflictSeverity.CRITICAL,
          },
        ],
        autoMergedFields: [],
        localVector: { 'device-A': 5, 'device-B': 2 },
        remoteVector: { 'device-A': 4, 'device-B': 3 },
      };

      render(
        <ConflictResolutionModal
          localQuote={localQuote}
          remoteQuote={remoteQuote}
          conflictReport={conflictReport}
          onResolve={mockOnResolve}
          onCancel={mockOnCancel}
        />,
      );

      // Choose local version
      const chooseLocalButton = screen.getByText('Choose Local');
      fireEvent.click(chooseLocalButton);

      // Click resolve
      const resolveButton = screen.getByRole('button', { name: 'Resolve Conflicts' });
      fireEvent.click(resolveButton);

      // onResolve should be called with merged quote
      expect(mockOnResolve).toHaveBeenCalledOnce();

      const resolvedQuote = mockOnResolve.mock.calls[0][0] as Quote;

      // Should use local email
      expect(resolvedQuote.customer_email).toBe('local@example.com');

      // Version should be max + 1
      expect(resolvedQuote.version).toBe(8); // max(5, 7) + 1

      // Version vector should be merged
      expect(resolvedQuote.versionVector).toEqual({
        'device-A': 5, // max(5, 4)
        'device-B': 3, // max(2, 3)
        'device-test': 1, // Incremented local device
      });
    });

    it('should call onResolve with merged quote choosing remote', () => {
      const localQuote = createTestQuote({
        version: 5,
        versionVector: { 'device-A': 5, 'device-B': 2 },
        customer_email: 'local@example.com',
      });

      const remoteQuote = createTestQuote({
        version: 7,
        versionVector: { 'device-A': 4, 'device-B': 3 },
        customer_email: 'remote@example.com',
      });

      const conflictReport: ConflictReport = {
        hasConflict: true,
        conflictingFields: [
          {
            path: ['customer_email'],
            localValue: 'local@example.com',
            remoteValue: 'remote@example.com',
            localTimestamp: new Date('2025-01-01T11:00:00Z'),
            remoteTimestamp: new Date('2025-01-01T10:00:00Z'),
            severity: ConflictSeverity.CRITICAL,
          },
        ],
        autoMergedFields: [],
        localVector: { 'device-A': 5, 'device-B': 2 },
        remoteVector: { 'device-A': 4, 'device-B': 3 },
      };

      render(
        <ConflictResolutionModal
          localQuote={localQuote}
          remoteQuote={remoteQuote}
          conflictReport={conflictReport}
          onResolve={mockOnResolve}
          onCancel={mockOnCancel}
        />,
      );

      // Choose remote version
      const chooseRemoteButton = screen.getByText('Choose Remote');
      fireEvent.click(chooseRemoteButton);

      // Click resolve
      const resolveButton = screen.getByRole('button', { name: 'Resolve Conflicts' });
      fireEvent.click(resolveButton);

      const resolvedQuote = mockOnResolve.mock.calls[0][0] as Quote;

      // Should use remote email
      expect(resolvedQuote.customer_email).toBe('remote@example.com');
    });

    it('should handle mixed choices for multiple fields', () => {
      const localQuote = createTestQuote({
        customer_email: 'local@example.com',
        customer_phone: '555-1111',
      });

      const remoteQuote = createTestQuote({
        customer_email: 'remote@example.com',
        customer_phone: '555-2222',
      });

      const conflictReport: ConflictReport = {
        hasConflict: true,
        conflictingFields: [
          {
            path: ['customer_email'],
            localValue: 'local@example.com',
            remoteValue: 'remote@example.com',
            localTimestamp: new Date('2025-01-01T11:00:00Z'),
            remoteTimestamp: new Date('2025-01-01T10:00:00Z'),
            severity: ConflictSeverity.CRITICAL,
          },
          {
            path: ['customer_phone'],
            localValue: '555-1111',
            remoteValue: '555-2222',
            localTimestamp: new Date('2025-01-01T11:00:00Z'),
            remoteTimestamp: new Date('2025-01-01T10:00:00Z'),
            severity: ConflictSeverity.CRITICAL,
          },
        ],
        autoMergedFields: [],
        localVector: {},
        remoteVector: {},
      };

      render(
        <ConflictResolutionModal
          localQuote={localQuote}
          remoteQuote={remoteQuote}
          conflictReport={conflictReport}
          onResolve={mockOnResolve}
          onCancel={mockOnCancel}
        />,
      );

      // Choose local for email, remote for phone
      const chooseLocalButtons = screen.getAllByText('Choose Local');
      const chooseRemoteButtons = screen.getAllByText('Choose Remote');

      fireEvent.click(chooseLocalButtons[0]); // Email: local
      fireEvent.click(chooseRemoteButtons[1]); // Phone: remote

      // Resolve
      const resolveButton = screen.getByRole('button', { name: 'Resolve Conflicts' });
      fireEvent.click(resolveButton);

      const resolvedQuote = mockOnResolve.mock.calls[0][0] as Quote;

      // Should use local email, remote phone
      expect(resolvedQuote.customer_email).toBe('local@example.com');
      expect(resolvedQuote.customer_phone).toBe('555-2222');
    });
  });
});
