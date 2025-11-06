# Embark Earthworks Logo Assets

## Logo Files

This directory contains the Embark Earthworks brand logos in various formats and variants.

### Available Variants

1. **Colored Logo** (`embark-logo-colored.png`)
   - Pattern-based geometric design
   - Full brand colors
   - Transparent background
   - Use: Primary branding in light backgrounds

2. **Black & White Logo** (`embark-logo-bw.png`)
   - Monochrome version
   - Transparent background
   - Use: Documents, print materials, monochrome contexts

3. **Icon/Favicon** (`embark-icon.png`)
   - Square format (300x300px)
   - Use: Favicons, app icons, social media

## Source

Logos are sourced from the official Embark Earthworks website:
https://www.embarkearthworks.au

Original Squarespace CDN URLs:
- Colored: `//images.squarespace-cdn.com/content/v1/68ef2930f12f366ef1ca69e8/5875cadd-d19f-4194-ba65-4672f827713c/Website+Banner+Logo+-+wb+-+transparent+bg.png`
- Black & White: Similar path with `-bw-` identifier

## Usage Guidelines

### Do's ✅
- Use colored logo on light backgrounds
- Use black & white logo on dark backgrounds or for print
- Maintain aspect ratio (never stretch or distort)
- Provide adequate clear space around logo (minimum 16px)
- Use high-resolution versions for large displays

### Don'ts ❌
- Don't change logo colors
- Don't rotate or skew the logo
- Don't add effects (shadows, glows, outlines)
- Don't place logo on busy backgrounds without proper contrast
- Don't use low-resolution versions for large displays

## Implementation

Use the `<Logo />` component from `@/shared/components/Logo` for consistent logo rendering:

```tsx
import { Logo } from '@/shared/components/Logo';

// Colored logo (default)
<Logo variant="colored" size="medium" />

// Black & white logo
<Logo variant="bw" size="small" />

// Icon only
<Logo variant="icon" size="large" />
```

See `frontend/src/shared/components/Logo.tsx` for full component API.
