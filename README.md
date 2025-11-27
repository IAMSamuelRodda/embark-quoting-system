# Embark Quoting System

> **Purpose**: Project introduction and quick start guide for developers and AI agents
> **Lifecycle**: Stable (update when project fundamentals change)

Offline-first PWA quoting application for Embark Landscaping & Earthworks.

## Project Status

**Architecture**: Vertical Slice, Offline-First PWA

**Current Work**: See [`STATUS.md`](./STATUS.md) for active work, known issues, and recent changes

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

One command to launch both frontend and backend development servers:

```bash
# Clone repository
git clone https://github.com/IAMSamuelRodda/embark-quoting-system.git
cd embark-quoting-system

# Set up environment files (first time only)
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Edit .env files with your credentials

# Launch full development stack
./scripts/dev-start.sh
```

**What it does:**
- ✅ Validates prerequisites (Docker, Node.js)
- ✅ Starts PostgreSQL database (Docker container)
- ✅ Runs database migrations
- ✅ Starts backend API (port 4000)
- ✅ Starts frontend dev server (port 3000)

**Access:**
- Frontend: http://localhost:3000
- Backend: http://localhost:4000

**Authentication (Development):**
- Set `DEV_AUTH_BYPASS=true` in backend `.env` to bypass authentication
- See ARCHITECTURE.md for authentication options (Cognito was deleted)

**See also:**
- [`specs/ENVIRONMENTS.md`](./specs/ENVIRONMENTS.md) - Complete environment setup guide
- [`ARCHITECTURE.md`](./ARCHITECTURE.md) - System architecture and technical details
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
- PostgreSQL (local: Docker, production: Docker on DO)
- Drizzle ORM
- Docker containerized

**Local Development Stack:**
- PostgreSQL 15 (Docker container: `embark-dev-db`)
- Backend API on port 4000 (Express with `--watch` for hot-reload)
- Frontend on port 3000 (Vite dev server)
- DEV_AUTH_BYPASS mode for testing
- Logs: `/tmp/embark-*.log` (backend, frontend, migrations)

**Production Infrastructure** (Digital Ocean):
- Frontend: https://embark.rodda.xyz
- Backend API: https://api.embark.rodda.xyz
- Droplet: 170.64.169.203 (s-2vcpu-4gb, Sydney)
- PostgreSQL (Docker container)
- Caddy (reverse proxy, auto-HTTPS)
- Authentication: 🔴 Needs implementation (Cognito deleted)

**Cost**: ~$24/month (shared droplet)

---

## Implementation Plan

The project is organized into 7 major epics with features and tasks tracked in GitHub Issues.

**View Current Status**: [GitHub Issues](https://github.com/IAMSamuelRodda/embark-quoting-system/issues) | [Project Board](https://github.com/users/IAMSamuelRodda/projects/2)

**Technical Details**: See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for complete system architecture, database schema, and implementation specifications.

---

## Key Features

### Job Types

Supports 5 specialized job types for landscaping and earthworks:
1. **Retaining Walls**
2. **Driveways**
3. **Trenching**
4. **Stormwater**
5. **Site Prep**

**Details**: See [`ARCHITECTURE.md`](./ARCHITECTURE.md) § Database Schema for job parameters and calculation logic.

### Financial Model

Uses **Profit-First methodology** with configurable allocation percentages for businesses <$250K revenue.

**Formula**: `Quote Price = Raw Materials ÷ 0.30`

**Full Details**: See [`specs/FINANCIAL_MODEL.md`](./specs/FINANCIAL_MODEL.md) for complete methodology and rationale.

### Offline Sync

- **Conflict Detection**: Version vectors track changes
- **Auto-Merge**: Non-critical fields (notes, metadata)
- **Manual Resolution**: Critical fields (customer contact, status, totals)

**Implementation**: See [`ARCHITECTURE.md`](./ARCHITECTURE.md) § Offline-First Strategy → Sync Engine

---

## Documentation

- **[`ARCHITECTURE.md`](./ARCHITECTURE.md)**: System architecture, database schema, tech stack, ADRs
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

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) and [`STATUS.md`](./STATUS.md) for current status and requirements.

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

# Run all E2E tests
npm run test:e2e

# Run specific test suite
npx playwright test e2e/offline-auth.spec.ts
npx playwright test e2e/sync_verification.spec.ts
```

**Test Coverage**:
- ✅ Offline authentication workflow (4 tests)
- ✅ Auto-sync verification (4 tests)

**See [`DEVELOPMENT.md`](./DEVELOPMENT.md)** for:
- E2E test credential setup
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

- **Production Frontend**: https://embark.rodda.xyz
- **Production API**: https://api.embark.rodda.xyz
- **Repository**: https://github.com/IAMSamuelRodda/embark-quoting-system
- **Project Board**: https://github.com/users/IAMSamuelRodda/projects/2
- **Issues**: https://github.com/IAMSamuelRodda/embark-quoting-system/issues
