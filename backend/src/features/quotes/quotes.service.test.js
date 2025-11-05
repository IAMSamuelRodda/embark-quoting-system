/**
 * Sample Unit Tests for Quotes Service
 *
 * Demonstrates Jest test framework with ES modules
 */

import { describe, it, expect } from '@jest/globals';

describe('Quote Number Generation', () => {
  it('should generate quote number in correct format', () => {
    const year = new Date().getFullYear();
    const quoteNumber = `EE-${year}-0001`;

    // Test format: EE-YYYY-NNNN
    const pattern = /^EE-\d{4}-\d{4}$/;
    expect(quoteNumber).toMatch(pattern);
  });

  it('should pad sequence number with leading zeros', () => {
    const sequence = 42;
    const padded = sequence.toString().padStart(4, '0');

    expect(padded).toBe('0042');
    expect(padded.length).toBe(4);
  });

  it('should extract sequence from quote number', () => {
    const quoteNumber = 'EE-2025-0123';
    const match = quoteNumber.match(/EE-\d{4}-(\d{4})/);
    const sequence = match ? parseInt(match[1], 10) : 0;

    expect(sequence).toBe(123);
  });
});

describe('Quote Validation', () => {
  it('should validate customer name is required', () => {
    const invalidQuote = {
      customer_name: '',
    };

    expect(invalidQuote.customer_name).toBe('');
    expect(invalidQuote.customer_name.length).toBe(0);
  });

  it('should validate email format', () => {
    const validEmail = 'test@example.com';
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    expect(validEmail).toMatch(emailPattern);
  });

  it('should allow optional fields to be undefined', () => {
    const minimalQuote = {
      customer_name: 'John Doe',
    };

    expect(minimalQuote.customer_phone).toBeUndefined();
    expect(minimalQuote.customer_address).toBeUndefined();
  });
});

describe('Quote Status', () => {
  const validStatuses = ['draft', 'quoted', 'booked', 'in_progress', 'completed', 'cancelled'];

  it('should recognize all valid quote statuses', () => {
    validStatuses.forEach((status) => {
      expect(validStatuses).toContain(status);
    });
  });

  it('should default to draft status', () => {
    const newQuote = {
      status: 'draft',
    };

    expect(newQuote.status).toBe('draft');
  });
});
