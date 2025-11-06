/**
 * Calculation Service
 *
 * Core financial calculation engine using Profit-First methodology
 * Implements the formula from docs/financial-model.md
 *
 * Formula: Quote Price (ex GST) = Raw Materials Cost ÷ Operating Expenses %
 */

import * as settingsService from './settings.service.js';

/**
 * Calculate quote financials from raw materials cost
 *
 * @param {number} rawMaterialsCost - Total materials cost (sum of all jobs)
 * @param {Object} options - Calculation options
 * @param {number} [options.overheadMultiplier] - Optional overhead multiplier (default from settings)
 * @param {number} [options.gstRate] - Optional GST rate (default from settings)
 * @param {number} [options.roundingIncrement] - Optional rounding increment (default from settings)
 * @param {Object} [options.profitFirst] - Optional profit-first config (default from settings)
 * @returns {Promise<Object>} Financial breakdown
 */
export async function calculateQuoteFinancials(rawMaterialsCost, options = {}) {
  // Validate input
  if (typeof rawMaterialsCost !== 'number' || rawMaterialsCost < 0) {
    throw new Error('Raw materials cost must be a positive number');
  }

  // Get calculation parameters from settings (use overrides if provided)
  const params = await settingsService.getCalculationParameters();

  const profitFirst = options.profitFirst || params.profit_first;
  const gstRate = options.gstRate !== undefined ? options.gstRate : params.gst;
  const roundingIncrement =
    options.roundingIncrement !== undefined ? options.roundingIncrement : params.rounding_increment;
  const overheadMultiplier =
    options.overheadMultiplier !== undefined
      ? options.overheadMultiplier
      : params.overhead_multiplier;

  // Step 1: Calculate base price (ex GST) using Profit-First formula
  // Quote Price = Materials ÷ Opex %
  const directCost = rawMaterialsCost;
  const priceExGST = (directCost / profitFirst.opex) * overheadMultiplier;

  // Step 2: Calculate Profit-First breakdown
  const breakdown = {
    profit: priceExGST * profitFirst.profit,
    owner: priceExGST * profitFirst.owner,
    tax: priceExGST * profitFirst.tax,
    opex: priceExGST * profitFirst.opex, // Should equal directCost (before overhead)
  };

  // Verify breakdown sums to price (sanity check)
  const breakdownSum = breakdown.profit + breakdown.owner + breakdown.tax + breakdown.opex;
  if (Math.abs(breakdownSum - priceExGST) > 0.01) {
    console.warn(
      `Breakdown sum mismatch: ${breakdownSum} !== ${priceExGST} (diff: ${Math.abs(breakdownSum - priceExGST)})`,
    );
  }

  // Step 3: Add GST
  const gstAmount = priceExGST * gstRate;
  const totalIncGST = priceExGST + gstAmount;

  // Step 4: Round to nearest increment
  const roundedTotal = Math.round(totalIncGST / roundingIncrement) * roundingIncrement;

  // Step 5: Calculate deposit options
  const depositOptions = params.deposit_options.map((percentage) => ({
    percentage: percentage,
    amount: roundedTotal * percentage,
  }));

  const defaultDeposit = {
    percentage: params.default_deposit,
    amount: roundedTotal * params.default_deposit,
  };

  // Step 6: Check if deposit covers materials
  const depositWarning =
    defaultDeposit.amount < directCost
      ? `Deposit ($${defaultDeposit.amount.toFixed(2)}) is less than materials cost ($${directCost.toFixed(2)}). You may need upfront payment.`
      : null;

  return {
    // Input
    direct_cost: parseFloat(directCost.toFixed(2)),
    overhead_multiplier: overheadMultiplier,

    // Profit-First breakdown
    profit_first: {
      profit: parseFloat(breakdown.profit.toFixed(2)),
      owner: parseFloat(breakdown.owner.toFixed(2)),
      tax: parseFloat(breakdown.tax.toFixed(2)),
      opex: parseFloat(breakdown.opex.toFixed(2)),
    },

    // Pricing
    price_ex_gst: parseFloat(priceExGST.toFixed(2)),
    gst_rate: gstRate,
    gst_amount: parseFloat(gstAmount.toFixed(2)),
    total_inc_gst: parseFloat(totalIncGST.toFixed(2)),
    rounded_total: parseFloat(roundedTotal.toFixed(2)),

    // Deposit
    deposit: defaultDeposit,
    deposit_options: depositOptions,
    deposit_warning: depositWarning,
  };
}

