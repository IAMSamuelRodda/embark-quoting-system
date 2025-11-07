# E2E Workflow Architecture

**Last Updated**: 2025-11-07
**Author**: Claude Code
**Purpose**: Eliminate duplication in E2E test execution + Amazon-style deployment testing

---

## 🎯 Two Problems Solved

### 1. Code Duplication (Reusable Workflows)
**Challenge**: E2E test logic duplicated across multiple workflows creates drift and maintenance burden

**Solution**: Single source of truth using GitHub's reusable workflow pattern

### 2. Production Test Overhead (Amazon-Style Deployment)
**Challenge**: Running comprehensive E2E tests on every production deployment is slow and risky

**Solution**: Test comprehensively on staging, run minimal smoke tests on production + metrics monitoring

---

## 🏗️ Amazon-Style Deployment Philosophy

We follow the deployment testing approach used by Amazon, Netflix, and Google:

```
Staging Environment (dev branch)
  ├─ Comprehensive E2E test suite (all scenarios)
  ├─ Lighthouse performance audit
  └─ Full integration testing

Production Environment (tagged releases)
  ├─ Minimal smoke tests (auth validation only)
  ├─ CloudWatch metrics monitoring (5 minutes)
  └─ Auto-rollback on errors/unhealthy targets
```

**Benefits**:
- ✅ **Faster production deployments** (~12 min faster without full E2E suite)
- ✅ **Lower risk** No false E2E failures blocking production releases
- ✅ **Real issue detection** Metrics monitoring catches actual problems (5xx errors, crashes)
- ✅ **Industry standard** Matches Amazon, Netflix, Google best practices

**Test Distribution**:
| Environment | E2E Tests | Duration | Triggered By |
|------------|-----------|----------|--------------|
| **Staging** | Full suite (`e2e/**/*.spec.ts`) | ~2-5 min | Every push to `dev` |
| **Production** | Auth only (`e2e/auth.spec.ts`) | ~30 sec | Version tags (`v*.*.*`) |

---

## 🎯 Problem Solved (Legacy Section)

**Challenge**: We need to run E2E tests in multiple contexts:
1. **Manual debugging** - Fast feedback without full deployment
2. **Staging deployment** - Automatic testing after dev → staging push
3. **Future**: Production smoke tests, PR previews, scheduled runs

