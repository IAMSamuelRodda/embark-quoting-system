# GitHub Workflows

This directory contains CI/CD workflows for the Embark Quoting System.

## Workflow Overview

### CI Workflows (PR Checks)
- **validate.yml**: Linting, formatting, security scans, and type checking
- **test.yml**: Unit and integration tests
- **build.yml**: Docker image builds

### CD Workflows (Deployment)
- **deploy-staging.yml**: Auto-deploy to staging on `dev` branch pushes
- **deploy-prod.yml**: Tag-based production deployments (e.g., `v1.0.0`)

### Utility Workflows
- **sync-terraform-secrets.yml**: Sync Terraform outputs to GitHub Secrets

## Deployment Strategy

**Staging**: Automatic deployment when PRs are merged to `dev` branch
**Production**: Manual tag-based deployment using semantic versioning

To deploy to production:
```bash
git tag v1.0.0
git push origin v1.0.0
```

This triggers the `deploy-prod.yml` workflow which includes:
- Pre-deployment validation
- Blue-green ECS deployment
- Automated rollback on failure
- Smoke tests
- GitHub release creation
