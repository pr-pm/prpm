#!/bin/bash

# Script to manually create a GitHub release with binaries

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Creating GitHub release...${NC}"

# Get current version from package.json
VERSION=$(node -p "require('./package.json').version")
echo -e "${YELLOW}📦 Current version: ${VERSION}${NC}"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Run this script from the project root.${NC}"
    exit 1
fi

# Check if binaries exist
if [ ! -f "binaries/prpm-macos-x64" ] || [ ! -f "binaries/prpm-macos-arm64" ]; then
    echo -e "${RED}❌ Error: Binary files not found. Run 'npm run build:binary' first.${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Release will be created with:${NC}"
echo -e "   Tag: ${BLUE}v${VERSION}${NC}"
echo -e "   Title: ${BLUE}v${VERSION}${NC}"
echo -e "   Files:"
echo -e "     - ${BLUE}binaries/prpm-macos-x64${NC}"
echo -e "     - ${BLUE}binaries/prpm-macos-arm64${NC}"
echo -e "     - ${BLUE}binaries/prpm-linux-x64${NC}"
echo -e "     - ${BLUE}binaries/prpm-win-x64.exe${NC}"

echo -e "${YELLOW}📋 Manual steps:${NC}"
echo -e "1. Go to: ${BLUE}https://github.com/pr-pm/prpm/releases/new${NC}"
echo -e "2. Set tag version to: ${BLUE}v${VERSION}${NC}"
echo -e "3. Set release title to: ${BLUE}v${VERSION}${NC}"
echo -e "4. Upload these files:"
echo -e "   - ${BLUE}binaries/prpm-macos-x64${NC}"
echo -e "   - ${BLUE}binaries/prpm-macos-arm64${NC}"
echo -e "   - ${BLUE}binaries/prpm-linux-x64${NC}"
echo -e "   - ${BLUE}binaries/prpm-win-x64.exe${NC}"
echo -e "5. Click 'Publish release'"

echo -e "${GREEN}✅ Ready to create release!${NC}"
