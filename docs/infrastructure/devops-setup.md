# DevOps Setup Guide

This document explains the CI/CD infrastructure created for the Embark Quoting System and provides step-by-step instructions for completing the setup.

## Overview

The project now has a complete CI/CD pipeline with the following workflows:

1. **validate.yml** - Code quality, linting, security scanning, and type checking
2. **test.yml** - Unit and integration tests with coverage enforcement
3. **build.yml** - Docker image builds and frontend builds with artifact uploads
4. **deploy-staging.yml** - Automatic deployment to staging on main branch merges
5. **deploy-prod.yml** - Production deployment on tagged releases with manual approval

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Developer Workflow                       │
├─────────────────────────────────────────────────────────────┤
│ 1. Create feature branch                                    │
│ 2. Push commits → validate.yml + test.yml + build.yml      │
│ 3. Create PR → All checks must pass                         │
│ 4. Merge to main → deploy-staging.yml (automatic)          │
│ 5. Create tag (e.g., v1.0.0) → deploy-prod.yml (manual)    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Development   │     │     Staging     │     │   Production    │
│   (Optional)    │────▶│   (Automatic)   │────▶│    (Manual)     │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ Feature Branch  │     │ Main Branch     │     │ Tagged Release  │
│ Ephemeral       │     │ ECS + S3        │     │ ECS + S3        │
└─────────────────┘     │ E2E Tests       │     │ Blue-Green      │
                        │ Lighthouse      │     │ Rollback Ready  │
                        └─────────────────┘     └─────────────────┘
```

## Deployment Strategy

### Environments

| Environment | Trigger | Approval | Purpose |
|-------------|---------|----------|---------|
| Development | Feature branch push | None | Optional ephemeral testing |
| Staging | Push to `main` | None (automatic) | Integration testing, E2E validation |
| Production | Tag `v*.*.*` | **Required** | Live user traffic |

### Deployment Patterns

- **Staging**: Rolling updates (faster, less critical)
- **Production**: Blue-green deployment (zero downtime, instant rollback)

### Quality Gates

All PRs must pass:
- ✅ ESLint checks (frontend + backend)
- ✅ TypeScript type checking
- ✅ Prettier format checking
- ✅ Security scanning (npm audit + Snyk)
- ✅ Secret scanning (Gitleaks)
- ✅ Unit tests (80% coverage minimum)
- ✅ Integration tests
- ✅ Docker build success
- ✅ Frontend build success

Staging deployment must pass:
- ✅ E2E tests (Playwright)
- ✅ Lighthouse performance audit (score ≥90)

## Setup Checklist

### Phase 1: AWS Infrastructure (Epic 0 - Week 1)

#### 1.1 Create AWS Resources

- [ ] **VPC and Networking**
  - [ ] Create VPC with public/private subnets
  - [ ] Configure Internet Gateway and NAT Gateway
  - [ ] Set up Route Tables

- [ ] **ECR (Container Registry)**
  - [ ] Create ECR repository: `embark-quoting-backend`
  - [ ] Note repository URI (needed for workflows)

- [ ] **ECS Fargate**
  - [ ] Create ECS clusters: `embark-staging` and `embark-production`
  - [ ] Create task definitions (see `deploy-staging.yml` for configuration)
  - [ ] Create services with Application Load Balancer

- [ ] **RDS PostgreSQL**
  - [ ] Create database instances: staging and production
  - [ ] Note connection strings
  - [ ] Store credentials in AWS Secrets Manager

- [ ] **S3 Buckets**
  - [ ] Create: `embark-quoting-staging-frontend`
  - [ ] Create: `embark-quoting-production-frontend`
  - [ ] Enable static website hosting
  - [ ] Configure bucket policies for CloudFront access

- [ ] **CloudFront Distributions**
  - [ ] Create distribution for staging S3 bucket
  - [ ] Create distribution for production S3 bucket
  - [ ] Note distribution IDs

- [ ] **Cognito User Pools**
  - [ ] Create staging user pool
  - [ ] Create production user pool
  - [ ] Configure app clients
  - [ ] Set up user groups (admins, field_workers)

#### 1.2 Set Up AWS OIDC for GitHub Actions

- [ ] Create OIDC identity provider in AWS IAM
  - Provider URL: `https://token.actions.githubusercontent.com`
  - Audience: `sts.amazonaws.com`

- [ ] Create IAM role for GitHub Actions
  - Trust policy: GitHub repository
  - Permissions:
    - ECR push/pull
    - ECS task definition update
    - ECS service update
    - S3 write (for frontend buckets)
    - CloudFront invalidation
    - Secrets Manager read (for credentials)

- [ ] Note IAM role ARN (needed for `AWS_ROLE_TO_ASSUME` secret)

**Reference**: https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services

### Phase 2: GitHub Configuration (Week 1)

#### 2.1 Add GitHub Secrets

Navigate to: Repository → Settings → Secrets and variables → Actions

**AWS Configuration**:
- [ ] `AWS_ROLE_TO_ASSUME` - IAM role ARN for GitHub Actions
- [ ] `AWS_PROD_ROLE_TO_ASSUME` - Separate role for production (optional, can use same role)

