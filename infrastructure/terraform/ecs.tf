# ===================================================================
# Task 0.2.6: ECS Clusters and Services
# ===================================================================
# Creates ECS cluster, task definitions, services, ALB, and auto-scaling
# Dependencies: VPC, Security Groups, ECR, IAM, RDS (for secrets)
# ===================================================================

# ===================================================================
# ECS Cluster
# ===================================================================

resource "aws_ecs_cluster" "main" {
  name = "${var.project_name}-${var.environment}-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-cluster"
  }
}

resource "aws_ecs_cluster_capacity_providers" "main" {
  cluster_name = aws_ecs_cluster.main.name

  capacity_providers = ["FARGATE", "FARGATE_SPOT"]

  default_capacity_provider_strategy {
    base              = 1
    weight            = 100
    capacity_provider = "FARGATE"
  }
}

# ===================================================================
# CloudWatch Log Group for ECS Container Logs
# ===================================================================

resource "aws_cloudwatch_log_group" "ecs" {
  name              = "/ecs/${var.project_name}-${var.environment}-backend"
  retention_in_days = var.environment == "production" ? 30 : 7

  tags = {
    Name = "${var.project_name}-${var.environment}-ecs-logs"
  }
}

# ===================================================================
# ECS Task Definition
# ===================================================================

resource "aws_ecs_task_definition" "backend" {
  family                   = "${var.project_name}-${var.environment}-backend"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = var.ecs_task_cpu
  memory                   = var.ecs_task_memory
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name      = "backend"
      image     = "${aws_ecr_repository.backend.repository_url}:latest"
      essential = true

      portMappings = [
        {
          containerPort = 3000
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "NODE_ENV"
          value = var.environment
        },
        {
          name  = "PORT"
          value = "3000"
        },
        {
          name  = "AWS_REGION"
          value = var.aws_region
        }
      ]

      secrets = [
        {
          name      = "DATABASE_URL"
          valueFrom = "${aws_secretsmanager_secret.db_credentials.arn}:host::"
        },
        {
          name      = "DATABASE_NAME"
          valueFrom = "${aws_secretsmanager_secret.db_credentials.arn}:dbname::"
        },
        {
          name      = "DATABASE_USER"
          valueFrom = "${aws_secretsmanager_secret.db_credentials.arn}:username::"
        },
        {
          name      = "DATABASE_PASSWORD"
          valueFrom = "${aws_secretsmanager_secret.db_credentials.arn}:password::"
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.ecs.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "backend"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "node -e \"require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})\""]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])

  tags = {
    Name = "${var.project_name}-${var.environment}-backend"
  }
}

# ===================================================================
# Application Load Balancer (Optional - costs ~$25/month)
# ===================================================================
# Set enable_alb=false for minimal cost POC (tasks get public IPs instead)

resource "aws_lb" "main" {
  count              = var.enable_alb ? 1 : 0
  name               = "${var.project_name}-${var.environment}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = var.environment == "production"
  enable_http2               = true
  enable_cross_zone_load_balancing = true

  tags = {
    Name = "${var.project_name}-${var.environment}-alb"
  }
}

# Target Group for ECS Service
resource "aws_lb_target_group" "backend" {
  count       = var.enable_alb ? 1 : 0
  name        = "eq-${var.environment}-backend-tg"  # Shortened to fit 32 char limit
  port        = 3000
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    path                = "/health"
    matcher             = "200"
  }

  deregistration_delay = 30

  tags = {
    Name = "${var.project_name}-${var.environment}-backend-tg"
  }
}

# HTTP Listener (only if ALB enabled)
resource "aws_lb_listener" "http" {
  count             = var.enable_alb ? 1 : 0
  load_balancer_arn = aws_lb.main[0].arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.backend[0].arn
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-http-listener"
  }
}

# HTTPS Listener (optional, requires ACM certificate)
# resource "aws_lb_listener" "https" {
#   load_balancer_arn = aws_lb.main.arn
#   port              = 443
#   protocol          = "HTTPS"
#   ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
#   certificate_arn   = var.acm_certificate_arn
#
#   default_action {
#     type             = "forward"
#     target_group_arn = aws_lb_target_group.backend.arn
#   }
# }

# ===================================================================
# ECS Service
# ===================================================================

resource "aws_ecs_service" "backend" {
  name            = "${var.project_name}-${var.environment}-backend-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.backend.arn
  desired_count   = var.ecs_desired_count
  launch_type     = "FARGATE"

  network_configuration {
    # Use public subnets when ALB is disabled (tasks need direct internet access)
    # Use private subnets when ALB is enabled (ALB handles internet access)
    subnets          = var.enable_alb && length(var.private_subnet_cidrs) > 0 ? aws_subnet.private[*].id : aws_subnet.public[*].id
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = var.ecs_assign_public_ip
  }

  # Only attach to load balancer if ALB is enabled
  dynamic "load_balancer" {
    for_each = var.enable_alb ? [1] : []
    content {
      target_group_arn = aws_lb_target_group.backend[0].arn
      container_name   = "backend"
      container_port   = 3000
    }
  }

  # Only set grace period if using ALB
  health_check_grace_period_seconds = var.enable_alb ? 60 : null

  # Note: deployment_configuration not supported in this AWS provider version
  # Will use default rolling deployment strategy

  tags = {
    Name = "${var.project_name}-${var.environment}-backend-service"
  }

  # Note: depends_on removed because it doesn't support conditionals
  # Service will wait for load_balancer block resources automatically
}

# ===================================================================
# Auto-Scaling
# ===================================================================

resource "aws_appautoscaling_target" "ecs" {
  max_capacity       = var.ecs_autoscaling_max
  min_capacity       = var.ecs_autoscaling_min
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.backend.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

# Auto-scaling policy based on CPU utilization
resource "aws_appautoscaling_policy" "ecs_cpu" {
  name               = "${var.project_name}-${var.environment}-ecs-cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = var.ecs_cpu_threshold
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

# Auto-scaling policy based on memory utilization
resource "aws_appautoscaling_policy" "ecs_memory" {
  name               = "${var.project_name}-${var.environment}-ecs-memory-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }
    target_value       = var.ecs_memory_threshold
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

# ===================================================================
# CloudWatch Alarms for ECS Monitoring
# ===================================================================

resource "aws_cloudwatch_metric_alarm" "ecs_cpu" {
  alarm_name          = "${var.project_name}-${var.environment}-ecs-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "This metric monitors ECS CPU utilization"
  alarm_actions       = [] # Add SNS topic ARN for notifications

  dimensions = {
    ClusterName = aws_ecs_cluster.main.name
    ServiceName = aws_ecs_service.backend.name
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-ecs-cpu-alarm"
  }
}

resource "aws_cloudwatch_metric_alarm" "alb_target_health" {
  count               = var.enable_alb ? 1 : 0
  alarm_name          = "${var.project_name}-${var.environment}-alb-unhealthy-targets"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 1
  metric_name         = "HealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Average"
  threshold           = 1
  alarm_description   = "This metric monitors ALB healthy target count"
  alarm_actions       = [] # Add SNS topic ARN for notifications

  dimensions = {
    TargetGroup  = aws_lb_target_group.backend[0].arn_suffix
    LoadBalancer = aws_lb.main[0].arn_suffix
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-alb-health-alarm"
  }
}
