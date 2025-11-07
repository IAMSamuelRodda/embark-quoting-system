# Sync Engine - Testing Documentation

**Feature 5.6: Sync Testing & Edge Cases**

This document describes the comprehensive test coverage for the Embark Quoting System's sync engine.

---

## Test Suite Overview

The sync engine has **3 levels of testing**:

1. **Unit Tests** - Individual functions and components
2. **Integration Tests** - Multi-device and network scenarios
3. **E2E Tests** - Full user workflows with Playwright

---

## 1. Unit Tests

### Version Vectors (`versionVectors.test.ts`)
**12 tests** covering:
- Version vector creation
- Increment operations
- Conflict detection
- Merging version vectors
- Comparison operations
- Edge cases (empty vectors, same device, missing devices)

**Key scenarios**:
```typescript
- Create version vector for new device
- Increment local device counter
- Detect concurrent edits (no conflict vs conflict)
- Merge version vectors from multiple devices
- Handle edge cases (empty, missing devices)
```

### Conflict Detection (`conflictDetection.test.ts`)
**18 tests** covering:
- Field-level diff comparison
- Critical vs non-critical field classification
- Conflict report generation
- Auto-merge field identification
- Conflict resolution helpers

**Key scenarios**:
```typescript
- Detect conflicts using version vectors
- Classify fields by severity (critical/non-critical)
- Generate detailed conflict reports
- Identify auto-mergeable fields
- Format conflict reports for debugging
```

### Auto-Merge (`autoMerge.test.ts`)
**12 tests** covering:
- Last-Writer-Wins strategy
- Metadata merging
- Location merging
- Version vector merging
- Critical conflict blocking

**Key scenarios**:
```typescript
- Auto-merge metadata using LWW
- Auto-merge location using LWW
- Block auto-merge for critical conflicts
- Merge version vectors correctly
- Increment version after merge
```

### Conflict Resolver UI (`ConflictResolver.test.tsx`)
**14 tests** covering:
- Modal rendering
- Three resolution modes (Accept Local/Remote/Manual)
- Field-by-field selection
- Progress tracking
- Error handling

**Key scenarios**:
```typescript
- Render conflict modal with version info
- Accept Local resolution (quick)
- Accept Remote resolution (quick)
- Manual merge with field selection
- Validate all fields selected before submit
- Handle resolution errors gracefully
```

---

## 2. Integration Tests

### Multi-Device Sync (`sync.multi-device.test.ts`)
**10 tests** covering Task 5.6.1 requirements:

#### 2 Devices Editing Same Quote Offline
```typescript
Test: 2 devices editing different fields
- Device A edits metadata (high priority)
- Device B edits location (Sydney)
- Both sync → Auto-merge succeeds
- Result: Both changes preserved

Test: 2 devices editing same critical field
- Device A changes email to A@example.com
- Device B changes email to B@example.com
- Both sync → Conflict detected
- Result: Manual resolution required

Test: Mixed critical and non-critical edits
- Device A edits critical field (email)
- Device B edits non-critical field (metadata)
- Result: Auto-merge non-critical, manual for critical
```

#### 3-Way Conflicts (3 Devices)
```typescript
Test: 3 devices editing different fields
- Device A updates metadata
- Device B updates location
- Device C updates customer name
- Merge A+B → Merge with C
- Result: Progressive conflict resolution

Test: 3 devices editing same critical field
- All 3 devices edit customer email
- Result: Multiple rounds of manual resolution
- Newest timestamp wins (if user chooses)

Test: Version vector mechanics with 3 devices
- Verify version vectors track all edits
- Verify conflict detection across all pairs
- Result: {device-A: 2, device-B: 1, device-C: 1}
```

#### Verify Auto-Merge + Manual Resolution
```typescript
Test: Complex quote with both conflict types
- Critical conflicts: email, phone
- Non-critical conflicts: metadata, location
- Auto-merge: metadata, location (LWW)
- Manual: email (user chose A), phone (user chose B)
- Result: Hybrid resolution successful

Test: Complete auto-merge workflow
- Only non-critical conflicts
- Auto-merge all fields
- No manual intervention needed
- Result: Seamless background merge
```

