# AWS Deployment Guide for PRMP Registry

Complete guide to deploy the PRMP Registry on AWS.

## Architecture

```
Internet
    │
    ├─→ CloudFront (CDN) → S3 (package files)
    │
    └─→ ALB (Load Balancer)
           │
           └─→ ECS Fargate (API containers)
                  │
                  ├─→ RDS PostgreSQL (database)
                  ├─→ ElastiCache Redis (cache)
                  └─→ OpenSearch (search - optional)
```

## Cost Estimate

### Phase 1 (Launch - PostgreSQL search)
- **Monthly**: ~$70/mo
- ECS Fargate: $18/mo
- RDS PostgreSQL: $15/mo
- ElastiCache Redis: $11/mo
- ALB: $16/mo
- S3 + CloudFront: $5/mo
- Other (Secrets, CloudWatch): $7/mo

### Phase 2 (10k+ packages - OpenSearch)
- **Monthly**: ~$94/mo
- Above + OpenSearch: $24/mo

## Prerequisites

- AWS Account
- AWS CLI configured
- Docker installed
- Domain name (e.g., promptpm.dev)

## Step-by-Step Deployment

### 1. Set Up Infrastructure

#### Create VPC (if needed)
```bash
aws ec2 create-vpc \
  --cidr-block 10.0.0.0/16 \
  --tag-specifications 'ResourceType=vpc,Tags=[{Key=Name,Value=prmp-vpc}]'

# Create public subnets (for ALB)
aws ec2 create-subnet \
  --vpc-id vpc-xxxxx \
  --cidr-block 10.0.1.0/24 \
  --availability-zone us-east-1a

aws ec2 create-subnet \
  --vpc-id vpc-xxxxx \
  --cidr-block 10.0.2.0/24 \
  --availability-zone us-east-1b

# Create private subnets (for ECS, RDS, Redis)
aws ec2 create-subnet \
  --vpc-id vpc-xxxxx \
  --cidr-block 10.0.10.0/24 \
  --availability-zone us-east-1a

aws ec2 create-subnet \
  --vpc-id vpc-xxxxx \
  --cidr-block 10.0.11.0/24 \
  --availability-zone us-east-1b
```

#### Create Security Groups
```bash
# ALB security group
aws ec2 create-security-group \
  --group-name prmp-alb-sg \
  --description "Security group for PRMP ALB" \
  --vpc-id vpc-xxxxx

aws ec2 authorize-security-group-ingress \
  --group-id sg-alb-xxxxx \
  --protocol tcp \
  --port 443 \
  --cidr 0.0.0.0/0

# ECS security group
aws ec2 create-security-group \
  --group-name prmp-ecs-sg \
  --description "Security group for PRMP ECS" \
  --vpc-id vpc-xxxxx

aws ec2 authorize-security-group-ingress \
  --group-id sg-ecs-xxxxx \
  --protocol tcp \
  --port 3000 \
  --source-group sg-alb-xxxxx

# RDS security group
aws ec2 create-security-group \
  --group-name prmp-rds-sg \
  --description "Security group for PRMP RDS" \
  --vpc-id vpc-xxxxx

aws ec2 authorize-security-group-ingress \
  --group-id sg-rds-xxxxx \
  --protocol tcp \
  --port 5432 \
  --source-group sg-ecs-xxxxx
```

### 2. Set Up Databases

