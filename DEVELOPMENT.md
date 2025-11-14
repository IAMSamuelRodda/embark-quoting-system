# Development Workflow

> **Purpose**: Git workflow, CI/CD pipelines, and pre-commit checklist
> **Lifecycle**: Stable (update when branching strategy or CI/CD processes change)

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
# 5. Auto-merge to dev when CI passes (uses --merge to preserve history)

# 6. Staging deployment triggered automatically from dev
# 7. E2E tests run on staging

# 8. When ready for production, create dev → main PR
gh pr create --base main --head dev --title "Release: v1.2.0"

# 9. Human approval required for main merge
# 10. Production deployment triggered automatically on main merge
```

### Branch Protection

**Git Hook**: A pre-push hook prevents direct pushes to `dev` and `main` branches.

**Setup** (after cloning):
```bash
./scripts/install-git-hooks.sh
```

**What it does**: Blocks pushes if you're on `dev` or `main`, reminding you to use feature branches.

**If you need to bypass** (emergency hotfixes only):
```bash
git push --no-verify origin main  # Use with extreme caution
```

### PR Merge Strategy

**RULE**: Use `--merge` (merge commit) for all PRs to preserve complete feature branch history.

**Why**: Merge commits show the true branch flow in git graph and preserve individual commit history (each commit was tested by CI). Squash merging creates "orphaned" commits that don't show merging back into the main line.

**How to Merge**:
```bash
# Automatic (when CI passes) - GitHub Actions uses --merge
# Manual merge if needed:
gh pr merge <PR-number> --merge --auto

# Do NOT use:
gh pr merge <PR-number> --squash  # ❌ Loses individual commit history
gh pr merge <PR-number> --rebase  # ❌ Rewrites commit SHAs
```

**Exception**: Only use `--squash` for rare cases with genuinely messy WIP commits that shouldn't be preserved.

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

# 4. Run E2E tests (if authentication or sync changes)
#    See "E2E Test Credentials" section for setup
cd frontend && npm run test:e2e

# 5. Review staged changes
git status
git diff --staged

# 6. Verify commit message includes issue reference
#    Use: "Closes #N", "Relates to #N", "Fixes #N"
```

**Why**: CI runs these same checks. Catching issues locally saves time and prevents broken builds.

**Note**: E2E tests require credentials from environment variables or AWS Secrets Manager. See the "E2E Test Credentials" section below for setup instructions.

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

## 🌐 Deployed Environments

### Staging Environment (Cost-Optimized)

**Current Architecture** (Updated: 2025-11-13):
- **Cost Target**: <$1/day ($30/month) ✅
- **Actual Cost**: ~$0.23/day (~$7/month)

**Deployed URLs**:
```
Frontend (CloudFront):  https://d2vxgs70elbgcz.cloudfront.net
Backend API:            http://3.27.195.113:3000
Database:               embark-quoting-staging-db.c6nzq8xqzvxf.ap-southeast-2.rds.amazonaws.com
Health Check:           http://3.27.195.113:3000/health
```

**Architecture Details**:
- ✅ Frontend served via CloudFront (HTTPS, global CDN)
- ✅ Backend runs on ECS Fargate with public IP (HTTP, direct access)
- ✅ Database: RDS PostgreSQL 15.14 (single-AZ, db.t4g.micro)
- ✅ CORS configured to allow CloudFront origin
- ⚠️ **NO Application Load Balancer** (saves $25/month)
- ⚠️ **NO NAT Gateway** (saves $65/month)

**Important Notes**:
1. **Backend IP Changes**: The backend IP (`3.27.195.113`) changes every time the ECS task restarts
   - GitHub Actions automatically updates `STAGING_API_URL` secret after deployment
   - Frontend `.env.staging` needs manual update if deploying locally
   - See `archive/2025-11-13-CLOUDFRONT-BACKEND-ORIGIN-LIMITATION.md` for details

