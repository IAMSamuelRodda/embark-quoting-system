/**
 * Modal Component - Design System v2.0
 *
 * Based on: docs/design/style-guide.md (Motion Philosophy: "Purposeful Choreography")
 *
 * Design Principles:
 * - Portal rendering (renders outside normal DOM hierarchy)
 * - Focus trap (keyboard focus stays within modal)
 * - Overlay darkening (backdrop fade-in)
 * - Modal scale-up animation (300ms base timing - purposeful choreography)
 * - Escape key to close
 * - Click-outside-to-close behavior
 * - Accessible (ARIA attributes, focus management)
 *
 * Motion Timing (from style guide):
 * - Overlay fade: 200ms fast
 * - Modal scale: 300ms base (purposeful, not rushed)
 * - Combined effect creates choreographed entrance
 *
 * Accessibility:
 * - role="dialog" and aria-modal="true"
 * - Focus trap prevents tab escaping modal
 * - Escape key closes modal
 * - Returns focus to trigger element on close
 */

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import './Modal.css';

export interface ModalProps {
  /** Whether modal is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Modal title */
  title?: string;
  /** Modal size */
  size?: 'small' | 'medium' | 'large' | 'full';
  /** Close on overlay click */
  closeOnOverlayClick?: boolean;
  /** Close on Escape key */
  closeOnEscape?: boolean;
  /** Show close button */
  showCloseButton?: boolean;
  /** Additional class names */
  className?: string;
  /** Children content */
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  size = 'medium',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  className = '',
  children,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Store the element that triggered the modal (for focus restoration)
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
    }
  }, [isOpen]);

  // Focus management and escape key handling
  useEffect(() => {
    if (!isOpen) return;

    // Focus the modal
    modalRef.current?.focus();

    // Handle Escape key
    const handleEscape = (event: KeyboardEvent) => {
      if (closeOnEscape && event.key === 'Escape') {
        onClose();
      }
    };

    // Focus trap
    const handleTab = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const modal = modalRef.current;
      if (!modal) return;

      const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement?.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement?.focus();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('keydown', handleTab);

    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('keydown', handleTab);
      document.body.style.overflow = '';

      // Restore focus to trigger element
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen, onClose, closeOnEscape]);

  // Handle overlay click
  const handleOverlayClick = (event: React.MouseEvent) => {
    if (closeOnOverlayClick && event.target === event.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const modalClasses = ['modal-content', `modal-content--${size}`, className]
    .filter(Boolean)
    .join(' ');

  return createPortal(
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div
        ref={modalRef}
        className={modalClasses}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        tabIndex={-1}
      >
        {(title || showCloseButton) && (
          <div className="modal-header">
            {title && (
              <h2 id="modal-title" className="modal-title">
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                className="modal-close-button"
                onClick={onClose}
                aria-label="Close modal"
                type="button"
              >
                <svg
                  className="modal-close-icon"
                  viewBox="0 0 24 24"
                  fill="none"
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
            )}
          </div>
        )}

        <div className="modal-body">{children}</div>
      </div>
    </div>,
    document.body,
  );
};

/**
 * Modal Footer Component
 *
 * Use for modal actions (e.g., Cancel/Confirm buttons)
 */
export interface ModalFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Children content */
  children: React.ReactNode;
}

export const ModalFooter = React.forwardRef<HTMLDivElement, ModalFooterProps>(
  ({ className = '', children, ...props }, ref) => {
    const classes = ['modal-footer', className].filter(Boolean).join(' ');

    return (
      <div ref={ref} className={classes} {...props}>
        {children}
      </div>
    );
  },
);

ModalFooter.displayName = 'ModalFooter';

export default Modal;
