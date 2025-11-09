# AWS Infrastructure Cost Comparison

**Date**: 2025-11-04
**Region**: ap-southeast-2 (Sydney, Australia)
**Account Status**: AWS Free Tier eligible (first 12 months)

---

## 📊 Configuration Comparison

| Configuration | Resources | Monthly Cost (AUD) | Use Case |
|---------------|-----------|-------------------|----------|
| **Full Production** | 75 | ~$113/month | Production-ready with HA |
| **Minimal Staging** | 69 | ~$10-12/month | POC / Early Development |
| **Savings** | -6 | **-$101/month** | **89% cost reduction** |

---

## 💰 Detailed Cost Breakdown

### Full Production Setup (`staging.tfvars`)

| Service | Configuration | Monthly Cost (AUD) | Free Tier |
|---------|--------------|-------------------|-----------|
| **NAT Gateway** | 1 NAT + data transfer | $50 | ❌ No |
| **Application Load Balancer** | 1 ALB | $25 | ❌ No |
| **RDS PostgreSQL** | db.t4g.micro, 20 GB | $20 | ✅ **FREE** (12 mo) |
| **ECS Fargate** | 0.25 vCPU, 0.5 GB | $15 | ✅ **FREE** (6 mo credits) |
| **S3** | 1 GB storage + requests | $1 | ✅ **FREE** (5 GB) |
| **CloudFront** | 10 GB data transfer | $2 | ✅ **FREE** (1 TB/year) |
| **Cognito** | <50,000 MAUs | $0 | ✅ FREE (always) |
| **ECR** | 1 GB storage | $0.13 | ✅ **FREE** (0.5 GB) |
| **Data Transfer** | Outbound | $3 | Partial free |
| **CloudWatch** | Logs + alarms | $2 | Partial free |
| **TOTAL** | | **~$113/month** | |

**With Free Tier Applied**: ~$85/month for first 6-12 months

---

### Minimal Staging Setup (`minimal-staging.tfvars`)

| Service | Configuration | Monthly Cost (AUD) | Status |
|---------|--------------|-------------------|--------|
| **NAT Gateway** | ❌ Removed | ~~$50~~ **$0** | Saved |
| **Application Load Balancer** | ❌ Removed | ~~$25~~ **$0** | Saved |
| **VPC Endpoints** | ✅ 5 endpoints (ECR API, ECR DKR, S3 Gateway, Secrets Manager, CloudWatch Logs) | $7.20 | **Required** |
| **RDS PostgreSQL** | db.t3.micro, 20 GB, single-AZ | $0 | ✅ **FREE** (12 mo) |
| **ECS Fargate** | 0.25 vCPU, 0.5 GB, public subnet | $0 | ✅ **FREE** (6 mo credits) |
| **S3** | 1 GB storage | $0 | ✅ **FREE** (5 GB) |
| **CloudFront** | 10 GB data transfer | $0 | ✅ **FREE** (1 TB/year) |
| **Cognito** | <50,000 MAUs | $0 | ✅ FREE (always) |
| **ECR** | 1 GB storage | $0 | ✅ **FREE** (0.5 GB) |
| **Data Transfer** | Outbound (minimal) | $1-2 | Partial free |
| **CloudWatch** | Logs (reduced) | $1-2 | Partial free |
| **VPC** | Public subnets only | $0 | Always free |
| **TOTAL** | | **~$10-12/month** | |

---

## 🔑 Key Differences

### Architecture Changes

| Component | Full Setup | Minimal Setup |
|-----------|------------|---------------|
| **Networking** | Private subnets + NAT Gateway | Public subnets only |
| **Load Balancing** | Application Load Balancer | Direct ECS task access |
| **ECS Placement** | Private subnets | Public subnets with public IPs |
| **Database** | db.t4g.micro, Multi-AZ ready | db.t3.micro, Single-AZ |
| **High Availability** | ALB health checks, auto-scaling | Basic auto-scaling only |
| **Security** | Layered (private subnets + ALB) | Security groups only |

