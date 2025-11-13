#!/bin/bash
# ===================================================================
# Infrastructure Shutdown Script
# ===================================================================
# Stops staging infrastructure to save costs during inactive periods
# Run this at end of workday, restart with infra-startup.sh
# ===================================================================

set -e

REGION="ap-southeast-2"
CLUSTER_NAME="embark-quoting-staging-cluster"
SERVICE_NAME="embark-quoting-staging-backend-service"
DB_INSTANCE="embark-quoting-staging-db"

echo "🛑 Shutting down staging infrastructure..."

# Stop ECS tasks (saves Fargate costs)
echo "Stopping ECS service..."
aws ecs update-service \
  --cluster "$CLUSTER_NAME" \
  --service "$SERVICE_NAME" \
  --desired-count 0 \
  --region "$REGION"

echo "✅ ECS tasks stopped (desired count: 0)"

# Stop RDS database (saves RDS costs)
echo "Stopping RDS instance..."
aws rds stop-db-instance \
  --db-instance-identifier "$DB_INSTANCE" \
  --region "$REGION"

echo "✅ RDS instance stopping (will auto-start after 7 days)"

echo ""
echo "💰 Cost Savings Estimate:"
echo "  - ECS Fargate: ~$0.50/day saved"
echo "  - RDS db.t4g.micro: ~$0.30/day saved"
echo "  - Total daily savings: ~$0.80/day"
echo ""
echo "ℹ️  To restart infrastructure: ./scripts/infra-startup.sh"
echo "⚠️  RDS will auto-start after 7 days of inactivity"
