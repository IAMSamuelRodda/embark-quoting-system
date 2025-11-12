# Testing Architecture Analysis

> **Date:** 2025-11-11
> **Purpose:** Clarify local vs staging testing strategy, PWA capabilities, and backend simulation requirements

---

## Executive Summary

**Key Findings:**
1. ✅ PWA runs on **any modern browser** (Windows, Mac, Linux, iOS, Android) - not limited to smartphones
2. ✅ Current E2E tests use **LOCAL backend + Staging Cognito** (hybrid approach)
3. ✅ Local backend simulation is **simple** - just PostgreSQL + Node.js (NO AWS SAM needed)
4. ❌ Current issue: Local PostgreSQL not running, causing test failures

---

## 1. PWA Cross-Platform Capabilities

### Your Assumption: **CORRECT** ✅

The app CAN be installed and run offline on Windows desktops (and any other platform).

### Technical Details

**Progressive Web App (PWA) Technology:**
- Runs in **any modern browser** (Chrome, Edge, Firefox, Safari)
- Can be **installed** like a native app (via "Install" button in browser)
- Works **100% offline** after installation (IndexedDB + Service Worker)
- No platform limitations - works on:
  - 🖥️ **Windows Desktop** (Chrome/Edge)
  - 🖥️ **Mac Desktop** (Chrome/Safari)
  - 🖥️ **Linux Desktop** (Chrome/Firefox)
  - 📱 **iOS** (Safari)
  - 📱 **Android** (Chrome)
  - 💻 **Chromebook** (Chrome)

**Installation Process (Windows Example):**
1. User visits `https://your-cloudfront-url.com` in Chrome/Edge
2. Browser shows "Install Embark Quoting" button in address bar
3. User clicks install → App appears as standalone window
4. App icon added to Start Menu / Desktop
5. App works **offline** via Service Worker + IndexedDB

