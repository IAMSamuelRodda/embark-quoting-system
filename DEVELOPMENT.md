# Development Workflow

> **Purpose**: Developer and agent workflow for code quality, testing, and CI/CD integration.

---

## 🌿 Git Branching Strategy

This project uses a **three-tier branching model**: `feature/*` → `dev` → `main`

### Branch Overview

| Branch | Purpose | Deployments | Auto-Merge | Approval Required |
|--------|---------|-------------|-----------|-------------------|
| `feature/*` | Active development | None | ✅ Yes (CI passes) | No |
| `dev` | Integration & staging | Staging (AWS ECS) | ✅ Yes (CI passes) | No |
| `main` | Production-ready | Production | ❌ No | **Yes** (human-in-loop) |

### Development Flow

```bash
# 1. Always branch from dev
git checkout dev
git pull origin dev
git checkout -b feature/my-feature

# 2. Work on feature with frequent commits
git add .
git commit -m "feat: implement feature X (Relates to #42)"

# 3. Push and create PR to dev
git push -u origin feature/my-feature
gh pr create --base dev --title "Feature: X" --body "Implements X (Closes #42)"

# 4. CI runs: validate → test → build
# 5. Auto-merge to dev when CI passes

# 6. Staging deployment triggered automatically from dev
# 7. E2E tests run on staging

# 8. When ready for production, create dev → main PR
gh pr create --base main --head dev --title "Release: v1.2.0"

# 9. Human approval required for main merge
# 10. Production deployment triggered automatically on main merge
```

### CI/CD Pipeline by Branch

**Feature Branches** (`feature/*` → `dev` PR):
- ✓ Validate (lint, security, typecheck) - ~1 min
- ✓ Test (unit + integration) - ~2-3 min
- ✓ Build (Docker image + smoke test) - ~3-5 min
- → Auto-merge to `dev` if all pass

**Dev Branch** (after merge):
- ✓ Full test suite (unit + integration) - ~2-3 min
- ✓ Build (Docker image to ECR) - ~3-5 min
- ✓ Deploy to Staging (AWS ECS) - ~5 min
- ✓ E2E tests on staging - ~2 min
- → Staging ready for testing

**Dev → Main PR**:
- ✓ Validate (quick sanity) - ~1 min
- ✓ Build (smoke test only) - ~2 min
- ✓ Verify staging deployment health - ~30 sec
- → **Human approval required** (you confirm)

**Main Branch** (after tag push like `v1.0.0`):
- ✓ Pre-deployment validation (tag format check) - ~30 sec
- ✓ Deploy to Production (AWS ECS + S3/CloudFront) - ~10-15 min
- ✓ Post-deployment verification (health checks only) - ~1-2 min
- ✓ Monitor CloudWatch metrics (5 min with auto-rollback) - ~5 min
- ✓ Create GitHub release - ~30 sec
- → Production live

**Amazon-style deployment**: Full testing happens in staging. Production deployment only verifies health and monitors metrics for degradation. If error rates spike or targets become unhealthy, automatic rollback is triggered.

### Test Files & Clean Production

**All branches** contain test files in git history, but they're **excluded from production deployments**:

```bash
# .gitattributes export-ignore pattern
frontend/e2e/ export-ignore
frontend/tests/ export-ignore
frontend/**/*.test.ts export-ignore
backend/tests/ export-ignore
.github/workflows-debug/ export-ignore
```

**Result**:
- `git ls-files` shows test files (✓ traceability)
- `git archive` excludes test files (✓ clean deployments)
- Production Docker images contain only runtime code

### Hotfix Workflow

For urgent production fixes, branch from `main`:

```bash
# 1. Branch from main (not dev)
git checkout main
git pull origin main
git checkout -b hotfix/critical-bug

# 2. Fix and commit
git commit -m "fix: critical production bug (Fixes #89)"

# 3. Create PR to main (bypasses dev/staging)
gh pr create --base main --title "Hotfix: Critical Bug" --body "Fixes #89"

# 4. After merge to main, backport to dev
git checkout dev
git merge main
git push origin dev
```

### Branch Protection Rules

**Main Branch**:
- Require PR reviews: ✅ 1 approver (you)
- Require status checks: ✅ validate, build smoke tests
- Allow force pushes: ❌ No
- Allow deletions: ❌ No

