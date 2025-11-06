import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Checkbox } from './Checkbox';

/**
 * Checkbox Component - Design System v2.0
 *
 * **Philosophy:** "Confident Affordance" - Immediate visual feedback
 *
 * Custom checkbox with CAT Gold checkmark and satisfying scale animation.
 * Uses 100ms instant timing for checkbox selection (industrial responsiveness).
 *
 * **Motion Timing:** 100ms instant (checkmark animation)
 *
 * **Design Tokens:**
 * - Checked: CAT Gold background (#FFB400)
 * - Checkmark: Scale-in animation (100ms)
 * - Focus: CAT Gold ring
 */
const meta = {
  title: 'Components/Checkbox',
  component: Checkbox,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Custom checkbox with CAT Gold checkmark and 100ms instant feedback.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: 'Checkbox label',
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
      description: 'Checkbox size',
    },
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic States
export const Unchecked: Story = {
  args: {
    label: 'I agree to the terms and conditions',
    checked: false,
  },
};

export const Checked: Story = {
  args: {
    label: 'I agree to the terms and conditions',
    checked: true,
  },
};

export const Required: Story = {
  args: {
    label: 'I agree to the terms and conditions',
    checked: false,
    required: true,
  },
};

export const WithHelperText: Story = {
  args: {
    label: 'Email me quote updates',
    helperText: 'Receive notifications when quote status changes',
    checked: false,
  },
};

// Error State
export const WithError: Story = {
  args: {
    label: 'I agree to the terms and conditions',
    checked: false,
    error: 'You must accept the terms and conditions to continue',
    required: true,
  },
};

// Disabled States
export const DisabledUnchecked: Story = {
  args: {
    label: 'Locked feature (Premium only)',
    checked: false,
    disabled: true,
  },
};

export const DisabledChecked: Story = {
  args: {
    label: 'Always enabled feature',
    checked: true,
    disabled: true,
  },
};

// Sizes
export const Small: Story = {
  args: {
    label: 'Small checkbox',
    size: 'small',
    checked: false,
  },
};

export const Medium: Story = {
  args: {
    label: 'Medium checkbox (default)',
    size: 'medium',
    checked: false,
  },
};

export const Large: Story = {
  args: {
    label: 'Large checkbox',
    size: 'large',
    checked: false,
  },
};

// Without Label
export const WithoutLabel: Story = {
  args: {
    checked: false,
  },
};

// Interactive Example
export const InteractiveExample: Story = {
  render: () => {
    const [emailUpdates, setEmailUpdates] = useState(false);
    const [smsUpdates, setSmsUpdates] = useState(false);
    const [marketing, setMarketing] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);

    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--spacing-4)',
          maxWidth: '400px',
        }}
      >
        <h3
          style={{
            fontSize: 'var(--font-size-lg)',
            fontWeight: 'var(--font-weight-semibold)',
            margin: 0,
          }}
        >
          Notification Preferences
        </h3>

        <Checkbox
          label="Email me quote updates"
          helperText="Receive notifications when quote status changes"
          checked={emailUpdates}
          onChange={(e) => setEmailUpdates(e.target.checked)}
        />

        <Checkbox
          label="SMS notifications"
          helperText="Receive text messages for important updates"
          checked={smsUpdates}
          onChange={(e) => setSmsUpdates(e.target.checked)}
        />

        <Checkbox
          label="Marketing communications"
          helperText="Receive promotional offers and company news"
          checked={marketing}
          onChange={(e) => setMarketing(e.target.checked)}
        />

        <div
          style={{
            borderTop: '1px solid var(--color-border-default)',
            paddingTop: 'var(--spacing-4)',
            marginTop: 'var(--spacing-2)',
          }}
        >
          <Checkbox
            label="I agree to the terms and conditions"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            error={!termsAccepted ? 'You must accept the terms to continue' : undefined}
            required
          />
        </div>

        <div
          style={{
            padding: 'var(--spacing-4)',
            backgroundColor: 'var(--color-background-secondary)',
            borderRadius: '0.25rem',
          }}
        >
          <p style={{ fontSize: 'var(--font-size-sm)', margin: 0 }}>
            <strong>Selected:</strong> Email: {emailUpdates ? '✓' : '✗'}, SMS:{' '}
            {smsUpdates ? '✓' : '✗'}, Marketing: {marketing ? '✓' : '✗'}, Terms:{' '}
            {termsAccepted ? '✓' : '✗'}
          </p>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive example with multiple checkboxes and state management.',
      },
    },
  },
};
