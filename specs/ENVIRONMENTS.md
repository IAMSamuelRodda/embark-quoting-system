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

**Prerequisites:**
- Dev server running (`npm run dev` in `frontend/` directory)
- `.env.local` configured with correct environment variables

**Step-by-Step:**

1. **Create `frontend/.env.local` file:**
   ```bash
   cd frontend
   cat > .env.local << 'EOF'
   VITE_AWS_REGION=ap-southeast-2
   VITE_COGNITO_USER_POOL_ID=ap-southeast-2_D2t5oQs37
   VITE_COGNITO_CLIENT_ID=1li6qn77cs9m2f47pbg8qrd3at
   VITE_API_URL=http://localhost:3000
   EOF
   ```

2. **Start dev server:**
   ```bash
   npm run dev
   ```

3. **Navigate to:** http://localhost:3000

4. **Enter credentials:**
   - Email: `e2e-test@embark-quoting.local`
   - Password: Retrieve staging password (same as "Staging Login" above):
     ```bash
     aws secretsmanager get-secret-value \
       --secret-id embark-quoting/staging/e2e-test-password \
       --query SecretString --output text
     ```

5. **Click "Sign in"**

**Note**: Local development uses **staging Cognito pool** by default. The local frontend connects to the staging authentication backend, not a separate local Cognito instance.

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
- **Backend API:** http://localhost:3000 (Express server)
- **Database:** PostgreSQL @ localhost:5432

### Frontend Configuration

**Environment File:** `frontend/.env.local`

```bash
# Required Cognito credentials (MUST match authService.ts variable names)
VITE_AWS_REGION=ap-southeast-2
VITE_COGNITO_USER_POOL_ID=ap-southeast-2_D2t5oQs37  # Staging pool
VITE_COGNITO_CLIENT_ID=1li6qn77cs9m2f47pbg8qrd3at   # Staging client
VITE_API_URL=http://localhost:3000
```

**Important**: Variable names MUST be `VITE_COGNITO_USER_POOL_ID` and `VITE_COGNITO_CLIENT_ID` (not `VITE_USER_POOL_ID`). These match the names expected in `src/services/authService.ts`.

### Backend Configuration

**Environment File:** `backend/.env.local`

See `backend/.env.example` for template. Minimum required:

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/embark_quoting_dev"
PORT=3000
NODE_ENV=development
```

### Database Setup
```bash
# Start PostgreSQL locally (Docker)
docker run -d \
  --name embark-dev-db \
  -e POSTGRES_USER=embark_dev \
  -e POSTGRES_PASSWORD=dev_password \
  -e POSTGRES_DB=embark_quoting_dev \
  -p 5432:5432 \
  postgres:15

# Run migrations
cd backend
DATABASE_URL="postgresql://embark_dev:dev_password@localhost:5432/embark_quoting_dev" \
  npm run db:migrate
```

### Starting Local Development

```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend
cd frontend
npm run dev

# Open browser to http://localhost:3000
```

### Local Login Credentials

**Option 1: Use Staging Credentials (Recommended)**

Since `frontend/.env.local` points to the **staging Cognito pool**, use staging credentials:

- **Email:** `e2e-test@embark-quoting.local`
- **Password:** Retrieve from AWS Secrets Manager:
  ```bash
  aws secretsmanager get-secret-value \
    --secret-id embark-quoting/staging/e2e-test-password \
    --query SecretString --output text
  ```

**Option 2: Create Local Test User**

If you want to use a separate local Cognito pool:
1. Create your own Cognito User Pool (see `terraform/USER_PROVISIONING.md`)
2. Update `frontend/.env.local` with your pool IDs
3. Create a test user in your pool

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
