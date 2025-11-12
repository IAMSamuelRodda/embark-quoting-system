# Epic 5 Refinements Post-SPIKE (Feature 5.0)

**Date**: 2025-11-04
**Context**: SPIKE Feature 5.0 completed successfully, reducing uncertainty from 4/5 → 2/5
**Validation**: All Epic 5 features assessed with `improving-plans` skill - all PROCEED (≤3.0 composite)

---

## Assessment Summary

| Feature | Composite Score | Normalized | Action | Notes |
|---------|----------------|------------|--------|-------|
| 5.1: Sync Queue Manager | 2.5 | 50% | ✅ PROCEED | No changes needed |
| 5.2: Version Tracking | 2.7 | 53% | 🔧 UPDATE | Need version vectors |
| 5.3: Conflict Detection | 2.4 | 48% | 🔧 UPDATE | Add helper functions |
| 5.4: Auto-Merge | 2.8 | 57% | ✅ PROCEED | No changes needed |
| 5.5: Manual Conflict Resolution UI | 2.5 | 50% | ✅ PROCEED | No changes needed |
| 5.6: Sync Testing | 2.5 | 50% | ✅ PROCEED | No changes needed |

**Overall**: Plan is well-structured, only needs minor refinements based on SPIKE findings.

---

## Proposed Changes

### 1. **Feature 5.2: Version Tracking** (UPDATE)

#### Current Deliverables (BLUEPRINT.yaml lines 1033-1041):
```yaml
deliverables:
  - quote_versions table
  - Increment version on every update
  - Store full quote snapshots (JSONB)
  - Backend store versions on PUT /quotes/:id
  - Frontend track local version
```

#### Proposed Refinements:
```yaml
deliverables:
  - quote_versions table with versionVector JSONB field
  - Increment versionVector[deviceId] on every local update
  - Store full quote snapshots (JSONB)
  - Backend store versions on PUT /quotes/:id
  - Frontend track local versionVector in IndexedDB
  - Helper functions: mergeVersionVectors(v1, v2)
```

**Reason**: SPIKE proved we're using **version vectors** (per-device counters), not simple integer versions.

**Database Schema Addition**:
```sql
ALTER TABLE quote_versions
ADD COLUMN version_vector JSONB DEFAULT '{}';

-- Example value: {"device-A": 5, "device-B": 3, "device-C": 1}
```

---

### 2. **Feature 5.3: Conflict Detection** (ADD HELPER FUNCTIONS)

#### Current: Task 5.3.1 - Version Comparison (lines 1048-1066)
```yaml
deliverables:
  - Compare local.version vs remote.version
  - Flag if versions diverged
```

#### Proposed Refinements:
```yaml
deliverables:
  - detectConflict(localVector, remoteVector) function
  - hasGreaterVersion(v1, v2) helper
  - areVectorsEqual(v1, v2) helper
  - Flag concurrent edits (neither vector strictly newer)
testing:
  - Scenario 1: Local newer (no conflict)
  - Scenario 2: Remote newer (no conflict)
  - Scenario 3: Concurrent edits (CONFLICT)
```

**Implementation Reference**: See `docs/spike-conflict-poc.js` lines 65-94 for proven algorithm.

---

### 3. **NEW TASK: Add Version Vector Helper Functions** (OPTIONAL BUT RECOMMENDED)

Create a new subtask under Feature 5.2 or 5.3:

```yaml
task_5_2_1:
  name: Version Vector Helper Functions
  complexity:
    composite: 1.8
    normalized: 36%
    level: low
    dimensions:
      technical_complexity: 2
      scope_size: 1
      dependencies: 1
      uncertainty: 1  # SPIKE proved algorithm works
      risk: 2
      testing: 3
  estimated_days: 1
  deliverables:
    - detectConflict(local, remote) → boolean
    - hasGreaterVersion(v1, v2) → boolean
    - areVectorsEqual(v1, v2) → boolean
    - mergeVersionVectors(v1, v2) → VersionVector
  testing:
    - Unit tests for all 4 functions
    - Test scenarios from spike-conflict-poc.js
  reference: docs/spike-conflict-poc.js (proven POC)
```

**Rationale**: These are small, standalone functions proven in the SPIKE. Extracting them as a separate task:
- Makes Feature 5.2 and 5.3 clearer (they use these helpers)
- Enables parallel work (someone can implement helpers while another works on database schema)
- Low complexity (1.8 composite) - easy win

---

### 4. **Update Task 5.3.2: Field-Level Diff** (CLARIFY)

#### Current (lines 1068-1088):
```yaml
deliverables:
  - Deep diff local vs remote quote (using spike algorithm)
  - Categorize conflicts (critical vs non-critical)
  - Generate conflict report with field paths
```

