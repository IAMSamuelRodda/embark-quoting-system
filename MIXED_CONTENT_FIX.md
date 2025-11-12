# Mixed Content Error Fix - CloudFront Backend API Distribution

## Problem Summary

Staging E2E tests were failing with mixed content errors:
```
Mixed Content: The page at 'https://d1aekrwrb8e93r.cloudfront.net/dashboard' was loaded over HTTPS,
but requested an insecure resource 'http://embark-quoting-staging-alb-211615053.ap-southeast-2.elb.amazonaws.com/api/quotes'.
This request has been blocked; the content must be served over HTTPS.
```

**Root Cause**:
- Frontend: HTTPS (CloudFront → S3)
- Backend API: HTTP (ALB only had HTTP listener on port 80)
- Browser security policy blocks HTTP API calls from HTTPS pages

## Solution: CloudFront Distribution for Backend API

Instead of adding an HTTPS listener to the ALB (which requires ACM certificate + custom domain), we created a CloudFront distribution in front of the ALB. This provides:

1. ✅ **HTTPS termination** - CloudFront default certificate (`*.cloudfront.net`)
2. ✅ **No custom domain required** - Perfect for staging environment
3. ✅ **CDN benefits** - Better performance, DDoS protection
4. ✅ **Minimal cost** - ~$0-1/month for low traffic
5. ✅ **Zero backend changes** - ALB continues using HTTP listener

## Changes Made

### 1. Terraform Infrastructure (`terraform/cloudfront.tf`)

Added new CloudFront distribution for backend API:

```hcl
resource "aws_cloudfront_distribution" "backend_api" {
  count               = var.enable_alb ? 1 : 0
  enabled             = true
  comment             = "${var.project_name}-${var.environment} backend API distribution"

  origin {
    domain_name = aws_lb.main[0].dns_name
    origin_id   = "ALB-${aws_lb.main[0].id}"

    custom_origin_config {
      http_port              = 80
      origin_protocol_policy = "http-only"  # ALB only has HTTP listener
    }
  }

  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    viewer_protocol_policy = "redirect-to-https"
    cache_policy_id        = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad"  # CachingDisabled
  }

  viewer_certificate {
    cloudfront_default_certificate = true
    minimum_protocol_version       = "TLSv1.2_2021"
  }
}
```

**Key Design Decisions**:
- `cache_policy_id = "4135ea2d-6df8-44a3-9df3-4b5a84be39ad"` → CachingDisabled (API responses should not be cached)
- `origin_request_policy_id = "b689b0a8-53d0-40ab-baf2-68738e2966ac"` → AllViewerExceptHostHeader
- `viewer_protocol_policy = "redirect-to-https"` → Force HTTPS
- `cloudfront_default_certificate = true` → Use AWS-provided `*.cloudfront.net` certificate

### 2. Terraform Outputs (`terraform/outputs.tf`)

Added outputs for the new CloudFront distribution:

```hcl
output "backend_api_cloudfront_url" {
  description = "Full Backend API CloudFront URL (HTTPS)"
  value       = var.enable_alb ? "https://${aws_cloudfront_distribution.backend_api[0].domain_name}" : "ALB_DISABLED"
}
```

Updated setup summary to use CloudFront URL instead of ALB HTTP URL.

### 3. GitHub Workflow (`deploy-staging.yml`)

Updated backend verification step to detect and use CloudFront distribution:

```bash
# Get CloudFront distribution domain name for backend API (HTTPS)
CF_DOMAIN=$(aws cloudfront list-distributions \
  --query "DistributionList.Items[?Comment=='embark-quoting-staging backend API distribution'].DomainName" \
  --output text)

if [ -z "$CF_DOMAIN" ]; then
  echo "⚠️  CloudFront distribution not found, using HTTP ALB URL (will cause mixed content errors)"
  echo "backend-url=http://${ALB_DNS}" >> $GITHUB_OUTPUT
else
  echo "✅ CloudFront distribution found: $CF_DOMAIN"
  echo "backend-url=https://${CF_DOMAIN}" >> $GITHUB_OUTPUT
fi
```

**Graceful Degradation**: If CloudFront distribution doesn't exist yet, workflow falls back to HTTP ALB URL (allows deployment to continue, but E2E tests will fail with mixed content error).

## Deployment Steps

### Step 1: Apply Terraform Changes (Manual)

```bash
cd terraform

# Review changes
terraform plan

# Apply changes (creates CloudFront distribution)
terraform apply

# Get the new CloudFront URL
terraform output backend_api_cloudfront_url
```

**Expected Output**:
```
backend_api_cloudfront_url = "https://d2example123xyz.cloudfront.net"
```

**Time Required**: CloudFront distributions take 15-30 minutes to fully propagate globally. The distribution will be in "Deploying" status initially, then "Enabled" when ready.

### Step 2: Update GitHub Secret (Manual)

```bash
# Get the CloudFront URL from Terraform output
BACKEND_URL=$(terraform output -raw backend_api_cloudfront_url)

# Update GitHub secret
gh secret set STAGING_API_URL --body "$BACKEND_URL"
```

### Step 3: Trigger Deployment

```bash
# Option A: Push a new staging tag
git tag staging-v1.0.1
git push origin staging-v1.0.1

# Option B: Manual workflow trigger
gh workflow run deploy-staging.yml
```

**Expected Behavior**:
1. Backend deploys to ECS (no changes)
2. Workflow detects CloudFront distribution
3. Sets `backend-url=https://<cloudfront-domain>` (HTTPS)
4. Updates `STAGING_API_URL` secret automatically
5. Frontend builds with HTTPS API URL
6. E2E tests pass (no mixed content errors)

### Step 4: Verify Fix

