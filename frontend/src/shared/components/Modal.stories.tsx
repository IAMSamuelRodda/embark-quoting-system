import type { Meta } from '@storybook/react';
import { useState } from 'react';
import { Modal, ModalFooter } from './Modal';
import { Button } from './Button';
import { Input } from './Input';

const meta = {
  title: 'Components/Modal',
  component: Modal,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Modal with Purposeful Choreography (300ms base + 100ms delay).',
      },
    },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Modal>;

export default meta;

export const Default = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
        <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Modal Title">
          <p>This is a modal with purposeful choreography.</p>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setIsOpen(false)}>
              Confirm
            </Button>
          </ModalFooter>
        </Modal>
      </>
    );
  },
};

export const SmallSize = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Delete Quote</Button>
        <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Delete Quote" size="small">
          <p>Are you sure you want to delete this quote? This action cannot be undone.</p>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setIsOpen(false)}>
              Delete
            </Button>
          </ModalFooter>
        </Modal>
      </>
    );
  },
};

export const FormModal = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>Create Quote</Button>
        <Modal
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          title="Create New Quote"
          size="medium"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-4)' }}>
            <Input label="Customer Name" placeholder="John Smith" required />
            <Input label="Email Address" type="email" placeholder="john@example.com" />
            <Input label="Phone Number" type="tel" placeholder="0401 123 456" />
          </div>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setIsOpen(false)}>
              Create Quote
            </Button>
          </ModalFooter>
        </Modal>
      </>
    );
  },
};
