# E2E Authentication Failures - Recurring Issue Troubleshooting Guide

**Purpose**: Document the recurring pattern of E2E authentication failures to prevent future debugging cycles
**Created**: 2025-11-12
**Status**: Living document - update with each occurrence

---

## 🔴 Recurring Problem Pattern

E2E tests fail with authentication errors:
```
NotAuthorizedException: Incorrect username or password
```

This has occurred **at least 3 times** (PR #99, PR #102-103, and 2025-11-12).

---

## 🎯 Root Cause (Always the Same)

**GitHub Secrets become stale or mismatched with AWS Secrets Manager (the single source of truth).**

### How It Happens

1. Terraform generates random passwords and stores them in AWS Secrets Manager
2. GitHub Secrets are manually updated or synced once
3. **Over time**:
   - Passwords are reset in Cognito
   - Terraform regenerates passwords
   - AWS Secrets Manager gets updated
   - **GitHub Secrets are NOT updated** ← ROOT CAUSE
4. E2E tests use stale GitHub Secrets → authentication fails

---

## ✅ Solution (Quick Fix - 5 Minutes)

### Step 1: Get Current Passwords from AWS Secrets Manager

```bash
# Staging credentials
aws secretsmanager get-secret-value \
  --secret-id embark-quoting/staging/e2e-test-credentials \
  --query SecretString \
  --output text

# Production credentials (if needed)
aws secretsmanager get-secret-value \
  --secret-id embark-quoting/production/e2e-test-credentials \
  --query SecretString \
  --output text
```

### Step 2: Update GitHub Secrets

```bash
# Staging (use E2E_TEST_USER_PASSWORD for backwards compatibility)
gh secret set E2E_TEST_USER_EMAIL --body "e2e-test@embark-quoting.local"
gh secret set E2E_TEST_USER_PASSWORD --body "<password-from-aws>"

# Production (use E2E_PROD_USER_PASSWORD - see PR #102)
gh secret set E2E_PROD_USER_PASSWORD --body "<prod-password-from-aws>"
```

### Step 3: Trigger New Deployment

```bash
gh workflow run "Deploy to Staging" --ref dev
```

### Step 4: Verify Fix

Wait for E2E tests to complete (~4-5 minutes). They should now pass.

---

## 📋 Checklist for Troubleshooting

When E2E tests fail with auth errors, **DO NOT** immediately dive into code. Follow this high-level checklist:

- [ ] **Step 1**: Check AWS Secrets Manager for current passwords
- [ ] **Step 2**: Compare AWS passwords with GitHub Secrets
- [ ] **Step 3**: If different → Update GitHub Secrets
- [ ] **Step 4**: Trigger new deployment
- [ ] **Step 5**: Verify E2E tests pass
- [ ] **Step 6**: Update this document with date of fix

---

## 🔍 Architecture Overview

### Secret Flow (Normal Operation)

```
Terraform (random_password.e2e_test_user)
  ↓
AWS Secrets Manager (embark-quoting/{env}/e2e-test-credentials) ← SOURCE OF TRUTH
  ↓ (manual sync OR sync-github-secrets.sh)
GitHub Secrets (E2E_TEST_USER_PASSWORD, E2E_PROD_USER_PASSWORD)
  ↓
GitHub Actions Workflows (deploy-staging.yml, deploy-prod.yml)
  ↓
E2E Tests (Playwright)
  ↓
Cognito Authentication
```

### Where Desync Happens

**Weak Link**: AWS Secrets Manager → GitHub Secrets sync is NOT automated

**Why**:
- Terraform updates AWS Secrets Manager automatically
- GitHub Secrets require manual `gh secret set` commands
- **No automated sync workflow** (sync-github-secrets.sh requires manual trigger)

---

## 📝 Historical Occurrences

### Occurrence #1: PR #99 (2025-11-07)
- **Symptom**: Hardcoded passwords in tests didn't exist in Cognito
- **Fix**: Use environment variables from GitHub Secrets
- **Files**: `frontend/e2e/sync.spec.ts`, `.github/workflows/deploy-staging.yml`
- **PR**: https://github.com/IAMSamuelRodda/embark-quoting-system/pull/99

### Occurrence #2: PR #102-103 (2025-11-08)
- **Symptom**: Both production and staging failing with wrong passwords
- **Root Cause**: Single shared secret for two environments with different passwords
- **Fix**: Created environment-specific secrets (`E2E_PROD_USER_PASSWORD` vs `E2E_TEST_USER_PASSWORD`)
- **Files**: `.github/workflows/deploy-prod.yml`, `infrastructure/scripts/sync-github-secrets.sh`
- **PR**: https://github.com/IAMSamuelRodda/embark-quoting-system/pull/102
- **Documentation**: `archive/2025-11-08_E2E_LOGIN_FAILURE_FIX.md`

### Occurrence #3: 2025-11-12 (This Issue)
- **Symptom**: Staging E2E tests failing with "Incorrect username or password"
- **Root Cause**: GitHub Secrets (`E2E_TEST_USER_EMAIL`, `E2E_TEST_USER_PASSWORD`) contained stale credentials
- **Fix**: Updated secrets from AWS Secrets Manager
  - Email: `e2e-test@embark-quoting.local`
  - Password: `2UnkuFUrILJv8z)p` (from AWS Secrets Manager)
- **Deployment**: Run #19287263576
- **Resolution Time**: ~5 minutes (following checklist)

---

## 🛠️ Prevention Strategies

### Short-Term (Implemented)
- ✅ Environment-specific secrets (PR #102)
- ✅ AWS Secrets Manager as single source of truth
- ✅ Manual sync script (`infrastructure/scripts/sync-github-secrets.sh`)

### Medium-Term (Recommended)
- [ ] Add automated sync workflow that runs weekly
- [ ] Add pre-deployment secret validation step
- [ ] Create GitHub Action to compare AWS vs GitHub secrets

### Long-Term (Future Consideration)
- [ ] Investigate GitHub OIDC to AWS Secrets Manager direct access (eliminate GitHub Secrets)
- [ ] Add secret rotation monitoring/alerts

---

## 🔗 Related Resources

### GitHub PRs
- **PR #99**: E2E Authentication and CI/CD Secret Management
- **PR #102**: Separate E2E passwords for production and staging
- **PR #103**: Follow-up fix for staging Cognito client ID

### Documentation
- `archive/2025-11-08_E2E_LOGIN_FAILURE_FIX.md` - Detailed analysis from PR #102
- `docs/MANUAL_TESTING.md` - Environment-specific test credentials
- `.github/workflows/e2e-tests.yml` - Single source of truth for E2E testing

### AWS Resources
- Staging User Pool: `ap-southeast-2_D2t5oQs37`
- Production User Pool: `ap-southeast-2_v2Jk8B9EK`
- Secrets Manager: `embark-quoting/staging/e2e-test-credentials`
- Secrets Manager: `embark-quoting/production/e2e-test-credentials`

---

## 📊 Pattern Recognition

**If you see this error pattern again:**
1. **DO NOT** debug code first
2. **DO** check this document
3. **DO** follow the 5-minute quick fix checklist
4. **DO** update this document with new occurrence

**Time Saved**: ~20-30 minutes of debugging per occurrence

---

## ⚠️ Important Notes

### Secret Naming Convention

| Secret Name | Environment | Used By |
|-------------|-------------|---------|
| `E2E_TEST_USER_EMAIL` | Both | All workflows |
| `E2E_TEST_USER_PASSWORD` | Staging | `deploy-staging.yml`, `e2e-tests.yml` |
| `E2E_PROD_USER_PASSWORD` | Production | `deploy-prod.yml` |

### Workflow Secret Mapping

**deploy-staging.yml** (line 256-257):
```yaml
secrets:
  test-user-email: ${{ secrets.E2E_TEST_USER_EMAIL }}
  test-user-password: ${{ secrets.E2E_TEST_USER_PASSWORD }}
```

**e2e-tests.yml** (line 186-187):
```yaml
env:
  TEST_USER_EMAIL: ${{ secrets.test-user-email }}
  TEST_USER_PASSWORD: ${{ secrets.test-user-password }}
```

**test-utils.ts** (line 27-28):
```typescript
const emailFromEnv = process.env.TEST_USER_EMAIL;
const passwordFromEnv = process.env.TEST_USER_PASSWORD;
```

---

**Last Updated**: 2025-11-12
**Next Review**: After next occurrence (update this document!)
