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
- ✅ Tags matching `staging-v*` or `staging-*` pattern (e.g., `staging-v1.2.3`)
- ⚠️  Manual: `workflow_dispatch`

**Workflow:**
1. Merge feature branches to `dev` (accumulate multiple features)
2. When ready to test on staging, create and push a staging tag:
   ```bash
   git checkout dev
   git pull
   git tag staging-v1.2.3
   git push origin staging-v1.2.3
   ```
3. Staging deployment includes:
   - Backend deployment to ECS
   - Frontend deployment to S3/CloudFront
   - Comprehensive E2E test suite
   - Lighthouse performance audit

**Tag Formats:**
- `staging-v1.2.3` - Semantic versioning (recommended)
- `staging-20250109` - Date-based
- `staging-feature-name` - Feature-based

**Why**: Tag-based deployment prevents accidental deployments and provides explicit deployment history.

### Production Deployment (`deploy-prod.yml`)

**Triggers:**
- ✅ Tags matching `v*` pattern only (e.g., `v1.0.0`)

**Workflow:**
```bash
git checkout main
git pull
git tag v1.0.0
git push origin v1.0.0
```

**Why**: Production deployments are intentional, versioned releases only.

---

## Branch Protection Rules

> **Action Required**: Configure these branch protection rules in GitHub UI at:
> https://github.com/IAMSamuelRodda/embark-quoting-system/settings/branches

### Main Branch Protection (`main`)

#### Settings to Configure

**Protect matching branches:**
- ✅ **Require a pull request before merging**
  - ✅ Require approvals: **1**
  - ✅ Require approval of the most recent reviewable push

**Require status checks to pass before merging:**
- ✅ **Require status checks to pass before merging**
  - ✅ Require branches to be up to date before merging
  - **Required status checks:**
    - `validate / lint`
    - `validate / security`
    - `validate / typecheck`
    - `build / build-backend`
    - `build / build-frontend`

**Other Settings:**
- ✅ **Do not allow bypassing the above settings**
- ✅ **Include administrators** (ensures you go through PR process)
- ❌ Do not allow force pushes
- ❌ Do not allow deletions

#### ⚠️ Source Branch Restriction

**Problem**: GitHub doesn't support enforcing "PRs only from `dev`" via UI.

**Workaround**: Use PR validation in CI (validate source branch) or code review discipline.

### Dev Branch Protection (`dev`)

#### Settings to Configure

**Require status checks to pass before merging:**
- ✅ **Require status checks to pass before merging**
  - ✅ Require branches to be up to date before merging
  - **Required status checks:**
    - `validate / lint`
    - `validate / security`
    - `validate / typecheck`
    - `test / unit-tests`
    - `test / integration-tests`
    - `build / build-backend`
    - `build / build-frontend`

**Other Settings:**
- ❌ Do not require pull request (allows direct push for hotfixes)
- ❌ Do not enforce for administrators (allows admin bypass)
- ❌ Do not allow force pushes
- ❌ Do not allow deletions

### Status Check Names Reference

These are the exact status check names from GitHub Actions workflows:

**From `validate.yml`:**
- `validate / lint`
- `validate / security`
- `validate / secrets-scan`
- `validate / typecheck`

**From `test.yml`:**
- `test / unit-tests`
- `test / integration-tests`
- `test / coverage-check`

**From `build.yml`:**
- `build / build-backend`
- `build / build-frontend`
- `build / bundle-analysis`

**Note**: Deployment workflows (`deploy-staging`, `deploy-prod`) run post-merge, not as PR checks.

---

## Auto-Merge Configuration

To enable auto-merge for PRs (so feature→dev PRs merge automatically when CI passes):

1. Go to repository **Settings** → **General**
2. Scroll to **Pull Requests** section
3. Check: **Allow auto-merge**
4. Check: **Automatically delete head branches** (cleans up feature branches after merge)

---

## Verifying Branch Protection

After configuring, test the workflow:

```bash
# 1. Try pushing directly to main (should fail)
git checkout main
echo "test" >> README.md
git commit -am "test: direct push to main"
git push origin main
# Expected: ❌ "required status checks" error

# 2. Create feature PR to dev (should auto-merge after CI)
git checkout dev
git checkout -b feature/test-protection
echo "test" >> README.md
git commit -am "test: branch protection"
git push -u origin feature/test-protection
gh pr create --base dev --title "Test Branch Protection" --body "Testing CI checks"
# Expected: PR merges automatically when CI passes

# 3. Create dev→main PR (should require approval)
gh pr create --base main --head dev --title "Test Release" --body "Testing release workflow"
# Expected: PR requires your approval before merging
```

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

# 4. After PR merges to dev, test locally or wait for staging deployment

# 5. When ready to deploy to staging, create staging tag
git checkout dev
git pull origin dev
git tag staging-v1.2.3
git push origin staging-v1.2.3
# This triggers deploy-staging.yml with E2E tests

# 6. After verification on staging, create release PR
gh pr create --base main --head dev --title "Release v1.2.3"

# 7. After PR merges to main, tag for production
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

# After PR merges, create staging tag to verify
git checkout dev
git pull origin dev
git tag staging-hotfix-v1.2.4
git push origin staging-hotfix-v1.2.4

# After staging verification, PR to main
gh pr create --base main --head dev --title "Hotfix: critical bug (verified on staging)"

# After PR merges, tag for immediate production deployment
git checkout main
git pull origin main
git tag v1.2.4
git push origin v1.2.4
```

---

## Summary

**Golden Rules:**
1. ✅ Feature branches → `dev` (via PR)
2. ✅ `dev` → Staging (via `staging-v*` tags)
3. ✅ `dev` → `main` (via PR, after staging verification)
4. ❌ **NEVER** feature branch → `main` directly
5. ✅ Staging deploys ONLY via `staging-*` tags
6. ✅ Production deploys ONLY via `v*` tags on `main`

**Status:**
- ✅ Tag-based deployment implemented
- ⏳ Branch protection rules need manual configuration
- ✅ Governance documented

---

## Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-11-08 | Initial governance document | Claude Code (debug-specialist) |
| 2025-11-08 | Added branch enforcement to deploy-staging.yml | Claude Code |
| 2025-11-09 | Updated to tag-based staging deployment | Claude Code |
| 2025-11-09 | Consolidated BRANCH_PROTECTION.md content | Claude Code |