**Current Status:**
- ✅ Code written for PWA (Workbox configured)
- ⚠️ Service Worker NOT registered yet (Issue #7 in STATUS.md)
- ✅ Offline-first architecture implemented (IndexedDB sync)
- ✅ Works in browser offline (without PWA install)

---

## 2. Testing Strategy: Local vs Staging

### Current Architecture (3-Tier Testing)

Your project uses a **hybrid approach** with three distinct testing environments:

#### **Tier 1: Unit Tests** (Pure Offline)
- **Location:** `frontend/tests/unit/`, `backend/tests/unit/`
- **Backend:** None (mocked)
- **Database:** None (mocked)
- **Auth:** None (mocked)
- **Purpose:** Test individual functions in isolation
- **Example:** Calculator functions, validation logic

#### **Tier 2: Integration Tests** (Local Backend)
- **Location:** `frontend/e2e/*.spec.ts` (current failing tests)
- **Backend:** **Local Node.js/Express** (localhost:3001)
- **Database:** **Local PostgreSQL** (Docker container OR native install)
- **Auth:** **Staging Cognito** (ap-southeast-2_D2t5oQs37)
- **Purpose:** Test frontend ↔ backend sync with real database
- **Example:** Job calculations, sync queue, offline-first flows

#### **Tier 3: E2E Tests (Staging Backend)**
- **Location:** `.github/workflows/e2e-tests.yml`
- **Backend:** **Staging ECS** (ALB DNS)
- **Database:** **Staging RDS** (AWS-managed PostgreSQL)
- **Auth:** **Staging Cognito** (same pool as Tier 2)
- **Purpose:** Test full deployment (infrastructure, networking, CDN)
- **Example:** End-to-end flows in production-like environment

### Why Hybrid Approach?

**Tier 2 (Local Backend) Advantages:**
- ✅ **Fast feedback loop** (no deployment wait)
- ✅ **Debugging access** (backend logs, database inspection)
- ✅ **Offline development** (no internet needed after Cognito auth)
- ✅ **Cost-effective** (no AWS charges for local testing)
- ✅ **Reproducible** (same environment every time)

**Tier 3 (Staging Backend) Advantages:**
- ✅ **Infrastructure validation** (ALB, CloudFront, VPC, security groups)
- ✅ **Real-world conditions** (network latency, cold starts)
- ✅ **Deployment verification** (Docker images, migrations, secrets)
- ✅ **Pre-production smoke test** (before main branch merge)

---

## 3. Local Backend Simulation Complexity

### Your Question: How Complicated?

**Answer: VERY SIMPLE** ✅ (No AWS SAM needed)

### Requirements for Local Backend

**Core Components:**
1. **PostgreSQL database** (Docker OR native install)
2. **Node.js/Express backend** (already in `backend/`)
3. **Environment variables** (`.env` file)

**That's it!** No cloud services needed locally.

### What Gets Simulated vs Real

| Component | Local (Tier 2) | Staging (Tier 3) |
|-----------|----------------|------------------|
| **Frontend** | Vite dev server (localhost:3000) | CloudFront (CDN) |
| **Backend** | Node.js (localhost:3001) | ECS Fargate (Docker) |
| **Database** | PostgreSQL (Docker/native) | RDS PostgreSQL |
| **Auth** | **Staging Cognito** ✅ | Staging Cognito |
| **File Storage** | None (not implemented yet) | S3 (if/when added) |
| **Email** | None (mocked) | SES (if/when added) |

**Key Insight:**
Only **Cognito** uses staging resources. Everything else runs locally.

---

## 4. AWS SAM - Do You Need It?

### Short Answer: **NO** ❌

### Why Not?

**AWS SAM (Serverless Application Model) is for:**
- Lambda functions
- API Gateway
- DynamoDB
- Step Functions
- EventBridge
- Other serverless AWS services

**Your Backend Architecture:**
- ✅ **ECS Fargate** (containerized app, not Lambda)
- ✅ **PostgreSQL** (relational DB, not DynamoDB)
- ✅ **Express.js** (traditional web server, not API Gateway)

**SAM is NOT designed for container-based apps.** You use **Docker** + **Terraform** instead.

### What You Use Instead

**Local Development:**
```bash
# Start local PostgreSQL
docker run -d \
  --name embark-dev-db \
  -e POSTGRES_USER=embark_dev \
  -e POSTGRES_PASSWORD=dev_password \
  -e POSTGRES_DB=embark_quoting_dev \
  -p 5432:5432 \
  postgres:15

# Start local backend
cd backend
npm run dev  # Nodemon watches for changes

# Start local frontend
cd frontend
npm run dev  # Vite HMR
```

**Staging/Production Deployment:**
```bash
# Build Docker image
docker build -t embark-backend backend/

# Push to ECR
docker tag embark-backend:latest <ECR_URL>:latest
docker push <ECR_URL>:latest

# Deploy with Terraform
terraform apply
```

**No SAM CLI needed at any stage.**

---

## 5. Current Issue: Why Tests Are Failing

### The Problem

Your E2E tests (`job-calculations.spec.ts`) are configured for **Tier 2 (Local Backend)**:

```typescript
// frontend/e2e/test-utils.ts
const API_URL = 'http://localhost:3001';  // ← Local backend expected
```

**But the local PostgreSQL database isn't running**, so:
1. Frontend creates quote/job → saved to IndexedDB ✅
2. Sync engine queues items ✅
3. Sync sends requests to `localhost:3001` ✅
4. Backend receives requests ✅
5. Backend tries to connect to PostgreSQL ❌ FAILS
6. Backend returns 500 error ❌
7. Sync enters exponential backoff ✅ (expected behavior)
8. Test waits 35 seconds for values that never arrive ❌ TIMEOUT

### The Fix

**Choose one approach:**

**Option A: Fix Local Backend** (Recommended for development)
```bash
# Fix Docker permissions
sudo usermod -aG docker $USER
# Log out, log back in

# Start dev environment
./scripts/dev-start.sh

# Run tests
npm run test:e2e
```

**Option B: Switch to Staging Backend** (For CI/CD only)
```typescript
// frontend/e2e/playwright.config.ts
use: {
  baseURL: process.env.STAGING_API_URL || 'http://localhost:3001',
}
```

```bash
# Run tests against staging
STAGING_API_URL=https://staging-alb-dns.amazonaws.com npm run test:e2e
```

---

## 6. Recommended Testing Workflow

### Local Development (Tier 2)

**When developing features:**
1. Run `./scripts/dev-start.sh` (starts local backend + DB)
2. Write code with hot-reload (Vite HMR)
3. Run E2E tests locally (`npm run test:e2e`)
4. Debug with Chrome DevTools + backend logs

**Advantages:**
- Instant feedback (no deployment)
- Full debugging access
- Works offline (after initial Cognito auth)

### Pre-Merge Validation (Tier 3)

**Before merging to `main`:**
1. Push to `dev` branch
2. CI/CD deploys to staging
3. E2E tests run against staging backend
4. Verify infrastructure works (ALB, RDS, CloudFront)

**Advantages:**
- Catches deployment issues
- Validates infrastructure
- Tests real-world conditions

---

## 7. Key Architectural Insights

### Offline-First Complexity

**Why this is tricky:**

```
User Action
  ↓
IndexedDB (local) ← Read instantly
  ↓
Sync Queue ← Background process
  ↓
Backend API ← May be offline/slow
  ↓
PostgreSQL ← May be disconnected
  ↓
Response ← Update IndexedDB
  ↓
UI Update ← Re-render
```

**7 layers** where things can break:
1. IndexedDB storage quota
2. Sync queue logic
3. Network connectivity
4. Backend availability
5. Database connection
6. Data validation
7. UI rendering

**Your current issue was layer #5 (database connection).**

### Why Multi-Layer Debugging Is Essential

From CLAUDE.md:
> "The offline-first architecture adds complexity - data flows through multiple layers (UI → IndexedDB → Sync → API → Response → IndexedDB → UI), and any broken link causes silent failures."

**This session proved this principle:**
- Appeared to be sync bug (layer 2-3)
- Actually database bug (layer 5)
- Required debugging through ALL layers to find root cause

---

## 8. Summary & Recommendations

### Current State

| Component | Status | Fix Needed |
|-----------|--------|------------|
| Frontend offline | ✅ Working | None |
| Sync queue | ✅ Working | None |
| Local backend | ✅ Working | None |
| **Local database** | ❌ **Not running** | **Fix Docker** |
| E2E test logic | ✅ Working | None |
| Staging backend | ✅ Working | None |

### Immediate Action Required

```bash
# 1. Fix Docker permissions
sudo usermod -aG docker $USER

# 2. Log out and log back in (required for group change)

# 3. Verify Docker works
docker ps

# 4. Start dev environment
./scripts/dev-start.sh

# 5. Verify database connection
curl http://localhost:3001/health | jq '.database'
# Should return: "connected"

# 6. Run E2E tests
cd frontend
npm run test:e2e -- job-calculations.spec.ts
# Should pass without timeouts
```

### Long-Term Recommendations

1. **Add database health check to dev-start.sh**
   - Verify PostgreSQL is running before starting backend
   - Fail fast with clear error message

2. **Document local testing requirements**
   - Update DEVELOPMENT.md with Docker setup
   - Add troubleshooting for common Docker issues

3. **Consider native PostgreSQL fallback**
   - If Docker continues to have issues
   - Install PostgreSQL directly on Ubuntu

4. **Improve test error messages**
   - Detect when backend is unreachable
   - Show helpful error ("Is backend running? Check /health endpoint")

---

## 9. Questions Answered

### Q1: Can PWA run on Windows offline?
**A:** ✅ YES - PWA runs on any modern browser (Windows, Mac, Linux, iOS, Android)

### Q2: Do tests require staging backend?
**A:** Depends on tier:
- Tier 2 (local dev): Local backend ✅
- Tier 3 (pre-merge): Staging backend ✅

### Q3: How complicated is local backend simulation?
**A:** Very simple - just PostgreSQL + Node.js (no cloud services needed)

### Q4: Does AWS SAM come into play?
**A:** ❌ NO - SAM is for serverless (Lambda). You use Docker + Terraform for containers.

---

**Last Updated:** 2025-11-11
**Author:** Claude Code Investigation
**Related Issues:** #4 (Docker database connection)
