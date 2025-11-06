import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Radio } from './Radio';

/**
 * Radio Component - Design System v2.0
 *
 * **Philosophy:** "Confident Affordance" - Clear selection feedback
 *
 * Custom radio button with CAT Gold inner circle and satisfying fill animation.
 * Uses 100ms instant timing for radio selection (industrial responsiveness).
 *
 * **Motion Timing:** 100ms instant (inner circle animation)
 *
 * **Design Tokens:**
 * - Selected: CAT Gold inner circle (#FFB400)
 * - Animation: Scale-in (100ms)
 * - Focus: CAT Gold ring
 */
const meta = {
  title: 'Components/Radio',
  component: Radio,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Custom radio button with CAT Gold inner circle and 100ms instant feedback.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: 'Radio label',
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
    checked: {
      control: 'boolean',
      description: 'Checked state',
    },
    size: {
      control: 'radio',
      options: ['small', 'medium', 'large'],
      description: 'Radio size',
    },
  },
} satisfies Meta<typeof Radio>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic States
export const Unchecked: Story = {
  args: {
    label: 'Option 1',
    name: 'example',
    value: 'option1',
    checked: false,
  },
};

export const Checked: Story = {
  args: {
    label: 'Option 1',
    name: 'example',
    value: 'option1',
    checked: true,
  },
};

export const Required: Story = {
  args: {
    label: 'Option 1',
    name: 'example',
    value: 'option1',
    checked: false,
    required: true,
  },
};

export const WithHelperText: Story = {
  args: {
    label: 'Standard Pricing',
    name: 'pricing',
    value: 'standard',
    helperText: 'Default pricing structure for metro area',
    checked: false,
  },
};

// Error State
export const WithError: Story = {
  args: {
    label: 'Payment Method',
    name: 'payment',
    value: 'card',
    checked: false,
    error: 'Please select a payment method to continue',
    required: true,
  },
};

// Disabled States
export const DisabledUnchecked: Story = {
  args: {
    label: 'Regional (Coming Soon)',
    name: 'region',
    value: 'regional',
    checked: false,
    disabled: true,
  },
};

export const DisabledChecked: Story = {
  args: {
    label: 'Metro Area (Selected)',
    name: 'region',
    value: 'metro',
    checked: true,
    disabled: true,
  },
};

// Sizes
export const Small: Story = {
  args: {
    label: 'Small radio',
    name: 'size',
    value: 'small',
    size: 'small',
    checked: false,
  },
};

export const Medium: Story = {
  args: {
    label: 'Medium radio (default)',
    name: 'size',
    value: 'medium',
    size: 'medium',
    checked: false,
  },
};

export const Large: Story = {
  args: {
    label: 'Large radio',
    name: 'size',
    value: 'large',
    size: 'large',
    checked: false,
  },
};

// Radio Group Example
export const RadioGroup: Story = {
  render: () => {
    const [selected, setSelected] = useState('retaining_wall');

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--spacing-3)',
          maxWidth: '400px',
        }}
      >
        <h4
          style={{
            fontSize: 'var(--font-size-base)',
            fontWeight: 'var(--font-weight-semibold)',
            margin: 0,
          }}
        >
          Select Job Type *
        </h4>

        <Radio
          name="jobType"
          label="Retaining Wall"
          value="retaining_wall"
          checked={selected === 'retaining_wall'}
          onChange={(e) => setSelected(e.target.value)}
        />

        <Radio
          name="jobType"
          label="Driveway"
          value="driveway"
          checked={selected === 'driveway'}
          onChange={(e) => setSelected(e.target.value)}
        />

        <Radio
          name="jobType"
          label="Trenching"
          value="trenching"
          checked={selected === 'trenching'}
          onChange={(e) => setSelected(e.target.value)}
        />

        <Radio
          name="jobType"
          label="Stormwater Drainage"
          value="stormwater"
          checked={selected === 'stormwater'}
          onChange={(e) => setSelected(e.target.value)}
        />

        <Radio
          name="jobType"
          label="Site Preparation"
          value="site_prep"
          checked={selected === 'site_prep'}
          onChange={(e) => setSelected(e.target.value)}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Radio group example with shared name attribute (only one can be selected).',
      },
    },
  },
};

// Interactive Example
export const InteractiveExample: Story = {
  render: () => {
    const [priceSheet, setPriceSheet] = useState('standard');
    const [paymentTerms, setPaymentTerms] = useState('net_30');

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--spacing-6)',
          maxWidth: '400px',
        }}
      >
        <div>
          <h4
            style={{
              fontSize: 'var(--font-size-base)',
              fontWeight: 'var(--font-weight-semibold)',
              marginBottom: 'var(--spacing-3)',
            }}
          >
            Price Sheet *
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
            <Radio
              name="priceSheet"
              label="Standard Pricing"
              helperText="Default pricing structure for metro area"
              value="standard"
              checked={priceSheet === 'standard'}
              onChange={(e) => setPriceSheet(e.target.value)}
            />
            <Radio
              name="priceSheet"
              label="Premium Pricing"
              helperText="Higher tier with additional services"
              value="premium"
              checked={priceSheet === 'premium'}
              onChange={(e) => setPriceSheet(e.target.value)}
            />
          </div>
        </div>

        <div>
          <h4
            style={{
              fontSize: 'var(--font-size-base)',
              fontWeight: 'var(--font-weight-semibold)',
              marginBottom: 'var(--spacing-3)',
            }}
          >
            Payment Terms *
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
            <Radio
              name="paymentTerms"
              label="Net 30"
              value="net_30"
              checked={paymentTerms === 'net_30'}
              onChange={(e) => setPaymentTerms(e.target.value)}
            />
            <Radio
              name="paymentTerms"
              label="Net 60"
              value="net_60"
              checked={paymentTerms === 'net_60'}
              onChange={(e) => setPaymentTerms(e.target.value)}
            />
            <Radio
              name="paymentTerms"
              label="Due on Receipt"
              value="due_on_receipt"
              checked={paymentTerms === 'due_on_receipt'}
              onChange={(e) => setPaymentTerms(e.target.value)}
            />
          </div>
        </div>

        <div
          style={{
            padding: 'var(--spacing-4)',
            backgroundColor: 'var(--color-background-secondary)',
            borderRadius: '0.25rem',
          }}
        >
          <p style={{ fontSize: 'var(--font-size-sm)', margin: 0 }}>
            <strong>Selected:</strong> {priceSheet} | {paymentTerms}
          </p>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive example with multiple radio groups and state management.',
      },
    },
  },
};
