# Embark Quoting System

Offline-first PWA quoting application for Embark Landscaping & Earthworks.

## Project Status

**Current Phase**: In Development
**Architecture**: Vertical Slice, Offline-First PWA
**Progress**: [View Project Board](https://github.com/users/IAMSamuelRodda/projects/2) | [View Issues](https://github.com/IAMSamuelRodda/embark-quoting-system/issues)

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

# View Epic 1 tasks
gh issue view 1

# Start working on an epic
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

The project is organized into 7 major epics with features and tasks tracked in GitHub Issues.

**View Current Status**: [GitHub Issues](https://github.com/IAMSamuelRodda/embark-quoting-system/issues) | [Project Board](https://github.com/users/IAMSamuelRodda/projects/2)

**Implementation Details**: See [`specs/BLUEPRINT.yaml`](./specs/BLUEPRINT.yaml) for complete technical specifications.

---

## Key Features

### Job Types

Supports 5 specialized job types for landscaping and earthworks:
1. **Retaining Walls**
2. **Driveways**
3. **Trenching**
4. **Stormwater**
5. **Site Prep**

**Details**: See [`specs/BLUEPRINT.yaml`](./specs/BLUEPRINT.yaml) for complete parameters and calculation logic.

### Financial Model

Uses **Profit-First methodology** with configurable allocation percentages for businesses <$250K revenue.

**Formula**: `Quote Price = Raw Materials ÷ 0.30`

**Full Details**: See [`docs/financial-model.md`](./docs/financial-model.md) for complete methodology and rationale.

### Offline Sync

- **Conflict Detection**: Version vectors track changes
- **Auto-Merge**: Non-critical fields (notes, metadata)
- **Manual Resolution**: Critical fields (customer contact, status, totals)

**Implementation**: See Epic 5 in [`specs/BLUEPRINT.yaml`](./specs/BLUEPRINT.yaml)

---

## Documentation

- **[`specs/BLUEPRINT.yaml`](./specs/BLUEPRINT.yaml)**: Complete implementation plan (complexity-validated)
- **[`docs/financial-model.md`](./docs/financial-model.md)**: Profit-First calculation methodology
- **[`CONTRIBUTING.md`](./CONTRIBUTING.md)**: Agent workflow and progress tracking guide

---

## Progress Tracking

This project uses **GitHub Issues + Projects** for dynamic progress tracking.

**View Progress**:
- [Project Board](https://github.com/users/IAMSamuelRodda/projects/2) (visual roadmap)
- [All Issues](https://github.com/IAMSamuelRodda/embark-quoting-system/issues) (hierarchical: epic → feature → task)

**Update Progress** (agents):
```bash
# Mark epic/feature in-progress
gh issue edit <issue-number> --remove-label "status: pending" --add-label "status: in-progress"

# Add progress comment
gh issue comment <issue-number> --body "Completed Feature X.Y: [description]"

# Close completed feature/task (progress auto-rolls up to parent epic)
gh issue close <issue-number> --comment "Feature complete"
```

See [`CONTRIBUTING.md`](./CONTRIBUTING.md) for complete workflow.

---

## Success Criteria

See [`specs/BLUEPRINT.yaml`](./specs/BLUEPRINT.yaml) for complete functional, performance, security, and UX requirements.

**Key Goals**:
- Full offline functionality
- Professional PDF export
- Sub-3s load times
- WCAG AA accessibility
- Secure authentication & RBAC

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
- **Project Board**: https://github.com/users/IAMSamuelRodda/projects/2
- **Issues**: https://github.com/IAMSamuelRodda/embark-quoting-system/issues