2. **Mixed Content Warnings**: Frontend (HTTPS) calls backend (HTTP)
   - Browsers may show security warnings
   - This is expected for cost-optimized development environment
   - Production will use ALB + CloudFront backend for full HTTPS

3. **CORS Configuration**: Backend accepts requests from:
   ```
   http://localhost:5173              (local development)
   https://d2vxgs70elbgcz.cloudfront.net  (deployed frontend)
   ```

**Upgrade Path** (when you have paying customers):
```hcl
# Option 1: Add Route 53 DNS ($0.50/month)
# - Provides stable DNS name for backend IP
# - Still direct access, but no IP changes

# Option 2: Add ALB ($25/month)
# - Stable DNS name
# - Health checks
# - SSL termination
# - Can route through CloudFront backend distribution for full HTTPS
```

**Daily Shutdown to Save Costs**:
```bash
# Stop infrastructure when not working (saves $0.80/day)
./scripts/infra-shutdown.sh

# Start infrastructure when resuming work
./scripts/infra-startup.sh
# Script displays backend IP - update .env.staging if needed
```

### Production Environment

**Status**: Not deployed yet (waiting for real users)

**Planned Architecture**:
- Application Load Balancer (health checks, SSL termination)
- NAT Gateway (secure outbound traffic)
- Multi-AZ RDS (high availability)
- CloudFront for both frontend and backend (full HTTPS)
- Estimated cost: ~$100/month

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

## 🔐 E2E Test Credentials

All Playwright E2E tests use centralized credential management via `frontend/e2e/test-utils.ts`. Tests automatically retrieve credentials and fail fast with clear error messages if unavailable.

### How It Works

The `getAndValidateCredentials()` function retrieves credentials in this order:

1. **Environment variables** (if set):
   - `TEST_USER_EMAIL`
   - `TEST_USER_PASSWORD`

2. **AWS Secrets Manager** (fallback):
   - Secret: `embark-quoting/staging/e2e-test-credentials`
   - Fields: `email`, `password`

3. **Fail fast** with detailed error message if neither source available

**Why**: Prevents tests from hanging at login for 15+ seconds with empty passwords. Tests now fail immediately with actionable error messages.

### Running E2E Tests

```bash
cd frontend

# Option 1: Auto-retrieve from AWS (recommended)
# No setup needed - credentials fetched automatically
npx playwright test e2e/offline-auth.spec.ts
npx playwright test e2e/sync_verification.spec.ts

# Option 2: Use environment variables
export TEST_USER_EMAIL="e2e-test@embark-quoting.local"
export TEST_USER_PASSWORD="<password>"
npx playwright test

# Run all E2E tests
npm run test:e2e

# Run with UI (headed mode)
npx playwright test e2e/offline-auth.spec.ts --headed
```

### Test Suites

| Test Suite | Tests | Coverage |
|------------|-------|----------|
| **offline-auth.spec.ts** | 4 | Offline authentication flow, Remember Me, credential expiry, invalid credentials |
| **sync_verification.spec.ts** | 4 | Auto-sync initialization, quote/job sync, sync status UI, offline scenarios |

**Total**: 8 E2E tests validating offline-first architecture and authentication.

### Troubleshooting

#### Error: "Cannot retrieve test credentials"

**Cause**: Neither environment variables nor AWS credentials are available.

**Solutions**:

1. **Set environment variables**:
   ```bash
   export TEST_USER_EMAIL="e2e-test@embark-quoting.local"
   export TEST_USER_PASSWORD="<password>"
   ```

2. **Configure AWS CLI** (if using AWS fallback):
   ```bash
   # Configure AWS credentials
   aws configure

   # Verify access to secrets
   aws secretsmanager get-secret-value \
     --secret-id embark-quoting/staging/e2e-test-credentials
   ```

3. **Check AWS permissions**: Ensure IAM user has `secretsmanager:GetSecretValue` permission for the staging secrets.

