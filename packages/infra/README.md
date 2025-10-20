# PRMP Infrastructure as Code

This directory contains Pulumi infrastructure definitions for deploying the PRPM Registry to AWS.

## Architecture

Complete AWS infrastructure including:
- **Networking**: VPC with public/private subnets, NAT Gateway, Internet Gateway
- **Compute**: ECS Fargate cluster with Application Load Balancer
- **Database**: RDS PostgreSQL 15 with automated backups
- **Cache**: ElastiCache Redis 7
- **Storage**: S3 bucket with CloudFront CDN
- **Search**: AWS OpenSearch (optional, Phase 2)
- **Security**: Secrets Manager, IAM roles, Security Groups
- **Monitoring**: CloudWatch Logs, Metrics, and Alarms

## Prerequisites

1. **AWS Account** with appropriate permissions
2. **Pulumi Account** (free tier works)
3. **Node.js 20+**
4. **AWS CLI** configured
5. **Pulumi CLI** installed:
   ```bash
   brew install pulumi
   # or
   curl -fsSL https://get.pulumi.com | sh
   ```

## Quick Start

### 1. Install Dependencies

```bash
cd infra
npm install
```

### 2. Login to Pulumi

```bash
pulumi login
```

### 3. Initialize Stacks

```bash
# Development
pulumi stack init dev

# Staging
pulumi stack init staging

# Production
pulumi stack init prod
```

### 4. Configure Stack

```bash
pulumi stack select dev

# Required configuration
pulumi config set aws:region us-west-2
pulumi config set --secret db:password YOUR_SECURE_DB_PASSWORD
pulumi config set --secret github:clientId YOUR_GITHUB_CLIENT_ID
pulumi config set --secret github:clientSecret YOUR_GITHUB_CLIENT_SECRET

# Optional configuration
pulumi config set db:instanceClass db.t4g.micro
pulumi config set app:desiredCount 2
pulumi config set app:domainName registry.prpm.dev  # if you have a domain

# For Phase 2 (OpenSearch)
pulumi config set search:enabled true
```

### 5. Preview Changes

```bash
pulumi preview
```

### 6. Deploy Infrastructure

```bash
pulumi up
```

This will create:
- VPC with 2 AZs, public/private subnets
- RDS PostgreSQL instance
- ElastiCache Redis cluster
- S3 bucket with CloudFront
- ECS Fargate cluster
- Application Load Balancer
- ECR repository
- Secrets Manager secrets
- CloudWatch alarms

**Deployment time**: ~15-20 minutes

### 7. Get Outputs

```bash
pulumi stack output

# Specific outputs
pulumi stack output apiUrl
pulumi stack output ecrRepositoryUrl
pulumi stack output dbEndpoint
```

## Configuration Reference

### Database

```bash
pulumi config set db:username prpm                    # Database username
pulumi config set --secret db:password <password>     # Database password
pulumi config set db:instanceClass db.t4g.micro       # Instance size
pulumi config set db:allocatedStorage 20              # Storage in GB
```

### Application

```bash
pulumi config set app:image prpm-registry:latest      # Docker image
pulumi config set app:cpu 256                         # CPU units
pulumi config set app:memory 512                      # Memory in MB
pulumi config set app:desiredCount 2                  # Number of tasks
pulumi config set app:domainName registry.prpm.dev # Custom domain
```

### GitHub OAuth

```bash
pulumi config set --secret github:clientId <id>
pulumi config set --secret github:clientSecret <secret>
```

### Search (Optional)

```bash
pulumi config set search:enabled true                 # Enable OpenSearch
pulumi config set search:instanceType t3.small.search # Instance type
pulumi config set search:volumeSize 10                # Volume size in GB
```

## Deployment Workflow

### Local Deployment

```bash
# 1. Deploy infrastructure
pulumi up

# 2. Get ECR repository URL
ECR_REPO=$(pulumi stack output ecrRepositoryUrl)

# 3. Build and push Docker image
cd ../registry
aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin $ECR_REPO
docker build -t prpm-registry:latest .
docker tag prpm-registry:latest $ECR_REPO:latest
docker push $ECR_REPO:latest

# 4. Run database migrations
aws ecs run-task \
  --cluster $(pulumi stack output ecsClusterName) \
  --task-definition $(pulumi stack output ecsServiceName | sed 's/-service/-task/') \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[$(pulumi stack output privateSubnetIds | jq -r '.[0]')],securityGroups=[...],assignPublicIp=DISABLED}" \
  --overrides '{"containerOverrides":[{"name":"prpm-registry","command":["npm","run","migrate"]}]}'

# 5. Force new deployment
aws ecs update-service \
  --cluster $(pulumi stack output ecsClusterName) \
  --service $(pulumi stack output ecsServiceName) \
  --force-new-deployment
```

