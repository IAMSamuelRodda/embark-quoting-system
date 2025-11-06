/**
 * Logo Component - Design System v2.0
 *
 * Based on: docs/design/style-guide.md (Industrial Clarity design philosophy)
 *
 * Design Principles:
 * - Consistent brand representation
 * - Multiple variants (colored, black & white, icon)
 * - Responsive sizing
 * - Maintains aspect ratio
 * - Accessible (alt text, aria-label)
 *
 * Logo Variants:
 * - Colored: Full brand colors (default) - use on light backgrounds
 * - Black & White: Monochrome version - use on dark backgrounds or print
 * - Icon: Square format - use for favicons, app icons
 *
 * Sizes:
 * - Small: 80px height
 * - Medium: 120px height (default)
 * - Large: 160px height
 * - Custom: Specify custom height
 */

import React from 'react';
import './Logo.css';

export interface LogoProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'> {
  /** Logo variant */
  variant?: 'colored' | 'bw' | 'icon';
  /** Logo size */
  size?: 'small' | 'medium' | 'large' | number;
  /** Custom alt text (defaults to "Embark Earthworks") */
  alt?: string;
  /** Additional class names */
  className?: string;
}

export const Logo = React.forwardRef<HTMLImageElement, LogoProps>(
  (
    { variant = 'colored', size = 'medium', alt = 'Embark Earthworks', className = '', ...props },
    ref,
  ) => {
    // Get logo source based on variant
    const getLogoSrc = () => {
      switch (variant) {
        case 'bw':
          return '/assets/logos/embark-logo-bw.png';
        case 'icon':
          return '/assets/logos/embark-icon.png';
        case 'colored':
        default:
          return '/assets/logos/embark-logo-colored.png';
      }
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

    const logoClasses = ['logo', `logo--${variant}`, className].filter(Boolean).join(' ');

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