#### Tests Hang at Login (15+ seconds)

**Symptom**: Test times out waiting for navigation after clicking "Sign In".

**Root Cause** (FIXED): Tests previously used `|| ''` fallback for missing passwords, causing indefinite hangs.

**Current Behavior**: Tests now fail fast with clear error message instead of hanging.

**If still occurring**:
- Check that `test-utils.ts` is being used: `import { getAndValidateCredentials } from './test-utils';`
- Verify credentials are not empty: `console.log` output should show "Credentials validated successfully"

#### Password Too Short Warning

**Error**: `Password looks invalid (too short). Expected: At least 8 characters for Cognito`

**Cause**: AWS Cognito requires passwords to be at least 8 characters.

**Solution**: Check that the correct password is being retrieved (not a truncated or test placeholder value).

#### AWS CLI Not Configured

**Error**: `Unable to locate credentials. You can configure credentials by running "aws configure"`

**Solution**:
```bash
aws configure
# Enter AWS Access Key ID
# Enter AWS Secret Access Key
# Default region: ap-southeast-2 (or your staging region)
# Default output format: json
```

### Writing New E2E Tests

When creating new E2E tests, always use centralized credential management:

```typescript
import { test, expect } from '@playwright/test';
import { getAndValidateCredentials } from './test-utils';

// Get credentials at module level (fails fast if not available)
const { email, password } = getAndValidateCredentials();

test.describe('My Test Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Login flow
    await page.goto('http://localhost:3000/login');
    await page.getByPlaceholder(/email/i).fill(email);
    await page.getByPlaceholder(/password/i).fill(password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL(/\/(dashboard|quotes)/, { timeout: 15000 });
  });

  test('my test', async ({ page }) => {
    // Test logic...
  });
});
```

**DO NOT** use hardcoded credentials or empty string fallbacks:
```typescript
// ❌ WRONG - causes hanging tests
const password = process.env.TEST_USER_PASSWORD || '';

// ❌ WRONG - hardcoded credentials
const password = 'hardcoded-password-123';

// ✅ CORRECT - centralized with validation
const { email, password } = getAndValidateCredentials();
```

---

## 📦 Local Development Setup

### Quick Start (Recommended)

**One-command full-stack startup** - complete development environment:

```bash
./scripts/dev-start.sh
```

This comprehensive script:
- ✅ Validates prerequisites (Docker, AWS CLI, Node.js)
- ✅ Starts PostgreSQL database (Docker container)
- ✅ Runs database migrations
- ✅ Retrieves AWS Cognito credentials from Secrets Manager
- ✅ Starts backend API server (port 4000)
- ✅ Starts frontend dev server (port 3000)
- ✅ Auto-logs in using Playwright browser automation

**Result:** Browser opens at `http://localhost:3000`, logged in and ready to test!

**Prerequisites:**
- Docker Desktop running
- AWS CLI configured with appropriate credentials
- Node.js 18+ installed

**Stop:** Press `Ctrl+C` to stop all services

---

### Manual Setup (Alternative)

If you prefer to run services individually in separate terminals:

#### Backend Setup

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

#### Frontend Setup

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

## ❌ Anti-Patterns: Critical Mistakes to Avoid

### 🚨 NEVER Hardcode E2E Test Credentials

**ANTI-PATTERN (DO NOT DO THIS)**:
```typescript
// ❌ WRONG - Hardcoded environment variable that doesn't exist
const password = process.env.E2E_TEST_PASSWORD || '';
const email = 'e2e-test@embark-quoting.local';

// ❌ WRONG - Hardcoded fallback password
const password = process.env.E2E_TEST_PASSWORD || 'AutoTest123!';
```

