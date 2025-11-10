# Environments

**Purpose:** Single source of truth for environment configuration

**Last Updated:** 2025-11-10

---

## 🔑 How to Login

Step-by-step instructions for accessing each environment.

### Production Login

1. **Navigate to:** https://dtfaaynfdzwhd.cloudfront.net
2. **Enter credentials:**
   - Email: `e2e-test@embark-quoting.local`
   - Password: Retrieve using:
     ```bash
     aws secretsmanager get-secret-value \
       --secret-id embark-quoting/production/e2e-test-password \
       --query SecretString --output text
     ```
3. **Click "Sign in"**

### Staging Login

1. **Navigate to:** https://d1aekrwrb8e93r.cloudfront.net
2. **Enter credentials:**
   - Email: `e2e-test@embark-quoting.local`
   - Password: Retrieve using:
     ```bash
     aws secretsmanager get-secret-value \
       --secret-id embark-quoting/staging/e2e-test-password \
       --query SecretString --output text
     ```
3. **Click "Sign in"**

### Local Development Login

**🚀 Automated Setup (Recommended)**

Use the full-stack development launcher for one-command setup:

```bash
./scripts/dev-start.sh
```

**What it does:**
1. ✅ Checks prerequisites (Docker, AWS CLI, Node.js, npm)
2. ✅ Starts PostgreSQL database (Docker container)
3. ✅ Runs database migrations
4. ✅ Creates environment configuration files
5. ✅ Retrieves credentials from AWS Secrets Manager
6. ✅ Starts backend API (port 3001)
7. ✅ Starts frontend dev server (port 3000)
8. ✅ Auto-logs in with Playwright (browser opens automatically)

**Result:** Browser opens, logged in, ready to test with full local stack!

---

**📝 Manual Setup (For Reference)**

If you need to set up components individually:

1. **Start PostgreSQL:**
   ```bash
   docker run -d \
     --name embark-dev-db \
     -e POSTGRES_USER=embark_dev \
     -e POSTGRES_PASSWORD=dev_password \
     -e POSTGRES_DB=embark_quoting_dev \
     -p 5432:5432 \
     postgres:15
   ```

2. **Run migrations:**
   ```bash
   cd backend
   DATABASE_URL="postgresql://embark_dev:dev_password@localhost:5432/embark_quoting_dev" \
     npm run db:migrate
   ```

3. **Start backend:**
   ```bash
   cd backend
   npm run dev  # Runs on port 3001
   ```

4. **Start frontend:**
   ```bash
   cd frontend
   npm run dev  # Runs on port 3000
   ```

5. **Navigate to:** http://localhost:3000

6. **Login credentials:**
   - Email: `e2e-test@embark-quoting.local`
   - Password: Retrieve from AWS Secrets Manager:
     ```bash
     aws secretsmanager get-secret-value \
       --secret-id embark-quoting/staging/e2e-test-credentials \
       --query SecretString --output text | jq -r '.password'
     ```

**Note**: Local development uses:
- **Staging Cognito** (cloud authentication)
- **Local PostgreSQL** (Docker container)
- **Local backend API** (port 3001)
- **Local frontend** (port 3000)

---

## 🏭 Production

### URLs
- **Frontend:** https://dtfaaynfdzwhd.cloudfront.net
- **Backend API:** http://embark-quoting-production-alb-185300723.ap-southeast-2.elb.amazonaws.com
- **Cognito Auth Domain:** https://embark-quoting-production.auth.ap-southeast-2.amazoncognito.com

### AWS Resources
- **Cognito User Pool ID:** `ap-southeast-2_v2Jk8B9EK`
- **Cognito Client ID:** `47l7kej94osa5j0a1q6k754b8f` (public - safe to commit)
- **Region:** ap-southeast-2 (Sydney, Australia)

### Test Credentials
- **Email:** `e2e-test@embark-quoting.local`
- **Password:** Stored in AWS Secrets Manager
  - Secret Name: `embark-quoting/production/e2e-test-password`
  - GitHub Secret: `E2E_PROD_USER_PASSWORD`
  - Retrieve: `aws secretsmanager get-secret-value --secret-id embark-quoting/production/e2e-test-password`
- **Cognito Group:** `field_workers`

### Backend Health Check
```bash
curl http://embark-quoting-production-alb-185300723.ap-southeast-2.elb.amazonaws.com/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-11-08T05:30:45.409Z",
  "service": "embark-quoting-backend",
  "version": "1.0.0",
  "environment": "production",
  "database": "connected"
}
```

---

## 🧪 Staging

### URLs
- **Frontend:** https://d1aekrwrb8e93r.cloudfront.net
- **Backend API:** http://embark-quoting-staging-alb-211615053.ap-southeast-2.elb.amazonaws.com
- **Cognito Auth Domain:** https://embark-quoting-staging.auth.ap-southeast-2.amazoncognito.com

### AWS Resources
- **Cognito User Pool ID:** `ap-southeast-2_D2t5oQs37`
- **Cognito Client ID:** `1li6qn77cs9m2f47pbg8qrd3at` (public - safe to commit)
- **Region:** ap-southeast-2 (Sydney, Australia)

