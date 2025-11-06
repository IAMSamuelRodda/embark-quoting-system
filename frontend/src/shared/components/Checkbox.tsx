/**
 * Checkbox Component - Design System v2.0
 *
 * Based on: docs/design/style-guide.md (Industrial Clarity design philosophy)
 *
 * Design Principles:
 * - Custom checkbox (native checkboxes are difficult to style consistently)
 * - Clear visual feedback (CAT Gold checkmark on selection)
 * - 100ms instant feedback (industrial responsiveness, like Button)
 * - Accessible (label association, keyboard support, ARIA attributes)
 * - Helpful error messages (specific guidance, not vague "Invalid input")
 *
 * Visual States:
 * - Unchecked: Empty box with border
 * - Checked: CAT Gold background with checkmark
 * - Focus: CAT Gold focus ring
 * - Disabled: Faded but maintains structure
 * - Error: Red border + helpful message
 */

import React from 'react';
import './Checkbox.css';

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  /** Checkbox label */
  label?: string;
  /** Helper text (shown below checkbox when no error) */
  helperText?: string;
  /** Error message (helpful, specific guidance) */
  error?: string;
  /** Required field indicator */
  required?: boolean;
  /** Checkbox size */
  size?: 'small' | 'medium' | 'large';
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      label,
      helperText,
      error,
      required = false,
      size = 'medium',
      className = '',
      id,
      checked,
      disabled = false,
      'aria-describedby': ariaDescribedBy,
      ...props
    },
    ref,
  ) => {
    // Generate IDs for accessibility
    const generatedId = React.useId();
    const checkboxId = id || `checkbox-${generatedId}`;
    const helperTextId = `${checkboxId}-helper`;
    const errorId = `${checkboxId}-error`;

    // Build aria-describedby
    const describedBy = [
      ariaDescribedBy,
      helperText && !error ? helperTextId : null,
      error ? errorId : null,
    ]
      .filter(Boolean)
      .join(' ');

    const containerClasses = [
      'checkbox-container',
      `checkbox-container--${size}`,
      error && 'checkbox-container--error',
      disabled && 'checkbox-container--disabled',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={containerClasses}>
        <div className="checkbox-wrapper">
          <input
            ref={ref}
            type="checkbox"
            id={checkboxId}
            className="checkbox-input"
            checked={checked}
            disabled={disabled}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={describedBy || undefined}
            {...props}
          />

          <div className="checkbox-box" aria-hidden="true">
            {checked && (
              <svg className="checkbox-checkmark" viewBox="0 0 16 16" fill="none">
                <path
                  d="M13 4L6 11L3 8"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </div>

          {label && (
            <label htmlFor={checkboxId} className="checkbox-label">
              {label}
              {required && (
                <span className="checkbox-label__required" aria-label="required">
                  {' '}
                  *
                </span>
              )}
            </label>
          )}
        </div>

        {helperText && !error && (
          <p id={helperTextId} className="checkbox-helper-text">
            {helperText}
          </p>
        )}

        {error && (
          <p id={errorId} className="checkbox-error" role="alert">
            <span className="checkbox-error__icon" aria-hidden="true">
              ⚠
            </span>
            {error}
          </p>
        )}
      </div>
    );
  },
);

Checkbox.displayName = 'Checkbox';

export default Checkbox;
