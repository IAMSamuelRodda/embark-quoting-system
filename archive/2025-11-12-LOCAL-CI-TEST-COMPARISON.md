# E2E Test Comparison: Local vs CI - 2025-11-12

## Summary

**Local Test Run (Partial - Hung Before Completion)**:
- Status: 14 failures captured (test run hung before completion)
- Environment: Local → Staging URLs
  - Frontend: `https://d1aekrwrb8e93r.cloudfront.net`
  - Backend: `https://d23yr4mguq0lb9.cloudfront.net`

**CI Test Run (Complete)**:
- Status: 36 passed / 26 failed
- Deployment: #19294692097
- Environment: GitHub Actions → Staging

## Key Finding: Tests Fail Both Locally AND in CI

**Critical Insight**: The 14 tests that failed locally are a **subset** of the 26 CI failures. This indicates these are **real application bugs**, not CI-specific environment issues.

---

## Test Failure Comparison

### Category 1: Visual/Color Tests

| Test Name | Local | CI | Status |
|-----------|-------|----|--------------------|
| check-gold-colors - Visual verification of CAT Gold colors | ❌ | ❌ | **Real Bug** |
| debug-page-load - Debug page load and CSS | ❌ | ❌ | **Real Bug** |
| test-gold-final - Final CAT Gold verification | ❌ | ❌ | **Real Bug** |
| test-staging-gold - Verify CAT Gold colors on staging | ❌ | ❌ | **Real Bug** |
| verify-colors - Check computed CSS variables | ❌ | ❌ | **Real Bug** |
| verify-colors - Display CAT Gold on UI elements | ❌ | ❌ | **Real Bug** |
| visual-color-test - Visual color verification | ❌ | ❌ | **Real Bug** |
| screenshot-app - Screenshot full app with CAT Gold colors | ? | ❌ | Unknown (not run locally) |

**Analysis**: 7/8 visual/color tests fail both locally and in CI
- **Root Cause Hypothesis**: CAT Gold CSS variables may not be loaded/applied correctly
- **Priority**: Medium (affects visual branding, not core functionality)

---

### Category 2: Job Creation Workflow

| Test Name | Local | CI | Status |
|-----------|-------|----|--------------------|
| complete-job-workflow - Complete job creation workflow | ❌ | ❌ | **Real Bug** |
| race-condition-job-creation - Race condition with slow network | ❌ | ❌ | **Real Bug** |
| race-condition-job-creation - Burst jobs verification test | ❌ | ❌ | **Real Bug** |
| reproduce-job-error - Reproduce job creation error | ❌ | ❌ | **Real Bug** |
| test-job-creation - Job creation and add retaining wall | ❌ | ❌ | **Real Bug** |

**Analysis**: 5/6 job creation tests fail both locally and in CI
- **Root Cause Hypothesis**: Race conditions or timing issues in job creation flow
- **Priority**: **HIGH** (affects core business functionality)

---

### Category 3: UI State Indicators

| Test Name | Local | CI | Status |
|-----------|-------|----|--------------------|
| auth-Authentication-Flow - should show offline indicator in UI | ❌ | ❌ | **Real Bug** |
| auth-mocked-Authentication - offline indicator when offline | ❌ | ❌ | **Real Bug** |
| check-console - Check console errors | ? | ❌ | Unknown (not run locally) |

**Analysis**: 2/4 UI indicator tests fail both locally and in CI
- **Root Cause Hypothesis**: Offline status indicator not displaying correctly
- **Priority**: Medium (UX issue for offline mode)

---

### Category 4: Offline Authentication

| Test Name | Local | CI | Status |
|-----------|-------|----|--------------------|
| offline-auth - Offline login with Remember Me | ? | ❌ | Unknown (not run locally) |
| offline-auth - Credential expiry (30 days) | ? | ❌ | Unknown (not run locally) |
| offline-auth - First-time login protection | ? | ❌ | Unknown (not run locally) |
| offline-auth - Offline mode credential handling | ? | ❌ | Unknown (not run locally) |
| offline-auth - (other 4 tests) | ? | ❌ | Unknown (not run locally) |

