#!/bin/bash
set -e

echo "🔥 Karen Action Publishing Script"
echo ""

# Check if karen-action directory exists
if [ ! -d "packages/karen-action" ]; then
  echo "❌ Error: packages/karen-action directory not found"
  exit 1
fi

# Create temporary directory
TEMP_DIR=$(mktemp -d)
echo "📁 Creating temporary directory: $TEMP_DIR"

# Copy karen-action files to temp
echo "📋 Copying Karen action files..."
cp -r packages/karen-action/* "$TEMP_DIR/"

# Navigate to temp directory
cd "$TEMP_DIR"

# Ensure dist is present
if [ ! -f "dist/index.js" ]; then
  echo "❌ Error: dist/index.js not found. Run 'npm run build' first"
  exit 1
fi

echo "✅ dist/index.js found ($(du -h dist/index.js | cut -f1))"

# Create/update LICENSE if not exists
if [ ! -f "LICENSE" ]; then
  echo "📝 Creating MIT LICENSE..."
  cat > LICENSE << 'EOF'
MIT License

Copyright (c) 2025 PRPM

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
EOF
fi

# Remove unnecessary files for GitHub Action
echo "🧹 Cleaning up unnecessary files..."
rm -rf node_modules
rm -f package-lock.json
rm -f tsconfig.json
rm -rf .karen

# Create .gitignore
cat > .gitignore << 'EOF'
node_modules/
*.log
.env
.DS_Store
EOF

echo ""
echo "✅ Karen Action prepared in: $TEMP_DIR"
echo ""
echo "📦 Files ready for publishing:"
ls -lh

echo ""
echo "📌 Next steps:"
echo ""
echo "1. Create GitHub repo: khaliqgant/karen-action"
echo ""
echo "2. Initialize and push:"
echo "   cd $TEMP_DIR"
echo "   git init"
echo "   git add ."
echo "   git commit -m 'Initial Karen Action release'"
echo "   git branch -M main"
echo "   git remote add origin git@github.com:khaliqgant/karen-action.git"
echo "   git push -u origin main"
echo ""
echo "3. Create release:"
echo "   git tag -a v1.0.0 -m 'Karen Action v1.0.0'"
echo "   git tag -a v1 -m 'Karen Action v1.x'"
echo "   git push origin v1.0.0 v1"
echo ""
echo "4. Publish to Marketplace:"
echo "   - Go to https://github.com/khaliqgant/karen-action/releases"
echo "   - Create new release from v1.0.0"
echo "   - Check 'Publish to GitHub Marketplace'"
echo "   - Select category: Code quality"
echo ""
echo "Files are in: $TEMP_DIR"
echo "Don't delete this directory until after publishing!"
echo ""
