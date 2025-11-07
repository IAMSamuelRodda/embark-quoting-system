# Embark Quoting System - Navigation Guide

> **Purpose**: Quick reference for WHERE to find information in this project.
> **Principle**: This file points to sources of truth, it does NOT duplicate them.

---

## 📍 Sources of Truth

When you need information, check these files in this order:

1. **`specs/BLUEPRINT.yaml`** → Complete implementation plan (tech stack, database schema, milestones/epics, complexity scores)
2. **`docs/financial-model.md`** → Financial calculation methodology (Profit-First model)
3. **`CONTRIBUTING.md`** → Workflow for agents (how to track progress, update issues)
4. **`DEVELOPMENT.md`** → Pre-commit checklist, CI/CD expectations, test organization (REQUIRED before committing code)
5. **`README.md`** → Project overview and current status
6. **`backend/package.json`** → Backend dependencies and versions
7. **`frontend/package.json`** → Frontend dependencies (once created)

**If specs conflict**: `specs/BLUEPRINT.yaml` is the authoritative source.

---

## 📋 Issue Hierarchy

This project uses GitHub's hierarchical issue structure:

```
Milestone (timeboxed release group)
  └─ Epic (large feature/initiative, e.g., "Foundation", "Sync Engine")
      └─ Feature (user-facing functionality, e.g., "AWS Infrastructure")
          └─ Task (implementation work, e.g., "Docker Container Setup")
              └─ Subtask (granular steps, if needed)
```

**YAML Structure**: The BLUEPRINT.yaml uses `milestones.milestone_1.epics.epic_1`, `feature_1_1`, `task_1_2_1` keys matching this hierarchy.

**Note**: Currently the project has one milestone (`milestone_1: v1.0 MVP Release`), but the structure supports adding future milestones.

See `github-project-setup` skill for automated issue creation from BLUEPRINT.

---

## 🏗️ Architecture Quick Facts

### Style
- **Vertical Slice Architecture** (each feature = UI + service + DB in one folder)
- **Offline-First** (IndexedDB → Cloud sync, NOT cloud-first)

### Structure Pattern
```
features/
└── featureName/
    ├── ComponentName.tsx      # UI
    ├── useFeature.ts          # State hook (Zustand)
    ├── featureService.ts      # Business logic
    └── featureDb.ts           # IndexedDB operations
```

See `specs/BLUEPRINT.yaml` → `architecture.frontend.structure` for full tree.

---

## 💰 Financial Model (Critical)

**This project uses Profit-First methodology, NOT cost-plus pricing.**

**Formula**: `Quote Price = Raw Materials ÷ 0.30`

**Full details**: `docs/financial-model.md`
**Implementation**: `specs/BLUEPRINT.yaml` → Epic 4 (Financial Calculations)

---

## 📂 Where to Find...

### Tech Stack & Dependencies
- **Complete list**: `specs/BLUEPRINT.yaml` → `architecture` section
- **Installed packages**: `backend/package.json`, `frontend/package.json`

### Database Schema
- **Authoritative schema**: `specs/BLUEPRINT.yaml` → `database_schema` section
- Tables: quotes, jobs, financials, price_sheets, price_items, quote_versions, sync_logs

### Job Types & Parameters
- **Complete specifications**: `specs/BLUEPRINT.yaml` → `requirements.job_types`
- 5 types: retaining_wall, driveway, trenching, stormwater, site_prep

### Implementation Hierarchy
- **Full breakdown**: `specs/BLUEPRINT.yaml` → `milestones.milestone_1.epics` section
- **Progress tracking**: GitHub Issues (see `CONTRIBUTING.md`)
- **Critical note**: Epic 5 (Sync Engine) requires a 5-day spike task (Feature 5.0)

### Progress Tracking
- **Workflow guide**: `CONTRIBUTING.md`
- **Live progress**: https://github.com/users/IAMSamuelRodda/projects/1
- **Issues list**: https://github.com/IAMSamuelRodda/embark-quoting-system/issues

### Security & Performance Requirements
- **Requirements**: `specs/BLUEPRINT.yaml` → `requirements.security_requirements`
- **Performance targets**: `specs/BLUEPRINT.yaml` → `requirements.performance_and_ux_requirements`

