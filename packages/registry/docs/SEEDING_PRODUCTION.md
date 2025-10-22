# Seeding Data on Elastic Beanstalk Production

This guide covers how to seed packages and data into your production Elastic Beanstalk environment.

## Overview

The seed scripts now upload package files to S3 (instead of storing in database), ensuring consistency with the publish flow. All packages are stored at:
- S3 Path: `s3://{bucket}/packages/{packageId}/{version}/package.tar.gz`
- Database: Stores S3 URL, content hash (SHA256), and file size

## Prerequisites

- AWS CLI configured with production credentials
- Access to Elastic Beanstalk environment
- Database and S3 bucket already provisioned
- Environment variables set in EB Console:
  - `DATABASE_URL`
  - `S3_BUCKET`
  - `S3_REGION`
  - `S3_ACCESS_KEY_ID`
  - `S3_SECRET_ACCESS_KEY`

## Method 1: Automatic Seeding via .ebextensions (Recommended for Initial Setup)

### Setup

The `.ebextensions/08_seed_data.config` file is configured to run seed scripts during deployment when enabled.

### Usage

**1. Enable seeding via environment variable:**

```bash
# Via AWS CLI
aws elasticbeanstalk update-environment \
  --application-name prpm-registry-prod \
  --environment-name prpm-registry-prod-env \
  --option-settings Namespace=aws:elasticbeanstalk:application:environment,OptionName=ENABLE_SEEDING,Value=true

# Or via EB Console:
# Configuration → Software → Environment Properties
# Add: ENABLE_SEEDING = true
```

**2. Deploy your application:**

```bash
# Via GitHub Actions (push to main or manual workflow)
git push origin main

# OR via EB CLI:
eb deploy prpm-registry-prod-env
```

**3. Monitor deployment:**

```bash
eb logs prpm-registry-prod-env --stream
```

**4. Disable seeding for future deploys:**

```bash
aws elasticbeanstalk update-environment \
  --application-name prpm-registry-prod \
  --environment-name prpm-registry-prod-env \
  --option-settings Namespace=aws:elasticbeanstalk:application:environment,OptionName=ENABLE_SEEDING,Value=false
```

### Pros & Cons

**Pros:**
- ✅ Runs automatically during deployment
- ✅ Uses `leader_only` to prevent duplicate seeds
- ✅ Has access to all environment variables
- ✅ Logs appear in `/var/log/eb-engine.log`

**Cons:**
- ⚠️ Increases deployment time (10-30 minutes depending on data size)
- ⚠️ If seeding fails, deployment may fail

---

## Method 2: SSH into EC2 Instance (Recommended for Manual Control)

### Prerequisites

```bash
# Setup SSH access (if not already configured)
eb ssh --setup prpm-registry-prod-env
```

### Option A: Using Deployment Package (Files Already on Server)

The GitHub workflow now includes seed data in the deployment package.

```bash
# 1. Deploy first (to get seed files on server)
git push origin main

# 2. SSH into instance
eb ssh prpm-registry-prod-env

# 3. Navigate to app directory
cd /var/app/current

# 4. Verify files exist
ls -la data/scraped/
ls -la scripts/

# 5. Run seeds
npm run seed:all

# OR run individually:
npm run seed:packages
npm run seed:prpm-skills
npm run seed:new-skills
npm run seed:collections
```

### Option B: Upload Files via S3 (Best for Large Files)

```bash
# === ON YOUR LOCAL MACHINE ===

# 1. Upload seed data to S3
cd /home/khaliqgant/projects/prompt-package-manager
aws s3 sync data/scraped/ s3://prpm-deployments-prod/seed-data/ --exclude "*.git*"

# === SSH INTO THE SERVER ===

# 2. Connect to server
eb ssh prpm-registry-prod-env

# 3. Download from S3
cd /var/app/current
sudo mkdir -p data
sudo aws s3 sync s3://prpm-deployments-prod/seed-data/ ./data/scraped/
sudo chown -R webapp:webapp ./data

# 4. Run seeds as webapp user
sudo -u webapp bash
cd /var/app/current
npm run seed:all

# 5. Verify
psql $DATABASE_URL -c "SELECT COUNT(*), type FROM packages GROUP BY type;"
aws s3 ls s3://prpm-packages-prod/packages/ --recursive --summarize

# 6. Exit
exit  # Exit webapp user
exit  # Exit SSH
```

**Pros:**
- ✅ Faster for large files
- ✅ No need for direct SSH file transfer
- ✅ Files are backed up in S3
- ✅ Can reuse for multiple instances

