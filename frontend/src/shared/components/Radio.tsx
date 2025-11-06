/**
 * Radio Component - Design System v2.0
 *
 * Based on: docs/design/style-guide.md (Industrial Clarity design philosophy)
 *
 * Design Principles:
 * - Custom radio button (native radios are difficult to style consistently)
 * - Clear visual feedback (CAT Gold inner circle on selection)
 * - 100ms instant feedback (industrial responsiveness, like Button)
 * - Accessible (label association, keyboard support, ARIA attributes)
 * - Helpful error messages (specific guidance, not vague "Invalid selection")
 *
 * Visual States:
 * - Unchecked: Empty circle with border
 * - Checked: CAT Gold inner circle
 * - Focus: CAT Gold focus ring
 * - Disabled: Faded but maintains structure
 * - Error: Red border + helpful message
 */

import React from 'react';
import './Radio.css';

export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** Radio button label */
  label?: string;
  /** Helper text (shown below radio when no error) */
  helperText?: string;
  /** Error message (helpful, specific guidance) */
  error?: string;
  /** Required field indicator */
  required?: boolean;
  /** Radio button size */
  size?: 'small' | 'medium' | 'large';
}

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
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
    const radioId = id || `radio-${generatedId}`;
    const helperTextId = `${radioId}-helper`;
    const errorId = `${radioId}-error`;

    // Build aria-describedby
    const describedBy = [
      ariaDescribedBy,
      helperText && !error ? helperTextId : null,
      error ? errorId : null,
    ]
      .filter(Boolean)
      .join(' ');

    const containerClasses = [
      'radio-container',
      `radio-container--${size}`,
      error && 'radio-container--error',
      disabled && 'radio-container--disabled',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div className={containerClasses}>
        <div className="radio-wrapper">
          <input
            ref={ref}
            type="radio"
            id={radioId}
            className="radio-input"
            checked={checked}
            disabled={disabled}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={describedBy || undefined}
            {...props}
          />

          <div className="radio-circle" aria-hidden="true">
            {checked && <div className="radio-inner-circle" />}
          </div>

          {label && (
            <label htmlFor={radioId} className="radio-label">
              {label}
              {required && (
                <span className="radio-label__required" aria-label="required">
                  {' '}
                  *
                </span>
              )}
            </label>
          )}
        </div>

        {helperText && !error && (
          <p id={helperTextId} className="radio-helper-text">
            {helperText}
          </p>
        )}

        {error && (
          <p id={errorId} className="radio-error" role="alert">
            <span className="radio-error__icon" aria-hidden="true">
              ⚠
            </span>
            {error}
          </p>
        )}
      </div>
    );
  },
);

Radio.displayName = 'Radio';

export default Radio;
