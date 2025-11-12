# Visual QA Checklist - Embark Quoting System

**Purpose**: Systematic verification that the quoting system's visual design matches the Embark Earthworks brand style guide.

**Reference Documents**:
- `docs/style-guide.md` - Complete design specifications
- `docs/devtools-color-extraction-guide.md` - Color extraction instructions
- Source: https://www.embarkearthworks.au/

**When to Use**:
- Before deploying design changes
- After implementing new components
- During design review sessions
- When onboarding new developers

---

## How to Use This Checklist

1. **Open Both Systems Side-by-Side**:
   - Left: Embark Earthworks website (https://www.embarkearthworks.au/)
   - Right: Embark Quoting System (local development or staging)

2. **Work Through Each Section**:
   - Check each item visually
   - Mark with ✓ (pass), ✗ (fail), or ~ (partial)
   - Add notes for any issues

3. **Document Issues**:
   - Screenshot discrepancies
   - Note exact element and location
   - Reference style guide section

4. **Track Resolution**:
   - Create GitHub issues for failures
   - Link to this checklist
   - Verify fixes before closing

---

## QA Checklist

### 1. Color Palette

#### Accent Color (#FFB400 - CAT Gold)

| Element | Location | Expected | Status | Notes |
|---------|----------|----------|--------|-------|
| Heading underlines | All pages with section headings | #FFB400 | ☐ |  |
| Primary button background | Quote form, CTAs | #FFB400 | ☐ |  |
| Button hover state | Primary buttons :hover | #E6A200 (darker) | ☐ |  |
| Link hover color | Navigation, text links | #FFB400 | ☐ |  |
| Active/selected state | Tabs, navigation items | #FFB400 | ☐ |  |
| Focus outlines | Keyboard navigation | #FFB400 (2px solid) | ☐ |  |
| Icon accents | Status icons, decorative | #FFB400 | ☐ |  |
| Loading spinner | Loading states | #FFB400 | ☐ |  |

**Verification Method**: Use DevTools color picker on each element (see `docs/devtools-color-extraction-guide.md`)

#### Background & Text Colors

| Element | Location | Expected | Status | Notes |
|---------|----------|----------|--------|-------|
| Page background | All pages | #FFFFFF (pure white) | ☐ |  |
| Card background | Quote cards, modals | #FFFFFF | ☐ |  |
| Body text | Paragraphs, labels | #1A1A1A (near-black) | ☐ |  |
| Heading text | H1, H2, H3 | #1A1A1A | ☐ |  |
| Secondary text | Captions, metadata | #1A1A1A @ 70% opacity | ☐ |  |
| Placeholder text | Form inputs | rgba(26,26,26,0.4) | ☐ |  |
| Disabled text | Disabled buttons/inputs | rgba(26,26,26,0.3) | ☐ |  |

#### Shadow & Border Colors

| Element | Location | Expected | Status | Notes |
|---------|----------|----------|--------|-------|
| Card shadows | Quote cards, modals | 0 2px 8px rgba(26,26,26,0.2) | ☐ |  |
| Button shadows (hover) | Primary buttons | 0 4px 12px rgba(26,26,26,0.2) | ☐ |  |
| Input borders | Text inputs (default) | 2px solid rgba(26,26,26,0.1) | ☐ |  |
| Input borders (focus) | Text inputs :focus | 2px solid #FFB400 | ☐ |  |
| Divider lines | Section separators | 1px solid rgba(26,26,26,0.1) | ☐ |  |

#### Semantic Colors

| Element | Location | Expected | Status | Notes |
|---------|----------|----------|--------|-------|
| Success messages | Quote saved, form submitted | #10B981 (green) | ☐ |  |
| Warning alerts | Pending actions, cautions | #F59E0B (orange) | ☐ |  |
| Error messages | Validation errors | #DC2626 (red) | ☐ |  |
| Info messages | Help text, tips | #3B82F6 (blue) | ☐ |  |
| Success button | Confirm actions | #10B981 background | ☐ |  |
| Danger button | Delete actions | #DC2626 background | ☐ |  |

---

### 2. Logo Usage

#### Logo Variants

| Context | Expected Logo | Size | Position | Status | Notes |
|---------|---------------|------|----------|--------|-------|
| App header (desktop) | Wordmark (black) | 180px width | Left-aligned | ☐ |  |
| App header (mobile) | Icon mark (light) | 40×40px | Left-aligned | ☐ |  |
| Login screen | Wordmark (black) | 240px width | Center, above form | ☐ |  |
| PDF quote header | Wordmark (black) | 150px width | Top-left corner | ☐ |  |
| Favicon (browser tab) | Icon mark (light) | 32×32px | Browser tab | ☐ |  |
| Loading screen | Icon mark (light) | 64×64px | Center, pulsing | ☐ |  |

**Files to Check**:
- `frontend/src/assets/images/logo/embark-wordmark-black.webp`
- `frontend/src/assets/images/logo/embark-icon-light.webp`
- `frontend/src/assets/images/logo/embark-icon-dark.webp`

#### Logo Specifications

| Requirement | Expected | Status | Notes |
|-------------|----------|--------|-------|
| Clear space maintained | 20px minimum on all sides | ☐ |  |
| No distortion | Original aspect ratio preserved | ☐ |  |
| No effects | No shadows, glows, or filters | ☐ |  |
| Contrast | Readable on all backgrounds | ☐ |  |
| Resolution | Crisp on retina displays | ☐ |  |
| Alt text present | Descriptive alt text for screen readers | ☐ |  |

---

### 3. Typography

#### Font Stack

| Element | Expected Font Family | Status | Notes |
|---------|---------------------|--------|-------|
| All text | -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif | ☐ |  |

**Verification**: Check computed font-family in DevTools

#### Type Scale

| Element | Size | Weight | Line Height | Status | Notes |
|---------|------|--------|-------------|--------|-------|
| Page title (H1) | 48px (3rem) | 700 (bold) | 1.2 | ☐ |  |
| Section heading (H2) | 32px (2rem) | 700 | 1.2 | ☐ |  |
| Subsection (H3) | 24px (1.5rem) | 700 | 1.2 | ☐ |  |
| Card title (H4) | 20px (1.25rem) | 600 (semibold) | 1.2 | ☐ |  |
| Body text | 16px (1rem) | 400 (regular) | 1.5 | ☐ |  |
| Small text | 14px (0.875rem) | 400 | 1.5 | ☐ |  |
| Form label | 14px | 500 (medium) | 1.5 | ☐ |  |
| Button text | 16px | 600 | 1.5 | ☐ |  |

#### Typography Details

| Requirement | Expected | Status | Notes |
|-------------|----------|--------|-------|
| Heading hierarchy | Logical H1→H2→H3→H4 progression | ☐ |  |
| Text contrast | WCAG AA: 4.5:1 for body text | ☐ |  |
| Line length | Max 65-75 characters per line | ☐ |  |
| Paragraph spacing | 16px (1rem) between paragraphs | ☐ |  |
| Letter spacing | Default (no custom tracking) | ☐ |  |

---

### 4. UI Components

#### Buttons

**Primary Button**

| Property | Expected | Status | Notes |
|----------|----------|--------|-------|
| Background | #FFB400 | ☐ |  |
| Text color | #FFFFFF (white) | ☐ |  |
| Font weight | 600 (semibold) | ☐ |  |
| Padding | 12px 24px | ☐ |  |
| Border radius | 4px | ☐ |  |
| Hover background | #E6A200 | ☐ |  |
| Hover transform | translateY(-1px) | ☐ |  |
| Hover shadow | 0 4px 12px rgba(26,26,26,0.2) | ☐ |  |
| Active transform | translateY(0) | ☐ |  |
| Disabled opacity | 0.6 | ☐ |  |
| Disabled cursor | not-allowed | ☐ |  |
| Focus outline | 2px solid #FFB400, offset 2px | ☐ |  |

**Secondary Button**

| Property | Expected | Status | Notes |
|----------|----------|--------|-------|
| Background | transparent | ☐ |  |
| Text color | #1A1A1A | ☐ |  |
| Border | 2px solid rgba(26,26,26,0.1) | ☐ |  |
| Padding | 10px 22px (adjusted for border) | ☐ |  |
| Hover border | 2px solid #FFB400 | ☐ |  |
| Hover text | #FFB400 | ☐ |  |

**Button Sizes**

| Size | Padding | Font Size | Status | Notes |
|------|---------|-----------|--------|-------|
| Large | 16px 32px | 18px | ☐ |  |
| Regular | 12px 24px | 16px | ☐ |  |
| Small | 8px 16px | 14px | ☐ |  |

**Mobile Contact Button** (if implemented)

| Property | Expected | Status | Notes |
|----------|----------|--------|-------|
| Position | Fixed, bottom-right | ☐ |  |
| Offset | 20px from bottom, 20px from right | ☐ |  |
| Size | 56×56px | ☐ |  |
| Background | #FFB400 | ☐ |  |
| Shape | border-radius: 50% (circle) | ☐ |  |
| Shadow | 0 4px 16px rgba(26,26,26,0.2) | ☐ |  |
| Icon color | #FFFFFF | ☐ |  |
| Hover scale | transform: scale(1.1) | ☐ |  |
| Hidden on desktop | display: none @ ≥768px | ☐ |  |

#### Form Elements

**Text Input**

| Property | Expected | Status | Notes |
|----------|----------|--------|-------|
| Background | #FFFFFF | ☐ |  |
| Border (default) | 2px solid rgba(26,26,26,0.1) | ☐ |  |
| Border (focus) | 2px solid #FFB400 | ☐ |  |
| Border radius | 4px | ☐ |  |
| Padding | 12px 16px | ☐ |  |
| Font size | 16px | ☐ |  |
| Focus shadow | 0 0 0 3px rgba(255,180,0,0.52) | ☐ |  |
| Placeholder color | rgba(26,26,26,0.4) | ☐ |  |
| Disabled background | rgba(26,26,26,0.05) | ☐ |  |

**Label**

| Property | Expected | Status | Notes |
|----------|----------|--------|-------|
| Font size | 14px | ☐ |  |
| Font weight | 500 (medium) | ☐ |  |
| Margin bottom | 8px | ☐ |  |
| Required indicator | Red asterisk (*) after label | ☐ |  |

**Select Dropdown**

| Property | Expected | Status | Notes |
|----------|----------|--------|-------|
| Appearance | Custom chevron icon | ☐ |  |
| Padding right | 40px (space for chevron) | ☐ |  |
| All other styles | Same as text input | ☐ |  |

**Checkbox/Radio**

| Property | Expected | Status | Notes |
|----------|----------|--------|-------|
| Size | 20×20px | ☐ |  |
| Border (default) | 2px solid rgba(26,26,26,0.1) | ☐ |  |
| Checked background | #FFB400 | ☐ |  |
| Checked border | #FFB400 | ☐ |  |
| Checkbox radius | 4px | ☐ |  |
| Radio radius | 50% (circle) | ☐ |  |

**Error State**

| Property | Expected | Status | Notes |
|----------|----------|--------|-------|
| Border color | #DC2626 (red) | ☐ |  |
| Error message color | #DC2626 | ☐ |  |
| Error message size | 14px | ☐ |  |
| Error icon | Present, 14px | ☐ |  |

#### Cards

| Property | Expected | Status | Notes |
|----------|----------|--------|-------|
| Background | #FFFFFF | ☐ |  |
| Border radius | 8px | ☐ |  |
| Shadow (default) | 0 2px 8px rgba(26,26,26,0.2) | ☐ |  |
| Shadow (hover) | 0 4px 16px rgba(26,26,26,0.2) | ☐ |  |
| Padding | 16px | ☐ |  |
| Gap between elements | 8px | ☐ |  |

#### Modal/Dialog

| Property | Expected | Status | Notes |
|----------|----------|--------|-------|
| Overlay background | rgba(0,0,0,0.5) | ☐ |  |
| Overlay backdrop-filter | blur(4px) | ☐ |  |
| Modal background | #FFFFFF | ☐ |  |
| Modal radius | 8px | ☐ |  |
| Modal shadow | 0 20px 60px rgba(0,0,0,0.3) | ☐ |  |
| Modal max-width | 600px | ☐ |  |
| Modal padding | 24px | ☐ |  |

#### Navigation

| Property | Expected | Status | Notes |
|----------|----------|--------|-------|
| Header height | 64px | ☐ |  |
| Header background | rgba(255,255,255,0.95) | ☐ |  |
| Header backdrop-filter | blur(10px) | ☐ |  |
| Header border-bottom | 1px solid rgba(26,26,26,0.1) | ☐ |  |
| Nav link font-size | 16px | ☐ |  |
| Nav link font-weight | 500 (medium) | ☐ |  |
| Nav link padding | 8px 16px | ☐ |  |
| Active link indicator | 2px #FFB400 underline | ☐ |  |

---

### 5. Decorative Elements

#### Accent Underlines

| Property | Expected | Status | Notes |
|----------|----------|--------|-------|
| Color | #FFB400 | ☐ |  |
| Height | 3px | ☐ |  |
| Position | 8px below text | ☐ |  |
| Border radius | 2px | ☐ |  |
| Animation | Slide in from left (0.3s) | ☐ |  |

#### Image Overlays

| Property | Expected | Status | Notes |
|----------|----------|--------|-------|
| Overlay color | rgba(255,180,0,0.52) | ☐ |  |
| Position | Cover entire image | ☐ |  |

---

### 6. Layout & Spacing

#### Grid System

| Breakpoint | Columns | Gap | Status | Notes |
|------------|---------|-----|--------|-------|
| Mobile (<640px) | 8 | 11px | ☐ |  |
| Tablet (640-1024px) | 16 | 11px | ☐ |  |
| Desktop (>1024px) | 24 | 11px | ☐ |  |

#### Spacing Scale

| Token | Value | Common Usage | Status | Notes |
|-------|-------|--------------|--------|-------|
| xs | 4px | Icon spacing | ☐ |  |
| sm | 8px | Form field padding | ☐ |  |
| md | 16px | Card padding | ☐ |  |
| lg | 24px | Section margins | ☐ |  |
| xl | 32px | Page margins | ☐ |  |
| 2xl | 48px | Hero sections | ☐ |  |

#### Responsive Gutters

| Viewport | Gutter | Status | Notes |
|----------|--------|--------|-------|
| Mobile | 6vw (~24px @ 400px) | ☐ |  |
| Tablet | 5vw | ☐ |  |
| Desktop | 4vw | ☐ |  |

---

### 7. Responsive Design

#### Breakpoints

Test at these viewport widths:

| Device | Width | Expected Behavior | Status | Notes |
|--------|-------|-------------------|--------|-------|
| Mobile S | 375px | Single column, mobile logo | ☐ |  |
| Mobile L | 425px | Single column | ☐ |  |
| Tablet | 768px | 2 columns, show wordmark | ☐ |  |
| Laptop | 1024px | Multi-column layout | ☐ |  |
| Desktop | 1920px | Full layout | ☐ |  |

#### Touch Targets (Mobile)

| Element | Expected Size | Status | Notes |
|---------|---------------|--------|-------|
| Buttons | Min 44×44px | ☐ |  |
| Links | Min 44×44px | ☐ |  |
| Form inputs | Min 44px height | ☐ |  |
| Icons | Min 24px (with padding to 44px) | ☐ |  |

---

### 8. Accessibility

#### Keyboard Navigation

| Requirement | Expected | Status | Notes |
|-------------|----------|--------|-------|
| All interactive elements focusable | Tab order logical | ☐ |  |
| Focus visible | 2px #FFB400 outline, 2px offset | ☐ |  |
| Skip link present | "Skip to main content" at top | ☐ |  |
| No keyboard traps | Can escape all components | ☐ |  |

#### Screen Reader Support

| Requirement | Expected | Status | Notes |
|-------------|----------|--------|-------|
| Alt text on images | Descriptive alt attributes | ☐ |  |
| Form labels | All inputs have associated labels | ☐ |  |
| ARIA labels | Buttons without text have aria-label | ☐ |  |
| Heading structure | Logical H1→H2→H3 hierarchy | ☐ |  |
| Live regions | Notifications use aria-live | ☐ |  |

#### Color Contrast (WCAG AA)

| Element | Contrast Ratio | Required | Status | Notes |
|---------|----------------|----------|--------|-------|
| Body text (#1A1A1A on #FFFFFF) | ~14:1 | 4.5:1 | ☐ |  |
| Button text (#FFFFFF on #FFB400) | ~2.15:1 | 3:1 (large) | ☐ | Decorative only |
| Error text (#DC2626 on #FFFFFF) | ~5.6:1 | 4.5:1 | ☐ |  |

**Tool**: https://webaim.org/resources/contrastchecker/

#### Motion Preferences

| Requirement | Expected | Status | Notes |
|-------------|----------|--------|-------|
| Respects prefers-reduced-motion | Animations disabled or minimal | ☐ |  |

---

### 9. Brand Messaging

#### Tagline & CTAs

| Element | Location | Expected Text | Status | Notes |
|---------|----------|---------------|--------|-------|
| Login screen tagline | Above login form | "Embark on Your Land Journey." | ☐ |  |
| About section | Footer or about page | "No hidden fees, no surprises—just quality work you can count on." | ☐ |  |
| Primary CTA | Buttons, links | "Get Free Quote" | ☐ |  |
| Contact CTA | Phone button | "0401 089 545" (formatted) | ☐ |  |

#### Quote Number Format

| Element | Expected Format | Example | Status | Notes |
|---------|----------------|---------|--------|-------|
| Quote display | EE-YYYY-NNNN | EE-2025-0001 | ☐ |  |
| PDF export | EE-YYYY-NNNN | EE-2025-0042 | ☐ |  |

---

### 10. Icons

#### Icon System

| Requirement | Expected | Status | Notes |
|-------------|----------|--------|-------|
| Icon library | Lucide or Heroicons | ☐ |  |
| Icon style | Outline/line-drawn | ☐ |  |
| Stroke width | 2px | ☐ |  |
| Color | Inherits from parent | ☐ |  |
| Default size | 24×24px | ☐ |  |

#### Required Icons

| Icon | Usage | Present | Status | Notes |
|------|-------|---------|--------|-------|
| Excavator | Earthmoving services | ☐ | ☐ |  |
| Wall/Blocks | Retaining wall | ☐ | ☐ |  |
| Water droplet | Stormwater/drainage | ☐ | ☐ |  |
| Truck | Material delivery | ☐ | ☐ |  |
| Ruler | Measurements/site prep | ☐ | ☐ |  |
| Document | Quotes | ☐ | ☐ |  |
| Calendar | Scheduling | ☐ | ☐ |  |
| Phone | Contact | ☐ | ☐ |  |
| Email | Contact | ☐ | ☐ |  |
| Check | Success/completion | ☐ | ☐ |  |
| Alert Triangle | Warnings | ☐ | ☐ |  |
| Info | Help/information | ☐ | ☐ |  |

---

### 11. Animation & Transitions

#### Animation Timing

| Property | Expected | Status | Notes |
|----------|----------|--------|-------|
| Button hover | 200ms (fast) | ☐ |  |
| Modal open | 300ms (base) | ☐ |  |
| Page transition | 500ms (slow) | ☐ |  |

#### Easing Functions

| Animation | Easing | Status | Notes |
|-----------|--------|--------|-------|
| Standard transitions | cubic-bezier(0.4,0,0.2,1) | ☐ |  |
| Decelerate (entrances) | cubic-bezier(0,0,0.2,1) | ☐ |  |
| Accelerate (exits) | cubic-bezier(0.4,0,1,1) | ☐ |  |

---

## Testing Checklist Completion

### Summary

**Total Items**: [Count when complete]
**Passed**: ___
**Failed**: ___
**Partial**: ___

**Overall Status**: ☐ Pass / ☐ Fail / ☐ Needs Work

### Critical Failures (Blockers)

1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

### Non-Critical Issues

1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

### Recommendations

1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

---

## Sign-Off

**QA Tester**: _______________________
**Date**: _______________________
**Environment**: ☐ Local ☐ Staging ☐ Production
**Browser**: _______________________
**Version**: _______________________

**Approved for**: ☐ Development ☐ Staging ☐ Production

---

## Appendix: Testing Tools

### Browser DevTools
- **Chrome**: F12 → Elements → Styles
- **Firefox**: F12 → Inspector → Rules
- **Safari**: Cmd+Opt+I → Elements

### Color Verification
- Browser DevTools color picker
- ColorZilla extension: https://www.colorzilla.com/
- WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/

### Responsive Testing
- Browser DevTools device mode (Ctrl+Shift+M)
- Responsive Design Checker: https://responsivedesignchecker.com/
- BrowserStack: https://www.browserstack.com/ (paid)

### Accessibility Testing
- axe DevTools: https://www.deque.com/axe/devtools/
- WAVE: https://wave.webaim.org/
- Lighthouse (Chrome DevTools)

### Screenshot Tools
- Browser built-in (full-page screenshot)
- Awesome Screenshot extension
- Flameshot (Linux): https://flameshot.org/

---

## Quick Reference: Style Guide Sections

- **Colors**: docs/style-guide.md → "Color Palette"
- **Logo**: docs/style-guide.md → "Logo Usage"
- **Typography**: docs/style-guide.md → "Typography"
- **Components**: docs/style-guide.md → "UI Components"
- **Layout**: docs/style-guide.md → "Layout & Spacing"
- **Responsive**: docs/style-guide.md → "Responsive Design"
- **Accessibility**: docs/style-guide.md → "Accessibility"

---

**Last Updated**: 2025-11-06
**Version**: 1.0