**Dev Branch**:
- Require PR reviews: ❌ No (auto-merge)
- Require status checks: ✅ validate, test, build, staging deploy
- Allow force pushes: ❌ No

**Feature Branches**:
- No protection (deleted after merge)

---

## 🔍 Pre-Commit Checklist (CRITICAL)

**Before EVERY commit**, complete this checklist:

```bash
# 1. Run linting and auto-fix issues
cd backend && npm run lint:fix
cd frontend && npm run lint:fix

# 2. Format code with Prettier
cd backend && npm run format
cd frontend && npm run format

# 3. Run unit tests (if applicable to changes)
cd backend && npm run test:unit
cd frontend && npm run test:unit

# 4. Review staged changes
git status
git diff --staged

# 5. Verify commit message includes issue reference
#    Use: "Closes #N", "Relates to #N", "Fixes #N"
```

**Why**: CI runs these same checks. Catching issues locally saves time and prevents broken builds.

---

## 🚀 CI/CD Workflow Expectations

After pushing to **feature branches** or **dev**, GitHub Actions automatically runs these workflows:

| Workflow | Triggers | Checks | Pass Criteria | Duration |
|----------|----------|--------|---------------|----------|
| **Validate** | PRs to dev/main, pushes to dev/main | ESLint + Prettier + TypeCheck | No violations | ~1 min |
| **Test** | PRs to dev, pushes to dev | Unit + integration tests | All tests pass | ~2-3 min |
| **Build** | PRs to dev/main, pushes to dev/main | Docker build (conditional by branch) | Image builds successfully | ~3-5 min |
| **Deploy Staging** | Pushes to dev only | Deploy to AWS ECS + E2E tests | Services healthy, tests pass | ~7-12 min |
| **Deploy Production** | Pushes to main only | Deploy to production + smoke tests | Services healthy | ~5-10 min |

### Branch-Specific Workflows

**On `feature/*` → `dev` PR**:
1. Validate → Test → Build (smoke test)
2. Auto-merge if all pass

**On `dev` branch push** (after feature merge):
1. Validate → Test → Build (full)
2. Deploy to Staging
3. E2E tests on staging

**On `dev` → `main` PR**:
1. Validate (quick sanity)
2. Build (smoke test only)
3. **Manual approval required** → merge

**On `main` branch tag push** (e.g., `git tag v1.0.0 && git push origin v1.0.0`):
1. Pre-deployment validation (tag format check)
2. Deploy to Production (ECS + S3/CloudFront)
3. Post-deployment verification (health checks only)
4. Monitor CloudWatch metrics (5 min, auto-rollback on degradation)
5. Create GitHub release

**Note**: Production uses **Amazon-style deployment** - no full E2E tests, only health verification + metrics monitoring. All comprehensive testing was already done in staging.

### Monitoring Workflow Status

```bash
# View recent workflow runs
gh run list --limit 5

# Watch latest workflow (blocks until complete)
gh run watch

# View specific workflow logs
gh run view <run-id> --log
```

### If Workflows Fail

1. **Check which workflow failed**: `gh run list --limit 3`
2. **View failure logs**: `gh run view <run-id> --log-failed`
3. **Fix issues locally** using pre-commit checklist
4. **Push fix**: CI will re-run automatically

**Common failures**:
- **Test failures**: Missing database schema, incorrect env vars, logic errors
- **Validate failures**: ESLint violations, Prettier formatting issues
- **Build failures**: Missing Dockerfile, incorrect dependencies, AWS config issues

---

## 🗄️ Database Connection Pattern

**RULE**: All database connection code MUST support both environment variable formats:

### Supported Formats

1. **`DATABASE_URL`** (CI, production):
   ```bash
   DATABASE_URL=postgresql://user:pass@host:port/database
   ```

2. **Individual vars** (local development):
   ```bash
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=embark_admin
   DB_PASSWORD=secret
   DB_NAME=embark_quoting_staging
   ```

### Implementation Pattern

See `backend/src/shared/db/postgres.js:7-38` for reference:

```javascript
function getPoolConfig() {
  // Priority 1: Use DATABASE_URL if available (CI/production)
  if (process.env.DATABASE_URL) {
    return {
      connectionString: process.env.DATABASE_URL,
      // ... other pool config
    };
  }

  // Priority 2: Fall back to individual env vars (local dev)
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'embark_quoting_staging',
    user: process.env.DB_USER || 'embark_admin',
    password: process.env.DB_PASSWORD,
    // ... other pool config
  };
}
```

