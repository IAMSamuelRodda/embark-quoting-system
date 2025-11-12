# E2E Test Failures - Root Cause Analysis - 2025-11-12

## Executive Summary

**26 E2E test failures** broken down into 3 categories:

1. **Auth-related failures (8-10 tests)** - Local infrastructure/test construction issues (SKIP for now per user directive)
2. **Job creation failures (5 tests)** - **KNOWN architectural bug** (documented, has fix path)
3. **Visual/color tests (7 tests)** - **Test configuration bug** (hardcoded URLs)

---

## Category 1: Auth-Related Failures (SKIP - Test Infrastructure Issues)

### Affected Tests
- `offline-auth.spec.ts` (8 tests)
- `auth-mocked.spec.ts` (2 tests)
- `debug-login.spec.ts` (2 tests)

### User Guidance
> "auth failures are usually local infrastructure or test construction issues. they are a common issue for us. i almost wish we could bypass them to more quickly test other failures (particularly in local environments)."

### Status
**DEFERRED** - These are test setup/infrastructure issues, not application bugs.

### Recommendation
Create a filtered test run that excludes auth-related specs to focus on real application issues.

---

## Category 2: Job Creation Race Condition (KNOWN BUG - Has Fix Path)

### Affected Tests
- `complete-job-workflow.spec.ts` - Complete job creation workflow (FAILS ❌)
- `race-condition-job-creation.spec.ts` - Race condition with slow network (EXPECTS FAILURE ✓)
- `race-condition-job-creation.spec.ts` - Burst jobs verification (FAILS ❌)
- `reproduce-job-error.spec.ts` - Job creation error reproduction (EXPECTS FAILURE ✓)
- `test-job-creation.spec.ts` - Job creation and add retaining wall (FAILS ❌)

### Root Cause (Documented in Test Code)

**From `race-condition-job-creation.spec.ts:10-16`**:

```
ROOT CAUSE:
- Quotes are offline-first (saved to IndexedDB with sync_status: PENDING)
- Jobs are backend-dependent (require quote to exist in PostgreSQL)
- When users create a quote and immediately add a job, the job creation
  attempts to verify the quote exists in the backend, but the quote sync
  hasn't completed yet, causing "Quote not found" errors.
```

### Architecture Mismatch

| Component | Storage Strategy | Problem |
|-----------|-----------------|---------|
| **Quotes** | Offline-first (IndexedDB → Sync Queue → Backend) | ✅ Works offline |
| **Jobs** | Backend-dependent (requires PostgreSQL quote) | ❌ Fails if quote not synced |

### Timeline of Failure

1. User creates quote → Saved to IndexedDB (`sync_status: PENDING`)
2. Sync queued but not completed (slow network)
3. User clicks "Add Job" immediately
4. Job creation calls `pushChanges()` to sync quote
5. Job creation verifies quote exists in backend → **FAILS**
6. Error: "Quote does not exist in backend"

### Test Intent

**IMPORTANT**: The test `race-condition-job-creation.spec.ts` is **DESIGNED to fail** to document the bug:

```typescript
// Line 141-145
if (result === 'error') {
  console.log('✓ BUG REPRODUCED: Job creation failed');
  // This is the expected behavior (bug reproduced)
  expect(errorText).toBeTruthy();
  console.log('\n✓ Race condition successfully reproduced');
}
```

The test at line 178 "should work after implementing offline-first jobs (verification test)" will **PASS** once the fix is implemented.

### Recommended Fix

**Make Jobs Offline-First** (from test comments at line 173-174):

```
Recommended Fix: Make jobs offline-first too
See: frontend/src/features/jobs/jobsDb.ts (to be created)
```

**Implementation Path**:
1. Create `src/features/jobs/jobsDb.ts` for IndexedDB job storage
2. Update job creation flow to save to IndexedDB first
3. Queue job sync to backend asynchronously
4. Handle conflicts when syncing to backend

