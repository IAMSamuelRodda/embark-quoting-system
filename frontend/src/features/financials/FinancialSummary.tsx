import { useState } from 'react';
import { ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

/**
 * Financial Summary Component
 *
 * Displays Profit-First financial breakdown for quotes
 * Features:
 * - Toggle to show/hide Profit-First allocation details
 * - Deposit calculator with 20%/25%/30% options
 * - Warning if deposit < materials cost
 * - Subtotal per job display
 *
 * Part of Epic 4: Financial Calculations (Feature 4.3)
 */

export interface ProfitFirstBreakdown {
  profit: number;
  owner: number;
  tax: number;
  opex: number;
}

export interface DepositOption {
  percentage: number;
  amount: number;
}

export interface FinancialData {
  quote_id: string;
  direct_cost: number;
  overhead_multiplier: number;
  profit_first: ProfitFirstBreakdown;
  price_ex_gst: number;
  gst_rate: number;
  gst_amount: number;
  total_inc_gst: number;
  rounded_total: number;
  deposit?: {
    percentage: number;
    amount: number;
  };
  deposit_options?: DepositOption[];
  deposit_warning?: string | null;
}

export interface Job {
  id: string;
  job_type: string;
  subtotal: number;
}

interface FinancialSummaryProps {
  financials: FinancialData;
  jobs: Job[];
  onDepositChange?: (percentage: number) => void;
}

export function FinancialSummary({ financials, jobs, onDepositChange }: FinancialSummaryProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [selectedDepositPercentage, setSelectedDepositPercentage] = useState(
    financials.deposit?.percentage || 0.25
  );

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
    }).format(amount);
  };

  // Format percentage
  const formatPercentage = (decimal: number) => {
    return `${(decimal * 100).toFixed(0)}%`;
  };

  // Calculate selected deposit amount
  const calculateDeposit = (percentage: number) => {
    return financials.rounded_total * percentage;
  };

  // Handle deposit selection
  const handleDepositChange = (percentage: number) => {
    setSelectedDepositPercentage(percentage);
    if (onDepositChange) {
      onDepositChange(percentage);
    }
  };

  // Determine if deposit warning should be shown
  const depositAmount = calculateDeposit(selectedDepositPercentage);
  const showDepositWarning = depositAmount < financials.direct_cost;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Financial Summary</h2>

      {/* Jobs Subtotal */}
      {jobs && jobs.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Job Breakdown</h3>
          <div className="space-y-2">
            {jobs.map((job, index) => (
              <div key={job.id} className="flex justify-between text-sm">
                <span className="text-gray-600">
                  Job {index + 1}: {job.job_type.replace('_', ' ').toUpperCase()}
                </span>
                <span className="font-medium text-gray-900">{formatCurrency(job.subtotal)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-200 mt-3 pt-3 flex justify-between text-sm font-medium">
            <span className="text-gray-700">Total Materials Cost:</span>
            <span className="text-gray-900">{formatCurrency(financials.direct_cost)}</span>
          </div>
        </div>
      )}

      {/* Profit-First Breakdown Toggle */}
      <div className="mb-6">
        <button
          onClick={() => setShowBreakdown(!showBreakdown)}
          className="flex items-center justify-between w-full py-2 text-sm font-medium text-primary-600 hover:text-primary-700"
        >
          <span>Profit-First Allocation</span>
          {showBreakdown ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>

        {showBreakdown && (
          <div className="mt-3 space-y-2 pl-4 border-l-2 border-primary-200">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Profit (5%):</span>
              <span className="font-medium text-gray-900">
                {formatCurrency(financials.profit_first.profit)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Owner Compensation (50%):</span>
              <span className="font-medium text-gray-900">
                {formatCurrency(financials.profit_first.owner)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax Reserve (15%):</span>
              <span className="font-medium text-gray-900">
                {formatCurrency(financials.profit_first.tax)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Operating Expenses (30%):</span>
              <span className="font-medium text-gray-900">
                {formatCurrency(financials.profit_first.opex)}
              </span>
            </div>
            <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between text-sm font-medium">
              <span className="text-gray-700">Quote Price (ex GST):</span>
              <span className="text-gray-900">{formatCurrency(financials.price_ex_gst)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Pricing Summary */}
      <div className="space-y-2 mb-6">
        <div className="flex justify-between">
          <span className="text-gray-700">Price (ex GST):</span>
          <span className="font-medium">{formatCurrency(financials.price_ex_gst)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">
            GST ({formatPercentage(financials.gst_rate)}):
          </span>
          <span className="text-gray-900">{formatCurrency(financials.gst_amount)}</span>
        </div>
        <div className="border-t border-gray-200 pt-2 mt-2">
          <div className="flex justify-between text-lg font-bold">
            <span className="text-gray-900">Total (inc GST):</span>
            <span className="text-primary-600">{formatCurrency(financials.rounded_total)}</span>
          </div>
        </div>
      </div>

      {/* Deposit Calculator */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Deposit Options</h3>
        <div className="flex gap-3 mb-4">
          {[0.20, 0.25, 0.30].map((percentage) => (
            <button
              key={percentage}
              onClick={() => handleDepositChange(percentage)}
              className={`flex-1 py-2 px-3 rounded-lg border-2 transition-colors ${
                selectedDepositPercentage === percentage
                  ? 'border-primary-500 bg-primary-50 text-primary-700 font-medium'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
              }`}
            >
              <div className="text-sm">{formatPercentage(percentage)}</div>
              <div className="text-xs mt-1">{formatCurrency(calculateDeposit(percentage))}</div>
            </button>
          ))}
        </div>

        {/* Deposit Warning */}
        {showDepositWarning && (
          <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium">Deposit below materials cost</p>
              <p className="text-xs mt-1">
                The {formatPercentage(selectedDepositPercentage)} deposit (
                {formatCurrency(depositAmount)}) is less than the materials cost (
                {formatCurrency(financials.direct_cost)}). Consider requesting upfront payment for
                materials.
              </p>
            </div>
          </div>
        )}

        {/* Selected Deposit Display */}
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-gray-700 font-medium">Selected Deposit:</span>
            <div className="text-right">
              <div className="text-lg font-bold text-primary-600">
                {formatCurrency(depositAmount)}
              </div>
              <div className="text-xs text-gray-600">
                {formatPercentage(selectedDepositPercentage)} of total
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overhead Multiplier Info (if not 1.0) */}
      {financials.overhead_multiplier !== 1.0 && (
        <div className="mt-4 text-xs text-gray-500 text-center">
          * Overhead multiplier: {financials.overhead_multiplier.toFixed(2)}x applied
        </div>
      )}
    </div>
  );
}
