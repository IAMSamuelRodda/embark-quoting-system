# Development Workflow

> **Purpose**: Developer and agent workflow for code quality, testing, and CI/CD integration.

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

After pushing, GitHub Actions automatically runs these workflows:

| Workflow | Checks | Pass Criteria | Duration |
|----------|--------|---------------|----------|
| **Test** | Unit + integration tests | All tests pass | ~2-3 min |
| **Validate** | ESLint + Prettier | No violations | ~1 min |
| **Build** | Docker build (conditional) | Image builds successfully | ~3-5 min |
| **Deploy** | Deployment to staging/prod | Services healthy | ~5-10 min |

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
- **Financial Model**: `docs/financial-model.md` - Profit-First calculation details
- **Progress Tracking**: `CONTRIBUTING.md` - Issue workflow and GitHub CLI commands
- **Project Navigation**: `CLAUDE.md` - Quick reference for finding information

---

**Last Updated**: 2025-11-06 (Initial version - extracted from CLAUDE.md and CONTRIBUTING.md)
