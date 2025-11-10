# Specs Folder Audit Report

**Date:** 2025-11-09
**Auditor:** Claude Code (Subagent)
**Scope:** `/home/samuel/repos/embark-quoting-system/specs/` (14 files, 6,715 total lines)

---

## Executive Summary

The `specs/` folder contains **significant duplication and organizational issues**. Of 14 files, approximately **50% should be moved, consolidated, or archived**. The folder has become a catch-all for operational documentation that belongs elsewhere. Key findings:

1. **High-value business specs** (FINANCIAL_MODEL.md, BLUEPRINT.yaml) are well-maintained and correctly placed ✅
2. **Operational guides** (RUNBOOK.md, GOVERNANCE.md, MANUAL_TESTING.md) overlap heavily with STATUS.md and CONTRIBUTING.md
3. **One-time audit reports** (COLOR_SCHEME_AUDIT.md) belong in archive/
4. **Infrastructure guides** (AWS_RESOURCES.md, DEVOPS_SETUP.md, SECRETS_MANAGEMENT.md) should move to terraform/
5. **Workflow documentation** (E2E_WORKFLOW_ARCHITECTURE.md) belongs with .github/workflows/

---

## Detailed File-by-File Analysis

### ✅ Files to Keep As-Is (3 files)

#### 1. **BLUEPRINT.yaml** (61K)
- **Purpose:** Master implementation plan with database schema, milestones, epics, tech stack
- **Status:** Authoritative source of truth, referenced in CLAUDE.md
- **Duplication Check:** None - unique content
- **Location:** ✅ Correctly placed in specs/
- **Recommendation:** **Keep as-is** - This is the core project plan

#### 2. **FINANCIAL_MODEL.md** (7.6K)
- **Purpose:** Profit-First calculation methodology (Quote Price = Raw Materials ÷ 0.30)
- **Status:** Critical domain knowledge, business logic specification
- **Duplication Check:** None - unique content, referenced in ARCHITECTURE.md but not duplicated
- **Location:** ✅ Correctly placed in specs/
- **Recommendation:** **Keep as-is** - Essential business logic

#### 3. **README.md** (328 bytes)
- **Purpose:** Quick orientation for specs/ folder
- **Content:** Brief description of folder contents
- **Status:** Concise, appropriate for architectural boundary
- **Location:** ✅ Correctly placed
- **Recommendation:** **Keep as-is** (will need minor update after restructuring)

---

### 🔀 Files to Consolidate (7 files)

#### 4. **GOVERNANCE.md** (6.4K) + **BRANCH_PROTECTION.md** (7.0K)

**Current State:**
- **GOVERNANCE.md**: Branch strategy (dev/main), deployment controls, incident response example
- **BRANCH_PROTECTION.md**: Step-by-step GitHub UI setup for branch protection rules

**Duplication Analysis:**
- Both cover branch protection rules with ~40% overlap
- BRANCH_PROTECTION has detailed UI screenshots/instructions
- GOVERNANCE has higher-level policy rationale

**Recommendation:**
- ✅ **Consolidate** BRANCH_PROTECTION.md content into GOVERNANCE.md as a new section
- ✅ **Delete** BRANCH_PROTECTION.md after merge
- ✅ Keep consolidated GOVERNANCE.md in specs/ (project policy document)

**Benefit:** Single source of truth for branch strategy + implementation

---

#### 5. **AWS_RESOURCES.md** (16K) + **DEVOPS_SETUP.md** (16K) + **SECRETS_MANAGEMENT.md** (13K)

**Current State:**
- **AWS_RESOURCES.md**: Infrastructure inventory (VPC IDs, security groups, RDS endpoints, **plaintext passwords** ⚠️)
- **DEVOPS_SETUP.md**: CI/CD setup guide, deployment strategy, quality gates, references ARCHITECTURE.md
- **SECRETS_MANAGEMENT.md**: Terraform→AWS Secrets Manager→GitHub Secrets sync workflow

**Duplication Analysis:**
- DEVOPS_SETUP references ARCHITECTURE.md multiple times (says "see ARCHITECTURE.md for details")
- AWS_RESOURCES is essentially a snapshot of Terraform state (will drift over time)
- SECRETS_MANAGEMENT is Terraform-specific workflow documentation
- All three are infrastructure-operational guides, not project specifications

**Critical Issue Found:**
```
AWS_RESOURCES.md Line 95:
Master Password: `[REDACTED]` ⚠️ STORE SECURELY
```
**This was a plaintext RDS password committed to git!** 🔴 (Rotated and redacted)

