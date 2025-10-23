#!/bin/bash

# Script to check and fix Elastic Beanstalk environment rollback state
# Usage: ./scripts/fix-beanstalk-rollback.sh [environment-name]

set -e

# Configuration
APP_NAME="${BEANSTALK_APP_NAME:-prpm-prod}"
ENV_NAME="${1:-prpm-prod-env}"
AWS_REGION="${AWS_REGION:-us-west-2}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Beanstalk Environment Rollback Fixer${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "Application: ${GREEN}${APP_NAME}${NC}"
echo -e "Environment: ${GREEN}${ENV_NAME}${NC}"
echo -e "Region: ${GREEN}${AWS_REGION}${NC}"
echo ""

# Function to check if AWS CLI is installed
check_aws_cli() {
    if ! command -v aws &> /dev/null; then
        echo -e "${RED}ERROR: AWS CLI is not installed${NC}"
        echo "Please install it: https://aws.amazon.com/cli/"
        exit 1
    fi
}

# Function to get environment status
get_env_status() {
    echo -e "${YELLOW}Checking environment status...${NC}"
    aws elasticbeanstalk describe-environments \
        --application-name "$APP_NAME" \
        --environment-names "$ENV_NAME" \
        --region "$AWS_REGION" \
        --query 'Environments[0].[Status,Health,HealthStatus]' \
        --output text
}

# Function to get CloudFormation stack status
get_stack_status() {
    echo -e "${YELLOW}Checking CloudFormation stack status...${NC}"

    # Get stack name from environment
    STACK_ARN=$(aws elasticbeanstalk describe-environments \
        --application-name "$APP_NAME" \
        --environment-names "$ENV_NAME" \
        --region "$AWS_REGION" \
        --query 'Environments[0].Resources.CloudFormationStack' \
        --output text)

    if [ -z "$STACK_ARN" ] || [ "$STACK_ARN" == "None" ]; then
        echo -e "${RED}ERROR: Could not find CloudFormation stack${NC}"
        exit 1
    fi

    echo -e "Stack ARN: ${BLUE}${STACK_ARN}${NC}"

    # Get stack status
    aws cloudformation describe-stacks \
        --stack-name "$STACK_ARN" \
        --region "$AWS_REGION" \
        --query 'Stacks[0].StackStatus' \
        --output text
}

# Function to get recent CloudFormation events
get_stack_events() {
    echo -e "${YELLOW}Getting recent CloudFormation events...${NC}"

    STACK_ARN=$(aws elasticbeanstalk describe-environments \
        --application-name "$APP_NAME" \
        --environment-names "$ENV_NAME" \
        --region "$AWS_REGION" \
        --query 'Environments[0].Resources.CloudFormationStack' \
        --output text)

    aws cloudformation describe-stack-events \
        --stack-name "$STACK_ARN" \
        --region "$AWS_REGION" \
        --max-items 20 \
        --query 'StackEvents[?ResourceStatus==`UPDATE_FAILED` || ResourceStatus==`ROLLBACK_FAILED`].[Timestamp,ResourceStatus,ResourceType,LogicalResourceId,ResourceStatusReason]' \
        --output table
}

# Function to continue update rollback
continue_rollback() {
    echo -e "${YELLOW}Attempting to continue rollback...${NC}"

    STACK_ARN=$(aws elasticbeanstalk describe-environments \
        --application-name "$APP_NAME" \
        --environment-names "$ENV_NAME" \
        --region "$AWS_REGION" \
        --query 'Environments[0].Resources.CloudFormationStack' \
        --output text)

    aws cloudformation continue-update-rollback \
        --stack-name "$STACK_ARN" \
        --region "$AWS_REGION"

    echo -e "${GREEN}✅ Rollback continuation initiated${NC}"
    echo -e "${YELLOW}Monitoring rollback progress...${NC}"

    # Wait for rollback to complete
    aws cloudformation wait stack-rollback-complete \
        --stack-name "$STACK_ARN" \
        --region "$AWS_REGION" \
        2>&1 || {
            echo -e "${RED}Rollback did not complete successfully${NC}"
            echo -e "${YELLOW}You may need to manually fix resources in AWS Console${NC}"
            return 1
        }

    echo -e "${GREEN}✅ Rollback completed successfully${NC}"
}

# Main execution
main() {
    check_aws_cli

    echo -e "${BLUE}Step 1: Environment Status${NC}"
    ENV_STATUS=$(get_env_status)
    echo -e "${YELLOW}${ENV_STATUS}${NC}"
    echo ""

    echo -e "${BLUE}Step 2: CloudFormation Stack Status${NC}"
    STACK_STATUS=$(get_stack_status)
    echo -e "${YELLOW}Stack Status: ${STACK_STATUS}${NC}"
    echo ""

    if [ "$STACK_STATUS" == "UPDATE_ROLLBACK_FAILED" ]; then
        echo -e "${RED}⚠️  Stack is in UPDATE_ROLLBACK_FAILED state${NC}"
        echo ""

        echo -e "${BLUE}Step 3: Recent Failed Events${NC}"
        get_stack_events
        echo ""

        echo -e "${YELLOW}This will attempt to continue the rollback.${NC}"
        echo -e "${YELLOW}If resources are stuck, you may need to skip them in AWS Console.${NC}"
        read -p "Continue with rollback? (y/n) " -n 1 -r
        echo ""

        if [[ $REPLY =~ ^[Yy]$ ]]; then
            continue_rollback
        else
            echo -e "${YELLOW}Rollback cancelled${NC}"
            echo ""
            echo -e "${BLUE}Manual steps:${NC}"
            echo "1. Go to AWS Console → CloudFormation"
            echo "2. Find the stack: $STACK_ARN"
            echo "3. Click 'Continue Update Rollback'"
            echo "4. If resources are stuck, skip them and fix manually"
            exit 0
        fi
    else
        echo -e "${GREEN}✅ Stack is not in a failed state${NC}"

        if [[ "$STACK_STATUS" == *"IN_PROGRESS"* ]]; then
            echo -e "${YELLOW}Stack operation is currently in progress${NC}"
            echo "Wait for it to complete before deploying"
        elif [[ "$STACK_STATUS" == *"COMPLETE"* ]]; then
            echo -e "${GREEN}Stack is in a healthy state - ready for deployment${NC}"
        fi
    fi
}

main
