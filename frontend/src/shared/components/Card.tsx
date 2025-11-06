/**
 * Card Component - Design System v2.0
 *
 * Based on: docs/design/style-guide.md (Industrial Clarity design philosophy)
 *
 * Design Principles:
 * - Container for grouping related content
 * - Consistent elevation (subtle shadow for depth)
 * - 8px grid spacing (structural integrity)
 * - Hover state (subtle lift for interactive cards)
 * - Flexible composition (header, body, footer sections)
 *
 * Use Cases:
 * - Quote cards in quote list
 * - Job type selection cards
 * - Settings panels
 * - Dashboard widgets
 * - Any grouped content container
 */

import React from 'react';
import './Card.css';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Card variant (affects elevation) */
  variant?: 'flat' | 'elevated' | 'outlined';
  /** Interactive card (shows hover effect) */
  interactive?: boolean;
  /** Padding size */
  padding?: 'none' | 'small' | 'medium' | 'large';
  /** Full width card */
  fullWidth?: boolean;
  /** Children content */
  children: React.ReactNode;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'elevated',
      interactive = false,
      padding = 'medium',
      fullWidth = false,
      className = '',
      children,
      ...props
    },
    ref,
  ) => {
    const classes = [
      'card',
      `card--${variant}`,
      `card--padding-${padding}`,
      interactive && 'card--interactive',
      fullWidth && 'card--full-width',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div ref={ref} className={classes} {...props}>
        {children}
      </div>
    );
  },
);

Card.displayName = 'Card';

/**
 * Card Header Component
 *
 * Use for card titles and actions
 */
export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Header title */
  title?: string;
  /** Subtitle or description */
  subtitle?: string;
  /** Action element (e.g., button, icon button) */
  action?: React.ReactNode;
  /** Children content (overrides title/subtitle if provided) */
  children?: React.ReactNode;
}

export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ title, subtitle, action, className = '', children, ...props }, ref) => {
    const classes = ['card-header', className].filter(Boolean).join(' ');

    return (
      <div ref={ref} className={classes} {...props}>
        {children ? (
          children
        ) : (
          <>
            <div className="card-header__content">
              {title && <h3 className="card-header__title">{title}</h3>}
              {subtitle && <p className="card-header__subtitle">{subtitle}</p>}
            </div>
            {action && <div className="card-header__action">{action}</div>}
          </>
        )}
      </div>
    );
  },
);

CardHeader.displayName = 'CardHeader';

/**
 * Card Body Component
 *
 * Use for main card content
 */
export interface CardBodyProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Children content */
  children: React.ReactNode;
}

export const CardBody = React.forwardRef<HTMLDivElement, CardBodyProps>(
  ({ className = '', children, ...props }, ref) => {
    const classes = ['card-body', className].filter(Boolean).join(' ');

    return (
      <div ref={ref} className={classes} {...props}>
        {children}
      </div>
    );
  },
);

CardBody.displayName = 'CardBody';

/**
 * Card Footer Component
 *
 * Use for card actions or metadata
 */
export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Children content */
  children: React.ReactNode;
}

export const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className = '', children, ...props }, ref) => {
    const classes = ['card-footer', className].filter(Boolean).join(' ');

    return (
      <div ref={ref} className={classes} {...props}>
        {children}
      </div>
    );
  },
);

CardFooter.displayName = 'CardFooter';

export default Card;