### Cost Estimates
- **Monthly costs**: `specs/BLUEPRINT.yaml` → `cost_estimate`
- **Infrastructure details**: `specs/BLUEPRINT.yaml` → `architecture.infrastructure`

---

## 🎯 Project-Specific Conventions

### Naming Conventions
- Components: `PascalCase.tsx`
- Hooks: `useFeatureName.ts`
- Services: `featureService.ts`
- DB files: `featureDb.ts`
- Routes: `feature.routes.ts`

### Quote Number Format
- Pattern: `EE-YYYY-NNNN` (e.g., `EE-2025-0001`)
- EE = Embark Earthworks

### Conflict Resolution (Epic 5: Sync Engine)
- **Critical fields** (manual resolution): customer contact, quote status, financial totals, job parameters
- **Non-critical fields** (auto-merge): notes, metadata, timestamps
- **Full strategy**: Determined during Feature 5.0 spike task (see `specs/BLUEPRINT.yaml` → `milestones.milestone_1.epics.epic_5.feature_5_0`)

---

## 🚀 Getting Started

### First Time Setup
```bash
# View the plan
cat specs/BLUEPRINT.yaml

# Check what needs to be done
gh issue list --state open

# View specific epic/feature details
gh issue view <issue-number>
```

### Starting Work
```bash
# Mark epic/feature/task in progress
gh issue edit <issue-number> --add-label "status: in-progress"
```

See `CONTRIBUTING.md` for complete workflow.

---

## ⚠️ Critical Constraints

1. **Offline-First**: App MUST work 100% offline (no degraded functionality)
2. **Mobile-First**: Designed for field use (phones/tablets, often no connectivity)
3. **Vertical Slices**: Keep feature code together (UI + service + DB in one folder)
4. **Epic 5 Spike**: Do NOT skip the 5-day spike task (Feature 5.0) for sync conflict resolution

---

## 🔄 GitHub Workflow Standards

### Commit-Issue Linking (CRITICAL)

**RULE**: Every commit MUST be linked to a GitHub issue UNLESS it's auto-closed due to sub-issue rollup.

**Why**: GitHub issues are the single source of truth for progress tracking, not BLUEPRINT.yaml or documentation. Commits without issue links create "ghost progress" that's invisible in project tracking.

**How to Link Commits to Issues**:
```bash
# Option 1: Reference in commit message (closes issue when merged to main)
git commit -m "Implement quote CRUD API endpoints

Closes #26"

# Option 2: Multiple issues
git commit -m "Add auth middleware and RBAC checks

Closes #23
Relates to #26"

# Option 3: In PR description (preferred for feature branches)
gh pr create --title "Implement Backend Quote API" --body "Closes #26"
```

**GitHub Keywords** (auto-close issues):
- `Closes #N`, `Fixes #N`, `Resolves #N` → Closes issue when merged to main
- `Relates to #N`, `Refs #N` → Links without closing

**Exception**: Sub-issue auto-close
- When closing a parent epic/feature, GitHub automatically closes sub-issues
- Sub-issues don't need individual commit links if work is done as part of parent

**When to Close Issues**:
- **Immediately** after completing work, not in batches
- Close via commit message OR manually via `gh issue close #N --comment "Reason"`
- Include verification details in close comment

**Verification**:
```bash
# Check if commit is linked to an issue
gh pr view <PR-number> --json closingIssuesReferences

# List commits without issue references (audit)
git log --oneline --grep="#" --invert-grep
```

### PR Merge Strategy (CRITICAL)

**RULE**: Use `--merge` (merge commit) for all feature→dev PRs to preserve feature branch history.

**Why**: Merge commits preserve the complete commit history from feature branches and show the true branch flow in the git graph. Squash merging creates "orphaned" commits that stick out in the graph without merging back.

**How to Merge PRs**:
```bash
# Feature → dev: Use merge commit
gh pr merge <PR-number> --merge --auto --repo owner/repo

# Do NOT use:
gh pr merge <PR-number> --squash --auto  # ❌ Creates orphaned commits
gh pr merge <PR-number> --rebase --auto  # ❌ Rewrites history
```

