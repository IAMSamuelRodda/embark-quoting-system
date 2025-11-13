#!/bin/bash
# ===================================================================
# Infrastructure Startup Script
# ===================================================================
# Starts staging infrastructure after shutdown
# Run this at start of workday
# ===================================================================

set -e

REGION="ap-southeast-2"
CLUSTER_NAME="embark-quoting-staging-cluster"
SERVICE_NAME="embark-quoting-staging-backend-service"
DB_INSTANCE="embark-quoting-staging-db"

echo "🚀 Starting staging infrastructure..."

# Start RDS database
echo "Starting RDS instance..."
aws rds start-db-instance \
  --db-instance-identifier "$DB_INSTANCE" \
  --region "$REGION"

echo "⏳ Waiting for RDS to become available (2-3 minutes)..."
aws rds wait db-instance-available \
  --db-instance-identifier "$DB_INSTANCE" \
  --region "$REGION"

echo "✅ RDS instance available"

# Start ECS tasks
echo "Starting ECS service..."
aws ecs update-service \
  --cluster "$CLUSTER_NAME" \
  --service "$SERVICE_NAME" \
  --desired-count 1 \
  --region "$REGION"

echo "⏳ Waiting for ECS tasks to start (1-2 minutes)..."
sleep 30

# Get ECS task public IP
TASK_ARN=$(aws ecs list-tasks \
  --cluster "$CLUSTER_NAME" \
  --service-name "$SERVICE_NAME" \
  --region "$REGION" \
  --query 'taskArns[0]' \
  --output text)

if [ "$TASK_ARN" != "None" ]; then
  ENI_ID=$(aws ecs describe-tasks \
    --cluster "$CLUSTER_NAME" \
    --tasks "$TASK_ARN" \
    --region "$REGION" \
    --query 'tasks[0].attachments[0].details[?name==`networkInterfaceId`].value' \
    --output text)

  PUBLIC_IP=$(aws ec2 describe-network-interfaces \
    --network-interface-ids "$ENI_ID" \
    --region "$REGION" \
    --query 'NetworkInterfaces[0].Association.PublicIp' \
    --output text)

  echo "✅ ECS task running"
  echo ""
  echo "📡 Backend API: http://$PUBLIC_IP:3000"
  echo "🌐 Frontend: Check CloudFront distribution"
else
  echo "⚠️  No tasks running yet - check ECS console"
fi

echo ""
echo "✅ Infrastructure startup complete!"
