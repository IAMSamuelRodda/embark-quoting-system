/**
 * Button Component - Design System v2.0
 *
 * Based on: docs/design/style-guide.md (Button Philosophy: "Confident Affordance")
 *
 * Design Principles:
 * - Industrial push-button feel (solid, responsive, engineered)
 * - Hover: Darkens + lifts (translateY -1px)
 * - Active: Returns to baseline (satisfying compression)
 * - Disabled: Faded but maintains structure
 * - 100ms instant feedback (industrial responsiveness)
 *
 * Variants:
 * - Primary: CAT Gold background, high emphasis
 * - Secondary: Outlined, medium emphasis
 * - Tertiary: Text only, low emphasis
 *
 * Sizes:
 * - Small: Compact UI (32px height)
 * - Medium: Default (44px height - mobile touch target)
 * - Large: Prominent CTAs (56px height)
 */

import React from 'react';
import './Button.css';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant */
  variant?: 'primary' | 'secondary' | 'tertiary';
  /** Button size */
  size?: 'small' | 'medium' | 'large';
  /** Full width button */
  fullWidth?: boolean;
  /** Loading state (shows spinner, disables interaction) */
  loading?: boolean;
  /** Icon to display before text */
  iconBefore?: React.ReactNode;
  /** Icon to display after text */
  iconAfter?: React.ReactNode;
  /** Children (button text/content) */
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'medium',
      fullWidth = false,
      loading = false,
      disabled = false,
      iconBefore,
      iconAfter,
      className = '',
      children,
      ...props
    },
    ref,
  ) => {
    const classes = [
      'button',
      `button--${variant}`,
      `button--${size}`,
      fullWidth && 'button--full-width',
      loading && 'button--loading',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button ref={ref} className={classes} disabled={disabled || loading} {...props}>
        {loading && (
          <span className="button__spinner" aria-hidden="true">
            <svg className="button__spinner-icon" viewBox="0 0 24 24">
              <circle
                className="button__spinner-circle"
                cx="12"
                cy="12"
                r="10"
                fill="none"
                strokeWidth="3"
              />
            </svg>
          </span>
        )}
        {!loading && iconBefore && (
          <span className="button__icon button__icon--before">{iconBefore}</span>
        )}
        <span className="button__text">{children}</span>
        {!loading && iconAfter && (
          <span className="button__icon button__icon--after">{iconAfter}</span>
        )}
      </button>
    );
  },
);

Button.displayName = 'Button';

export default Button;
