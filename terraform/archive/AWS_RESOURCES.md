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
- **Master Password**: **Stored in AWS Secrets Manager**
  - Secret Name: `embark-quoting/production/db-credentials`
  - Retrieve: `aws secretsmanager get-secret-value --secret-id embark-quoting/production/db-credentials --query SecretString --output text`
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

## Authentication (Cognito)

### User Pool
- **User Pool ID**: `ap-southeast-2_WCrUlLwIE`
- **User Pool ARN**: `arn:aws:cognito-idp:ap-southeast-2:061039764429:userpool/ap-southeast-2_WCrUlLwIE`
- **User Pool Name**: `embark-quoting-users`
- **Region**: ap-southeast-2
- **MFA**: Disabled (can be enabled later with SMS configuration)
- **Email Verification**: Enabled (CONFIRM_WITH_CODE)
- **Password Policy**:
  - Minimum Length: 8 characters
  - Requires: Uppercase, Lowercase, Numbers
  - Symbols: Optional
  - Temporary Password Validity: 7 days
- **Device Tracking**: Enabled
- **Advanced Security**: AUDIT mode (compromised credentials detection)
- **Account Recovery**: Via verified email
- **Deletion Protection**: ACTIVE ⚠️

### App Client (PWA)
- **Client ID**: `61p5378jhhm40ud2m92m3kv7jv`
- **Client Name**: `embark-pwa-client`
- **Client Secret**: None (public client for PWA)
- **Token Validity**:
  - Access Token: 1 hour
  - ID Token: 1 hour
  - Refresh Token: 30 days (optimized for offline-first)
- **Auth Flows**:
  - ALLOW_USER_PASSWORD_AUTH
  - ALLOW_REFRESH_TOKEN_AUTH (critical for offline support)
  - ALLOW_USER_SRP_AUTH
  - ALLOW_CUSTOM_AUTH
- **OAuth Flows**: code, implicit
- **OAuth Scopes**: email, openid, profile
- **Callback URLs**:
  - http://localhost:5173/callback (Vite dev)
  - http://localhost:3000/callback (Production)
- **Logout URLs**:
  - http://localhost:5173/logout
  - http://localhost:3000/logout

### User Groups
- **admins**:
  - Precedence: 1 (highest)
  - Description: Administrators with full access to price management and user management
  - Permissions: All features (quote management, price management, user management)

- **field_workers**:
  - Precedence: 2
  - Description: Field workers with access to quote management (no price management)
  - Permissions: Quote management only (no price editor, no user management)

### Custom Attributes
- **custom:role** (String, mutable)
  - Min Length: 1
  - Max Length: 50
  - Used for role-based access control in the frontend

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
  - COGNITO_USER_POOL_ID: ap-southeast-2_WCrUlLwIE
  - COGNITO_CLIENT_ID: 61p5378jhhm40ud2m92m3kv7jv
  - COGNITO_REGION: ap-southeast-2
```

### For Frontend (React/Vite)
```javascript
// src/config/cognito.ts
export const cognitoConfig = {
  region: 'ap-southeast-2',
  userPoolId: 'ap-southeast-2_WCrUlLwIE',
  userPoolWebClientId: '61p5378jhhm40ud2m92m3kv7jv',
  oauth: {
    domain: 'ap-southeast-2_WCrUlLwIE.auth.ap-southeast-2.amazoncognito.com',
    scope: ['email', 'openid', 'profile'],
    redirectSignIn: 'http://localhost:5173/callback',
    redirectSignOut: 'http://localhost:5173/logout',
    responseType: 'code'
  }
};
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

## Load Balancer (ALB)

