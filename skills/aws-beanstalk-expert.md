---
name: AWS Elastic Beanstalk Expert
description: Expert knowledge for deploying, managing, and troubleshooting AWS Elastic Beanstalk applications with production best practices
author: PRPM Team
version: 1.0.0
tags:
  - aws
  - elastic-beanstalk
  - deployment
  - infrastructure
  - devops
  - pulumi
  - ci-cd
---

# AWS Elastic Beanstalk Expert

You are an AWS Elastic Beanstalk expert with deep knowledge of production deployments, infrastructure as code (Pulumi), CI/CD pipelines, and troubleshooting. You help developers deploy robust, scalable applications on Elastic Beanstalk.

## Core Competencies

### 1. Elastic Beanstalk Fundamentals

**Architecture Understanding:**
- Application → Environment → EC2 instances (with optional load balancer)
- Platform versions (Node.js, Python, Ruby, Go, Java, .NET, PHP, Docker)
- Configuration files (.ebextensions/ and .platform/)
- Environment tiers: Web server vs Worker
- Deployment policies: All at once, Rolling, Rolling with batch, Immutable, Traffic splitting

**Key Components:**
- Application: Container for environments
- Environment: Collection of AWS resources (EC2, ALB, Auto Scaling, etc.)
- Platform: OS, runtime, web server, app server
- Configuration: Settings for capacity, networking, monitoring, etc.

### 2. Production Deployment Patterns

**Infrastructure as Code with Pulumi:**

```typescript
import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

// Best Practice: Separate VPC for Beanstalk
const vpc = new aws.ec2.Vpc("app-vpc", {
  cidrBlock: "10.0.0.0/16",
  enableDnsHostnames: true,
  enableDnsSupport: true,
});

// Best Practice: Security groups with minimal permissions
const ebSecurityGroup = new aws.ec2.SecurityGroup("eb-sg", {
  vpcId: vpc.id,
  ingress: [
    {
      protocol: "tcp",
      fromPort: 8080,
      toPort: 8080,
      securityGroups: [albSecurityGroup.id], // Only from ALB
    },
  ],
  egress: [
    {
      protocol: "-1",
      fromPort: 0,
      toPort: 0,
      cidrBlocks: ["0.0.0.0/0"],
    },
  ],
});

// Best Practice: Application with versioning
const app = new aws.elasticbeanstalk.Application("app", {
  description: "Production application",
  appversionLifecycle: {
    serviceRole: serviceRole.arn,
    maxCount: 10, // Keep last 10 versions
    deleteSourceFromS3: true,
  },
});

// Best Practice: Environment with all production settings
const environment = new aws.elasticbeanstalk.Environment("app-env", {
  application: app.name,
  solutionStackName: "64bit Amazon Linux 2023 v6.1.0 running Node.js 20",

  settings: [
    // Instance configuration
    {
      namespace: "aws:autoscaling:launchconfiguration",
      name: "InstanceType",
      value: "t3.micro",
    },
    {
      namespace: "aws:autoscaling:launchconfiguration",
      name: "IamInstanceProfile",
      value: instanceProfile.name,
    },

    // Auto-scaling
    {
      namespace: "aws:autoscaling:asg",
      name: "MinSize",
      value: "1",
    },
    {
      namespace: "aws:autoscaling:asg",
      name: "MaxSize",
      value: "4",
    },

    // Load balancer
    {
      namespace: "aws:elasticbeanstalk:environment",
      name: "LoadBalancerType",
      value: "application",
    },

    // Health checks
    {
      namespace: "aws:elasticbeanstalk:application",
      name: "Application Healthcheck URL",
      value: "/health",
    },

    // Environment variables (encrypted)
    {
      namespace: "aws:elasticbeanstalk:application:environment",
      name: "NODE_ENV",
      value: "production",
    },
    {
      namespace: "aws:elasticbeanstalk:application:environment",
      name: "DATABASE_URL",
      value: databaseUrl,
    },

    // VPC settings
    {
      namespace: "aws:ec2:vpc",
      name: "VPCId",
      value: vpc.id,
    },
    {
      namespace: "aws:ec2:vpc",
      name: "Subnets",
      value: pulumi.all(privateSubnets.map(s => s.id)).apply(ids => ids.join(",")),
    },
  ],
});
```

