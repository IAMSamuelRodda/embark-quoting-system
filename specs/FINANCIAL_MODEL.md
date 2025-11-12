# Financial Model: Profit-First Calculation

## Overview

The Embark Quoting System uses a **Profit-First financial model** to calculate quote prices. This ensures profitability is built into every quote rather than being an afterthought.

## Target Allocation Percentages (TAPs)

For businesses under $250K annual revenue:

| Allocation | Percentage |
|-----------|-----------|
| **Profit** | 5% |
| **Owner's Pay** | 50% |
| **Tax** | 15% |
| **Operating Expenses (Opex)** | 30% |
| **Total** | 100% |

**Source**: Profit First methodology by Mike Michalowicz

---

## Calculation Flow

### Step 1: Calculate Raw Materials Cost

Sum all materials needed for the job(s):
- Blocks, sand, cement (retaining walls)
- Road base, gravel (driveways)
- Pipe, fittings (stormwater/trenching)
- Backfill materials (site prep)
- Dumping costs
- Travel costs (per km rate × distance)

**Example**:
- Retaining wall materials: $800
- Travel (50km × $2/km): $100
- **Total Raw Materials**: $900

---

### Step 2: Apply Profit-First Model

The Operating Expenses allocation (30%) **must cover** the raw materials cost.

**Formula**:
```
Quote Price (ex GST) = Raw Materials Cost ÷ Operating Expenses %
Quote Price (ex GST) = Raw Materials Cost ÷ 0.30
```

**Example**:
```
Quote Price (ex GST) = $900 ÷ 0.30 = $3,000
```

This automatically allocates:
- **Profit (5%)**: $3,000 × 0.05 = $150
- **Owner's Pay (50%)**: $3,000 × 0.50 = $1,500
- **Tax (15%)**: $3,000 × 0.15 = $450
- **Operating Expenses (30%)**: $3,000 × 0.30 = $900 ← **Covers materials**

---

### Step 3: Add GST

```
GST Amount = Quote Price (ex GST) × GST Rate
GST Amount = $3,000 × 0.10 = $300

Total Inc GST = $3,000 + $300 = $3,300
```

---

### Step 4: Round to Nearest Increment

Round to nearest $10 (configurable):
```
Final Quote Price = $3,300 (already rounded)
```

---

## Complete Calculation Example

**Job**: Retaining wall (10 bays, 600mm height, 15m length)

### Materials Breakdown
- Blocks (120 units @ $5): $600
- Sand (2m³ @ $50): $100
- Cement (10 bags @ $10): $100
- Ag pipe (15m @ $3): $45
- Orange plastic (15m @ $1): $15
- Travel (50km @ $2/km): $100
- **Total Raw Materials**: $960

### Profit-First Calculation
```
Quote Price (ex GST) = $960 ÷ 0.30 = $3,200

Breakdown:
- Profit (5%): $160
- Owner's Pay (50%): $1,600
- Tax (15%): $480
- Opex (30%): $960 ← Covers materials

GST (10%): $320
Total Inc GST: $3,520
Rounded: $3,520
```

### Deposit (25%)
```
Deposit = $3,520 × 0.25 = $880
```

**Warning**: If deposit ($880) < materials ($960), flag to user that deposit won't cover materials upfront.

---

## Labour Costs

Labour is **NOT** a separate line item in this model. Labour cost is covered by the **Owner's Pay** allocation (50%).

**Rationale**:
- Owner's Pay (50% = $1,600 in example) compensates the owner/operator for their work
- This ensures the business owner is paid even if the job takes longer than expected
- Profit (5%) is separate from Owner's Pay

**If contracted labour is required** (subcontractors):
- Add contracted labour cost to Raw Materials
- The 30% Opex allocation will increase proportionally

---

## Why Configurable (Not Hardcoded)

The system makes all financial parameters configurable:

### Configurable Parameters
1. **Profit-First Percentages** (profit, owner, tax, opex)
   - Current: 5/50/15/30
   - May change as business grows (TAPs scale with revenue)

2. **GST Rate**
   - Current: 10%
   - May change with tax law updates

3. **Overhead Multiplier**
   - Optional additional markup (e.g., 1.15x for complexity)

4. **Deposit Options**
   - Current: 20%, 25%, 30%
   - Configurable per quote or globally

5. **Rounding Increment**
   - Current: $10
   - May prefer $50 or $100 for larger quotes

6. **Travel/Dumping Rates**
   - Per km rate: $2/km (example)
   - Per load dumping: varies by distance

