# Epic 3: Job Types - Implementation Plan

**Status**: Ready to Start
**Timeline**: Weeks 5-6 (11 days estimated)
**Prerequisites**: ✅ Epic 0 (DevOps) Complete, ✅ Epic 2 (Quote Core) 83% Complete
**Dependencies**: Feature 2.6 (Basic Sync) in progress by another agent

---

## Overview

Epic 3 implements all 5 job type forms for the quoting system. Each job type has specific parameters, material calculations, and labour estimates.

**Deliverable**: All 5 job types functional with accurate material calculations

**Average Complexity**: 2.3/5.0 (46% - Low-Medium)

---

## 5 Features in Epic 3

### Feature 3.1: Job Schema & Multi-Job UI
- **Estimated**: 2 days
- **Complexity**: 2.5/5.0 (50% - Medium)
- **GitHub Issue**: #32

**Deliverables**:
- `jobs` table schema (quote_id, job_type, parameters JSONB, subtotal)
- Multi-job UI structure in QuoteEditor
- Add/remove job buttons
- Job type selector dropdown (5 types)
- Reorder jobs (drag-and-drop optional)

**Technical Details**:
- Database migration for `jobs` table
- Backend API endpoints: POST/PUT/DELETE `/api/quotes/:id/jobs/:jobId`
- Frontend components:
  - `features/quotes/JobsSection.tsx` (container)
  - `features/quotes/JobTypeSelector.tsx` (dropdown)
  - `features/quotes/JobCard.tsx` (individual job card)
- Zustand store updates for job management

**Testing**:
- Add multiple jobs to a quote
- Remove jobs
- Reorder jobs
- Save/load quote with multiple jobs

---

### Feature 3.2: Retaining Wall Form
- **Estimated**: 2 days
- **Complexity**: 2.2/5.0 (44% - Low)
- **GitHub Issue**: #33

**Deliverables**:
- `features/quotes/jobs/RetainingWallForm.tsx`
- Input fields:
  - Number of bays (integer)
  - Height dropdown: 200mm, 400mm, 600mm, 800mm, 1000mm
  - Length (meters)
- Checkboxes:
  - AG pipe (yes/no)
  - Orange plastic warning mesh (yes/no)
- Material calculations:
  - Blocks (based on bays × height)
  - Sand (m³)
  - Cement bags
  - AG pipe meters (if selected)
  - Orange plastic meters (if selected)
- Labour estimate (hours)

**Material Calculation Logic**:
```typescript
// Example pseudocode
blocks = bays * (height / 200) * blocks_per_bay
sand_m3 = length * width * height * sand_factor
cement_bags = sand_m3 * cement_ratio
```

**Testing**:
- Validate height dropdown only allows specified increments
- Verify material quantities match expected values
- Test AG pipe and orange plastic toggles

---

### Feature 3.3: Driveway Form
- **Estimated**: 2 days
- **Complexity**: 2.2/5.0 (44% - Low)
- **GitHub Issue**: #34

**Deliverables**:
- `features/quotes/jobs/DrivewayForm.tsx`
- Input fields:
  - Length (meters)
  - Width (meters)
  - Base thickness (default 200mm)
- Topping option:
  - Enable/disable toggle
  - Thickness (default 100mm if enabled)
  - Type dropdown: 20mm gravel, 14mm gravel, 10mm gravel
- Material calculations:
  - Road base (m³)
  - Gravel (m³ if topping enabled)
  - Compaction estimate

**Material Calculation Logic**:
```typescript
road_base_m3 = length * width * (base_thickness / 1000)
if (topping_enabled) {
  gravel_m3 = length * width * (topping_thickness / 1000)
}
```

**Testing**:
- Topping toggle enables/disables topping fields
- Calculations correct with and without topping
- Different gravel types don't affect volume calculation

---

### Feature 3.4: Trenching + Stormwater Forms
- **Estimated**: 3 days
- **Complexity**: 2.5/5.0 (50% - Medium)
- **GitHub Issue**: #35

**Deliverables**:
- `features/quotes/jobs/TrenchingForm.tsx`
  - Length (meters)
  - Width dropdown: 300mm, 600mm, 900mm
  - Depth (meters)
  - Stormwater integration checkbox
