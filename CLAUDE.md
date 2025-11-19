# Embark Quoting System - CLAUDE.md

> **Purpose**: Minimal critical directives for AI agents (pointers to detailed documentation)
> **Lifecycle**: Living (keep minimal, move verbose content to CONTRIBUTING.md or DEVELOPMENT.md)

## 📍 Critical Documents

**Before starting work:**
1. Read `STATUS.md` → Current issues, active work, what's broken
2. Read `ARCHITECTURE.md` → System architecture, database schema, tech stack
3. Read `CONTRIBUTING.md` → How to track progress with GitHub issues

**Before finishing work:**
1. Update `STATUS.md` → Add investigation notes, mark issues resolved
2. Update GitHub issues → Close completed tasks, link commits
3. Check `DEVELOPMENT.md` → Run pre-commit checklist (lint, format, tests)

**Planning artifact:** `specs/BLUEPRINT.yaml` is for generating GitHub issues when planning NEW features, NOT for reference during implementation. It becomes historical once issues are created.

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

See `ARCHITECTURE.md` for complete details (database schema, tech stack, ADRs, infrastructure).

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
- **Full strategy**: See `ARCHITECTURE.md` § Offline-First Strategy → Sync Engine

---

## 🚀 Getting Started

**Quick Local Setup:**
```bash
./scripts/dev-start.sh  # Launches full dev stack (DB + backend + frontend)
```

**GitHub Workflow:**
```bash
# Mark epic/feature/task in progress
gh issue edit <issue-number> --add-label "status: in-progress"
```

See `CONTRIBUTING.md` for complete workflow and environment setup details.

---

## ⚠️ Critical Constraints

1. **Offline-First**: App MUST work 100% offline (no degraded functionality)
2. **Mobile-First**: Designed for field use (phones/tablets, often no connectivity)
3. **Vertical Slices**: Keep feature code together (UI + service + DB in one folder)
4. **Epic 5 Spike**: Do NOT skip the 5-day spike task (Feature 5.0) for sync conflict resolution

---

## 🔄 GitHub Workflow

**Branch Protection**: NEVER push directly to `dev` or `main`. Use feature/fix branches → PR.

**Auto-Merge**: ALWAYS enable auto-merge on PRs to `dev` (prevents stale branches):
```bash
gh pr merge <PR-NUMBER> --auto --squash --delete-branch
```

**Commit-Issue Linking**: Every commit MUST reference a GitHub issue (`Closes #N`, `Relates to #N`).

---

## 📘 Planning New Features

**BLUEPRINT.yaml** is for planning NEW features before converting to GitHub issues. Once issues are created, it becomes historical. See `CONTRIBUTING.md` § Planning New Features for complete workflow.

---

## 🔗 External Links

- **Project Board**: https://github.com/users/IAMSamuelRodda/projects/2
- **Issues**: https://github.com/IAMSamuelRodda/embark-quoting-system/issues
- **Repository**: https://github.com/IAMSamuelRodda/embark-quoting-system

---

## 🧪 E2E Testing & Authentication

**CRITICAL - Correct Credential Pattern**:
```typescript
// ✅ ALWAYS DO THIS
import { getAndValidateCredentials } from './test-utils';
const { email, password } = getAndValidateCredentials();
```

**If tests fail with auth errors**: Check credentials are configured (see DEVELOPMENT.md § Anti-Patterns § E2E Test Credentials)

---

## 📝 Notes

- **Offline-first complexity**: Data flows through multiple layers (UI → IndexedDB → Sync → API → IndexedDB → UI). Any broken link causes silent failures. E2E tests are critical for catching integration issues that unit tests miss.
- **Pre-commit formatting**: Always run `npm run format:check` before pushing to catch formatting issues early.