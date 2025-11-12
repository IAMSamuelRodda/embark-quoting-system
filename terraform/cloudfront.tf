# ===================================================================
# Task 0.2.7: CloudFront Distributions
# ===================================================================
# Creates CloudFront distribution for frontend with S3 origin
# Dependencies: S3 bucket, CloudFront OAI
# ===================================================================

# ===================================================================
# CloudFront Distribution for Frontend
# ===================================================================

resource "aws_cloudfront_distribution" "frontend" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "${var.project_name}-${var.environment} frontend distribution"
  default_root_object = "index.html"
  price_class         = var.cloudfront_price_class

  # Custom domain (optional)
  aliases = var.domain_name != "" ? [var.domain_name] : []

  # S3 origin configuration
  origin {
    domain_name = aws_s3_bucket.frontend.bucket_regional_domain_name
    origin_id   = "S3-${aws_s3_bucket.frontend.id}"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.frontend.cloudfront_access_identity_path
    }
  }

  # Default cache behavior
  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD", "OPTIONS"]
    target_origin_id       = "S3-${aws_s3_bucket.frontend.id}"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    # Managed cache policy: CachingOptimized
    cache_policy_id = "658327ea-f89d-4fab-a63d-7e88639e58f6"

    # Managed origin request policy: CORS-S3Origin
    origin_request_policy_id = "88a5eaf4-2fd4-4709-b370-b4c650ea3fcf"
  }

  # Cache behavior for static assets (longer cache)
  ordered_cache_behavior {
    path_pattern           = "/assets/*"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD", "OPTIONS"]
    target_origin_id       = "S3-${aws_s3_bucket.frontend.id}"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    # Managed cache policy: CachingOptimized (1 year TTL)
    cache_policy_id = "658327ea-f89d-4fab-a63d-7e88639e58f6"

    # Managed origin request policy: CORS-S3Origin
    origin_request_policy_id = "88a5eaf4-2fd4-4709-b370-b4c650ea3fcf"
  }

  # Restrictions
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  # SSL/TLS certificate configuration
  viewer_certificate {
    # Use custom certificate if domain is provided
    acm_certificate_arn      = var.domain_name != "" ? var.acm_certificate_arn : null
    ssl_support_method       = var.domain_name != "" ? "sni-only" : null
    minimum_protocol_version = var.domain_name != "" ? "TLSv1.2_2021" : null

    # Use default CloudFront certificate if no custom domain
    cloudfront_default_certificate = var.domain_name == ""
  }

  # Custom error responses for SPA routing
  custom_error_response {
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 0
  }

  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 0
  }

  # Logging configuration (optional)
  # logging_config {
  #   include_cookies = false
  #   bucket          = aws_s3_bucket.logs.bucket_domain_name
  #   prefix          = "cloudfront/"
  # }

  tags = {
    Name = "${var.project_name}-${var.environment}-frontend-distribution"
  }
}

# ===================================================================
# CloudWatch Alarms for CloudFront Monitoring
# ===================================================================

resource "aws_cloudwatch_metric_alarm" "cloudfront_error_rate" {
  alarm_name          = "${var.project_name}-${var.environment}-cloudfront-error-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "5xxErrorRate"
  namespace           = "AWS/CloudFront"
  period              = 300
  statistic           = "Average"
  threshold           = 5
  alarm_description   = "This metric monitors CloudFront 5xx error rate"
  alarm_actions       = [] # Add SNS topic ARN for notifications

  dimensions = {
    DistributionId = aws_cloudfront_distribution.frontend.id
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-cloudfront-error-alarm"
  }
}

resource "aws_cloudwatch_metric_alarm" "cloudfront_cache_hit_rate" {
  alarm_name          = "${var.project_name}-${var.environment}-cloudfront-cache-hit-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CacheHitRate"
  namespace           = "AWS/CloudFront"
  period              = 300
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "This metric monitors CloudFront cache hit rate"
  alarm_actions       = [] # Add SNS topic ARN for notifications

  dimensions = {
    DistributionId = aws_cloudfront_distribution.frontend.id
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-cloudfront-cache-alarm"
  }
}