**Why This Is Catastrophic**:
1. **Silent Failures**: If `E2E_TEST_PASSWORD` doesn't exist, password is empty string (`''`)
2. **Tests Pass Login Stage**: Playwright successfully fills empty string into password field
3. **Authentication Fails**: Cognito returns "Incorrect username or password"
4. **Cascading Failures**: All downstream tests fail (sync, job creation, etc.)
5. **Wasted Debugging Time**: Developers debug sync/API code when the problem is test setup
6. **False Root Cause**: Looks like application bug when it's actually missing credentials

**Real-World Impact**:
- **Session 1**: Debugged sync service code for 2+ hours
- **Session 2**: Fixed scope errors, type mismatches - all irrelevant
- **Session 3**: Deployed debug-specialist subagent to investigate sync failures
- **Actual Problem**: Tests couldn't log in because password was empty string

**CORRECT PATTERN (ALWAYS DO THIS)**:
```typescript
// ✅ CORRECT - Use centralized credential retrieval
import { getAndValidateCredentials } from './test-utils';

const { email, password } = getAndValidateCredentials();
```

**What `getAndValidateCredentials()` Does**:
1. **Tries environment variables first**: `TEST_USER_EMAIL`, `TEST_USER_PASSWORD`
2. **Falls back to AWS Secrets Manager**: `embark-quoting/staging/e2e-test-credentials`
3. **Validates credentials are not empty**: Checks password length >= 8 chars
4. **Fails fast with clear error**: Tells developer exactly how to fix the issue
5. **Logs credential status**: Shows redacted password length for debugging

**Enforcement**:
- **Pre-commit check**: `grep -r "E2E_TEST.*PASSWORD" --include="*.spec.ts" frontend/e2e/`
- **If matches found**: Reject commit with error message pointing to this documentation
- **CI/CD validation**: Same check in GitHub Actions to prevent merging

**Why This Pattern Exists**:
- AWS Secrets Manager is authoritative source for staging/production credentials
- Environment variables allow local override without committing secrets
- Centralized validation prevents multiple implementations with different error handling
- Fail-fast approach saves hours of debugging downstream failures

**Historical Context**:
This anti-pattern was encountered in commit 09c2653 where 8 test files used hardcoded `process.env.E2E_TEST_PASSWORD` that didn't exist, causing all E2E tests to fail authentication silently. The debugging process consumed 3+ sessions across multiple agents before identifying the root cause.

---

## 💰 AWS Cost Management (CRITICAL FOR DEVELOPMENT)

> **Target**: <$1/day ($30/month) for development environment
> **Actual (Before Optimization)**: $8-10/day ($240-300/month)
> **Actual (After Optimization)**: $0.15-0.30/day ($5-8/month) ✅

### Overview

This project was accidentally deployed with **production-grade infrastructure** ($140/month) when only minimal development infrastructure ($5/month) was needed. This section documents cost drivers, fixes, and daily management practices to prevent future cost spikes.

### Cost Breakdown Analysis (Nov 2025)

**Before Optimization** (Nov 8-11, 2025):
```
Service                              Daily Cost    Monthly Cost
─────────────────────────────────────────────────────────────
Amazon Virtual Private Cloud         $2.25/day     $67.50/month
  ├─ NAT Gateway #1 (AZ 1)          $1.08/day     $32.40/month
  ├─ NAT Gateway #2 (AZ 2)          $1.08/day     $32.40/month
  └─ Data Transfer                  $0.09/day     $  2.70/month

Application Load Balancers (3x)      $2.50/day     $75.00/month
  ├─ embark-quoting-alb             $0.83/day     $25.00/month
  ├─ staging-alb                    $0.83/day     $25.00/month
  └─ production-alb                 $0.83/day     $25.00/month

RDS PostgreSQL (2 instances)         $1.00/day     $30.00/month
  ├─ Staging (db.t4g.micro)         $0.50/day     $15.00/month
  └─ Production (db.t3.micro)       $0.50/day     $15.00/month

ECS Fargate                          $0.50/day     $15.00/month
CloudWatch Logs                      $0.10/day     $  3.00/month
Secrets Manager                      $0.05/day     $  1.50/month
Cognito                              $0.02/day     $  0.60/month
─────────────────────────────────────────────────────────────
TOTAL (before tax)                   $6.42/day     $192.60/month
Australian GST (10%)                 $0.64/day     $ 19.26/month
─────────────────────────────────────────────────────────────
TOTAL (with tax)                     $7.06/day     $211.86/month
```