**Staging Environment**:
- [ ] `STAGING_API_URL` - ALB URL (e.g., https://staging-api.embark-quoting.com)
- [ ] `STAGING_FRONTEND_URL` - CloudFront URL (e.g., https://staging.embark-quoting.com)
- [ ] `STAGING_S3_BUCKET` - S3 bucket name
- [ ] `STAGING_CLOUDFRONT_ID` - CloudFront distribution ID
- [ ] `STAGING_COGNITO_USER_POOL_ID` - Cognito user pool ID
- [ ] `STAGING_COGNITO_CLIENT_ID` - Cognito app client ID

**Production Environment**:
- [ ] `PROD_API_URL`
- [ ] `PROD_FRONTEND_URL`
- [ ] `PROD_S3_BUCKET`
- [ ] `PROD_CLOUDFRONT_ID`
- [ ] `PROD_COGNITO_USER_POOL_ID`
- [ ] `PROD_COGNITO_CLIENT_ID`

**Testing**:
- [ ] `E2E_TEST_USER_EMAIL` - Test user for E2E tests
- [ ] `E2E_TEST_USER_PASSWORD` - Test user password

**Optional (for enhanced features)**:
- [ ] `CODECOV_TOKEN` - Code coverage reporting (https://codecov.io)
- [ ] `SNYK_TOKEN` - Enhanced security scanning (https://snyk.io)

#### 2.2 Configure GitHub Environments

Navigate to: Repository → Settings → Environments

**Create `staging` environment**:
- [ ] No protection rules (automatic deployment)
- [ ] Add environment-specific secrets if needed

**Create `production` environment**:
- [ ] Enable "Required reviewers" (add your GitHub username)
- [ ] Enable "Wait timer" (optional, e.g., 5 minutes)
- [ ] Add environment-specific secrets

#### 2.3 Enable Branch Protection

Navigate to: Repository → Settings → Branches → Add branch protection rule

**For `main` branch**:
- [ ] Require pull request reviews before merging (minimum 1 approval)
- [ ] Require status checks to pass before merging:
  - [ ] `lint`
  - [ ] `security`
  - [ ] `secrets-scan`
  - [ ] `typecheck`
  - [ ] `unit-tests`
  - [ ] `integration-tests`
  - [ ] `build-backend`
  - [ ] `build-frontend`
- [ ] Require branches to be up to date before merging
- [ ] Do not allow bypassing the above settings
- [ ] Restrict pushes (no direct commits to main)

### Phase 3: Development Tooling (Week 2)

#### 3.1 Backend Configuration

- [ ] Install testing dependencies:
  ```bash
  cd backend
  npm install --save-dev jest @types/jest
  ```

- [ ] Create `jest.config.js`:
  ```javascript
  export default {
    testEnvironment: 'node',
    transform: {},
    extensionsToTreatAsEsm: ['.js'],
    moduleNameMapper: {
      '^(\\.{1,2}/.*)\\.js$': '$1',
    },
    coverageThreshold: {
      global: {
        branches: 75,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
  };
  ```

- [ ] Install linting tools:
  ```bash
  npm install --save-dev eslint eslint-config-airbnb-base eslint-plugin-import
  ```

- [ ] Create `.eslintrc.json`:
  ```json
  {
    "extends": ["airbnb-base"],
    "env": {
      "node": true,
      "es2022": true
    },
    "parserOptions": {
      "ecmaVersion": 2022,
      "sourceType": "module"
    }
  }
  ```

- [ ] Install Prettier:
  ```bash
  npm install --save-dev prettier
  ```

- [ ] Create `.prettierrc.json`:
  ```json
  {
    "semi": true,
    "trailingComma": "es5",
    "singleQuote": true,
    "printWidth": 100,
    "tabWidth": 2
  }
  ```

- [ ] Update `package.json` scripts:
  ```json
  {
    "scripts": {
      "test:unit": "NODE_OPTIONS=--experimental-vm-modules jest --coverage",
      "test:integration": "NODE_OPTIONS=--experimental-vm-modules jest --testPathPattern=integration",
      "lint": "eslint . --ext .js",
      "format:check": "prettier --check \"src/**/*.js\"",
      "format:write": "prettier --write \"src/**/*.js\"",
      "migrate:test": "drizzle-kit push:pg"
    }
  }
  ```

- [ ] Set up Drizzle ORM (see Epic 2, Feature 2.1)

#### 3.2 Frontend Configuration

- [ ] Install Vitest:
  ```bash
  cd frontend
  npm install --save-dev vitest @vitest/ui @testing-library/react @testing-library/jest-dom
  ```

- [ ] Create `vitest.config.ts`:
  ```typescript
  import { defineConfig } from 'vitest/config';
  import react from '@vitejs/plugin-react';

  export default defineConfig({
    plugins: [react()],
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: './src/test/setup.ts',
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        exclude: ['node_modules/', 'src/test/'],
      },
    },
  });
  ```

- [ ] Install Prettier:
  ```bash
  npm install --save-dev prettier
  ```

- [ ] Create `.prettierrc.json` (same as backend)

- [ ] Update `package.json` scripts:
  ```json
  {
    "scripts": {
      "test:unit": "vitest run",
      "test:unit:watch": "vitest",
      "test:unit:ui": "vitest --ui",
      "format:check": "prettier --check \"src/**/*.{ts,tsx,json,css}\"",
      "format:write": "prettier --write \"src/**/*.{ts,tsx,json,css}\""
    }
  }
  ```

#### 3.3 Create Dockerfile for Backend

- [ ] Create `backend/Dockerfile`:
  ```dockerfile
  FROM node:20-alpine

  WORKDIR /app

  # Copy package files
  COPY package*.json ./

  # Install dependencies
  RUN npm ci --production

  # Copy application code
  COPY . .

  # Expose port
  EXPOSE 3000

  # Health check
  HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

  # Start application
  CMD ["npm", "start"]
  ```

- [ ] Add `.dockerignore`:
  ```
  node_modules
  npm-debug.log
  .env
  .git
  .gitignore
  README.md
  ```

### Phase 4: Testing and Validation (Week 2)

#### 4.1 Test Workflows Locally

- [ ] Validate workflow syntax:
  ```bash
  # Install act (GitHub Actions local runner)
  # https://github.com/nektos/act

  # Test validate workflow
  act pull_request -W .github/workflows/validate.yml

  # Test build workflow
  act pull_request -W .github/workflows/build.yml
  ```

#### 4.2 Test AWS Deployments

- [ ] Build and push Docker image manually:
  ```bash
  cd backend
  docker build -t embark-backend:test .
  docker run -p 3000:3000 -e NODE_ENV=test embark-backend:test

  # Test health endpoint
  curl http://localhost:3000/health
  ```

- [ ] Test S3 + CloudFront deployment manually:
  ```bash
  cd frontend
  npm run build

  # Upload to S3
  aws s3 sync dist/ s3://your-staging-bucket/ --delete

  # Invalidate CloudFront
  aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
  ```

#### 4.3 Trigger First CI/CD Run

- [ ] Create a test feature branch:
  ```bash
  git checkout -b feature/test-ci-cd
  echo "# Testing CI/CD" >> README.md
  git add README.md
  git commit -m "test: trigger CI/CD pipeline"
  git push origin feature/test-ci-cd
  ```

- [ ] Create PR and observe workflow runs
- [ ] Fix any errors that occur
- [ ] Merge to main after all checks pass
- [ ] Verify staging deployment succeeds

#### 4.4 Test Production Deployment

- [ ] Create a release tag:
  ```bash
  git checkout main
  git pull
  git tag -a v0.1.0 -m "Initial release for testing"
  git push origin v0.1.0
  ```

- [ ] Verify production deployment workflow runs
- [ ] Approve manual deployment in GitHub Actions
- [ ] Verify production deployment succeeds

## Common Issues and Troubleshooting

### Issue: Workflows fail with "aws-actions/configure-aws-credentials" error

**Solution**: AWS OIDC not configured correctly
- Verify OIDC identity provider exists in AWS IAM
- Check IAM role trust policy includes GitHub repository
- Verify `AWS_ROLE_TO_ASSUME` secret is set correctly

### Issue: Docker build fails with permission errors

**Solution**: ECR authentication issue
- Verify IAM role has `ecr:GetAuthorizationToken` permission
- Check IAM role has push permissions for ECR repository

### Issue: ECS deployment fails with "task definition not found"

**Solution**: Create initial task definition manually
- Use AWS Console or AWS CLI to create initial task definition
- Workflow will update it on subsequent deployments

### Issue: CloudFront invalidation takes too long

**Solution**: Expected behavior
- CloudFront invalidations can take 5-15 minutes
- Consider using versioned assets for faster deployments

### Issue: E2E tests fail with timeout

**Solution**: Playwright configuration
- Increase timeout in `playwright.config.ts`
- Verify staging environment is accessible from GitHub Actions runners
- Check test user credentials are correct

## Next Steps

After completing this setup:

1. **Update BLUEPRINT.yaml** - Add Epic 0 (DevOps Foundation) before Epic 1
2. **Create Infrastructure as Code** - Convert manual AWS setup to Terraform/SAM templates
3. **Add Monitoring** - Configure CloudWatch alarms and Sentry error tracking
4. **Set Up Notifications** - Add Slack/email notifications for deployment status
5. **Implement Feature Flags** - Add LaunchDarkly or similar for progressive feature rollout

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [AWS ECS Deployment Guide](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/)
- [Playwright Testing](https://playwright.dev/)
- [devops-automation skill](/.claude/skills/devops-automation/) - Internal reference for deployment patterns

## Maintenance

### Adding New Secrets

When adding new environment variables:
1. Add to GitHub Secrets (staging and production)
2. Update workflow files to pass to builds
3. Document in this guide

### Updating Workflows

When modifying workflows:
1. Test changes in a feature branch first
2. Verify all checks still pass
3. Update this documentation if behavior changes

### Rotating Credentials

Schedule regular rotation of:
- AWS access keys (if not using OIDC)
- Database passwords
- API keys for third-party services
- Test user credentials