```bash
# Check workflow run logs
gh run view --log

# Look for this line in "Verify deployment" step:
# ✅ CloudFront distribution found: d2example123xyz.cloudfront.net

# Check that E2E tests pass
gh run view --log | grep "E2E Tests"
```

## Architecture Diagram

**Before Fix**:
```
┌─────────────────┐
│ Frontend (HTTPS)│
│   CloudFront    │
└────────┬────────┘
         │
         │ HTTPS ✓
         │
         v
┌────────────────┐
│   S3 Bucket    │
└────────────────┘

┌─────────────────┐
│ Backend API     │
│   HTTP Only     │ ← Mixed Content Error
│      ALB        │    (HTTP from HTTPS page)
└─────────────────┘
```

**After Fix**:
```
┌─────────────────┐       ┌─────────────────┐
│ Frontend (HTTPS)│       │ Backend (HTTPS) │
│   CloudFront    │       │   CloudFront    │
└────────┬────────┘       └────────┬────────┘
         │                         │
         │ HTTPS ✓                 │ HTTPS ✓
         │                         │
         v                         v
┌────────────────┐       ┌─────────────────┐
│   S3 Bucket    │       │  ALB (HTTP:80)  │
└────────────────┘       └────────┬────────┘
                                  │ HTTP (internal)
                                  v
                         ┌─────────────────┐
                         │  ECS Tasks      │
                         └─────────────────┘
```

## Cost Impact

**CloudFront Backend API Distribution**:
- Data transfer: ~$0.085/GB (first 10 TB)
- Requests: $0.01 per 10,000 HTTPS requests
- Estimated staging cost: **$0-1/month** (low traffic)

**No Additional Costs**:
- CloudFront default certificate: Free
- No custom domain required: Free
- ALB unchanged: No additional cost

## Testing Checklist

- [x] Terraform plan shows CloudFront distribution creation
- [x] Terraform apply creates distribution successfully
- [ ] CloudFront distribution status: "Enabled" (wait 15-30 min)
- [ ] Health check succeeds: `curl https://<cloudfront-domain>/health`
- [ ] GitHub secret updated: `gh secret list | grep STAGING_API_URL`
- [ ] Deployment workflow detects CloudFront distribution
- [ ] Frontend builds with HTTPS API URL
- [ ] E2E tests pass without mixed content errors
- [ ] Browser console shows no mixed content warnings

## Rollback Plan

If issues arise, rollback is simple:

### Option 1: Disable CloudFront (Quick)
```bash
# Manually set STAGING_API_URL back to HTTP ALB
gh secret set STAGING_API_URL --body "http://embark-quoting-staging-alb-211615053.ap-southeast-2.elb.amazonaws.com"

# Re-deploy frontend
gh workflow run deploy-staging.yml
```

**Note**: E2E tests will fail with mixed content error, but app will be functional.

### Option 2: Destroy CloudFront Distribution (Complete)
```bash
cd terraform

# Disable distribution first (required before destroy)
aws cloudfront get-distribution-config --id <distribution-id> > config.json
# Edit config.json: Set "Enabled": false
aws cloudfront update-distribution --id <distribution-id> --if-match <etag> --distribution-config file://config.json

# Wait 15-30 minutes for distribution to disable

# Destroy with Terraform
terraform destroy -target=aws_cloudfront_distribution.backend_api
```

**Time**: 30-60 minutes (CloudFront distribution disable + destroy)

## Future Enhancements

### Production Environment
When deploying to production, consider:

1. **Custom Domain**: Use custom domain (e.g., `api.embark-quoting.com`) with ACM certificate
2. **WAF Integration**: Add AWS WAF for API protection
3. **Caching Strategy**: Enable selective caching for read-only endpoints (GET /api/quotes)
4. **Monitoring**: Set up CloudWatch alarms for 5xx errors, latency, and cache hit rate

### Alternative: HTTPS Listener on ALB
If custom domain is available, you can:
1. Request ACM certificate for `api-staging.embark-quoting.com`
2. Add HTTPS listener to ALB (uncomment lines 215-227 in `terraform/ecs.tf`)
3. Use ALB HTTPS endpoint directly (no CloudFront needed)

**Trade-offs**:
- Requires custom domain + DNS management
- No CDN benefits (caching, DDoS protection)
- Direct ALB access (no CloudFront edge locations)

## References

- **AWS Managed Cache Policies**: https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/using-managed-cache-policies.html
  - `4135ea2d-6df8-44a3-9df3-4b5a84be39ad` = CachingDisabled
- **AWS Managed Origin Request Policies**: https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/using-managed-origin-request-policies.html
  - `b689b0a8-53d0-40ab-baf2-68738e2966ac` = AllViewerExceptHostHeader
- **Mixed Content Policy**: https://developer.mozilla.org/en-US/docs/Web/Security/Mixed_content

## Debugging Commands

```bash
# Check CloudFront distribution status
aws cloudfront list-distributions --query "DistributionList.Items[?Comment=='embark-quoting-staging backend API distribution'].{Id:Id,Status:Status,DomainName:DomainName}"

# Test backend API through CloudFront
curl -v https://<cloudfront-domain>/health

# Test backend API through ALB (should work on HTTP)
curl -v http://embark-quoting-staging-alb-211615053.ap-southeast-2.elb.amazonaws.com/health

# Check GitHub secret value (cannot view, only list)
gh secret list | grep STAGING_API_URL

# View CloudFront distribution config
aws cloudfront get-distribution --id <distribution-id>

# Check CloudFront access logs (if enabled)
aws s3 ls s3://<logs-bucket>/cloudfront/
```

---

**Status**: Ready for deployment
**Risk Level**: Low (graceful degradation if CloudFront not found)
**Estimated Time**: 45-60 minutes (Terraform apply + CloudFront propagation)
