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

**🚀 Quick Start (Automated)**

One command to launch the full local development stack:

```bash
# Clone repository
git clone https://github.com/IAMSamuelRodda/embark-quoting-system.git
cd embark-quoting-system

# Launch full stack (database + backend + frontend + auto-login)
./scripts/dev-start.sh
```

**What it does:**
- ✅ Starts PostgreSQL database (Docker)
- ✅ Runs database migrations
- ✅ Starts backend API (port 3001)
- ✅ Starts frontend dev server (port 3000)
- ✅ Retrieves credentials from AWS
- ✅ Opens browser and auto-logs in

**Result:** Browser opens at `http://localhost:3000`, logged in and ready to test!

**Credentials (if needed manually):**
- Email: `e2e-test@embark-quoting.local`
- Password: Retrieve with `aws secretsmanager get-secret-value --secret-id embark-quoting/staging/e2e-test-credentials --query SecretString --output text | jq -r '.password'`

**See also:**
- [`specs/ENVIRONMENTS.md`](./specs/ENVIRONMENTS.md) - Complete environment setup guide
- [`specs/BLUEPRINT.yaml`](./specs/BLUEPRINT.yaml) - Implementation plan
- [`specs/FINANCIAL_MODEL.md`](./specs/FINANCIAL_MODEL.md) - Financial methodology

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
- PostgreSQL (local: Docker, cloud: RDS)
- Drizzle ORM
- Docker containerized

**Local Development Stack:**
- PostgreSQL 15 (Docker container: `embark-dev-db`)
- Backend API on port 3001 (Express with `--watch` for hot-reload)
- Frontend on port 3000 (Vite dev server)
- Staging Cognito for authentication
- Logs: `/tmp/embark-*.log` (backend, frontend, migrations)

**Production Infrastructure** (AWS):
- ECS Fargate (compute)
- RDS PostgreSQL (database)
- Cognito (authentication)
- S3 (storage)
- SES (email)
- CloudFront (CDN)

**Cost**: ~$45/month (production, low-moderate usage)

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

**Full Details**: See [`specs/FINANCIAL_MODEL.md`](./specs/FINANCIAL_MODEL.md) for complete methodology and rationale.

### Offline Sync

- **Conflict Detection**: Version vectors track changes
- **Auto-Merge**: Non-critical fields (notes, metadata)
- **Manual Resolution**: Critical fields (customer contact, status, totals)

**Implementation**: See Epic 5 in [`specs/BLUEPRINT.yaml`](./specs/BLUEPRINT.yaml)

---

## Documentation

- **[`specs/BLUEPRINT.yaml`](./specs/BLUEPRINT.yaml)**: Complete implementation plan (complexity-validated)
- **[`specs/FINANCIAL_MODEL.md`](./specs/FINANCIAL_MODEL.md)**: Profit-First calculation methodology
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

## Testing

**E2E Tests** (Playwright):
```bash
cd frontend

# Run all E2E tests (credentials auto-retrieved from AWS)
npm run test:e2e

# Run specific test suite
npx playwright test e2e/offline-auth.spec.ts
npx playwright test e2e/sync_verification.spec.ts
```

**Test Coverage**:
- ✅ Offline authentication workflow (4 tests)
- ✅ Auto-sync verification (4 tests)

**See [`DEVELOPMENT.md`](./DEVELOPMENT.md)** for:
- E2E test credential setup (environment variables or AWS Secrets Manager)
- Pre-commit checklist (linting, formatting, unit tests)
- CI/CD workflow expectations
- Troubleshooting guide

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
