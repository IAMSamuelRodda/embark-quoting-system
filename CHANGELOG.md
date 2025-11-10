# Changelog

All notable changes to the Embark Quoting System will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Fixed
- **Critical**: Race condition preventing users from adding jobs immediately after creating quotes
  - Implemented offline-first architecture for jobs (matching quotes pattern)
  - Jobs now saved to IndexedDB instantly without waiting for backend sync
  - Fixed 14 TypeScript compilation errors (type mismatches in Job interface)
  - Activated auto-sync mechanism in App.tsx to process sync queue when online
  - Fixed auth race condition where auto-sync fired before authentication completed (causing 401 errors)
  - Files changed: `jobsDb.ts` (new), `useJobs.ts`, `syncService.ts`, `apiClient.ts`, all job forms, `models.ts`, `indexedDb.ts`, `App.tsx`
  - Root cause #1: Jobs were backend-dependent while quotes were offline-first, creating sync timing dependency
  - Root cause #2: Auto-sync initialized before authentication, causing silent 401 failures
  - Solution: Jobs now use IndexedDB → Sync Queue → Backend pattern (same as quotes)
  - Sync queue now automatically processed after authentication completes
  - Auto-sync waits for `isAuthenticated` state before initializing
  - Test: `sync_verification.spec.ts` validates complete offline-first + auto-sync behavior
  - See commit messages for detailed implementation notes

