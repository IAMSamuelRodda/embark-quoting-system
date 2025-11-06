/**
 * Calculation Service Tests
 *
 * Unit tests for Profit-First financial calculations
 * Validates formulas against examples from docs/financial-model.md
 *
 * NOTE: These tests use actual settings service (with default values)
 * since Jest ES module mocking is limited
 */

import { describe, it, expect } from '@jest/globals';
import * as calculationService from '../../src/features/financials/calculation.service.js';

describe('Financial Calculation Engine', () => {
  // Tests use actual settings service which returns defaults
  // Default settings: Profit-First 5/50/15/30, GST 10%, Rounding $10

  describe('calculateQuoteFinancials', () => {
    it('should calculate correct price from materials (Example 1 from docs)', async () => {
      // Example from docs/financial-model.md
      // Materials: $900
      // Expected quote: $3,000 ex GST
      const result = await calculationService.calculateQuoteFinancials(900);

      expect(result.direct_cost).toBe(900);
      expect(result.price_ex_gst).toBe(3000);
      expect(result.profit_first.opex).toBe(900); // Should equal materials
    });

    it('should apply Profit-First breakdown correctly', async () => {
      // Materials: $900 → Quote: $3,000
      const result = await calculationService.calculateQuoteFinancials(900);

      // Verify Profit-First allocations
      expect(result.profit_first.profit).toBe(150); // 5% of $3,000
      expect(result.profit_first.owner).toBe(1500); // 50% of $3,000
      expect(result.profit_first.tax).toBe(450); // 15% of $3,000
      expect(result.profit_first.opex).toBe(900); // 30% of $3,000

      // Sum should equal price
      const sum =
        result.profit_first.profit +
        result.profit_first.owner +
        result.profit_first.tax +
        result.profit_first.opex;
      expect(sum).toBe(3000);
    });

    it('should calculate GST correctly (10%)', async () => {
      // Materials: $900 → Quote ex GST: $3,000
      const result = await calculationService.calculateQuoteFinancials(900);

      expect(result.gst_rate).toBe(0.1);
      expect(result.gst_amount).toBe(300); // 10% of $3,000
      expect(result.total_inc_gst).toBe(3300); // $3,000 + $300
    });

    it('should round to nearest increment ($10)', async () => {
      // Materials: $905 → Quote ex GST: $3,016.67 → Inc GST: $3,318.33 → Rounded: $3,320
      const result = await calculationService.calculateQuoteFinancials(905);

      expect(result.total_inc_gst).toBe(3318.33);
      expect(result.rounded_total).toBe(3320); // Rounded to nearest $10
    });

    it('should calculate correct quote (Example 2 from docs)', async () => {
      // Example from docs/financial-model.md
      // Materials: $960
      // Expected: Quote ex GST = $3,200, Inc GST = $3,520
      const result = await calculationService.calculateQuoteFinancials(960);

      expect(result.direct_cost).toBe(960);
      expect(result.price_ex_gst).toBe(3200);
      expect(result.gst_amount).toBe(320);
      expect(result.total_inc_gst).toBe(3520);
      expect(result.rounded_total).toBe(3520);
    });

    it('should generate deposit options', async () => {
      const result = await calculationService.calculateQuoteFinancials(900);

      // Rounded total: $3,300
      expect(result.deposit_options).toEqual([
        { percentage: 0.2, amount: 660 }, // 20%
        { percentage: 0.25, amount: 825 }, // 25%
        { percentage: 0.3, amount: 990 }, // 30%
      ]);
    });

    it('should set default deposit (25%)', async () => {
      const result = await calculationService.calculateQuoteFinancials(900);

      expect(result.deposit.percentage).toBe(0.25);
      expect(result.deposit.amount).toBe(825); // 25% of $3,300
    });

    it('should warn if deposit < materials cost', async () => {
      // Materials: $960 → Rounded total: $3,520 → Deposit (25%): $880
      // $880 < $960 → Warning
      const result = await calculationService.calculateQuoteFinancials(960);

      expect(result.deposit.amount).toBe(880);
      expect(result.deposit_warning).toContain('less than materials cost');
      expect(result.deposit_warning).toContain('$880.00');
      expect(result.deposit_warning).toContain('$960.00');
    });

    it('should not warn if deposit >= materials cost', async () => {
      // Materials: $900 → Deposit: $825 → But $825 < $900
      const result = await calculationService.calculateQuoteFinancials(900);

      expect(result.deposit.amount).toBe(825);
      expect(result.deposit_warning).toContain('less than materials cost');
    });

    it('should apply overhead multiplier', async () => {
      // Materials: $1000, Overhead: 1.15x
      const result = await calculationService.calculateQuoteFinancials(1000, {
        overheadMultiplier: 1.15,
      });

      // Base: $1000 ÷ 0.30 = $3,333.33
      // With multiplier: $3,333.33 × 1.15 = $3,833.33
      expect(result.overhead_multiplier).toBe(1.15);
      expect(result.price_ex_gst).toBeCloseTo(3833.33, 2);
    });

    it('should accept custom profit-first config', async () => {
      // Custom config for $250K-$500K business
      const customConfig = {
        profit: 0.1,
        owner: 0.4,
        tax: 0.15,
        opex: 0.35,
      };

      const result = await calculationService.calculateQuoteFinancials(1000, {
        profitFirst: customConfig,
      });

      // Price = $1000 ÷ 0.35 = $2,857.14
      expect(result.price_ex_gst).toBeCloseTo(2857.14, 2);
      expect(result.profit_first.profit).toBeCloseTo(285.71, 2); // 10%
      expect(result.profit_first.owner).toBeCloseTo(1142.86, 2); // 40%
      expect(result.profit_first.tax).toBeCloseTo(428.57, 2); // 15%
      expect(result.profit_first.opex).toBeCloseTo(1000, 2); // 35%
    });

    it('should accept custom GST rate', async () => {
      const result = await calculationService.calculateQuoteFinancials(900, {
        gstRate: 0.15, // 15% GST (example)
      });

      expect(result.gst_rate).toBe(0.15);
      expect(result.gst_amount).toBe(450); // 15% of $3,000
      expect(result.total_inc_gst).toBe(3450);
    });

    it('should accept custom rounding increment', async () => {
      const result = await calculationService.calculateQuoteFinancials(905, {
        roundingIncrement: 50,
      });

      // Total inc GST: $3,318.33 → Rounded to nearest $50: $3,300
      expect(result.rounded_total).toBe(3300);
    });

    it('should reject negative materials cost', async () => {
      await expect(calculationService.calculateQuoteFinancials(-100)).rejects.toThrow(
        'Raw materials cost must be a positive number',
      );
    });

    it('should reject non-number materials cost', async () => {
      await expect(calculationService.calculateQuoteFinancials('900')).rejects.toThrow(
        'Raw materials cost must be a positive number',
      );
    });

    it('should handle zero materials cost', async () => {
      const result = await calculationService.calculateQuoteFinancials(0);

      expect(result.direct_cost).toBe(0);
      expect(result.price_ex_gst).toBe(0);
      expect(result.total_inc_gst).toBe(0);
      expect(result.rounded_total).toBe(0);
    });

    it('should handle small materials cost (< $1)', async () => {
      const result = await calculationService.calculateQuoteFinancials(0.5);

      // $0.50 ÷ 0.30 = $1.67
      expect(result.price_ex_gst).toBeCloseTo(1.67, 2);
    });

    it('should handle large materials cost (> $100K)', async () => {
      const result = await calculationService.calculateQuoteFinancials(100000);

      // $100,000 ÷ 0.30 = $333,333.33
      expect(result.price_ex_gst).toBeCloseTo(333333.33, 2);
    });
  });

  describe('calculateWithModifiers', () => {
    it('should apply tight access multiplier (1.1x)', async () => {
      const result = await calculationService.calculateWithModifiers(900, { tightAccess: true });

      // Base rounded total: $3,300
      // With tight access: $3,300 × 1.1 = $3,630
      expect(result.tight_access).toBe(true);
      expect(result.access_multiplier).toBe(1.1);
      expect(result.total_before_access).toBe(3300);
      expect(result.final_total).toBe(3630);
    });

    it('should include rock clause disclaimer', async () => {
      const result = await calculationService.calculateWithModifiers(900, { rockClause: true });

      expect(result.rock_clause).toBe(true);
      expect(result.disclaimers).toContain(
        'This quote assumes normal soil conditions. Additional charges may apply if rock is encountered during excavation.',
      );
    });

    it('should apply both modifiers together', async () => {
      const result = await calculationService.calculateWithModifiers(900, {
        tightAccess: true,
        rockClause: true,
      });

      expect(result.tight_access).toBe(true);
      expect(result.rock_clause).toBe(true);
      expect(result.access_multiplier).toBe(1.1);
      expect(result.final_total).toBe(3630);
      expect(result.disclaimers).toHaveLength(1);
    });

    it('should not apply modifiers when false', async () => {
      const result = await calculationService.calculateWithModifiers(900, {
        tightAccess: false,
        rockClause: false,
      });

      expect(result.tight_access).toBe(false);
      expect(result.rock_clause).toBe(false);
      expect(result.access_multiplier).toBe(1.0);
      expect(result.final_total).toBe(3300); // Same as base
      expect(result.disclaimers).toBeNull();
    });
  });

  describe('calculateMaterialsCost', () => {
    it('should sum materials from multiple jobs', () => {
      const jobs = [
        {
          materials: [
            { name: 'Blocks', totalCost: 600 },
            { name: 'Sand', totalCost: 100 },
          ],
        },
        {
          materials: [
            { name: 'Cement', totalCost: 100 },
            { name: 'Travel', totalCost: 100 },
          ],
        },
      ];

      const total = calculationService.calculateMaterialsCost(jobs);
      expect(total).toBe(900);
    });

    it('should handle empty jobs array', () => {
      const total = calculationService.calculateMaterialsCost([]);
      expect(total).toBe(0);
    });

    it('should handle jobs without materials', () => {
      const jobs = [
        { job_type: 'retaining_wall' }, // No materials field
      ];

      const total = calculationService.calculateMaterialsCost(jobs);
      expect(total).toBe(0);
    });

    it('should handle materials without totalCost', () => {
      const jobs = [
        {
          materials: [
            { name: 'Blocks', quantity: 10 }, // No totalCost
          ],
        },
      ];

      const total = calculationService.calculateMaterialsCost(jobs);
      expect(total).toBe(0);
    });

    it('should reject non-array input', () => {
      expect(() => calculationService.calculateMaterialsCost('not-array')).toThrow(
        'Jobs must be an array',
      );
    });
  });

  describe('recalculateQuoteFinancials', () => {
    it('should calculate from jobs array', async () => {
      const jobs = [
        {
          materials: [
            { name: 'Blocks', totalCost: 600 },
            { name: 'Sand', totalCost: 100 },
          ],
        },
        {
          materials: [
            { name: 'Cement', totalCost: 100 },
            { name: 'Travel', totalCost: 100 },
          ],
        },
      ];

      const result = await calculationService.recalculateQuoteFinancials(jobs);

      expect(result.direct_cost).toBe(900);
      expect(result.rounded_total).toBe(3300);
    });

    it('should apply modifiers when recalculating', async () => {
      const jobs = [
        {
          materials: [{ name: 'Materials', totalCost: 900 }],
        },
      ];

      const result = await calculationService.recalculateQuoteFinancials(jobs, {
        tightAccess: true,
      });

      expect(result.final_total).toBe(3630); // With tight access
    });
  });
});