### GitHub Actions Deployment

Automated via GitHub Actions (see `.github/workflows/`):

1. **Infrastructure Preview** - On PR to main
2. **Infrastructure Deploy** - On push to main or manual trigger
3. **Registry Deploy** - On registry changes or manual trigger

## Stack Management

### List Stacks

```bash
pulumi stack ls
```

### Switch Stack

```bash
pulumi stack select dev
```

### View Stack State

```bash
pulumi stack
pulumi stack graph  # View dependency graph
```

### Export/Import Stack

```bash
# Export
pulumi stack export --file stack-backup.json

# Import
pulumi stack import --file stack-backup.json
```

### Delete Stack

```bash
pulumi destroy  # Remove all resources
pulumi stack rm dev  # Remove stack
```

## Outputs Reference

After deployment, these outputs are available:

| Output | Description |
|--------|-------------|
| `apiUrl` | API endpoint URL |
| `vpcId` | VPC ID |
| `dbEndpoint` | PostgreSQL endpoint |
| `redisEndpoint` | Redis endpoint |
| `s3BucketName` | S3 bucket name |
| `cloudfrontDistributionUrl` | CloudFront CDN URL |
| `albDnsName` | Load balancer DNS |
| `ecsClusterName` | ECS cluster name |
| `ecsServiceName` | ECS service name |
| `ecrRepositoryUrl` | ECR repository URL |
| `opensearchEndpoint` | OpenSearch endpoint (if enabled) |

## Cost Estimates

### Phase 1 (No OpenSearch)
- **Development**: ~$50-70/mo
- **Staging**: ~$60-80/mo
- **Production**: ~$100-150/mo (with HA)

### Phase 2 (With OpenSearch)
- Add ~$24/mo for OpenSearch

## Troubleshooting

### View Logs

```bash
pulumi logs --follow
```

### Check ECS Logs

```bash
aws logs tail /ecs/prpm-dev --follow
```

### Check Resources

```bash
pulumi stack --show-urns
```

### Refresh State

```bash
pulumi refresh
```

### Import Existing Resource

```bash
pulumi import aws:ec2/vpc:Vpc my-vpc vpc-12345678
```

## Module Structure

```
infra/
├── index.ts              # Main entry point
├── modules/
│   ├── network.ts        # VPC, subnets, routing
│   ├── database.ts       # RDS PostgreSQL
│   ├── cache.ts          # ElastiCache Redis
│   ├── storage.ts        # S3 + CloudFront
│   ├── secrets.ts        # Secrets Manager
│   ├── ecs.ts            # ECS Fargate + ALB
│   ├── search.ts         # OpenSearch (optional)
│   └── monitoring.ts     # CloudWatch alarms
├── Pulumi.yaml           # Project configuration
├── Pulumi.dev.yaml       # Dev stack config
├── Pulumi.staging.yaml   # Staging stack config
├── Pulumi.prod.yaml      # Prod stack config
└── package.json          # Dependencies
```

## Best Practices

1. **Always preview** changes before applying: `pulumi preview`
2. **Use secrets** for sensitive data: `pulumi config set --secret`
3. **Tag resources** for cost tracking
4. **Use stack-specific** config files
5. **Export stack state** regularly for backups
6. **Test in dev** before deploying to production
7. **Enable deletion protection** for production RDS

## Security

- All secrets stored in Secrets Manager
- No hardcoded credentials
- VPC with private subnets for data layer
- Security groups with least privilege
- Encryption at rest enabled
- HTTPS enforcement
- IAM roles with minimal permissions

## Support

For issues or questions:
- GitHub Issues: https://github.com/khaliqgant/prompt-package-manager/issues
- Pulumi Docs: https://www.pulumi.com/docs/
- AWS Docs: https://docs.aws.amazon.com/
