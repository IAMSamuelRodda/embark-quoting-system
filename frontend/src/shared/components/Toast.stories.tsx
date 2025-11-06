import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { Toast } from './Toast';
import { Button } from './Button';

const meta = {
  title: 'Components/Toast',
  component: Toast,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Toast notifications with Helpful, Not Punitive messaging.',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Toast>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Success: Story = {
  args: {
    variant: 'success',
    title: 'Quote saved',
    message: 'Your quote has been saved successfully',
    duration: 5000,
  },
};

export const Error: Story = {
  args: {
    variant: 'error',
    title: 'Unable to save quote',
    message: 'Please check your internet connection and try again',
    duration: 0,
  },
};

export const Warning: Story = {
  args: {
    variant: 'warning',
    title: 'Unsaved changes',
    message: 'You have unsaved changes. Please save before leaving.',
    duration: 7000,
  },
};

export const Info: Story = {
  args: {
    variant: 'info',
    message: 'Quote prices have been updated based on the latest price sheet',
    duration: 5000,
  },
};

export const Interactive: Story = {
  render: (_args) => {
    const [toasts, setToasts] = useState<
      Array<{
        id: number;
        variant: 'success' | 'error' | 'warning' | 'info';
        title?: string;
        message: string;
      }>
    >([]);

    const addToast = (
      variant: 'success' | 'error' | 'warning' | 'info',
      title: string,
      message: string,
    ) => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, variant, title, message }]);
    };

    return (
      <div style={{ display: 'flex', gap: 'var(--spacing-3)', flexWrap: 'wrap' }}>
        <Button
          variant="primary"
          onClick={() => addToast('success', 'Success', 'Operation completed successfully')}
        >
          Show Success
        </Button>
        <Button
          variant="secondary"
          onClick={() => addToast('error', 'Error', 'Unable to complete operation')}
        >
          Show Error
        </Button>
        <Button
          variant="secondary"
          onClick={() => addToast('warning', 'Warning', 'This action requires confirmation')}
        >
          Show Warning
        </Button>
        <Button
          variant="secondary"
          onClick={() => addToast('info', 'Info', 'System update available')}
        >
          Show Info
        </Button>

        <div
          style={{
            position: 'fixed',
            top: 'var(--spacing-6)',
            right: 'var(--spacing-6)',
            zIndex: 2000,
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--spacing-3)',
          }}
        >
          {toasts.map((toast) => (
            <Toast
              key={toast.id}
              variant={toast.variant}
              title={toast.title}
              message={toast.message}
              duration={5000}
              onClose={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
            />
          ))}
        </div>
      </div>
    );
  },
};