### Option C: SCP Files Directly

```bash
# === ON YOUR LOCAL MACHINE ===

# 1. Get instance info
INSTANCE_ID=$(aws elasticbeanstalk describe-environment-resources \
  --environment-name prpm-registry-prod-env \
  --query "EnvironmentResources.Instances[0].Id" \
  --output text)

INSTANCE_DNS=$(aws ec2 describe-instances \
  --instance-ids $INSTANCE_ID \
  --query "Reservations[0].Instances[0].PublicDnsName" \
  --output text)

# 2. Create archive
cd /home/khaliqgant/projects/prompt-package-manager
tar czf seed-data.tar.gz data/scraped/

# 3. Copy to server
scp seed-data.tar.gz ec2-user@$INSTANCE_DNS:/tmp/

# === SSH INTO THE SERVER ===

# 4. Connect
ssh -i ~/.ssh/your-key.pem ec2-user@$INSTANCE_DNS
# OR
eb ssh prpm-registry-prod-env

# 5. Extract and move files
cd /tmp
tar xzf seed-data.tar.gz

sudo mkdir -p /var/app/current/data
sudo cp -r data/scraped /var/app/current/data/
sudo chown -R webapp:webapp /var/app/current/data

# 6. Run seeds
cd /var/app/current
sudo -u webapp bash
npm run seed:all

# 7. Clean up
exit
rm /tmp/seed-data.tar.gz
exit
```

---

## Method 3: SSM Session Manager (No SSH Keys Required)

If you don't have SSH keys configured:

```bash
# === ON YOUR LOCAL MACHINE ===

# 1. Upload files to S3
aws s3 sync data/scraped/ s3://prpm-deployments-prod/seed-data/

# 2. Get instance ID
INSTANCE_ID=$(aws elasticbeanstalk describe-environment-resources \
  --environment-name prpm-registry-prod-env \
  --query "EnvironmentResources.Instances[0].Id" \
  --output text)

# 3. Start SSM session
aws ssm start-session --target $INSTANCE_ID

# === IN SSM SESSION ===

# 4. Switch to webapp user
cd /var/app/current
sudo -u webapp bash

# 5. Download from S3
mkdir -p data
aws s3 sync s3://prpm-deployments-prod/seed-data/ ./data/scraped/

# 6. Run seeds
npm run seed:all

# 7. Exit
exit  # Exit webapp user
exit  # Exit SSM session
```

---

## Method 4: EB CLI Run Command

```bash
# Run command directly (one-liner)
eb ssh prpm-registry-prod-env --command "cd /var/app/current && npm run seed:packages"

# Or use AWS Systems Manager
aws ssm send-command \
  --instance-ids i-xxxxxxxxx \
  --document-name "AWS-RunShellScript" \
  --parameters 'commands=["cd /var/app/current","sudo -u webapp npm run seed:all"]' \
  --comment "Seed database with packages"
```

---

## Complete Production Workflow (Recommended)

### Initial Setup

```bash
# 1. Deploy application with seeding enabled
aws elasticbeanstalk update-environment \
  --application-name prpm-registry-prod \
  --environment-name prpm-registry-prod-env \
  --option-settings Namespace=aws:elasticbeanstalk:application:environment,OptionName=ENABLE_SEEDING,Value=true

# 2. Deploy via GitHub Actions
git push origin main

# 3. Monitor deployment logs
eb logs prpm-registry-prod-env --stream

# 4. Verify seeding succeeded
eb ssh prpm-registry-prod-env

# In the session:
cd /var/app/current
psql $DATABASE_URL -c "SELECT COUNT(*), type FROM packages GROUP BY type;"
aws s3 ls s3://prpm-packages-prod/packages/ --recursive | head -20

exit

# 5. Disable seeding for future deploys
aws elasticbeanstalk update-environment \
  --application-name prpm-registry-prod \
  --environment-name prpm-registry-prod-env \
  --option-settings Namespace=aws:elasticbeanstalk:application:environment,OptionName=ENABLE_SEEDING,Value=false
```

### Adding New Packages Later

```bash
# Option A: SSH and run manually
eb ssh prpm-registry-prod-env
cd /var/app/current
npm run seed:new-packages  # Create a targeted seed script

# Option B: Enable seeding temporarily
# Set ENABLE_SEEDING=true → Deploy → Set ENABLE_SEEDING=false
```

---

## Monitoring & Debugging

### View Logs