- `features/quotes/jobs/StormwaterForm.tsx`
  - Pipe length (meters)
  - Pipe type: 100mm PVC, 150mm PVC, 100mm Ag pipe
  - T-joints (count)
  - Elbows (count)
  - Downpipe adaptors (count)
- **Integration**: Stormwater form can auto-add Trenching job

**Material Calculations**:
```typescript
// Trenching
excavation_m3 = length * (width / 1000) * depth

// Stormwater
pipe_meters = length
fittings = t_joints + elbows + downpipe_adaptors
```

**Testing**:
- Integration: Adding stormwater with "needs trenching" checkbox auto-creates trenching job
- Edge case: Trenching without stormwater (manual dig)
- Material calculations for all pipe types

---

### Feature 3.5: Site Prep Form
- **Estimated**: 2 days
- **Complexity**: 2.3/5.0 (46% - Low-Medium)
- **GitHub Issue**: #36

**Deliverables**:
- `features/quotes/jobs/SitePrepForm.tsx`
- Input fields:
  - Area (m²)
  - Depth (meters)
  - Backfill type: road_base, paving_sand, none
- Dumping section:
  - Required? (yes/no)
  - Distance to dump (km)
- Supply distance (km)
- Cost inputs:
  - Labour cost per hour
  - Travel cost per km
  - Dumping cost per load

**Material/Cost Calculations**:
```typescript
excavation_m3 = area * depth
if (backfill_type !== 'none') {
  backfill_m3 = excavation_m3
}
if (dumping_required) {
  loads = Math.ceil(excavation_m3 / load_capacity)
  dumping_cost = loads * cost_per_load
  travel_cost = loads * distance_km * cost_per_km
}
```

**Testing**:
- Dumping calculations accurate
- Travel cost calculated correctly
- Backfill type selection changes material list

---

## Implementation Order

Recommended sequence:

1. **Feature 3.1** (Job Schema & Multi-Job UI) - **Must be first**
   - Establishes foundation for all other job type forms
   - Creates database schema
   - Sets up job management UI structure

2. **Feature 3.2** (Retaining Wall) - Simple, good warm-up
   - Straightforward form
   - No complex interactions
   - Good template for other forms

3. **Feature 3.3** (Driveway) - Similar complexity
   - Introduces conditional fields (topping toggle)
   - Tests form state management

4. **Feature 3.4** (Trenching + Stormwater) - Most complex
   - Two forms that interact
   - Tests cross-form communication
   - Save for when familiar with patterns

5. **Feature 3.5** (Site Prep) - Final polish
   - Cost calculations
   - Multiple conditional sections

---

## Shared Component Patterns

All job forms should share:

### Form Structure
```tsx
// features/quotes/jobs/[JobType]Form.tsx
export function RetainingWallForm({ jobId, initialData, onUpdate }: JobFormProps) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm();

  // Real-time calculation
  const watchAll = watch();
  useEffect(() => {
    const materials = calculateMaterials(watchAll);
    onUpdate({ parameters: watchAll, materials });
  }, [watchAll]);

  return (
    <form className="job-form">
      {/* Form fields */}
    </form>
  );
}
```

### Material Calculation Functions
```typescript
// features/quotes/jobs/calculations/retainingWall.ts
export function calculateRetainingWallMaterials(params: RetainingWallParams): Materials {
  return {
    blocks: calculateBlocks(params.bays, params.height),
    sand_m3: calculateSand(params.length, params.height),
    cement_bags: calculateCement(params.length, params.height),
    ag_pipe_m: params.hasAgPipe ? params.length : 0,
    orange_plastic_m: params.hasOrangePlastic ? params.length : 0,
  };
}
```

### Styling
- Tailwind CSS utility classes
- Consistent spacing: `space-y-4` for form sections
- Input fields: `input-field` class (from global styles)
- Labels: `text-sm font-medium text-gray-700`
- Form sections: `border rounded-lg p-4 bg-gray-50`

---

## Database Schema (Feature 3.1)

```sql
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  job_type VARCHAR(50) NOT NULL CHECK (job_type IN (
    'retaining_wall',
    'driveway',
    'trenching',
    'stormwater',
    'site_prep'
  )),
  parameters JSONB NOT NULL DEFAULT '{}',
  materials JSONB,
  subtotal DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_jobs_quote_id ON jobs(quote_id);
```

