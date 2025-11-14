# Ultra-Low-Cost Architecture (<$1/month Target)

**Target**: <$1/month for staging environment
**Current**: ~$22/month (ECS Fargate + EC2 Database + monitoring)
**Problem**: Even cheapest AWS EC2 instance is $7.50/month after Free Tier

---

## 📊 Cost Analysis

### Current Architecture (2 separate services)
```
┌─────────────────────────────────────────────────────────┐
│ ECS Fargate (Backend)              $10.37/month         │
│ - 0.25 vCPU: $1.46/month                                │
│ - 512 MB RAM: $0.16/month                               │
│ - Running 24/7: 730 hours × $0.01475/hour              │
├─────────────────────────────────────────────────────────┤
│ EC2 t3.micro (Database)            $7.50/month          │
│ - Instance: $7.50/month                                 │
│ - EBS 30GB gp3: $2.40/month                            │
├─────────────────────────────────────────────────────────┤
│ CloudWatch Monitoring              $0.70/month          │
│ - 2 alarms × $0.10: $0.20/month                        │
│ - Logs (estimated): $0.50/month                        │
├─────────────────────────────────────────────────────────┤
│ S3 Backups                         $0.60/month          │
│ - 5GB storage × $0.023: $0.12/month                    │
│ - Lifecycle transitions: $0.05/month                   │
│ - PUT/GET requests: $0.43/month                        │
├─────────────────────────────────────────────────────────┤
│ Secrets Manager                    $0.40/month          │
│ - 1 secret × $0.40: $0.40/month                        │
├─────────────────────────────────────────────────────────┤
│ TOTAL (after Free Tier)            $21.57/month         │
└─────────────────────────────────────────────────────────┘
```

### During AWS Free Tier (first 12 months from account creation)
```
✅ 750 hours/month t2.micro/t3.micro (covers ONE instance 24/7)
✅ 30GB EBS storage
✅ 5GB S3 storage
✅ 10 CloudWatch alarms
✅ 5GB CloudWatch Logs

Cost during Free Tier: $10.37/month (ECS Fargate only - NOT covered by Free Tier)
```

### After Free Tier Expires (month 13+)
```
❌ EC2 charges kick in: +$7.50/month
❌ EBS charges kick in: +$2.40/month
❌ CloudWatch charges: +$0.70/month
❌ S3 charges (minimal): +$0.60/month

Total: $21.57/month
```

---

## 🎯 Proposed Ultra-Low-Cost Architecture

### Consolidate EVERYTHING onto ONE EC2 Instance

```
┌─────────────────────────────────────────────────────────┐
│                    EC2 t3.micro                         │
│                  (ap-southeast-2a)                      │
├─────────────────────────────────────────────────────────┤
│  Docker Compose:                                        │
│    ┌──────────────────────────────────────────┐        │
│    │  Container 1: Backend (Node.js/Express)  │        │
│    │  - Port 3000 (public)                    │        │
│    │  - Connects to localhost:5432            │        │
│    └──────────────────────────────────────────┘        │
│                                                         │
│    ┌──────────────────────────────────────────┐        │
│    │  Container 2: PostgreSQL 15              │        │
│    │  - Port 5432 (localhost only)            │        │
│    │  - Volume: /var/lib/postgresql/data      │        │
│    └──────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────┘
          ↓ (public IP via CloudFront)
    CloudFront CDN (free-tier eligible)
```

### Cost Breakdown (Consolidated)

**During Free Tier (12 months)**:
```
EC2 t3.micro:              $0.00/month  (750 hours free)
EBS 30GB gp3:              $0.00/month  (30GB free)
CloudFront:                $0.00/month  (1TB transfer free)
Data Transfer Out:         $0.00/month  (100GB free)
──────────────────────────────────────
TOTAL:                     $0.00/month ✅
```

**After Free Tier (month 13+)**:
```
EC2 t3.micro:              $7.50/month
EBS 30GB gp3:              $2.40/month
CloudFront:                $0.85/month  (100GB transfer)
──────────────────────────────────────
TOTAL:                     $10.75/month
```

**After Free Tier (MINIMAL - remove all non-essentials)**:
```
EC2 t3.micro:              $7.50/month
EBS 8GB gp3:               $0.80/month  (minimum viable size)
──────────────────────────────────────
TOTAL:                     $8.30/month
```

### 💰 The <$1/month Reality Check

