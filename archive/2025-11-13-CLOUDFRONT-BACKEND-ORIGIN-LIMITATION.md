# CloudFront Backend Origin Limitation

**Date:** 2025-11-13  
**Context:** Cost optimization - trying to route backend API through CloudFront without ALB

## Issue

CloudFront does NOT support IP addresses as origin domain names.

**Error:**
```
Error: updating CloudFront Distribution (E2Q1BDDPBL0H8U): operation error CloudFront: 
UpdateDistribution, https response error StatusCode: 400, RequestID: ab9e02c5-b282-459e-bf4c-45b11e683845, 
InvalidArgument: The parameter origin name cannot be an IP address.
```

## Options for Backend API Access

### Option 1: Application Load Balancer (ALB)
- **Cost:** $25/month
- **Benefit:** Stable DNS name, health checks, SSL termination
- **CloudFront:** Can use ALB DNS as origin
- **Recommendation:** Use for production when you have paying customers

### Option 2: Route 53 DNS Record
- **Cost:** $0.50/month (hosted zone) + $0.40/million queries
- **Benefit:** Provides stable DNS name for ECS task IP
- **Implementation:**
  - Create hosted zone
  - Create A record pointing to ECS task IP  
  - Update record when task IP changes
- **CloudFront:** Can use DNS name as origin

### Option 3: Direct Backend Access (Current Solution)
- **Cost:** FREE ✅
- **Limitation:** Frontend must call backend IP directly
- **Implementation:**
  ```typescript
  // frontend/src/config/api.ts
  const API_BASE_URL = import.meta.env.VITE_API_URL ||
    (import.meta.env.PROD
      ? 'http://3.27.195.113:3000'  // Update when task IP changes
      : 'http://localhost:3000');
  ```
- **Tradeoffs:**
  - ⚠️ Mixed content warning (HTTPS frontend → HTTP backend)
  - ⚠️ CORS configuration required
  - ⚠️ IP changes on every ECS task restart
  - ⚠️ No CloudFront caching/DDoS protection for API

## Decision for Staging

**Use Option 3 (Direct Access)** to maintain <$1/day cost target.

**Upgrade path:**
- When daily costs allow: Add Route 53 DNS ($0.50/month)
- When you have paying customers: Add ALB ($25/month) for production-grade setup

## Implementation

### Frontend Configuration
```typescript
// frontend/.env.staging
VITE_API_URL=http://3.27.195.113:3000

// frontend/src/config/api.ts
const API_BASE_URL = import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD
    ? import.meta.env.VITE_API_URL  // Use env var
    : 'http://localhost:3000');
```

### CORS Configuration
Backend must allow requests from CloudFront domain:
```typescript
// backend/src/server.ts
app.use(cors({
  origin: [
    'https://d2vxgs70elbgcz.cloudfront.net',
    'http://localhost:5173'
  ],
  credentials: true
}));
```

### Update Process (when ECS task IP changes)
1. Get new IP: `./scripts/infra-startup.sh` (displays IP)
2. Update `frontend/.env.staging` with new IP
3. Redeploy frontend build
4. Update `terraform/staging.tfvars` backend_api_endpoint (optional, for docs)

## Reverted Changes

The following Terraform changes were attempted but reverted:
- `terraform/cloudfront.tf`: Dynamic backend origin (removed)
- `terraform/variables.tf`: `backend_api_endpoint` variable (can keep for documentation)
- `terraform/staging.tfvars`: `backend_api_endpoint` value (can keep for documentation)

These can stay in the codebase for future use with Route 53 or ALB.