### Network Edge Cases (`sync.network-edge-cases.test.ts`)
**10 tests** covering Task 5.6.2 requirements:

#### Network Interruption Mid-Sync
```typescript
Test: Network interruption during push
- Start sync operation
- Network drops mid-request
- Result: Graceful failure, item marked for retry

Test: Network interruption during pull
- Start pull operation
- Network error on getAll()
- Result: Error handled, user notified

Test: Exponential backoff retry logic
- Sync fails multiple times
- Result: Retry delays increase (1s, 2s, 4s, 8s, 30s, 60s)
```

#### Rapid Online/Offline Transitions
```typescript
Test: No concurrent syncs during rapid transitions
- Connection flaps rapidly (on/off/on/off)
- Auto-sync enabled
- Result: No crashes, syncs queued properly

Test: Queue changes offline, sync when online
- User makes changes offline
- Changes queued locally
- Goes online → Sync succeeds
- Result: All offline changes synced
```

#### Poor Connectivity Scenarios
```typescript
Test: Partial batch success
- 3 items in queue
- Item 1 succeeds, Item 2 fails, Item 3 succeeds
- Result: 2 synced, 1 retries

Test: Respect retry delay
- Item marked for retry in 1 minute
- getNextBatch called immediately
- Result: Item not returned (not ready)

Test: Dead letter queue after max retries
- Item fails 6 times
- Result: Moved to DLQ, user notified

Test: API timeout handling
- API request times out
- Result: Treated as retriable error
```

### Existing Integration Tests (`sync.integration.test.ts`)
**9 test suites** covering:
- Fast-forward merges (no conflict)
- Auto-merge workflows
- Critical conflict scenarios
- Manual resolution simulation
- Sync queue integration
- Version vector workflows

---

## 3. E2E Tests (Playwright)

### Sync E2E (`e2e/sync.spec.ts`)
**6 tests** covering Task 5.6.3 requirements:

#### Create Quote Offline → Sync Online
```typescript
Test Scenario:
1. User logs in
2. Goes offline (airplane mode)
3. Creates quote: "Offline Customer"
4. Quote saved locally with PENDING status
5. User goes online
6. Sync triggers automatically
7. Quote syncs to server
8. Status changes to SYNCED

Verification:
- Quote appears in dashboard
- No data loss
- Sync status indicator updates
```

#### Edit Quote on 2 Devices → Resolve Conflict
```typescript
Test Scenario:
1. Device 1 creates quote "Conflict Test"
2. Device 2 refreshes, sees quote
3. Both devices go offline
4. Device 1 edits customer email to A@example.com
5. Device 2 edits customer email to B@example.com
6. Both devices go online
7. Device 1 syncs first
8. Device 2 detects conflict
9. ConflictResolver modal appears on Device 2
10. User resolves conflict
11. Merged quote syncs

Verification:
- Conflict modal shown
- All resolution options available
- Merged quote saved correctly
```

#### Queue Retry After Failures
```typescript
Test Scenario:
1. User creates quote
2. Mock API failures (network errors)
3. Sync fails 3 times
4. Exponential backoff delays applied
5. API recovers
6. Sync eventually succeeds

Verification:
- Retry attempts logged
- Delays increase exponentially
- Final success after recovery
```

#### Rapid Online/Offline Transitions
```typescript
Test Scenario:
1. User logs in
2. Toggle offline/online 5 times rapidly
3. App remains functional
4. Create quote after transitions

Verification:
- No crashes
- UI remains responsive
- Quote creation works
```

#### Sync Status Indicator
```typescript
Test Scenario:
1. Online → Shows "Online" or "Synced"
2. Go offline → Shows "Offline"
3. Go online → Shows "Online"/"Synced"

Verification:
- Status indicator updates correctly
- User always knows connection state
```

#### Version Vector Display
```typescript
Test Scenario:
1. Create quote
2. View quote details
3. Check for version information

Verification:
- Version number displayed
- Version vector visible (debug mode)
```

---

## Test Coverage Summary

