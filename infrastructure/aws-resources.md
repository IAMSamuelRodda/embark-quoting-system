# AWS Infrastructure Documentation

**Project**: Embark Quoting System
**Environment**: Production
**Region**: ap-southeast-2 (Sydney)
**Account ID**: 061039764429
**Created**: 2025-11-04

---

## Network Infrastructure

### VPC
- **VPC ID**: `vpc-05fbce376b99beafa`
- **CIDR**: `10.0.0.0/16`
- **DNS Hostnames**: Enabled
- **Tags**:
  - Name: embark-quoting-vpc
  - Project: embark-quoting-system

### Internet Gateway
- **IGW ID**: `igw-094a8bfa9a280676f`
- **Attached to**: vpc-05fbce376b99beafa

### Subnets

#### Public Subnets (For ALB)
| Name | Subnet ID | CIDR | AZ | Auto-assign Public IP |
|------|-----------|------|----|-----------------------|
| embark-public-subnet-2a | subnet-0070947af1375b821 | 10.0.1.0/24 | ap-southeast-2a | Yes |
| embark-public-subnet-2b | subnet-00b6b9925ad84f02a | 10.0.2.0/24 | ap-southeast-2b | Yes |

#### Private Subnets (For ECS & RDS)
| Name | Subnet ID | CIDR | AZ |
|------|-----------|------|----|
| embark-private-subnet-2a | subnet-0425ad1f52b20f2b1 | 10.0.11.0/24 | ap-southeast-2a |
| embark-private-subnet-2b | subnet-03875bbf8a6a09986 | 10.0.12.0/24 | ap-southeast-2b |

### Route Tables
- **Public Route Table ID**: `rtb-00060b2dd0fd8cdcc`
  - Routes:
    - `10.0.0.0/16` → local
    - `0.0.0.0/0` → igw-094a8bfa9a280676f
  - Associated Subnets:
    - subnet-0070947af1375b821 (public-2a)
    - subnet-00b6b9925ad84f02a (public-2b)

---

## Security Groups

### ALB Security Group
- **Security Group ID**: `sg-02203b669c065cc4a`
- **Name**: embark-alb-sg
- **VPC**: vpc-05fbce376b99beafa
- **Ingress Rules**:
  - Port 80 (HTTP) from 0.0.0.0/0
  - Port 443 (HTTPS) from 0.0.0.0/0
- **Egress Rules**: Default (all traffic allowed)

### ECS Security Group
- **Security Group ID**: `sg-0d060a7f9606fb74b`
- **Name**: embark-ecs-sg
- **VPC**: vpc-05fbce376b99beafa
- **Ingress Rules**:
  - Port 3000 (TCP) from sg-02203b669c065cc4a (ALB)
- **Egress Rules**: Default (all traffic allowed)

### RDS Security Group
- **Security Group ID**: `sg-0e90d8e997ba8cad3`
- **Name**: embark-rds-sg
- **VPC**: vpc-05fbce376b99beafa
- **Ingress Rules**:
  - Port 5432 (PostgreSQL) from sg-0d060a7f9606fb74b (ECS)
- **Egress Rules**: Default (all traffic allowed)

---

## Database (RDS)

### PostgreSQL Instance
- **DB Identifier**: `embark-quoting-db`
- **Instance Class**: db.t4g.micro
- **Engine**: PostgreSQL 15.10
- **Storage**: 20 GB (gp2)
- **Multi-AZ**: No
- **Publicly Accessible**: No
- **VPC Security Group**: sg-0e90d8e997ba8cad3
- **Subnet Group**: embark-db-subnet-group
  - Subnets: subnet-0425ad1f52b20f2b1, subnet-03875bbf8a6a09986
- **Backup Retention**: 7 days
- **Backup Window**: 03:00-04:00 UTC
- **Maintenance Window**: mon:04:00-mon:05:00 UTC
- **Master Username**: `embark_admin`
- **Master Password**: `EUXWIzKgxxatYc6DaV8148BA` ⚠️ **STORE SECURELY**
- **Endpoint**: ⏳ Provisioning (check with: `aws rds describe-db-instances --db-instance-identifier embark-quoting-db`)
- **ARN**: `arn:aws:rds:ap-southeast-2:061039764429:db:embark-quoting-db`

