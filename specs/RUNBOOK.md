# Operations Runbook - Embark Quoting System

**Purpose**: Step-by-step procedures for common operational tasks, troubleshooting, and incident response.

**Last Updated**: 2025-11-08
**Version**: 1.0.0

---

## Table of Contents

1. [Quick Reference](#quick-reference)
2. [Using Claude Code for Debugging](#using-claude-code-for-debugging)
3. [E2E Authentication Issues](#e2e-authentication-issues)
4. [Deployment Procedures](#deployment-procedures)
5. [Secrets Management](#secrets-management)
6. [Incident Response](#incident-response)
7. [Monitoring & Health Checks](#monitoring--health-checks)

---

## Quick Reference

### Environment URLs

| Environment | Frontend | Backend | Cognito Pool |
|-------------|----------|---------|--------------|
| **Production** | https://dtfaaynfdzwhd.cloudfront.net | embark-quoting-production-alb-*.elb.amazonaws.com | ap-southeast-2_v2Jk8B9EK |
| **Staging** | https://d1aekrwrb8e93r.cloudfront.net | embark-quoting-staging-alb-*.elb.amazonaws.com | ap-southeast-2_D2t5oQs37 |

### E2E Test Credentials

| Environment | Email | Password | Client ID |
|-------------|-------|----------|-----------|
| **Production** | e2e-test@embark-quoting.local | `M<##+Xu&B8hb%-10` | 47l7kej94osa5j0a1q6k754b8f |
| **Staging** | e2e-test@embark-quoting.local | `2UnkuFUrILJv8z)p` | 1li6qn77cs9m2f47pbg8qrd3at |

### GitHub Secrets

| Secret Name | Purpose | Environment |
|-------------|---------|-------------|
| `E2E_PROD_USER_PASSWORD` | Production E2E password | Production |
| `E2E_TEST_USER_PASSWORD` | Staging E2E password | Staging |
| `E2E_TEST_USER_EMAIL` | E2E test email (same for both) | Both |
| `PRODUCTION_COGNITO_CLIENT_ID` | Production Cognito client | Production |
| `PRODUCTION_COGNITO_USER_POOL_ID` | Production Cognito pool | Production |
| `STAGING_COGNITO_CLIENT_ID` | Staging Cognito client | Staging |
| `STAGING_COGNITO_USER_POOL_ID` | Staging Cognito pool | Staging |

---

## Using Claude Code for Debugging

### When to Use the debug-specialist Agent

For **complex, multi-system issues** where the root cause is unclear, delegate to the `debug-specialist` agent instead of manual troubleshooting.

**When to Use**:
- Authentication failures with unclear root cause
- Issues spanning multiple systems (Cognito, GitHub Secrets, Terraform, deployed frontend)
- Distributed state synchronization problems
- Production incidents requiring systematic investigation

**How to Invoke**:

```
In Claude Code, initiate the debug-specialist agent with a clear problem statement:

"Initiate the debug-specialist. E2E tests are failing with 'Incorrect username or password'
on both production and staging. Test account credentials are documented in specs/MANUAL_TESTING.md."
```

**What the Agent Does**:
1. Automatically invokes the `/systematic-debugging` skill
2. Applies 6-step scientific debugging methodology:
   - Reproduce the issue
   - Characterize the problem (gather evidence)
   - Hypothesize root causes
   - Experiment to test hypotheses
   - Analyze results
   - Verify the fix
3. Returns structured debugging report with:
   - Root cause analysis
   - Evidence gathered
   - Recommended fix with exact commands
   - Verification steps

**Example Output**:

The debug-specialist will return a report like:

```yaml
debug_summary:
  issue: Test accounts cannot login on production OR staging
  root_cause_category: Distributed state synchronization failure

root_cause:
  location: .github/workflows/deploy-prod.yml:293
  explanation: |
    GitHub workflow used single shared secret (E2E_TEST_USER_PASSWORD)
    for both environments, but each has different Cognito-generated password.

solution:
  fix: |
    ✅ Create E2E_PROD_USER_PASSWORD (production-specific)
    ✅ Update deploy-prod.yml to use E2E_PROD_USER_PASSWORD
    ✅ Update sync scripts to maintain both secrets
```

### Manual Debugging with /systematic-debugging Skill

For simpler issues where you want to apply systematic debugging yourself:

```
In Claude Code:

Skill(command: "systematic-debugging")
```

This loads the systematic debugging methodology which guides you through:

1. **Reproduce**: Confirm the issue occurs consistently
2. **Characterize**: Gather evidence (logs, configs, state)
3. **Hypothesize**: Form testable theories about root cause
4. **Experiment**: Test hypotheses with minimal changes
5. **Analyze**: Examine results and refine hypothesis
6. **Verify**: Confirm fix resolves original issue

**Key Principle**: Treat debugging like science - form hypotheses, test them systematically, avoid making multiple changes at once.

### Historical Debugging Reports

See `docs/debugging/` for past incident reports:
- `2025-11-08-e2e-login-failure-fix.md` - Production E2E authentication fix
- `staging-cognito-client-fix.md` - Staging client ID correction

These demonstrate the systematic debugging approach and can serve as templates.

---

## E2E Authentication Issues

> **💡 Pro Tip**: For complex authentication issues with unclear root cause, consider using the `debug-specialist` agent (see [Using Claude Code for Debugging](#using-claude-code-for-debugging) above). The procedures below are for when you know the specific issue.

### Problem: "Incorrect username or password" on E2E Tests

**Symptoms**:
- E2E tests failing with authentication errors
- Manual login fails with test credentials
- Error: "NotAuthorizedException: Incorrect username or password"

**Root Causes**:
1. Wrong password for environment (production vs staging)
2. Cognito password out of sync with AWS Secrets Manager
3. Wrong Cognito client ID in GitHub Secrets
4. User not in CONFIRMED status

**Diagnostic Steps**:

#### 1. Verify Cognito User Exists and Status

```bash
# Production
aws cognito-idp admin-get-user \
  --user-pool-id ap-southeast-2_v2Jk8B9EK \
  --username e2e-test@embark-quoting.local \
  --region ap-southeast-2

# Staging
aws cognito-idp admin-get-user \
  --user-pool-id ap-southeast-2_D2t5oQs37 \
  --username e2e-test@embark-quoting.local \
  --region ap-southeast-2
```

**Expected Output**:
- `UserStatus`: `CONFIRMED`
- `Enabled`: `true`

#### 2. Verify Password in AWS Secrets Manager

```bash
# Production
aws secretsmanager get-secret-value \
  --secret-id embark-quoting/production/e2e-test-credentials \
  --region ap-southeast-2 \
  --query 'SecretString' --output text | jq -r '.password'

# Staging
aws secretsmanager get-secret-value \
  --secret-id embark-quoting/staging/e2e-test-credentials \
  --region ap-southeast-2 \
  --query 'SecretString' --output text | jq -r '.password'
```

#### 3. Verify Cognito Client IDs

```bash
# Production
aws cognito-idp list-user-pool-clients \
  --user-pool-id ap-southeast-2_v2Jk8B9EK \
  --region ap-southeast-2

# Staging
aws cognito-idp list-user-pool-clients \
  --user-pool-id ap-southeast-2_D2t5oQs37 \
  --region ap-southeast-2
```

**Expected Output**:
- **Production**: `47l7kej94osa5j0a1q6k754b8f`
- **Staging**: `1li6qn77cs9m2f47pbg8qrd3at`

#### 4. Verify GitHub Secrets

```bash
gh secret list --repo IAMSamuelRodda/embark-quoting-system | grep -E "(COGNITO|E2E)"
```

**Expected Secrets**:
- `E2E_PROD_USER_PASSWORD`
- `E2E_TEST_USER_PASSWORD`
- `E2E_TEST_USER_EMAIL`
- `PRODUCTION_COGNITO_CLIENT_ID`
- `PRODUCTION_COGNITO_USER_POOL_ID`
- `STAGING_COGNITO_CLIENT_ID`
- `STAGING_COGNITO_USER_POOL_ID`

**Resolution**:

#### Option A: Reset Cognito Password to Match Secrets Manager

```bash
# Get password from Secrets Manager
PROD_PASSWORD=$(aws secretsmanager get-secret-value \
  --secret-id embark-quoting/production/e2e-test-credentials \
  --region ap-southeast-2 \
  --query 'SecretString' --output text | jq -r '.password')

# Reset Cognito user password
aws cognito-idp admin-set-user-password \
  --user-pool-id ap-southeast-2_v2Jk8B9EK \
  --username e2e-test@embark-quoting.local \
  --password "$PROD_PASSWORD" \
  --permanent \
  --region ap-southeast-2
```

#### Option B: Update GitHub Secrets

```bash
# Update production E2E password
echo "M<##+Xu&B8hb%-10" | gh secret set E2E_PROD_USER_PASSWORD \
  --repo IAMSamuelRodda/embark-quoting-system

# Update staging E2E password
echo "2UnkuFUrILJv8z)p" | gh secret set E2E_TEST_USER_PASSWORD \
  --repo IAMSamuelRodda/embark-quoting-system

# Update client IDs
echo "47l7kej94osa5j0a1q6k754b8f" | gh secret set PRODUCTION_COGNITO_CLIENT_ID \
  --repo IAMSamuelRodda/embark-quoting-system

echo "1li6qn77cs9m2f47pbg8qrd3at" | gh secret set STAGING_COGNITO_CLIENT_ID \
  --repo IAMSamuelRodda/embark-quoting-system
```

#### Option C: Redeploy Frontend with Correct Cognito Client ID

If client ID was wrong, frontend must be rebuilt:

```bash
# For staging: Push to dev branch (triggers auto-deployment)
git checkout dev
git push origin dev

# For production: Needs manual deployment or tag
gh workflow run deploy-prod.yml
```

**Verification**:

```bash
# Test login manually
open https://dtfaaynfdzwhd.cloudfront.net  # Production
# Use: e2e-test@embark-quoting.local / M<##+Xu&B8hb%-10

open https://d1aekrwrb8e93r.cloudfront.net  # Staging
# Use: e2e-test@embark-quoting.local / 2UnkuFUrILJv8z)p
```

---

## Deployment Procedures

### Standard Deployment Flow

```
Feature Branch → PR → dev → Auto-deploy to staging
                             ↓
                        (Verify on staging)
                             ↓
                        dev → PR → main → Tag → Deploy to production
```

### Deploying to Staging

**Trigger**: Automatic on push to `dev` branch

```bash
# Merge feature branch to dev
git checkout dev
git pull origin dev
git merge feature/my-feature
git push origin dev

# Deployment workflow triggers automatically
# Monitor: https://github.com/IAMSamuelRodda/embark-quoting-system/actions
```

**Governance Check**: The `deploy-staging.yml` workflow enforces dev-branch-only deployment.

### Deploying to Production

**Trigger**: Manual via tag creation

```bash
# 1. Merge dev to main (via PR)
gh pr create --base main --head dev --title "Release: v1.x.x"

# 2. Wait for PR checks to pass
gh pr checks <PR-number> --watch

# 3. Merge PR
gh pr merge <PR-number> --merge

# 4. Create tag for deployment
git checkout main
git pull origin main
git tag v1.0.1
git push origin v1.0.1

# Deployment workflow triggers automatically on tag push
```

### Emergency Hotfix

```bash
# 1. Create hotfix branch from main
git checkout main
git checkout -b hotfix/critical-bug

# 2. Make fix and commit
git add .
git commit -m "hotfix: critical bug description"

# 3. PR to dev first (test on staging)
git push origin hotfix/critical-bug
gh pr create --base dev --title "Hotfix: Critical bug"

# 4. After staging verification, PR to main
gh pr create --base main --title "Hotfix: Critical bug (verified on staging)"

# 5. Tag for immediate production deployment
git checkout main
git pull origin main
git tag v1.0.2
git push origin v1.0.2
```

---

## Secrets Management

### Syncing Secrets from Terraform to GitHub

**Script**: `infrastructure/scripts/sync-github-secrets.sh`

```bash
cd infrastructure/scripts
./sync-github-secrets.sh
```

**What It Syncs**:
- `STAGING_API_URL` (from Terraform output)
- `PRODUCTION_API_URL` (from Terraform output)
- `E2E_PROD_USER_PASSWORD` (from AWS Secrets Manager)
- `E2E_TEST_USER_PASSWORD` (from AWS Secrets Manager)

**Manual Sync**:

```bash
# Get production E2E password from Secrets Manager
PROD_PASSWORD=$(aws secretsmanager get-secret-value \
  --secret-id embark-quoting/production/e2e-test-credentials \
  --region ap-southeast-2 \
  --query 'SecretString' --output text | jq -r '.password')

# Set GitHub Secret
echo "$PROD_PASSWORD" | gh secret set E2E_PROD_USER_PASSWORD \
  --repo IAMSamuelRodda/embark-quoting-system
```

### Viewing Secrets

```bash
# List all GitHub Secrets
gh secret list --repo IAMSamuelRodda/embark-quoting-system

# View AWS Secrets Manager secret (value visible)
aws secretsmanager get-secret-value \
  --secret-id embark-quoting/production/e2e-test-credentials \
  --region ap-southeast-2 \
  --query 'SecretString' --output text | jq .
```

---

## Incident Response

> **🚨 Complex Incidents**: For multi-system failures or when root cause is unclear, initiate the `debug-specialist` agent with the problem statement and let it apply systematic debugging methodology. See [Using Claude Code for Debugging](#using-claude-code-for-debugging).

### Incident: E2E Tests Failing in CI/CD

**Severity**: Medium (blocks deployments)

**Quick Check**:
```bash
# Check recent GitHub Actions runs
gh run list --workflow=deploy-staging.yml --limit 3
gh run view <RUN-ID> --log-failed
```

**Investigation**:

1. Check GitHub Actions logs for specific error
2. Look for authentication errors (Cognito)
3. Check if frontend Cognito config is correct
4. Verify E2E user exists and is CONFIRMED

**Resolution**:
- If authentication error: See [E2E Authentication Issues](#e2e-authentication-issues)
- If unclear root cause: Initiate `debug-specialist` agent

### Incident: Production Login Failing for All Users

**Severity**: Critical (production down)

**Investigation**:

1. Check Cognito service health
2. Verify Cognito user pool exists
3. Check frontend→Cognito connectivity
4. Review CloudWatch logs for errors

**Resolution**:

```bash
# 1. Verify Cognito pool exists
aws cognito-idp describe-user-pool \
  --user-pool-id ap-southeast-2_v2Jk8B9EK \
  --region ap-southeast-2

# 2. Check frontend config (baked at build time)
curl -s https://dtfaaynfdzwhd.cloudfront.net/ | grep -i cognito

# 3. If config wrong, redeploy frontend
gh workflow run deploy-prod.yml
```

### Incident: Staging Deployment Triggered from Main Branch

**Severity**: Medium (governance violation)

**Symptoms**:
- Staging deployment running from main branch
- Governance check should have prevented this

**Investigation**:

```bash
# Check recent staging deployments
gh run list --workflow=deploy-staging.yml --limit 5
```

**Resolution**:

```bash
# Cancel errant deployment
gh run cancel <RUN-ID>

# Verify branch enforcement exists in deploy-staging.yml
grep -A5 "Enforce dev branch only" .github/workflows/deploy-staging.yml
```

**Prevention**: See `docs/GOVERNANCE.md` for branch strategy.

---

## Monitoring & Health Checks

### Backend Health Check

```bash
# Production
curl http://embark-quoting-production-alb-185300723.ap-southeast-2.elb.amazonaws.com/health

# Staging
curl http://embark-quoting-staging-alb-211615053.ap-southeast-2.elb.amazonaws.com/health
```

**Expected Response**:
```json
{
  "status": "ok",
  "timestamp": "2025-11-08T10:00:00.000Z",
  "service": "embark-quoting-backend",
  "version": "1.0.0",
  "environment": "production|staging",
  "database": "connected"
}
```

### Frontend Availability

```bash
# Production
curl -I https://dtfaaynfdzwhd.cloudfront.net

# Staging
curl -I https://d1aekrwrb8e93r.cloudfront.net
```

**Expected**: HTTP 200 OK

### ECS Service Status

```bash
# Production
aws ecs describe-services \
  --cluster embark-quoting-production-cluster \
  --services embark-quoting-production-backend-service \
  --region ap-southeast-2 \
  --query 'services[0].{status:status,running:runningCount,desired:desiredCount}'

# Staging
aws ecs describe-services \
  --cluster embark-quoting-staging-cluster \
  --services embark-quoting-staging-backend-service \
  --region ap-southeast-2 \
  --query 'services[0].{status:status,running:runningCount,desired:desiredCount}'
```

### CloudWatch Logs

```bash
# Production backend logs (tail)
aws logs tail /ecs/embark-quoting-production-backend \
  --follow \
  --region ap-southeast-2

# Staging backend logs (tail)
aws logs tail /ecs/embark-quoting-staging-backend \
  --follow \
  --region ap-southeast-2
```

### GitHub Actions Status

```bash
# Recent workflow runs
gh run list --limit 10

# Watch specific run
gh run watch <RUN-ID>

# View failed run logs
gh run view <RUN-ID> --log-failed
```

---

## Related Documentation

- **Governance**: `docs/GOVERNANCE.md` - Branch strategy and deployment controls
- **Manual Testing**: `specs/MANUAL_TESTING.md` - Step-by-step testing procedures
- **Debugging Reports**: `docs/debugging/` - Historical incident reports
- **Contributing**: `CONTRIBUTING.md` - Workflow for developers

---

**Last Updated**: 2025-11-08
**Maintained By**: DevOps Team
**Contact**: See GitHub Issues for support