### Admin Configuration
Admins can update defaults in the **Price Management** section:
- Navigate to Settings → Price Defaults
- Update Profit-First percentages
- Changes apply to **new quotes only** (existing quotes locked)

---

## Access Modifiers

### Tight Access Multiplier (1.1x)
For difficult-to-access sites, apply a 1.1× multiplier to the final price:

```
Standard Quote: $3,520
Tight Access Quote: $3,520 × 1.1 = $3,872
Rounded: $3,870
```

### Rock Clause
If rock clause is enabled, a disclaimer is added to the quote PDF:
> "This quote assumes normal soil conditions. Additional charges may apply if rock is encountered during excavation."

---

## Historical Context

### Original Plan (Incorrect)
The initial plan document specified:
- Profit: 10%
- Owner: 30%
- Tax: 15%
- Opex: 45%

### Corrected Model (2025-11-03)
Updated to actual Profit-First methodology for businesses under $250K:
- Profit: **5%** (not 10%)
- Owner's Pay: **50%** (not 30%)
- Tax: 15% (unchanged)
- Opex: **30%** (not 45%)

**Rationale**: Higher Owner's Pay ensures sustainable owner compensation, especially for small businesses where the owner is the primary worker.

---

## Revenue Tiers (Future)

As the business grows, TAPs may need adjustment:

| Annual Revenue | Profit | Owner | Tax | Opex |
|---------------|--------|-------|-----|------|
| **<$250K** | 5% | 50% | 15% | 30% |
| **$250K-$500K** | 10% | 40% | 15% | 35% |
| **$500K-$1M** | 15% | 30% | 15% | 40% |
| **>$1M** | 20% | 20% | 15% | 45% |

**Note**: These are example tiers. The system supports configuring any percentages.

---

## Implementation Notes

### Database Schema
```sql
-- price_sheets table
CREATE TABLE price_sheets (
  id UUID PRIMARY KEY,
  version INTEGER,
  defaults JSONB,  -- Contains profit_first percentages
  created_at TIMESTAMP
);

-- Example defaults JSONB
{
  "gst": 0.10,
  "profit_first": {
    "profit": 0.05,
    "owner": 0.50,
    "tax": 0.15,
    "opex": 0.30
  },
  "overhead_multiplier": 1.0,
  "deposit_options": [0.20, 0.25, 0.30],
  "default_deposit": 0.25,
  "rounding_increment": 10,
  "travel_cost_per_km": 2.00,
  "dumping_per_load": 150.00
}
```

### Calculation Engine (TypeScript)
```typescript
// features/quotes/quoteCalculations.ts

interface ProfitFirstConfig {
  profit: number;    // 0.05
  owner: number;     // 0.50
  tax: number;       // 0.15
  opex: number;      // 0.30
}

function calculateQuotePrice(
  rawMaterialsCost: number,
  config: ProfitFirstConfig,
  gstRate: number = 0.10,
  roundingIncrement: number = 10
): QuoteFinancials {
  // Step 1: Calculate price ex GST
  const priceExGST = rawMaterialsCost / config.opex;

  // Step 2: Profit-First breakdown
  const breakdown = {
    profit: priceExGST * config.profit,
    owner: priceExGST * config.owner,
    tax: priceExGST * config.tax,
    opex: priceExGST * config.opex,  // Should equal rawMaterialsCost
  };

  // Step 3: Add GST
  const gstAmount = priceExGST * gstRate;
  const totalIncGST = priceExGST + gstAmount;

  // Step 4: Round
  const roundedTotal = Math.round(totalIncGST / roundingIncrement) * roundingIncrement;

  return {
    directCost: rawMaterialsCost,
    priceExGST,
    breakdown,
    gstRate,
    gstAmount,
    totalIncGST,
    roundedTotal,
  };
}
```

---

## References

- **Profit First**: Mike Michalowicz (book)
- **Target Allocation Percentages**: Profit First Chapter 4
- **Implementation**: `/specs/BLUEPRINT.yaml` (Phase 4)
- **Admin UI**: `features/prices/DefaultsEditor.tsx`
- **Calculation Engine**: `features/quotes/quoteCalculations.ts`

---

## Change Log

| Date | Change | Reason |
|------|--------|--------|
| 2025-11-03 | Initial documentation | Capture corrected financial model from planning session |
| 2025-11-03 | Updated percentages from 10/30/15/45 to 5/50/15/30 | Align with Profit-First methodology for <$250K businesses |
