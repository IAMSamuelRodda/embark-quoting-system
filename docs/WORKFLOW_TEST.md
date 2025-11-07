# Workflow Migration Complete

This document confirms the feature→dev→main workflow is active and tested.

## Branch Protection Configured
- **Main**: Requires PR approval + CI checks (production releases)
- **Dev**: Requires CI checks only (auto-merge enabled)
- **Auto-merge**: Enabled for feature→dev PRs (merge commits)

## Test Status
✅ Direct push to main blocked
✅ Feature branch PR #81 merged automatically when all checks passed
✅ Feature branch auto-deleted after merge
✅ Staging deployment triggered on dev branch merge
✅ E2E tests run correctly (6 auth-validation tests, ~30s)
✅ Production deployment workflow created

## Workflow Configuration Summary

### Feature → Dev (Auto-Merge, Staging Deployment)
- **Trigger**: PR to `dev` branch
- **Required checks**: 10 status checks
  - Lint & Format Check (backend/frontend)
  - Security Scan (backend/frontend)
  - TypeScript Type Check
  - Unit Tests (backend/frontend)
  - Integration Tests (backend)
  - Build Backend Docker Image
  - Build Frontend
- **Approval**: **None required** (auto-merge when CI passes)
- **Merge method**: **Merge commit** (preserves full commit history)
- **Auto-delete branch**: ✅ Enabled
- **Post-merge**: Automatically deploys to **staging** environment
  - Backend → AWS ECS (staging cluster)
  - Frontend → S3/CloudFront (staging)
  - Runs E2E auth-validation tests (6 tests, ~1m30s)
  - Lighthouse performance audit

### Dev → Main (Manual Approval, Production Deployment)
- **Trigger**: PR to `main` branch
- **Required checks**: 6 status checks (smoke tests only)
  - Lint & Format Check (backend/frontend)
  - Security Scan (backend/frontend)
  - TypeScript Type Check
  - Build Frontend
- **Approval**: **1 reviewer required** (human-in-the-loop for production releases)
- **Merge method**: **Merge commit**
- **Auto-delete branch**: ✅ Enabled
- **Post-merge**: Automatically deploys to **production** environment
  - Backend → AWS ECS (production cluster)
  - Frontend → S3/CloudFront (production)
  - Runs production smoke tests (auth-validation, ~3min max)
  - Lighthouse performance audit with stricter thresholds
  - Deployment notifications (TODO: Slack/email)

## Deployment Pipeline Flow

```
Feature Branch  →  Dev Branch  →  Main Branch
      ↓               ↓               ↓
  (No deploy)    Staging Env    Production Env
                 (auto)          (auto after approval)
```

### Staging Environment
- **Purpose**: Integration testing, QA validation, stakeholder review
- **Trigger**: Every push to `dev` branch (after feature PR auto-merges)
- **Tests**: Full E2E auth-validation suite (6 critical tests)
- **Access**: Internal team, test users
- **Rollback**: Redeploy previous commit to dev branch
- **URL**: https://staging.embark-quoting.com (TODO: configure)

### Production Environment
- **Purpose**: Live customer-facing application
- **Trigger**: Every push to `main` branch (after dev→main PR approval)
- **Tests**: Smoke tests only (critical path validation)
- **Access**: Public customers
- **Rollback**: Emergency manual deployment via `workflow_dispatch`
- **URL**: https://embark-quoting.com (TODO: configure)

## Developer Workflow

### Standard Feature Development

```bash
# 1. Create feature branch from dev
git checkout dev
git pull origin dev
git checkout -b feature/add-quote-pricing

# 2. Develop and commit
# ... make changes ...
git add .
git commit -m "feat: add quote pricing calculations (Closes #XX)"

# 3. Push and create PR to dev
git push -u origin feature/add-quote-pricing
gh pr create --base dev --title "Add quote pricing calculations" --body "Closes #XX"

# 4. Wait for auto-merge (no action needed!)
# - CI runs automatically (10 checks)
# - PR merges when all checks pass
# - Feature branch auto-deleted
# - Staging deployment triggers automatically
```

### Production Release

```bash
# 1. Create PR from dev to main (after features are tested on staging)
gh pr create --base main --head dev --title "Release v1.2.0" --body "..."

# 2. Request review from team lead/senior developer

# 3. Reviewer approves PR

# 4. Merge to main (triggers production deployment)
gh pr merge --merge  # or use GitHub UI

# 5. Monitor production deployment
gh run list --branch main --workflow "Deploy to Production" --limit 1
gh run watch <run-id>
```

## Emergency Procedures

### Rollback Staging Deployment

```bash
# Find commit to rollback to
git log origin/dev --oneline -10

# Reset dev branch to previous commit
git checkout dev
git reset --hard <previous-commit-sha>
git push origin dev --force

# Staging redeploys automatically
```

### Rollback Production Deployment

```bash
# Option 1: Revert via new commit (preferred)
git checkout main
git revert <bad-commit-sha>
git push origin main

# Option 2: Emergency manual deployment
gh workflow run deploy-production.yml
```

## Tested Scenarios

| Scenario | Status | Details |
|----------|--------|---------|
| Direct push to main | ✅ Blocked | Branch protection prevents direct pushes |
| Feature → Dev PR (all checks pass) | ✅ Auto-merged | PR #81 merged automatically in <1min after checks |
| Feature branch auto-delete | ✅ Working | Branch deleted immediately after merge |
| Staging deployment trigger | ✅ Working | Deploy-staging workflow runs on dev push |
| E2E tests on staging | ✅ Working | 6 auth tests complete in ~1m30s (no timeout) |
| Production workflow created | ✅ Ready | deploy-production.yml ready for main branch pushes |

## Next Steps

1. **Complete AWS infrastructure setup**:
   - Production ECS cluster, task definitions
   - Production S3 bucket, CloudFront distribution
   - Production Cognito user pool
   - Add production secrets to GitHub

2. **Test dev→main workflow**:
   - Create test PR from dev to main
   - Verify manual approval requirement
   - Verify production deployment (when infrastructure ready)

3. **Add deployment notifications**:
   - Slack webhook for production deployments
   - Email notifications for deployment failures

4. **Configure monitoring**:
   - CloudWatch alarms for production
   - Deployment tracking in observability platform

See `CONTRIBUTING.md` and `DEVELOPMENT.md` for detailed workflow documentation.
