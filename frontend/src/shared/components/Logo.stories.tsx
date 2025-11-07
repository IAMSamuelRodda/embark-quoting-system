import type { Meta, StoryObj } from '@storybook/react';
import { Logo } from './Logo';

/**
 * Logo Component - Responsive brand representation
 *
 * **Responsive Behavior:**
 * - Desktop (>640px): Shows full wordmark logo
 * - Mobile (≤640px): Shows icon-only logo
 *
 * **Variants:**
 * - `responsive` (default): Wordmark on desktop, icon on mobile
 * - `wordmark`: Always shows full wordmark
 * - `icon-light`: Always shows icon (light backgrounds)
 * - `icon-dark`: Always shows icon (dark backgrounds)
 *
 * **Sizes:**
 * - Small: 80px (navigation)
 * - Medium: 120px (default)
 * - Large: 160px (hero sections)
 * - Custom: Specify pixel height
 */
const meta = {
  title: 'Components/Logo',
  component: Logo,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Responsive logo component that switches between wordmark (desktop) and icon (mobile) at 640px breakpoint. Uses performance-optimized WebP format.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'radio',
      options: ['responsive', 'wordmark', 'icon-light', 'icon-dark'],
      description: 'Logo variant',
    },
    size: {
      control: 'radio',
      options: ['small', 'medium', 'large'],
      description: 'Logo size',
    },
  },
} satisfies Meta<typeof Logo>;

export default meta;
type Story = StoryObj<typeof meta>;

// Responsive Variant (Default)
export const Responsive: Story = {
  args: {
    variant: 'responsive',
    size: 'medium',
  },
  parameters: {
    docs: {
      description: {
        story: 'Default responsive logo. Shows wordmark on desktop (>640px), icon on mobile (≤640px). Resize browser to see switching behavior.',
      },
    },
  },
};

export const ResponsiveSmall: Story = {
  args: {
    variant: 'responsive',
    size: 'small',
  },
};

export const ResponsiveLarge: Story = {
  args: {
    variant: 'responsive',
    size: 'large',
  },
};

// Wordmark Variant (Always full logo)
export const Wordmark: Story = {
  args: {
    variant: 'wordmark',
    size: 'medium',
  },
  parameters: {
    docs: {
      description: {
        story: 'Always shows full wordmark logo, regardless of screen size.',
      },
    },
  },
};

export const WordmarkSmall: Story = {
  args: {
    variant: 'wordmark',
    size: 'small',
  },
};

export const WordmarkLarge: Story = {
  args: {
    variant: 'wordmark',
    size: 'large',
  },
};

// Icon Light Variant (For light backgrounds)
export const IconLight: Story = {
  args: {
    variant: 'icon-light',
    size: 'small',
  },
  parameters: {
    docs: {
      description: {
        story: 'Icon-only logo for light backgrounds. Use for favicons, mobile headers, and compact spaces.',
      },
    },
  },
};

// Icon Dark Variant (For dark backgrounds)
export const IconDark: Story = {
  args: {
    variant: 'icon-dark',
    size: 'small',
  },
  parameters: {
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        story: 'Icon-only logo for dark backgrounds.',
      },
    },
  },
};

// Custom Size Example
export const CustomSize: Story = {
  args: {
    variant: 'responsive',
    size: 200,
  },
  parameters: {
    docs: {
      description: {
        story: 'Custom size example (200px height). Pass a number to size prop for custom heights.',
      },
    },
  },
};

// Navigation Example (Real-world usage)
export const InNavigation: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-4)',
        padding: 'var(--spacing-4)',
        backgroundColor: 'var(--color-background-primary)',
        border: '1px solid var(--color-border-default)',
        width: '100%',
        maxWidth: '800px',
      }}
    >
      <Logo size="small" variant="responsive" />
      <nav style={{ display: 'flex', gap: 'var(--spacing-4)' }}>
        <a href="#" style={{ color: 'var(--color-text-primary)', textDecoration: 'none' }}>
          Quotes
        </a>
        <a href="#" style={{ color: 'var(--color-text-primary)', textDecoration: 'none' }}>
          Customers
        </a>
        <a href="#" style={{ color: 'var(--color-text-primary)', textDecoration: 'none' }}>
          Settings
        </a>
      </nav>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Example of logo in navigation bar. Uses small size with responsive variant.',
      },
    },
  },
};