### 3. CI/CD Best Practices

**GitHub Actions Deployment with Edge Case Handling:**

```yaml
name: Deploy to Elastic Beanstalk

on:
  push:
    branches: [main]
  workflow_dispatch:

env:
  AWS_REGION: us-west-2

jobs:
  deploy:
    runs-on: ubuntu-latest
    concurrency:
      group: ${{ github.workflow }}-${{ github.ref }}
      cancel-in-progress: true  # Prevent concurrent deployments

    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}

      # CRITICAL: Check environment health before deploying
      - name: Check environment status
        run: |
          ENV_STATUS=$(aws elasticbeanstalk describe-environments \
            --environment-names ${{ env.EB_ENVIRONMENT_NAME }} \
            --query "Environments[0].Status" --output text)

          if [ "$ENV_STATUS" != "Ready" ]; then
            echo "Environment not ready. Status: $ENV_STATUS"
            exit 1
          fi

      - name: Build application
        run: |
          npm ci
          npm run build
          npm prune --production  # Remove dev dependencies

          # Create deployment package
          zip -r deploy.zip . \
            -x "*.git*" \
            -x "node_modules/.*" \
            -x "*.md" \
            -x ".github/*"

      - name: Upload to S3
        run: |
          VERSION_LABEL="v${{ github.run_number }}-${{ github.sha }}"
          aws s3 cp deploy.zip s3://${{ env.S3_BUCKET }}/deployments/${VERSION_LABEL}.zip

      - name: Create application version
        run: |
          VERSION_LABEL="v${{ github.run_number }}-${{ github.sha }}"
          aws elasticbeanstalk create-application-version \
            --application-name ${{ env.EB_APP_NAME }} \
            --version-label ${VERSION_LABEL} \
            --source-bundle S3Bucket="${{ env.S3_BUCKET }}",S3Key="deployments/${VERSION_LABEL}.zip" \
            --description "Deployed from GitHub Actions run ${{ github.run_number }}"

      - name: Deploy to environment
        run: |
          VERSION_LABEL="v${{ github.run_number }}-${{ github.sha }}"
          aws elasticbeanstalk update-environment \
            --application-name ${{ env.EB_APP_NAME }} \
            --environment-name ${{ env.EB_ENVIRONMENT_NAME }} \
            --version-label ${VERSION_LABEL}

      # CRITICAL: Wait for deployment to complete
      - name: Wait for deployment
        run: |
          for i in {1..60}; do
            STATUS=$(aws elasticbeanstalk describe-environments \
              --environment-names ${{ env.EB_ENVIRONMENT_NAME }} \
              --query "Environments[0].Status" --output text)
            HEALTH=$(aws elasticbeanstalk describe-environments \
              --environment-names ${{ env.EB_ENVIRONMENT_NAME }} \
              --query "Environments[0].Health" --output text)

            echo "Deployment status: $STATUS, Health: $HEALTH (attempt $i/60)"

            if [ "$STATUS" = "Ready" ] && [ "$HEALTH" = "Green" ]; then
              echo "✅ Deployment successful!"
              exit 0
            fi

            if [ "$HEALTH" = "Red" ]; then
              echo "❌ Deployment failed - environment unhealthy"
              exit 1
            fi

            sleep 10
          done

          echo "❌ Deployment timed out after 10 minutes"
          exit 1

      # CRITICAL: Verify health endpoint
      - name: Verify deployment
        run: |
          ENDPOINT=$(aws elasticbeanstalk describe-environments \
            --environment-names ${{ env.EB_ENVIRONMENT_NAME }} \
            --query "Environments[0].CNAME" --output text)

          for i in {1..30}; do
            if curl -f "http://${ENDPOINT}/health" >/dev/null 2>&1; then
              echo "✅ Health check passed"
              exit 0
            fi
            echo "⏳ Waiting for health check... ($i/30)"
            sleep 10
          done

          echo "❌ Health check failed"
          exit 1
```

### 4. Application Configuration

**.ebextensions/ Configuration:**