**Recommendation:**
- 🔥 **URGENT**: Remove plaintext password from AWS_RESOURCES.md, replace with "Stored in AWS Secrets Manager"
- 📦 **Move** AWS_RESOURCES.md to `terraform/` (alongside Terraform code)
- 📦 **Move** SECRETS_MANAGEMENT.md to `terraform/`
- 📦 **Move** DEVOPS_SETUP.md to `terraform/` OR
- 🔀 **Consolidate** DEVOPS_SETUP.md into CONTRIBUTING.md (eliminate duplication)

**Benefit:**
- Terraform-related docs live with Terraform code
- Reduce specs/ clutter (45K → 0K)
- Infrastructure operators find docs where they expect them

---

#### 6. **RUNBOOK.md** (16K) vs **STATUS.md** (302 lines)

**Current State:**
- **RUNBOOK.md**: Operations procedures, troubleshooting, incident response, health checks, "Quick Reference" with URLs/credentials
- **STATUS.md**: Current project status, deployment status, known issues, next steps

**Duplication Analysis:**
- RUNBOOK.md "Quick Reference" section duplicates environment URLs/credentials (also in MANUAL_TESTING.md)
- STATUS.md "Known Issues" overlaps with RUNBOOK.md "Incident Response"
- Both reference CloudFront URLs, backend ALBs, Cognito pools

**Recommendation:**
- ✅ **Keep** both files (different purposes)
- 🔀 **Remove** "Quick Reference" section from RUNBOOK.md
- 🆕 **Create** `specs/ENVIRONMENTS.md` with all environment config
- ✅ **Update** RUNBOOK.md to reference ENVIRONMENTS.md
- ✅ **Update** STATUS.md "Known Issues" to reference RUNBOOK.md troubleshooting sections

**Benefit:**
- Clear separation: STATUS.md = current state, RUNBOOK.md = how to fix
- Single source for environment config

---

#### 7. **MANUAL_TESTING.md** (19K) vs **RUNBOOK.md** (16K)

**Current State:**
- **MANUAL_TESTING.md**: Step-by-step testing procedures, PWA installation, test credentials, troubleshooting
- **RUNBOOK.md**: Operational procedures, incident response

**Duplication Analysis:**
- Both have environment URLs/credentials (30+ lines duplicated)
- Both have "Troubleshooting" sections (15+ scenarios overlap)
- MANUAL_TESTING focuses on testing workflows
- RUNBOOK focuses on operations/incidents

**Recommendation:**
- ✅ **Extract** credentials/URLs to `specs/ENVIRONMENTS.md`
- ✅ **Update** MANUAL_TESTING.md to reference ENVIRONMENTS.md
- ✅ **Update** RUNBOOK.md to reference ENVIRONMENTS.md
- ✅ **Keep** both files (different audiences: testers vs operators)

**Benefit:** DRY principle - single source for environment config

---

### 📦 Files to Move (4 files)

#### 8. **E2E_WORKFLOW_ARCHITECTURE.md** (14K)

**Current Purpose:** Explains reusable workflow pattern for E2E tests, Amazon-style deployment testing philosophy

**Belongs In:** `.github/workflows/E2E_ARCHITECTURE.md` or consolidated into `.github/workflows/README.md`

**Reason:**
- Workflow implementation detail, not project specification
- Only relevant when working with GitHub Actions
- Should live with `.github/workflows/` code it documents
- 99% of content is about GitHub Actions workflows

**Recommendation:**
- 📦 **Move** to `.github/workflows/E2E_ARCHITECTURE.md`
- ✅ **Update** .github/workflows/README.md to reference it
- ✅ **Delete** from specs/

**References to Update:** None found (standalone doc)

---

#### 9. **ADMIN_USER_PROVISIONING.md** (11K) + **E2E_TEST_USER.md** (889 bytes)

**Current Purpose:**
- **ADMIN_USER_PROVISIONING.md**: How to create Cognito admin users via AWS CLI (11K of AWS commands)
- **E2E_TEST_USER.md**: E2E test user credentials reference (just 889 bytes - tiny!)

