# Embark Earthworks - Style Guide

**Version:** 2.0 ✨ **Master-Level Edition**
**Last Updated:** 2025-11-06
**Source:** https://www.embarkearthworks.au/
**Accent Color:** #FFB400 (CAT Gold)
**Assets:** 3 logo variants (WebP format)
**Supporting Docs:** devtools-color-extraction-guide.md, visual-qa-checklist.md
**Enhancements:** Design philosophy, chromatic storytelling, component personality, living examples

---

## Overview

This style guide defines the visual design language for the Embark Quoting System, ensuring brand consistency with the Embark Earthworks company website. The design emphasizes **professionalism**, **clarity**, and **trustworthiness**—reflecting the company's core values of "no hidden fees, no surprises."

---

## Brand Personality

### Core Values
- **Professional**: Clean, organized, and reliable
- **Transparent**: Clear communication, no hidden complexity
- **Earthy**: Connection to land and earthmoving work
- **Modern**: Contemporary design without unnecessary flourish

### Brand Voice
- Direct and straightforward
- Friendly but professional
- Confidence without arrogance
- Solution-oriented

---

## Design Philosophy: "Industrial Clarity"

Embark's visual language draws from **Brutalist honesty** and **Swiss precision**—where every element serves function, nothing is decorative for decoration's sake. Like the earthmoving equipment the brand references, the design is built on principles of strength, reliability, and purpose.

### Philosophical Pillars

**Monumental Simplicity**
Bold typography, generous white space, confident scale. The interface doesn't whisper—it speaks clearly and with authority. Large headings command attention like construction signage. Buttons feel substantial, clickable, engineered for repeated use. Nothing is timid.

**Functional Honesty**
Form follows purpose. Every color signals meaning (gold=action, green=success, red=attention). Shadows create depth without decoration—they serve spatial understanding, not aesthetics. Rounded corners (4px) acknowledge human interaction while maintaining professional precision. If an element can't justify its presence functionally, it doesn't belong.

**Material Integrity**
The design respects its digital materiality. White backgrounds act as canvas—breathing room that lets content and actions take center stage. Near-black text provides maximum readability without harsh contrast. The CAT Gold accent appears sparingly, making each occurrence significant. Like high-quality construction materials, the palette is limited by choice, not constraint.

**Systematic Precision**
An 8px grid enforces rhythm across the entire system. Modular type scale (1.25 ratio) ensures clear hierarchy without arbitrary sizes. Spacing follows mathematical progression—never random gaps, always intentional intervals. This systematic approach creates interfaces that feel coherent, predictable, trustworthy.

### Design Philosophy in Practice

The result: interfaces that feel like **well-engineered machinery**—powerful, trustworthy, built to last. Users should sense they're working with professional-grade tools, not consumer software. Every interaction reinforces competence, reliability, and straightforward communication.

**This philosophy guides all design decisions**: When choosing between ornamental beauty and functional clarity, choose function. When tempted to add decoration, ask "Does this serve the user's task?" When questioning spacing, default to more room. When selecting colors, remember that restraint amplifies significance.

The Embark Quoting System isn't pretty for pretty's sake—it's **precise, purposeful, and powerful**.

---

## Color Palette

### Primary Colors

```css
/* Base Colors */
--primary-background: #FFFFFF;        /* Pure white backgrounds */
--primary-text: #1A1A1A;              /* Near-black for body text */
--accent-primary: #FFB400;            /* Golden amber - CAT construction equipment yellow */
```

### Brand Color Psychology

The **#FFB400** golden amber accent color is strategically chosen to:
- **Evoke Trust & Recognition**: References iconic CAT (Caterpillar) construction equipment branding
- **Signal Quality**: Premium golden tone suggests high-quality professional service
- **High Visibility**: Excellent contrast on white backgrounds ensures CTAs and highlights stand out
- **Industry Association**: Instantly connects to earthmoving and heavy machinery industries

**Color Name**: CAT Gold / Construction Amber

### Secondary Colors

```css
--light-accent: rgba(255, 180, 0, 0.52);       /* Golden amber @ 52% opacity - overlays, subtle highlights */
--accent-hover: #E6A200;                       /* Darker gold for hover states */
--accent-light: #FFCA4D;                       /* Lighter gold for backgrounds */
--shadow-dark: rgba(26, 26, 26, 0.2);          /* Drop shadows, depth */
--border-light: rgba(26, 26, 26, 0.1);         /* Subtle borders, dividers */
```

### Semantic Colors

```css
/* Status Colors */
--success: #10B981;         /* Green - completed quotes, success messages */
--warning: #F59E0B;         /* Orange - pending actions, warnings */
--error: #DC2626;           /* Red - errors, required fields, deletions */
--info: #3B82F6;            /* Blue - informational messages, tips */
```

### Color Relationships & Hierarchy

The palette is intentionally **limited**—not minimalism for its own sake, but restraint that amplifies the golden accent. Every non-white, non-black pixel earns its presence.

**Primary System (Chromatic Foundation)**

