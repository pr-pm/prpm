#!/bin/bash
# Validate GitHub Actions workflow files

set -e

echo "🔍 Validating GitHub Actions workflows..."

# Check if actionlint is installed
if ! command -v actionlint &> /dev/null; then
    echo "❌ actionlint not installed. Install with: brew install actionlint"
    exit 1
fi

# Lint all workflow files
echo ""
echo "Running actionlint..."
actionlint .github/workflows/*.yml

# Check YAML syntax if yamllint is available
if command -v yamllint &> /dev/null; then
    echo ""
    echo "Running yamllint..."
    yamllint .github/workflows/*.yml
else
    echo ""
    echo "ℹ️  yamllint not installed (optional). Install with: brew install yamllint"
fi

echo ""
echo "✅ All workflow files are valid"
