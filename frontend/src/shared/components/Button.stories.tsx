import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

/**
 * Button Component - Design System v2.0
 *
 * **Philosophy:** "Confident Affordance" - Industrial push-button feel
 *
 * The Button component provides three variants (primary, secondary, tertiary)
 * with consistent sizing, loading states, and icon support. All buttons follow
 * the 100ms instant feedback timing for hover and active states.
 *
 * **Motion Timing:** 100ms instant (industrial responsiveness)
 *
 * **Design Tokens:**
 * - Primary: CAT Gold (#FFB400) background
 * - Focus: CAT Gold ring with 3px glow
 * - Hover: Lift effect (translateY -1px)
 * - Active: Compression (translateY 0)
 */
const meta = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Industrial push-button with confident affordance and instant 100ms feedback.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'radio',
      options: ['primary', 'secondary', 'tertiary'],
      description: 'Visual style variant',
    },
    size: {
      control: 'radio',
      options: ['small', 'medium', 'large'],
      description: 'Button size',
    },
    fullWidth: {
      control: 'boolean',
      description: 'Full width button',
    },
    loading: {
      control: 'boolean',
      description: 'Loading state (shows spinner)',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state',
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

// Primary Variant Stories
export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Button',
  },
};

export const PrimarySmall: Story = {
  args: {
    variant: 'primary',
    size: 'small',
    children: 'Small Button',
  },
};

export const PrimaryLarge: Story = {
  args: {
    variant: 'primary',
    size: 'large',
    children: 'Large Button',
  },
};

export const PrimaryLoading: Story = {
  args: {
    variant: 'primary',
    loading: true,
    children: 'Saving...',
  },
};

export const PrimaryDisabled: Story = {
  args: {
    variant: 'primary',
    disabled: true,
    children: 'Disabled Button',
  },
};

export const PrimaryFullWidth: Story = {
  args: {
    variant: 'primary',
    fullWidth: true,
    children: 'Full Width Button',
  },
  parameters: {
    layout: 'padded',
  },
};

// Secondary Variant Stories
export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary Button',
  },
};

export const SecondarySmall: Story = {
  args: {
    variant: 'secondary',
    size: 'small',
    children: 'Small Button',
  },
};

export const SecondaryLarge: Story = {
  args: {
    variant: 'secondary',
    size: 'large',
    children: 'Large Button',
  },
};

// Tertiary Variant Stories
export const Tertiary: Story = {
  args: {
    variant: 'tertiary',
    children: 'Tertiary Button',
  },
};

export const TertiarySmall: Story = {
  args: {
    variant: 'tertiary',
    size: 'small',
    children: 'Small Button',
  },
};

export const TertiaryLarge: Story = {
  args: {
    variant: 'tertiary',
    size: 'large',
    children: 'Large Button',
  },
};

// With Icons
export const WithIconBefore: Story = {
  args: {
    variant: 'primary',
    children: 'Add Quote',
    iconBefore: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 5v14M5 12h14" />
      </svg>
    ),
  },
};

export const WithIconAfter: Story = {
  args: {
    variant: 'primary',
    children: 'Next',
    iconAfter: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M5 12h14M12 5l7 7-7 7" />
      </svg>
    ),
  },
};

// Interactive Example
export const InteractiveExample: Story = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  render: (_args: any) => (
    <div style={{ display: 'flex', gap: 'var(--spacing-3)', flexWrap: 'wrap' }}>
      <Button variant="primary">Get Free Quote</Button>
      <Button variant="secondary">View Details</Button>
      <Button variant="tertiary">Cancel</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Example of button variants used together in a typical interface.',
      },
    },
  },
};
