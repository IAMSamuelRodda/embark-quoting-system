/**
 * Input Component - Design System v2.0
 *
 * Based on: docs/design/style-guide.md (Error State Philosophy: "Helpful, Not Punitive")
 *
 * Design Principles:
 * - Helpful error messages (specific next steps, not vague "Invalid input")
 * - Calm, clear guidance (no shake animations, no condescending copy)
 * - Instant validation feedback (200ms fast transition)
 * - Accessible (label association, aria-invalid, error announcements)
 *
 * Error Message Examples:
 * ❌ BAD: "Invalid input"
 * ✅ GOOD: "Email address must include @ symbol"
 *
 * ❌ BAD: "Oops! Try again"
 * ✅ GOOD: "Password must be at least 8 characters"
 */

import React from 'react';
import './Input.css';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /** Input label */
  label?: string;
  /** Helper text (shown below input when no error) */
  helperText?: string;
  /** Error message (helpful, specific guidance) */
  error?: string;
  /** Success message (optional positive feedback) */
  success?: string;
  /** Required field indicator */
  required?: boolean;
  /** Full width input */
  fullWidth?: boolean;
  /** Input size */
  size?: 'small' | 'medium' | 'large';
  /** Icon to display before input */
  iconBefore?: React.ReactNode;
  /** Icon to display after input */
  iconAfter?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      error,
      success,
      required = false,
      fullWidth = false,
      size = 'medium',
      iconBefore,
      iconAfter,
      className = '',
      id,
      'aria-describedby': ariaDescribedBy,
      ...props
    },
    ref,
  ) => {
    // Generate IDs for accessibility
    const inputId = id || `input-${React.useId()}`;
    const helperTextId = `${inputId}-helper`;
    const errorId = `${inputId}-error`;
    const successId = `${inputId}-success`;

    // Build aria-describedby
    const describedBy = [
      ariaDescribedBy,
      helperText && !error && !success ? helperTextId : null,
      error ? errorId : null,
      success ? successId : null,
    ]
      .filter(Boolean)
      .join(' ');

    const containerClasses = [
      'input-container',
      fullWidth && 'input-container--full-width',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const wrapperClasses = [
      'input-wrapper',
      `input-wrapper--${size}`,
      error && 'input-wrapper--error',
      success && 'input-wrapper--success',
      (iconBefore || iconAfter) && 'input-wrapper--with-icon',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={containerClasses}>
        {label && (
          <label htmlFor={inputId} className="input-label">
            {label}
            {required && (
              <span className="input-label__required" aria-label="required">
                {' '}
                *
              </span>
            )}
          </label>
        )}

        <div className={wrapperClasses}>
          {iconBefore && (
            <span className="input-icon input-icon--before" aria-hidden="true">
              {iconBefore}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            className="input"
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={describedBy || undefined}
            {...props}
          />

          {iconAfter && (
            <span className="input-icon input-icon--after" aria-hidden="true">
              {iconAfter}
            </span>
          )}
        </div>

        {helperText && !error && !success && (
          <p id={helperTextId} className="input-helper-text">
            {helperText}
          </p>
        )}

        {error && (
          <p id={errorId} className="input-error" role="alert">
            <span className="input-error__icon" aria-hidden="true">
              ⚠
            </span>
            {error}
          </p>
        )}

        {success && !error && (
          <p id={successId} className="input-success">
            <span className="input-success__icon" aria-hidden="true">
              ✓
            </span>
            {success}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = 'Input';

export default Input;
