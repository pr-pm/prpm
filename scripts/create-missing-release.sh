#!/bin/bash

# Script to create missing GitHub release with binaries

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Creating missing GitHub release...${NC}"

# Get current version from package.json
VERSION=$(node -p "require('./package.json').version")
echo -e "${YELLOW}📦 Current version: ${VERSION}${NC}"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Run this script from the project root.${NC}"
    exit 1
fi

# Build the project and binaries
echo -e "${BLUE}🔨 Building project and binaries...${NC}"
npm run build
npm run build:binary

# Check if binaries exist
if [ ! -f "binaries/prpm-macos-x64" ] || [ ! -f "binaries/prpm-macos-arm64" ]; then
    echo -e "${RED}❌ Error: Binary files not found. Build failed.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Binaries built successfully!${NC}"

# Get SHA256 hashes
echo -e "${BLUE}🔍 Calculating SHA256 hashes...${NC}"
MACOS_X64_HASH=$(shasum -a 256 binaries/prpm-macos-x64 | cut -d' ' -f1)
MACOS_ARM64_HASH=$(shasum -a 256 binaries/prpm-macos-arm64 | cut -d' ' -f1)

echo -e "${GREEN}✅ SHA256 hashes:${NC}"
echo -e "   macOS x64: ${MACOS_X64_HASH}"
echo -e "   macOS ARM64: ${MACOS_ARM64_HASH}"

echo -e "${YELLOW}📋 Manual steps to create GitHub release:${NC}"
echo -e "1. Go to: ${BLUE}https://github.com/khaliqgant/prompt-package-manager/releases/new${NC}"
echo -e "2. Set tag version to: ${BLUE}v${VERSION}${NC}"
echo -e "3. Set release title to: ${BLUE}v${VERSION}${NC}"
echo -e "4. Upload these files:"
echo -e "   - ${BLUE}binaries/prpm-macos-x64${NC}"
echo -e "   - ${BLUE}binaries/prpm-macos-arm64${NC}"
echo -e "   - ${BLUE}binaries/prpm-linux-x64${NC}"
echo -e "   - ${BLUE}binaries/prpm-win-x64.exe${NC}"
echo -e "5. Click 'Publish release'"

echo -e "\n${YELLOW}📝 Update Homebrew formula with these hashes:${NC}"
echo -e "macOS x64 SHA256: ${BLUE}${MACOS_X64_HASH}${NC}"
echo -e "macOS ARM64 SHA256: ${BLUE}${MACOS_ARM64_HASH}${NC}"

echo -e "\n${GREEN}✅ Ready to create release v${VERSION}!${NC}"
