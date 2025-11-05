# Infrastructure Roadmap

This document outlines the planned infrastructure evolution beyond v1.0 MVP, assuming successful first milestone deployment.

---

## Current State (v1.0 MVP - Milestone 1)

**Architecture**: Minimal cost, single-environment staging setup
**Monthly Cost**: ~$45/month (low-moderate usage)

### Components
- **Compute**: ECS Fargate (0.25 vCPU, 0.5 GB) - Single task, public subnets
- **Database**: RDS PostgreSQL t4g.micro (single AZ, no Multi-AZ)
- **Load Balancing**: **NONE** (direct ECS task access via public IP)
- **NAT Gateway**: **NONE** (cost optimization, tasks in public subnets)
- **CDN**: CloudFront (frontend only)
- **Authentication**: Cognito (single user pool)
- **Storage**: S3 (basic configuration)
- **Email**: SES (sandbox mode)
- **Monitoring**: CloudWatch + Sentry (basic)

### Design Decisions
- **No ALB**: Tasks in public subnets with direct internet access ($25/month saved)
- **No NAT Gateway**: VPC endpoints for AWS services ($32/month saved)
- **Single AZ**: Database not Multi-AZ enabled ($15-20/month saved)
- **No Auto-scaling**: Fixed task count = 1
- **Public Subnets**: ECS tasks have public IPs

**Total Savings**: ~$75/month vs production-ready setup

---

## Phase 2: Production Readiness (v1.5 - Milestone 2)

**Target**: First production deployment with paying customers
**Timeline**: 2-3 weeks after MVP validation
**Estimated Cost**: ~$120-150/month

### Upgrades Required

#### 1. **High Availability & Reliability**
- **Add Application Load Balancer**
  - Health checks and automatic failover
  - SSL/TLS termination
  - Cost: ~$25/month
- **Multi-AZ RDS**
  - Automatic failover to standby
  - Improved durability and availability
  - Cost: +$15-20/month
- **ECS Auto-scaling**
  - Min 2 tasks across 2 AZs
  - CPU/memory-based scaling (2-6 tasks)
  - Cost: +$20-40/month (additional task hours)

#### 2. **Network Architecture**
- **Move tasks to private subnets**
  - Enhanced security posture
  - ALB handles internet-facing traffic
- **Add NAT Gateway** (required for private subnets)
  - Outbound internet access for tasks
  - Cost: ~$32/month + data transfer

#### 3. **Security Hardening**
- **AWS WAF** (Web Application Firewall)
  - DDoS protection
  - OWASP Top 10 protection
  - Cost: ~$6/month + rule charges
- **AWS Secrets Manager rotation**
  - Automatic credential rotation
  - Cost: ~$1/month
- **VPC Flow Logs** (enhanced)
  - Network traffic analysis
  - Security auditing
  - Cost: ~$5/month

#### 4. **Monitoring & Observability**
- **CloudWatch Container Insights** (enabled)
- **Enhanced Sentry integration**
  - Performance monitoring
  - Error tracking with source maps
  - Cost: ~$26/month (Team plan)
- **CloudWatch Alarms**
  - CPU, memory, error rate alerts
  - SNS notifications to team

#### 5. **Backup & Disaster Recovery**
- **RDS automated backups** (retained 7 days)
- **Point-in-time recovery** enabled
- **S3 versioning + lifecycle policies**
- **Regular backup testing schedule**

---

## Phase 3: Scale & Performance (v2.0 - Milestone 3)

**Target**: 100+ active users, 500+ quotes/month
**Timeline**: 6-12 months post-launch
**Estimated Cost**: ~$250-350/month

### Enhancements

#### 1. **Database Optimization**
- **Upgrade RDS instance**: t4g.small → t4g.medium
  - Cost: +$30/month
- **Read replicas** (if read-heavy workload)
  - Offload reporting and analytics
  - Cost: +$40/month per replica
- **Connection pooling** (RDS Proxy)
  - Improved connection management
  - Cost: ~$15/month

#### 2. **Caching Layer**
- **Amazon ElastiCache (Redis)**
  - Session storage
  - Frequently accessed data
  - API response caching
  - Cost: ~$15/month (cache.t4g.micro)

#### 3. **CDN Enhancement**
- **CloudFront optimizations**
  - Custom SSL certificate (ACM - free)
  - Edge locations for global distribution
  - Lambda@Edge for dynamic content
  - Cost: +$5-10/month (data transfer)

#### 4. **Storage Optimization**
- **S3 Intelligent-Tiering**
  - Automatic cost optimization
  - Infrequent access detection
  - Savings: ~20-30% on storage
- **S3 lifecycle policies**
  - Archive old PDFs to Glacier
  - Delete temporary files

#### 5. **Compute Scaling**
- **Fargate Spot** (cost optimization)
  - Up to 70% savings for non-critical tasks
  - Hybrid Fargate + Fargate Spot strategy
  - Savings: ~$20-40/month
- **Task size optimization**
  - Right-size based on metrics
  - 0.5 vCPU, 1 GB (if needed)

---

## Phase 4: Enterprise Features (v3.0 - Milestone 4)

**Target**: 500+ active users, multi-team deployment
**Timeline**: 12-18 months post-launch
**Estimated Cost**: ~$500-700/month

### Advanced Capabilities

#### 1. **Multi-Region Deployment**
- **Disaster recovery region** (ap-southeast-1)
  - Passive standby for DR
  - Route 53 health checks + failover
  - Cost: +$150/month (standby infrastructure)

