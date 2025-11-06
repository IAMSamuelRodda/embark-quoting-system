import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardHeader, CardBody, CardFooter } from './Card';
import { Button } from './Button';

/**
 * Card Component - Design System v2.0
 *
 * **Philosophy:** "Industrial Clarity" - Consistent elevation for visual hierarchy
 *
 * Container for grouping related content with compositional API (Card, CardHeader, CardBody, CardFooter).
 * Interactive cards provide subtle lift effect on hover (2px).
 *
 * **Motion Timing:** 200ms fast (responsive state changes)
 *
 * **Design Tokens:**
 * - Elevation: Shadow depth for hierarchy
 * - Padding: 8px spacing grid
 * - Border Radius: 8px (larger than buttons for containers)
 */
const meta = {
  title: 'Components/Card',
  component: Card,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Container with consistent elevation and 200ms responsive transitions.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'radio',
      options: ['flat', 'elevated', 'outlined'],
      description: 'Card variant (elevation style)',
    },
    interactive: {
      control: 'boolean',
      description: 'Interactive card (hover effect)',
    },
    padding: {
      control: 'radio',
      options: ['none', 'small', 'medium', 'large'],
      description: 'Padding size',
    },
    fullWidth: {
      control: 'boolean',
      description: 'Full width card',
    },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic Variants
export const Elevated: Story = {
  args: {
    variant: 'elevated',
    padding: 'medium',
    children: (
      <>
        <h3 style={{ margin: '0 0 var(--spacing-2) 0' }}>Quote #EE-2025-0001</h3>
        <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
          Retaining wall installation at 123 Main Street, Sydney NSW
        </p>
      </>
    ),
  },
};

export const Flat: Story = {
  args: {
    variant: 'flat',
    padding: 'medium',
    children: (
      <>
        <h3 style={{ margin: '0 0 var(--spacing-2) 0' }}>Flat Card</h3>
        <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
          No shadow, simple background
        </p>
      </>
    ),
  },
};

export const Outlined: Story = {
  args: {
    variant: 'outlined',
    padding: 'medium',
    children: (
      <>
        <h3 style={{ margin: '0 0 var(--spacing-2) 0' }}>Outlined Card</h3>
        <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>Border instead of shadow</p>
      </>
    ),
  },
};

// Interactive Card
export const Interactive: Story = {
  args: {
    variant: 'elevated',
    interactive: true,
    padding: 'medium',
    onClick: () => alert('Card clicked!'),
    children: (
      <>
        <h3 style={{ margin: '0 0 var(--spacing-2) 0' }}>Clickable Card</h3>
        <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
          Hover to see lift effect (2px)
        </p>
      </>
    ),
  },
};

// Padding Sizes
export const PaddingNone: Story = {
  args: {
    padding: 'none',
    children: (
      <>
        <CardHeader title="No Padding Card" subtitle="Header and footer have borders" />
        <CardBody>
          <p style={{ margin: 0 }}>Body content with internal padding</p>
        </CardBody>
        <CardFooter>
          <Button variant="secondary" size="small">
            Cancel
          </Button>
          <Button variant="primary" size="small">
            Confirm
          </Button>
        </CardFooter>
      </>
    ),
  },
};

export const PaddingSmall: Story = {
  args: {
    padding: 'small',
    children: (
      <>
        <h4 style={{ margin: '0 0 var(--spacing-1) 0' }}>Small Padding</h4>
        <p style={{ margin: 0, fontSize: 'var(--font-size-sm)' }}>Compact card</p>
      </>
    ),
  },
};

export const PaddingLarge: Story = {
  args: {
    padding: 'large',
    children: (
      <>
        <h3 style={{ margin: '0 0 var(--spacing-3) 0' }}>Large Padding</h3>
        <p style={{ margin: 0 }}>Spacious card for important content</p>
      </>
    ),
  },
};