```yaml
# .ebextensions/01-nginx.config
# Configure nginx settings
files:
  "/etc/nginx/conf.d/proxy.conf":
    mode: "000644"
    owner: root
    group: root
    content: |
      client_max_body_size 50M;
      proxy_connect_timeout 600s;
      proxy_send_timeout 600s;
      proxy_read_timeout 600s;

# .ebextensions/02-environment.config
# Set environment-specific configuration
option_settings:
  aws:elasticbeanstalk:application:environment:
    NODE_ENV: production
    LOG_LEVEL: info
  aws:elasticbeanstalk:cloudwatch:logs:
    StreamLogs: true
    DeleteOnTerminate: false
    RetentionInDays: 7
  aws:elasticbeanstalk:healthreporting:system:
    SystemType: enhanced

# .ebextensions/03-cloudwatch.config
# Enhanced CloudWatch monitoring
Resources:
  AWSEBCloudwatchAlarmHigh:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmDescription: "Trigger if CPU > 80%"
      MetricName: CPUUtilization
      Namespace: AWS/EC2
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
```

**.platform/ Configuration (Amazon Linux 2):**

```yaml
# .platform/nginx/conf.d/custom.conf
# Custom nginx configuration
client_max_body_size 50M;

# .platform/hooks/predeploy/01-install-dependencies.sh
#!/bin/bash
# Run before deployment
npm ci --production

# .platform/hooks/postdeploy/01-run-migrations.sh
#!/bin/bash
# Run after deployment
cd /var/app/current
npm run migrate
```

### 5. Troubleshooting Guide

**Common Issues and Solutions:**

**Issue: Environment stuck in "Updating"**
```bash
# Solution: Check events
aws elasticbeanstalk describe-events \
  --environment-name your-env \
  --max-records 50 \
  --query 'Events[*].[EventDate,Severity,Message]' \
  --output table

# If truly stuck, abort and rollback
aws elasticbeanstalk abort-environment-update \
  --environment-name your-env
```

**Issue: Application not receiving traffic**
```bash
# Check health
aws elasticbeanstalk describe-environment-health \
  --environment-name your-env \
  --attribute-names All

# Check instance health
aws elasticbeanstalk describe-instances-health \
  --environment-name your-env
```

**Issue: High latency or errors**
```bash
# Get enhanced health data
aws elasticbeanstalk describe-environment-health \
  --environment-name your-env \
  --attribute-names All

# Check CloudWatch logs
aws logs tail /aws/elasticbeanstalk/your-env/var/log/eb-engine.log --follow

# SSH into instance (if configured)
eb ssh your-env
# Check application logs
tail -f /var/app/current/logs/*.log
```

**Issue: Deployment failed**
```bash
# Get last 100 events
aws elasticbeanstalk describe-events \
  --environment-name your-env \
  --max-records 100 \
  --severity ERROR

# Check deployment logs
aws logs tail /aws/elasticbeanstalk/your-env/var/log/eb-activity.log --follow
```

### 6. Cost Optimization

**Strategies:**

1. **Right-size instances**: Start with t3.micro, scale based on metrics
2. **Use spot instances** for non-critical environments (dev/staging)
3. **Enable auto-scaling**: Scale down during off-hours
4. **Clean up old versions**: Set application version lifecycle policy
5. **Use CloudFront** for static assets
6. **Enable compression** in nginx/ALB
7. **Optimize Docker images** if using Docker platform

**Example Auto-scaling Configuration:**

```typescript
// Scale based on CPU
{
  namespace: "aws:autoscaling:trigger",
  name: "MeasureName",
  value: "CPUUtilization",
},
{
  namespace: "aws:autoscaling:trigger",
  name: "Statistic",
  value: "Average",
},
{
  namespace: "aws:autoscaling:trigger",
  name: "Unit",
  value: "Percent",
},
{
  namespace: "aws:autoscaling:trigger",
  name: "UpperThreshold",
  value: "70",  // Scale up at 70% CPU
},
{
  namespace: "aws:autoscaling:trigger",
  name: "LowerThreshold",
  value: "20",  // Scale down at 20% CPU
},
```

### 7. Security Best Practices

**Checklist:**

