# Terraform Infrastructure for Embark Quoting System

This directory contains the complete Terraform configuration for deploying the Embark Quoting System to AWS. The infrastructure supports both **staging** and **production** environments with separate resources.

## 📋 Table of Contents

- [Architecture Overview](#architecture-overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Detailed Deployment](#detailed-deployment)
- [Managing Environments](#managing-environments)
- [Troubleshooting](#troubleshooting)
- [Cost Estimates](#cost-estimates)
- [Maintenance](#maintenance)

---

## 🏗️ Architecture Overview

This Terraform configuration creates the following AWS resources:

### Networking (Task 0.2.1)
- **VPC** with public and private subnets across 2 availability zones
- **Internet Gateway** for public subnet internet access
- **NAT Gateway** for private subnet outbound traffic
- **Route Tables** for public and private subnets
- **VPC Flow Logs** for network monitoring

### Security & IAM (Task 0.2.2)
- **GitHub OIDC Provider** for secure CI/CD authentication
- **IAM Roles** for GitHub Actions, ECS tasks, and RDS monitoring
- **Security Groups** for ALB, ECS, RDS, and VPC endpoints

### Container Registry (Task 0.2.3)
- **ECR Repository** for Docker images with lifecycle policies

### Database (Task 0.2.4)
- **RDS PostgreSQL 15** instances (staging: db.t4g.micro, production: db.t4g.small)
- **Secrets Manager** for database credentials
- **CloudWatch Alarms** for CPU, storage, and connection monitoring

### Storage & Auth (Task 0.2.5)
- **S3 Buckets** for frontend static hosting with versioning and encryption
- **Cognito User Pool** with admin and field_worker groups
- **Cognito App Client** configured for offline-first PWA

### Compute (Task 0.2.6)
- **ECS Fargate Cluster** with Container Insights enabled
- **Application Load Balancer** with health checks
- **ECS Service** with auto-scaling (CPU and memory targets)
- **CloudWatch Log Groups** for container logs

### Content Delivery (Task 0.2.7)
- **CloudFront Distribution** for global frontend delivery
- **Origin Access Identity** for secure S3 access
- **Custom error responses** for SPA routing

---

## ✅ Prerequisites

### 1. Install Required Tools

```bash
# Terraform (>= 1.0)
wget https://releases.hashicorp.com/terraform/1.6.6/terraform_1.6.6_linux_amd64.zip
unzip terraform_1.6.6_linux_amd64.zip
sudo mv terraform /usr/local/bin/

# AWS CLI (>= 2.0)
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Verify installations
terraform --version
aws --version
```

### 2. Configure AWS Credentials

```bash
# Configure AWS CLI with your credentials
aws configure

# Enter your credentials:
# AWS Access Key ID: [your-access-key]
# AWS Secret Access Key: [your-secret-key]
# Default region name: ap-southeast-2
# Default output format: json

# Verify authentication
aws sts get-caller-identity
```

### 3. Create S3 Backend for Terraform State (Optional but Recommended)

```bash
# Create S3 bucket for Terraform state
aws s3api create-bucket \
  --bucket embark-terraform-state \
  --region ap-southeast-2 \
  --create-bucket-configuration LocationConstraint=ap-southeast-2

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket embark-terraform-state \
  --versioning-configuration Status=Enabled

# Enable encryption
aws s3api put-bucket-encryption \
  --bucket embark-terraform-state \
  --server-side-encryption-configuration '{
    "Rules": [{"ApplyServerSideEncryptionByDefault": {"SSEAlgorithm": "AES256"}}]
  }'

# Create DynamoDB table for state locking
aws dynamodb create-table \
  --table-name embark-terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --provisioned-throughput ReadCapacityUnits=1,WriteCapacityUnits=1 \
  --region ap-southeast-2

# Uncomment the backend block in main.tf after creating these resources
```

---

## 🚀 Quick Start

### Deploy Staging Environment

```bash
cd infrastructure/terraform

# Initialize Terraform (download providers)
terraform init

# Review the plan
terraform plan -var-file="staging.tfvars" -var="db_password=YourSecurePassword123!"

# Deploy
terraform apply -var-file="staging.tfvars" -var="db_password=YourSecurePassword123!"

# View outputs (GitHub secrets configuration)
terraform output setup_summary
```

### Deploy Production Environment

```bash
# Review production plan
terraform plan -var-file="production.tfvars" -var="db_password=YourSecurePassword456!"

# Deploy to production
terraform apply -var-file="production.tfvars" -var="db_password=YourSecurePassword456!"

# View outputs
terraform output setup_summary
```

---

## 📖 Detailed Deployment

### Step 1: Initialize Terraform

```bash
cd infrastructure/terraform
terraform init
```

This will:
- Download the AWS provider plugin (~150 MB)
- Initialize the backend (local or S3)
- Create `.terraform/` directory

### Step 2: Validate Configuration

```bash
# Check syntax
terraform validate

# Format files
terraform fmt -recursive

# Review what will be created
terraform plan -var-file="staging.tfvars" -var="db_password=YourPassword"
```

### Step 3: Deploy Infrastructure

```bash
# Deploy with explicit variable file
terraform apply \
  -var-file="staging.tfvars" \
  -var="db_password=YourSecurePassword123!"

# Or use environment variables (more secure)
export TF_VAR_db_password="YourSecurePassword123!"
terraform apply -var-file="staging.tfvars"
```

**Deployment Time**: ~15-20 minutes (NAT Gateway, RDS, and CloudFront take longest)

### Step 4: View Outputs

```bash
# View all outputs
terraform output

# View specific output
terraform output alb_url
terraform output cloudfront_url
terraform output github_actions_role_arn

# View formatted setup summary
terraform output setup_summary
```

### Step 5: Configure GitHub Secrets

After deployment, add the output values to GitHub Secrets:

1. Navigate to: `https://github.com/IAMSamuelRodda/embark-quoting-system/settings/secrets/actions`

2. Add the following secrets (get values from `terraform output`):

   **AWS Configuration:**
   - `AWS_ROLE_TO_ASSUME`: IAM role ARN for GitHub Actions

   **Staging Environment:**
   - `STAGING_ECS_CLUSTER`: ECS cluster name
   - `STAGING_ECS_SERVICE`: ECS service name
   - `STAGING_ECR_REPOSITORY`: ECR repository URL
   - `STAGING_API_URL`: ALB DNS name
   - `STAGING_S3_BUCKET`: S3 bucket name
   - `STAGING_CLOUDFRONT_ID`: CloudFront distribution ID
   - `STAGING_FRONTEND_URL`: CloudFront domain name
   - `STAGING_COGNITO_USER_POOL_ID`: Cognito user pool ID
   - `STAGING_COGNITO_CLIENT_ID`: Cognito app client ID

   **Production Environment:**
   - Same as staging but with `PROD_` prefix

3. Configure GitHub Environments:
   - Create `staging` environment (no protection)
   - Create `production` environment (enable required reviewers)

---

## 🔄 Managing Environments

### Switching Between Environments

```bash
# Work with staging
terraform workspace select default  # or create staging workspace
terraform plan -var-file="staging.tfvars"

# Work with production
terraform workspace select production  # or create production workspace
terraform plan -var-file="production.tfvars"
```

**Recommendation**: Use separate state files for staging and production:

```bash
# Staging deployment
terraform init -backend-config="key=staging/terraform.tfstate"
terraform apply -var-file="staging.tfvars"

# Production deployment
terraform init -backend-config="key=production/terraform.tfstate"
terraform apply -var-file="production.tfvars"
```

### Updating Infrastructure

```bash
# Pull latest Terraform code
git pull

# Review changes
terraform plan -var-file="staging.tfvars"

# Apply updates
terraform apply -var-file="staging.tfvars"
```

### Destroying Resources

**⚠️ WARNING**: This will permanently delete all resources and data.

```bash
# Staging (safe to destroy)
terraform destroy -var-file="staging.tfvars" -var="db_password=YourPassword"

# Production (requires confirmation)
terraform destroy -var-file="production.tfvars" -var="db_password=YourPassword"
```

**Before destroying production:**
1. Create RDS snapshot manually
2. Backup S3 bucket contents
3. Export Cognito users
4. Download CloudWatch logs

---

## 🐛 Troubleshooting

### Error: "Invalid credentials"

```bash
# Verify AWS credentials
aws sts get-caller-identity

# Reconfigure if needed
aws configure
```

### Error: "Resource already exists"

This means a resource was created outside Terraform. Options:

```bash
# Import existing resource
terraform import aws_cognito_user_pool.main us-east-1_ABC123

# Or remove conflicting resource manually
aws cognito-idp delete-user-pool --user-pool-id us-east-1_ABC123
```

### Error: "NAT Gateway creation timeout"

NAT Gateways can take 5-10 minutes. If it times out:

```bash
# Check AWS Console to see if it's still creating
# If stuck, delete and retry:
terraform destroy -target=aws_nat_gateway.main
terraform apply -var-file="staging.tfvars"
```

### Error: "RDS instance already exists"

RDS instance names are global per region. If redeploying:

```bash
# Check for existing instances
aws rds describe-db-instances --region ap-southeast-2

# Delete if needed (creates final snapshot)
aws rds delete-db-instance \
  --db-instance-identifier embark-quoting-staging-db \
  --final-db-snapshot-identifier embark-quoting-staging-final-snapshot
```

### Error: "CloudFront distribution creation failed"

CloudFront can take 15-20 minutes. Check status:

```bash
# List distributions
aws cloudfront list-distributions

# Get specific distribution status
aws cloudfront get-distribution --id E1234567890ABC
```

### Terraform State Issues

```bash
# Refresh state from AWS
terraform refresh -var-file="staging.tfvars"

# Force unlock if state is locked
terraform force-unlock <lock-id>

# Pull state file (if using S3 backend)
aws s3 cp s3://embark-terraform-state/infrastructure/terraform.tfstate ./terraform.tfstate.backup
```

---

## 💰 Cost Estimates

### Staging Environment (Monthly)

| Service | Configuration | Cost (AUD) |
|---------|--------------|------------|
| RDS PostgreSQL | db.t4g.micro (20 GB) | $20 |
| ECS Fargate | 0.25 vCPU, 0.5 GB (1 task) | $15 |
| Application Load Balancer | 1 ALB | $25 |
| NAT Gateway | 1 NAT Gateway + data transfer | $50 |
| S3 | 1 GB storage + requests | $1 |
| CloudFront | 10 GB data transfer | $2 |
| Cognito | < 50,000 MAUs | Free |
| ECR | 1 GB storage | $0.13 |
| **Total** | | **~$113/month** |

### Production Environment (Monthly)

| Service | Configuration | Cost (AUD) |
|---------|--------------|------------|
| RDS PostgreSQL | db.t4g.small (100 GB, Multi-AZ) | $120 |
| ECS Fargate | 0.5 vCPU, 1 GB (2-10 tasks avg 4) | $120 |
| Application Load Balancer | 1 ALB | $25 |
| NAT Gateway | 1 NAT Gateway + data transfer | $80 |
| S3 | 5 GB storage + requests | $3 |
| CloudFront | 100 GB data transfer | $15 |
| Cognito | < 50,000 MAUs | Free |
| ECR | 5 GB storage | $0.65 |
| **Total** | | **~$363/month** |

**Notes:**
- Prices in AUD (Sydney region rates)
- Data transfer costs vary based on usage
- CloudWatch logs and alarms add ~$5/month
- Free tier eligible for first 12 months (reduces RDS and ECS costs by ~40%)

---

## 🔧 Maintenance

### Regular Tasks

**Weekly:**
- Review CloudWatch alarms
- Check RDS storage usage
- Monitor ECS task failures

**Monthly:**
- Review AWS cost reports
- Update Terraform to latest version
- Check for AWS service updates

**Quarterly:**
- Rotate database passwords
- Review security group rules
- Update RDS to latest minor version

### Updating Terraform

```bash
# Check current version
terraform version

# Download latest version
wget https://releases.hashicorp.com/terraform/1.7.0/terraform_1.7.0_linux_amd64.zip

# Update
unzip terraform_1.7.0_linux_amd64.zip
sudo mv terraform /usr/local/bin/

# Re-initialize
terraform init -upgrade
```

### Scaling Resources

**Increase ECS Tasks:**

Edit `staging.tfvars` or `production.tfvars`:

```hcl
ecs_desired_count    = 4   # Increase from 2
ecs_autoscaling_max  = 20  # Increase max
```

**Upgrade RDS Instance:**

```hcl
db_instance_class = "db.t4g.medium"  # Upgrade from small
```

**Apply changes:**

```bash
terraform apply -var-file="production.tfvars"
```

### Backup and Disaster Recovery

**RDS Backups:**
- Automated daily backups (7-day retention for production)
- Manual snapshots before major changes

**S3 Versioning:**
- Enabled for frontend bucket (production)
- Restore previous versions if needed

**Terraform State:**
- Stored in S3 with versioning enabled
- Can restore previous infrastructure state

---

## 📚 Additional Resources

- [Terraform AWS Provider Documentation](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [AWS ECS Best Practices](https://docs.aws.amazon.com/AmazonECS/latest/bestpracticesguide/)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)
- [Project DevOps Setup Guide](./DEVOPS_SETUP.md)

---

## 🤝 Contributing

When modifying infrastructure:

1. Create a feature branch
2. Make changes and test in staging
3. Run `terraform fmt` and `terraform validate`
4. Create PR with plan output
5. Apply to production after approval

---

## 📝 File Structure

```
infrastructure/terraform/
├── main.tf                  # Provider and backend configuration
├── variables.tf             # Variable definitions
├── outputs.tf               # Output values for GitHub Secrets
├── vpc.tf                   # VPC, subnets, NAT Gateway (Task 0.2.1)
├── iam.tf                   # IAM roles and OIDC (Task 0.2.2)
├── ecr-security.tf          # ECR and security groups (Task 0.2.3)
├── rds.tf                   # RDS PostgreSQL (Task 0.2.4)
├── s3-cognito.tf            # S3 and Cognito (Task 0.2.5)
├── ecs.tf                   # ECS cluster and services (Task 0.2.6)
├── cloudfront.tf            # CloudFront distribution (Task 0.2.7)
├── staging.tfvars           # Staging environment variables
├── production.tfvars        # Production environment variables
├── example.tfvars           # Example configuration
├── .gitignore               # Terraform-specific gitignore
└── README.md                # This file
```

---

## 📞 Support

For issues with this infrastructure:

1. Check [Troubleshooting](#troubleshooting) section
2. Review [GitHub Issues](https://github.com/IAMSamuelRodda/embark-quoting-system/issues)
3. Consult [AWS Documentation](https://docs.aws.amazon.com/)

---

**Generated**: 2025-11-04
**Terraform Version**: >= 1.0
**AWS Provider Version**: ~> 5.0
**Region**: ap-southeast-2 (Sydney, Australia)