**After Optimization** (Nov 13+ onwards):
```
Service                              Daily Cost    Monthly Cost
─────────────────────────────────────────────────────────────
RDS PostgreSQL (db.t4g.micro)        $0.00/day     $  0.00/month (Free Tier)
ECS Fargate (0.25 vCPU, 512 MB)     $0.00/day     $  0.00/month (Free Tier)
CloudFront (1 TB transfer)           $0.00/day     $  0.00/month (Free Tier)
S3 (storage + requests)              $0.03/day     $  1.00/month
Data Transfer (outbound)             $0.10/day     $  3.00/month
CloudWatch Logs                      $0.03/day     $  1.00/month
Secrets Manager                      $0.03/day     $  1.00/month
Cognito                              $0.02/day     $  0.60/month
─────────────────────────────────────────────────────────────
TOTAL (before tax)                   $0.21/day     $  6.60/month
Australian GST (10%)                 $0.02/day     $  0.66/month
─────────────────────────────────────────────────────────────
TOTAL (with tax)                     $0.23/day     $  7.26/month ✅
```

**Savings**: $6.83/day ($205/month) - **97% cost reduction**

### Root Cause Analysis

**Mistake #1**: Terraform defaults set to production-grade
- `enable_nat_gateway = true` (default in variables.tf)
- `enable_alb = true` (default in variables.tf)
- Not overridden in staging.tfvars

**Mistake #2**: Production environment deployed unnecessarily
- Created Nov 8, 2025 at 04:06 UTC (matches cost spike)
- No users, no traffic, no purpose during development
- Doubled infrastructure costs instantly

**Mistake #3**: Multiple environments running 24/7
- Staging + Production + duplicate ALBs
- No shutdown automation for inactive periods
- Assumed "always-on" was necessary for development

### Immediate Fixes Applied

#### Fix #1: Update staging.tfvars with Cost Optimization Flags

```hcl
# ===================================================================
# COST OPTIMIZATION FOR DEVELOPMENT
# ===================================================================

# Disable NAT Gateway (saves $65/month)
enable_nat_gateway = false

# Disable Application Load Balancer (saves $25/month)
enable_alb = false

# Enable public IPs for ECS tasks (required when NAT Gateway disabled)
ecs_assign_public_ip = true

# Keep database in single AZ (saves $20/month vs Multi-AZ)
db_multi_az = false
```

#### Fix #2: Destroy Production Environment

```bash
cd terraform
terraform workspace select production
terraform destroy -var-file="production.tfvars" -var="db_password=placeholder" -auto-approve
terraform workspace select default
terraform workspace delete production
```

**Savings**: $105/month (NAT Gateway + ALB + RDS)

#### Fix #3: Redeploy Staging with Minimal Configuration

```bash
cd terraform
terraform apply -var-file="staging.tfvars" \
  -var="db_password=$(aws secretsmanager get-secret-value --secret-id embark-quoting/staging/db-password --query SecretString --output text)" \
  -auto-approve
```

**Expected Changes**:
- ❌ Delete 2 NAT Gateways
- ❌ Delete staging ALB
- ✅ Add public IPs to ECS tasks
- ✅ Keep RDS and ECS Fargate (Free Tier eligible)

### Daily Cost Management

#### Option 1: Keep Infrastructure Running (Recommended for Active Development)

**Use when**: Working on project daily
**Cost**: $0.20-0.30/day ($6-9/month)
**Pros**:
- Instant access to staging environment
- No wait time for startup
- CI/CD deployments work immediately

**Cons**:
- Still paying for idle resources overnight/weekends

