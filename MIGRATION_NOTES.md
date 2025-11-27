# AWS → Digital Ocean Migration Notes

**Migration Date:** November 27, 2025
**Status:** In Progress

## Overview

The project has been migrated from AWS infrastructure to Digital Ocean. This document tracks migration status and remaining work.

## New Infrastructure

| Service | URL | Status |
|---------|-----|--------|
| Frontend | https://embark.rodda.xyz | ✅ Live |
| Backend API | https://api.embark.rodda.xyz | ✅ Live |
| Database | PostgreSQL on droplet | ✅ Running |
| Reverse Proxy | Caddy (auto-HTTPS) | ✅ Running |
| Authentication | ❌ NEEDS IMPLEMENTATION | 🔴 Blocked |

**Droplet:** 170.64.169.203 (production-syd1, s-2vcpu-4gb)
**Management Repo:** `~/repos/do-vps-prod`

## Deleted AWS Resources

All AWS infrastructure was deleted:
- CloudFront distributions
- ECS Fargate/EC2 instances
- RDS PostgreSQL
- ALB/NAT Gateway
- VPC Endpoints
- ECR repositories
- **Cognito User Pool** (authentication)
- S3 buckets
- Secrets Manager

## GitHub Workflows Status

| Workflow | Status | Notes |
|----------|--------|-------|
| `validate.yml` | ✅ Should Work | No AWS dependencies |
| `test.yml` | ✅ Should Work | Uses local PostgreSQL container |
| `build.yml` | ⚠️ Partial | Backend job will fail (AWS) but has `continue-on-error: true`. Frontend build works. |
| `e2e-tests.yml` | ⚠️ Manual Only | Needs URL secrets updated for DO |
| `enforce-main-pr-source.yml` | ✅ Works | No AWS dependencies |

### Workflow Updates Needed

See GitHub Issue #167 for full details.

**Immediate:** No changes required - workflows won't block PRs.

**Future Work:**
1. Update `build.yml` to remove/replace AWS ECR push
2. Update E2E test secrets to point to Digital Ocean URLs
3. Create deployment workflow for Digital Ocean (SSH + Docker Compose)

## GitHub Issues Created

- **#166** - 🔴 Implement New Authentication System (Cognito Deleted) - CRITICAL
- **#167** - Update CI/CD Workflows for Digital Ocean Deployment
- **#168** - Clean Up AWS References in Codebase

## For Development

**Authentication Bypass:**
```bash
# In backend/.env
DEV_AUTH_BYPASS=true
```

This bypasses authentication for local development and testing until a new auth solution is implemented.

## Files Modified in This Migration

### Documentation
- `STATUS.md` - Migration status, new URLs
- `ARCHITECTURE.md` - DO architecture diagram, ADR-008
- `DEVELOPMENT.md` - Updated environments, credentials
- `README.md` - Updated quick start, infrastructure
- `CONTRIBUTING.md` - Updated local dev setup, links
- `CLAUDE.md` - Critical infrastructure status banner

### Backend (uncommitted before migration)
- `backend/database/migrate.js` - Flexible DB connections
- `backend/database/seed-dev.js` - Flexible DB connections
- `backend/src/shared/db/postgres.js` - SSL detection for local vs cloud
- `backend/src/shared/middleware/auth.middleware.js` - DEV_AUTH_BYPASS mode

### Frontend (uncommitted before migration)
- `frontend/src/features/auth/authService.ts` - Auth updates
- `frontend/src/shared/api/apiClient.ts` - API client updates
- `frontend/.env.production` - Production environment config

## Next Steps

1. ✅ Commit documentation and code changes
2. ⏳ Review and update GitHub Actions workflows
3. ⏳ Implement new authentication system (#166)
4. ⏳ Clean up remaining AWS code references (#168)
5. ⏳ Update GitHub secrets for Digital Ocean (#167)

---

**Last Updated:** 2025-11-27
