import type { Meta, StoryObj } from '@storybook/react';
import { Logo } from './Logo';

const meta = {
  title: 'Components/Logo',
  component: Logo,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Embark Earthworks logo with multiple variants and sizes.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Logo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ColoredSmall: Story = {
  args: {
    variant: 'colored',
    size: 'small',
  },
};

export const ColoredMedium: Story = {
  args: {
    variant: 'colored',
    size: 'medium',
  },
};

export const ColoredLarge: Story = {
  args: {
    variant: 'colored',
    size: 'large',
  },
};

export const BlackWhiteSmall: Story = {
  args: {
    variant: 'bw',
    size: 'small',
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
};

export const BlackWhiteMedium: Story = {
  args: {
    variant: 'bw',
    size: 'medium',
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
};

export const IconVariant: Story = {
  args: {
    variant: 'icon',
    size: 'small',
  },
};

export const CustomSize: Story = {
  args: {
    variant: 'colored',
    size: 200,
  },
};

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
      }}
    >
      <Logo size="small" variant="colored" />
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
};