```bash
# View deployment logs
eb logs prpm-registry-prod-env

# Stream logs in real-time
eb logs prpm-registry-prod-env --stream

# Check specific log files (via SSH)
eb ssh prpm-registry-prod-env
tail -f /var/log/eb-engine.log      # Container commands output
tail -f /var/log/nodejs/nodejs.log  # Application logs
tail -f /var/app/current/logs/*     # App-specific logs
```

### Check S3 Upload Progress

```bash
# List packages in S3
aws s3 ls s3://prpm-packages-prod/packages/ --recursive --human-readable --summarize

# Check specific package
aws s3 ls s3://prpm-packages-prod/packages/@prpm/

# Get bucket size
aws s3 ls s3://prpm-packages-prod --recursive --summarize

# Monitor upload progress during seeding (run in separate terminal)
watch -n 5 'aws s3 ls s3://prpm-packages-prod/packages/ --recursive | wc -l'
```

### Check Database

```bash
# Via SSH
eb ssh prpm-registry-prod-env
psql $DATABASE_URL -c "SELECT COUNT(*) FROM packages;"
psql $DATABASE_URL -c "SELECT COUNT(*), type FROM packages GROUP BY type;"
psql $DATABASE_URL -c "SELECT name, tarball_url FROM package_versions LIMIT 5;"

# Check for failed uploads (packages without versions)
psql $DATABASE_URL -c "SELECT p.name FROM packages p LEFT JOIN package_versions pv ON p.id = pv.package_id WHERE pv.package_id IS NULL;"
```

---

## Which Method to Use?

| Scenario | Best Method | Summary |
|----------|-------------|---------|
| **Initial production setup** | Method 1 (ebextensions) | Set `ENABLE_SEEDING=true` and deploy |
| **Manual control & monitoring** | Method 2B (SSH + S3) | Upload to S3, download on server, run seeds |
| **Adding new packages later** | Method 2 (SSH) | SSH in and run targeted seed script |
| **Debugging seed issues** | Method 2 (SSH) | SSH in for full control and visibility |
| **No SSH keys configured** | Method 3 (SSM) | Use Systems Manager Session Manager |
| **Quick one-liner** | Method 4 (EB CLI) | Run command directly via EB CLI |

---

## Troubleshooting

### Seeding Fails Due to Missing Dependencies

```bash
# SSH into server
eb ssh prpm-registry-prod-env
cd /var/app/current

# Check if tar package is installed
npm ls tar

# If missing, install dependencies
npm install
```

### S3 Upload Permission Denied

```bash
# Verify IAM role/instance profile has S3 permissions
aws s3 ls s3://prpm-packages-prod/

# Check environment variables
env | grep S3_

# If using instance profile, ensure role has:
# - s3:PutObject
# - s3:PutObjectAcl
# - s3:GetObject
```

### Database Connection Issues

```bash
# Verify DATABASE_URL is set
echo $DATABASE_URL

# Test connection
psql $DATABASE_URL -c "\dt"

# Check security group allows connection from EB instances
```

### Seed Scripts Not Found

```bash
# Check if scripts directory exists
ls -la /var/app/current/scripts/

# If missing, ensure GitHub workflow includes scripts in deployment package
# See: .github/workflows/deploy-registry.yml line 165
```

---

## Cost Optimization

- Use **S3 Standard** for frequently accessed packages
- Enable **S3 Intelligent-Tiering** for automatic cost optimization
- Consider **S3 Transfer Acceleration** if seeding from distant locations
- Use **CloudFront CDN** in front of S3 for package downloads
- Monitor S3 storage costs: `aws s3 ls s3://prpm-packages-prod --recursive --summarize`

---

## Security Best Practices

- ✅ Use IAM roles (instance profiles) instead of access keys when possible
- ✅ Rotate S3 access keys regularly
- ✅ Use S3 bucket policies to restrict access
- ✅ Enable S3 versioning for package files
- ✅ Use encrypted connections (HTTPS) for S3
- ✅ Store DATABASE_URL and secrets in EB environment variables (encrypted)
- ✅ Use SSM Session Manager instead of SSH when possible (no keys to manage)

---

## Next Steps

After seeding:

1. **Test package installation:**
   ```bash
   prpm install @prpm/pulumi-troubleshooting-skill
   ```

2. **Verify via webapp:**
   - Visit: `http://your-eb-env.elasticbeanstalk.com/`
   - Search for packages
   - Check package details

3. **Monitor usage:**
   - CloudWatch metrics
   - S3 access logs
   - Database query logs

4. **Set up backups:**
   - RDS automated backups
   - S3 versioning/lifecycle policies