### Test Credentials
- **Email:** `e2e-test@embark-quoting.local`
- **Password:** Stored in AWS Secrets Manager
  - Secret Name: `embark-quoting/staging/e2e-test-password`
  - GitHub Secret: `E2E_TEST_USER_PASSWORD`
  - Retrieve: `aws secretsmanager get-secret-value --secret-id embark-quoting/staging/e2e-test-password`
- **Cognito Group:** `field_workers`

### Backend Health Check
```bash
curl http://embark-quoting-staging-alb-211615053.ap-southeast-2.elb.amazonaws.com/health
```

---

## 💻 Local Development

### URLs
- **Frontend:** http://localhost:3000 (Vite dev server)
- **Backend API:** http://localhost:3001 (Express server)
- **Database:** PostgreSQL @ localhost:5432 (Docker container)

### Frontend Configuration

**Environment File:** `frontend/.env.local` (auto-generated by `dev-start.sh`)

```bash
# AWS Region
VITE_AWS_REGION=ap-southeast-2

# Cognito Configuration (Staging Pool)
VITE_COGNITO_USER_POOL_ID=ap-southeast-2_D2t5oQs37
VITE_COGNITO_CLIENT_ID=1li6qn77cs9m2f47pbg8qrd3at

# API Configuration (Local Backend)
VITE_API_URL=http://localhost:3001
```

**Note**: Points to **local backend** on port 3001 (not staging cloud backend).

### Backend Configuration

**Environment File:** `backend/.env.local` (auto-generated by `dev-start.sh`)

```bash
# Server Configuration
PORT=3001
NODE_ENV=development

# Database (Local PostgreSQL)
DATABASE_URL="postgresql://embark_dev:dev_password@localhost:5432/embark_quoting_dev"

# AWS Configuration
AWS_REGION=ap-southeast-2

# Cognito (Staging - for token validation)
COGNITO_USER_POOL_ID=ap-southeast-2_D2t5oQs37
COGNITO_CLIENT_ID=1li6qn77cs9m2f47pbg8qrd3at

# Logging
LOG_LEVEL=debug
```

### Database Details

**Container Name:** `embark-dev-db`
**Image:** `postgres:15`
**Credentials:**
- User: `embark_dev`
- Password: `dev_password`
- Database: `embark_quoting_dev`

**Connection String:**
```
postgresql://embark_dev:dev_password@localhost:5432/embark_quoting_dev
```

### Log Files

All logs are written to `/tmp/` for easy debugging:

```bash
# Frontend dev server logs
tail -f /tmp/embark-frontend.log

# Backend API logs
tail -f /tmp/embark-backend.log

# Database migration logs
cat /tmp/embark-migration.log

# View all logs in real-time
tail -f /tmp/embark-*.log
```

### Stopping Services

Press `Ctrl+C` in the terminal running `dev-start.sh` to stop all services.

**To stop database manually:**
```bash
docker stop embark-dev-db   # Stop container
docker rm embark-dev-db     # Remove container (deletes data)
```

**To restart database:**
```bash
docker start embark-dev-db  # Restart existing container (preserves data)
```

---

## ⚠️ Important Notes

### Environment-Specific Passwords
Each environment (production, staging) has a **different password** for the same email address because they use **separate Cognito user pools**:
- Production uses pool: `ap-southeast-2_v2Jk8B9EK`
- Staging uses pool: `ap-southeast-2_D2t5oQs37`

Passwords are auto-generated by Terraform and stored in:
1. **AWS Secrets Manager** (authoritative source)
2. **GitHub Secrets** (for CI/CD workflows)

### Password Retrieval

**Via AWS CLI:**
```bash
# Production
aws secretsmanager get-secret-value \
  --secret-id embark-quoting/production/e2e-test-password \
  --query SecretString --output text

# Staging
aws secretsmanager get-secret-value \
  --secret-id embark-quoting/staging/e2e-test-password \
  --query SecretString --output text
```

**Via GitHub Secrets:**
- Production: `E2E_PROD_USER_PASSWORD`
- Staging: `E2E_TEST_USER_PASSWORD`

### Never Commit Passwords
- ❌ Do not hardcode passwords in code or documentation
- ✅ Always reference AWS Secrets Manager
- ✅ Use environment variables in local development

---

## 🔄 Deployment Trigger Strategy

### Staging Deployment
**Trigger:** Tag-based deployment
```bash
git checkout dev
git pull
git tag staging-v1.2.3
git push origin staging-v1.2.3
```

**Workflow:** `.github/workflows/deploy-staging.yml` (triggered by `staging-v*` tags)

### Production Deployment
**Trigger:** Tag-based deployment
```bash
git checkout main
git pull
git tag v1.0.0
git push origin v1.0.0
```

**Workflow:** `.github/workflows/deploy-prod.yml` (triggered by `v*` tags)

---

## 📚 Related Documentation

- **AWS Resources:** `terraform/AWS_RESOURCES.md` (detailed infrastructure inventory)
- **Secrets Management:** `terraform/SECRETS_MANAGEMENT.md` (Terraform→AWS→GitHub sync)
- **Manual Testing:** `specs/MANUAL_TESTING.md` (step-by-step testing procedures)
- **Operations Runbook:** `specs/RUNBOOK.md` (troubleshooting and incident response)
- **User Provisioning:** `terraform/USER_PROVISIONING.md` (how to create Cognito users)

---

**Note:** Update this file when environment URLs change, new environments are added, or credential locations are modified.
