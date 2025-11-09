# Browser DevTools Color Extraction Guide

**Purpose**: Step-by-step instructions for extracting exact color values from the Embark Earthworks website using browser developer tools.

**Target Website**: https://www.embarkearthworks.au/

**Why This Matters**: CSS custom properties and compiled stylesheets hide actual color values in source code. DevTools reveals the computed colors that browsers actually render.

---

## Table of Contents

1. [Quick Start (2 minutes)](#quick-start-2-minutes)
2. [Chrome/Edge DevTools](#chromeedge-devtools)
3. [Firefox DevTools](#firefox-devtools)
4. [Safari DevTools](#safari-devtools)
5. [Color Picker Extensions](#color-picker-extensions)
6. [Verifying Colors Against Style Guide](#verifying-colors-against-style-guide)
7. [Troubleshooting](#troubleshooting)

---

## Quick Start (2 minutes)

### Extract Accent Color (#FFB400)

**Fastest Method - Chrome/Edge**:

1. Open https://www.embarkearthworks.au/
2. Find a heading with an underline (e.g., "Our Three Core Service")
3. Right-click the underline → **Inspect**
4. In the **Styles** panel, look for `background-color` or `border-bottom-color`
5. Click the **color swatch** (small colored square)
6. The color picker shows the hex value → should be **#FFB400** or similar

**Expected Result**: `#FFB400` (CAT Gold)

---

## Chrome/Edge DevTools

### Step 1: Open DevTools

**Methods**:
- Right-click anywhere → **Inspect**
- Keyboard: `F12` or `Ctrl+Shift+I` (Windows/Linux), `Cmd+Opt+I` (macOS)
- Menu: `⋮` → More Tools → Developer Tools

### Step 2: Select Element

**Option A: Element Picker**
1. Click the **Select Element** icon (top-left of DevTools, looks like cursor in box)
2. Hover over the element you want to inspect
3. Click to select it

**Option B: Right-Click Method**
1. Right-click directly on the element
2. Select **Inspect** or **Inspect Element**

### Step 3: Find Color Properties

In the **Styles** panel (right side), look for these CSS properties:

```css
/* Common color properties */
background-color: #FFB400;
color: #1A1A1A;
border-color: #FFB400;
border-bottom-color: #FFB400;
text-decoration-color: #FFB400;
box-shadow: 0 2px 8px rgba(26, 26, 26, 0.2);
```

### Step 4: Use Color Picker

1. **Click the color swatch** (small colored square before the color value)
2. Color picker appears with:
   - Hex value at top (e.g., `#FFB400`)
   - RGB/HSL values
   - Eyedropper tool to sample other colors
   - Opacity slider

### Step 5: Extract Hex Value

**Method A: Copy from Picker**
- Select the hex value in the picker
- Press `Ctrl+C` (Windows/Linux) or `Cmd+C` (macOS)

**Method B: Click to Switch Formats**
- Click the color value in Styles panel to cycle through formats:
  - Hex: `#FFB400`
  - RGB: `rgb(255, 180, 0)`
  - HSL: `hsl(42, 100%, 50%)`

### Step 6: Verify Computed Styles

If color isn't visible in Styles panel:

1. Switch to **Computed** tab (next to Styles)
2. Search for the property (e.g., "background-color")
3. See the final computed value
4. Click arrow to see which stylesheet set it

### Chrome-Specific: Color Palettes

**View all colors used on the page**:

1. Open **Rendering** panel: `⋮` (three dots) → More tools → Rendering
2. Scroll to **Emulate CSS media feature**
3. Enable **Print** emulation to see print styles
4. Or use **Contrast** section to check accessibility

---

## Firefox DevTools

### Step 1: Open DevTools

**Methods**:
- Right-click anywhere → **Inspect Element**
- Keyboard: `F12` or `Ctrl+Shift+I` (Windows/Linux), `Cmd+Opt+I` (macOS)
- Menu: `☰` → More Tools → Web Developer Tools

### Step 2: Inspector Tool

1. Click **Inspector** tab (if not already selected)
2. Use **Pick an element** tool (top-left icon)
3. Click the element you want to inspect

### Step 3: Rules Panel

In the **Rules** panel (right side):

1. Find color properties (same as Chrome)
2. **Click the color swatch** to open color picker
3. Firefox color picker shows:
   - Hex value
   - Eyedropper tool
   - Color format switcher
   - Contrast ratio (accessibility)

### Step 4: Eyedropper Tool

Firefox has excellent eyedropper:

1. Click eyedropper icon in color picker
2. Hover over **any pixel on the page**
3. Click to sample that exact color
4. Hex value updates automatically

### Firefox-Specific: Accessibility Panel

**Check color contrast**:

1. Open **Accessibility** panel (tab at bottom)
2. Select element
3. View contrast ratio with background
4. See WCAG AA/AAA compliance

---

## Safari DevTools

### Step 1: Enable Developer Tools

**First-time setup**:
1. Safari → Settings (Preferences)
2. Advanced tab
3. Check **Show Develop menu in menu bar**

### Step 2: Open Web Inspector

**Methods**:
- Right-click → **Inspect Element**
- Keyboard: `Cmd+Opt+I`
- Menu: Develop → Show Web Inspector

### Step 3: Elements Tab

1. Click **Elements** tab
2. Use element selector (top-left)
3. Click element to inspect

### Step 4: Styles Sidebar

1. View **Styles** sidebar (right)
2. Find color properties
3. **Click color swatch** for color picker
4. Safari picker shows:
   - Hex, RGB, HSL values
   - Color sliders
   - Eyedropper

### Safari-Specific: Design Mode

**Edit live styles**:
1. Console → type `document.designMode = "on"`
2. Edit text and styles directly on the page
3. Sample colors as you experiment

---

## Color Picker Extensions

### Recommended Browser Extensions

#### 1. **ColorZilla** (Chrome, Firefox)
- **URL**: https://www.colorzilla.com/
- **Features**: Eyedropper, color history, palette generator
- **Usage**:
  1. Click extension icon
  2. Click **Pick Color from Page**
  3. Click any element
  4. Hex value copied to clipboard

#### 2. **Eye Dropper** (Chrome)
- **URL**: Chrome Web Store → Search "Eye Dropper"
- **Features**: Simple, fast, color history
- **Usage**:
  1. Click extension icon
  2. Click anywhere on page
  3. View hex value

#### 3. **ColorPick Eyedropper** (Chrome, Firefox)
- **URL**: https://colorpick.net/
- **Features**: Zoom mode, color history, keyboard shortcuts
- **Usage**:
  1. Click extension icon (or press `Alt+P`)
  2. Click element
  3. Color saved to history

### Extension vs DevTools

**Use Extensions When**:
- Need quick color sampling
- Want to save color history
- Building a color palette
- Sampling from images or graphics

**Use DevTools When**:
- Need to see CSS property names
- Verifying computed styles
- Checking specificity and inheritance
- Debugging style issues

---

## Verifying Colors Against Style Guide

### Embark Earthworks Brand Colors

From `docs/style-guide.md`:

```css
/* Primary Colors */
--primary-background: #FFFFFF;    /* Pure white */
--primary-text: #1A1A1A;          /* Near-black */
--accent-primary: #FFB400;        /* CAT Gold */

/* Accent Variants */
--accent-hover: #E6A200;          /* Darker gold */
--accent-light: #FFCA4D;          /* Lighter gold */
--light-accent: rgba(255, 180, 0, 0.52); /* 52% opacity */

/* Shadows */
--shadow-dark: rgba(26, 26, 26, 0.2); /* 20% black */
--border-light: rgba(26, 26, 26, 0.1); /* 10% black */

/* Semantic Colors */
--success: #10B981;  /* Green */
--warning: #F59E0B;  /* Orange */
--error: #DC2626;    /* Red */
--info: #3B82F6;     /* Blue */
```

### Elements to Verify

Use this checklist to verify colors on https://www.embarkearthworks.au/:

#### Accent Color (#FFB400)
- [ ] **Heading underlines**: Should be #FFB400
- [ ] **Text highlights**: Should use #FFB400
- [ ] **Glow effects**: Should use #FFB400 (possibly with opacity)
- [ ] **Button hover states**: Should use #E6A200 or similar darker variant

#### Background & Text
- [ ] **Page background**: Should be #FFFFFF (pure white)
- [ ] **Body text**: Should be #1A1A1A or very dark gray
- [ ] **Card backgrounds**: Should be #FFFFFF with subtle shadow

#### Interactive Elements
- [ ] **Primary buttons**: Background likely uses #FFB400
- [ ] **Links**: May use #FFB400 for hover/active
- [ ] **Focus states**: Should use #FFB400 or variant

### Color Comparison Method

**Visual Check**:
1. Extract color from website using DevTools
2. Compare hex value to style guide
3. Allow for slight variations (±5 in RGB values)

**Example**:
```
Website: #FFB400
Style Guide: #FFB400
Match: ✓ Perfect match

Website: #FFB500
Style Guide: #FFB400
Match: ✓ Close enough (1-2 RGB units difference acceptable)

Website: #FFC107
Style Guide: #FFB400
Match: ✗ Different color (investigate why)
```

### Tolerance Levels

**Exact Match** (preferred):
- Hex values identical
- RGB values identical

**Acceptable Variance**:
- 1-5 RGB units difference (may be due to compression or browser rendering)
- Opacity variations (e.g., 0.52 vs 0.5)

**Needs Investigation**:
- >10 RGB units difference
- Completely different hue (yellow vs orange, yellow vs green)

---

## Extracting Specific Elements

### 1. Extract Accent Underline Color

**Target**: Underline beneath "Our Three Core Service" heading

```
1. Open https://www.embarkearthworks.au/
2. Scroll to "Our Three Core Service" section
3. Right-click on the underline decoration
4. Select "Inspect"
5. In Styles panel, look for:
   - border-bottom-color
   - text-decoration-color
   - background-color (if underline is pseudo-element)
6. Click color swatch
7. Record hex value → should be #FFB400
```

### 2. Extract Button Color

**Target**: "Get Free Quote" button

```
1. Locate the "Get Free Quote" button
2. Right-click → Inspect
3. In Styles panel, find:
   - background-color: [value]
   - border-color: [value]
4. Click color swatch
5. Record hex value
6. Check for :hover styles in Styles panel
7. Enable :hover state using :hov button (Chrome) or Pseudo-classes (Firefox)
```

### 3. Extract Text Colors

**Target**: Body text and headings

```
Heading Color:
1. Inspect any <h1>, <h2>, or <h3> element
2. Find "color" property
3. Record hex value → should be #1A1A1A or similar dark

Body Text Color:
1. Inspect paragraph text
2. Find "color" property
3. Record hex value → should be #1A1A1A
```

### 4. Extract Shadow Colors

**Target**: Card drop shadows

```
1. Inspect a white card/container element
2. Find "box-shadow" property:
   box-shadow: 0 2px 8px rgba(26, 26, 26, 0.2);
3. Click the shadow color swatch
4. Note the RGBA values
5. Opacity should be around 0.2 (20%)
```

### 5. Extract Background Colors

**Target**: Page and card backgrounds

```
1. Inspect <body> or <main> element
2. Find "background-color"
3. Should be #FFFFFF (white)
4. Verify computed value in Computed tab
```

---

## Troubleshooting

### Problem: Color Not Showing in Styles Panel

**Solution A: Check Computed Styles**
- Switch to "Computed" tab
- Search for the property (e.g., "background-color")
- See the final computed value

**Solution B: Check Inherited Styles**
- Styles panel shows inherited properties in gray
- Expand parent elements to find where color is set

**Solution C: Check Pseudo-Elements**
- Underlines may be on `::after` or `::before` pseudo-elements
- In Elements tree (Chrome), look for `::before` / `::after` under element
- Click to see their styles

### Problem: Color Looks Different Than Extracted Hex

**Possible Causes**:

1. **Opacity/Transparency**:
   - Color has alpha channel: `rgba(255, 180, 0, 0.52)`
   - Appears lighter due to transparency
   - Check "opacity" property separately

2. **Overlays**:
   - Multiple elements stacked
   - Use z-index or position to identify layering
   - Sample the top-most visible layer

3. **Filters**:
   - CSS filters can alter appearance
   - Check for `filter`, `backdrop-filter` properties
   - Extract color from unfiltered element

4. **Color Profiles**:
   - Monitor color calibration
   - Browser color management
   - Use sRGB color space for web

### Problem: Can't Find Accent Color

**Where to Look**:

1. **Heading underlines**:
   - Inspect `<h1>`, `<h2>`, `<h3>` elements
   - Look for `::after` or `::before` pseudo-elements
   - Check `border-bottom`, `text-decoration-color`, `background`

2. **Highlight shapes**:
   - Squarespace uses "highlight" shape elements
   - Inspect the decoration/shape, not the text itself
   - May be separate `<div>` or `<span>` elements

3. **SVG elements**:
   - Underlines may be SVG paths
   - Inspect SVG, look for `fill` or `stroke` attributes
   - Right-click SVG path → Inspect

### Problem: DevTools Shows CSS Variable

**Example**:
```css
background-color: var(--accent);
```

**Solution**:
1. **Computed Tab**: Shows resolved value, not variable
2. **Click Variable**: Some browsers show tooltip with value
3. **Search Styles**: Search for `--accent:` to find definition
4. **Root Styles**: Check `:root` styles at top of Styles panel

### Problem: Hover State Not Visible

**Force Hover State**:

**Chrome/Edge**:
1. Click **:hov** button in Styles panel
2. Check **:hover** checkbox
3. Element stays in hover state
4. Extract color from hover styles

**Firefox**:
1. In Rules panel, click **:hov** button
2. Enable **:hover** pseudo-class
3. Hover styles apply persistently

**Safari**:
1. In Styles sidebar, click **New Style** (+)
2. Add `:hover` selector manually
3. Or use JavaScript console: `element.style.backgroundColor = "#E6A200"`

---

## Recording Your Findings

### Create Color Extraction Report

**Template** (`docs/color-extraction-report.md`):

```markdown
# Color Extraction Report - Embark Earthworks Website

**Date**: 2025-11-06
**URL**: https://www.embarkearthworks.au/
**Browser**: Chrome 120.0.6099.129
**Viewport**: 1920×1080

## Accent Colors

### Primary Accent (#FFB400)
- **Element**: Heading underline beneath "Our Three Core Service"
- **Property**: `border-bottom-color`
- **Extracted Value**: #FFB400
- **Match**: ✓ Exact match with style guide

### Accent Hover (#E6A200)
- **Element**: "Get Free Quote" button :hover state
- **Property**: `background-color`
- **Extracted Value**: #E6A200
- **Match**: ✓ Exact match with style guide

## Background & Text

### Page Background
- **Element**: <body>
- **Property**: `background-color`
- **Extracted Value**: #FFFFFF
- **Match**: ✓ Pure white

### Body Text
- **Element**: <p> paragraph text
- **Property**: `color`
- **Extracted Value**: #1A1A1A
- **Match**: ✓ Near-black

## Shadows

### Card Shadow
- **Element**: Service card container
- **Property**: `box-shadow`
- **Extracted Value**: `0 2px 8px rgba(26, 26, 26, 0.2)`
- **Match**: ✓ Matches style guide

## Screenshots

[Attach DevTools screenshots showing extracted colors]

## Notes

- All colors match style guide specifications
- No unexpected color variations found
- Accent color (#FFB400) used consistently throughout site
```

---

## Quick Reference

### Common Keyboard Shortcuts

| Action | Chrome/Edge | Firefox | Safari |
|--------|-------------|---------|--------|
| Open DevTools | `F12` or `Ctrl+Shift+I` | `F12` or `Ctrl+Shift+I` | `Cmd+Opt+I` |
| Inspect Element | `Ctrl+Shift+C` | `Ctrl+Shift+C` | `Cmd+Opt+C` |
| Toggle Device Mode | `Ctrl+Shift+M` | `Ctrl+Shift+M` | - |
| Search Styles | `Ctrl+F` in Styles | `Ctrl+F` in Rules | `Cmd+F` in Styles |

### Color Format Conversions

```
Hex:  #FFB400
RGB:  rgb(255, 180, 0)
RGBA: rgba(255, 180, 0, 1)
HSL:  hsl(42, 100%, 50%)
HSLA: hsla(42, 100%, 50%, 1)
```

**Online Converter**: https://convertingcolors.com/

### Accessibility Contrast Checker

**WebAIM**: https://webaim.org/resources/contrastchecker/

Example:
- Foreground: #FFB400
- Background: #FFFFFF
- Ratio: 2.15:1 (Fails WCAG AA for small text - decorative only!)

---

## Additional Resources

- **Chrome DevTools Docs**: https://developer.chrome.com/docs/devtools/
- **Firefox DevTools Docs**: https://firefox-source-docs.mozilla.org/devtools-user/
- **Safari Web Inspector**: https://developer.apple.com/safari/tools/
- **ColorZilla**: https://www.colorzilla.com/
- **Can I Use (CSS Properties)**: https://caniuse.com/

---

## Summary

**Steps to Extract Accent Color** (#FFB400):

1. Open https://www.embarkearthworks.au/ in Chrome
2. Right-click heading underline → Inspect
3. Find `border-bottom-color` or similar in Styles panel
4. Click color swatch
5. Read hex value → #FFB400
6. Verify against style guide

**Total Time**: 2 minutes

**Result**: Confirmed #FFB400 CAT Gold accent color
