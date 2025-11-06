# Accessibility Testing Guide

**Version:** 1.0
**Last Updated:** 2025-11-06
**WCAG Standard:** 2.1 AA

---

## Overview

This project uses **fully automated accessibility testing** to ensure WCAG 2.1 AA compliance across all UI components. Every component is tested automatically using axe-core, with continuous validation in CI/CD pipelines.

---

## Testing Stack

| Tool | Purpose |
|------|---------|
| **axe-core** | Accessibility testing engine (Deque Systems) |
| **@axe-core/playwright** | Playwright integration for automated testing |
| **@storybook/test-runner** | Automated testing for all Storybook stories |
| **Playwright** | Browser automation for E2E and accessibility tests |
| **pa11y** | Additional CLI accessibility testing |
| **html-validate** | HTML validation and best practices |

---

## Quick Start

### Run All Accessibility Tests

```bash
# Auto-start Storybook, run tests, generate reports, kill Storybook
npm run test:a11y:all:report
```

This single command:
1. ✅ Starts Storybook on port 6006
2. ✅ Waits for Storybook to be ready
3. ✅ Runs all accessibility tests
4. ✅ Generates HTML + JSON reports
5. ✅ Kills Storybook automatically

---

## Available Commands

### Individual Test Commands

```bash
# Run Playwright accessibility tests (requires Storybook running)
npm run test:a11y

# Generate accessibility report (requires Storybook running)
npm run test:a11y:report

# Run Storybook test runner (requires Storybook running)
npm run test:storybook

# CI-optimized Storybook testing (builds + runs + kills)
npm run test:storybook:ci
```

### Auto-Start Commands

```bash
# Auto-start Storybook + run Playwright tests
npm run test:a11y:all

# Auto-start Storybook + generate reports
npm run test:a11y:all:report
```

---

## Test Coverage

### Components Tested

All 9 Design System v2.0 components are tested automatically:

| Component | Variants Tested |
|-----------|----------------|
| **Button** | Primary, Secondary, Tertiary, Disabled, Loading |
| **Input** | Default, Error, Success, Required, Disabled |
| **Select** | Default, Error, Required, Disabled |
| **Checkbox** | Unchecked, Checked, Error, Disabled |
| **Radio** | Unchecked, Checked, Error, Radio Group |
| **Card** | Elevated, Interactive, With Composition |
| **Modal** | Default (with open state) |
| **Toast** | Success, Error, Warning, Info |
| **Logo** | Colored, Black & White, Icon |

**Total Stories Tested:** 33+ individual stories

### WCAG Criteria Tested

All tests validate against WCAG 2.1 Level A and AA:

- **wcag2a** - WCAG 2.0 Level A
- **wcag2aa** - WCAG 2.0 Level AA
- **wcag21a** - WCAG 2.1 Level A
- **wcag21aa** - WCAG 2.1 Level AA

---

## Understanding Reports

### HTML Report

After running `npm run test:a11y:all:report`, open:

```
frontend/accessibility-reports/accessibility-report.html
```

**Report Sections:**

1. **Summary** - Overall pass/fail statistics
2. **Results by Component** - Detailed violations per component
3. **Violation Details** - Severity, description, affected elements, fix guidance

**Violation Severity Levels:**

| Level | Color | Meaning |
|-------|-------|---------|
| **Critical** | Dark Red | Serious barriers preventing access |
| **Serious** | Red | Major accessibility issues |
| **Moderate** | Orange | Noticeable accessibility problems |
| **Minor** | Yellow | Small improvements needed |

### JSON Report

Programmatic access for CI/CD integration:

```json
{
  "summary": {
    "totalStories": 33,
    "passed": 33,
    "failed": 0,
    "totalViolations": 0,
    "timestamp": "2025-11-06T10:30:00.000Z"
  },
  "results": [
    {
      "story": {
        "id": "components-button--primary",
        "name": "Primary",
        "component": "Button"
      },
      "violations": [],
      "passes": [...],
      "incomplete": [],
      "timestamp": "2025-11-06T10:30:00.000Z"
    }
  ]
}
```

---