#### RDS PostgreSQL
```bash
# Create DB subnet group
aws rds create-db-subnet-group \
  --db-subnet-group-name prmp-db-subnet \
  --db-subnet-group-description "PRMP DB subnet group" \
  --subnet-ids subnet-xxxxx subnet-yyyyy

# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier prmp-db \
  --db-instance-class db.t4g.micro \
  --engine postgres \
  --engine-version 15.5 \
  --master-username prmp \
  --master-user-password "YOUR_SECURE_PASSWORD" \
  --allocated-storage 20 \
  --db-subnet-group-name prmp-db-subnet \
  --vpc-security-group-ids sg-rds-xxxxx \
  --backup-retention-period 7 \
  --preferred-backup-window "03:00-04:00" \
  --preferred-maintenance-window "mon:04:00-mon:05:00" \
  --auto-minor-version-upgrade \
  --publicly-accessible false \
  --storage-encrypted \
  --enable-cloudwatch-logs-exports '["postgresql"]'

# Wait for instance to be available
aws rds wait db-instance-available --db-instance-identifier prmp-db

# Get endpoint
aws rds describe-db-instances \
  --db-instance-identifier prmp-db \
  --query 'DBInstances[0].Endpoint.Address'
```

#### ElastiCache Redis
```bash
# Create cache subnet group
aws elasticache create-cache-subnet-group \
  --cache-subnet-group-name prmp-cache-subnet \
  --cache-subnet-group-description "PRMP cache subnet group" \
  --subnet-ids subnet-xxxxx subnet-yyyyy

# Create Redis cluster
aws elasticache create-cache-cluster \
  --cache-cluster-id prmp-redis \
  --cache-node-type cache.t4g.micro \
  --engine redis \
  --engine-version 7.0 \
  --num-cache-nodes 1 \
  --cache-subnet-group-name prmp-cache-subnet \
  --security-group-ids sg-redis-xxxxx \
  --preferred-maintenance-window "mon:05:00-mon:06:00" \
  --snapshot-retention-limit 5 \
  --snapshot-window "03:00-05:00"

# Get endpoint
aws elasticache describe-cache-clusters \
  --cache-cluster-id prmp-redis \
  --show-cache-node-info \
  --query 'CacheClusters[0].CacheNodes[0].Endpoint.Address'
```

### 3. Set Up S3 for Package Storage

```bash
# Create S3 bucket
aws s3 mb s3://prmp-packages --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket prmp-packages \
  --versioning-configuration Status=Enabled

# Block public access (we'll use CloudFront)
aws s3api put-public-access-block \
  --bucket prmp-packages \
  --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

# Enable server-side encryption
aws s3api put-bucket-encryption \
  --bucket prmp-packages \
  --server-side-encryption-configuration '{
    "Rules": [{
      "ApplyServerSideEncryptionByDefault": {
        "SSEAlgorithm": "AES256"
      }
    }]
  }'

# Create lifecycle policy (delete old versions after 90 days)
aws s3api put-bucket-lifecycle-configuration \
  --bucket prmp-packages \
  --lifecycle-configuration file://s3-lifecycle.json
```

### 4. Store Secrets in AWS Secrets Manager

```bash
# Database credentials
aws secretsmanager create-secret \
  --name prmp/database \
  --secret-string '{
    "username": "prmp",
    "password": "YOUR_SECURE_PASSWORD",
    "host": "prmp-db.xxxxx.us-east-1.rds.amazonaws.com",
    "port": "5432",
    "database": "prmp_registry"
  }'

# JWT secret
aws secretsmanager create-secret \
  --name prmp/jwt-secret \
  --secret-string "$(openssl rand -base64 32)"

# GitHub OAuth
aws secretsmanager create-secret \
  --name prmp/github-oauth \
  --secret-string '{
    "client_id": "your_github_client_id",
    "client_secret": "your_github_client_secret"
  }'

# Redis URL
aws secretsmanager create-secret \
  --name prmp/redis \
  --secret-string '{
    "url": "redis://prmp-redis.xxxxx.cache.amazonaws.com:6379"
  }'
```

### 5. Set Up ECR (Container Registry)

```bash
# Create ECR repository
aws ecr create-repository \
  --repository-name prmp-registry \
  --image-scanning-configuration scanOnPush=true \
  --encryption-configuration encryptionType=AES256

# Get login token
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  123456789012.dkr.ecr.us-east-1.amazonaws.com

# Build and push image
cd registry
docker build -t prmp-registry:latest .

docker tag prmp-registry:latest \
  123456789012.dkr.ecr.us-east-1.amazonaws.com/prmp-registry:latest

docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/prmp-registry:latest
```