#### Option 2: Shutdown When Inactive (Maximum Savings)

**Use when**: Working on project intermittently (2-3 days/week)
**Cost**: $0.05-0.10/day active days only ($1-3/month)
**Pros**:
- Pays only for actual usage hours
- RDS auto-starts after 7 days max
- Can save 60-70% vs always-on

**Cons**:
- 3-5 minute startup wait time
- Need to remember to shut down

### Infrastructure Shutdown/Startup Scripts

#### Shutdown (End of Workday)

```bash
./scripts/infra-shutdown.sh
```

This script:
1. Stops ECS tasks (desired count → 0)
2. Stops RDS instance
3. CloudFront remains active (no cost impact)

**Savings**: ~$0.80/day when shut down

#### Startup (Start of Workday)

```bash
./scripts/infra-startup.sh
```

This script:
1. Starts RDS instance (2-3 min)
2. Starts ECS tasks (1-2 min)
3. Outputs backend API public IP
4. **Total startup time: 3-5 minutes**

### Free Tier Utilization

**Currently Eligible Services** (Account age < 12 months):
- ✅ RDS db.t3.micro or db.t4g.micro: 750 hours/month (enough for 1 instance 24/7)
- ✅ ECS Fargate: $50/month compute credits for first 6 months
- ✅ CloudFront: 1 TB data transfer/month
- ✅ S3: 5 GB storage + 20,000 GET requests + 2,000 PUT requests/month
- ✅ Cognito: 50,000 MAUs (Monthly Active Users)
- ✅ CloudWatch: 10 custom metrics + 5 GB logs

**Always Free Services**:
- DynamoDB: 25 GB storage + 25 WCU/RCU
- Lambda: 1 million requests/month + 400,000 GB-seconds compute

**Free Tier Expiration**:
- Check account creation date:
  ```bash
  aws organizations describe-account \
    --account-id $(aws sts get-caller-identity --query Account --output text) \
    --query 'Account.JoinedTimestamp'
  ```
- Set reminder 1 month before 12-month anniversary
- Plan upgrade path (see "When to Upgrade" below)

### Cost Monitoring & Alerts

**Set Billing Alarm** (if not already configured):

```bash
# Create SNS topic for billing alerts
aws sns create-topic --name billing-alerts --region us-east-1

# Subscribe email
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:$(aws sts get-caller-identity --query Account --output text):billing-alerts \
  --protocol email \
  --notification-endpoint your-email@example.com \
  --region us-east-1

# Create billing alarm ($10 threshold)
aws cloudwatch put-metric-alarm \
  --alarm-name "Monthly-Cost-Alert" \
  --alarm-description "Alert when monthly cost exceeds $10" \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Maximum \
  --period 21600 \
  --evaluation-periods 1 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --alarm-actions arn:aws:sns:us-east-1:$(aws sts get-caller-identity --query Account --output text):billing-alerts \
  --dimensions Name=Currency,Value=USD \
  --region us-east-1
```

**Check Daily Costs**:

```bash
# Via AWS CLI
aws ce get-cost-and-usage \
  --time-period Start=$(date -d '7 days ago' +%Y-%m-%d),End=$(date +%Y-%m-%d) \
  --granularity DAILY \
  --metrics UnblendedCost \
  --region us-east-1

# Via AWS Console
# Navigate to: Billing Dashboard → Cost Explorer → Daily Costs
```

### When to Upgrade to Production Infrastructure

**DO NOT enable NAT Gateway and ALB until you meet these criteria:**

1. **Revenue Milestone**: Making >$100/month from the product
2. **User Base**: 50+ active users
3. **Traffic**: >10,000 requests/day
4. **Compliance**: Security audit requires private subnet isolation
5. **Multiple Services**: Need path-based routing (/api → service1, /auth → service2)

**Upgrade Path** (when above criteria met):