#### Proposed Addition:
```yaml
deliverables:
  - Deep diff local vs remote quote (using spike algorithm)
  - Categorize conflicts (critical vs non-critical)
  - Critical fields: customer_name, customer_email, customer_phone, status, jobs, financials
  - Non-critical fields: metadata, location
  - Generate conflict report with field paths
  - Report includes: path, localValue, remoteValue, timestamps, severity
reference: docs/spike-conflict-resolution-design.md (Section 2.1 - Field Classification)
```

**Reason**: Make critical vs non-critical field list explicit (from SPIKE findings).

---

## GitHub Project Updates

### Option A: No New Issues (Minimal Changes)
**Approach**: Update existing issue descriptions with refined deliverables

**Changes**:
1. Edit Issue #45 (Feature 5.2: Version Tracking)
   - Add "version vector" clarification to description
   - Link to SPIKE document

2. Edit Issue #47 (Task 5.3.1: Version Comparison)
   - Update from "version comparison" to "version vector comparison"
   - Add helper function deliverables
   - Link to POC code

3. Edit Issue #48 (Task 5.3.2: Field-Level Diff)
   - Add explicit critical/non-critical field list
   - Link to SPIKE design doc

**Pros**: Minimal churn, keeps existing issue numbers
**Cons**: Doesn't capture helper functions as a discrete task

---

### Option B: Add New Subtask (Recommended)
**Approach**: Create new task for helper functions, update existing tasks

**New Issue**:
- **Title**: "Task 5.2.1: Version Vector Helper Functions"
- **Type**: `type: task` (sub-issue of Feature 5.2 #45)
- **Estimated Days**: 1 day
- **Deliverables**: 4 helper functions (detectConflict, hasGreaterVersion, areVectorsEqual, mergeVersionVectors)
- **Dependencies**: None (can start immediately after Feature 5.2 database schema)
- **Reference**: `docs/spike-conflict-poc.js` (proven POC)

**Updated Issues** (same as Option A):
- Issue #45, #47, #48 - add clarifications

**Pros**: Clear separation of concerns, enables parallel work, small easy-win task
**Cons**: One additional issue to track

---

### Option C: Major Restructure (NOT RECOMMENDED)
**Approach**: Completely re-plan Epic 5 based on SPIKE

**Reason to Avoid**: Current plan is already well-validated (all features ≤3.0 composite). SPIKE didn't reveal major issues, just refinements. Re-planning would be busywork.

---

## Recommended Actions

### Immediate (This Sprint):
1. ✅ **Update BLUEPRINT.yaml** with refined deliverables (Features 5.2, 5.3)
2. ✅ **Create Task 5.2.1** (Helper Functions) as new GitHub issue
3. ✅ **Update existing issues** (#45, #47, #48) with SPIKE references

### Before Epic 5 Implementation (Weeks 8-10):
4. ⏳ **Review SPIKE documents** with team (get approval if needed)
5. ⏳ **Assign Task 5.2.1** as a quick-win (1 day, can be done in parallel with database schema)

---

## Impact Analysis

### Timeline Impact
- **No change** - Refinements don't add significant scope
- New Task 5.2.1 (1 day) can run in parallel with Feature 5.2 (2 days)

### Complexity Impact
- **SPIKE reduced Epic 5 uncertainty**: 4/5 → 2/5 ✅
- **All features remain manageable**: 2.5-2.8 composite (50-57%) ✅
- **New task is low complexity**: 1.8 composite (36%) ✅

### Risk Impact
- **De-risked sync engine** - Proven algorithm from POC
- **Clear implementation path** - Pseudocode and working prototype available
- **Team confidence increased** - No unknowns remaining

---

## Files Created by SPIKE (Reference)

1. `docs/spike-conflict-resolution-design.md` (650+ lines)
   - Research findings (Version Vectors, CRDTs, OT)
   - Field classification (critical vs non-critical)
   - Complete pseudocode
   - Recommendations for implementation

2. `docs/spike-conflict-poc.js` (450+ lines)
   - Fully working JavaScript POC
   - 5 test scenarios (all passing)
   - Helper functions ready to port to TypeScript

---

## Conclusion

**The SPIKE was highly successful** and validated the existing Epic 5 plan. Only minor refinements needed:
- Clarify version vectors vs simple versions
- Add 4 helper functions (1 day task)
- Make field classification explicit

**Recommendation**: Proceed with **Option B** (add new subtask for helper functions).

---

**Next Steps**:
1. Get stakeholder approval for these refinements
2. Update BLUEPRINT.yaml
3. Create GitHub issues
4. Mark Epic 5 as "ready for implementation" (Weeks 8-10)
