/**
 * Financial Settings Service Tests
 *
 * Unit tests for validation and business logic
 */

import { describe, it, expect } from '@jest/globals';
import * as repository from './settings.repository.js';

describe('Financial Settings Validation', () => {
  describe('validateSettings', () => {
    it('should accept valid default settings', () => {
      const errors = repository.validateSettings(repository.DEFAULT_SETTINGS);
      expect(errors).toEqual([]);
    });

    it('should reject invalid GST rate (negative)', () => {
      const settings = {
        ...repository.DEFAULT_SETTINGS,
        gst: -0.1,
      };
      const errors = repository.validateSettings(settings);
      expect(errors).toContain('GST rate must be a number between 0 and 1');
    });

    it('should reject invalid GST rate (> 1)', () => {
      const settings = {
        ...repository.DEFAULT_SETTINGS,
        gst: 1.5,
      };
      const errors = repository.validateSettings(settings);
      expect(errors).toContain('GST rate must be a number between 0 and 1');
    });

    it('should reject missing profit_first configuration', () => {
      const settings = {
        ...repository.DEFAULT_SETTINGS,
        profit_first: null,
      };
      const errors = repository.validateSettings(settings);
      expect(errors).toContain('profit_first configuration is required');
    });

    it('should reject profit_first percentages that do not sum to 100%', () => {
      const settings = {
        ...repository.DEFAULT_SETTINGS,
        profit_first: {
          profit: 0.10, // 10%
          owner: 0.40, // 40%
          tax: 0.15, // 15%
          opex: 0.30, // 30%
          // Total: 95% (not 100%)
        },
      };
      const errors = repository.validateSettings(settings);
      expect(errors.some((e) => e.includes('must sum to 100%'))).toBe(true);
    });

    it('should reject negative profit_first percentages', () => {
      const settings = {
        ...repository.DEFAULT_SETTINGS,
        profit_first: {
          profit: -0.05,
          owner: 0.55,
          tax: 0.15,
          opex: 0.30,
        },
      };
      const errors = repository.validateSettings(settings);
      expect(errors).toContain(
        'All profit_first percentages must be positive',
      );
    });

    it('should reject overhead multiplier < 1.0', () => {
      const settings = {
        ...repository.DEFAULT_SETTINGS,
        overhead_multiplier: 0.8,
      };
      const errors = repository.validateSettings(settings);
      expect(errors).toContain('Overhead multiplier must be a number >= 1.0');
    });

    it('should accept overhead multiplier = 1.0', () => {
      const settings = {
        ...repository.DEFAULT_SETTINGS,
        overhead_multiplier: 1.0,
      };
      const errors = repository.validateSettings(settings);
      expect(errors).toEqual([]);
    });

    it('should accept overhead multiplier > 1.0', () => {
      const settings = {
        ...repository.DEFAULT_SETTINGS,
        overhead_multiplier: 1.15,
      };
      const errors = repository.validateSettings(settings);
      expect(errors).toEqual([]);
    });

    it('should reject empty deposit_options array', () => {
      const settings = {
        ...repository.DEFAULT_SETTINGS,
        deposit_options: [],
      };
      const errors = repository.validateSettings(settings);
      expect(errors).toContain('At least one deposit option is required');
    });

    it('should reject invalid deposit options (> 1)', () => {
      const settings = {
        ...repository.DEFAULT_SETTINGS,
        deposit_options: [0.20, 1.5, 0.30],
      };
      const errors = repository.validateSettings(settings);
      expect(errors).toContain(
        'All deposit options must be numbers between 0 and 1',
      );
    });

    it('should reject invalid deposit options (negative)', () => {
      const settings = {
        ...repository.DEFAULT_SETTINGS,
        deposit_options: [0.20, -0.25, 0.30],
      };
      const errors = repository.validateSettings(settings);
      expect(errors).toContain(
        'All deposit options must be numbers between 0 and 1',
      );
    });

    it('should reject invalid default_deposit (> 1)', () => {
      const settings = {
        ...repository.DEFAULT_SETTINGS,
        default_deposit: 1.5,
      };
      const errors = repository.validateSettings(settings);
      expect(errors).toContain(
        'Default deposit must be a number between 0 and 1',
      );
    });

    it('should reject invalid default_deposit (zero)', () => {
      const settings = {
        ...repository.DEFAULT_SETTINGS,
        default_deposit: 0,
      };
      const errors = repository.validateSettings(settings);
      expect(errors).toContain(
        'Default deposit must be a number between 0 and 1',
      );
    });

    it('should reject negative rounding increment', () => {
      const settings = {
        ...repository.DEFAULT_SETTINGS,
        rounding_increment: -10,
      };
      const errors = repository.validateSettings(settings);
      expect(errors).toContain('Rounding increment must be a positive number');
    });

    it('should reject zero rounding increment', () => {
      const settings = {
        ...repository.DEFAULT_SETTINGS,
        rounding_increment: 0,
      };
      const errors = repository.validateSettings(settings);
      expect(errors).toContain('Rounding increment must be a positive number');
    });

    it('should accept valid custom settings (revised TAPs)', () => {
      // Example: Business between $250K-$500K revenue
      const settings = {
        gst: 0.10,
        profit_first: {
          profit: 0.10, // 10%
          owner: 0.40, // 40%
          tax: 0.15, // 15%
          opex: 0.35, // 35%
        },
        overhead_multiplier: 1.05,
        deposit_options: [0.30, 0.40, 0.50],
        default_deposit: 0.40,
        rounding_increment: 50,
        travel_cost_per_km: 2.5,
        dumping_per_load: 180.0,
        access_multiplier: 1.15,
      };

      const errors = repository.validateSettings(settings);
      expect(errors).toEqual([]);
    });

    it('should return multiple errors for multiple issues', () => {
      const settings = {
        gst: -0.5, // Invalid
        profit_first: {
          profit: -0.05, // Negative
          owner: 0.50,
          tax: 0.15,
          opex: 0.30,
        },
        overhead_multiplier: 0.5, // < 1.0
        deposit_options: [], // Empty
        default_deposit: 0, // Invalid
        rounding_increment: -10, // Negative
      };

      const errors = repository.validateSettings(settings);
      expect(errors.length).toBeGreaterThan(3);
      expect(errors).toContain('GST rate must be a number between 0 and 1');
      expect(errors).toContain(
        'All profit_first percentages must be positive',
      );
      expect(errors).toContain('Overhead multiplier must be a number >= 1.0');
      expect(errors).toContain('At least one deposit option is required');
    });
  });

  describe('Default Settings Structure', () => {
    it('should have all required fields', () => {
      const settings = repository.DEFAULT_SETTINGS;

      expect(settings).toHaveProperty('gst');
      expect(settings).toHaveProperty('profit_first');
      expect(settings.profit_first).toHaveProperty('profit');
      expect(settings.profit_first).toHaveProperty('owner');
      expect(settings.profit_first).toHaveProperty('tax');
      expect(settings.profit_first).toHaveProperty('opex');
      expect(settings).toHaveProperty('overhead_multiplier');
      expect(settings).toHaveProperty('deposit_options');
      expect(settings).toHaveProperty('default_deposit');
      expect(settings).toHaveProperty('rounding_increment');
      expect(settings).toHaveProperty('travel_cost_per_km');
      expect(settings).toHaveProperty('dumping_per_load');
      expect(settings).toHaveProperty('access_multiplier');
    });

    it('should have correct values for <$250K business', () => {
      const settings = repository.DEFAULT_SETTINGS;

      expect(settings.gst).toBe(0.10);
      expect(settings.profit_first.profit).toBe(0.05); // 5%
      expect(settings.profit_first.owner).toBe(0.50); // 50%
      expect(settings.profit_first.tax).toBe(0.15); // 15%
      expect(settings.profit_first.opex).toBe(0.30); // 30%
      expect(settings.overhead_multiplier).toBe(1.0);
      expect(settings.default_deposit).toBe(0.25); // 25%
      expect(settings.rounding_increment).toBe(10);
    });

    it('should pass validation with default values', () => {
      const errors = repository.validateSettings(repository.DEFAULT_SETTINGS);
      expect(errors).toEqual([]);
    });
  });
});
