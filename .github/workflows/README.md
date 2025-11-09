# GitHub Workflows

This directory contains CI/CD workflows for the Embark Quoting System.

## Workflow Overview

### CI Workflows (PR Checks)
- **validate.yml**: Linting, formatting, security scans, and type checking
- **test.yml**: Unit and integration tests
- **build.yml**: Docker image builds

### CD Workflows (Deployment)
- **deploy-staging.yml**: Tag-based staging deployments (e.g., `staging-v1.2.3`)
- **deploy-prod.yml**: Tag-based production deployments (e.g., `v1.0.0`)

### Utility Workflows
- **sync-terraform-secrets.yml**: Sync Terraform outputs to GitHub Secrets

## Deployment Strategy

### Staging Deployment

**Trigger**: Tag-based deployment using `staging-*` prefix

**Workflow**:
1. Merge feature branches to `dev` (accumulate multiple features)
2. When ready to test on staging, create and push a staging tag:
   ```bash
   git checkout dev
   git pull
   git tag staging-v1.2.3
   git push origin staging-v1.2.3
   ```
3. This triggers `deploy-staging.yml` which includes:
   - Backend deployment to ECS
   - Frontend deployment to S3/CloudFront
   - Comprehensive E2E test suite
   - Lighthouse performance audit

**Tag Formats**:
- `staging-v1.2.3` - Semantic versioning (recommended)
- `staging-20250109` - Date-based
- `staging-feature-name` - Feature-based

### Production Deployment

**Trigger**: Tag-based deployment using semantic versioning

**Workflow**:
```bash
git checkout main
git pull
git tag v1.0.0
git push origin v1.0.0
```

This triggers `deploy-prod.yml` which includes:
- Pre-deployment validation
- Blue-green ECS deployment
- Automated rollback on failure
- Smoke tests (minimal E2E tests)
- GitHub release creation
