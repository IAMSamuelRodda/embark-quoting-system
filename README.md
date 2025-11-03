# Embark Quoting System

Offline-first PWA quoting application for Embark Landscaping & Earthworks.

## Project Status

**Phase**: Planning Complete
**Timeline**: 10-11 weeks
**Complexity**: Validated (48% average - MEDIUM)
**Architecture**: Vertical Slice (AI-optimized)

[View Project Board](https://github.com/users/IAMSamuelRodda/projects/1) | [View Issues](https://github.com/IAMSamuelRodda/embark-quoting-system/issues)

---

## Overview

Mobile-first quoting application for landscaping and earthworks projects with:
- **Offline-first**: Full functionality without internet
- **Auto-sync**: Conflict resolution when reconnecting
- **5 Job Types**: Retaining walls, driveways, trenching, stormwater, site prep
- **Configurable Pricing**: Profit-First financial model
- **PDF Export**: Professional quote generation
- **Admin Tools**: Price management, user administration

---

## Quick Start

### For AI Agents

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for detailed progress tracking workflow.

```bash
# View current progress
gh issue list --state open

# View Phase 1 tasks
gh issue view 1

# Start working on a phase
gh issue edit 1 --remove-label "status: pending" --add-label "status: in-progress"
```

### For Developers

```bash
# Clone repository
git clone https://github.com/IAMSamuelRodda/embark-quoting-system.git
cd embark-quoting-system

# View implementation plan
cat specs/BLUEPRINT.yaml

# View financial model
cat docs/financial-model.md
```

---

## Architecture

**Frontend**:
- React 18 + TypeScript (Vite)
- Zustand (state)
- Dexie.js (IndexedDB)
- Tailwind CSS
- PWA (offline-capable)

**Backend**:
- Node.js 20 + Express
- PostgreSQL (RDS)
- Drizzle ORM
- Docker containerized

**Infrastructure** (AWS):
- ECS Fargate (compute)
- RDS PostgreSQL (database)
- Cognito (authentication)
- S3 (storage)
- SES (email)
- CloudFront (CDN)

**Cost**: ~$45/month (low-moderate usage)

---

## Implementation Plan

| Phase | Timeline | Status | Milestone |
|-------|----------|--------|-----------|
| [Phase 1: Foundation](https://github.com/IAMSamuelRodda/embark-quoting-system/issues/1) | Weeks 1-2 | Pending | Auth working, deployed to AWS |
| [Phase 2: Quote Core](https://github.com/IAMSamuelRodda/embark-quoting-system/issues/2) | Weeks 3-4 | Pending | Create quotes offline, sync online |
| [Phase 3: Job Types](https://github.com/IAMSamuelRodda/embark-quoting-system/issues/3) | Weeks 5-6 | Pending | All 5 job types functional |
| [Phase 4: Financial](https://github.com/IAMSamuelRodda/embark-quoting-system/issues/4) | Week 7 | Pending | Accurate totals with config model |
| [Phase 5: Sync Engine](https://github.com/IAMSamuelRodda/embark-quoting-system/issues/5) | Weeks 8-10 | Pending | Conflict resolution working |
| [Phase 6: Outputs](https://github.com/IAMSamuelRodda/embark-quoting-system/issues/6) | Week 11 | Pending | PDF/email + price management |
| [Phase 7: Polish](https://github.com/IAMSamuelRodda/embark-quoting-system/issues/7) | Week 11 | Pending | Production-ready |

**Total Tasks**: 37 subtasks across 7 phases
**All tasks**: ≤3.0/5.0 complexity (validated)

---

## Key Features

### Job Types

1. **Retaining Walls**: Bays, height (200-1000mm), ag pipe, orange plastic
2. **Driveways**: Length, width, base, optional topping (20mm gravel)
3. **Trenching**: Width (300/600/900mm), depth, stormwater integration
4. **Stormwater**: PVC 90mm pipe, joints, elbows, downpipe adaptors
5. **Site Prep**: Area, depth, backfill type, dumping, travel distances

### Financial Model

**Profit-First Allocation** (businesses <$250K revenue):
- 5% Profit
- 50% Owner's Pay
- 15% Tax
- 30% Operating Expenses

All parameters configurable. See [`docs/financial-model.md`](./docs/financial-model.md).

### Offline Sync

- **Conflict Detection**: Version vectors track changes
- **Auto-Merge**: Non-critical fields (notes, metadata)
- **Manual Resolution**: Critical fields (customer contact, status, totals)
- **Spike Task**: 5-day research phase (Phase 5.0) to design conflict resolution strategy

---

## Documentation

- **[`specs/BLUEPRINT.yaml`](./specs/BLUEPRINT.yaml)**: Complete implementation plan (complexity-validated)
- **[`docs/financial-model.md`](./docs/financial-model.md)**: Profit-First calculation methodology
- **[`CONTRIBUTING.md`](./CONTRIBUTING.md)**: Agent workflow and progress tracking guide

---

## Progress Tracking

This project uses **GitHub Issues + Projects** for dynamic progress tracking.

**View Progress**:
- [Project Board](https://github.com/users/IAMSamuelRodda/projects/1) (visual kanban)
- [All Issues](https://github.com/IAMSamuelRodda/embark-quoting-system/issues) (phase checklists)

**Update Progress** (agents):
```bash
# Mark phase in-progress
gh issue edit <issue-number> --remove-label "status: pending" --add-label "status: in-progress"

# Add progress comment
gh issue comment <issue-number> --body "Completed Phase X.Y: [description]"

# Close completed phase
gh issue close <issue-number> --comment "Phase complete"
```

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for complete workflow.

---

## Complexity Validation

**Original Plan**: 67% average complexity (HIGH RISK)
**Revised Plan**: 48% average complexity (MEDIUM - acceptable)

**Methodology**: 6-dimension complexity assessment (improving-plans skill)
- Technical Complexity
- Scope/Size
- Dependencies
- Uncertainty/Ambiguity
- Risk Level
- Testing Complexity

**Breakdown**:
- Phase 1 (Infrastructure): 90% → 5 subtasks (avg 2.8/5.0)
- Phase 5 (Sync Engine): 90% → spike + 6 subtasks (avg 2.6/5.0)
- All tasks: ≤3.0/5.0 composite score

---

## Success Criteria

### Functional
- ✅ User authentication (Cognito)
- ✅ All 5 job types functional
- ✅ Offline mode working
- ✅ Sync with conflict resolution
- ✅ PDF export + email
- ✅ Price management (admin)

### Performance
- ✅ App loads <3s
- ✅ Works on 3G
- ✅ Lighthouse score >90

### Security
- ✅ HTTPS enforced
- ✅ JWT auth
- ✅ Role-based access control
- ✅ Input validation (Zod)
- ✅ No critical vulnerabilities

### UX
- ✅ Mobile responsive
- ✅ WCAG AA accessible
- ✅ Clear sync status
- ✅ Helpful error messages

---

## Contributing

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for:
- Agent workflow guide
- Progress tracking commands
- Best practices
- Example workflows

---

## License

Private - Embark Landscaping & Earthworks

---

## Links

- **Repository**: https://github.com/IAMSamuelRodda/embark-quoting-system
- **Project Board**: https://github.com/users/IAMSamuelRodda/projects/1
- **Issues**: https://github.com/IAMSamuelRodda/embark-quoting-system/issues
