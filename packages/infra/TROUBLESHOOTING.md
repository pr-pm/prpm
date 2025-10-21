# Infrastructure Troubleshooting Guide

Common issues and solutions for PRPM Pulumi infrastructure deployment.

## Table of Contents
- [Pre-Deployment Issues](#pre-deployment-issues)
- [Deployment Failures](#deployment-failures)
- [Post-Deployment Issues](#post-deployment-issues)
- [Performance Issues](#performance-issues)
- [Cost Issues](#cost-issues)

---

## Pre-Deployment Issues

### Issue: `pulumi: command not found`

**Solution:**
```bash
# Install Pulumi
curl -fsSL https://get.pulumi.com | sh

# Add to PATH (add to ~/.bashrc or ~/.zshrc)
export PATH=$PATH:$HOME/.pulumi/bin

# Verify
pulumi version
```

### Issue: AWS credentials not configured

**Error:**
```
error: unable to load AWS credentials
```

**Solution:**
```bash
# Configure AWS CLI
aws configure

# Or set environment variables
export AWS_ACCESS_KEY_ID="your-access-key"
export AWS_SECRET_ACCESS_KEY="your-secret-key"
export AWS_REGION="us-west-2"

# Verify
aws sts get-caller-identity
```

### Issue: Missing required Pulumi config

**Error:**
```
error: required configuration key 'db:password' not set
```

**Solution:**
```bash
# Set missing configuration
pulumi config set --secret db:password "$(openssl rand -base64 32)"
pulumi config set --secret github:clientId "your_client_id"
pulumi config set --secret github:clientSecret "your_client_secret"

# Verify all required config is set
pulumi config
```

### Issue: Invalid stack name

**Error:**
```
error: stack 'my-stack' not found
```

**Solution:**
```bash
# List available stacks
pulumi stack ls

# Select existing stack
pulumi stack select dev

# Or create new stack
pulumi stack init dev
```

---

## Deployment Failures

### Issue: VPC CIDR conflict

**Error:**
```
error: VPC cidr block 10.0.0.0/16 conflicts with existing VPC
```

**Solution:**
```bash
# Check existing VPCs
aws ec2 describe-vpcs --query 'Vpcs[*].[VpcId,CidrBlock]' --output table

# Option 1: Delete conflicting VPC (if unused)
aws ec2 delete-vpc --vpc-id vpc-xxxxx

# Option 2: Use different CIDR block (modify modules/network.ts)
# Change line: cidrBlock: "10.0.0.0/16" to cidrBlock: "10.1.0.0/16"
```

### Issue: Elastic IP limit exceeded

**Error:**
```
error: The maximum number of addresses has been reached
```

**Solution:**
```bash
# Check current EIPs
aws ec2 describe-addresses --query 'Addresses[*].[AllocationId,AssociationId,PublicIp]' --output table

# Release unused EIPs
aws ec2 release-address --allocation-id eipalloc-xxxxx

# Or request quota increase
aws service-quotas request-service-quota-increase \
  --service-code ec2 \
  --quota-code L-0263D0A3 \
  --desired-value 10
```

### Issue: RDS subnet group validation failed

**Error:**
```
error: DB Subnet Group doesn't meet availability zone coverage requirement
```

**Solution:**
This happens when AZs don't have enough capacity.

```bash
# Check available AZs
aws ec2 describe-availability-zones --region us-west-2

# Solution: Modify network.ts to use different AZs
# Or choose a different region
pulumi config set aws:region us-east-1
```

### Issue: ECR repository already exists

**Error:**
```
error: Repository with name 'prpm-dev-registry' already exists
```

**Solution:**
```bash
# Option 1: Delete existing repository
aws ecr delete-repository --repository-name prpm-dev-registry --force

# Option 2: Import existing repository into Pulumi state
pulumi import aws:ecr/repository:Repository prpm-dev-registry prpm-dev-registry
```

### Issue: IAM role creation fails

**Error:**
```
error: User is not authorized to perform: iam:CreateRole
```

**Solution:**
```bash
# Check IAM permissions
aws iam get-user --query 'User.Arn'

# Attach required policy
aws iam attach-user-policy \
  --user-name your-username \
  --policy-arn arn:aws:iam::aws:policy/PowerUserAccess

# Or create custom policy with minimum required permissions
# See: docs/IAM_POLICY.json
```

### Issue: Pulumi state locked

**Error:**
```
error: the stack is currently locked by another update
```

**Solution:**
```bash
# Check who has the lock
pulumi stack --show-name
pulumi whoami

# Cancel stuck update
pulumi cancel

# If cancel doesn't work, force unlock (dangerous!)
pulumi stack export > backup.json
pulumi stack import --file backup.json
```

---

## Post-Deployment Issues

### Issue: ECS tasks not starting

**Symptoms:**
- Service shows 0/2 running tasks
- Tasks immediately go to STOPPED state

**Diagnosis:**
```bash
# Get cluster and service names
CLUSTER=$(pulumi stack output ecsClusterName)
SERVICE=$(pulumi stack output ecsServiceName)

# Check service events
aws ecs describe-services --cluster $CLUSTER --services $SERVICE \
  --query 'services[0].events[0:5]' --output table

# Check stopped task reasons
aws ecs list-tasks --cluster $CLUSTER --desired-status STOPPED | \
  jq -r '.taskArns[0]' | \
  xargs -I {} aws ecs describe-tasks --cluster $CLUSTER --tasks {} \
  --query 'tasks[0].stoppedReason'
```

**Common causes:**

1. **ECR image not found**
```bash
# Push Docker image
ECR_REPO=$(pulumi stack output ecrRepositoryUrl)
aws ecr get-login-password | docker login --username AWS --password-stdin $ECR_REPO
docker push $ECR_REPO:latest
```

2. **Task role missing permissions**
```bash
# Check task role
aws iam get-role --role-name prpm-dev-task-role

# Attach missing policies
aws iam attach-role-policy \
  --role-name prpm-dev-task-role \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess
```

3. **Insufficient CPU/memory**
```bash
# Increase resources in config
pulumi config set app:cpu 512
pulumi config set app:memory 1024
pulumi up
```

### Issue: Database connection failed

**Error in logs:**
```
ERROR: Could not connect to database
ECONNREFUSED
```

**Diagnosis:**
```bash
# Check database status
aws rds describe-db-instances \
  --db-instance-identifier prpm-dev-db \
  --query 'DBInstances[0].DBInstanceStatus'

# Check security group
aws ec2 describe-security-groups \
  --group-ids $(aws ecs describe-services --cluster $CLUSTER --services $SERVICE \
  --query 'services[0].networkConfiguration.awsvpcConfiguration.securityGroups[0]' --output text)
```

**Solutions:**

1. **Database not ready**
```bash
# Wait for database to be available
aws rds wait db-instance-available --db-instance-identifier prpm-dev-db
```

2. **Security group misconfigured**
```bash
# Verify RDS security group allows ECS security group
# Check modules/database.ts line 53: fromPort: 5432
```

3. **Wrong connection string**
```bash
# Get correct endpoint
pulumi stack output dbEndpoint

# Update secrets
pulumi config set --secret DATABASE_URL "postgresql://user:pass@$(pulumi stack output dbEndpoint):5432/prpm_registry"
```

### Issue: ALB health checks failing

**Symptoms:**
- Targets show "unhealthy" in target group
- 503 errors from ALB

**Diagnosis:**
```bash
# Get target group ARN
TG_ARN=$(aws elbv2 describe-target-groups \
  --names prpm-dev-tg \
  --query 'TargetGroups[0].TargetGroupArn' --output text)

# Check target health
aws elbv2 describe-target-health --target-group-arn $TG_ARN
```

**Solutions:**

1. **Wrong health check path**
```bash
# Update health check in modules/ecs.ts
# healthCheck: { path: "/health", ... }
```

2. **App not listening on correct port**
```bash
# Verify container port matches target group port (3000)
# Check Dockerfile: EXPOSE 3000
```

3. **App startup timeout**
```bash
# Increase health check grace period
# In modules/ecs.ts: healthCheckGracePeriodSeconds: 60
```

### Issue: S3 access denied

**Error:**
```
Access Denied when uploading to S3
```

**Diagnosis:**
```bash
# Check bucket policy
aws s3api get-bucket-policy --bucket $(pulumi stack output s3BucketName)

# Check task role permissions
aws iam list-attached-role-policies --role-name prpm-dev-task-role
```

**Solution:**
```bash
# Attach S3 policy to task role
aws iam attach-role-policy \
  --role-name prpm-dev-task-role \
  --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess
```

---

## Performance Issues

### Issue: High database CPU

**Diagnosis:**
```bash
# Check RDS metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/RDS \
  --metric-name CPUUtilization \
  --dimensions Name=DBInstanceIdentifier,Value=prpm-dev-db \
  --statistics Average \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300
```

**Solutions:**
1. Scale up instance class: `pulumi config set db:instanceClass db.t4g.small`
2. Enable read replicas for read-heavy workloads
3. Optimize slow queries with EXPLAIN ANALYZE
4. Add database indexes

### Issue: High NAT Gateway costs

**Symptoms:**
- AWS bill shows high NAT Gateway data transfer charges

**Solutions:**
1. Use VPC endpoints for AWS services (S3, DynamoDB, ECR)
2. Move public-facing resources to public subnets
3. Use single NAT Gateway instead of per-AZ (dev/staging only)

### Issue: Slow application response

**Diagnosis:**
```bash
# Check ECS CPU/memory
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=$(pulumi stack output ecsServiceName) \
  --statistics Average \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 300
```

**Solutions:**
1. Scale ECS tasks: `pulumi config set app:desiredCount 4`
2. Enable auto-scaling based on CPU/memory
3. Increase task CPU/memory: `pulumi config set app:cpu 1024`
4. Add Redis caching
5. Use CloudFront CDN

---

## Cost Issues

### Issue: Unexpected high costs

**Diagnosis:**
```bash
# Get cost breakdown
aws ce get-cost-and-usage \
  --time-period Start=$(date -d '7 days ago' +%Y-%m-%d),End=$(date +%Y-%m-%d) \
  --granularity DAILY \
  --metrics BlendedCost \
  --group-by Type=SERVICE
```

**Common culprits:**
1. **NAT Gateway** (~$0.045/hour + data transfer)
   - Solution: Use VPC endpoints, reduce cross-AZ traffic
2. **Data Transfer** ($0.09/GB outbound)
   - Solution: Use CloudFront, enable S3 Transfer Acceleration
3. **RDS storage** ($0.115/GB/month for gp3)
   - Solution: Enable storage auto-scaling, clean old data
4. **ECS Fargate** ($0.04048/vCPU/hour + $0.004445/GB/hour)
   - Solution: Right-size tasks, use Spot for non-critical workloads

### Issue: Forgot to destroy dev resources

**Solution:**
```bash
# Destroy entire stack
pulumi stack select dev
pulumi destroy --yes

# Verify no resources left
aws resourcegroupstaggingapi get-resources \
  --tag-filters Key=Project,Values=PRPM Key=Environment,Values=dev
```

---

## Emergency Procedures

### Complete Stack Failure

1. **Export current state**
```bash
pulumi stack export > emergency-backup-$(date +%Y%m%d).json
```

2. **Check AWS Console**
- Identify which resources exist
- Note any manual changes

3. **Selective destruction**
```bash
# Destroy specific resources
pulumi destroy --target urn:pulumi:dev::prpm::aws:ecs/service:Service::prpm-dev-service
```

4. **Fresh deployment**
```bash
# Remove stack and recreate
pulumi stack rm dev --force
pulumi stack init dev
# Re-configure
pulumi up
```

### Data Recovery

**RDS:**
```bash
# List snapshots
aws rds describe-db-snapshots \
  --db-instance-identifier prpm-prod-db

# Restore from snapshot
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier prpm-prod-db-restored \
  --db-snapshot-identifier prpm-prod-db-snapshot-xxxxx
```

**S3:**
```bash
# List versions (if versioning enabled)
aws s3api list-object-versions --bucket $(pulumi stack output s3BucketName)

# Restore specific version
aws s3api restore-object \
  --bucket $(pulumi stack output s3BucketName) \
  --key packages/mypackage/1.0.0/package.tar.gz \
  --version-id xxxxx
```

---

## Getting Help

1. **Check Pulumi logs**: `pulumi logs --follow`
2. **AWS CloudWatch**: Check service-specific logs
3. **Pulumi Community**: https://slack.pulumi.com/
4. **AWS Support**: https://console.aws.amazon.com/support/
5. **GitHub Issues**: https://github.com/khaliqgant/prompt-package-manager/issues

## Prevention

- ✅ Always run `pulumi preview` before `pulumi up`
- ✅ Use `./scripts/pre-deploy-check.sh` before deploying
- ✅ Enable CloudTrail for audit logs
- ✅ Set up AWS Budgets for cost alerts
- ✅ Tag all resources for cost tracking
- ✅ Regular backups (RDS automated, S3 versioning)
- ✅ Test disaster recovery procedures quarterly