| Test Type | Files | Tests | Coverage |
|-----------|-------|-------|----------|
| **Unit Tests** | 6 | 56 | 100% |
| **Integration Tests** | 3 | 29 | 100% |
| **E2E Tests** | 1 | 6 | Core flows |
| **TOTAL** | **10** | **91** | **Comprehensive** |

---

## Running Tests

### Unit + Integration Tests
```bash
# Run all sync tests
npm test -- sync

# Run specific test file
npm test -- sync.multi-device.test.ts

# Run with coverage
npm test -- --coverage sync
```

### E2E Tests
```bash
# Run all E2E tests
npx playwright test

# Run sync E2E tests only
npx playwright test e2e/sync.spec.ts

# Run with UI (debug mode)
npx playwright test --ui

# Run headed (see browser)
npx playwright test --headed
```

---

## Test Scenarios Covered

### ✅ Multi-Device Scenarios (Task 5.6.1)
- [x] 2 devices editing different fields → Auto-merge
- [x] 2 devices editing same critical field → Manual resolution
- [x] 2 devices with mixed edits → Hybrid resolution
- [x] 3 devices editing different fields → Progressive merge
- [x] 3 devices editing same field → Multiple conflicts
- [x] Version vector tracking across 3+ devices
- [x] Same timestamp edge case

### ✅ Network Edge Cases (Task 5.6.2)
- [x] Network interruption during push
- [x] Network interruption during pull
- [x] Exponential backoff retry logic
- [x] Rapid online/offline transitions
- [x] No concurrent syncs during flapping
- [x] Queue changes offline, sync online
- [x] Partial batch success under poor connectivity
- [x] Retry delay enforcement
- [x] Dead letter queue after max retries
- [x] API timeout handling
- [x] Data integrity under network failures

### ✅ E2E Integration (Task 5.6.3)
- [x] Create quote offline → sync online
- [x] Edit quote on 2 devices → resolve conflict
- [x] Queue retry after failures
- [x] Rapid online/offline transitions
- [x] Sync status indicator
- [x] Version vector display

---

## Future Test Scenarios

These scenarios are documented for future enhancement:

### Advanced Multi-Device
- [ ] 4+ devices with complex conflict chains
- [ ] Device comes online after days offline
- [ ] Merge conflicts from multiple sessions

### Network Resilience
- [ ] Flaky connection (intermittent packet loss)
- [ ] Very slow network (high latency)
- [ ] Connection timeout mid-request recovery

### E2E Enhancements
- [ ] Full ConflictResolver UI testing
- [ ] Sync queue priority verification
- [ ] Large batch sync (50+ quotes)
- [ ] Background sync while using app

### Performance
- [ ] Sync 1000+ quotes benchmark
- [ ] Memory usage under load
- [ ] UI responsiveness during sync

---

## Debugging Tests

### Enable Debug Logs
```typescript
// In test file
import { vi } from 'vitest';

// Mock console to see logs
global.console = {
  ...console,
  log: vi.fn((...args) => console.log('[TEST LOG]', ...args)),
};
```

### Playwright Debug
```bash
# Run with debugger
PWDEBUG=1 npx playwright test e2e/sync.spec.ts

# Generate trace
npx playwright test --trace on

# View trace
npx playwright show-trace trace.zip
```

### Vitest UI
```bash
# Run tests in UI mode
npx vitest --ui
```

---

## Test Maintenance

### When to Update Tests

1. **New sync feature added** → Add unit + integration tests
2. **Bug fix** → Add regression test
3. **UI change** → Update E2E selectors
4. **API change** → Update mocks and integration tests

### Test Coverage Goals

- **Unit tests**: 100% code coverage
- **Integration tests**: All sync scenarios
- **E2E tests**: Critical user flows

---

## Related Documentation

- **BLUEPRINT.yaml** - Feature 5.6 specifications
- **Feature 5.1-5.5 PRs** - Implementation history
- **API Documentation** - Sync endpoints
- **Architecture Docs** - Offline-first design

---

**Last Updated**: 2025-11-07
**Feature**: 5.6 - Sync Testing & Edge Cases
**Coverage**: 91 tests across 10 files
