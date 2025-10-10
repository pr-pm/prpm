#!/bin/bash

# Setup script for Homebrew with existing repository
echo "🍺 Setting up Homebrew with existing repository..."

# Check if we're in the right directory
if [ ! -f "Formula/prmp.rb" ]; then
    echo "❌ Error: Formula/prmp.rb not found. Run this script from the project root."
    exit 1
fi

echo "✅ Formula already exists in your repository!"
echo ""
echo "Next steps:"
echo "1. Create a GitHub release at: https://github.com/khaliqgant/prompt-package-manager/releases"
echo "2. Wait for GitHub Actions to build binaries"
echo "3. Download binaries and calculate SHA256 hashes:"
echo "   shasum -a 256 prmp-macos-x64"
echo "   shasum -a 256 prmp-macos-arm64"
echo "4. Update Formula/prmp.rb with the real SHA256 hashes"
echo "5. Commit and push the updated formula"
echo "6. Test installation:"
echo "   brew tap khaliqgant/prompt-package-manager"
echo "   brew install prmp"
echo ""
echo "📚 See HOMEBREW_EXISTING_REPO_GUIDE.md for detailed instructions"
echo "🌐 Your repository: https://github.com/khaliqgant/prompt-package-manager"
