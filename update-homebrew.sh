#!/bin/bash

# Script to automatically update the Homebrew formula with new version and SHA256 hashes

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🍺 Updating Homebrew formula...${NC}"

# Get current version from package.json
VERSION=$(node -p "require('./package.json').version")
echo -e "${YELLOW}📦 Current version: ${VERSION}${NC}"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Run this script from the project root.${NC}"
    exit 1
fi

# Check if homebrew-prmp directory exists
if [ ! -d "../homebrew-prmp" ]; then
    echo -e "${RED}❌ Error: homebrew-prmp directory not found.${NC}"
    echo -e "${YELLOW}💡 Make sure you have cloned the homebrew-prmp repository to ../homebrew-prmp${NC}"
    exit 1
fi

# Ensure Formula directory exists
mkdir -p "../homebrew-prmp/Formula"

# Build the project
echo -e "${BLUE}🔨 Building project...${NC}"
npm run build

# Build binaries
echo -e "${BLUE}📦 Building binaries...${NC}"
npm run build:binary

# Get SHA256 hashes
echo -e "${BLUE}🔍 Calculating SHA256 hashes...${NC}"
MACOS_X64_HASH=$(shasum -a 256 dist/prmp-macos-x64 | cut -d' ' -f1)
MACOS_ARM64_HASH=$(shasum -a 256 dist/prmp-macos-arm64 | cut -d' ' -f1)

echo -e "${GREEN}✅ SHA256 hashes calculated:${NC}"
echo -e "   macOS x64: ${MACOS_X64_HASH}"
echo -e "   macOS ARM64: ${MACOS_ARM64_HASH}"

# Update the formula
FORMULA_FILE="../homebrew-prmp/Formula/prmp.rb"
echo -e "${BLUE}📝 Updating formula file: ${FORMULA_FILE}${NC}"

# Backup existing formula if it exists
if [ -f "$FORMULA_FILE" ]; then
    cp "$FORMULA_FILE" "$FORMULA_FILE.backup"
    echo -e "${YELLOW}💾 Backed up existing formula to ${FORMULA_FILE}.backup${NC}"
fi

# Create the new formula content
cat > "$FORMULA_FILE" << EOF
class Prmp < Formula
  desc "Prompt Package Manager - Install and manage prompt-based files like Cursor rules and Claude sub-agents"
  homepage "https://github.com/khaliqgant/prompt-package-manager"
  url "https://github.com/khaliqgant/prompt-package-manager/releases/download/v${VERSION}/prmp-macos-x64"
  sha256 "${MACOS_X64_HASH}"
  version "${VERSION}"
  license "MIT"
  
  # Support both Intel and Apple Silicon Macs
  if Hardware::CPU.arm?
    url "https://github.com/khaliqgant/prompt-package-manager/releases/download/v${VERSION}/prmp-macos-arm64"
    sha256 "${MACOS_ARM64_HASH}"
  end
  
  def install
    if Hardware::CPU.arm?
      bin.install "prmp-macos-arm64" => "prmp"
    else
      bin.install "prmp-macos-x64" => "prmp"
    end
  end
  
  test do
    system "#{bin}/prmp", "--version"
  end
end
EOF

# Verify the file was created successfully
if [ -f "$FORMULA_FILE" ]; then
    echo -e "${GREEN}✅ Formula updated successfully!${NC}"
    echo -e "${BLUE}📄 Formula file size: $(wc -l < "$FORMULA_FILE") lines${NC}"
else
    echo -e "${RED}❌ Error: Failed to create formula file${NC}"
    exit 1
fi

# Show what needs to be done next
echo -e "${YELLOW}📋 Next steps:${NC}"
echo -e "1. Create a GitHub release with tag: ${BLUE}v${VERSION}${NC}"
echo -e "2. Upload these binary files to the release:"
echo -e "   - ${BLUE}dist/prmp-macos-x64${NC}"
echo -e "   - ${BLUE}dist/prmp-macos-arm64${NC}"
echo -e "   - ${BLUE}dist/prmp-linux-x64${NC}"
echo -e "   - ${BLUE}dist/prmp-win-x64.exe${NC}"
echo -e "3. Commit and push the updated formula:"
echo -e "   ${BLUE}cd ../homebrew-prmp${NC}"
echo -e "   ${BLUE}git add Formula/prmp.rb${NC}"
echo -e "   ${BLUE}git commit -m \"Update prmp to v${VERSION}\"${NC}"
echo -e "   ${BLUE}git push origin main${NC}"
echo -e "4. Test the installation:"
echo -e "   ${BLUE}brew tap khaliqgant/prmp${NC}"
echo -e "   ${BLUE}brew install prmp${NC}"

echo -e "${GREEN}🎉 Homebrew formula update complete!${NC}"