**Belongs In:**
- `terraform/` (Cognito is Terraform-managed infrastructure)
- E2E_TEST_USER.md → consolidate into new `specs/ENVIRONMENTS.md` (it's just credentials)

**Reason:**
- ADMIN_USER_PROVISIONING is AWS/Terraform operational guide (AWS CLI commands)
- E2E_TEST_USER is just credentials (belongs with other environment config)
- Both relate to Terraform-managed Cognito resources

**Recommendation:**
- 📦 **Move** ADMIN_USER_PROVISIONING.md to `terraform/USER_PROVISIONING.md`
- 🔀 **Consolidate** E2E_TEST_USER.md into new `specs/ENVIRONMENTS.md`
- ✅ **Update** RUNBOOK.md and MANUAL_TESTING.md to reference new locations
- ✅ **Delete** E2E_TEST_USER.md after consolidation

**Benefit:** Infrastructure setup docs live with infrastructure code

---

### 🗄️ Files to Archive (1 file)

#### 10. **COLOR_SCHEME_AUDIT.md** (16K)

**Current Purpose:** One-time audit report (Nov 9, 2025) identifying Tailwind blue vs CAT Gold mismatch

**Status:** Completed audit with actionable findings documented

**Belongs In:** `archive/2025-11-09-color-scheme-audit.md`

**Reason:**
- Audit report is a **point-in-time snapshot**
- After fixes are implemented, the report becomes historical reference
- Still valuable for understanding design system decisions
- Takes up 16K (largest single file in specs/)
- Pattern matches other archived files: timestamped snapshots

**Recommendation:**
- 📦 **Move** to `archive/2025-11-09-color-scheme-audit.md`
- 🆕 **Create** GitHub issue referencing the audit (track fix progress)
- ✅ **Update** STATUS.md "Known Issues" to link to GitHub issue (not audit doc)

**Note:** STATUS.md already mentions "Color Scheme Mismatch" - no other files reference the audit

---

## 🆕 Recommended New File

### Create: `specs/ENVIRONMENTS.md`

**Purpose:** Single source of truth for environment configuration (production, staging, local)

**Content to Consolidate:**
- Production/Staging URLs (from MANUAL_TESTING.md lines 28-45, RUNBOOK.md lines 134-152)
- Test credentials (from E2E_TEST_USER.md, MANUAL_TESTING.md lines 172-189)
- Cognito pool IDs, client IDs (from MANUAL_TESTING.md lines 156-168)
- Backend ALB URLs (from MANUAL_TESTING.md lines 48-62)

**Benefits:**
- ✅ Eliminates 50+ lines of duplication across 3 files
- ✅ Single place to update when environment config changes
- ✅ Clear reference for developers, testers, operators

**Template Structure:**
```markdown
# Environments

**Purpose:** Environment configuration reference

## Production
- **Frontend:** https://d1aekrwrb8e93r.cloudfront.net
- **Backend:** http://embark-quoting-production-alb-*.elb.amazonaws.com
- **Cognito Pool:** ap-southeast-2_v2Jk8B9EK
- **Cognito Client:** 5abc123xyz (public client ID - safe to commit)
- **Test User:** e2e-test@embark-quoting.local
- **Test Password:** See AWS Secrets Manager: embark/production/e2e-password

## Staging
- **Frontend:** https://dtfaaynfdzwhd.cloudfront.net
- **Backend:** http://embark-quoting-staging-alb-*.elb.amazonaws.com
- **Cognito Pool:** ap-southeast-2_D2t5oQs37
- **Cognito Client:** 7def456uvw
- **Test User:** e2e-test@embark-quoting.local
- **Test Password:** See AWS Secrets Manager: embark/staging/e2e-password

## Local Development
- **Frontend:** http://localhost:5173
- **Backend:** http://localhost:3000
- **Database:** PostgreSQL @ localhost:5432 (see backend/.env.example)
```

---

## 🔧 Specific Edits Needed (Outdated References)

### 1. **CRITICAL SECURITY ISSUE** 🔴

**File:** AWS_RESOURCES.md
**Line:** 95
**Current:** `Master Password: [REDACTED - Password Rotated]` ⚠️ STORE SECURELY

**Issue:** **Plaintext RDS password committed to git repository**

**Fix:**
```markdown
# OLD (Line 95)
Master Password: `[REDACTED - Password Rotated]` ⚠️ STORE SECURELY

# NEW
Master Password: Stored in AWS Secrets Manager
  - Secret Name: `embark-quoting/production/db-credentials`
  - Retrieve: `aws secretsmanager get-secret-value --secret-id embark-quoting/production/db-credentials`
```

**Action:** Fix immediately, consider rotating the password since it's in git history

---

### 2. **Staging Deployment Strategy** (Multiple Files)

**Files Affected:**
- E2E_WORKFLOW_ARCHITECTURE.md Line 26
- GOVERNANCE.md Line 41
- DEVOPS_SETUP.md (multiple references)

**Current:** References auto-deploy on `dev` branch push

**Issue:** Outdated - you just changed staging deployment to tag-based (`staging-v*`)

**Examples:**
```markdown
# E2E_WORKFLOW_ARCHITECTURE.md Line 26
OLD: "Staging Environment (dev branch)"
NEW: "Staging Environment (staging-v* tags)"

# GOVERNANCE.md Line 41
OLD: "Auto-deploys to staging on every push to dev"
NEW: "Deploys to staging when tagged with staging-v* (e.g., staging-v1.2.3)"
```

**Fix:** Update all references to new tag-based staging deployment strategy

---

### 3. **MANUAL_TESTING.md Password Conflict**

**File:** MANUAL_TESTING.md
**Lines:** 28 vs 172

**Issue:** Two different production passwords shown
- Line 28: `M<##+Xu&B8hb%-10` (correct)
- Line 172: `TestPassword123!` (generic example, incorrect)

**Fix:** Remove line 172, reference ENVIRONMENTS.md for credentials

---

### 4. **GOVERNANCE.md Branch Protection Status**

**File:** GOVERNANCE.md
**Line:** 232

**Current:** `⏳ Branch protection rules need manual configuration`

**Issue:** May be outdated if branch protection was configured since Nov 8

**Fix:**
- Verify current branch protection status on GitHub
- Update checkbox to ✅ or ❌ with current status

---

### 5. **RUNBOOK.md Debugging Path**

**File:** RUNBOOK.md
**Line:** 134

**Current:** References `docs/debugging/` for historical reports

**Issue:** Path may be incorrect after restructuring (`docs/` → `debugging/` at root)

**Fix:** Verify path, update to `debugging/` or `archive/` as appropriate

---

## 📊 Final Recommended Structure

### Before (14 files in specs/)
```
specs/
├── ADMIN_USER_PROVISIONING.md (11K) 📦 Move to terraform/
├── AWS_RESOURCES.md (16K) 📦 Move to terraform/
├── BLUEPRINT.yaml (61K) ✅ Keep
├── BRANCH_PROTECTION.md (7K) 🔀 Consolidate into GOVERNANCE.md
├── COLOR_SCHEME_AUDIT.md (16K) 📦 Move to archive/
├── DEVOPS_SETUP.md (16K) 📦 Move to terraform/
├── E2E_TEST_USER.md (889B) 🔀 Consolidate into ENVIRONMENTS.md
├── E2E_WORKFLOW_ARCHITECTURE.md (14K) 📦 Move to .github/workflows/
├── FINANCIAL_MODEL.md (7.6K) ✅ Keep
├── GOVERNANCE.md (6.4K) ✅ Keep (consolidated)
├── MANUAL_TESTING.md (19K) ✅ Keep (updated)
├── README.md (328B) ✅ Keep (updated)
├── RUNBOOK.md (16K) ✅ Keep (updated)
└── SECRETS_MANAGEMENT.md (13K) 📦 Move to terraform/
```

### After (8 files in specs/)
```
specs/
├── README.md ✅ (updated to reflect new structure)
├── BLUEPRINT.yaml ✅ (master plan - no changes)
├── FINANCIAL_MODEL.md ✅ (business logic - no changes)
├── GOVERNANCE.md ✅ (consolidated with BRANCH_PROTECTION content)
├── RUNBOOK.md ✅ (updated to reference ENVIRONMENTS.md)
├── MANUAL_TESTING.md ✅ (updated to reference ENVIRONMENTS.md)
├── ENVIRONMENTS.md 🆕 (new - consolidated env config)
└── DEVOPS_SETUP.md ⚠️ (keep for now, consider consolidating later)

terraform/ (infrastructure docs with infrastructure code)
├── AWS_RESOURCES.md 📦
├── SECRETS_MANAGEMENT.md 📦
├── USER_PROVISIONING.md 📦 (was ADMIN_USER_PROVISIONING.md)
├── DEVOPS_SETUP.md 📦 (optional - could consolidate)
└── ... (existing .tf files)

.github/workflows/
├── README.md ✅ (updated)
├── E2E_ARCHITECTURE.md 📦 (was E2E_WORKFLOW_ARCHITECTURE.md)
└── ... (existing .yml files)

archive/
├── 2025-11-09-color-scheme-audit.md 📦
└── ... (existing archived files)
```

**Reduction:** 14 files → 8 files in specs/ (43% reduction)
**New locations:** terraform/ gains infrastructure docs

---

## ⏱️ Implementation Plan

### **Phase 1: Quick Wins + Critical Fixes** (1-2 hours) 🔥

**Priority:** HIGH - Contains security fix

1. ✅ **Fix critical security issue** (AWS_RESOURCES.md plaintext password)
   - Remove plaintext password
   - Add reference to AWS Secrets Manager
   - Consider password rotation (in git history)

2. ✅ **Archive** COLOR_SCHEME_AUDIT.md
   ```bash
   git mv specs/COLOR_SCHEME_AUDIT.md archive/2025-11-09-color-scheme-audit.md
   ```

3. ✅ **Create** specs/ENVIRONMENTS.md
   - Extract from MANUAL_TESTING.md, RUNBOOK.md, E2E_TEST_USER.md
   - Consolidate all environment config

4. ✅ **Update** MANUAL_TESTING.md
   - Remove duplicate credentials
   - Reference ENVIRONMENTS.md
   - Fix password conflict (line 172)

**Deliverable:** Security issue resolved, audit archived, environment config centralized

---

### **Phase 2: File Reorganization** (2-3 hours) 📦

**Priority:** MEDIUM

5. ✅ **Move** E2E_WORKFLOW_ARCHITECTURE.md
   ```bash
   git mv specs/E2E_WORKFLOW_ARCHITECTURE.md .github/workflows/E2E_ARCHITECTURE.md
   ```

6. ✅ **Move** infrastructure docs to terraform/
   ```bash
   git mv specs/AWS_RESOURCES.md terraform/
   git mv specs/SECRETS_MANAGEMENT.md terraform/
   git mv specs/ADMIN_USER_PROVISIONING.md terraform/USER_PROVISIONING.md
   git mv specs/DEVOPS_SETUP.md terraform/  # Optional
   ```

7. ✅ **Update** .github/workflows/README.md
   - Reference new E2E_ARCHITECTURE.md location

**Deliverable:** Files organized by architectural boundary

---

### **Phase 3: Content Consolidation** (2-3 hours) 🔀

**Priority:** MEDIUM

8. ✅ **Consolidate** BRANCH_PROTECTION.md into GOVERNANCE.md
   - Copy setup instructions into GOVERNANCE.md
   - Delete BRANCH_PROTECTION.md

9. ✅ **Update** RUNBOOK.md
    - Remove "Quick Reference" section
    - Add references to ENVIRONMENTS.md
    - Fix debugging/ path references

10. ✅ **Update** all files for staging deployment change
    - E2E_WORKFLOW_ARCHITECTURE.md (if not moved yet)
    - GOVERNANCE.md
    - DEVOPS_SETUP.md
    - Change "dev branch" → "staging-v* tags"

11. ✅ **Delete** consolidated files
    ```bash
    git rm specs/BRANCH_PROTECTION.md
    git rm specs/E2E_TEST_USER.md  # Content in ENVIRONMENTS.md
    ```

**Deliverable:** No duplication, single sources of truth

---

### **Phase 4: Documentation Updates** (1 hour) 📝

**Priority:** LOW

12. ✅ **Update** specs/README.md
    - Reflect new 8-file structure
    - Reference terraform/ for infrastructure guides

13. ✅ **Update** CLAUDE.md (if needed)
    - Check for references to moved files
    - Update navigation guide

14. ✅ **Update** CONTRIBUTING.md (if needed)
    - Reference new locations
    - Update workflow guide

15. ✅ **Create** GitHub issues
    - COLOR_SCHEME_AUDIT action items
    - Link from STATUS.md

**Deliverable:** All documentation current and accurate

---

## 📈 Effort Summary

| Phase | Tasks | Estimated Time | Priority |
|-------|-------|---------------|----------|
| **Phase 1** | Quick wins + security fixes | 1-2 hours | 🔥 HIGH |
| **Phase 2** | File reorganization | 2-3 hours | 📦 MEDIUM |
| **Phase 3** | Content consolidation | 2-3 hours | 🔀 MEDIUM |
| **Phase 4** | Documentation updates | 1 hour | 📝 LOW |
| **Total** | 15 tasks | **6-9 hours** | - |

**Recommendation:**
- Execute **Phase 1 immediately** (contains security fix)
- Schedule **Phases 2-3** for next sprint planning
- Defer **Phase 4** until after Phases 1-3 complete

---

## ✅ Success Criteria

After implementation, specs/ should have:

1. ✅ **No security issues** (plaintext passwords removed)
2. ✅ **No duplication** (environment config in one place)
3. ✅ **Clear boundaries** (infrastructure docs with infrastructure code)
4. ✅ **Accurate references** (staging deployment strategy updated)
5. ✅ **Minimal files** (14 → 8 files, 43% reduction)
6. ✅ **Easy navigation** (related docs together)

---

**End of Audit Report**