### Known Issues
- Backend staging deployment failing (health check timeout on ECS task)
- Color scheme mismatch (index.css uses blue, style guide specifies CAT Gold #FFB400)
- Project board link inconsistency (CLAUDE.md vs README.md)

---

## [1.0.0-beta] - 2025-11-08

### Summary
MVP completion - All 8 epics implemented and tested locally. Frontend deployed to staging, backend deployment blocked by health check issues.

### Added
- **Epic 1: Foundation**
  - AWS infrastructure (ECS Fargate, RDS PostgreSQL, CloudFront, ALB, Cognito)
  - Terraform Infrastructure as Code for all AWS resources
  - Database schema with 8 core tables (quotes, jobs, financials, price_sheets, etc.)
  - Authentication system (AWS Cognito + JWT verification)
  - User management with RBAC (admin, user roles)

- **Epic 2: Backend Quote API**
  - RESTful API for quote CRUD operations
  - Quote versioning system for conflict resolution
  - Quote number generation (format: EE-YYYY-NNNN)
  - Validation with Zod schemas
  - Error handling middleware

- **Epic 3: Job Types Implementation**
  - 5 specialized job type forms:
    - Retaining Wall (wall type, height, length, footer depth)
    - Driveway (length, width, depth, surface type)
    - Trenching (length, width, depth)
    - Stormwater (system type, area, complexity)
    - Site Prep (area, clearing level, grading)
  - Job parameter storage (JSONB in database)
  - Job-specific validation rules

- **Epic 4: Financial Calculations**
  - Profit-First calculation model (Quote Price = Raw Materials ÷ 0.30)
  - 70% profit margin enforcement
  - Financial summary component
  - Price sheet management
  - Price item CRUD operations

- **Epic 5: Sync Engine**
  - Offline-first architecture with IndexedDB (Dexie.js)
  - Bidirectional sync (local ↔ cloud)
  - Conflict detection via version numbers
  - Conflict resolution UI (manual for critical fields, auto-merge for non-critical)
  - Sync queue for background operations
  - 5-day spike investigation completed (sync strategy documented)

- **Epic 6: Frontend UI**
  - React 19.1.1 with TypeScript 5.9.3
  - Vertical slice architecture (feature-based organization)
  - Design system v2.0 "Industrial Clarity"
    - CAT Gold (#FFB400) accent color
    - System font stack (performance over custom fonts)
    - 8px spacing grid
    - Component library (Button, Input, Select, Checkbox, Radio, Modal, Card, Toast, Logo)
  - 55+ Storybook component story variants
  - Responsive design (mobile-first)
  - Client-side routing (React Router 7.9.5)
  - State management (Zustand 5.0.8)
  - Offline data persistence (Dexie.js 4.2.1)

- **Epic 7: PDF Generation**
  - Client-side PDF generation (jsPDF)
  - Server-side PDF generation (PDFKit)
  - Quote PDF template with branding
  - Financial breakdown in PDF

- **Epic 8: Testing & Deployment**
  - 34 E2E tests with Playwright 1.56.1 (all passing locally)
  - 33 accessibility tests with axe-core (WCAG AA compliance)
  - Unit test infrastructure (Vitest for frontend, Jest for backend)
  - CI/CD pipelines (GitHub Actions):
    - Validate (lint, format, typecheck)
    - Build (frontend + backend Docker images)
    - Test (unit tests)
    - E2E tests
    - Deploy staging
    - Deploy production
  - Operations RUNBOOK
  - Manual testing workflows documented
  - Amazon-style deployment testing approach

### Changed
- Separated E2E test passwords for staging and production environments
- Enhanced governance policies (dev-branch-only for staging deployments)
- Updated all documentation (Nov 7-9, 2025)

### Fixed
- Cognito configuration now uses environment variables instead of hardcoded values
- GitHub workflow auto-merge enabled for feature → dev merges
- Branch protection configured correctly

### Security
- AWS Secrets Manager integration for sensitive credentials
- HTTPS/TLS for all API requests
- RDS database encryption (AES-256)
- Cognito JWT token verification
- No secrets in code or version control

---

## [0.1.0] - 2024-11-XX

### Summary
Initial project planning and blueprint creation.

### Added
- Project planning and requirements gathering
- BLUEPRINT.yaml specification (complexity-validated)
- Financial model documentation (Profit-First methodology)
- Initial repository structure
- Documentation framework (README, CONTRIBUTING, DEVELOPMENT, CLAUDE.md)

---

## Template for Future Releases

```markdown
## [X.Y.Z] - YYYY-MM-DD

### Summary
Brief description of this release (2-3 sentences).

### Added
- New features
- New endpoints
- New components

### Changed
- Changes to existing functionality
- Deprecations
- Refactoring

### Deprecated
- Features marked for removal in future versions

### Removed
- Features removed in this version

### Fixed
- Bug fixes
- Security patches

### Security
- Security-related changes
```

---

## Release Type Guidelines

### Major Version (X.0.0)
- Breaking changes
- Incompatible API changes
- Database schema changes requiring migration
- Architectural changes

### Minor Version (0.X.0)
- New features (backward compatible)
- New API endpoints
- New components
- Deprecations (with backward compatibility)

### Patch Version (0.0.X)
- Bug fixes
- Security patches
- Documentation updates
- Performance improvements

---

## Unreleased Changes

Track ongoing work here before the next release:

### In Progress
- Backend health check debugging (staging deployment)
- Color scheme reconciliation (CAT Gold implementation)
- Documentation consistency improvements

### Planned
- PWA service worker implementation
- Re-enable skipped E2E tests (after staging stabilization)
- Production deployment (after staging validation)
- Favicon suite generation (all sizes)

---

## Links

- **Repository:** https://github.com/IAMSamuelRodda/embark-quoting-system
- **Project Board:** https://github.com/users/IAMSamuelRodda/projects/2
- **Issues:** https://github.com/IAMSamuelRodda/embark-quoting-system/issues

---

[Unreleased]: https://github.com/IAMSamuelRodda/embark-quoting-system/compare/v1.0.0-beta...HEAD
[1.0.0-beta]: https://github.com/IAMSamuelRodda/embark-quoting-system/compare/v0.1.0...v1.0.0-beta
[0.1.0]: https://github.com/IAMSamuelRodda/embark-quoting-system/releases/tag/v0.1.0
