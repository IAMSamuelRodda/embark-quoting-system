import { useState } from 'react';
import { Info } from 'lucide-react';

/**
 * Access Modifiers Component
 *
 * Provides UI controls for quote adjustments:
 * - Tight access multiplier (1.1x for difficult site access)
 * - Rock clause (adds disclaimer to quote PDF)
 * - Custom Profit-First percentage overrides
 *
 * Part of Epic 4: Financial Calculations (Feature 4.4)
 */

export interface AccessModifiersData {
  tightAccess: boolean;
  rockClause: boolean;
  customOverrides?: {
    profit?: number; // 0-1 decimal
    owner?: number;
    tax?: number;
    opex?: number;
  };
}

interface AccessModifiersProps {
  value: AccessModifiersData;
  onChange: (modifiers: AccessModifiersData) => void;
  disabled?: boolean;
}

export function AccessModifiers({ value, onChange, disabled = false }: AccessModifiersProps) {
  const [showCustom, setShowCustom] = useState(false);

  // Handle checkbox changes
  const handleTightAccessChange = (checked: boolean) => {
    onChange({
      ...value,
      tightAccess: checked,
    });
  };

  const handleRockClauseChange = (checked: boolean) => {
    onChange({
      ...value,
      rockClause: checked,
    });
  };

  // Handle custom percentage changes
  const handleCustomPercentageChange = (field: keyof NonNullable<AccessModifiersData['customOverrides']>, stringValue: string) => {
    const percentageValue = parseFloat(stringValue);
    if (isNaN(percentageValue)) {
      return;
    }

    // Convert percentage (0-100) to decimal (0-1)
    const decimalValue = percentageValue / 100;

    onChange({
      ...value,
      customOverrides: {
        ...value.customOverrides,
        [field]: decimalValue,
      },
    });
  };

  // Reset custom overrides
  const handleResetCustom = () => {
    onChange({
      ...value,
      customOverrides: undefined,
    });
    setShowCustom(false);
  };

  // Calculate total percentage (should equal 100%)
  const calculateTotal = () => {
    if (!value.customOverrides) return null;

    const { profit = 0.05, owner = 0.50, tax = 0.15, opex = 0.30 } = value.customOverrides;
    return ((profit + owner + tax + opex) * 100).toFixed(1);
  };

  const total = calculateTotal();
  const isValidTotal = total === '100.0';

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Quote Adjustments</h2>

      {/* Access Modifiers */}
      <div className="space-y-4 mb-6">
        {/* Tight Access */}
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="tightAccess"
            checked={value.tightAccess}
            onChange={(e) => handleTightAccessChange(e.target.checked)}
            disabled={disabled}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <div className="flex-1">
            <label htmlFor="tightAccess" className="block text-sm font-medium text-gray-700 cursor-pointer">
              Tight Access Site
            </label>
            <p className="text-xs text-gray-500 mt-1">
              Applies 1.1x multiplier to account for difficult access (narrow driveways, limited
              equipment access)
            </p>
          </div>
        </div>

        {/* Rock Clause */}
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="rockClause"
            checked={value.rockClause}
            onChange={(e) => handleRockClauseChange(e.target.checked)}
            disabled={disabled}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <div className="flex-1">
            <label htmlFor="rockClause" className="block text-sm font-medium text-gray-700 cursor-pointer">
              Rock Clause
            </label>
            <p className="text-xs text-gray-500 mt-1">
              Adds disclaimer: "This quote assumes normal soil conditions. Additional charges may
              apply if rock is encountered during excavation."
            </p>
          </div>
        </div>
      </div>

      {/* Custom Overrides */}
      <div className="border-t border-gray-200 pt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium text-gray-700">Custom Profit-First Allocation</h3>
            <p className="text-xs text-gray-500 mt-1">
              Override default percentages for this quote only
            </p>
          </div>
          {!showCustom ? (
            <button
              type="button"
              onClick={() => setShowCustom(true)}
              disabled={disabled}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium disabled:opacity-50"
            >
              Customize
            </button>
          ) : (
            <button
              type="button"
              onClick={handleResetCustom}
              disabled={disabled}
              className="text-sm text-gray-600 hover:text-gray-700 font-medium disabled:opacity-50"
            >
              Reset to Defaults
            </button>
          )}
        </div>

        {showCustom && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              {/* Profit */}
              <div>
                <label htmlFor="customProfit" className="block text-xs font-medium text-gray-700 mb-1">
                  Profit %
                </label>
                <input
                  type="number"
                  id="customProfit"
                  min="0"
                  max="100"
                  step="0.1"
                  value={((value.customOverrides?.profit || 0.05) * 100).toFixed(1)}
                  onChange={(e) => handleCustomPercentageChange('profit', e.target.value)}
                  disabled={disabled}
                  className="input-field text-sm"
                  placeholder="5.0"
                />
              </div>

              {/* Owner Compensation */}
              <div>
                <label htmlFor="customOwner" className="block text-xs font-medium text-gray-700 mb-1">
                  Owner Comp %
                </label>
                <input
                  type="number"
                  id="customOwner"
                  min="0"
                  max="100"
                  step="0.1"
                  value={((value.customOverrides?.owner || 0.50) * 100).toFixed(1)}
                  onChange={(e) => handleCustomPercentageChange('owner', e.target.value)}
                  disabled={disabled}
                  className="input-field text-sm"
                  placeholder="50.0"
                />
              </div>

              {/* Tax Reserve */}
              <div>
                <label htmlFor="customTax" className="block text-xs font-medium text-gray-700 mb-1">
                  Tax Reserve %
                </label>
                <input
                  type="number"
                  id="customTax"
                  min="0"
                  max="100"
                  step="0.1"
                  value={((value.customOverrides?.tax || 0.15) * 100).toFixed(1)}
                  onChange={(e) => handleCustomPercentageChange('tax', e.target.value)}
                  disabled={disabled}
                  className="input-field text-sm"
                  placeholder="15.0"
                />
              </div>

              {/* Operating Expenses */}
              <div>
                <label htmlFor="customOpex" className="block text-xs font-medium text-gray-700 mb-1">
                  Operating Exp %
                </label>
                <input
                  type="number"
                  id="customOpex"
                  min="0"
                  max="100"
                  step="0.1"
                  value={((value.customOverrides?.opex || 0.30) * 100).toFixed(1)}
                  onChange={(e) => handleCustomPercentageChange('opex', e.target.value)}
                  disabled={disabled}
                  className="input-field text-sm"
                  placeholder="30.0"
                />
              </div>
            </div>

            {/* Validation Message */}
            {total && (
              <div
                className={`flex items-start gap-2 p-3 rounded-lg ${
                  isValidTotal
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}
              >
                <Info
                  className={`h-4 w-4 flex-shrink-0 mt-0.5 ${
                    isValidTotal ? 'text-green-600' : 'text-red-600'
                  }`}
                />
                <div className="text-xs">
                  {isValidTotal ? (
                    <span className="text-green-800">
                      ✓ Total: {total}% (Valid)
                    </span>
                  ) : (
                    <span className="text-red-800">
                      ⚠ Total: {total}% (Must equal 100%)
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Help Text */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-blue-800">
                  <p className="font-medium mb-1">Profit-First Percentages</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Default ({"<"}$250K): 5/50/15/30</li>
                    <li>Growing ($250K-$500K): 10/40/15/35</li>
                    <li>Established ({">"}$500K): 15/30/15/40</li>
                  </ul>
                  <p className="mt-2">All percentages must sum to 100%</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