**Benefits of Merge Commits**:
- ✅ Preserves ALL commits from feature branch (each tested by CI)
- ✅ Git graph shows branches merging back (not sticking out)
- ✅ Can see exact history of what was merged
- ✅ Each commit retains its original SHA

**When to Use Squash**:
- Reserve for rare cases with genuinely messy intermediate commits
- Generally avoid for feature branches with clean, tested commits

---

## 📝 BLUEPRINT.yaml Change Management

### When Plans Change

**RULE**: When the plan changes due to user requests or issues discovered by agents, document the change in `specs/BLUEPRINT.yaml` with a concise comment explaining what triggered the update.

**Why**: BLUEPRINT.yaml is the implementation plan. When reality diverges from the plan, the plan must be updated to reflect reality. Comments preserve the decision trail for future reference.

**Format for Changes**:
```yaml
feature_2_2:
  name: Backend Quote API (Basic CRUD)
  complexity: 2.5
  estimated_days: 2
  # UPDATED 2025-11-05: Increased from 2 to 3 days due to additional
  # authentication middleware requirements discovered during Epic 1
  revised_estimated_days: 3
  note: Authentication middleware must be implemented first (blocking dependency)
  deliverables:
    - features/quotes/ backend slice
    # ADDED 2025-11-05: JWT validation middleware required for all endpoints
    - auth.middleware.ts (JWT validation)
    - quotes.routes.ts (REST endpoints)
```

**What Triggers Updates**:
1. **Scope Changes**: User adds/removes requirements
2. **Blocking Issues**: Dependencies discovered during implementation
3. **Timeline Changes**: Work takes longer/shorter than estimated
4. **Technical Pivots**: Architecture decisions change (e.g., Lambda → ECS)
5. **Feature Splits**: Task complexity exceeds 3.0, requiring breakdown

**Comment Format**:
```yaml
# UPDATED YYYY-MM-DD: <concise reason for change>
# ADDED YYYY-MM-DD: <why this was added>
# REMOVED YYYY-MM-DD: <why this was removed>
# BLOCKED YYYY-MM-DD: <what is blocking this>
```

**Update Workflow**:
1. Make changes to BLUEPRINT.yaml with comments
2. Commit with issue reference: `git commit -m "Update BLUEPRINT: revise Epic 2 timeline (Relates to #26)"`
3. Update related GitHub issues if needed
4. DO NOT update BLUEPRINT.yaml with completion status - GitHub issues are the source of truth for progress

**What NOT to Update**:
- ❌ Don't add progress percentages to BLUEPRINT
- ❌ Don't mark features as "IMPLEMENTED" in BLUEPRINT
- ❌ Don't duplicate GitHub issue status in BLUEPRINT
- ✅ DO update plans, estimates, requirements, deliverables
- ✅ DO document why plans changed

---

## 🔗 External Links

- **Project Board**: https://github.com/users/IAMSamuelRodda/projects/1
- **Issues**: https://github.com/IAMSamuelRodda/embark-quoting-system/issues
- **Repository**: https://github.com/IAMSamuelRodda/embark-quoting-system

---

## Change Log

| Date | Change | Reason |
|------|--------|--------|
| 2025-11-04 | Initial version | Navigation guide for project-specific context |
| 2025-11-04 | Refactored to navigation model | Prevent stale duplicated information; point to sources of truth |
| 2025-11-04 | Updated to Epic/Feature/Task terminology | Align with github-project-setup skill hierarchy (Milestone→Epic→Feature→Task) |
| 2025-11-04 | Removed phase_ mapping notes | Fully committed to epic/feature/task convention (BLUEPRINT.yaml updated: phases→epics, phase_X→epic_X) |
| 2025-11-04 | BLUEPRINT.yaml restructured for multiple milestones | Added milestone wrapper to support project planning beyond MVP (YAML structure: milestones.milestone_1.epics.epic_X) |
| 2025-11-05 | Added GitHub Workflow Standards section | Enforce commit-issue linking as critical practice; establish GitHub as source of truth for progress |
| 2025-11-05 | Added BLUEPRINT.yaml Change Management section | Document plan changes with concise comments; preserve decision trail when reality diverges from plan |
| 2025-11-06 | Added DEVELOPMENT.md reference | Created DEVELOPMENT.md for pre-commit workflow; prevent CI failures from agents skipping quality checks |