/**
 * Calculate financials with access modifiers
 *
 * @param {number} rawMaterialsCost - Total materials cost
 * @param {Object} modifiers - Access modifiers
 * @param {boolean} [modifiers.tightAccess] - Apply tight access multiplier (1.1x)
 * @param {boolean} [modifiers.rockClause] - Add rock clause disclaimer
 * @param {Object} [options] - Additional calculation options
 * @returns {Promise<Object>} Financial breakdown with modifiers
 */
export async function calculateWithModifiers(rawMaterialsCost, modifiers = {}, options = {}) {
  const params = await settingsService.getCalculationParameters();

  // Calculate base financials
  const baseFinancials = await calculateQuoteFinancials(rawMaterialsCost, options);

  // Apply tight access multiplier if requested
  let finalTotal = baseFinancials.rounded_total;
  let accessMultiplier = 1.0;

  if (modifiers.tightAccess) {
    // Get access multiplier from settings or params
    accessMultiplier = params.access_multiplier || 1.1;
    finalTotal = baseFinancials.rounded_total * accessMultiplier;

    // Round again after applying multiplier
    const roundingIncrement =
      options.roundingIncrement !== undefined
        ? options.roundingIncrement
        : params.rounding_increment;
    finalTotal = Math.round(finalTotal / roundingIncrement) * roundingIncrement;
  }

  // Add rock clause disclaimer if requested
  const disclaimers = [];
  if (modifiers.rockClause) {
    disclaimers.push(
      'This quote assumes normal soil conditions. Additional charges may apply if rock is encountered during excavation.',
    );
  }

  return {
    ...baseFinancials,

    // Modifiers
    access_multiplier: accessMultiplier,
    tight_access: modifiers.tightAccess || false,
    rock_clause: modifiers.rockClause || false,

    // Final pricing (after modifiers)
    final_total: parseFloat(finalTotal.toFixed(2)),
    total_before_access: baseFinancials.rounded_total,

    // Disclaimers
    disclaimers: disclaimers.length > 0 ? disclaimers : null,
  };
}

/**
 * Calculate materials cost from jobs array
 *
 * @param {Array} jobs - Array of job objects
 * @param {Object} job.materials - Materials array
 * @param {number} job.materials[].totalCost - Total cost for material
 * @returns {number} Total materials cost
 */
export function calculateMaterialsCost(jobs) {
  if (!Array.isArray(jobs)) {
    throw new Error('Jobs must be an array');
  }

  let totalCost = 0;

  for (const job of jobs) {
    if (!job.materials || !Array.isArray(job.materials)) {
      continue;
    }

    for (const material of job.materials) {
      if (material.totalCost && typeof material.totalCost === 'number') {
        totalCost += material.totalCost;
      }
    }
  }

  return totalCost;
}

/**
 * Recalculate quote financials
 * Updates financials for an existing quote based on current jobs
 *
 * @param {Array} jobs - Quote's jobs
 * @param {Object} modifiers - Access modifiers
 * @param {Object} options - Calculation options
 * @returns {Promise<Object>} Updated financials
 */
export async function recalculateQuoteFinancials(jobs, modifiers = {}, options = {}) {
  const materialsCost = calculateMaterialsCost(jobs);
  return await calculateWithModifiers(materialsCost, modifiers, options);
}