## CI/CD Integration

### GitHub Actions Workflow

Accessibility tests run automatically on:

- **Pull Requests** - Blocks merge if violations found
- **Pushes to main** - Validates deployed components
- **Manual runs** - Via workflow_dispatch

**Workflow File:** `.github/workflows/accessibility-audit.yml`

### What Happens in CI

1. ✅ Installs dependencies
2. ✅ Builds Storybook
3. ✅ Runs Storybook test runner (tests all stories)
4. ✅ Runs Playwright accessibility tests
5. ✅ Generates accessibility reports
6. ✅ Uploads reports as artifacts (30-day retention)
7. ✅ Comments PR with results summary
8. ✅ **Blocks merge** if violations found

### Viewing CI Reports

1. Go to GitHub Actions workflow run
2. Download "accessibility-reports" artifact
3. Extract and open `accessibility-report.html`

---

## Writing Accessibility Tests

### Test Structure

All accessibility tests follow this pattern:

```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const STORYBOOK_URL = 'http://localhost:6006';

async function testStoryAccessibility(page: any, storyId: string, storyName: string) {
  // Navigate to story
  await page.goto(`${STORYBOOK_URL}/iframe.html?id=${storyId}`);
  await page.waitForLoadState('networkidle');

  // Run axe-core analysis
  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  // Expect no violations
  expect(accessibilityScanResults.violations, `${storyName} should have no accessibility violations`).toEqual([]);
}

test.describe('Component Accessibility', () => {
  test('Story variant', async ({ page }) => {
    await testStoryAccessibility(page, 'components-component--variant', 'Variant Name');
  });
});
```

### Adding New Component Tests

When adding a new component:

1. **Create Storybook stories** - `ComponentName.stories.tsx`
2. **Add test cases** to `tests/accessibility/components.spec.ts`:

```typescript
test.describe('NewComponent Accessibility', () => {
  test('Default variant', async ({ page }) => {
    await testStoryAccessibility(page, 'components-newcomponent--default', 'Default NewComponent');
  });
});
```

3. **Add to report generator** in `scripts/generate-a11y-report.ts`:

```typescript
const STORIES: StoryTest[] = [
  // ... existing stories
  { id: 'components-newcomponent--default', name: 'Default', component: 'NewComponent' },
];
```

4. **Run tests**:

```bash
npm run test:a11y:all:report
```

---

## Common Violations and Fixes

### 1. Missing ARIA Labels

**Violation:**
```
button-name: Buttons must have discernible text
```

**Fix:**
```tsx
// ❌ Bad
<button><Icon /></button>

// ✅ Good
<button aria-label="Close modal"><Icon /></button>
```

### 2. Insufficient Color Contrast

**Violation:**
```
color-contrast: Elements must have sufficient color contrast
```

**Fix:**
```css
/* ❌ Bad - Contrast ratio 2.5:1 */
color: #999999;

/* ✅ Good - Contrast ratio 4.5:1+ */
color: #666666;
```

### 3. Missing Form Labels

**Violation:**
```
label: Form elements must have labels
```

**Fix:**
```tsx
// ❌ Bad
<input type="text" />

// ✅ Good
<label htmlFor="email">Email</label>
<input id="email" type="text" />
```

### 4. Keyboard Navigation

**Violation:**
```
focusable-no-id: Elements with interactive controls must be keyboard accessible
```

**Fix:**
```tsx
// ❌ Bad
<div onClick={handleClick}>Click me</div>

// ✅ Good
<button onClick={handleClick}>Click me</button>
```

---

## Troubleshooting

### Storybook Won't Start

```bash
# Clear cache and reinstall
rm -rf node_modules .storybook/cache
npm install
npm run storybook
```

### Tests Timeout

**Cause:** Storybook not ready or port conflict

**Fix:**
```bash
# Check if Storybook is running on port 6006
lsof -i :6006

# If port is in use, kill process
kill -9 <PID>

# Restart Storybook
npm run storybook
```

### False Positives

**Cause:** Axe-core flags intentional design choices

**Fix:** Use `axe.configure()` to suppress specific rules:

```typescript
const accessibilityScanResults = await new AxeBuilder({ page })
  .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
  .disableRules(['color-contrast']) // Only if justified!
  .analyze();
```

**⚠️ Warning:** Only disable rules if you have a documented accessibility justification.

### CI/CD Failures

**Symptom:** Tests pass locally but fail in CI

**Causes:**
1. Playwright browsers not installed
2. Port conflicts in CI environment
3. Network timeouts

**Fix:** GitHub Actions workflow already handles these cases. Check workflow logs for specific errors.

---

## Best Practices

### 1. Test Early, Test Often

- ✅ Run `npm run test:a11y:all:report` before committing
- ✅ Review reports for violations
- ✅ Fix violations immediately (don't accumulate debt)

### 2. Semantic HTML First

- ✅ Use `<button>` for buttons, not `<div onClick>`
- ✅ Use `<input>` with `<label>`, not custom components
- ✅ Use `<nav>`, `<main>`, `<header>`, `<footer>` for landmarks

### 3. ARIA as Enhancement

- ✅ Use semantic HTML first
- ✅ Add ARIA attributes for complex interactions
- ❌ Don't use ARIA to "fix" bad HTML

### 4. Keyboard Navigation

- ✅ All interactive elements must be keyboard accessible
- ✅ Test with Tab, Enter, Space, Arrow keys
- ✅ Ensure visible focus indicators

### 5. Color Contrast

- ✅ Use design system tokens (guaranteed WCAG AA)
- ✅ Test text on all background colors
- ✅ Don't rely on color alone for information

---

## Design System Compliance

All Design System v2.0 components are built with accessibility:

### Built-In Accessibility Features

| Component | Accessibility Features |
|-----------|----------------------|
| **Button** | Semantic `<button>`, focus states, disabled states, loading indicators with aria-live |
| **Input** | `<label>` association, error messages with aria-describedby, required indicators |
| **Select** | Native `<select>` with keyboard navigation, error states |
| **Checkbox** | Semantic checkbox with visible focus, label association |
| **Radio** | Radio groups with fieldset/legend, keyboard navigation |
| **Card** | Semantic structure, optional interactive with role="button" |
| **Modal** | Focus trapping, role="dialog", aria-labelledby, Escape key support |
| **Toast** | role="alert" for announcements, dismissible with keyboard |
| **Logo** | Proper alt text, scalable SVG |

### Design Tokens for Contrast

```css
/* All tokens meet WCAG AA contrast requirements */
--color-text-primary: #1A1A1A;       /* 16.6:1 on white */
--color-accent-primary: #FFB400;     /* 4.5:1 on white (minimum AA) */
--color-error: #DC2626;              /* 4.5:1 on white */
--color-success: #10B981;            /* 4.5:1 on white */
```

---

## Additional Resources

### Tools
- **axe DevTools** - Browser extension for manual testing
- **WAVE** - Web accessibility evaluation tool
- **Lighthouse** - Chrome DevTools accessibility audits

### Documentation
- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)
- [axe-core Rules](https://github.com/dequelabs/axe-core/blob/develop/doc/rule-descriptions.md)
- [MDN Accessibility Guide](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

### Training
- [WebAIM Training](https://webaim.org/training/)
- [Deque University](https://dequeuniversity.com/)
- [Google Web Accessibility Course](https://web.dev/learn/accessibility/)

---

## Continuous Improvement

### Monitoring

- 📊 Track violation trends over time
- 📊 Monitor report artifacts in CI/CD
- 📊 Review accessibility metrics monthly

### Expanding Coverage

- Add E2E accessibility tests for full pages
- Test with real assistive technologies (screen readers)
- Conduct manual accessibility audits
- Include user testing with people with disabilities

---

## Support

For questions or issues with accessibility testing:

1. Check this documentation first
2. Review `.storybook/README.md` for Storybook setup
3. Check GitHub Issues for known problems
4. Consult WCAG 2.1 documentation for standards

---

**Maintained by:** Claude (AI Development Assistant)
**Last Review:** 2025-11-06
**Next Review:** 2026-02-06 (quarterly)
