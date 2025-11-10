# Epic 5: Conflict Resolution Spike

**Duration**: 5 days (Feature 5.0 in BLUEPRINT.yaml)
**Purpose**: Investigate and design sync conflict resolution strategy
**Status**: ✅ Complete

---

## Spike Deliverables

| File | Purpose | Size |
|------|---------|------|
| **spike-conflict-resolution-design.md** | Complete conflict resolution strategy | 21KB |
| **spike-conflict-poc.js** | Proof-of-concept implementation | 19KB |
| **epic-5-refinements-post-spike.md** | Architecture refinements after spike | 8KB |

---

## Key Findings

### Conflict Resolution Strategy

**Approach**: Field-level conflict detection with version vectors

**Critical Fields** (manual resolution):
- Customer contact information
- Quote status
- Financial totals
- Job parameters

**Non-Critical Fields** (auto-merge):
- Notes
- Metadata
- Timestamps

### Version Vector System

**Tracking**: Each device maintains a version vector `{deviceId: versionNumber}`

**Causality Detection**:
- Concurrent edits → Manual resolution required
- Causal edits → Automatic merge (last-write-wins on non-critical fields)

### Implementation Architecture

**Components**:
1. Version vector helper functions
2. Conflict detection algorithm
3. Field-level merge logic
4. User-facing conflict resolution UI

---

## Post-Spike Refinements

**File**: `epic-5-refinements-post-spike.md`

**Key Architecture Decisions**:
- IndexedDB storage strategy
- Sync queue management
- Conflict resolution UI patterns
- Performance optimization for offline scenarios

**Impact on Epic 5 Features**:
- Feature 5.1: Sync Queue Manager
- Feature 5.2: Version Vectors & Causality Tracking
- Feature 5.3: Conflict Detection & Resolution
- Feature 5.4: Sync UI Components

---

## Proof of Concept

**File**: `spike-conflict-poc.js`

**Demonstrates**:
- Version vector operations (increment, merge, compare)
- Conflict detection algorithm
- Field-level merging logic
- Test cases for concurrent/causal scenarios

**Usage**:
```bash
node spike-conflict-poc.js
```

**Validates**:
- Version vector causality detection works correctly
- Field-level conflicts can be isolated and resolved
- Performance is acceptable for offline-first use case

---

## Implementation Path

This spike informed the design of Epic 5 features in `specs/BLUEPRINT.yaml`:

1. **Feature 5.0**: Spike (this investigation) - 5 days
2. **Feature 5.1**: Sync Queue Manager - 3 days
3. **Feature 5.2**: Version Vectors & Causality Tracking - 2 days
4. **Feature 5.3**: Conflict Detection & Resolution - 3 days
5. **Feature 5.4**: Sync UI Components - 2 days

**Total Epic 5**: 15 days (including 5-day spike)

---

## Critical Insights

### Why Version Vectors?

**Alternatives Considered**:
- Last-write-wins (LWW): Too naive, loses data
- Operational Transform (OT): Too complex for quote forms
- CRDTs: Overkill for structured form data

**Version Vectors Win Because**:
- Tracks causality accurately
- Lightweight overhead
- Deterministic conflict detection
- Well-understood semantics

### Why Field-Level Conflicts?

**Rationale**: Entire quote conflicts are too coarse-grained.

**Example**: If Device A edits customer notes while Device B edits job parameters, those changes should auto-merge - they're independent fields.

**Field-Level Detection**: Only flag conflicts when SAME field edited concurrently.

---

## References

### Related Documentation

- **`specs/BLUEPRINT.yaml`** → Epic 5 (Sync Engine)
- **`docs/planning/spikes/epic-0-complexity-assessment.md`** → Identified sync as highest risk
- **`CLAUDE.md`** → Conflict resolution strategy section

### External Resources

- Version vectors: Leslie Lamport's "Time, Clocks, and the Ordering of Events"
- Conflict-free replicated data types: Marc Shapiro et al.

---

## Lessons Learned

1. **5-day spike was necessary**: Initial complexity estimate was too low
2. **Field-level granularity is critical**: Entire quote conflicts create poor UX
3. **Manual resolution for critical fields**: Automated merging on financial data is dangerous
4. **IndexedDB sync queue**: Persistent queue survives app crashes during offline periods

**Impact**: Epic 5 complexity score increased from 3.0 to 3.5 after spike findings.

---

**Last Updated**: 2025-11-04
**Next Action**: Implement Feature 5.1 (Sync Queue Manager)
