# Style Guide Documentation - Quick Start

**Created**: 2025-11-06
**Status**: Complete and ready for implementation

This directory contains comprehensive style guide documentation for the Embark Quoting System, based on the official Embark Earthworks company website.

---

## 📚 Documentation Suite

### 1. **Main Style Guide** (`style-guide.md`)
**Size**: 40KB | **Sections**: 18

The complete visual design specification including:
- ✅ Color palette with #FFB400 CAT Gold accent
- ✅ Logo usage guidelines (3 variants documented)
- ✅ Typography system (font stack, type scale, weights)
- ✅ UI components (buttons, forms, cards, modals, navigation)
- ✅ Layout & spacing (8px grid, responsive gutters)
- ✅ Decorative elements (accent underlines, overlays)
- ✅ Accessibility standards (WCAG AA compliance)
- ✅ Animation guidelines
- ✅ Brand messaging & tone

**Start here** for all design decisions.

---

### 2. **Color Extraction Guide** (`devtools-color-extraction-guide.md`)
**Size**: 16KB | **Use Case**: Verify colors from live website

Step-by-step instructions for extracting exact color values using browser DevTools:
- Chrome/Edge DevTools walkthrough
- Firefox DevTools walkthrough
- Safari Web Inspector walkthrough
- Color picker extensions (ColorZilla, Eye Dropper)
- Verification checklist against style guide
- Troubleshooting common issues

**Use this when**: You need to verify a color from the live website or extract new colors as the site evolves.

---

### 3. **Visual QA Checklist** (`visual-qa-checklist.md`)
**Size**: 19KB | **Use Case**: Pre-deployment verification

Comprehensive checklist with 200+ verification points:
- ✓ Color palette (accent, backgrounds, text, shadows, semantic colors)
- ✓ Logo usage (all variants, sizes, positions)
- ✓ Typography (type scale, weights, line heights)
- ✓ UI components (buttons, forms, cards, modals, navigation)
- ✓ Layout & spacing (grid, spacing scale, responsive gutters)
- ✓ Responsive design (breakpoints, touch targets)
- ✓ Accessibility (keyboard nav, screen readers, contrast)
- ✓ Brand messaging (taglines, CTAs, quote numbers)
- ✓ Icons (required icons, style, sizing)
- ✓ Animations (timing, easing)

**Use this when**:
- Before deploying design changes
- During code review
- QA testing new features
- Onboarding new developers

---

### 4. **Screenshot Reference** (`assets/screenshots/`)
**Status**: Directory structure created, awaiting screenshots

Organized storage for visual references from the live website:

```
screenshots/
├── homepage/          # Hero, services, CTA, footer
├── mobile/            # Mobile views (375px width)
├── colors/            # Close-ups of #FFB400 usage
└── logo/              # Logo placement examples
```

**See**: `assets/screenshots/README.md` for capture guidelines

**Use this when**:
- Resolving design ambiguity
- Verifying spacing/layout details
- Documenting website changes over time

---

## 🎨 Brand Assets

### Logo Files (WebP format)

Located at `frontend/src/assets/images/logo/`:

| File | Dimensions | Usage |
|------|------------|-------|
| `embark-wordmark-black.webp` | ~1200×200px | Desktop header, PDFs, email |
| `embark-icon-light.webp` | 512×512px | Favicon, light backgrounds |
| `embark-icon-dark.webp` | 550×550px | Dark mode, social media |

**Copies also at**: `docs/assets/` (for documentation reference)

### Color Palette Quick Reference

```css
/* Primary */
--accent-primary: #FFB400;         /* CAT Gold - main brand color */
--accent-hover: #E6A200;           /* Darker gold for hover states */
--accent-light: #FFCA4D;           /* Lighter gold for backgrounds */

/* Base */
--primary-background: #FFFFFF;     /* Pure white */
--primary-text: #1A1A1A;           /* Near-black */

/* Semantic */
--success: #10B981;                /* Green */
--warning: #F59E0B;                /* Orange */
--error: #DC2626;                  /* Red */
--info: #3B82F6;                   /* Blue */
```

---

## 🚀 Implementation Roadmap

### Phase 1: Foundation (Week 1)
**Tasks**:
1. Create CSS tokens files (`frontend/src/styles/tokens/`)
   - `colors.css` - All color custom properties
   - `typography.css` - Font stack, type scale, weights
   - `spacing.css` - Spacing scale, grid system
   - `shadows.css` - Shadow variables

2. Set up base styles (`frontend/src/styles/base/`)
   - `reset.css` - CSS reset
   - `global.css` - Global styles
   - `accessibility.css` - Focus states, screen reader utilities

**Deliverable**: Design system tokens available for use

---

### Phase 2: Components (Week 2-3)
**Tasks**:
1. Build base components following style guide:
   - Button (primary, secondary, sizes)
   - Form inputs (text, select, checkbox, radio)
   - Card
   - Modal/Dialog
   - Navigation header