// Compositional API
export const WithHeaderBodyFooter: Story = {
  args: {
    padding: 'none',
    children: (
      <>
        <CardHeader
          title="Quote #EE-2025-0001"
          subtitle="Created on 2025-11-06"
          action={
            <Button variant="tertiary" size="small">
              Edit
            </Button>
          }
        />
        <CardBody>
          <p style={{ margin: '0 0 var(--spacing-2) 0' }}>
            <strong>Customer:</strong> John Smith
          </p>
          <p style={{ margin: '0 0 var(--spacing-2) 0' }}>
            <strong>Job Type:</strong> Retaining Wall
          </p>
          <p style={{ margin: 0 }}>
            <strong>Total:</strong> $12,500
          </p>
        </CardBody>
        <CardFooter>
          <Button variant="secondary" size="small">
            Download PDF
          </Button>
          <Button variant="primary" size="small">
            View Details
          </Button>
        </CardFooter>
      </>
    ),
  },
};

// Full Width
export const FullWidth: Story = {
  args: {
    variant: 'elevated',
    padding: 'medium',
    fullWidth: true,
    children: (
      <>
        <h3 style={{ margin: '0 0 var(--spacing-2) 0' }}>Full Width Card</h3>
        <p style={{ margin: 0, color: 'var(--color-text-secondary)' }}>
          Spans the entire container width
        </p>
      </>
    ),
  },
  parameters: {
    layout: 'padded',
  },
};

// Quote Card Example
export const QuoteCard: Story = {
  render: (_args) => (
    <Card variant="elevated" padding="none" style={{ maxWidth: '400px' }}>
      <CardHeader
        title="Quote #EE-2025-0001"
        subtitle="Retaining Wall • Created 2025-11-06"
        action={
          <Button variant="tertiary" size="small">
            ⋮
          </Button>
        }
      />
      <CardBody>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
          <div>
            <p
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-secondary)',
                margin: '0 0 var(--spacing-1) 0',
              }}
            >
              Customer
            </p>
            <p style={{ fontWeight: 'var(--font-weight-semibold)', margin: 0 }}>John Smith</p>
          </div>
          <div>
            <p
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-secondary)',
                margin: '0 0 var(--spacing-1) 0',
              }}
            >
              Location
            </p>
            <p style={{ margin: 0 }}>123 Main Street, Sydney NSW 2000</p>
          </div>
          <div>
            <p
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-secondary)',
                margin: '0 0 var(--spacing-1) 0',
              }}
            >
              Total
            </p>
            <p
              style={{
                fontSize: 'var(--font-size-xl)',
                fontWeight: 'var(--font-weight-bold)',
                margin: 0,
                color: 'var(--color-accent-primary)',
              }}
            >
              $12,500
            </p>
          </div>
        </div>
      </CardBody>
      <CardFooter>
        <Button variant="secondary" size="small" fullWidth>
          Download PDF
        </Button>
        <Button variant="primary" size="small" fullWidth>
          View Details
        </Button>
      </CardFooter>
    </Card>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Example of a complete quote card with header, body, and footer.',
      },
    },
  },
};

// Dashboard Cards
export const DashboardExample: Story = {
  render: (_args) => (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 'var(--spacing-4)',
      }}
    >
      <Card variant="elevated" padding="medium">
        <h4
          style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-secondary)',
            margin: '0 0 var(--spacing-2) 0',
          }}
        >
          Total Quotes
        </h4>
        <p
          style={{
            fontSize: 'var(--font-size-2xl)',
            fontWeight: 'var(--font-weight-bold)',
            margin: 0,
          }}
        >
          24
        </p>
      </Card>

      <Card variant="elevated" padding="medium">
        <h4
          style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-secondary)',
            margin: '0 0 var(--spacing-2) 0',
          }}
        >
          Pending
        </h4>
        <p
          style={{
            fontSize: 'var(--font-size-2xl)',
            fontWeight: 'var(--font-weight-bold)',
            margin: 0,
            color: 'var(--color-warning)',
          }}
        >
          8
        </p>
      </Card>

      <Card variant="elevated" padding="medium">
        <h4
          style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-secondary)',
            margin: '0 0 var(--spacing-2) 0',
          }}
        >
          Approved
        </h4>
        <p
          style={{
            fontSize: 'var(--font-size-2xl)',
            fontWeight: 'var(--font-weight-bold)',
            margin: 0,
            color: 'var(--color-success)',
          }}
        >
          16
        </p>
      </Card>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Dashboard stats cards example.',
      },
    },
  },
};
