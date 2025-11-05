/**
 * Sample Unit Tests for Utility Functions
 *
 * Demonstrates simple Vitest tests
 */

import { describe, it, expect } from 'vitest';

// Simple utility functions for testing
function formatQuoteNumber(year: number, sequence: number): string {
  return `EE-${year}-${sequence.toString().padStart(4, '0')}`;
}

function validateEmail(email: string): boolean {
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email);
}

function calculatePercentage(value: number, total: number): number {
  if (total === 0) {
    return 0;
  }
  return Math.round((value / total) * 100);
}

describe('Utility Functions', () => {
  describe('formatQuoteNumber', () => {
    it('should format quote number with leading zeros', () => {
      const result = formatQuoteNumber(2025, 1);
      expect(result).toBe('EE-2025-0001');
    });

    it('should handle large sequence numbers', () => {
      const result = formatQuoteNumber(2025, 9999);
      expect(result).toBe('EE-2025-9999');
    });

    it('should pad sequence with exactly 4 digits', () => {
      const result = formatQuoteNumber(2025, 42);
      expect(result).toBe('EE-2025-0042');
    });
  });

  describe('validateEmail', () => {
    it('should validate correct email format', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.uk')).toBe(true);
    });

    it('should reject invalid email format', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('test @example.com')).toBe(false);
    });
  });

  describe('calculatePercentage', () => {
    it('should calculate percentage correctly', () => {
      expect(calculatePercentage(25, 100)).toBe(25);
      expect(calculatePercentage(50, 200)).toBe(25);
    });

    it('should round to nearest integer', () => {
      expect(calculatePercentage(1, 3)).toBe(33);
      expect(calculatePercentage(2, 3)).toBe(67);
    });

    it('should handle zero total', () => {
      expect(calculatePercentage(10, 0)).toBe(0);
    });

    it('should handle zero value', () => {
      expect(calculatePercentage(0, 100)).toBe(0);
    });
  });
});