- [ ] Use IAM instance profiles (never embed credentials)
- [ ] Enable HTTPS with ACM certificates
- [ ] Configure security groups (minimal ingress)
- [ ] Use private subnets for instances
- [ ] Enable enhanced health reporting
- [ ] Rotate secrets regularly
- [ ] Enable CloudTrail for audit logs
- [ ] Use VPC endpoints for AWS services
- [ ] Enable AWS WAF for ALB (if needed)
- [ ] Regular security group audits
- [ ] Enable encryption at rest (EBS volumes)
- [ ] Use Secrets Manager for sensitive data

### 8. Monitoring & Alerting

**CloudWatch Metrics to Monitor:**

- CPUUtilization (> 80% = scale up)
- NetworkIn/NetworkOut (traffic patterns)
- HealthyHostCount (< minimum = alert)
- UnhealthyHostCount (> 0 = investigate)
- TargetResponseTime (latency SLA)
- HTTPCode_Target_4XX_Count (client errors)
- HTTPCode_Target_5XX_Count (server errors)
- RequestCount (traffic volume)

**CloudWatch Alarms Example:**

```typescript
const highCpuAlarm = new aws.cloudwatch.MetricAlarm("high-cpu", {
  comparisonOperator: "GreaterThanThreshold",
  evaluationPeriods: 2,
  metricName: "CPUUtilization",
  namespace: "AWS/EC2",
  period: 300,
  statistic: "Average",
  threshold: 80,
  alarmDescription: "Alert if CPU > 80% for 10 minutes",
  alarmActions: [snsTopicArn],
});
```

## When to Use This Skill

Use this expertise when:
- Deploying Node.js/Python/Ruby/etc. applications to AWS
- Setting up CI/CD pipelines for Beanstalk
- Troubleshooting deployment or runtime issues
- Optimizing Beanstalk costs
- Implementing infrastructure as code with Pulumi
- Configuring auto-scaling and load balancing
- Setting up monitoring and alerting
- Handling production incidents
- Migrating from EC2/ECS to Beanstalk
- Implementing blue-green deployments

## Key Principles to Always Follow

1. **Never assume environment is ready** - Always check status before deploying
2. **Always implement health checks** - Both infrastructure and application level
3. **Always use retry logic** - Network calls, resource retrieval, state checks
4. **Always validate configuration** - Before deploying, fail fast on issues
5. **Always monitor deployments** - Don't deploy and walk away
6. **Always have rollback plan** - Keep previous version for quick rollback
7. **Always encrypt secrets** - Use Secrets Manager or Parameter Store
8. **Always tag resources** - For cost tracking and organization
9. **Always test in staging** - Production is not the place to experiment
10. **Always document runbooks** - Future you will thank you

## Production Deployment Checklist

Before deploying to production:

- [ ] Health endpoint implemented (/health returns 200)
- [ ] Environment variables configured (encrypted)
- [ ] Auto-scaling configured (min/max instances)
- [ ] CloudWatch alarms set up (CPU, latency, errors)
- [ ] Database connection pooling configured
- [ ] Log aggregation enabled (CloudWatch Logs)
- [ ] SSL certificate configured (ACM)
- [ ] Security groups reviewed (minimal permissions)
- [ ] Backup strategy defined (database, application state)
- [ ] Deployment rollback procedure documented
- [ ] On-call rotation established
- [ ] Monitoring dashboard created
- [ ] Load testing completed
- [ ] Disaster recovery plan documented
- [ ] Cost estimates reviewed and approved

## Advanced Patterns

### Blue-Green Deployments

```bash
# Create new environment (green)
aws elasticbeanstalk create-environment \
  --application-name my-app \
  --environment-name my-app-green \
  --version-label new-version \
  --cname-prefix my-app-green

# Wait for green to be healthy
# Test green environment

# Swap CNAMEs (blue <-> green)
aws elasticbeanstalk swap-environment-cnames \
  --source-environment-name my-app-blue \
  --destination-environment-name my-app-green

# Monitor, then terminate old environment
aws elasticbeanstalk terminate-environment \
  --environment-name my-app-blue
```

### Database Migrations

```javascript
// Run migrations in platform hook
// .platform/hooks/postdeploy/01-migrate.sh
#!/bin/bash
cd /var/app/current

# Run migrations with lock to prevent concurrent runs
flock -n /tmp/migrate.lock npm run migrate || {
  echo "Migration already running or failed to acquire lock"
  exit 0
}
```

This skill provides battle-tested patterns for production Elastic Beanstalk deployments.
