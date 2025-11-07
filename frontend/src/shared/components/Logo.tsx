/**
 * Logo Component - Design System v2.0
 *
 * Based on: docs/design/style-guide.md (Industrial Clarity design philosophy)
 *
 * Design Principles:
 * - Responsive logo switching (wordmark desktop, icon mobile @ 640px breakpoint)
 * - Maintains aspect ratio
 * - Accessible (alt text, aria-label)
 * - Performance-optimized WebP format
 *
 * Responsive Behavior:
 * - Desktop (>640px): Shows full wordmark logo
 * - Mobile (≤640px): Shows icon-only logo
 *
 * Logo Variants:
 * - wordmark: Full wordmark (default for desktop)
 * - icon-light: Icon only, light background
 * - icon-dark: Icon only, dark background
 *
 * Sizes:
 * - Small: 80px height (navigation)
 * - Medium: 120px height (default)
 * - Large: 160px height (hero sections)
 * - Custom: Specify custom height
 */

import React from 'react';
import './Logo.css';

export interface LogoProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'> {
  /** Logo variant */
  variant?: 'wordmark' | 'icon-light' | 'icon-dark' | 'responsive';
  /** Logo size */
  size?: 'small' | 'medium' | 'large' | number;
  /** Custom alt text (defaults to "Embark Earthworks") */
  alt?: string;
  /** Additional class names */
  className?: string;
}

export const Logo = React.forwardRef<HTMLImageElement, LogoProps>(
  (
    { variant = 'responsive', size = 'medium', alt = 'Embark Earthworks', className = '', ...props },
    ref,
  ) => {
    // Get logo source based on variant
    const getLogoSrc = () => {
      switch (variant) {
        case 'wordmark':
          return '/assets/logos/embark-wordmark-black.webp';
        case 'icon-dark':
          return '/assets/logos/embark-icon-dark.webp';
        case 'icon-light':
          return '/assets/logos/embark-icon-light.webp';
        case 'responsive':
        default:
          // For responsive, we'll use wordmark as base and CSS will handle mobile
          return '/assets/logos/embark-wordmark-black.webp';
      }
    };

    // Get icon source for responsive variant (mobile fallback)
    const getIconSrc = () => {
      return '/assets/logos/embark-icon-light.webp';
    };

    // Get logo height based on size
    const getLogoHeight = () => {
      if (typeof size === 'number') {
        return size;
      }

      switch (size) {
        case 'small':
          return 80;
        case 'large':
          return 160;
        case 'medium':
        default:
          return 120;
      }
    };

    const logoClasses = [
      'logo',
      `logo--${variant}`,
      `logo--${typeof size === 'number' ? 'custom' : size}`,
      className,
    ]
      .filter(Boolean)
      .join(' ');

    // For responsive variant, render both images and use CSS to show/hide
    if (variant === 'responsive') {
      return (
        <div className={logoClasses} ref={ref as any}>
          <img
            src={getLogoSrc()}
            alt={alt}
            height={getLogoHeight()}
            className="logo__wordmark"
            {...props}
          />
          <img
            src={getIconSrc()}
            alt={alt}
            height={getLogoHeight()}
            className="logo__icon"
            {...props}
          />
        </div>
      );
    }

    // For fixed variants, render single image
    return (
      <img
        ref={ref}
        src={getLogoSrc()}
        alt={alt}
        height={getLogoHeight()}
        className={logoClasses}
        {...props}
      />
    );
  },
);

Logo.displayName = 'Logo';

export default Logo;