#### 2. **Advanced Analytics**
- **Amazon QuickSight**
  - Business intelligence dashboards
  - Quote analytics and trends
  - Cost: ~$24/month (Standard edition)
- **AWS Glue + Athena**
  - Data lake for historical analysis
  - Cost: ~$20/month (query-based)

#### 3. **API Gateway**
- **Amazon API Gateway**
  - Rate limiting and throttling
  - API key management
  - Cost: ~$3.50/month + request charges
- **Third-party integrations**
  - Accounting software (Xero, MYOB)
  - CRM integration

#### 4. **Enhanced Availability**
- **Aurora PostgreSQL** (instead of RDS)
  - Superior performance and availability
  - Automatic failover in <30 seconds
  - Cost: +$50-100/month

#### 5. **CI/CD Enhancements**
- **Blue/green deployments**
  - Zero-downtime releases
  - Automated rollback
- **Canary deployments**
  - Gradual traffic shifting
  - A/B testing capabilities

---

## Cost Comparison Summary

| Phase | Timeline | Monthly Cost | Key Additions |
|-------|----------|--------------|---------------|
| **v1.0 MVP** | Weeks 1-11 | ~$45 | Minimal viable infrastructure |
| **v1.5 Production** | +2-3 weeks | ~$120-150 | ALB, Multi-AZ, NAT Gateway, WAF |
| **v2.0 Scale** | +6-12 months | ~$250-350 | Caching, read replicas, Fargate Spot |
| **v3.0 Enterprise** | +12-18 months | ~$500-700 | Multi-region, analytics, Aurora |

---

## Migration Considerations

### v1.0 → v1.5 Migration Checklist

- [ ] Create ALB and target groups
- [ ] Migrate ECS tasks to private subnets
- [ ] Deploy NAT Gateway
- [ ] Enable Multi-AZ for RDS (requires downtime window)
- [ ] Configure WAF rules
- [ ] Update DNS records (if custom domain)
- [ ] Test failover scenarios
- [ ] Update security groups
- [ ] Configure CloudWatch alarms
- [ ] Enable automated backups

**Estimated Downtime**: 30-60 minutes (for Multi-AZ enablement)

### v1.5 → v2.0 Migration Checklist

- [ ] Deploy ElastiCache cluster
- [ ] Create read replicas (zero downtime)
- [ ] Implement caching layer in application
- [ ] Configure RDS Proxy
- [ ] Enable Fargate Spot capacity provider
- [ ] Optimize S3 storage classes
- [ ] Right-size ECS tasks based on metrics
- [ ] Configure Lambda@Edge functions

**Estimated Downtime**: None (rolling updates)

---

## Decision Points

### When to Move to v1.5 (Production)?

Trigger indicators:
- First 5 paying customers confirmed
- 50+ quotes created successfully
- No critical bugs in past 2 weeks
- Uptime SLA requirements discussed
- Budget approved for $120-150/month

### When to Move to v2.0 (Scale)?

Trigger indicators:
- 100+ active users
- 500+ quotes/month
- Database CPU >60% sustained
- Task count frequently scaling to max (6 tasks)
- Customer requests for reporting/analytics
- Response times >2s under load

### When to Move to v3.0 (Enterprise)?

Trigger indicators:
- 500+ active users
- Multiple business units/teams
- Geographic expansion beyond Australia
- Compliance requirements (SOC 2, ISO 27001)
- Revenue >$500K annually
- Enterprise customer requirements

---

## Alternative Architectures Considered

### Lambda + DynamoDB (Serverless)

**Pros**:
- Pay-per-use pricing (potentially cheaper at low scale)
- Auto-scaling built-in
- No server management

**Cons**:
- Cold starts (400-800ms)
- Complex offline sync with DynamoDB
- Higher development complexity
- Vendor lock-in

**Decision**: Rejected in favor of ECS + RDS for MVP due to complexity and offline-first requirements.

### Kubernetes (EKS)

**Pros**:
- Maximum flexibility and control
- Multi-cloud portability
- Rich ecosystem

**Cons**:
- High operational overhead
- Minimum cost ~$150/month (control plane + nodes)
- Overkill for current scale
- Steep learning curve

**Decision**: May consider for v3.0+ if multi-region or hybrid cloud needed.

---

## Cost Optimization Strategies

### Ongoing Optimizations (All Phases)

1. **Reserved Instances/Savings Plans**
   - 1-year commitment: 30-40% savings
   - 3-year commitment: 50-60% savings
   - Apply after stable workload established

2. **Spot Instances (Fargate Spot)**
   - Up to 70% savings
   - Suitable for non-critical background jobs

3. **S3 Lifecycle Policies**
   - Move old PDFs to Glacier after 90 days
   - Delete temporary files after 7 days
   - Savings: ~40% on storage

4. **CloudWatch Log Retention**
   - Reduce retention to 7 days (staging)
   - 30 days (production)
   - Savings: ~$5-10/month

5. **Monitoring Review**
   - Disable unused metrics
   - Aggregate low-value logs
   - Right-size Sentry plan

---

## Related Documents

- **Current Infrastructure**: `infrastructure/terraform/` (Terraform configs)
- **Cost Analysis**: `infrastructure/terraform/COST_COMPARISON.md`
- **BLUEPRINT**: `specs/BLUEPRINT.yaml` (v1.0 MVP specifications)
- **Financial Model**: `docs/financial-model.md` (Profit-First methodology)

---

**Last Updated**: 2025-11-05