**Applies to**:
- Connection pools (`postgres.js`)
- Drizzle config (`drizzle.config.js`)
- Migration scripts (`database/migrate.js`)
- Test setup (`database/seed-test.js`)

**Why**: CI uses `DATABASE_URL`, local dev uses individual vars. Supporting both prevents CI failures.

---

## 🧪 Test Organization

### Directory Structure

```
backend/
├── src/features/          # Feature code + unit tests
│   └── financials/
│       ├── calculation.service.js
│       └── calculation.service.test.js  # Unit tests (no DB)
│
└── tests/
    └── integration/       # Integration tests (require DB)
        ├── database.test.js
        └── calculation.service.test.js  # Integration tests (use DB)
```

### Test Types

| Test Type | Location | Database | Run Command |
|-----------|----------|----------|-------------|
| **Unit Tests** | `src/features/*/**.test.js` | ❌ No | `npm run test:unit` |
| **Integration Tests** | `tests/integration/*.test.js` | ✅ Yes | `npm run test:integration` |

**Rule**: Tests requiring database connections are **integration tests**, not unit tests.

### Running Tests Locally

```bash
# Unit tests (fast, no DB required)
cd backend && npm run test:unit

# Integration tests (requires PostgreSQL)
cd backend && npm run test:integration

# All tests
cd backend && npm test

# With coverage
cd backend && npm run test:coverage
```

### Integration Test Setup

Integration tests require PostgreSQL running locally:

```bash
# Start PostgreSQL (if using Docker)
docker run -d \
  --name embark-test-db \
  -e POSTGRES_USER=embark_test \
  -e POSTGRES_PASSWORD=test_password \
  -e POSTGRES_DB=embark_quoting_test \
  -p 5432:5432 \
  postgres:15

# Run migrations and seed
DATABASE_URL="postgresql://embark_test:test_password@localhost:5432/embark_quoting_test" \
  npm run migrate:test

# Run integration tests
DATABASE_URL="postgresql://embark_test:test_password@localhost:5432/embark_quoting_test" \
  npm run test:integration
```

---

## 📦 Local Development Setup

### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your local database credentials

# Run migrations
npm run db:migrate

# Start development server (with hot reload)
npm run dev
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API URL and Cognito config

# Start development server
npm run dev
```

### Database Tools

```bash
# Open Drizzle Studio (visual DB editor)
cd backend && npm run db:studio

# Generate new migration
cd backend && npm run db:generate

# Push schema changes (development only)
cd backend && npm run db:push
```

---

## 🐛 Troubleshooting

### ESLint Errors After Pull

```bash
cd backend && npm run lint:fix
cd frontend && npm run lint:fix
```

### Prettier Formatting Issues

```bash
cd backend && npm run format
cd frontend && npm run format
```

### Integration Tests Failing Locally

```bash
# 1. Check PostgreSQL is running
pg_isready -h localhost -p 5432

# 2. Verify database exists
psql -h localhost -U embark_test -d embark_quoting_test -c "\dt"

# 3. Run migrations
DATABASE_URL="postgresql://embark_test:test_password@localhost:5432/embark_quoting_test" \
  npm run migrate:test

# 4. Check test logs for specific errors
npm run test:integration 2>&1 | tee test-output.log
```

### CI Tests Passing, Local Tests Failing

**Cause**: Environment variable mismatch

**Solution**: Check that your local database connection supports both formats (see "Database Connection Pattern" above)

### Build Workflow Failing

**Common causes**:
1. **Missing Dockerfile**: Ensure `backend/Dockerfile` exists
2. **AWS not configured**: Build workflow skips if `AWS_ROLE_TO_ASSUME` secret not set (this is OK)
3. **Docker build errors**: Check Dockerfile syntax and dependencies

---

## 📚 Additional Resources

- **Architecture**: `specs/BLUEPRINT.yaml` - Complete technical specifications
- **Financial Model**: `specs/FINANCIAL_MODEL.md` - Profit-First calculation details
- **Progress Tracking**: `CONTRIBUTING.md` - Issue workflow and GitHub CLI commands
- **Project Navigation**: `CLAUDE.md` - Quick reference for finding information

---

**Last Updated**: 2025-11-06 (Initial version - extracted from CLAUDE.md and CONTRIBUTING.md)