### 6. Create IAM Role for ECS Tasks

```bash
# Create task execution role (for pulling images, writing logs)
aws iam create-role \
  --role-name prmpEcsTaskExecutionRole \
  --assume-role-policy-document file://ecs-task-execution-role.json

aws iam attach-role-policy \
  --role-name prmpEcsTaskExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy

# Create task role (for accessing AWS services)
aws iam create-role \
  --role-name prmpEcsTaskRole \
  --assume-role-policy-document file://ecs-task-role.json

# Attach policies for S3, Secrets Manager, OpenSearch
aws iam put-role-policy \
  --role-name prmpEcsTaskRole \
  --policy-name prmp-s3-access \
  --policy-document file://s3-policy.json

aws iam put-role-policy \
  --role-name prmpEcsTaskRole \
  --policy-name prmp-secrets-access \
  --policy-document file://secrets-policy.json
```

### 7. Create ECS Cluster and Service

```bash
# Create ECS cluster
aws ecs create-cluster --cluster-name prmp-cluster

# Register task definition
aws ecs register-task-definition --cli-input-json file://task-definition.json

# Create Application Load Balancer
aws elbv2 create-load-balancer \
  --name prmp-alb \
  --subnets subnet-xxxxx subnet-yyyyy \
  --security-groups sg-alb-xxxxx \
  --scheme internet-facing \
  --type application

# Create target group
aws elbv2 create-target-group \
  --name prmp-tg \
  --protocol HTTP \
  --port 3000 \
  --vpc-id vpc-xxxxx \
  --target-type ip \
  --health-check-path /health \
  --health-check-interval-seconds 30

# Create HTTPS listener (requires SSL certificate in ACM)
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:... \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=arn:aws:acm:... \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:...

# Create ECS service
aws ecs create-service \
  --cluster prmp-cluster \
  --service-name prmp-service \
  --task-definition prmp-registry:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxxxx,subnet-yyyyy],securityGroups=[sg-ecs-xxxxx],assignPublicIp=DISABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=prmp-registry,containerPort=3000"
```

### 8. Run Database Migrations

```bash
# Connect to ECS task and run migrations
aws ecs run-task \
  --cluster prmp-cluster \
  --task-definition prmp-registry:1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxxxx],securityGroups=[sg-ecs-xxxxx],assignPublicIp=ENABLED}" \
  --overrides '{
    "containerOverrides": [{
      "name": "prmp-registry",
      "command": ["npm", "run", "migrate"]
    }]
  }'
```

### 9. Set Up CloudFront (Optional but Recommended)

```bash
# Create CloudFront distribution for API caching
aws cloudfront create-distribution --distribution-config file://cloudfront-config.json
```

### 10. Set Up OpenSearch (Phase 2 - Optional)

```bash
# Create OpenSearch domain
aws opensearch create-domain \
  --domain-name prmp-search \
  --engine-version OpenSearch_2.11 \
  --cluster-config \
    InstanceType=t3.small.search,InstanceCount=1 \
  --ebs-options \
    EBSEnabled=true,VolumeType=gp3,VolumeSize=10 \
  --vpc-options \
    SubnetIds=subnet-xxxxx,SecurityGroupIds=sg-opensearch-xxxxx \
  --access-policies file://opensearch-policy.json \
  --encryption-at-rest-options Enabled=true \
  --node-to-node-encryption-options Enabled=true \
  --domain-endpoint-options EnforceHTTPS=true,TLSSecurityPolicy=Policy-Min-TLS-1-2-2019-07

# Update ECS task definition to enable OpenSearch
# Set SEARCH_ENGINE=opensearch
# Set OPENSEARCH_ENDPOINT=https://search-prmp-xxxxx.us-east-1.es.amazonaws.com
```

