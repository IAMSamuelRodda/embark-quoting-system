# Embark Quoting System - Navigation Guide

> **Purpose**: Quick reference for WHERE to find information in this project.
> **Principle**: This file points to sources of truth, it does NOT duplicate them.

---

## 📍 Sources of Truth

When you need information, check these files in this order:

1. **`specs/BLUEPRINT.yaml`** → Complete implementation plan (tech stack, database schema, milestones/epics, complexity scores)
2. **`docs/financial-model.md`** → Financial calculation methodology (Profit-First model)
3. **`CONTRIBUTING.md`** → Workflow for agents (how to track progress, update issues)
4. **`README.md`** → Project overview and current status
5. **`backend/package.json`** → Backend dependencies and versions
6. **`frontend/package.json`** → Frontend dependencies (once created)

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
