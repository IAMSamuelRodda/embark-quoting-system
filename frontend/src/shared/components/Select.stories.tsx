import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Select } from './Select';

/**
 * Select Component - Design System v2.0
 *
 * **Philosophy:** "Helpful, Not Punitive" - Clear selection feedback
 *
 * Custom dropdown with full keyboard navigation (Arrow keys, Enter, Escape, Home, End).
 * Uses 200ms fast transitions for dropdown appearance and CAT Gold for focus and selection.
 *
 * **Motion Timing:** 200ms fast (dropdown animation)
 *
 * **Design Tokens:**
 * - Focus: CAT Gold ring
 * - Selected: CAT Gold checkmark
 * - Dropdown: Fade-in with slide (200ms)
 */
const meta = {
  title: 'Components/Select',
  component: Select,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Custom dropdown with keyboard navigation and 200ms fast transitions.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: 'Select label',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text',
    },
    helperText: {
      control: 'text',
      description: 'Helper text',
    },
    error: {
      control: 'text',
      description: 'Error message',
    },
    required: {
      control: 'boolean',
      description: 'Required field',
    },
    disabled: {
      control: 'boolean',
      description: 'Disabled state',
    },
    fullWidth: {
      control: 'boolean',
      description: 'Full width',
    },
    size: {
      control: 'radio',
      options: ['small', 'medium', 'large'],
      description: 'Select size',
    },
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

const jobTypeOptions = [
  { value: 'retaining_wall', label: 'Retaining Wall' },
  { value: 'driveway', label: 'Driveway' },
  { value: 'trenching', label: 'Trenching' },
  { value: 'stormwater', label: 'Stormwater Drainage' },
  { value: 'site_prep', label: 'Site Preparation' },
];

// Basic States
export const Default: Story = {
  args: {
    label: 'Job Type',
    placeholder: 'Select a job type...',
    options: jobTypeOptions,
  },
};

export const WithValue: Story = {
  args: {
    label: 'Job Type',
    options: jobTypeOptions,
    value: 'retaining_wall',
  },
};

export const Required: Story = {
  args: {
    label: 'Job Type',
    placeholder: 'Select a job type...',
    options: jobTypeOptions,
    required: true,
  },
};

export const WithHelperText: Story = {
  args: {
    label: 'Price Sheet',
    placeholder: 'Select a price sheet...',
    options: [
      { value: 'standard', label: 'Standard Pricing' },
      { value: 'premium', label: 'Premium Pricing' },
    ],
    helperText: 'Select the pricing structure for this quote',
  },
};

// Error State
export const WithError: Story = {
  args: {
    label: 'Job Type',
    placeholder: 'Select a job type...',
    options: jobTypeOptions,
    error: 'Please select a job type to continue',
    required: true,
  },
};

// Disabled States
export const Disabled: Story = {
  args: {
    label: 'Job Type',
    options: jobTypeOptions,
    value: 'retaining_wall',
    disabled: true,
  },
};

export const WithDisabledOption: Story = {
  args: {
    label: 'Region',
    placeholder: 'Select a region...',
    options: [
      { value: 'metro', label: 'Metro Area' },
      { value: 'regional', label: 'Regional (Coming Soon)', disabled: true },
    ],
  },
};

// Sizes
export const Small: Story = {
  args: {
    label: 'Small Select',
    size: 'small',
    options: jobTypeOptions,
  },
};

export const Large: Story = {
  args: {
    label: 'Large Select',
    size: 'large',
    options: jobTypeOptions,
  },
};

// Full Width
export const FullWidth: Story = {
  args: {
    label: 'Job Type',
    placeholder: 'Select a job type...',
    options: jobTypeOptions,
    fullWidth: true,
  },
};

// Long Option List
export const LongList: Story = {
  args: {
    label: 'Customer',
    placeholder: 'Select a customer...',
    options: Array.from({ length: 20 }, (_, i) => ({
      value: `customer_${i + 1}`,
      label: `Customer ${i + 1} - John Smith`,
    })),
  },
};

// Interactive Example
export const InteractiveExample = {
  render: () => {
    const [jobType, setJobType] = useState('');
    const [priceSheet, setPriceSheet] = useState('');

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--spacing-6)',
          maxWidth: '400px',
        }}
      >
        <Select
          label="Job Type"
          placeholder="Select a job type..."
          options={jobTypeOptions}
          value={jobType}
          onChange={setJobType}
          required
        />
        <Select
          label="Price Sheet"
          placeholder="Select a price sheet..."
          options={[
            { value: 'standard', label: 'Standard Pricing' },
            { value: 'premium', label: 'Premium Pricing' },
          ]}
          value={priceSheet}
          onChange={setPriceSheet}
          helperText="Determines the pricing structure for this quote"
        />
        <div
          style={{
            padding: 'var(--spacing-4)',
            backgroundColor: 'var(--color-background-secondary)',
            borderRadius: '0.25rem',
          }}
        >
          <p style={{ fontSize: 'var(--font-size-sm)', margin: 0 }}>
            <strong>Selected:</strong> {jobType || 'None'} | {priceSheet || 'None'}
          </p>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive example with state management.',
      },
    },
  },
};