**Drizzle Schema**:
```typescript
// backend/database/schema/jobs.ts
export const jobs = pgTable('jobs', {
  id: uuid('id').primaryKey().defaultRandom(),
  quote_id: uuid('quote_id').notNull().references(() => quotes.id, { onDelete: 'cascade' }),
  job_type: varchar('job_type', { length: 50 }).notNull(),
  parameters: jsonb('parameters').notNull().default({}),
  materials: jsonb('materials'),
  subtotal: decimal('subtotal', { precision: 10, scale: 2 }),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});
```

---

## API Endpoints (Feature 3.1)

```
POST   /api/quotes/:quoteId/jobs          # Create job
GET    /api/quotes/:quoteId/jobs          # List jobs for quote
GET    /api/quotes/:quoteId/jobs/:jobId   # Get job details
PUT    /api/quotes/:quoteId/jobs/:jobId   # Update job
DELETE /api/quotes/:quoteId/jobs/:jobId   # Delete job
```

**Request/Response Examples**:
```json
// POST /api/quotes/abc123/jobs
{
  "job_type": "retaining_wall",
  "parameters": {
    "bays": 5,
    "height": 600,
    "length": 10,
    "hasAgPipe": true,
    "hasOrangePlastic": false
  }
}

// Response
{
  "success": true,
  "data": {
    "id": "job-uuid",
    "quote_id": "abc123",
    "job_type": "retaining_wall",
    "parameters": { ... },
    "materials": {
      "blocks": 150,
      "sand_m3": 3.5,
      "cement_bags": 12,
      "ag_pipe_m": 10
    },
    "subtotal": 2450.00
  }
}
```

---

## TypeScript Types

```typescript
// frontend/src/shared/types/models.ts
export const JobType = {
  RETAINING_WALL: 'retaining_wall',
  DRIVEWAY: 'driveway',
  TRENCHING: 'trenching',
  STORMWATER: 'stormwater',
  SITE_PREP: 'site_prep',
} as const;

export type JobType = (typeof JobType)[keyof typeof JobType];

export interface Job {
  id: string;
  quote_id: string;
  job_type: JobType;
  parameters: Record<string, unknown>;
  materials?: Record<string, number>;
  subtotal?: number;
  created_at?: string;
  updated_at?: string;
}

// Specific parameter types
export interface RetainingWallParams {
  bays: number;
  height: 200 | 400 | 600 | 800 | 1000;
  length: number;
  hasAgPipe: boolean;
  hasOrangePlastic: boolean;
}

export interface DrivewayParams {
  length: number;
  width: number;
  base_thickness: number;
  topping_enabled: boolean;
  topping_thickness?: number;
  topping_type?: '20mm' | '14mm' | '10mm';
}

// ... other param types
```

---

## Testing Requirements

Each feature must have:

1. **Unit Tests** (Vitest)
   - Material calculation functions
   - Edge cases (zero values, max values)
   - Conditional logic (toggles, dropdowns)

2. **Component Tests**
   - Form renders correctly
   - Validation works
   - Real-time calculations update

3. **Integration Tests** (optional but recommended)
   - Full quote with multiple jobs saves/loads
   - Job deletion updates quote total

**Example Test**:
```typescript
// features/quotes/jobs/calculations/retainingWall.test.ts
describe('Retaining Wall Calculations', () => {
  it('calculates blocks correctly for 600mm height', () => {
    const materials = calculateRetainingWallMaterials({
      bays: 5,
      height: 600,
      length: 10,
      hasAgPipe: false,
      hasOrangePlastic: false,
    });

    expect(materials.blocks).toBe(150); // 5 bays * 3 courses * 10 blocks
  });

  it('includes AG pipe when enabled', () => {
    const materials = calculateRetainingWallMaterials({
      bays: 5,
      height: 600,
      length: 10,
      hasAgPipe: true,
      hasOrangePlastic: false,
    });

    expect(materials.ag_pipe_m).toBe(10);
  });
});
```

---

## Quality Gates

Before closing each feature:

