# Branch Protection Rules Setup

> **Action Required**: Configure these branch protection rules in GitHub UI

This document provides the exact settings needed for GitHub branch protection rules to enforce the feature→dev→main workflow.

---

## How to Configure

1. Go to: https://github.com/IAMSamuelRodda/embark-quoting-system/settings/branches
2. For each branch (`main` and `dev`), configure the rules below

---

## Main Branch Protection (`main`)

### Branch Name Pattern
```
main
```

### Settings

#### Protect matching branches
- [x] **Require a pull request before merging**
  - [x] Require approvals: **1**
  - [ ] Dismiss stale pull request approvals when new commits are pushed
  - [ ] Require review from Code Owners
  - [ ] Restrict who can dismiss pull request reviews _(leave unchecked)_
  - [x] **Require approval of the most recent reviewable push**
  - [ ] Require conversation resolution before merging _(optional - your choice)_

#### Require status checks to pass before merging
- [x] **Require status checks to pass before merging**
  - [x] Require branches to be up to date before merging
  - **Required status checks** (select these from the list):
    - `validate / lint`
    - `validate / security`
    - `validate / typecheck`
    - `build / build-backend` _(if you want to enforce this on main)_
    - `build / build-frontend`

#### Other Settings
- [ ] Require conversation resolution before merging _(optional)_
- [ ] Require signed commits _(optional - adds security)_
- [ ] Require linear history _(optional - cleaner history)_
- [ ] Require deployments to succeed before merging _(leave unchecked)_
- [x] **Do not allow bypassing the above settings** _(critical!)_
  - Note: This prevents you from accidentally pushing directly to main
  - You can still bypass via GitHub UI "Merge without waiting for requirements" button if absolutely necessary

#### Rules applied to everyone including administrators
- [x] **Include administrators** _(critical!)_
  - This ensures you go through the PR process even with admin permissions

#### Restrictions
- [ ] Restrict who can push to matching branches _(leave unchecked - too restrictive for solo dev)_

#### Allow force pushes
- [ ] **Do not** allow force pushes

#### Allow deletions
- [ ] **Do not** allow deletions

---

## Dev Branch Protection (`dev`)

### Branch Name Pattern
```
dev
```

### Settings

#### Protect matching branches
- [ ] **Require a pull request before merging** _(leave unchecked for auto-merge)_

#### Require status checks to pass before merging
- [x] **Require status checks to pass before merging**
  - [x] Require branches to be up to date before merging
  - **Required status checks** (select these from the list):
    - `validate / lint`
    - `validate / security`
    - `validate / typecheck`
    - `test / unit-tests`
    - `test / integration-tests`
    - `build / build-backend`
    - `build / build-frontend`
    - _(Note: deploy-staging runs after merge, not before, so don't add it here)_

#### Other Settings
- [ ] Require conversation resolution before merging
- [ ] Require signed commits
- [ ] Require linear history _(optional - keeps cleaner history)_
- [ ] Require deployments to succeed before merging
- [ ] Do not allow bypassing the above settings _(unchecked to allow admin bypass for hotfixes)_

#### Rules applied to everyone including administrators
- [ ] Include administrators _(unchecked - allows you to push directly for hotfixes)_

#### Restrictions
- [ ] Restrict who can push to matching branches

#### Allow force pushes
- [ ] **Do not** allow force pushes _(prevents accidental history rewrites)_

#### Allow deletions
- [ ] **Do not** allow deletions

---

## Feature Branch Protection (Optional)

You can optionally add a wildcard rule for `feature/*` branches to prevent accidental force pushes:

### Branch Name Pattern
```
feature/*
```

### Settings
- [x] Allow force pushes _(developers may need to rebase)_
- [ ] Allow deletions _(branches deleted after merge)_
- No required status checks (CI runs on PRs, not direct pushes)

---

## Auto-Merge Configuration

To enable auto-merge for PRs (so feature→dev PRs merge automatically when CI passes):

1. Go to repository **Settings** → **General**
2. Scroll to **Pull Requests** section
3. Check: **Allow auto-merge**
4. Check: **Automatically delete head branches** _(cleans up feature branches after merge)_

---

## Verifying Configuration

After configuring, test the workflow:

```bash
# 1. Try pushing directly to main (should fail)
git checkout main
echo "test" >> README.md
git commit -am "test: direct push to main"
git push origin main
# Expected: ❌ "required status checks" error

# 2. Try pushing directly to dev (should succeed if no PR required)
git checkout dev
echo "test" >> README.md
git commit -am "test: direct push to dev"
git push origin dev
# Expected: ✅ Success, but CI must pass

# 3. Create feature PR to dev (should auto-merge after CI)
git checkout -b feature/test-auto-merge
echo "test" >> README.md
git commit -am "test: auto-merge feature"
git push -u origin feature/test-auto-merge
gh pr create --base dev --title "Test Auto-Merge" --body "Testing auto-merge"
# Expected: PR merges automatically when CI passes

# 4. Create dev→main PR (should require approval)
gh pr create --base main --head dev --title "Test Release" --body "Testing release workflow"
# Expected: PR requires your approval before merging
```

---

## Rollback Plan

If branch protection rules cause issues:

1. Go to https://github.com/IAMSamuelRodda/embark-quoting-system/settings/branches
2. Click **Edit** on the problematic rule
3. Click **Delete rule** at the bottom
4. You can recreate the rule later with adjusted settings

---

## Status Check Names Reference

These are the exact status check names that will appear in GitHub after workflows run:

### From `validate.yml`
- `validate / lint`
- `validate / security`
- `validate / secrets-scan`
- `validate / typecheck`

### From `test.yml`
- `test / unit-tests`
- `test / integration-tests`
- `test / coverage-check`

### From `build.yml`
- `build / build-backend`
- `build / build-frontend`
- `build / bundle-analysis`

### From `deploy-staging.yml` (runs post-merge, not as PR check)
- `deploy-staging / deploy-backend`
- `deploy-staging / deploy-frontend`
- `deploy-staging / e2e-tests`
- `deploy-staging / lighthouse`

### From `deploy-prod.yml` (runs post-merge, not as PR check)
- `deploy-prod / pre-deployment-checks`
- `deploy-prod / deploy-backend`
- `deploy-prod / deploy-frontend`
- `deploy-prod / create-release`

---

## Next Steps

1. **Configure branch protection** using settings above
2. **Enable auto-merge** in repository settings
3. **Test the workflow** with a small feature branch
4. **Monitor CI runs** to ensure all checks are working
5. **Archive this document** once setup is complete:
   ```bash
   mv .github/BRANCH_PROTECTION_SETUP.md .github/workflows-debug/BRANCH_PROTECTION_REFERENCE.md
   ```

---

**Created**: 2025-11-07
**Status**: Pending configuration in GitHub UI
