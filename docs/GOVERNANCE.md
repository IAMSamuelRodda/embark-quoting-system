# Repository Governance & Branch Strategy

**Purpose**: Enforce strict branch protection and deployment controls to prevent accidental staging deployments from main branch.

---

## Branch Strategy

```
Feature branches → PR → dev → Auto-deploy to staging
                              ↓
                         (After verification)
                              ↓
                         dev → PR → main → Tag → Deploy to production
```

### Branch Hierarchy

1. **Feature branches** (`fix/*`, `feat/*`, `chore/*`)
   - Created from `dev`
   - Merged to `dev` via PR
   - Require all status checks to pass

2. **`dev` branch** (Integration & Staging)
   - Protected branch
   - Requires 10 status checks
   - Auto-deploys to staging on every push
   - Must be up-to-date with base before merge
   - **ONLY** source branch for `main` PRs

3. **`main` branch** (Production)
   - **Most protected** branch
   - Requires 6 status checks
   - Enforce rules for admins
   - **ONLY** accepts PRs from `dev` (see Branch Protection Rules below)
   - Tags trigger production deployment

---

## Deployment Controls

### Staging Deployment (`deploy-staging.yml`)

**Triggers:**
- ✅ Automatic: Push to `dev` branch
- ⚠️  Manual: `workflow_dispatch` (restricted to `dev` branch only)

**Branch Enforcement:**
```yaml
# Workflow includes explicit branch check
- name: Enforce dev branch only
  run: |
    if [ "${{ github.ref }}" != "refs/heads/dev" ]; then
      echo "❌ ERROR: Staging deployments must run from 'dev' branch only"
      exit 1
    fi
```

**Why**: Prevents accidental staging deployments from `main` or feature branches.

### Production Deployment (`deploy-prod.yml`)

**Triggers:**
- ✅ Tags matching `v*` pattern only

**Why**: Production deployments are intentional, versioned releases only.

---

## Branch Protection Rules

### Required Protection for `main`

**Current Configuration:**
```json
{
  "required_status_checks": {
    "strict": true,
    "checks": [
      "Lint & Format Check (backend)",
      "Lint & Format Check (frontend)",
      "Security Scan (backend)",
      "Security Scan (frontend)",
      "TypeScript Type Check",
      "Build Frontend"
    ]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": null,
  "restrictions": null  // ❌ NEEDS FIX
}
```

### ⚠️ CRITICAL: Missing Branch Restrictions

**Problem**: Main currently accepts PRs from ANY branch (including feature branches).

**Required Fix**: Configure branch restrictions to **only allow PRs from `dev`**.

**How to Fix** (GitHub Web UI):
1. Go to Settings → Branches → Branch protection rules → `main`
2. Enable "Restrict who can push to matching branches"
3. Add rule: "Require pull request reviews before merging"
4. Under "Require pull request", enable "Require approval from specific teams/users"
5. **CRITICAL**: Add custom protection rule to only allow merges from `dev` branch

**Note**: GitHub API doesn't support restricting source branches for PRs directly. This must be enforced through:
- Repository settings (branch protection)
- CODEOWNERS file (require dev maintainers approval)
- GitHub Actions workflows (check source branch in PR validation)

### Recommended Protection for `dev`

```json
{
  "required_status_checks": {
    "strict": true,
    "checks": [
      "Lint & Format Check (backend)",
      "Lint & Format Check (frontend)",
      "Security Scan (backend)",
      "Security Scan (frontend)",
      "TypeScript Type Check",
      "Unit Tests (backend)",
      "Unit Tests (frontend)",
      "Integration Tests (Backend)",
      "Build Backend Docker Image",
      "Build Frontend"
    ]
  },
  "enforce_admins": true  // ⚠️ Currently false
}
```

---

## Incident: Staging Deployment from Main

**Date**: 2025-11-08
**Issue**: `deploy-staging.yml` was manually triggered from `main` branch via `workflow_dispatch`

### Root Cause
1. `workflow_dispatch` trigger had no branch restriction in YAML
2. GitHub Actions allows `workflow_dispatch` from any branch by default
3. No explicit branch check in workflow steps

### Resolution
1. ✅ Cancelled errant deployment (Run #19191777803)
2. ✅ Added "Enforce dev branch only" step to both jobs in `deploy-staging.yml`
3. ✅ Created this governance document
4. ⏳ **TODO**: Configure branch restrictions on `main` to only accept PRs from `dev`

### Prevention
- Workflow now fails fast if run from wrong branch
- Document clarifies branch strategy
- Branch protection rules (when configured) will prevent direct pushes

---

## Workflow for Developers

### Making Changes

```bash
# 1. Create feature branch from dev
git checkout dev
git pull origin dev
git checkout -b feat/my-feature

# 2. Make changes, commit, push
git add .
git commit -m "feat: add new feature"
git push -u origin feat/my-feature

# 3. Create PR to dev (NOT main!)
gh pr create --base dev --title "Add new feature"

# 4. After PR merges to dev, staging auto-deploys
# (No manual action needed)

# 5. After verification on staging, create release PR
git checkout dev
git pull origin dev
gh pr create --base main --title "Release v1.2.3"

# 6. After PR merges to main, tag for production
git checkout main
git pull origin main
git tag v1.2.3
git push origin v1.2.3
```

### Hotfix to Production

```bash
# For urgent production fixes, still use dev → main flow
git checkout dev
git pull origin dev
git checkout -b hotfix/critical-bug

# Make fix, commit, push
git push -u origin hotfix/critical-bug

# PR to dev first (test on staging)
gh pr create --base dev --title "Hotfix: critical bug"

# After staging verification, PR to main
gh pr create --base main --title "Hotfix: critical bug (verified on staging)"

# Tag for immediate production deployment
git tag v1.2.4
git push origin v1.2.4
```

---

## Summary

**Golden Rules:**
1. ✅ Feature branches → `dev` (via PR)
2. ✅ `dev` → `main` (via PR, after staging verification)
3. ❌ **NEVER** feature branch → `main` directly
4. ❌ **NEVER** manually trigger `deploy-staging.yml` from non-dev branches
5. ✅ Production deploys ONLY via tags on `main`

**Status:**
- ✅ Workflow branch checks implemented
- ⏳ Branch protection rules need manual configuration
- ✅ Governance documented

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-11-08 | Initial governance document | Claude Code (debug-specialist) |
| 2025-11-08 | Added branch enforcement to deploy-staging.yml | Claude Code |
