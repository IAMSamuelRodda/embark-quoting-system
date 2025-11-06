# Storybook Documentation - Design System v2.0

**Version:** 1.0
**Last Updated:** 2025-11-06
**Components:** 9 (Button, Input, Select, Checkbox, Radio, Card, Modal, Toast, Logo)

---

## Overview

This Storybook instance provides an interactive playground for the Embark Quoting System's Design System v2.0 components. All components follow the **Industrial Clarity** design philosophy with consistent motion timing, CAT Gold branding, and WCAG AA accessibility standards.

---

## Running Storybook

### Development Mode

```bash
npm run storybook
```

Starts Storybook development server at **http://localhost:6006**

### Build Static Version

```bash
npm run build-storybook
```

Builds static Storybook to `storybook-static/` directory for deployment.

---

## Component Library

### Interactive Components

1. **Button** - Industrial push-button with 100ms instant feedback
2. **Input** - Text input with helpful error messaging
3. **Select** - Custom dropdown with keyboard navigation
4. **Checkbox** - Custom checkbox with CAT Gold checkmark
5. **Radio** - Custom radio with CAT Gold inner circle
6. **Card** - Container with consistent elevation
7. **Modal** - Dialog with purposeful choreography (300ms + 100ms delay)
8. **Toast** - Notification with helpful messaging
9. **Logo** - Embark Earthworks branding

### Design Philosophy