```hcl
# Update staging.tfvars
enable_nat_gateway = true    # +$65/month
enable_alb = true             # +$25/month
db_multi_az = true            # +$20/month (for high availability)

# Total cost increase: +$110/month
# New total: $115-120/month
```

**Justification**: At $100/month revenue, $110/month infrastructure cost = ~50% margin. This is acceptable for early-stage SaaS, and margin improves as you scale.

### Common Pitfalls to Avoid

#### Pitfall #1: Wrong Instance Types

**Problem**: Using `db.t4g.small` instead of `db.t4g.micro`
**Result**: Not eligible for Free Tier, charged $30/month

**Solution**:
- ✅ Use: `db.t2.micro`, `db.t3.micro`, `db.t4g.micro`
- ❌ Avoid: `t2.small`, `t3.small`, `t4g.small`, `m5`, `r5`, etc.

#### Pitfall #2: Enabling Multi-AZ During Free Tier

**Problem**: Multi-AZ runs 2 database instances
**Result**: Exceeds 750 free hours/month (2 × 744 hours = 1,488 hours), charged for excess

**Solution**: Use `db_multi_az = false` until revenue justifies cost

#### Pitfall #3: Running Multiple Environments

**Problem**: "I need staging AND production for testing"
**Result**: Doubles all costs immediately

**Solution**: Use only staging during development. Deploy production only when launching to real users.

#### Pitfall #4: Not Using CloudFront

**Problem**: Serving frontend directly from S3
**Result**: Slower global performance, higher data transfer costs

**Solution**: Always use CloudFront (1 TB/month free, globally fast)

### Regional Cost Differences

**Current region**: ap-southeast-2 (Sydney, Australia)
**Cost multiplier**: ~1.10-1.15x vs us-east-1 (Virginia)

**Why Sydney**:
- ✅ Primary users in Australia → 200-300ms latency improvement
- ✅ CloudFront caches globally regardless of origin region
- ❌ ~10-15% higher costs for compute/storage

**Cost comparison** (if switching to us-east-1):
- Savings: ~$0.50-1.00/month (5-10% of current costs)
- Trade-off: +200-300ms backend API latency for Australian users

**Recommendation**: Stay in ap-southeast-2 for better user experience. 10% cost difference ($0.50/month) is negligible compared to UX benefit.

### Summary - Quick Reference

**Target Cost**: <$1/day ($30/month)
**Current Cost**: $0.23/day ($7/month) ✅ **Target Met**

**Always Keep Disabled** (until revenue justifies):
- ❌ NAT Gateway (saves $65/month)
- ❌ Application Load Balancer (saves $25/month)
- ❌ Multi-AZ RDS (saves $20/month)
- ❌ Production environment (saves $105/month)

**Always Keep Enabled**:
- ✅ CloudFront (free + fast)
- ✅ Public IPs for ECS tasks (free + enables internet access)
- ✅ Single-AZ RDS db.t4g.micro (Free Tier eligible)
- ✅ Billing alarms ($10 threshold)

**Daily Routine**:
- **Active development**: Keep infrastructure running
- **Inactive days**: Run `./scripts/infra-shutdown.sh`
- **Before starting work**: Run `./scripts/infra-startup.sh` (3-5 min)

**Weekly Check**:
- Review AWS Cost Dashboard for unexpected spikes
- Verify Free Tier usage doesn't exceed limits
- Check for orphaned resources (Elastic IPs, EBS volumes)

---

## ⏰ Cost Optimization Strategy Timeline

### CRITICAL: When to Optimize Infrastructure Costs

**If you're still in AWS Free Tier (first 12 months):**

**DO NOT** optimize infrastructure costs yet. Here's why:

**Current Monthly Cost**: ~$7/month (S3 + CloudFront + minimal services)
- RDS PostgreSQL: $0 (Free Tier)
- ECS Fargate: $0 (Free Tier)
- Professional managed architecture: Priceless

**Your Time Value**: Your time is worth more than $15/month in savings.