1. ✅ ESLint passes with 0 errors
2. ✅ All unit tests passing
3. ✅ Prettier formatting applied
4. ✅ Material calculations verified against manual calculations
5. ✅ Form validation working (required fields, number ranges)
6. ✅ Real-time calculation updates as user types
7. ✅ Data persists to backend API
8. ✅ TypeScript types defined and used
9. ✅ Commit linked to GitHub issue (#32-#36)

---

## Material Price Sheet (Reference)

These will be used in Epic 4 (Financial Calculations), but useful context now:

| Material | Unit | Typical Price |
|----------|------|---------------|
| Concrete Block (200mm) | each | $2.50 |
| Sand | m³ | $45 |
| Cement (20kg bag) | bag | $12 |
| Road Base | m³ | $38 |
| 20mm Gravel | m³ | $55 |
| 14mm Gravel | m³ | $58 |
| 100mm PVC Pipe | meter | $8.50 |
| 150mm PVC Pipe | meter | $12.00 |
| AG Pipe | meter | $6.50 |
| T-Joint | each | $4.50 |
| Elbow | each | $3.50 |

**Note**: Epic 3 calculates quantities only. Epic 4 applies prices and Profit-First methodology.

---

## Files to Create

### Feature 3.1 (Job Schema & Multi-Job UI)
- `backend/database/schema/jobs.ts`
- `backend/database/migrations/003_create_jobs_table.sql`
- `backend/src/features/jobs/jobs.repository.ts`
- `backend/src/features/jobs/jobs.service.ts`
- `backend/src/features/jobs/jobs.controller.ts`
- `backend/src/features/jobs/jobs.routes.ts`
- `frontend/src/features/quotes/JobsSection.tsx`
- `frontend/src/features/quotes/JobCard.tsx`
- `frontend/src/features/quotes/JobTypeSelector.tsx`

### Features 3.2-3.5 (Job Forms)
- `frontend/src/features/quotes/jobs/RetainingWallForm.tsx`
- `frontend/src/features/quotes/jobs/DrivewayForm.tsx`
- `frontend/src/features/quotes/jobs/TrenchingForm.tsx`
- `frontend/src/features/quotes/jobs/StormwaterForm.tsx`
- `frontend/src/features/quotes/jobs/SitePrepForm.tsx`
- `frontend/src/features/quotes/jobs/calculations/retainingWall.ts` (+ tests)
- `frontend/src/features/quotes/jobs/calculations/driveway.ts` (+ tests)
- `frontend/src/features/quotes/jobs/calculations/trenching.ts` (+ tests)
- `frontend/src/features/quotes/jobs/calculations/stormwater.ts` (+ tests)
- `frontend/src/features/quotes/jobs/calculations/sitePrep.ts` (+ tests)

---

## Success Criteria

Epic 3 is complete when:

1. ✅ User can add multiple jobs to a quote
2. ✅ All 5 job types have functional forms
3. ✅ Material quantities calculate correctly for each job type
4. ✅ Jobs persist to database and sync to IndexedDB
5. ✅ Quote subtotal updates as jobs are added/modified
6. ✅ All unit tests passing (>20 tests across all job calculations)
7. ✅ ESLint shows 0 errors
8. ✅ All 5 GitHub issues (#32-#36) closed

**Estimated Total Time**: 11 days (2 + 2 + 2 + 3 + 2)

---

## Next Steps After Epic 3

**Epic 4: Financial Calculations** (Week 7)
- Apply Profit-First methodology to job subtotals
- Calculate quote total with GST
- Financial breakdown UI
- Price management

**Epic 5: Sync Engine** (Weeks 8-10)
- Implement conflict resolution (spike already complete ✅)
- Version tracking
- Offline queue
- Multi-device sync

---

## Questions/Clarifications

If unsure about:
- **Material calculation formulas**: See `docs/financial-model.md` and BLUEPRINT.yaml
- **Job type specifications**: See BLUEPRINT.yaml → `requirements.job_types`
- **UI patterns**: Follow existing QuoteEditor patterns
- **Vertical slice architecture**: Each job form is self-contained in `features/quotes/jobs/`

**For real-time help**: The SPIKE for conflict resolution (#43) is already complete - see `docs/spike-conflict-poc.js` for patterns on handling complex state logic.

---

**Document Created**: 2025-11-06
**Author**: Claude Code (Feature 0.4 completion)
**Status**: Ready for Epic 3 implementation
