# E2E Test CI/Local Parity Issue

## Problem Statement
E2E tests pass locally but fail in CI staging deployments. This is "disappointingly common" and creates false negative test failures that block deployments.

## Root Causes Identified

### 1. Configuration Drift (Stale Secrets)
- **Symptom**: Tests pass locally with correct AWS Secrets Manager credentials, fail in CI with stale GitHub Secrets
- **Example**: Today's run #19287263576 used old credentials despite local tests passing
- **Fix Applied**: Update GitHub Secrets from AWS Secrets Manager (now automated in deploy workflow)
- **Prevention**: Auto-update secrets in deploy workflow (line 139-147 in deploy-staging.yml)

### 2. Infrastructure State Mismatch  
- **Symptom**: Local dev uses mock/local backend (HTTP), staging uses real backend (needs HTTPS)
- **Example**: Mixed Content errors in CI but not locally
- **Fix Pending**: PR #128 (CloudFront HTTPS termination)
- **Prevention**: Match local environment more closely to staging (use HTTPS locally?)

### 3. Environment Variable Propagation Delay
- **Symptom**: Deployment starts → secrets updated mid-deploy → frontend build uses old values
- **Example**: STAGING_API_URL updated at 05:23:53 but deploy started 05:20:20
- **Fix Needed**: Ensure secrets updated BEFORE frontend build step
- **Prevention**: Check secret freshness before deployment

## Proposed Solutions

### Short-Term (Immediate)
1. ✅ **Wait for current PRs to merge** (#127, #128, #129)
2. ✅ **Apply terraform changes** (creates CloudFront for HTTPS)
3. ✅ **Trigger fresh deployment** after infrastructure settled
4. ⏳ **Document CI/local environment differences** in DEVELOPMENT.md

### Medium-Term (Next Sprint)
1. **Pre-deployment Secret Validation**
   - Add workflow step to verify secrets match AWS Secrets Manager
   - Fail fast if credentials are stale (instead of running tests with bad config)

2. **Local Environment Parity**
   - Update dev-start.sh to use HTTPS locally (self-signed cert?)
   - Document environment variable differences (local vs CI)

3. **Deployment Health Gate**
   - Don't run E2E tests until deployment fully settled (all secrets updated, CloudFront propagated)
   - Add explicit "wait for infrastructure ready" step

### Long-Term (Future)
1. **Eliminate GitHub Secrets for Credentials**
   - Use AWS OIDC to access Secrets Manager directly from workflows
   - Single source of truth (no sync lag)

2. **Environment Snapshots**
   - Capture working local environment config
   - Compare against CI environment before tests
   - Alert on mismatches

## Action Items
- [ ] Merge PR #127 (E2E auth troubleshooting guide)
- [ ] Merge PR #128 (CloudFront HTTPS fix)
- [ ] Merge PR #129 (Auto-merge policy)
- [ ] Apply terraform changes (create CloudFront distribution)
- [ ] Trigger fresh staging deployment
- [ ] Create GitHub issue for "Pre-deployment Secret Validation" task
- [ ] Document CI/local environment differences in DEVELOPMENT.md
