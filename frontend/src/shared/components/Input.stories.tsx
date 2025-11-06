import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './Input';

/**
 * Input Component - Design System v2.0
 *
 * **Philosophy:** "Helpful, Not Punitive" - Calm, specific error messaging
 *
 * The Input component provides text input with helpful error states, success
 * feedback, and icon support. Error messages are specific and actionable, never
 * vague or condescending. All state changes use 200ms fast transitions.
 *
 * **Motion Timing:** 200ms fast (validation feedback)
 *
 * **Design Tokens:**
 * - Focus: CAT Gold ring with 3px glow
 * - Error: Red border + fade-in error message (no shake)
 * - Success: Green border + fade-in confirmation
 */
const meta = {
  title: 'Components/Input',
  component: Input,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Text input with helpful error messaging and 200ms fast validation feedback.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: 'Input label',
    },
    helperText: {
      control: 'text',
      description: 'Helper text (shown when no error)',
    },
    error: {
      control: 'text',
      description: 'Error message (helpful, specific)',
    },
    success: {
      control: 'text',
      description: 'Success message',
    },
    required: {
      control: 'boolean',
      description: 'Required field indicator',
    },
    fullWidth: {
      control: 'boolean',
      description: 'Full width input',
    },
    size: {
      control: 'radio',
      options: ['small', 'medium', 'large'],
      description: 'Input size',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state',
    },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic States
export const Default: Story = {
  args: {
    label: 'Customer Name',
    placeholder: 'Enter customer name',
  },
};

export const WithValue: Story = {
  args: {
    label: 'Email Address',
    value: 'john.smith@example.com',
  },
};

export const Required: Story = {
  args: {
    label: 'Customer Name',
    placeholder: 'Enter customer name',
    required: true,
  },
};

export const WithHelperText: Story = {
  args: {
    label: 'Quote Number',
    value: 'EE-2025-0001',
    helperText: 'Format: EE-YYYY-NNNN (e.g., EE-2025-0001)',
  },
};

// Error States (Helpful, Not Punitive)
export const WithError: Story = {
  args: {
    label: 'Email Address',
    value: 'invalid-email',
    error: 'Email address must include @ symbol',
    required: true,
  },
};

export const ErrorRequired: Story = {
  args: {
    label: 'Customer Name',
    error: 'Customer name is required to create a quote',
    required: true,
  },
};

export const ErrorSpecific: Story = {
  args: {
    label: 'Phone Number',
    value: '123',
    error: 'Phone number must be at least 10 digits',
  },
};

// Success State
export const WithSuccess: Story = {
  args: {
    label: 'Email Address',
    value: 'john.smith@example.com',
    success: 'Email address is valid',
  },
};

// Sizes
export const Small: Story = {
  args: {
    label: 'Small Input',
    size: 'small',
    placeholder: 'Compact size',
  },
};

export const Large: Story = {
  args: {
    label: 'Large Input',
    size: 'large',
    placeholder: 'Prominent size',
  },
};

// With Icons
export const WithIconBefore: Story = {
  args: {
    label: 'Search Quotes',
    placeholder: 'Search...',
    iconBefore: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
    ),
  },
};

export const WithIconAfter: Story = {
  args: {
    label: 'Email Address',
    placeholder: 'Enter your email',
    iconAfter: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect width="20" height="16" x="2" y="4" rx="2" />
        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
      </svg>
    ),
  },
};

// Disabled State
export const Disabled: Story = {
  args: {
    label: 'Locked Field',
    value: 'Cannot be edited',
    disabled: true,
  },
};

// Full Width
export const FullWidth: Story = {
  args: {
    label: 'Job Site Address',
    placeholder: 'Enter full address',
    fullWidth: true,
  },
};

// Input Types
export const TypeEmail: Story = {
  args: {
    label: 'Email Address',
    type: 'email',
    placeholder: 'user@example.com',
  },
};

export const TypePassword: Story = {
  args: {
    label: 'Password',
    type: 'password',
    placeholder: 'Enter password',
  },
};

export const TypeNumber: Story = {
  args: {
    label: 'Quantity',
    type: 'number',
    placeholder: '0',
  },
};

// Form Example
export const FormExample: Story = {
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--spacing-6)',
        maxWidth: '400px',
      }}
    >
      <Input label="Customer Name" placeholder="John Smith" required />
      <Input
        label="Email Address"
        type="email"
        placeholder="john.smith@example.com"
        helperText="We'll send quote updates to this email"
      />
      <Input label="Phone Number" type="tel" placeholder="0401 123 456" required />
      <Input label="Job Site Address" placeholder="123 Main Street, Sydney NSW 2000" fullWidth />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Example of inputs used together in a typical form.',
      },
    },
  },
};