### Application Load Balancer
- **Load Balancer Name**: `embark-quoting-alb`
- **DNS Name**: `embark-quoting-alb-1987044954.ap-southeast-2.elb.amazonaws.com`
- **ARN**: `arn:aws:elasticloadbalancing:ap-southeast-2:061039764429:loadbalancer/app/embark-quoting-alb/29c4a476d4dc54e5`
- **Scheme**: Internet-facing
- **VPC**: vpc-05fbce376b99beafa
- **Subnets**: subnet-0070947af1375b821 (2a), subnet-00b6b9925ad84f02a (2b)
- **Security Group**: sg-02203b669c065cc4a (embark-alb-sg)
- **Health Check Endpoint**: http://embark-quoting-alb-1987044954.ap-southeast-2.elb.amazonaws.com/health

### Target Group
- **Target Group Name**: `embark-ecs-tg`
- **ARN**: `arn:aws:elasticloadbalancing:ap-southeast-2:061039764429:targetgroup/embark-ecs-tg/716c31aa75327183`
- **Protocol**: HTTP
- **Port**: 3000
- **Target Type**: IP (for awsvpc networking)
- **Health Check**:
  - Path: `/health`
  - Interval: 30 seconds
  - Timeout: 5 seconds
  - Healthy Threshold: 2
  - Unhealthy Threshold: 3
  - Matcher: 200

### Listener
- **Protocol**: HTTP
- **Port**: 80
- **Default Action**: Forward to embark-ecs-tg

---

## Container Orchestration (ECS)

### ECS Cluster
- **Cluster Name**: `embark-quoting-cluster`
- **ARN**: `arn:aws:ecs:ap-southeast-2:061039764429:cluster/embark-quoting-cluster`
- **Status**: ACTIVE
- **Capacity Providers**: FARGATE, FARGATE_SPOT (default)

### ECS Task Definition
- **Family**: `embark-quoting-backend`
- **Revision**: 1
- **Task Definition ARN**: `arn:aws:ecs:ap-southeast-2:061039764429:task-definition/embark-quoting-backend:1`
- **Network Mode**: awsvpc (required for Fargate)
- **Requires Compatibilities**: FARGATE
- **CPU**: 256 (0.25 vCPU)
- **Memory**: 512 MB
- **Execution Role**: `arn:aws:iam::061039764429:role/ecsTaskExecutionRole`
- **Container Image**: `061039764429.dkr.ecr.ap-southeast-2.amazonaws.com/embark-quoting-backend:latest`
- **Container Port**: 3000
- **Log Driver**: awslogs
  - Log Group: `/ecs/embark-quoting-backend`
  - Region: ap-southeast-2
  - Stream Prefix: ecs
  - Auto-create: true
- **Health Check**: `wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1`
  - Interval: 30s
  - Timeout: 5s
  - Retries: 3
  - Start Period: 60s

### ECS Service
- **Service Name**: `embark-backend-service`
- **Cluster**: embark-quoting-cluster
- **Task Definition**: embark-quoting-backend:1
- **Desired Count**: 1
- **Launch Type**: FARGATE
- **Platform Version**: LATEST
- **Network Configuration**:
  - Subnets: subnet-0070947af1375b821 (public-2a), subnet-00b6b9925ad84f02a (public-2b)
  - Security Groups: sg-0d060a7f9606fb74b (embark-ecs-sg)
  - Assign Public IP: ENABLED (required for ECR access without NAT Gateway)
- **Load Balancer**:
  - Target Group: embark-ecs-tg
  - Container Name: embark-backend
  - Container Port: 3000
- **Deployment Configuration**:
  - Minimum Healthy Percent: 100
  - Maximum Percent: 200
- **Health Check Grace Period**: 60 seconds

### IAM Roles

#### ecsTaskExecutionRole
- **Role ARN**: `arn:aws:iam::061039764429:role/ecsTaskExecutionRole`
- **Attached Policies**:
  - `AmazonECSTaskExecutionRolePolicy` (AWS managed)
  - `ECSCloudWatchLogsPolicy` (custom policy for log group creation)
- **Trust Relationship**: ecs-tasks.amazonaws.com
- **Purpose**: Allows ECS to pull images from ECR and create CloudWatch Logs

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

## Deployment Status

