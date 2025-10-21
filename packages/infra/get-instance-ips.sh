#!/bin/bash

# Script to get bastion host IP and database connection information
# This allows you to connect to the private RDS database through the bastion host

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the current Pulumi stack
STACK=$(pulumi stack --show-name 2>/dev/null || echo "")

if [ -z "$STACK" ]; then
  echo "Error: Not in a Pulumi project directory or no stack selected"
  exit 1
fi

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  PRPM Infrastructure Access Info${NC}"
echo -e "${BLUE}  Stack: $STACK${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Get bastion host information
echo -e "${GREEN}Bastion Host:${NC}"
BASTION_IP=$(pulumi stack output bastionPublicIp 2>/dev/null || echo "Not deployed")
BASTION_INSTANCE_ID=$(pulumi stack output bastionInstanceId 2>/dev/null || echo "Not deployed")

if [ "$BASTION_IP" != "Not deployed" ]; then
  echo -e "  Public IP:     ${YELLOW}$BASTION_IP${NC}"
  echo -e "  Instance ID:   $BASTION_INSTANCE_ID"
  echo ""

  # Get database information
  echo -e "${GREEN}Database:${NC}"
  DB_ENDPOINT=$(pulumi stack output dbEndpoint 2>/dev/null || echo "Not deployed")
  DB_PORT=$(pulumi stack output dbPort 2>/dev/null || echo "5432")
  DB_NAME=$(pulumi stack output dbName 2>/dev/null || echo "prpm_registry")

  echo -e "  Endpoint:      $DB_ENDPOINT"
  echo -e "  Port:          $DB_PORT"
  echo -e "  Database:      $DB_NAME"
  echo ""

  # SSH connection command
  echo -e "${GREEN}SSH to Bastion:${NC}"
  echo -e "  ${YELLOW}ssh -i ~/.ssh/YOUR_KEY.pem ec2-user@$BASTION_IP${NC}"
  echo ""

  # Database connection through bastion (SSH tunnel)
  echo -e "${GREEN}Connect to Database (SSH Tunnel):${NC}"
  echo -e "  1. Create SSH tunnel:"
  echo -e "     ${YELLOW}ssh -i ~/.ssh/YOUR_KEY.pem -L 5432:$DB_ENDPOINT:$DB_PORT ec2-user@$BASTION_IP -N${NC}"
  echo ""
  echo -e "  2. In another terminal, connect to database:"
  echo -e "     ${YELLOW}psql -h localhost -p 5432 -U prpm -d $DB_NAME${NC}"
  echo ""

  # Alternative: Direct psql through bastion
  echo -e "${GREEN}Direct Database Connection (alternative):${NC}"
  echo -e "  ${YELLOW}ssh -i ~/.ssh/YOUR_KEY.pem ec2-user@$BASTION_IP \"psql -h $DB_ENDPOINT -p $DB_PORT -U prpm -d $DB_NAME\"${NC}"
  echo ""

  # Connection string
  echo -e "${GREEN}Database Connection String:${NC}"
  echo -e "  ${YELLOW}postgresql://prpm:PASSWORD@$DB_ENDPOINT:$DB_PORT/$DB_NAME${NC}"
  echo ""

  echo -e "${BLUE}========================================${NC}"
  echo -e "${YELLOW}Note: Replace 'YOUR_KEY.pem' with your actual SSH key file${NC}"
  echo -e "${YELLOW}Note: Replace 'PASSWORD' with your database password${NC}"
  echo -e "${BLUE}========================================${NC}"
else
  echo -e "${YELLOW}Bastion host not deployed yet. Run 'pulumi up' first.${NC}"
fi