**The Math**:
- Cost optimization work: ~8 hours
- Annual savings: ~$180/year ($15/month × 12)
- **Hourly value: $22.50/hour**

Compare this to:
- Building Issue #119 (Admin Dashboard): ~8 hours → **Unblocks production launch**
- Getting first paying customer: Could generate thousands/year

**Focus on revenue, not costs** while in Free Tier.

---

### Timeline for Cost Decisions

#### **Phase 1: Months 1-10 (BUILD PRODUCT)**
**Action**: Keep current infrastructure - don't change anything

**Focus on**:
1. Complete MVP features (Issue #119, etc.)
2. Get first paying customers
3. Validate product-market fit

**Monthly Cost**: ~$7 (well under $30 target)

---

#### **Phase 2: Month 10 (PLAN AHEAD)**
**Action**: Evaluate your situation 2 months before Free Tier expires

**Find your Free Tier expiration date**:
1. AWS Console: https://console.aws.amazon.com/billing/home#/freetier
2. Email: Search for "Welcome to Amazon Web Services" (date + 12 months)
3. Set calendar reminder for 2 months before expiration

**Decision Tree**:

```
Do you have paying customers covering >$50/month revenue?
│
├─ YES → Keep managed services (RDS + ECS)
│         Post-Free Tier cost: ~$22/month
│         Keep professional architecture for growth
│         Revenue covers costs
│
└─ NO → Migrate to cost-optimized setup (choose one):

          Option A: Dual t4g.nano EC2 instances
          - Staging + Production separate (secure)
          - Cost: $6.72/month ($3.36 each)
          - ARM-based (2 vCPU, 512 MB each)

          Option B: Oracle Cloud Always Free
          - Cost: $0/month FOREVER
          - 4 ARM OCPUs, 24 GB RAM
          - Migration effort: 2-3 days

          Option C: Single EC2 consolidation
          - Cost: $7.50/month
          - ONLY if abandoning production plans
          - Not recommended (no isolation)
```

---

#### **Phase 3: Month 12 (EXECUTE PLAN)**
**Action**: Implement chosen cost optimization before Free Tier expires

**Migration Effort**:
- t4g.nano migration: 4 hours prep + 2 hours execution
- Oracle Cloud migration: 1-2 days
- Downtime: 30 minutes to 2 hours (staging only)

**Reference Documentation**: See `docs/reference/cost-optimization/` for detailed migration guides

---

### Post-Free Tier Cost Comparison

| Architecture | Monthly Cost | Isolation | Effort | Use Case |
|--------------|--------------|-----------|--------|----------|
| **Current (RDS + ECS)** | $22/month | ✅ Excellent | None | Have revenue >$50/month |
| **Dual t4g.nano** | $6.72/month | ✅ Good | Medium | No revenue yet, need isolation |
| **Oracle Always Free** | $0/month | ✅ Excellent | High | Long-term hobby/learning |
| **Single EC2** | $7.50/month | ❌ Poor | Medium | NOT RECOMMENDED |

---

### Key Principle: Optimize for the Right Cost

**Infrastructure costs** are predictable and low (~$22/month max).

**Your time costs** are high and unpredictable.

**Premature optimization wastes your most expensive resource**: Your time.

**Only optimize infrastructure when**:
1. Free Tier expires AND no revenue yet, OR
2. Monthly AWS bill exceeds 10% of monthly revenue

Until then: **Build product, get customers, create value.**

---

## 📚 Additional Resources

- **Architecture**: `specs/BLUEPRINT.yaml` - Complete technical specifications
- **Financial Model**: `specs/FINANCIAL_MODEL.md` - Profit-First calculation details
- **Progress Tracking**: `CONTRIBUTING.md` - Issue workflow and GitHub CLI commands
- **Project Navigation**: `CLAUDE.md` - Quick reference for finding information

---

**Last Updated**: 2025-11-14 (Added cost optimization strategy timeline)