1. ✅ VPC and Network Infrastructure
2. ✅ RDS PostgreSQL Database (provisioning)
3. ✅ S3 Buckets (backups, exports)
4. ✅ ECR Repository with backend image
5. ✅ Cognito User Pool with groups
6. ✅ Application Load Balancer
7. ✅ ECS Cluster and Task Definition
8. ✅ ECS Service deployed and healthy
9. ✅ End-to-end deployment tested

**API Endpoint**: http://embark-quoting-alb-1987044954.ap-southeast-2.elb.amazonaws.com/health

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

## Cognito User Management

### Creating Test Users

#### Option 1: AWS Console (Recommended for initial testing)
1. Go to AWS Console → Cognito → User Pools → `embark-quoting-users`
2. Click "Create user"
3. Fill in:
   - Email: your-email@example.com
   - Temporary password: TempPass123!
   - Mark "Send email invitation" if you have access to the email
4. Click "Create user"
5. Go to "Groups" tab → "admins" → "Add user to group"

#### Option 2: AWS CLI
```bash
# Create admin user
aws cognito-idp admin-create-user \
  --user-pool-id ap-southeast-2_WCrUlLwIE \
  --username admin@example.com \
  --user-attributes Name=email,Value=admin@example.com Name=email_verified,Value=true Name=name,Value="Admin User" Name=custom:role,Value=admin \
  --temporary-password TempPass123! \
  --message-action SUPPRESS \
  --region ap-southeast-2

# Add user to admins group
aws cognito-idp admin-add-user-to-group \
  --user-pool-id ap-southeast-2_WCrUlLwIE \
  --username admin@example.com \
  --group-name admins \
  --region ap-southeast-2

# Create field worker user
aws cognito-idp admin-create-user \
  --user-pool-id ap-southeast-2_WCrUlLwIE \
  --username field@example.com \
  --user-attributes Name=email,Value=field@example.com Name=email_verified,Value=true Name=name,Value="Field Worker" Name=custom:role,Value=field_worker \
  --temporary-password TempPass123! \
  --message-action SUPPRESS \
  --region ap-southeast-2

# Add user to field_workers group
aws cognito-idp admin-add-user-to-group \
  --user-pool-id ap-southeast-2_WCrUlLwIE \
  --username field@example.com \
  --group-name field_workers \
  --region ap-southeast-2
```

### Testing Authentication Flow

#### 1. Test Login (AWS CLI)
```bash
aws cognito-idp admin-initiate-auth \
  --user-pool-id ap-southeast-2_WCrUlLwIE \
  --client-id 61p5378jhhm40ud2m92m3kv7jv \
  --auth-flow ADMIN_NO_SRP_AUTH \
  --auth-parameters USERNAME=admin@example.com,PASSWORD=YourNewPassword123! \
  --region ap-southeast-2
```

#### 2. Test Token Refresh
```bash
aws cognito-idp initiate-auth \
  --client-id 61p5378jhhm40ud2m92m3kv7jv \
  --auth-flow REFRESH_TOKEN_AUTH \
  --auth-parameters REFRESH_TOKEN=<your-refresh-token> \
  --region ap-southeast-2
```

#### 3. Verify User Groups
```bash
aws cognito-idp admin-list-groups-for-user \
  --user-pool-id ap-southeast-2_WCrUlLwIE \
  --username admin@example.com \
  --region ap-southeast-2
```

---

## Troubleshooting

### Check Cognito User Pool
```bash
aws cognito-idp describe-user-pool \
  --user-pool-id ap-southeast-2_WCrUlLwIE \
  --region ap-southeast-2
```

### List Users
```bash
aws cognito-idp list-users \
  --user-pool-id ap-southeast-2_WCrUlLwIE \
  --region ap-southeast-2
```

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
**Status**: ✅ Backend infrastructure fully deployed and operational
**Completed**: VPC, RDS, S3, ECR, Cognito, ALB, ECS (Tasks 1.2.1, 1.2.2, 1.2.3)
**Next**: Frontend development (Epic 1, Features 1.3-1.5)
