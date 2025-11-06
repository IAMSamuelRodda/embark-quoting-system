# Screenshot Directory

**Purpose**: Store visual reference screenshots from the Embark Earthworks website for design verification.

**Source**: https://www.embarkearthworks.au/

---

## Directory Structure

```
screenshots/
├── homepage/          # Homepage sections
├── mobile/            # Mobile viewport screenshots
├── colors/            # Close-ups of color usage
└── logo/              # Logo placement examples
```

---

## What to Capture

### Homepage Directory
- `hero-section.png` - Full hero with tagline, logo, main imagery
- `services-cards.png` - "Our Three Core Service" section showing card layout
- `contact-cta.png` - "Let Us Work Together" call-to-action area
- `footer.png` - Full footer with contact info and branding

### Mobile Directory
- `homepage-mobile.png` - Full mobile homepage (375px width)
- `navigation-mobile.png` - Mobile menu expanded/collapsed
- `contact-button-mobile.png` - Floating phone button (if visible)

### Colors Directory
- `accent-underlines.png` - Close-up of #FFB400 underline beneath heading
- `button-states.png` - "Get Free Quote" button (normal, hover if possible)
- `text-hierarchy.png` - Example showing heading, subheading, body text colors

### Logo Directory
- `header-logo.png` - Logo as it appears in site header
- `logo-spacing.png` - Logo with visible clear space around it
- `logo-on-backgrounds.png` - Logo on different background colors/images

---

## Capture Settings

```
Desktop Resolution: 1920×1080 (or 1280×720)
Mobile Resolution: 375×667 (iPhone SE) or 390×844 (iPhone 12/13)
File Format: PNG (lossless for UI)
Color Profile: sRGB
Browser: Chrome or Firefox (latest stable)
Zoom Level: 100% (no browser zoom)
```

---

## Naming Convention

```
[section]-[element]-[viewport].png

Examples:
homepage-hero-desktop.png
homepage-services-cards-desktop.png
mobile-navigation-menu-mobile.png
colors-accent-underline-closeup.png
logo-header-usage-desktop.png
```

---

## How to Capture

### Browser Built-in (Chrome/Edge)

1. Open https://www.embarkearthworks.au/
2. Press `F12` to open DevTools
3. Press `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (macOS)
4. Type "screenshot"
5. Select:
   - "Capture full size screenshot" (entire page)
   - "Capture screenshot" (visible viewport)
   - "Capture node screenshot" (specific element - select in Elements panel first)

### Browser Extension

**Awesome Screenshot** (Recommended):
- Install from Chrome Web Store or Firefox Add-ons
- Click extension icon
- Select capture type (full page, visible area, selected area)
- Annotate if needed
- Save as PNG

### Mobile Screenshots

**Using DevTools Device Mode**:
1. Press `Ctrl+Shift+M` (Windows/Linux) or `Cmd+Shift+M` (macOS)
2. Select device preset (iPhone SE, iPhone 12/13, etc.) or enter custom dimensions
3. Capture screenshot using method above

---

## Screenshot Metadata

Create a `screenshots-index.md` file in this directory to document each screenshot:

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

## Using Screenshots

**For Color Verification**:
1. Open screenshot in image editor
2. Use eyedropper/color picker tool
3. Sample color from element
4. Compare hex value to style guide

**For Layout Reference**:
1. Open screenshot side-by-side with quoting system
2. Compare spacing, sizing, positioning
3. Measure elements if needed using design tools

**For Design Decisions**:
- Reference when implementing new features
- Resolve ambiguity in style guide
- Document changes to website over time

---

## Update Schedule

- **Quarterly**: Review and update all screenshots
- **On Change**: When website design changes
- **Before Major Releases**: Verify current reference is accurate

---

## Related Documentation

- **Style Guide**: `docs/style-guide.md`
- **Color Extraction Guide**: `docs/devtools-color-extraction-guide.md`
- **Visual QA Checklist**: `docs/visual-qa-checklist.md`

---

**Last Updated**: 2025-11-06
