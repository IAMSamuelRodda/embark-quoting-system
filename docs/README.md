# Documentation Index

**Purpose**: Navigation guide for all project documentation.
**Last Updated**: 2025-11-06

---

## 📁 Directory Structure

```
docs/
├── design/              # Visual design system & brand identity
├── infrastructure/      # DevOps, deployment, system architecture
├── planning/            # Project planning, spikes, epic breakdowns
└── financial-model.md   # Business model & pricing methodology
```

---

## 🎨 Design Documentation

**Location**: `design/`

Complete visual design system based on Embark Earthworks brand identity.

| Document | Purpose | Size |
|----------|---------|------|
| **style-guide.md** | Complete design system (v2.0 Master-Level Edition) | 52KB |
| **STYLE-GUIDE-README.md** | Quick start guide & navigation | 9KB |
| **visual-qa-checklist.md** | 200+ point pre-deployment checklist | 19KB |
| **devtools-color-extraction-guide.md** | Manual color verification guide | 16KB |

### Design Assets

**Location**: `design/assets/`

- **Logo Variants** (3 files, WebP format):
  - `embark-wordmark-black.webp` (1200×200px) - Desktop header, PDFs
  - `embark-icon-light.webp` (512×512px) - Favicon, light backgrounds
  - `embark-icon-dark.webp` (550×550px) - Dark mode, social media

- **Screenshot References**: `design/assets/screenshots/`
  - Directory structure for visual reference captures
  - See `screenshots/README.md` for capture guidelines

### Key Design Specifications

- **Brand Color**: #FFB400 (CAT Gold)
- **Design Philosophy**: Industrial Clarity (Brutalist + Swiss precision)
- **Typography**: System font stack (performance > brand vanity)
- **Spacing**: 8px grid system
- **Accessibility**: WCAG AA compliance

**Start here**: `design/STYLE-GUIDE-README.md`

---

## 🏗️ Infrastructure Documentation

**Location**: `infrastructure/`

DevOps, deployment, and system architecture documentation.

| Document | Purpose | Context |
|----------|---------|---------|
| **devops-setup.md** | AWS deployment configuration | ECS, VPC, PostgreSQL RDS setup |
| **infrastructure-roadmap.md** | Infrastructure evolution plan | Staging → Production path |
| **admin-user-provisioning.md** | Initial admin user setup | Bootstrap process |

### Key Infrastructure Details

- **Platform**: AWS (ECS Fargate, RDS PostgreSQL, S3)
- **Deployment**: Docker containers via GitHub Actions
- **Database**: PostgreSQL 14+ (RDS)
- **Environment**: Development → Staging → Production path

**Start here**: `infrastructure/devops-setup.md`

---

## 📊 Planning Documentation

**Location**: `planning/`

Project planning artifacts including epic breakdowns and spike investigation results.

### Epics

**Location**: `planning/epics/`

Epic-level feature planning and implementation guides.

| Epic | Document | Status |
|------|----------|--------|
| **Epic 3** | epic-3-job-types-plan.md | Implementation guide for 5 job types |

### Spikes

**Location**: `planning/spikes/`

Technical investigation results and complexity assessments.

#### Epic 0: Complexity Assessment

**File**: `epic-0-complexity-assessment.md`

Initial project complexity analysis establishing the foundation for sprint planning.

**Key Findings**:
- Vertical slice architecture reduces complexity
- Offline-first adds moderate complexity
- Sync engine identified as highest-risk area

#### Epic 5: Conflict Resolution

**Location**: `planning/spikes/epic-5-conflict-resolution/`

5-day spike investigating sync conflict resolution strategies.

| File | Purpose |
|------|---------|
| **design.md** | Conflict resolution strategy (version vectors, field-level merging) |
| **poc.js** | Proof-of-concept implementation |
| **refinements.md** | Post-spike architecture refinements |

**Key Decisions**:
- Version vectors for causality tracking
- Field-level conflict detection
- Manual resolution for critical fields, auto-merge for metadata

---

## 💰 Financial Model

**Location**: `financial-model.md` (root of docs/)

**Methodology**: Profit-First pricing (NOT cost-plus)

**Formula**: `Quote Price = Raw Materials ÷ 0.30`

**Purpose**:
- Defines financial calculation methodology
- Explains 70/30 split allocation
- Documents pricing strategy rationale

**Why in root**: Business-critical document referenced across all epics. Not infrastructure, not design - foundational business logic.

**Referenced by**: Epic 4 implementation (Financial Calculations)

---

## 🗺️ Navigation Guide

### For Designers

1. Read: `design/STYLE-GUIDE-README.md`
2. Reference: `design/style-guide.md`
3. Verify: `design/visual-qa-checklist.md`

### For Developers

1. Implementation: `design/style-guide.md` → UI Components
2. Infrastructure: `infrastructure/devops-setup.md`
3. Planning: `planning/epics/` for feature details

### For DevOps Engineers

1. Setup: `infrastructure/devops-setup.md`
2. Roadmap: `infrastructure/infrastructure-roadmap.md`
3. Bootstrap: `infrastructure/admin-user-provisioning.md`

### For Project Managers

1. Planning: `planning/epics/` and `planning/spikes/`
2. Financial: `financial-model.md`
3. Design: `design/STYLE-GUIDE-README.md` for implementation roadmap

---

## 🔗 Related Documentation

### Project Root

- **`CLAUDE.md`** - Navigation guide for sources of truth
- **`CONTRIBUTING.md`** - Agent workflow and GitHub practices
- **`README.md`** - Project overview
- **`specs/BLUEPRINT.yaml`** - Complete implementation plan

### External

- **GitHub Project**: https://github.com/users/IAMSamuelRodda/projects/1
- **Repository**: https://github.com/IAMSamuelRodda/embark-quoting-system
- **Company Website**: https://www.embarkearthworks.au/

---

## 📈 Documentation Statistics

| Category | Files | Total Size | Status |
|----------|-------|------------|--------|
| Design | 4 docs + 3 logos | ~98KB | ✅ Complete (v2.0) |
| Infrastructure | 3 docs | ~35KB | ✅ Complete |
| Planning | 5 docs (2 epics, 3 spikes) | ~60KB | ✅ Complete |
| Financial | 1 doc | ~8KB | ✅ Complete |

**Total**: 13 documentation files, ~200KB

---

## 🎯 Documentation Principles

Following the project's design philosophy of **Industrial Clarity**:

1. **Systematic Organization**: Clear hierarchy (design / infrastructure / planning)
2. **Single Source of Truth**: Each concept documented once, referenced everywhere
3. **Navigation Over Duplication**: README points to sources, doesn't duplicate content
4. **Functional Honesty**: Documentation structure reflects actual use patterns
5. **Material Integrity**: Files organized by domain, not arbitrary grouping

**Inspired by**: Embark style guide v2.0 design philosophy (Brutalist + Swiss precision)

---

## Change Log

| Date | Change | Reason |
|------|--------|--------|
| 2025-11-06 | Initial docs reorganization | Separated design, infrastructure, planning concerns |
| 2025-11-06 | Created navigation README | Provide systematic access to documentation |

---

**Maintained by**: Embark Quoting System Team