**Industrial Clarity:**
- Brutalist honesty + Swiss precision
- CAT Gold (#FFB400) accent color
- 8px spacing grid
- System fonts (zero download)
- WCAG AA compliance

**Motion Timing Hierarchy:**
- **100ms:** Instant feedback (Button, Checkbox, Radio)
- **200ms:** Fast state changes (Input, Select, Toast exit)
- **300ms:** Purposeful choreography (Modal, Toast entrance)

---

## Story Organization

Stories are organized in the `Components/` category:

```
Components/
├── Button
├── Input
├── Select
├── Checkbox
├── Radio
├── Card
├── Modal
├── Toast
└── Logo
```

Each component includes:
- **Default story** - Basic usage
- **Variants** - Different visual styles
- **States** - Disabled, loading, error, etc.
- **Sizes** - Small, medium, large
- **Interactive examples** - Real-world usage

---

## Using Components in Stories

### Import Pattern

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { ComponentName } from './ComponentName';

const meta = {
  title: 'Components/ComponentName',
  component: ComponentName,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ComponentName>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    // Component props
  },
};
```

### Interactive Stories with State

```tsx
export const Interactive: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <ComponentName value={value} onChange={setValue} />
    );
  },
};
```

---

## Design Tokens

All components use CSS custom properties from `src/styles/index.css`:

### Colors
```css
--color-accent-primary: #FFB400;     /* CAT Gold */
--color-text-primary: #1A1A1A;       /* Near-black */
--color-background-primary: #FFFFFF; /* Pure white */
--color-success: #10B981;            /* Green */
--color-error: #DC2626;              /* Red */
```

### Spacing (8px grid)
```css
--spacing-1: 0.25rem;  /* 4px */
--spacing-2: 0.5rem;   /* 8px */
--spacing-3: 0.75rem;  /* 12px */
--spacing-4: 1rem;     /* 16px */
--spacing-6: 1.5rem;   /* 24px */
```

### Shadows
```css
--shadow-sm: 0 1px 2px rgba(26,26,26,0.05);
--shadow-md: 0 4px 6px rgba(26,26,26,0.1);
--shadow-focus: 0 0 0 3px rgba(255,180,0,0.5);
```

---

## Accessibility Testing

Storybook includes the **@storybook/addon-a11y** addon for accessibility testing.

### Running A11y Checks

1. Open any story in Storybook
2. Navigate to the **Accessibility** tab
3. Review violations, warnings, and passes
4. Fix issues in component code
5. Re-test

### Keyboard Navigation

All components support keyboard navigation:
- **Tab:** Navigate between interactive elements
- **Enter/Space:** Activate buttons and checkboxes
- **Arrow keys:** Navigate select options and radio groups
- **Escape:** Close modals and dropdowns

---

## Background Options

Stories can be tested against different backgrounds:

- **light** (default): #FFFFFF
- **dark**: #1A1A1A
- **gray**: #F5F5F5

### Usage in Stories

```tsx
export const OnDarkBackground: Story = {
  args: {
    variant: 'bw', // Black & white logo
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
};
```

---

## Component Documentation

Each component story includes:

### Props Documentation
Auto-generated from TypeScript prop types using `autodocs` tag.

### Design Philosophy
Description of interaction philosophy (Confident Affordance, Helpful Not Punitive, etc.)

### Motion Timing
Specific transition durations and easing functions.

### Usage Examples
Code snippets showing real-world implementation.

---

## Adding New Components

### 1. Create Component Files

```bash
# Component implementation
src/shared/components/NewComponent.tsx
src/shared/components/NewComponent.css
```

### 2. Create Story File

```bash
src/shared/components/NewComponent.stories.tsx
```

### 3. Story Template

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { NewComponent } from './NewComponent';

/**
 * NewComponent - Design System v2.0
 *
 * **Philosophy:** [Design philosophy]
 * **Motion Timing:** [Timing details]
 * **Design Tokens:** [Tokens used]
 */
const meta = {
  title: 'Components/NewComponent',
  component: NewComponent,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '[Component description]',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    // Prop controls
  },
} satisfies Meta<typeof NewComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    // Default props
  },
};
```

### 4. Run Storybook

```bash
npm run storybook
```

Storybook automatically detects new `*.stories.tsx` files.

---

## Best Practices

### Story Naming
- Use descriptive names: `PrimarySmall`, `WithError`, `FullWidth`
- Group related stories: `Primary*`, `Secondary*`, `Tertiary*`
- End with `Example` for complex demos: `InteractiveExample`, `FormExample`

### Documentation
- Include design philosophy in story docstring
- Document motion timing and design tokens
- Provide interactive examples with state management
- Add usage notes in story descriptions

### Accessibility
- Test all components with keyboard navigation
- Review a11y addon violations
- Test with screen readers (when possible)
- Ensure focus states are clearly visible

### Design System Adherence
- Use CSS custom properties (`var(--color-*)`)
- Follow 8px spacing grid
- Apply motion timing hierarchy (100ms/200ms/300ms)
- Use CAT Gold for focus states (#FFB400)

---

## Deployment

### Static Build

```bash
npm run build-storybook
```

Generates static files in `storybook-static/` directory.

### Hosting Options

- **GitHub Pages** - Simple static hosting
- **Netlify/Vercel** - Automatic deployments
- **Chromatic** - Visual regression testing + hosting
- **Self-hosted** - Deploy `storybook-static/` anywhere

---

## Troubleshooting

### Storybook Won't Start

```bash
# Clear cache and reinstall
rm -rf node_modules .storybook/cache
npm install
npm run storybook
```

### Stories Not Appearing

- Ensure file matches pattern: `*.stories.@(js|jsx|ts|tsx)`
- Check file is in `src/**` directory (configured in `.storybook/main.ts`)
- Restart Storybook development server

### Design Tokens Not Loading

- Ensure `src/styles/index.css` is imported in `.storybook/preview.ts`
- Check browser DevTools for CSS variable values
- Verify token files exist in `src/styles/tokens/`

---

## Related Documentation

- **Design System Style Guide:** `docs/design/style-guide.md`
- **Component QA Report:** `docs/design/component-qa-report.md`
- **Logo Usage Guidelines:** `docs/design/logo-usage-guidelines.md`
- **Visual QA Checklist:** `docs/design/visual-qa-checklist.md`

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-11-06 | Initial Storybook setup with 9 components |

---

**Maintained by:** Claude (AI Development Assistant)
**For questions:** Refer to design system documentation in `docs/design/`
