# Archived Workflows

This directory contains GitHub Actions workflows that were archived due to infrastructure changes.

## Why These Were Archived

**Date**: November 14, 2025
**Reason**: Infrastructure migrated from ECS/Fargate to EC2 for cost optimization

### Archived Workflows

#### 1. `sync-terraform-secrets.yml`
- **Issue**: References incorrect path (`./infrastructure/terraform` instead of `./terraform`)
- **Issue**: Attempts to sync ECS-specific outputs that no longer exist in Terraform state
- **Status**: Needs complete rewrite for EC2 architecture before reactivation

#### 2. `deploy-staging.yml`
- **Issue**: Configured for ECS/Fargate deployment (cluster, service, task definitions)
- **Issue**: References `embark-quoting-staging-cluster` and `embark-quoting-staging-backend-service` which no longer exist
- **Status**: Being rewritten for EC2 deployment with SSH-based deployment strategy

#### 3. `deploy-prod.yml`
- **Issue**: Configured for ECS/Fargate deployment
- **Issue**: References production ECS infrastructure that doesn't exist yet
- **Status**: Will be rewritten after staging deployment workflow is proven

## Infrastructure Migration Context

The project migrated from **ECS/Fargate** to **EC2** to reduce costs while in AWS Free Tier:

**Before (ECS)**:
- ECS Cluster + Fargate tasks
- Application Load Balancer
- RDS PostgreSQL
- **Cost**: ~$50-75/month

**After (EC2)**:
- Single EC2 t3.micro instance running:
  - Backend (Node.js/Express)
  - PostgreSQL database
  - Nginx reverse proxy
- CloudFront + S3 (frontend, unchanged)
- **Cost**: ~$5-7/month (Free Tier eligible)

## Restoration Process

To restore these workflows:

1. Review the new EC2-based deployment workflows
2. Extract any valuable patterns or configurations
3. Do NOT simply re-enable these files - they reference infrastructure that no longer exists

## References

- Migration docs: `docs/reference/cost-optimization/RDS_TO_EC2_MIGRATION_PLAN.md`
- Terraform config: `terraform/ec2-consolidated.tf`
- Current instance: `54.253.178.187` (from Terraform output)