### Status
**KNOWN BUG** - Documented, has clear fix path, not urgent to fix tests (they're working as designed).

### Priority
**Medium** - This is a real user-facing issue (race condition), but tests are correctly identifying it. Fix the application bug, not the tests.

---

## Category 3: Visual/Color Test Failures (TEST CONFIGURATION BUG)

### Affected Tests
- `check-gold-colors.spec.ts` - Visual verification of CAT Gold colors
- `debug-page-load.spec.ts` - Debug page load and CSS
- `test-gold-final.spec.ts` - Final CAT Gold verification
- `test-staging-gold.spec.ts` - Verify CAT Gold on staging
- `verify-colors.spec.ts` - Check computed CSS variables (2 tests)
- `visual-color-test.spec.ts` - Visual color verification
- `screenshot-app.spec.ts` - Screenshot full app with CAT Gold colors

### Root Cause: Hardcoded Localhost URLs

**Problem**: Tests have hardcoded `localhost:3000` or `localhost:3001` URLs instead of using Playwright's `baseURL` configuration.

**Evidence**:

| Test File | Line | Code | Issue |
|-----------|------|------|-------|
| `check-gold-colors.spec.ts` | 5 | `await page.goto('http://localhost:3001/')` | Hardcoded |
| `check-console.spec.ts` | 18 | `await page.goto('http://localhost:3000/')` | Hardcoded |
| `debug-page-load.spec.ts` | 10 | `await page.goto('http://localhost:3001/')` | Hardcoded |
| `complete-job-workflow.spec.ts` | 15 | `const baseUrl = 'http://localhost:3000'` | Hardcoded |
| `screenshot-app.spec.ts` | 4 | `await page.goto('http://localhost:3000/')` | Hardcoded |

**Playwright Config** (`playwright.config.ts:14`):
```typescript
baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000'
```

**What Happens in CI/Staging**:
1. CI sets `E2E_BASE_URL=https://d1aekrwrb8e93r.cloudfront.net`
2. Playwright config correctly uses staging URL
3. **BUT** tests ignore the config and hardcode `localhost:3000`
4. Tests try to connect to `localhost:3000` (which doesn't exist in CI)
5. Tests fail with connection errors

### CAT Gold CSS is NOT Broken

The CAT Gold colors are correctly defined in the codebase:

**From `src/styles/tokens/colors.css`**:
```css
--color-accent-primary: #ffb400; /* CAT Gold - main brand color */
--color-border-focus: var(--color-accent-primary); /* Focus indicator (CAT Gold) */
```

The visual tests are failing because they can't load the page (wrong URL), not because the colors are missing.

### Fix

**Option A: Use Playwright's `page.goto()` with relative paths**:
```typescript
// Before
await page.goto('http://localhost:3000/');

// After
await page.goto('/');  // Uses baseURL from config
```

**Option B: Read baseURL from Playwright config**:
```typescript
// Before
const baseUrl = 'http://localhost:3000';

// After
import { test, expect } from '@playwright/test';
test('My test', async ({ page, baseURL }) => {
  await page.goto(baseURL!);  // Uses config baseURL
});
```

**Option C: Use environment variable**:
```typescript
const baseUrl = process.env.E2E_BASE_URL || 'http://localhost:3000';
```

### Files to Fix

**High Priority** (non-auth visual tests):
- ✅ `e2e/check-gold-colors.spec.ts` (line 5)
- ✅ `e2e/check-console.spec.ts` (line 18)
- ✅ `e2e/debug-page-load.spec.ts` (line 10)
- ✅ `e2e/screenshot-app.spec.ts` (line 4)
- ✅ `e2e/test-gold-final.spec.ts`
- ✅ `e2e/test-staging-gold.spec.ts`
- ✅ `e2e/verify-colors.spec.ts`
- ✅ `e2e/visual-color-test.spec.ts`

**Medium Priority** (job creation tests):
- ✅ `e2e/complete-job-workflow.spec.ts` (line 15)
- ✅ `e2e/race-condition-job-creation.spec.ts` (lines 37, 189)
- ✅ `e2e/reproduce-job-error.spec.ts` (line 5)
- ✅ `e2e/test-job-creation.spec.ts`

**Deferred** (auth-related tests - per user directive):
- `e2e/offline-auth.spec.ts` (multiple lines)
- `e2e/debug-login.spec.ts`
- `e2e/auth-mocked.spec.ts`
- `e2e/sync_verification.spec.ts`

### Status
**TEST BUG** - Easy fix, high impact (fixes 7+ visual tests immediately).

### Priority
**HIGH** - Simple fix that will eliminate most visual test failures.

---

## Summary: What to Fix

### Immediate Actions (High ROI)

1. **Fix Hardcoded URLs** (fixes 7+ visual tests + 5 job tests)
   - Replace hardcoded `localhost:3000/3001` with relative paths or `baseURL`
   - Estimated time: 30 minutes
   - Impact: Fixes 12+ tests immediately

2. **Verify Fix** (rerun tests against staging)
   - Run: `E2E_BASE_URL=https://d1aekrwrb8e93r.cloudfront.net npm run test:e2e`
   - Expected: Visual tests should pass, job tests should still fail (known bug)

### Deferred Actions

3. **Fix Job Architecture** (medium-term)
   - Implement offline-first job creation (like quotes)
   - Create `src/features/jobs/jobsDb.ts`
   - Update job creation flow
   - Estimated time: 2-3 days
   - Impact: Fixes race condition bug, improves offline UX

4. **Skip Auth Tests** (low priority)
   - Create separate test command that excludes auth specs
   - Example: `npx playwright test --grep-invert "auth|offline"`
   - Impact: Faster local test runs

---

## Test Results After Fixes

### Expected Results (After Fixing Hardcoded URLs)

| Category | Before | After Fix | Notes |
|----------|--------|-----------|-------|
| Visual/Color Tests | 7 fail | 7 pass ✅ | URLs fixed |
| Job Creation Tests | 5 fail | 5 fail (expected) | Known architectural bug |
| Auth Tests | 8-10 fail | 8-10 fail | Test infrastructure issues (skip) |
| **TOTAL** | 26 fail | **7-12 fail** | **~54% improvement** |

### Final State
- ✅ **Visual tests passing** (no longer blocked by URL issues)
- ⚠️ **Job tests failing** (known bug, has fix path)
- 🔄 **Auth tests skipped** (test infrastructure issues)

---

## Recommendation

**Start with the high-ROI fix**: Update hardcoded URLs to use `baseURL` from Playwright config. This will immediately fix 7+ visual tests with minimal effort.

**Command to verify**:
```bash
# After fixing hardcoded URLs
export E2E_BASE_URL="https://d1aekrwrb8e93r.cloudfront.net"
npx playwright test --grep "gold|color|visual" --reporter=list
```

**Expected output**: All visual/color tests should pass ✅

---

## Links

- **CI Deployment**: https://github.com/IAMSamuelRodda/embark-quoting-system/actions/runs/19294692097
- **Progress Summary**: `/archive/2025-11-12-E2E-PROGRESS-SUMMARY.md`
- **Local vs CI Comparison**: `/archive/2025-11-12-LOCAL-CI-TEST-COMPARISON.md`
- **CI/Local Parity Issue**: `/archive/2025-11-12-E2E-CI-LOCAL-PARITY.md`