### What You Lose in Minimal Setup

1. **NAT Gateway** (~$50/month saved)
   - ❌ Private subnet isolation
   - ❌ Centralized outbound internet access
   - ✅ ECS tasks get public IPs directly (still secure with security groups)

2. **Application Load Balancer** (~$25/month saved)
   - ❌ SSL termination at load balancer
   - ❌ Path-based routing
   - ❌ Sticky sessions
   - ❌ Web Application Firewall (WAF) integration
   - ✅ Direct access to ECS task IPs (works for POC)

### What You Keep

✅ **Full functionality** - All features work
✅ **Cognito authentication** - User management intact
✅ **CloudFront CDN** - Frontend globally distributed
✅ **Auto-scaling** - ECS scales based on CPU/memory
✅ **Encrypted database** - RDS with Secrets Manager
✅ **CI/CD ready** - GitHub Actions workflows work
✅ **Monitoring** - CloudWatch logs and metrics

---

## 🚀 Deployment Commands

### Deploy Minimal Setup (~$3-5/month)

```bash
cd infrastructure/terraform

# Initialize (if not done already)
~/.local/bin/terraform init

# Review plan
~/.local/bin/terraform plan \
  -var-file="minimal-staging.tfvars" \
  -var="db_password=YourSecurePassword123!"

# Deploy
~/.local/bin/terraform apply \
  -var-file="minimal-staging.tfvars" \
  -var="db_password=YourSecurePassword123!"
```

**Deployment Time**: ~12-15 minutes (no NAT Gateway speeds it up)

### Deploy Full Setup (~$113/month)

```bash
# Use standard staging.tfvars
~/.local/bin/terraform apply \
  -var-file="staging.tfvars" \
  -var="db_password=YourSecurePassword123!"
```

**Deployment Time**: ~18-20 minutes (NAT Gateway + ALB take longer)

---

## 📈 When to Upgrade

**Start with Minimal**
→ Build features, test with early users

**Upgrade to Full** when you need:
1. **Security Compliance** - Private subnets required
2. **SSL/TLS Termination** - HTTPS at load balancer level
3. **Multiple Services** - ALB routes traffic to different backends
4. **High Traffic** - ALB handles 10,000+ requests/min better
5. **Production Launch** - Professional infrastructure for paying customers

---

## 💡 Upgrade Path

```bash
# Switch from minimal to full (zero downtime)
terraform apply -var-file="staging.tfvars" -var="db_password=..."

# Terraform will ADD:
# + NAT Gateway
# + Application Load Balancer
# + Private subnets
# + Update ECS to use private subnets

# No data loss, ~10 minute deployment
```

---

## 🎯 Recommended Strategy

**Phase 1: Minimal Setup** (Now - 3 months)
- Cost: ~$3-5/month
- Build features
- Test with 5-10 users
- Validate product-market fit

**Phase 2: Full Production** (When you have paying customers)
- Cost: ~$85-113/month (depending on Free Tier)
- Professional infrastructure
- Scale to 100+ users
- Add monitoring and alerting

**Phase 3: Scale Up** (Growing user base)
- Upgrade RDS to db.t4g.small or larger
- Add Multi-AZ for high availability
- Increase ECS task count
- Cost: $200-500/month (scales with usage)

---

## 📝 Notes

- **Free Tier Duration**: 12 months from AWS account creation
- **Your Account**: Created January 2025 (11 months remaining)
- **ECS Compute Credits**: First 6 months (5 months remaining)
- **Costs After Free Tier**: Expect ~$30-40/month for minimal, ~$120-150/month for full

---

## 🔗 Related Files

- **Minimal Config**: `minimal-staging.tfvars`
- **Full Config**: `staging.tfvars`
- **Production Config**: `production.tfvars`
- **Terraform Docs**: `README.md`
- **DevOps Guide**: `../../docs/devops-setup.md`