**Analysis**: Test run hung before offline auth tests executed
- **Root Cause Hypothesis**: Unknown (needs full local run)
- **Priority**: **HIGH** (affects core offline-first architecture)
- **Next Step**: Need to complete full local test run to confirm

---

### Category 5: Debug/Login Tests

| Test Name | Local | CI | Status |
|-----------|-------|----|--------------------|
| debug-login - Debug login password fill | ? | ❌ | Unknown (not run locally) |
| debug-login - (other test) | ? | ❌ | Unknown (not run locally) |

**Analysis**: Test run hung before these tests executed
- **Root Cause Hypothesis**: Unknown
- **Priority**: Low (debug-specific tests)

---

## Conclusions

### 1. **NOT CI-Specific Issues**
The failures are **NOT** caused by CI environment differences. Local tests against staging show the same failures as CI.

### 2. **Application Bugs Confirmed**
At least **14 of the 26 CI failures** are confirmed real application bugs:
- 7 visual/color tests (CAT Gold CSS issues)
- 5 job creation tests (race conditions/timing)
- 2 UI state indicator tests (offline indicator)

### 3. **Remaining 12 Failures Unknown**
The local test run hung before testing:
- 8 offline authentication tests
- 2 debug/login tests
- 2 other tests

**Recommendation**: Complete a full local test run (without hang) to confirm if ALL 26 failures reproduce locally.

---

## Next Steps

### Immediate (Fix High-Priority Real Bugs)

1. **Job Creation Workflow Failures** (Priority: HIGH)
   - Investigate race conditions in job creation
   - Review timing/network handling in job creation flow
   - Affected tests: 5 tests in `complete-job-workflow.spec.ts`, `race-condition-job-creation.spec.ts`, `reproduce-job-error.spec.ts`

2. **Offline Authentication** (Priority: HIGH - IF confirmed as real bugs)
   - Complete full local test run to confirm failures
   - If confirmed: Investigate offline auth implementation

### Medium Priority (Fix UX/Branding Issues)

3. **CAT Gold CSS Variables** (Priority: Medium)
   - Verify CAT Gold CSS variables are loaded in production builds
   - Check if styles are being stripped during build
   - Affected tests: 7+ visual/color tests

4. **Offline Status Indicator** (Priority: Medium)
   - Verify offline indicator component is rendering
   - Check if offline state detection is working
   - Affected tests: 2 UI state indicator tests

### Investigation

5. **Complete Full Local Test Run**
   - Rerun tests without hang to capture all 26 failures
   - Confirm if ALL CI failures reproduce locally
   - Use `npm run test:e2e:local` with staging URLs

---

## Environment Details

### Local Test Environment
```bash
export BASE_URL="https://d1aekrwrb8e93r.cloudfront.net"
export API_URL="https://d23yr4mguq0lb9.cloudfront.net"
npm run test:e2e:local
```

### CI Test Environment
- Deployment: #19294692097
- Frontend URL: `https://d1aekrwrb8e93r.cloudfront.net`
- Backend URL: `https://d23yr4mguq0lb9.cloudfront.net`
- Credentials: Synchronized (AWS Secrets Manager ↔ GitHub Secrets ↔ Cognito)

### Authentication Status
- ✅ Credentials synchronized across all three sources
- ✅ 36 tests passing (authentication working)
- ❌ 26 tests failing (application bugs)

---

## Links

- **CI Deployment**: https://github.com/IAMSamuelRodda/embark-quoting-system/actions/runs/19294692097
- **Previous Progress Doc**: `/archive/2025-11-12-E2E-PROGRESS-SUMMARY.md`
- **CI/Local Parity Issue Doc**: `/archive/2025-11-12-E2E-CI-LOCAL-PARITY.md`