2. Create Storybook/component library for documentation

**Deliverable**: Reusable component library

---

### Phase 3: Logo Integration (Week 3)
**Tasks**:
1. Implement responsive logo display
   - Desktop: Show wordmark
   - Mobile: Show icon only

2. Generate favicon suite from `embark-icon-light.webp`
   - 16×16, 32×32, 64×64, 128×128, 256×256, 512×512

3. Add to HTML `<head>` and PWA manifest

**Deliverable**: Logo and favicon fully integrated

---

### Phase 4: Visual QA (Week 4)
**Tasks**:
1. Capture reference screenshots from live website
2. Run visual QA checklist against quoting system
3. Fix any discrepancies
4. Document any intentional deviations

**Deliverable**: Visual parity with brand confirmed

---

## 📋 How to Use These Docs

### For Designers
1. **Reference**: `style-guide.md` → Complete design specifications
2. **Verify**: Use `devtools-color-extraction-guide.md` to extract colors from live site
3. **Document**: Add screenshots to `assets/screenshots/` as reference

### For Developers
1. **Implement**: Follow `style-guide.md` → UI Components section
2. **Tokens**: Extract CSS custom properties from style guide
3. **QA**: Use `visual-qa-checklist.md` before submitting PRs

### For QA Testers
1. **Test**: Run through `visual-qa-checklist.md` systematically
2. **Compare**: Reference `assets/screenshots/` for visual accuracy
3. **Report**: Create GitHub issues for failures with checklist item numbers

### For Project Managers
1. **Status**: Check implementation roadmap (above)
2. **Quality**: Review QA checklist completion percentage
3. **Timeline**: Track progress through phases

---

## 🔗 Related Documentation

### Project Documentation
- `CLAUDE.md` - Navigation guide (sources of truth)
- `CONTRIBUTING.md` - Workflow for agents
- `README.md` - Project overview
- `specs/BLUEPRINT.yaml` - Complete implementation plan

### Design-Specific
- `financial-model.md` - Profit-First pricing methodology
- `devops-setup.md` - Infrastructure and deployment

---

## ✅ Verification Checklist

Before starting implementation, confirm:

- [ ] All style guide sections reviewed
- [ ] #FFB400 accent color confirmed from website
- [ ] Logo files accessible at `frontend/src/assets/images/logo/`
- [ ] DevTools color extraction guide tested
- [ ] Visual QA checklist understood
- [ ] Screenshot directory structure created
- [ ] Implementation roadmap reviewed with team

---

## 📞 Support

### Questions About Brand
- **Source**: https://www.embarkearthworks.au/
- **Contact**: Embark Earthworks via website contact form
- **Logo Requests**: Ask for SVG versions (better than WebP for scalability)

### Questions About Style Guide
- **Primary Reference**: `docs/style-guide.md`
- **Color Verification**: `docs/devtools-color-extraction-guide.md`
- **Quality Assurance**: `docs/visual-qa-checklist.md`

---

## 📊 Documentation Statistics

| Document | Size | Lines | Sections | Status |
|----------|------|-------|----------|--------|
| style-guide.md | 40KB | 1,650+ | 18 | ✅ Complete |
| devtools-color-extraction-guide.md | 16KB | 650+ | 11 | ✅ Complete |
| visual-qa-checklist.md | 19KB | 750+ | 11 | ✅ Complete |
| screenshots/README.md | 2KB | 100+ | 7 | ✅ Complete |
| STYLE-GUIDE-README.md | 4KB | 200+ | 10 | ✅ Complete |

**Total Documentation**: ~81KB, 3,350+ lines

---

## 🎯 Key Takeaways

1. **#FFB400 is the brand**: CAT Gold creates instant industry recognition
2. **Three logo variants**: Wordmark (desktop), icon-light (favicon), icon-dark (dark mode)
3. **Mobile-first**: 44px minimum touch targets, responsive logo switching
4. **WCAG AA**: Accessibility is non-negotiable
5. **Offline-first**: Design must work without internet (per BLUEPRINT.yaml)

---

## 🔄 Maintenance

### Update Schedule
- **Quarterly**: Review live website for changes
- **Before Major Release**: Run full visual QA checklist
- **On Website Change**: Update screenshots and verify colors
- **Continuous**: Document any deviations from style guide

### Version Control
- Style guide uses semantic versioning (currently v1.2)
- Update version history table when making changes
- Document reasons for changes in version notes

---

## 🚦 Current Status

**Style Guide**: v1.2 (2025-11-06)
**Assets**: 3 logo variants copied to project
**Supporting Docs**: All complete
**Screenshots**: Directory created, awaiting capture
**Implementation**: Ready to begin

**Next Action**: Start Phase 1 (Foundation) - Create CSS tokens

---

**Last Updated**: 2025-11-06
**Maintained By**: Embark Quoting System Team