- **White (#FFFFFF)** → Canvas, breathing room, purity
  - The foundation everything rests upon
  - Creates generous negative space
  - Allows content and actions to command attention

- **Near-Black (#1A1A1A)** → Structure, readability, authority
  - Not pure black (#000000)—softer on eyes, less harsh
  - Provides maximum contrast without visual aggression
  - Text that feels confident but not domineering

- **CAT Gold (#FFB400)** → Energy, action, brand signature
  - The only warm color in the palette
  - Appears sparingly, making each use significant
  - Creates instant visual hierarchy (eye drawn to gold)
  - Psychologically warm, inviting interaction

**Chromatic Strategy**: The palette creates a **visual vacuum** around the accent color. White and near-black are neutral—they recede. Gold advances, demands attention. This isn't accidental—it's engineered focus.

**Accent Variations (Tonal Modulation)**

- **#E6A200 (hover)** → Depth through darkness
  - 10% darker than primary gold
  - Signals "pressed" state—physical realism
  - Maintains warmth while showing response

- **#FFCA4D (light)** → Glow through lightness
  - 20% lighter than primary gold
  - Subtle backgrounds, gentle highlights
  - Warmth without intensity

- **rgba(255,180,0,0.52)** → Atmosphere through transparency
  - Half-strength gold
  - Creates layered depth on images
  - Suggests presence without dominance

**Semantic Augmentation**: Success, warning, error, info colors exist **outside** the brand palette—they're functional signals, not brand expression. They appear only when meaning requires them (form validation, status messages, alerts).

**Design Principle**: If debating whether to use color, default to monochrome (white/near-black). Gold is precious—spend it wisely. Every golden pixel should earn its significance.

### Color Usage Guidelines

| Element | Color | Usage |
|---------|-------|-------|
| Page Background | `--primary-background` | Main app background, card backgrounds |
| Body Text | `--primary-text` | All primary content, labels |
| Headings | `--primary-text` | Section headers, page titles |
| Accent Highlights | `--accent-primary` | Underlines, active states, CTAs |
| Overlays | `--light-accent` | Image overlays, hover states |
| Shadows | `--shadow-dark` | Card shadows, depth effects |
| Disabled States | `--border-light` | Inactive elements, placeholder text |

### Accessibility Requirements

- **Contrast Ratios**: Maintain WCAG AA standards (4.5:1 for body text, 3:1 for large text)
- **Testing**: Use browser DevTools to verify contrast when accent color is extracted
- **Color Independence**: Never rely solely on color to convey information (use icons, labels, or text)

---

## Typography

### Font Stack

```css
/* Primary Font Family */
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
             "Helvetica Neue", Arial, sans-serif;
```

**Why**: Clean, modern sans-serif stack provides excellent readability across all devices and platforms. Matches the professional tone of the brand.

### Type Scale

```css
/* Display Headings */
--text-display: 3rem (48px);      /* Page titles, hero headings */
--text-h1: 2.5rem (40px);         /* Section headings */
--text-h2: 2rem (32px);           /* Subsection headings */
--text-h3: 1.5rem (24px);         /* Card titles, form section headers */
--text-h4: 1.25rem (20px);        /* Subheadings, emphasized labels */

/* Body Text */
--text-body: 1rem (16px);         /* Primary body text */
--text-small: 0.875rem (14px);    /* Secondary information, captions */
--text-tiny: 0.75rem (12px);      /* Fine print, metadata */
```

### Font Weights

```css
--font-regular: 400;   /* Body text, descriptions */
--font-medium: 500;    /* Emphasized text, labels */
--font-semibold: 600;  /* Subheadings, button text */
--font-bold: 700;      /* Headings, primary CTAs */
```

### Line Height

```css
--line-height-tight: 1.2;    /* Headings, display text */
--line-height-base: 1.5;     /* Body text, forms */
--line-height-relaxed: 1.75; /* Long-form content, descriptions */
```

### Typographic Voice

The system font stack is intentionally **neutral**—allowing content to speak without typographic performance. But neutrality ≠ generic. This is purposeful invisibility.

**Font Philosophy**: Sans-serif purity echoes **construction blueprints** and **engineering documents**. No decorative serifs, no personality fonts. Just clear, readable, professional communication. The typography should feel like it came from a well-run construction office—organized, efficient, trustworthy.

**Why System Fonts?**
Custom webfonts add ~200KB download + render delay + potential licensing issues. For a field-use app requiring **offline capability**, system fonts ensure:
- Instant load (no font download)
- Universal compatibility (fonts already installed)
- Zero licensing concerns
- Consistent rendering across all devices

**Performance > Brand Vanity**. The brand is expressed through color, spacing, and composition—not custom typography.

**Typographic Behavior**

The type scale (1.25 ratio) creates **clear hierarchy** without arbitrary jumps:
- 48px → 40px → 32px → 24px → 20px → 16px → 14px → 12px

Each size is intentional:

**Headings** (24px+)
- Purpose: Brief, direct, action-oriented (like construction orders)
- Weight: Bold (700) for command
- Line-height: Tight (1.2) for confidence
- Usage: "Create Quote", "Job Details", "Financial Summary"

**Body Text** (16px)
- Purpose: Clear, unhurried, explanatory (like project specs)
- Weight: Regular (400) for readability
- Line-height: Base (1.5) for comfortable reading
- Usage: Form descriptions, quote notes, help text

**Labels** (14px)
- Purpose: Precise, minimal, functional (like equipment gauges)
- Weight: Medium (500) for subtle emphasis
- Line-height: Base (1.5) for alignment with inputs
- Usage: "Customer Name:", "Job Type:", "Material Cost"

**Metadata** (12px)
- Purpose: Supporting information, timestamps, fine print
- Weight: Regular (400) to recede
- Line-height: Base (1.5) for legibility
- Usage: "Last saved 5 minutes ago", "Quote #EE-2025-0042"

**Typographic Restraint**: Never use more than three text sizes on a single screen. Hierarchy through size, weight, and spacing—not a parade of font sizes.

**Rule**: If text feels too small, increase size. If hierarchy feels weak, increase contrast between sizes (don't add more sizes). Simplicity creates clarity.

### Usage Examples

```css
/* Page Title */
.page-title {
  font-size: var(--text-display);
  font-weight: var(--font-bold);
  line-height: var(--line-height-tight);
  color: var(--primary-text);
}

/* Section Heading */
.section-heading {
  font-size: var(--text-h2);
  font-weight: var(--font-bold);
  line-height: var(--line-height-tight);
  color: var(--primary-text);
  /* Accent underline decoration (see Decorative Elements) */
}

/* Body Text */
.body-text {
  font-size: var(--text-body);
  font-weight: var(--font-regular);
  line-height: var(--line-height-base);
  color: var(--primary-text);
}

/* Form Label */
.form-label {
  font-size: var(--text-small);
  font-weight: var(--font-medium);
  line-height: var(--line-height-base);
  color: var(--primary-text);
}
```

---

## Logo Usage

### Logo Design System

The Embark logo uses a geometric diamond/arrow mark that evokes:
- **Forward Movement**: Arrow element suggests progress and journey
- **Stability**: Diamond shape provides grounded, solid foundation
- **Precision**: Clean geometric lines reflect accuracy in earthworks
- **Duality**: Split design represents partnership between company and client

### Logo Variants

#### 1. Icon Mark - Dark Background
**File**: `frontend/src/assets/images/logo/embark-icon-dark.webp`
**Dimensions**: 550×550px
**Description**: White/light geometric diamond mark on dark gray background

**Usage**:
- Dark mode interfaces (when implemented)
- Social media profile images
- App store icons
- Loading screens with dark backgrounds

**Technical specs**:
```
Format: WebP
Background: #505050 (dark gray)
Icon Color: #F5F5F5 (off-white)
File size: ~8KB
```

#### 2. Icon Mark - Light Background (Favicon)
**File**: `frontend/src/assets/images/logo/embark-icon-light.webp`
**Dimensions**: 512×512px
**Description**: Off-white/cream geometric diamond mark on transparent background

**Usage**:
- Browser favicons (all sizes)
- Light mode interfaces
- App splash screens
- PWA icons and manifests
- Watermarks (at low opacity)

**Technical specs**:
```
Format: WebP
Background: Transparent
Icon Color: #F5F5F5 (off-white)
File size: ~4KB
Optimized for: favicon generation at 16x16, 32x32, 64x64, 128x128, 256x256, 512x512
```

#### 3. Horizontal Wordmark - Black
**File**: `frontend/src/assets/images/logo/embark-wordmark-black.webp`
**Dimensions**: ~1200×200px (horizontal)
**Description**: "EMBARK" in bold black sans-serif with geometric mark positioned upper-right

**Usage**:
- **Primary**: App header/navigation (desktop and tablet)
- PDF quote headers
- Email signatures
- Print materials
- Marketing collateral

**Technical specs**:
```
Format: WebP
Background: Transparent
Text Color: #000000 (pure black)
Typography: Bold sans-serif, highly legible
Aspect Ratio: ~6:1 (wide horizontal)
File size: ~6KB
```

**Typography Details**:
- Font weight: 700 (bold)
- Character spacing: Tight but readable
- Case: All caps
- Alignment: Text with mark creates visual lockup

### Logo Specifications

#### Size Requirements

| Variant | Minimum Width | Recommended Width | Maximum Width |
|---------|---------------|-------------------|---------------|
| Icon Mark (Square) | 32px | 64px | 256px |
| Wordmark (Horizontal) | 120px | 180px | 400px |
| Favicon | 16px | 32px | 512px |

#### Clear Space

**Rule**: Maintain clear space equal to the height of the icon mark on all sides

```
Clear Space = Height of diamond mark
Minimum padding: 20px on all sides
For wordmark: 1/4 of mark height on all sides
```

Example:
```
┌─────────────────────────────────┐
│  [20px padding]                 │
│                                 │
│     ◆  EMBARK                   │
│                                 │
│  [20px padding]                 │
└─────────────────────────────────┘
```

### Logo Placement Guidelines

| Context | Variant | Position | Size | Notes |
|---------|---------|----------|------|-------|
| **App Header (Desktop)** | Wordmark | Left-aligned, centered vertically | 180px width | Full branding visibility |
| **App Header (Mobile)** | Icon Mark | Left-aligned, centered vertically | 40px × 40px | Space-efficient on small screens |
| **Login Screen** | Wordmark | Center, above form | 240px width | Primary branding moment |
| **Splash Screen** | Icon Mark | Center | 128px × 128px | Quick load, recognizable |
| **PDF Quote Header** | Wordmark | Top-left corner | 150px width | Professional document branding |
| **Email Footer** | Wordmark | Center | 120px width | Small but legible |
| **Browser Tab** | Icon Light | Favicon | 32×32px | Generated from 512px source |
| **Loading Spinner** | Icon Light | Center (spinning or pulsing) | 64px × 64px | At 40% opacity as background |

### Logo Color Variations

#### Allowed Color Combinations

✅ **Approved**:
- Black wordmark + Black icon on white/light backgrounds (primary)
- White wordmark + White icon on dark backgrounds (dark mode)
- Black wordmark + CAT Gold (#FFB400) icon (accent variant - special occasions)

❌ **Never Use**:
- Logo in colors other than black, white, or CAT Gold
- Gradients, textures, or patterns applied to logo
- Outlined/stroked versions
- Rotated or skewed versions

### Logo Don'ts

Protect the brand by avoiding these mistakes:

- ❌ **Don't stretch or distort**: Maintain 1:1 aspect ratio for icon, original aspect for wordmark
- ❌ **Don't place on busy backgrounds**: Ensure clear contrast and readability
- ❌ **Don't add effects**: No drop shadows, glows, bevels, or 3D effects
- ❌ **Don't modify spacing**: Keep letter spacing and mark-to-text relationship intact
- ❌ **Don't change colors**: Stick to approved black/white/CAT Gold palette
- ❌ **Don't crop or partial**: Always show complete logo or icon mark
- ❌ **Don't violate clear space**: Respect minimum padding requirements
- ❌ **Don't use low-resolution**: Always use properly sized source files

### File Format Guidelines

#### Current Assets (WebP)
- **Pros**: Small file size, good quality, wide browser support
- **Cons**: Not ideal for editing or print
- **Use for**: Web app, favicons, digital materials

#### Future Recommendations
Request from company:
- **SVG** (vector): Infinitely scalable, smallest file size, best for web
- **PNG** (raster): High-res (2x, 3x) for app stores and precise pixel control
- **PDF** (vector): For print materials and professional documents
- **AI/EPS** (vector): For design team edits and modifications

### Favicon Generation

Generate multiple sizes from `embark-icon-light.webp`:

```bash
# Recommended favicon sizes
16×16px   # Browser tab (tiny)
32×32px   # Browser tab (retina)
64×64px   # Windows taskbar
128×128px # Chrome Web Store
256×256px # Safari pinned tab
512×512px # PWA splash screen
```

**Tools**: Use https://realfavicongenerator.net/ or similar service

### Logo Implementation Examples

#### React Component (Header)

```jsx
import logoWordmark from '@/assets/images/logo/embark-wordmark-black.webp';
import logoIcon from '@/assets/images/logo/embark-icon-light.webp';

// Desktop: Show wordmark
<img
  src={logoWordmark}
  alt="Embark Earthworks"
  className="h-10 w-auto hidden md:block"
/>

// Mobile: Show icon only
<img
  src={logoIcon}
  alt="Embark"
  className="h-8 w-8 md:hidden"
/>
```

#### CSS Background (Loading Screen)

```css
.loading-screen {
  background-image: url('/assets/images/logo/embark-icon-light.webp');
  background-position: center;
  background-repeat: no-repeat;
  background-size: 64px 64px;
  opacity: 0.4;
}
```

### Logo Accessibility

```html
<!-- Always include descriptive alt text -->
<img src="logo.webp" alt="Embark Earthworks - Earthmoving Contractors">

<!-- For decorative usage -->
<img src="logo.webp" alt="" aria-hidden="true">

<!-- With link wrapper -->
<a href="/" aria-label="Return to Embark Earthworks homepage">
  <img src="logo.webp" alt="">
</a>
```

---

## Layout & Spacing

### Grid System

```css
/* Responsive Grid */
--grid-columns-mobile: 8;   /* Mobile: 8-column grid */
--grid-columns-tablet: 16;  /* Tablet: 16-column grid */
--grid-columns-desktop: 24; /* Desktop: 24-column grid */
--grid-gap: 11px;           /* Consistent gap between grid items */
```

### Spacing Scale

Based on 8px baseline grid for consistent vertical rhythm:

```css
--spacing-xs: 4px;    /* Tight spacing, inline elements */
--spacing-sm: 8px;    /* Form field padding, icon spacing */
--spacing-md: 16px;   /* Card padding, section spacing */
--spacing-lg: 24px;   /* Section margins, large gaps */
--spacing-xl: 32px;   /* Page margins, major sections */
--spacing-2xl: 48px;  /* Hero sections, major divisions */
--spacing-3xl: 64px;  /* Landing page sections */
```

### Spatial Rhythm: "Breathing Architecture"

The 8px grid isn't arbitrary—it's the **smallest unit of meaningful space**. Like rebar spacing in concrete, it creates structural integrity through consistent intervals.

**Why 8px?**
- **Divisible by 2 and 4**: Easy mental math, consistent halving/doubling
- **Aligns with most screen densities**: Works cleanly at 1x, 1.5x, 2x pixel ratios
- **Sufficient granularity**: Fine enough for precision, coarse enough to prevent micro-adjustments
- **Industry standard**: Matches Material Design, iOS HIG, and most design systems

**Spatial Hierarchy**

**Micro-rhythm** (4px, 8px)
- Inline elements: icon-to-text spacing, checkbox-to-label
- Tight groupings: related form fields, button groups
- Visual coupling: elements that belong together

**Meso-rhythm** (16px, 24px, 32px)
- Section breathing: space between form sections
- Card structure: internal padding, margins between cards
- Content-to-action spacing: descriptive text to its button

**Macro-rhythm** (48px, 64px)
- Page architecture: major section divisions
- Hero zones: large visual breaks
- Screen transitions: space that signals major context shifts

**Design Philosophy**: Negative space isn't empty—it's **structural**. White space does the heavy lifting:
- **Separates concerns**: Distinct sections feel distinct
- **Guides eyes**: Space creates invisible pathways through content
- **Creates calm**: Density creates stress; breathing room creates confidence

**Rules**:
1. **Never justify density**: If content feels cramped, increase space (don't shrink text)
2. **Default to more space**: When choosing between 16px or 24px, choose 24px
3. **Consistent intervals**: Use scale values, never arbitrary gaps (no 13px, 22px, 37px)
4. **Respect the grid**: Everything aligns to 8px intervals vertically

The quoting system should feel **expansive, not packed**. Like a well-organized construction site—everything has its place, nothing cluttered, all tools within reach.

### Container Widths

```css
--container-sm: 640px;   /* Forms, narrow content */
--container-md: 768px;   /* Standard content, quotes */
--container-lg: 1024px;  /* Dashboards, tables */
--container-xl: 1280px;  /* Wide layouts, reports */
--container-full: 100%;  /* Full-width sections */
```

### Responsive Gutters

```css
/* Horizontal margins */
--gutter-mobile: 6vw;    /* ~24px on 400px screen */
--gutter-tablet: 5vw;    /* ~38px on 768px screen */
--gutter-desktop: 4vw;   /* ~51px on 1280px screen */
```

### Layout Patterns

#### Card Layout
```
- White background (--primary-background)
- Subtle drop shadow (0 2px 8px --shadow-dark)
- 16px internal padding (--spacing-md)
- 8px border-radius (subtle rounding)
- 16px margin between cards
```

#### Form Layout
```
- Labels above inputs (8px spacing)
- Input groups: 16px vertical spacing
- Section dividers: 32px spacing
- Submit button: 24px top margin, right-aligned
```

#### Page Layout
```
- Header: 64px height (fixed)
- Main content: 32px top padding, responsive side gutters
- Footer: 24px padding, light background
```

---

## UI Components

### Buttons

#### Button Philosophy: "Confident Affordance"

Primary buttons aren't just clickable—they're **invitations to act**. Every aspect of their design communicates "This is important. This will do something meaningful."

**Visual Weight**
- **CAT Gold commands attention**: The only warm color in the interface—rare color = high signal
- **White text ensures legibility**: Function over aesthetics—maximum contrast for readability
- **Subtle rounding (4px)**: Approachable but professional (not playful rounded pills, not harsh 0px corners)
- **Generous padding (12px 24px)**: Substantial hit target, feels engineered for repeated use

**Interaction Choreography**

The button's behavior tells a micro-story:

1. **Default State**: Solid, confident, ready
   - Background: #FFB400 (CAT Gold)
   - Appearance: Stable, grounded

2. **Hover State**: Darkens + lifts
   - Background: #E6A200 (darker gold—depth through shadow)
   - Transform: translateY(-1px) (physical realism—button "lifts" toward cursor)
   - Shadow: 0 4px 12px (elevated depth)
   - **Why**: Mimics real industrial push-buttons that rise slightly before press

3. **Active State**: Returns to baseline
   - Transform: translateY(0) (satisfying compression)
   - **Why**: Visual + haptic feedback—button "pressed down"

4. **Disabled State**: Faded but shaped
   - Opacity: 0.6 (clearly inactive)
   - Structure maintained (doesn't disappear—shows "this action exists, just not available now")
   - Cursor: not-allowed (system feedback)

**Design Intent**: Buttons should feel like **industrial push-buttons**—solid, responsive, engineered for thousands of presses. Not delicate glass, not squishy candy—mechanical precision with satisfying feedback.

**Rules**:
- Primary buttons use CAT Gold (reserved for primary actions only)
- Secondary buttons use borders (less visual weight)
- One primary action per screen (don't dilute importance)
- Button text: Action verbs ("Create Quote", "Save Changes", "Generate PDF")—never ambiguous ("OK", "Submit", "Continue")

#### Primary Button (Call-to-Action)

```css
.btn-primary {
  /* Visual */
  background-color: var(--accent-primary);
  color: #FFFFFF;
  border: none;
  border-radius: 4px;

  /* Typography */
  font-size: var(--text-body);
  font-weight: var(--font-semibold);

  /* Spacing */
  padding: 12px 24px;

  /* Interaction */
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background-color: var(--accent-hover); /* #E6A200 - Darker gold */
  transform: translateY(-1px);
  box-shadow: 0 4px 12px var(--shadow-dark);
}

.btn-primary:active {
  transform: translateY(0);
}

.btn-primary:disabled {
  background-color: var(--border-light);
  cursor: not-allowed;
  opacity: 0.6;
}
```

#### Secondary Button

```css
.btn-secondary {
  /* Visual */
  background-color: transparent;
  color: var(--primary-text);
  border: 2px solid var(--border-light);
  border-radius: 4px;

  /* Typography & Spacing */
  font-size: var(--text-body);
  font-weight: var(--font-medium);
  padding: 10px 22px; /* Adjusted for border */

  /* Interaction */
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  border-color: var(--accent-primary);
  color: var(--accent-primary);
}
```

#### Button Sizes

```css
/* Large (Primary CTAs) */
.btn-lg { padding: 16px 32px; font-size: 1.125rem; }

/* Regular (Default) */
.btn { padding: 12px 24px; font-size: 1rem; }

/* Small (Secondary actions) */
.btn-sm { padding: 8px 16px; font-size: 0.875rem; }

/* Icon Button */
.btn-icon {
  padding: 12px;
  width: 44px;  /* Minimum touch target */
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

#### Mobile Contact Button

Special button variant for phone calls (mobile only):

```css
.btn-phone-mobile {
  /* Position */
  position: fixed;
  bottom: 20px;
  right: 20px;

  /* Visual */
  background-color: var(--accent-primary);
  border-radius: 50%;
  width: 56px;
  height: 56px;
  box-shadow: 0 4px 16px var(--shadow-dark);

  /* Icon */
  display: flex;
  align-items: center;
  justify-content: center;
  color: #FFFFFF;

  /* Interaction */
  z-index: 1000;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.btn-phone-mobile:hover {
  transform: scale(1.1);
}

/* Hide on desktop */
@media (min-width: 768px) {
  .btn-phone-mobile {
    display: none;
  }
}
```

### Form Elements

#### Text Input

```css
.form-input {
  /* Visual */
  background-color: #FFFFFF;
  border: 2px solid var(--border-light);
  border-radius: 4px;

  /* Typography */
  font-size: var(--text-body);
  font-weight: var(--font-regular);
  color: var(--primary-text);

  /* Spacing */
  padding: 12px 16px;
  width: 100%;

  /* Interaction */
  transition: border-color 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: var(--accent-primary);
  box-shadow: 0 0 0 3px var(--light-accent);
}

.form-input:disabled {
  background-color: rgba(26, 26, 26, 0.05);
  cursor: not-allowed;
}

.form-input::placeholder {
  color: var(--border-light);
}
```

#### Select Dropdown

```css
.form-select {
  /* Inherits from .form-input */
  appearance: none;
  background-image: url("data:image/svg+xml,..."); /* Chevron down icon */
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 40px; /* Space for icon */
}
```

#### Checkbox & Radio

```css
.form-checkbox,
.form-radio {
  /* Custom styling */
  width: 20px;
  height: 20px;
  border: 2px solid var(--border-light);
  cursor: pointer;
  transition: all 0.2s ease;
}

.form-checkbox {
  border-radius: 4px;
}

.form-radio {
  border-radius: 50%;
}

.form-checkbox:checked,
.form-radio:checked {
  background-color: var(--accent-primary);
  border-color: var(--accent-primary);
}
```

#### Label

```css
.form-label {
  font-size: var(--text-small);
  font-weight: var(--font-medium);
  color: var(--primary-text);
  display: block;
  margin-bottom: 8px;
}

.form-label--required::after {
  content: "*";
  color: #DC2626; /* Red for required fields */
  margin-left: 4px;
}
```

#### Error State: "Helpful, Not Punitive"

Errors happen—design assumes users are **competent, not careless**. Error messaging should feel like a helpful coworker pointing out an oversight, not a system scolding failure.

**Error Philosophy**

**Visual Approach**
- **Red (#DC2626) signals attention** (not failure)—"This needs your input" rather than "You did wrong"
- **Icon + text** (never color alone)—accessibility + instant comprehension
- **Inline positioning** (errors near their source)—don't make users hunt for what went wrong
- **Specific messaging** ("Email format required" not "Invalid input")—tell users exactly what to fix

**Tone & Content**
- **What happened**: Clear statement of the issue
- **Why it matters**: Context for why this field is required
- **How to fix**: Actionable guidance

**Example**:
```
❌ Bad: "Invalid input"
✓ Good: "Email address must include @ symbol"

❌ Bad: "Error"
✓ Good: "Phone number must be 10 digits (e.g., 0401 089 545)"

❌ Bad: "Field required"
✓ Good: "Customer name is required to generate quote"
```

**Never**:
- Shake animations (aggressive, punitive feel)
- Aggressive red fills (red border only, not red background)
- Condescending copy ("Oops!", "Uh oh!", baby talk)
- Blocking entire forms (show all errors at once, don't force sequential fixes)

**Always**:
- Calm, clear guidance
- Specific next steps
- Maintained form state (never clear user's valid inputs)
- Instant validation feedback (don't wait for submit—help as they type)

**Design Principle**: Errors are conversation, not punishment. Help users succeed—don't make them feel incompetent.

```css
.form-input--error {
  border-color: #DC2626;
  border-width: 2px; /* Slightly thicker for emphasis */
}

.form-error-message {
  font-size: var(--text-small);
  color: #DC2626;
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.form-error-message::before {
  content: "⚠"; /* Alert icon */
  font-size: 14px;
}
```

### Cards

```css
.card {
  /* Visual */
  background-color: var(--primary-background);
  border-radius: 8px;
  box-shadow: 0 2px 8px var(--shadow-dark);

  /* Spacing */
  padding: var(--spacing-md);

  /* Layout */
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);

  /* Interaction */
  transition: box-shadow 0.2s ease;
}

.card:hover {
  box-shadow: 0 4px 16px var(--shadow-dark);
}

.card-header {
  font-size: var(--text-h3);
  font-weight: var(--font-bold);
  color: var(--primary-text);
}

.card-body {
  font-size: var(--text-body);
  line-height: var(--line-height-base);
  color: var(--primary-text);
}

.card-footer {
  padding-top: var(--spacing-sm);
  border-top: 1px solid var(--border-light);
}
```

### Icons

#### Icon Design Language: "Line-Drawn Blueprint"

All icons follow an **industrial clarity** aesthetic—they should look like they came from engineering drawings or safety signage. Clear, geometric, universally intelligible.

**Design Principles**

**Construction**
- **2px stroke weight**: Consistent with accent underlines (visual rhythm)
- **24×24px default**: Scales with text, never smaller than 20px
- **Rounded line caps**: Approachable professionalism (not sharp/aggressive)
- **No fill**: Outline only = clarity at small sizes, lighter visual weight

**Personality**
- **Geometric precision**: Not sketchy/hand-drawn, not organic/playful
- **Minimal detail**: Intelligible at 16px (mobile, high-density displays)
- **Consistent stroke weight**: All icons use same 2px—creates visual family
- **Universal symbols**: Recognize across cultures, no text in icons

**Visual Language**: Think **industrial safety signage** meets **Swiss pictograms**. Icons should be recognizable in 100ms or less—instant comprehension, no interpretation required.

**Usage Rules**
- Icons never stand alone—always pair with text label (except universal: ✕ close, ☰ menu, ⚙ settings)
- Color inherits from parent—icons adapt to context (black text = black icon, gold button = gold icon)
- Minimum size: 20px (smaller becomes unreadable)
- Maximum size: 32px (larger loses crispness, use illustrations instead)

#### Icon System

- **Style**: Outline/line-drawn SVG icons (minimalist)
- **Size**: 20px (small), 24px (default), 32px (large)
- **Stroke Width**: 2px (consistent across all icons)
- **Color**: Inherits from parent text color (`stroke: currentColor`)

```css
.icon {
  width: 24px;
  height: 24px;
  stroke: currentColor;
  stroke-width: 2;
  fill: none;
}

.icon--sm { width: 20px; height: 20px; }
.icon--lg { width: 32px; height: 32px; }
```

#### Core Icons Needed

Based on website imagery:
- Excavator (earthmoving services)
- Retaining wall (structural work)
- Water droplet/drainage (stormwater)
- Truck (material delivery)
- Ruler/measurement (site prep)
- Document (quotes)
- Calendar (scheduling)
- Phone (contact)
- Email (contact)
- Checkmark (completion)
- Alert/warning (errors)
- Information (help)

**Recommended Icon Library**: [Lucide Icons](https://lucide.dev/) or [Heroicons](https://heroicons.com/) (both offer minimalist line-drawn SVGs)

### Navigation

#### Header Navigation

```css
.header {
  /* Position */
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;

  /* Visual */
  background-color: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border-light);

  /* Layout */
  height: 64px;
  display: flex;
  align-items: center;
  padding: 0 var(--gutter-mobile);
}

@media (min-width: 768px) {
  .header {
    padding: 0 var(--gutter-desktop);
  }
}
```

#### Navigation Links

```css
.nav-link {
  /* Typography */
  font-size: var(--text-body);
  font-weight: var(--font-medium);
  color: var(--primary-text);
  text-decoration: none;

  /* Spacing */
  padding: 8px 16px;

  /* Interaction */
  transition: color 0.2s ease;
  position: relative;
}

.nav-link:hover {
  color: var(--accent-primary);
}

.nav-link--active::after {
  content: "";
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background-color: var(--accent-primary);
}
```

### Tables

```css
.table {
  width: 100%;
  border-collapse: collapse;
  background-color: var(--primary-background);
}

.table thead {
  background-color: rgba(26, 26, 26, 0.05);
}

.table th {
  font-size: var(--text-small);
  font-weight: var(--font-semibold);
  text-align: left;
  padding: 12px 16px;
  border-bottom: 2px solid var(--border-light);
}

.table td {
  font-size: var(--text-body);
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-light);
}

.table tbody tr:hover {
  background-color: rgba(26, 26, 26, 0.02);
}
```

### Modals/Dialogs

```css
.modal-overlay {
  /* Position */
  position: fixed;
  inset: 0;
  z-index: 2000;

  /* Visual */
  background-color: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);

  /* Layout */
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-md);
}

.modal {
  /* Visual */
  background-color: var(--primary-background);
  border-radius: 8px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);

  /* Size */
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;

  /* Spacing */
  padding: var(--spacing-lg);
}

.modal-header {
  font-size: var(--text-h3);
  font-weight: var(--font-bold);
  margin-bottom: var(--spacing-md);
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--border-light);
}
```

---

## Decorative Elements

### Accent Underlines

A signature design element from the website—curved and straight underlines beneath headings:

```css
.heading-underline {
  position: relative;
  display: inline-block;
}

.heading-underline::after {
  content: "";
  position: absolute;
  bottom: -8px;
  left: 0;
  width: 100%;
  height: 3px;
  background-color: var(--accent-primary);
  border-radius: 2px;
  animation: underline-slide 0.3s ease;
}

@keyframes underline-slide {
  from {
    width: 0;
  }
  to {
    width: 100%;
  }
}
```

#### Curved Underline Variant

For special emphasis (SVG-based curved path):

```css
.heading-underline--curve::after {
  background: none;
  border-bottom: 3px solid var(--accent-primary);
  border-radius: 0 0 50% 50%;
}
```

### Image Overlays

```css
.image-overlay {
  position: relative;
}

.image-overlay::before {
  content: "";
  position: absolute;
  inset: 0;
  background-color: var(--light-accent);
  pointer-events: none;
}
```

### Drop Shadows

```css
--shadow-sm: 0 1px 2px var(--shadow-dark);      /* Subtle depth */
--shadow-md: 0 2px 8px var(--shadow-dark);      /* Cards, buttons */
--shadow-lg: 0 4px 16px var(--shadow-dark);     /* Modals, elevated elements */
--shadow-xl: 0 8px 32px var(--shadow-dark);     /* Popovers, dropdowns */
```

---

## Imagery Guidelines

### Photography Style

- **Subject Matter**: Earthmoving equipment, landscaping work, project results
- **Composition**: Professional, well-lit, showing completed work
- **Color Grading**: Natural earth tones, slight warmth
- **Avoid**: Stock photos of unrelated construction, overly staged scenes

### Image Treatments

```css
.image-standard {
  width: 100%;
  height: auto;
  border-radius: 8px;
  object-fit: cover;
}

.image-hero {
  width: 100%;
  height: 400px;
  object-fit: cover;
  object-position: center;
}

/* Optional overlay for readability */
.image-with-text {
  position: relative;
}

.image-with-text::before {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    transparent 0%,
    rgba(0, 0, 0, 0.6) 100%
  );
}
```

### Map/Location Images

- **Style**: Grayscale or muted colors
- **Purpose**: Show service area (Mt Barker, Adelaide Hills)
- **Overlay**: Light accent color at low opacity

```css
.map-image {
  filter: grayscale(100%);
  opacity: 0.8;
}
```

---

## Responsive Design

### Breakpoints

```css
--breakpoint-sm: 640px;   /* Large phones, small tablets */
--breakpoint-md: 768px;   /* Tablets */
--breakpoint-lg: 1024px;  /* Small laptops */
--breakpoint-xl: 1280px;  /* Desktops */
--breakpoint-2xl: 1536px; /* Large screens */
```

### Mobile-First Approach

Always design for mobile first, then enhance for larger screens:

```css
/* Mobile (default) */
.container {
  padding: var(--spacing-md);
  font-size: var(--text-body);
}

/* Tablet and up */
@media (min-width: 768px) {
  .container {
    padding: var(--spacing-lg);
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .container {
    padding: var(--spacing-xl);
    font-size: 1.125rem; /* Slightly larger text */
  }
}
```

### Touch Targets

Minimum touch target size for mobile:

```css
/* All interactive elements */
.interactive-element {
  min-width: 44px;
  min-height: 44px;
}
```

### Responsive Typography

```css
.responsive-heading {
  font-size: clamp(1.5rem, 5vw, 3rem);
}

.responsive-body {
  font-size: clamp(0.875rem, 2vw, 1rem);
}
```

---

## Accessibility

### WCAG Compliance

Target: **WCAG 2.1 Level AA**

#### Color Contrast

- Body text (16px): Minimum 4.5:1 contrast ratio
- Large text (24px+): Minimum 3:1 contrast ratio
- UI components: Minimum 3:1 contrast ratio

#### Keyboard Navigation

```css
/* Focus states for keyboard users */
*:focus-visible {
  outline: 2px solid var(--accent-primary);
  outline-offset: 2px;
}

/* Remove outline for mouse users */
*:focus:not(:focus-visible) {
  outline: none;
}
```

#### Screen Reader Support

```html
<!-- Example: Icon button with accessible label -->
<button class="btn-icon" aria-label="Close dialog">
  <svg aria-hidden="true">...</svg>
</button>

<!-- Example: Form field with associated label -->
<label for="customer-name">Customer Name</label>
<input id="customer-name" type="text" aria-required="true">
```

#### Skip Links

```css
.skip-link {
  position: absolute;
  top: -100px;
  left: 0;
  background: var(--accent-primary);
  color: white;
  padding: 8px 16px;
  text-decoration: none;
  z-index: 10000;
}

.skip-link:focus {
  top: 0;
}
```

### Motion Preferences

```css
/* Respect user's motion preferences */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Brand Messaging

### Tagline

**"Embark on Your Land Journey."**

Use in: Login screen, splash screen, marketing materials

### Value Proposition

**"No hidden fees, no surprises—just quality work you can count on."**

Use in: Quote summaries, about sections, footer

### Core Services Statement

**"Specialised earthmoving contractors preparing homes for landscaping in Mt Barker & Adelaide Hills."**

Use in: App description, help documentation

### Call-to-Action Text

Primary CTA: **"Get Free Quote"**
Secondary CTA: **"Let Us Work Together"**
Contact CTA: **"Call Us: 0401 089 545"**

### Tone Guidelines

- **Do**: Use clear, direct language; explain technical terms; emphasize transparency
- **Don't**: Use jargon without explanation; overpromise; create artificial urgency

---

## Quote Number Format

### Structure

```
EE-YYYY-NNNN
```

- **EE**: Embark Earthworks initials
- **YYYY**: Four-digit year
- **NNNN**: Sequential number (zero-padded)

### Examples

```
EE-2025-0001  (First quote of 2025)
EE-2025-0042  (42nd quote of 2025)
EE-2026-0001  (Resets each year)
```

### Display

- Quote list: Show full format `EE-2025-0001`
- PDF header: Full format with bold styling
- Mobile card: Can abbreviate to `#0001` with context

---

## Motion Design: "Purposeful Choreography"

Animations aren't decoration—they're **spatial orientation aids** and feedback mechanisms. Every motion serves a purpose: revealing structure, confirming actions, or guiding attention.

### Motion Philosophy

**Mechanical Precision**
Like well-oiled construction machinery, interface motion should feel:
- **Predictable**: Same action = same animation (consistency builds trust)
- **Decisive**: Clear start and end states (no ambiguous wobbling)
- **Efficient**: Fast enough to feel responsive, slow enough to be perceived

**Invisible by Default**
Perfect animation feels like **no animation**—it's not a performance, it's clarification. Users shouldn't notice motion; they should feel orientation.

**Rule**: Motion reveals structure. If animation doesn't clarify spatial relationships or state changes, remove it.

### Principles

- **Purposeful**: Animations should guide attention or provide feedback (never decorative)
- **Subtle**: Industrial precision, not theatrical flourish—avoid bounces, elasticity, overshoot
- **Performant**: Use CSS transforms and opacity (GPU-accelerated)—never animate width, height, or position directly
- **Respectful**: Honor `prefers-reduced-motion` settings (accessibility requirement)
- **Consistent**: Same interaction = same motion timing (button clicks all use 200ms, modals all use 300ms)

### Timing & Personality

```css
--duration-instant: 100ms;   /* Hover states, tooltips */
--duration-fast: 200ms;      /* Button clicks, toggles */
--duration-base: 300ms;      /* Modal open, drawer slide */
--duration-slow: 500ms;      /* Page transitions */

--easing-standard: cubic-bezier(0.4, 0.0, 0.2, 1);
--easing-decelerate: cubic-bezier(0.0, 0.0, 0.2, 1);
--easing-accelerate: cubic-bezier(0.4, 0.0, 1, 1);
```

**Timing Personality**

- **100ms (instant)** → Direct feedback
  - Use for: Hover states, tooltip appearance, focus rings
  - Feels: Immediate response to user action
  - Like: Light switch—instant acknowledgment

- **200ms (fast)** → State changes
  - Use for: Button clicks, toggles, checkbox checks, tab switches
  - Feels: Snappy, responsive, efficient
  - Like: Tool click—quick, satisfying snap

- **300ms (base)** → Transitions
  - Use for: Modal open, drawer slide, accordion expand
  - Feels: Natural, smooth, intentional
  - Like: Equipment activation—deliberate but not sluggish

- **500ms (slow)** → Major shifts
  - Use for: Page transitions, context switches, large reflows
  - Feels: Substantial, momentous, spatial
  - Like: Heavy machinery moving—slow but powerful

**Easing Strategy**

- **Standard (cubic-bezier 0.4,0,0.2,1)** → Balanced, natural
  - Use: Most animations—neutral personality
  - Character: Starts slightly slow, ends slightly slow (natural acceleration)

- **Decelerate (cubic-bezier 0,0,0.2,1)** → Entrances
  - Use: Elements appearing (modals opening, dropdowns expanding)
  - Character: Fast start, gentle landing—feels inviting
  - Why: Objects enter quickly but settle smoothly

- **Accelerate (cubic-bezier 0.4,0,1,1)** → Exits
  - Use: Elements disappearing (modals closing, tooltips hiding)
  - Character: Gentle start, quick finish—feels decisive
  - Why: Objects leave deliberately, exit cleanly

**Rule**: Motion reveals structure. Never animate for spectacle. Each animation should answer: "What spatial change or state shift am I clarifying?"

### Common Animations

#### Fade In

```css
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.fade-in {
  animation: fade-in var(--duration-base) var(--easing-standard);
}
```

#### Slide Up

```css
@keyframes slide-up {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.slide-up {
  animation: slide-up var(--duration-base) var(--easing-decelerate);
}
```

#### Button Press

```css
.btn:active {
  transform: scale(0.98);
  transition: transform var(--duration-instant);
}
```

---

## Dark Mode Considerations

**Note**: The current Embark Earthworks website uses a light theme exclusively. However, for future-proofing, here are dark mode guidelines:

### Dark Mode Palette (Proposed)

```css
/* Dark Mode Variables */
@media (prefers-color-scheme: dark) {
  :root {
    --primary-background: #1A1A1A;
    --primary-text: #F5F5F5;
    --shadow-dark: rgba(0, 0, 0, 0.5);
    --border-light: rgba(255, 255, 255, 0.1);
    /* Accent color remains the same for brand consistency */
  }
}
```

### Implementation Strategy

1. **Phase 1** (Current): Light mode only
2. **Phase 2** (Future): Respect system preference with toggle
3. **Testing**: Ensure accent color maintains contrast in both modes

---

## Living Examples & Anti-Patterns

### Well-Executed Patterns

These examples demonstrate the design philosophy in practice:

#### ✓ **Quote Card with Perfect Spacing**
```
┌────────────────────────────────────────────────┐
│  [16px padding]                                │
│                                                │
│  Quote #EE-2025-0042                    [24px] │  ← Bold heading
│  Customer: John Smith                   [8px]  │  ← Medium label
│  Job Type: Retaining Wall               [8px]  │
│  Total: $12,450                         [16px] │  ← Section break
│                                                │
│  [Primary Button: View Details]               │  ← CAT Gold button
│                                                │
│  [16px padding]                                │
└────────────────────────────────────────────────┘

Design Elements:
✓ Consistent 16px card padding (meso-rhythm)
✓ 8px spacing between related items (micro-rhythm)
✓ 24px spacing between heading and content (clear separation)
✓ Primary button uses CAT Gold (action invitation)
✓ White card on white background with subtle shadow (depth without decoration)
```

#### ✓ **Form with Clear Hierarchy**
```
Customer Information                              ← H3 heading (24px, bold)
[16px spacing]

Customer Name*                                    ← Label (14px, medium)
[8px spacing]
┌──────────────────────────────────┐
│  [Input field]                   │             ← Input (16px text, 12px padding)
└──────────────────────────────────┘
[24px spacing]                                    ← Section break

Phone Number*                                     ← Label (14px, medium)
[8px spacing]
┌──────────────────────────────────┐
│  [Input field]                   │
└──────────────────────────────────┘
[32px spacing]                                    ← Major section break

                        [Save Quote]              ← Primary button, right-aligned

Design Elements:
✓ Label above input (8px gap—visual coupling)
✓ Sections separated by 24-32px (clear boundaries)
✓ Required asterisk in red (functional color, not decoration)
✓ Button right-aligned (action position)
✓ Never more than 3 text sizes on screen (hierarchy through size + weight)
```

#### ✓ **Button States showing Industrial Precision**
```
Default:     [Create Quote]                      ← CAT Gold #FFB400, solid, grounded
Hover:       [Create Quote] ↑                    ← Darker #E6A200, lifted 1px, shadow appears
Active:      [Create Quote] ↓                    ← Compressed back to baseline
Disabled:    [Create Quote]                      ← 60% opacity, not-allowed cursor

Design Elements:
✓ Physical realism (button lifts on hover, compresses on click)
✓ State changes are immediate (200ms—snappy feedback)
✓ Disabled maintains structure (shows "action exists, just unavailable")
✓ Action verb text ("Create" not "OK")
```

### Anti-Patterns to Avoid

#### ❌ **Cramped Interface**
```
Problem: Insufficient spacing
┌──────────────────────────┐
│Customer Name*            │  ← No padding
│┌────────────────────────┐│  ← Input too close to label
││                        ││
│└────────────────────────┘│
│Phone Number*             │  ← Only 4px gap (too tight)
│┌────────────────────────┐│
││                        ││
│└────────────────────────┘│
│[Save]                    │  ← Button too close to input
└──────────────────────────┘

Issues:
❌ <8px gaps create visual tension
❌ No breathing room—feels cramped
❌ Elements blur together—hard to scan

Solution: Minimum 8px between distinct elements, 16px for section breathing
```

#### ❌ **Weak Hierarchy**
```
Problem: Same-size headings and body text

Customer Information                              ← 16px (same as body)
Please enter customer details for this quote      ← 16px
John Smith                                        ← 16px
0401 089 545                                      ← 16px

Issues:
❌ No visual priority—everything same size
❌ Can't quickly scan for important info
❌ Heading doesn't command attention

Solution: Use type scale (24px heading → 16px body → 14px labels)
```

#### ❌ **Color Overuse**
```
Problem: Too many colors fighting for attention

[Blue Button] [Green Button] [Orange Button] [Red Button]

Customer Name (in purple)
Phone Number (in teal)
Job Type (in orange)
Total Cost (in green)

Issues:
❌ Rainbow effect—no color has meaning
❌ CAT Gold loses significance (not rare anymore)
❌ Looks unprofessional, chaotic

Solution: Monochrome (white/black) + CAT Gold accent only. Semantic colors (red/green/blue) only for status.
```

#### ❌ **Ambiguous Button Text**
```
Problem: Generic, unclear actions

[OK]  [Cancel]  [Submit]  [Continue]

Issues:
❌ "OK" — OK to what?
❌ "Submit" — Submit what? Where does it go?
❌ "Continue" — Continue to where? What happens?

Solution: Action verbs describing outcome
✓ [Save Quote]  ✓ [Cancel Changes]  ✓ [Generate PDF]  ✓ [Email Customer]
```

#### ❌ **Decorative Animation**
```
Problem: Animation without purpose

Button bounces on hover 🎈
Modal spins open 🌀
Text fades in with 3-second delay ⏳

Issues:
❌ Slows user down (3s fade delay = 3s wasted)
❌ Bounce/spin = playful, not professional
❌ Motion doesn't clarify structure—just spectacle

Solution: 200-300ms fade/slide, decelerate easing, purposeful motion only
```

### Design Review Checklist

Before shipping any screen:

**Spacing**
- [ ] Minimum 8px between distinct elements?
- [ ] 16-24px between sections?
- [ ] Generous card padding (16px minimum)?
- [ ] Breathing room around primary actions?

**Color**
- [ ] Monochrome (white/black) + CAT Gold only?
- [ ] Gold used sparingly (reserved for primary actions)?
- [ ] Semantic colors only for status (red/green/blue)?
- [ ] No rainbow effect?

**Typography**
- [ ] Maximum 3 text sizes per screen?
- [ ] Clear hierarchy (heading → body → labels)?
- [ ] System fonts only?
- [ ] Action verbs in button text?

**Motion**
- [ ] Animations serve purpose (not decoration)?
- [ ] 200-300ms timing (not too slow)?
- [ ] Decelerate for entrances, accelerate for exits?
- [ ] `prefers-reduced-motion` respected?

**Accessibility**
- [ ] Color contrast ≥4.5:1 for body text?
- [ ] Icons paired with text labels?
- [ ] Focus states visible (2px gold outline)?
- [ ] Error messages specific and helpful?

---

## Implementation Checklist

### Phase 1: Foundation
- [ ] Extract exact accent color hex code from website
- [ ] Set up CSS custom properties for all color variables
- [ ] Implement typography scale with custom properties
- [ ] Create base button components
- [ ] Build form input components
- [ ] Establish grid system and spacing scale

### Phase 2: Components
- [ ] Card component with variations
- [ ] Navigation header with logo
- [ ] Modal/dialog component
- [ ] Table component for quote lists
- [ ] Icon system setup (select library)
- [ ] Decorative underline elements

### Phase 3: Polish
- [ ] Implement all animation behaviors
- [ ] Add keyboard focus styles
- [ ] Test color contrast ratios
- [ ] Verify touch target sizes on mobile
- [ ] Add motion preference media queries
- [ ] Test responsive breakpoints

### Phase 4: Assets
- [ ] Request logo files from company (SVG + PNG)
- [ ] Optimize logo for web use
- [ ] Create favicon variants
- [ ] Source or create custom icons
- [ ] Prepare placeholder images for development

---

## File Organization

### Recommended Structure

```
frontend/src/
├── styles/
│   ├── tokens/
│   │   ├── colors.css          # Color custom properties
│   │   ├── typography.css      # Type scale, font stack
│   │   ├── spacing.css         # Spacing scale, grid
│   │   └── shadows.css         # Shadow variables
│   ├── base/
│   │   ├── reset.css           # CSS reset
│   │   ├── global.css          # Global styles
│   │   └── accessibility.css   # Focus states, screen reader utilities
│   ├── components/
│   │   ├── button.css          # Button variants
│   │   ├── form.css            # Form elements
│   │   ├── card.css            # Card component
│   │   ├── modal.css           # Modal/dialog
│   │   └── table.css           # Table styles
│   └── utilities/
│       ├── animations.css      # Keyframe animations
│       └── helpers.css         # Utility classes
└── assets/
    ├── icons/                  # SVG icons
    └── images/
        └── logo/               # Logo variants
```

---

## Resources

### Design Tools

- **Color Extraction**: Use browser DevTools or [Colorzilla](https://www.colorzilla.com/)
- **Contrast Checker**: [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- **Icon Library**: [Lucide Icons](https://lucide.dev/) or [Heroicons](https://heroicons.com/)

### References

- **Source Website**: https://www.embarkearthworks.au/
- **WCAG Guidelines**: https://www.w3.org/WAI/WCAG21/quickref/
- **CSS Custom Properties**: https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties

### Contact

For questions about brand usage or to request logo assets, contact Embark Earthworks directly via the website contact form.

---

## Visual Reference Screenshots

### Purpose

Screenshots provide visual documentation of the live website design for future reference when making design decisions. They capture the actual rendered appearance including colors, spacing, typography, and interactive states that may not be fully documented in code.

### Screenshot Directory Structure

```
docs/assets/screenshots/
├── homepage/
│   ├── hero-section.png
│   ├── services-cards.png
│   ├── contact-cta.png
│   └── footer.png
├── mobile/
│   ├── homepage-mobile.png
│   ├── navigation-mobile.png
│   └── contact-button-mobile.png
├── colors/
│   ├── accent-underlines.png
│   ├── button-states.png
│   └── text-hierarchy.png
└── logo/
    ├── header-logo.png
    ├── logo-spacing.png
    └── logo-on-backgrounds.png
```

### Recommended Screenshots to Capture

#### 1. Homepage Sections
- **Hero Section**: Full hero with tagline, logo, main imagery
- **Services Cards**: "Our Three Core Service" section showing card layout
- **Contact CTA**: "Let Us Work Together" call-to-action area
- **Footer**: Full footer with contact info and branding

#### 2. Mobile Views
- **Homepage Mobile**: Full mobile homepage (375px width)
- **Navigation Mobile**: Mobile menu expanded/collapsed
- **Contact Button Mobile**: Floating phone button (if visible)

#### 3. Color Examples
- **Accent Underlines**: Close-up of #FFB400 underline beneath heading
- **Button States**: "Get Free Quote" button (normal, hover if possible)
- **Text Hierarchy**: Example showing heading, subheading, body text colors

#### 4. Logo Usage
- **Header Logo**: Logo as it appears in site header
- **Logo Spacing**: Logo with visible clear space around it
- **Logo on Backgrounds**: Logo on different background colors/images

### Screenshot Guidelines

#### Capture Settings
```
Desktop Resolution: 1920×1080 (or 1280×720)
Mobile Resolution: 375×667 (iPhone SE) or 390×844 (iPhone 12/13)
File Format: PNG (lossless for UI)
Color Profile: sRGB
Browser: Chrome or Firefox (latest stable)
Zoom Level: 100% (no browser zoom)
```

#### Naming Convention
```
[section]-[element]-[viewport].png

Examples:
homepage-hero-desktop.png
homepage-services-cards-desktop.png
mobile-navigation-menu-mobile.png
colors-accent-underline-closeup.png
logo-header-usage-desktop.png
```

#### Capture Process
1. Clear browser cache to ensure fresh load
2. Disable browser extensions that modify appearance
3. Use full-page screenshot tools (built-in or extension)
4. Capture at 100% zoom (no browser zoom)
5. For hover states, use browser DevTools to force :hover state
6. Annotate screenshots if needed (arrows, labels)

### Screenshot Annotation Tools

**Recommended Tools**:
- **macOS**: Screenshot markup (Cmd+Shift+5, then annotate)
- **Windows**: Snip & Sketch (Win+Shift+S, then annotate)
- **Linux**: GNOME Screenshot + Annotator or Shutter
- **Cross-platform**: [Flameshot](https://flameshot.org/) (open source)
- **Browser Extension**: [Awesome Screenshot](https://www.awesomescreenshot.com/)

### Using Screenshots in Design Decisions

When implementing features or resolving design questions:

1. **Color Verification**: Compare screenshot colors to style guide hex values using color picker
2. **Spacing Decisions**: Measure element spacing in screenshots using design tools
3. **Typography Matching**: Compare font rendering to ensure consistency
4. **Responsive Patterns**: Reference mobile screenshots for breakpoint behavior
5. **Interactive States**: Document hover/active states when CSS alone isn't clear

### Updating Screenshots

**Update screenshots when**:
- Website design changes significantly
- New sections or features are added to the website
- Brand colors or logo are updated
- Need reference for new component implementation

**Frequency**: Review and update quarterly or when notified of website changes

### Screenshot Metadata

Create a `screenshots-index.md` file in the same directory:

```markdown
# Screenshot Index

## Homepage Desktop
- **File**: homepage-hero-desktop.png
- **Captured**: 2025-11-06
- **URL**: https://www.embarkearthworks.au/
- **Viewport**: 1920×1080
- **Browser**: Chrome 120
- **Notes**: Main hero section with tagline overlay

[Repeat for each screenshot]
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-11-06 | Initial style guide created from website analysis |
| 1.1 | 2025-11-06 | Added #FFB400 CAT Gold accent color throughout document; Added comprehensive logo documentation with three variants (icon-dark, icon-light, wordmark-black); Added CAT brand association and color psychology section; Added semantic colors for status states; Added logo implementation examples and accessibility guidelines |
| 1.2 | 2025-11-06 | Added Visual Reference Screenshots section with directory structure, capture guidelines, and screenshot metadata templates; Created supporting documentation: devtools-color-extraction-guide.md and visual-qa-checklist.md for comprehensive design verification |
| **2.0** ✨ | 2025-11-06 | **MASTER-LEVEL ELEVATION**: Added comprehensive Design Philosophy ("Industrial Clarity") establishing Brutalist honesty + Swiss precision as foundations; Enhanced Color Palette with chromatic storytelling and color relationships hierarchy; Added Typographic Voice section explaining font philosophy and behavioral patterns; Added Spatial Rhythm ("Breathing Architecture") philosophy with micro/meso/macro rhythm explanations; Enhanced Button component with "Confident Affordance" personality and interaction choreography; Transformed Motion Design with "Purposeful Choreography" philosophy, timing personalities, and easing strategies; Added Icon Design Language ("Line-Drawn Blueprint") with industrial clarity principles; Added Error State Philosophy ("Helpful, Not Punitive") with empathetic messaging guidelines; Created Living Examples & Anti-Patterns section with well-executed patterns, common mistakes, and design review checklist. **Result**: Elevated from technical documentation to philosophical design system that teaches design thinking, not just specifications. |

---

## Assets Added

The following logo assets have been incorporated into the project:

```
frontend/src/assets/images/logo/
├── embark-icon-dark.webp      # 550×550px - White icon on dark background
├── embark-icon-light.webp     # 512×512px - Off-white icon, transparent (favicon)
└── embark-wordmark-black.webp # ~1200×200px - Horizontal logo with text

docs/assets/
├── embark-icon-dark.webp      # Reference copy for documentation
├── embark-icon-light.webp     # Reference copy for documentation
└── embark-wordmark-black.webp # Reference copy for documentation
```

---

**Next Steps:**
1. ✅ ~~Extract exact accent color hex code from live website~~ (Completed: #FFB400)
2. ✅ ~~Request official logo files from company~~ (Completed: 3 variants added)
3. **Implement design system tokens** (Create CSS custom properties file)
4. **Generate favicon suite** (Use embark-icon-light.webp to create all sizes)
5. **Create base React components** (Button, Input, Card following style guide)
6. **Request SVG logo versions** (For better scalability and smaller file sizes)
7. Update this guide as design system evolves