**Impossible with AWS after Free Tier**. Here's why:

| Provider          | Cheapest Option       | Cost/Month | Notes                      |
|-------------------|-----------------------|------------|----------------------------|
| AWS EC2           | t4g.nano (ARM)        | $3.36      | 2 vCPU, 512MB RAM          |
| AWS Lightsail     | Smallest VPS          | $3.50      | 512MB RAM, 1 vCPU          |
| DigitalOcean      | Basic Droplet         | $4.00      | 512MB RAM, 1 vCPU          |
| Hetzner           | CX11                  | €3.79      | 2GB RAM, 1 vCPU (cheapest) |
| Oracle Cloud      | Always Free Tier      | **$0.00**  | ARM instance (limited)     |
| Google Cloud      | e2-micro              | ~$7.00     | 1GB RAM, 2 vCPU            |

**To actually achieve <$1/month**, you need:
1. **Oracle Cloud Always Free Tier** (ARM instance, 1-4 OCPUs, up to 24GB RAM - FREE forever)
2. **AWS Free Tier** (12 months only, then $8-10/month minimum)
3. **Self-host on home server** ($0/month cloud costs)

---

## 🚀 Recommended Path Forward

### Option 1: Consolidated EC2 (Best for AWS)
**Eliminate ECS Fargate, run everything on ONE EC2 instance**

**Pros**:
- During Free Tier: **$0/month** ✅
- After Free Tier: **~$8.30/month** (far from $1, but best possible on AWS)
- Simple architecture
- No VPC complexity, no load balancers, no ECS

**Cons**:
- Still $8/month after Free Tier (830% over budget)
- Single point of failure
- Manual scaling

**Implementation**:
1. Destroy ECS Fargate cluster
2. Run backend + database on SAME EC2 instance
3. Expose backend via CloudFront → EC2 public IP
4. Remove: CloudWatch alarms, S3 backups, detailed monitoring
5. Use 8GB EBS volume instead of 30GB

### Option 2: Oracle Cloud Always Free (Actually <$1/month)
**Migrate to Oracle Cloud Infrastructure**

**Pros**:
- **$0/month FOREVER** (not just 12 months) ✅
- ARM-based compute (4 OCPUs, 24GB RAM)
- 200GB block storage
- Actually free, not time-limited

**Cons**:
- Migration effort (re-create infrastructure)
- Less familiar than AWS
- Smaller ecosystem

**Implementation**:
1. Create Oracle Cloud account
2. Provision Always Free ARM instance
3. Migrate Terraform to OCI provider
4. DNS update to point to OCI public IP

### Option 3: Reduce to Development-Only Setup
**Only run when actively developing**

**Pros**:
- During Free Tier: **$0/month** if <750 hours ✅
- After Free Tier: **~$0.50-2/month** (only run 50-200 hours/month)
- Terraform destroy when not in use

**Cons**:
- Not "always available" for testing
- Manual start/stop workflow
- Lose ephemeral data between sessions

---

## 📋 Action Items

### Immediate: Remove Unnecessary Costs
1. ✅ Already removed RDS ($15/month savings)
2. Remove CloudWatch alarms (saves $0.20/month)
3. Remove CloudWatch Logs retention (saves $0.50/month)
4. Remove S3 backup automation (saves $0.60/month)
5. Disable detailed EC2 monitoring (saves $0.10/month)

### Next: Consolidate to Single EC2
1. Create new EC2 instance with Docker Compose (backend + database)
2. Update CloudFront to point to EC2 public IP (not ALB)
3. Destroy ECS Fargate cluster (saves $10.37/month)
4. Destroy separate database EC2 (saves $7.50/month)
5. **Result**: During Free Tier = $0/month, After = $8.30/month

### Long-term: Consider Migration to Oracle Cloud
- For actual <$1/month target, Oracle Always Free is the ONLY option
- Evaluate migration effort vs cost savings
- Decision point: When AWS Free Tier expires (month 13)

---

## 🔍 Next Steps

**Which path do you want to take?**

1. **Consolidate to single EC2** (AWS Free Tier = $0, after = $8.30/month)
2. **Migrate to Oracle Cloud** (Always Free = $0/month forever)
3. **Development-only mode** (run <750 hours/month for $0-2/month)

I recommend **Option 1** for now (consolidate), then revisit **Option 2** (Oracle) when Free Tier expires.