## Environment Variables for ECS

Add to task definition:

```json
{
  "environment": [
    { "name": "NODE_ENV", "value": "production" },
    { "name": "PORT", "value": "3000" },
    { "name": "HOST", "value": "0.0.0.0" },
    { "name": "SEARCH_ENGINE", "value": "postgres" },
    { "name": "AWS_REGION", "value": "us-east-1" },
    { "name": "S3_BUCKET", "value": "prmp-packages" },
    { "name": "FRONTEND_URL", "value": "https://promptpm.dev" }
  ],
  "secrets": [
    {
      "name": "DATABASE_URL",
      "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:prmp/database"
    },
    {
      "name": "REDIS_URL",
      "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:prmp/redis"
    },
    {
      "name": "JWT_SECRET",
      "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:prmp/jwt-secret"
    },
    {
      "name": "GITHUB_CLIENT_ID",
      "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:prmp/github-oauth:client_id::"
    },
    {
      "name": "GITHUB_CLIENT_SECRET",
      "valueFrom": "arn:aws:secretsmanager:us-east-1:123456789012:secret:prmp/github-oauth:client_secret::"
    }
  ]
}
```

## Monitoring

### CloudWatch Alarms

```bash
# High CPU alarm
aws cloudwatch put-metric-alarm \
  --alarm-name prmp-high-cpu \
  --alarm-description "Alert when CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2

# High memory alarm
aws cloudwatch put-metric-alarm \
  --alarm-name prmp-high-memory \
  --alarm-description "Alert when memory exceeds 80%" \
  --metric-name MemoryUtilization \
  --namespace AWS/ECS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2
```

## Backup Strategy

- **RDS**: Automated daily backups (7-day retention)
- **S3**: Versioning enabled
- **Database dumps**: Weekly full dump to S3

## Scaling

### Auto-scaling ECS
```bash
# Enable auto-scaling
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --resource-id service/prmp-cluster/prmp-service \
  --scalable-dimension ecs:service:DesiredCount \
  --min-capacity 2 \
  --max-capacity 10

# CPU-based scaling
aws application-autoscaling put-scaling-policy \
  --service-namespace ecs \
  --resource-id service/prmp-cluster/prmp-service \
  --scalable-dimension ecs:service:DesiredCount \
  --policy-name cpu-scaling \
  --policy-type TargetTrackingScaling \
  --target-tracking-scaling-policy-configuration file://scaling-policy.json
```

## Estimated Timeline

- **Day 1**: Set up VPC, security groups, RDS, ElastiCache
- **Day 2**: ECR, ECS cluster, task definitions
- **Day 3**: ALB, SSL certificates, deploy containers
- **Day 4**: Run migrations, test endpoints
- **Day 5**: CloudFront, monitoring, alerts
- **Phase 2**: OpenSearch setup (when needed)

## Cost Optimization Tips

1. Use **t4g** instances (ARM-based Graviton) - 20% cheaper
2. Enable **Savings Plans** for ECS Fargate
3. Use **S3 Intelligent-Tiering** for package storage
4. Enable **RDS storage auto-scaling**
5. Use **CloudFront** to reduce ALB traffic
6. Set up **CloudWatch Log retention** (7-30 days, not infinite)

## Troubleshooting

### Check ECS logs
```bash
aws logs tail /ecs/prmp-registry --follow
```

### Check RDS connectivity
```bash
# From ECS task
aws ecs execute-command \
  --cluster prmp-cluster \
  --task task-id \
  --container prmp-registry \
  --interactive \
  --command "/bin/sh"

# Then inside container
nc -zv prmp-db.xxxxx.us-east-1.rds.amazonaws.com 5432
```

## Support

For issues, see main project [GitHub Issues](https://github.com/khaliqgant/prompt-package-manager/issues)
