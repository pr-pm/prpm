#!/bin/bash
set -e

echo "🔧 Setting up Pulumi configuration for local deployment"
echo ""

# Check if stack is selected
if ! pulumi stack ls 2>/dev/null | grep -q '\*'; then
  echo "📋 Available stacks:"
  pulumi stack ls
  echo ""
  read -p "Enter stack name to configure (prod/staging/dev): " STACK
  pulumi stack select $STACK || pulumi stack init $STACK
fi

STACK=$(pulumi stack --show-name)
echo "✅ Configuring stack: $STACK"
echo ""

# AWS region
echo "🌍 Setting AWS region..."
pulumi config set aws:region ${AWS_REGION:-us-west-2}

# Database configuration
echo "🗄️  Database configuration..."
pulumi config set db:username ${DB_USERNAME:-prpm}

# Check if password is already set
if pulumi config get db:password --show-secrets >/dev/null 2>&1; then
  echo "   ℹ️  Database password already set"
  read -p "   Do you want to update it? (y/N): " UPDATE_PASSWORD
  if [ "$UPDATE_PASSWORD" != "y" ]; then
    echo "   ⏭️  Skipping password update"
  else
    # Generate or prompt for password
    if [ -n "$DB_PASSWORD" ]; then
      echo "   Using DB_PASSWORD from environment"
      pulumi config set --secret db:password "$DB_PASSWORD"
    else
      echo "   Generating random password..."
      RANDOM_PASSWORD=$(openssl rand -base64 32)
      pulumi config set --secret db:password "$RANDOM_PASSWORD"
      echo "   ✅ Generated and set random password"
    fi
  fi
else
  # Generate or prompt for password
  if [ -n "$DB_PASSWORD" ]; then
    echo "   Using DB_PASSWORD from environment"
    pulumi config set --secret db:password "$DB_PASSWORD"
  else
    echo "   Generating random password..."
    RANDOM_PASSWORD=$(openssl rand -base64 32)
    pulumi config set --secret db:password "$RANDOM_PASSWORD"
    echo "   ✅ Generated and set random password"
  fi
fi

# GitHub OAuth configuration
echo "🔐 GitHub OAuth configuration..."
if [ -n "$GITHUB_CLIENT_ID" ]; then
  echo "   Using GITHUB_CLIENT_ID from environment"
  pulumi config set --secret github:clientId "$GITHUB_CLIENT_ID"
else
  echo "   ⚠️  GITHUB_CLIENT_ID not set (optional)"
fi

if [ -n "$GITHUB_CLIENT_SECRET" ]; then
  echo "   Using GITHUB_CLIENT_SECRET from environment"
  pulumi config set --secret github:clientSecret "$GITHUB_CLIENT_SECRET"
else
  echo "   ⚠️  GITHUB_CLIENT_SECRET not set (optional)"
fi

# App configuration
echo "⚙️  Application configuration..."
pulumi config set app:image ${APP_IMAGE:-prpm-registry:latest}
pulumi config set app:instanceType ${APP_INSTANCE_TYPE:-t3.micro}
pulumi config set app:minSize ${APP_MIN_SIZE:-1}
pulumi config set app:maxSize ${APP_MAX_SIZE:-2}

# Domain configuration (optional)
if [ "$STACK" = "prod" ] && [ -n "$DOMAIN_NAME" ]; then
  echo "🌐 Setting domain name: $DOMAIN_NAME"
  pulumi config set app:domainName "$DOMAIN_NAME"
fi

echo ""
echo "✅ Configuration complete!"
echo ""
echo "📋 Current configuration:"
pulumi config
echo ""
echo "🚀 Ready to deploy with: pulumi up"
