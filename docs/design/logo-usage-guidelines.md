# Logo Usage Guidelines - Embark Earthworks

**Version:** 1.0
**Last Updated:** 2025-11-06
**Design System:** Industrial Clarity v2.0

---

## Overview

The Embark Earthworks logo is a pattern-based geometric design that represents the company's earthworks expertise. This document provides guidelines for consistent and effective logo usage across all touchpoints.

---

## Logo Variants

### 1. Colored Logo (Primary)

**File:** `embark-logo-colored.png`

**Description:** Full-color pattern-based geometric design with transparent background

**Use Cases:**
- Primary branding on light backgrounds
- Website headers and navigation
- Digital marketing materials
- Email signatures
- Presentations

**Do's ✅**
- Use on white or light backgrounds
- Maintain minimum clear space (16px)
- Use at appropriate size for context
- Ensure high resolution for large displays

**Don'ts ❌**
- Don't use on busy or patterned backgrounds
- Don't place on dark backgrounds (use B&W variant instead)
- Don't alter colors or add filters

---

### 2. Black & White Logo

**File:** `embark-logo-bw.png`

**Description:** Monochrome version with transparent background

**Use Cases:**
- Dark backgrounds
- Print materials (black and white)
- Documents and reports
- Fax headers (if applicable)
- Low-ink printing scenarios