---

## Storage (S3)

### Backups Bucket
- **Bucket Name**: `embark-quoting-backups-061039764429`
- **Region**: ap-southeast-2
- **Versioning**: Enabled
- **Purpose**: Database backups, application state backups
- **Tags**:
  - Name: embark-backups
  - Project: embark-quoting-system

### Exports Bucket
- **Bucket Name**: `embark-quoting-exports-061039764429`
- **Region**: ap-southeast-2
- **Versioning**: Disabled
- **Purpose**: PDF exports, data exports, reports
- **Tags**:
  - Name: embark-exports
  - Project: embark-quoting-system

---

## Container Registry (ECR)

### Backend Repository
- **Repository Name**: `embark-quoting-backend`
- **Repository URI**: `061039764429.dkr.ecr.ap-southeast-2.amazonaws.com/embark-quoting-backend`
- **Image Scanning**: Enabled (scan on push)
- **Encryption**: AES256
- **ARN**: `arn:aws:ecr:ap-southeast-2:061039764429:repository/embark-quoting-backend`

---

## Connection Information

### For ECS Task Definition
```yaml
Environment Variables:
  - DB_HOST: <RDS_ENDPOINT>  # Available after RDS provisioning completes
  - DB_PORT: 5432
  - DB_NAME: postgres
  - DB_USER: embark_admin
  - DB_PASSWORD: <STORE_IN_AWS_SECRETS_MANAGER>
  - AWS_REGION: ap-southeast-2
  - S3_BACKUPS_BUCKET: embark-quoting-backups-061039764429
  - S3_EXPORTS_BUCKET: embark-quoting-exports-061039764429
```

### Docker Push Commands
```bash
# Authenticate Docker with ECR
aws ecr get-login-password --region ap-southeast-2 | docker login --username AWS --password-stdin 061039764429.dkr.ecr.ap-southeast-2.amazonaws.com

# Tag your image
docker tag embark-backend:test 061039764429.dkr.ecr.ap-southeast-2.amazonaws.com/embark-quoting-backend:latest

# Push to ECR
docker push 061039764429.dkr.ecr.ap-southeast-2.amazonaws.com/embark-quoting-backend:latest
```

---

## Cost Estimate (Monthly)

| Service | Configuration | Estimated Cost (USD) |
|---------|---------------|----------------------|
| ECS Fargate | 0.25 vCPU, 0.5 GB, 24/7 | ~$10 |
| RDS PostgreSQL | db.t4g.micro, 20GB | ~$15 |
| Application Load Balancer | 1 instance | ~$18 |
| S3 | 5GB storage + requests | ~$1 |
| ECR | Image storage | ~$1 |
| **Total** | | **~$45/month** |

---

## Next Steps (Task 1.2.2 & 1.2.3)

1. ✅ Wait for RDS instance to be available (5-10 minutes)
2. ⏳ Create ALB (Task 1.2.3)
3. ⏳ Create ECS Cluster
4. ⏳ Create ECS Task Definition (using ECR image)
5. ⏳ Create ECS Service with ALB integration
6. ⏳ Test end-to-end deployment

---

## Security Recommendations

⚠️ **Before Production**:
1. Move DB password to AWS Secrets Manager
2. Enable encryption at rest for S3 buckets
3. Enable Multi-AZ for RDS (requires restart)
4. Set up CloudWatch alarms for monitoring
5. Configure AWS WAF for ALB
6. Enable VPC Flow Logs
7. Set up automated backups export to S3
8. Configure IAM roles with least privilege

---

## Troubleshooting

### Check RDS Status
```bash
aws rds describe-db-instances --db-instance-identifier embark-quoting-db --query 'DBInstances[0].{Status:DBInstanceStatus,Endpoint:Endpoint.Address}'
```

### Test S3 Access
```bash
aws s3 ls s3://embark-quoting-backups-061039764429/
```

### Verify Security Group Rules
```bash
aws ec2 describe-security-groups --group-ids sg-02203b669c065cc4a sg-0d060a7f9606fb74b sg-0e90d8e997ba8cad3
```

---

**Last Updated**: 2025-11-04
**Status**: ⏳ RDS provisioning (all other resources ready)