**Risk**: Maintaining duplicate E2E test logic across multiple workflows creates:
- ❌ Drift between workflows (one gets updated, others don't)
- ❌ Harder to maintain (change test timeouts, add new steps, etc.)
- ❌ Inconsistent test execution across environments

---

## ✅ Solution: Reusable Workflow Pattern

### Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                        │
│  e2e-tests-reusable.yml (Single Source of Truth)                     │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │ • Install dependencies                                      │     │
│  │ • Install Playwright browsers                               │     │
│  │ • Verify connectivity (frontend + API)                     │     │
│  │ • Run E2E tests with OPTIONAL pattern (configurable)       │     │
│  │ • Upload Playwright reports                                 │     │
│  └────────────────────────────────────────────────────────────┘     │
│                              ▲                                        │
│                              │                                        │
│                              │ calls via workflow_call               │
│                              │                                        │
└──────────────────────────────┼────────────────────────────────────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
         │                     │                     │
┌────────▼──────────┐  ┌───────▼────────────┐  ┌───▼────────────────┐
│                   │  │                    │  │                    │
│  e2e-manual.yml   │  │ deploy-staging.yml │  │ deploy-prod.yml    │
│  (Manual Trigger) │  │ (Auto on dev push) │  │ (Tagged releases)  │
│                   │  │                    │  │                    │
│  • Fast debugging │  │ • COMPREHENSIVE    │  │ • MINIMAL smoke    │
│    (2 min)        │  │   test suite       │  │   tests only       │
│  • Any pattern    │  │ • Full validation  │  │ • Auth validation  │
│  • Any env        │  │ • Lighthouse audit │  │ • Metrics monitor  │
└───────────────────┘  └────────────────────┘  └────────────────────┘
```

---

## 📂 File Structure

```
.github/workflows/
├── e2e-tests-reusable.yml    # ← Single source of truth (150 lines)
├── e2e-manual.yml             # ← Calls reusable (8 lines)
├── deploy-staging.yml         # ← Calls reusable (8 lines) - COMPREHENSIVE tests
└── deploy-prod.yml            # ← Calls reusable (8 lines) - MINIMAL smoke tests
```

### 1. **e2e-tests-reusable.yml** (Single Source of Truth)

**Purpose**: Contains all E2E test execution logic
**Trigger**: `workflow_call` (called by other workflows, not directly)

**Inputs**:
- `base-url` (required): Frontend URL to test
- `api-url` (required): Backend API URL to test
- `environment` (optional): Environment name (staging/production/local)
- `test-pattern` (optional): Specific test file or pattern (e.g., `e2e/sync.spec.ts`)

**Secrets**:
- `test-user-email`: E2E test user credentials
- `test-user-password`: E2E test user credentials

**Key Features**:
- ✅ Installs Playwright browsers with optimizations (skip man pages)
- ✅ Verifies connectivity before running tests
- ✅ Supports running specific test patterns for fast debugging
- ✅ Uploads Playwright reports automatically
- ✅ Adds test summary to GitHub Actions summary

---

### 2. **e2e-manual.yml** (Manual Trigger)

**Purpose**: Fast E2E debugging without full deployment
**Trigger**: `workflow_dispatch` (manual button in GitHub UI)

**Use Cases**:
- 🐛 Debug failing E2E tests without deploying
- 🔬 Test specific scenarios (e.g., only sync tests)
- 🧪 Run E2E tests against custom environments

**How to Use**:
1. Go to **Actions** tab in GitHub
2. Select **"E2E Tests (Manual)"** workflow
3. Click **"Run workflow"**
4. Choose options:
   - **Environment**: `staging`, `production`, or `custom`
   - **Test Pattern**: Leave blank for all, or specify (e.g., `e2e/sync.spec.ts`)
   - **Custom URLs**: Only if environment = `custom`

**Example: Debug sync tests on staging**:
```yaml
Environment: staging
Test Pattern: e2e/sync.spec.ts
```

---

### 3. **deploy-staging.yml** (Automatic)

**Purpose**: Run E2E tests after staging deployment
**Trigger**: Push to `dev` branch

**What Changed**:
- ❌ **Before**: 100+ lines of duplicated E2E test logic
- ✅ **After**: 8 lines calling reusable workflow

**Example**:
```yaml
e2e-tests:
  name: Run E2E Tests on Staging
  needs: [deploy-backend, deploy-frontend]
  uses: ./.github/workflows/e2e-tests-reusable.yml
  with:
    base-url: ${{ secrets.STAGING_FRONTEND_URL }}
    api-url: ${{ needs.deploy-backend.outputs.backend-url }}
    environment: 'staging'
    test-pattern: 'e2e/auth-validation.spec.ts'  # Fast validation tests
  secrets:
    test-user-email: ${{ secrets.E2E_TEST_USER_EMAIL }}
    test-user-password: ${{ secrets.E2E_TEST_USER_PASSWORD }}
```

**Why `test-pattern` in staging?**
- Staging runs only **critical validation tests** (auth, login)
- Full E2E suite (including sync tests) runs manually when debugging
- Keeps staging deployment fast (< 5 min feedback)

---

## 🔧 Maintenance: Single Point of Change

### Example: Add timeout for slow tests

**Before** (without reusable workflow):
```diff
# Need to update in 3 places:
# 1. deploy-staging.yml
# 2. e2e-manual.yml
# 3. deploy-production.yml (future)

- timeout-minutes: 2
+ timeout-minutes: 5
```

**After** (with reusable workflow):
```diff
# Update ONCE in e2e-tests-reusable.yml:

- timeout-minutes: 2
+ timeout-minutes: 5

# All callers automatically get the new timeout
```

### Example: Add new Playwright flag

**Before**:
- Update `deploy-staging.yml`
- Update `e2e-manual.yml`
- Update `deploy-production.yml` (if exists)
- Risk: Forget one, tests behave differently

**After**:
- Update `e2e-tests-reusable.yml` once
- All workflows automatically get new flag

---

## 🚀 Usage Examples

### 1. Debug Sync Tests Quickly

**Without full deployment**:
```bash
# Go to Actions → E2E Tests (Manual) → Run workflow
Environment: staging
Test Pattern: e2e/sync.spec.ts
```

**Result**: Runs only sync tests (~2 min) vs full staging deployment (~15 min)

---

### 2. Test Specific Feature on Production

**After prod deployment**:
```bash
Environment: production
Test Pattern: e2e/auth-validation.spec.ts
```

**Result**: Smoke test on production without running full suite

---

### 3. Test Against Local Development

**For PR previews or local testing**:
```bash
Environment: custom
Custom Base URL: https://preview-123.embark-quoting.com
Custom API URL: https://preview-123-api.embark-quoting.com
Test Pattern: (leave blank for all tests)
```

---

## 📊 Benefits Summary

| Aspect | Before | After |
|--------|--------|-------|
| **Duplication** | 100+ lines × 2 workflows | 8 lines × 2 workflows |
| **Maintenance** | Update 2+ places | Update 1 place |
| **Consistency** | Risk of drift | Always consistent |
| **Debugging** | Full deployment required | Manual trigger available |
| **Speed** | Deploy → test (~15 min) | Manual test (~2 min) |
| **Test Coverage** | All tests always | Selective patterns |

---

## 🎯 When to Use Manual vs Automatic

### Use **Manual E2E Workflow** when:
- 🐛 Debugging failing E2E tests
- 🔬 Testing specific features (use `test-pattern`)
- 🧪 Running E2E against PR previews
- ⚡ Need fast feedback (< 5 min)

### Use **Staging Deployment E2E** when:
- 🚀 Testing after deployment to staging
- ✅ Validating critical paths work
- 🔄 Automatic regression testing
- 📊 Ensuring deployment didn't break key flows

---

## 🔮 Future Enhancements

### 1. Add Production Smoke Tests

```yaml
# .github/workflows/deploy-production.yml
e2e-smoke-tests:
  uses: ./.github/workflows/e2e-tests-reusable.yml
  with:
    base-url: ${{ secrets.PRODUCTION_FRONTEND_URL }}
    api-url: ${{ secrets.PRODUCTION_API_URL }}
    environment: 'production'
    test-pattern: 'e2e/smoke.spec.ts'  # Only critical smoke tests
```

### 2. Add Scheduled E2E Tests

```yaml
# .github/workflows/e2e-scheduled.yml
on:
  schedule:
    - cron: '0 0 * * *'  # Daily at midnight

jobs:
  nightly-e2e:
    uses: ./.github/workflows/e2e-tests-reusable.yml
    with:
      base-url: ${{ secrets.STAGING_FRONTEND_URL }}
      api-url: ${{ secrets.STAGING_API_URL }}
      environment: 'staging-nightly'
      test-pattern: ''  # All tests
```

### 3. Add PR Preview E2E Tests

```yaml
# .github/workflows/pr-preview.yml
e2e-preview:
  uses: ./.github/workflows/e2e-tests-reusable.yml
  with:
    base-url: https://pr-${{ github.event.pull_request.number }}.embark-quoting.com
    api-url: https://pr-${{ github.event.pull_request.number }}-api.embark-quoting.com
    environment: 'pr-preview'
```

---

## 🛡️ Preventing Duplication: Best Practices

### ✅ DO:
- ✅ Update `e2e-tests-reusable.yml` when changing E2E test logic
- ✅ Use `test-pattern` to run specific tests for faster feedback
- ✅ Add new workflows that call the reusable workflow
- ✅ Document new inputs in this file

### ❌ DON'T:
- ❌ Copy E2E test steps into new workflows
- ❌ Create separate E2E test logic for different environments
- ❌ Modify callers (`e2e-manual.yml`, `deploy-staging.yml`) for test changes
- ❌ Duplicate Playwright installation or configuration

---

## 📝 Change Log

| Date | Change | Reason |
|------|--------|--------|
| 2025-11-07 | Created reusable workflow architecture | Eliminate duplication, enable manual debugging |
| 2025-11-07 | Updated deploy-staging.yml to use reusable workflow | Reduced from 100+ lines to 8 lines |
| 2025-11-07 | Created e2e-manual.yml for fast debugging | Enable < 5 min E2E test feedback |

---

## 🔗 Related Documentation

- **Sync Tests**: `frontend/src/features/sync/TESTING.md`
- **CI/CD Overview**: `DEVELOPMENT.md`
- **Staging Deployment**: `.github/workflows/deploy-staging.yml`

---

**Questions?** Check GitHub Actions logs or open an issue with the `ci/cd` label.