**Do's ✅**
- Use on dark backgrounds (#1A1A1A or darker)
- Use for print materials when color is not available
- Maintain same clear space as colored logo

**Don'ts ❌**
- Don't use on light backgrounds (use colored variant instead)
- Don't add color overlays or tints

---

### 3. Icon/Favicon

**File:** `embark-icon.png`

**Description:** Square format (300x300px) for use in small spaces

**Use Cases:**
- Browser favicons
- App icons (mobile, desktop)
- Social media profile images
- Bookmarks
- Notification icons

**Do's ✅**
- Use square format (1:1 aspect ratio)
- Ensure visibility at small sizes (16x16px)
- Test legibility at various sizes

**Don'ts ❌**
- Don't crop or resize non-proportionally
- Don't use in large format displays (use full logo instead)

---

## Size Guidelines

### Recommended Sizes

| Context | Size | Usage |
|---------|------|-------|
| **Navigation Bar** | 80px height (small) | Top navigation, mobile headers |
| **Page Header** | 120px height (medium) | Section headers, standard pages |
| **Hero Section** | 160px height (large) | Landing pages, promotional banners |
| **Footer** | 80px height (small) | Footer branding |
| **Email Signature** | 80-120px height | Professional correspondence |
| **Print Materials** | 300 DPI minimum | Business cards, brochures, flyers |

### Minimum Size

- **Digital:** 60px height (maintain legibility)
- **Print:** 20mm height (maintain detail)
- **Icon/Favicon:** 16x16px (minimum browser size)

---

## Clear Space

**Rule:** Maintain a minimum clear space of **16px** on all sides of the logo.

**Why:** Clear space ensures the logo stands out and prevents visual clutter.

**Visual Representation:**
```
┌─────────────────────────────┐
│  16px clear space           │
│                             │
│   ┌─────────────────┐       │
│   │   EMBARK LOGO   │       │
│   │   (Geometric    │       │
│   │    Pattern)     │       │
│   └─────────────────┘       │
│                             │
│  16px clear space           │
└─────────────────────────────┘
```

---

## Background Treatments

### Acceptable Backgrounds

✅ **Solid Colors:**
- White (#FFFFFF)
- Light gray (#F5F5F5, #E5E5E5)
- Near-black (#1A1A1A) - use B&W variant
- CAT Gold (#FFB400) - ensure sufficient contrast

✅ **Subtle Textures:**
- Very light gradients (95%+ white)
- Minimal texture overlays (low opacity)

❌ **Avoid:**
- Busy patterns or photos without overlay
- Low-contrast backgrounds
- Multiple competing colors
- Gradients with extreme color shifts

### Overlay Technique (for photos)

When placing logo on photos:
1. Add a semi-transparent overlay (e.g., white 80% opacity)
2. Ensure overlay covers logo area + clear space
3. Test logo visibility at various screen sizes

---

## Color Modifications

### Acceptable

✅ **None** - Always use original logo colors

### Not Acceptable

❌ **Do Not:**
- Change logo colors
- Add gradients or color overlays
- Apply filters (blur, glow, shadow)
- Invert colors (except B&W variant)
- Add outlines or borders
- Adjust opacity (below 100%)

**Exception:** The Logo component may apply CSS transforms for animations, but never color modifications.

---

## Logo Placement

### Website

**Header/Navigation:**
- Position: Top-left (standard) or centered
- Size: Small (80px height)
- Variant: Colored logo
- Link: Should navigate to homepage

**Footer:**
- Position: Left-aligned or centered
- Size: Small (80px height)
- Variant: B&W logo (if dark background)

**Loading Screens:**
- Position: Centered
- Size: Medium to Large (120-160px height)
- Animation: Fade-in only (no rotation or scaling)

### Print Materials

**Business Cards:**
- Position: Front, top-left or centered
- Size: 15-20mm height
- Variant: Colored (full-color print) or B&W (grayscale print)

**Letterhead:**
- Position: Top-center or top-left
- Size: 25-30mm height
- Variant: Colored

**Brochures/Flyers:**
- Position: Cover, top or bottom
- Size: 40-60mm height
- Variant: Colored (preferred) or B&W

---

## Implementation with Logo Component

Use the `<Logo />` component for consistent rendering:

```tsx
import { Logo } from '@/shared/components/Logo';

// Navigation bar
<nav>
  <a href="/">
    <Logo size="small" variant="colored" alt="Embark Earthworks - Home" />
  </a>
</nav>

// Page header
<header>
  <Logo size="medium" variant="colored" />
  <h1>Quoting System</h1>
</header>

// Footer (dark background)
<footer style={{ backgroundColor: '#1A1A1A' }}>
  <Logo size="small" variant="bw" />
</footer>

// Custom size
<Logo size={200} variant="colored" />
```

---

## Accessibility

### Alt Text

Always provide meaningful alt text:

**Good Examples:**
- "Embark Earthworks" (default)
- "Embark Earthworks - Quoting System"
- "Embark Earthworks - Home"

**Bad Examples:**
- "Logo" (too generic)
- "Image" (not descriptive)
- Empty alt="" (unless decorative)

### Focus States

When logo is inside interactive elements:
- Provide visible focus indicator
- Use CAT Gold (#FFB400) focus ring (Design System v2.0)
- Ensure keyboard navigability

---

## File Management

### Storage

**Development:**
- Location: `frontend/public/assets/logos/`
- Git: Included in repository (check .gitignore settings)

**Production:**
- Consider CDN for performance (e.g., Cloudflare, AWS CloudFront)
- Use responsive images (srcset) for different screen sizes
- Optimize file size without quality loss

### Optimization

**PNG Files:**
- Use tools like ImageOptim, TinyPNG, or pngquant
- Target: < 100KB per file
- Maintain transparency

**SVG Files (if available):**
- Preferred for web (scalable, small file size)
- Optimize with SVGO or similar tools
- Embed in HTML when possible

---

## Common Mistakes

### ❌ Don't Do This

1. **Stretching/Distorting**
   - Never change aspect ratio
   - Always use `object-fit: contain`

2. **Low Resolution**
   - Don't use pixelated or blurry logos
   - Use appropriate DPI for medium (72 DPI web, 300 DPI print)

3. **Poor Contrast**
   - Don't place colored logo on dark backgrounds
   - Don't place B&W logo on light backgrounds

4. **Too Small**
   - Don't go below 60px height (digital) or 20mm (print)
   - Test legibility at target size

5. **Busy Backgrounds**
   - Don't place logo on complex patterns without overlay
   - Ensure clear space is respected

---

## Questions or Clarifications

For logo usage questions not covered in this guide:

1. Refer to Design System documentation: `docs/design/style-guide.md`
2. Check component implementation: `frontend/src/shared/components/Logo.tsx`
3. Contact: Embark Earthworks branding team

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-11-06 | Initial logo usage guidelines for Design System v2.0 |

---

**Related Documentation:**
- [Design System Style Guide](./style-guide.md)
- [Logo Component API](../../frontend/src/shared/components/Logo.tsx)
- [Logo Assets README](../../frontend/public/assets/logos/README.md)
