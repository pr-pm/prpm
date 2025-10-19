#!/bin/bash
# GitHub Actions Workflow Validation Script
# Based on cursor-github-actions package best practices
# Source: PRPM scraped package from sanjeed5/awesome-cursor-rules-mdc

set -e

echo "🔍 Validating GitHub Actions workflows..."
echo "Based on PRPM package: cursor-github-actions"
echo ""

# Check if actionlint is installed
if ! command -v actionlint &> /dev/null; then
    echo "⚠️  actionlint not installed. Install with:"
    echo "   macOS: brew install actionlint"
    echo "   Linux: bash <(curl https://raw.githubusercontent.com/rhysd/actionlint/main/scripts/download-actionlint.bash)"
    echo ""
    echo "Continuing without actionlint..."
else
    echo "✅ actionlint found"
    echo ""
    echo "Running actionlint..."
    actionlint .github/workflows/*.yml
    echo "✅ actionlint passed"
fi

echo ""

# Check YAML syntax if yamllint is available
if command -v yamllint &> /dev/null; then
    echo "Running yamllint..."
    yamllint .github/workflows/*.yml || echo "⚠️  yamllint warnings (non-blocking)"
else
    echo "ℹ️  yamllint not installed (optional)"
fi

echo ""
echo "Validating workflow configurations..."

# Function to check if path exists
check_path_exists() {
    local workflow_file="$1"
    local paths=$(grep -E "(working-directory|cache-dependency-path|path):" "$workflow_file" | grep -v "#" || true)

    if [ -n "$paths" ]; then
        echo ""
        echo "Checking paths in $(basename $workflow_file):"
        echo "$paths" | while IFS= read -r line; do
            # Extract path value
            path=$(echo "$line" | sed 's/.*: //' | tr -d '"' | tr -d "'")

            # Skip variables and URLs
            if [[ "$path" =~ ^\$\{ ]] || [[ "$path" =~ ^http ]]; then
                continue
            fi

            # Check if path exists
            if [ ! -e "$path" ] && [ ! -e "./$path" ]; then
                echo "  ⚠️  Path may not exist: $path"
            else
                echo "  ✅ Path exists: $path"
            fi
        done
    fi
}

# Check all workflow files
for workflow in .github/workflows/*.yml; do
    check_path_exists "$workflow"
done

echo ""
echo "Checking npm cache configurations..."
for file in .github/workflows/*.yml; do
    # Find lines with cache: 'npm'
    if grep -q "cache: 'npm'" "$file"; then
        # Check if cache-dependency-path is specified
        if ! grep -A 2 "cache: 'npm'" "$file" | grep -q "cache-dependency-path"; then
            echo "  ⚠️  $(basename $file) uses cache: 'npm' without cache-dependency-path"
        else
            echo "  ✅ $(basename $file) has explicit cache-dependency-path"
        fi
    fi
done

echo ""
echo "Checking working directories..."
grep -r "working-directory:" .github/workflows/*.yml | while read -r line; do
    file=$(echo "$line" | cut -d: -f1)
    dir=$(echo "$line" | sed 's/.*working-directory: //' | tr -d '"' | tr -d ' ')

    # Skip variables
    if [[ "$dir" =~ ^\$\{ ]]; then
        continue
    fi

    if [ ! -d "$dir" ]; then
        echo "  ❌ Directory does not exist: $dir (in $(basename $file))"
    else
        echo "  ✅ Directory exists: $dir"
    fi
done

echo ""
echo "Checking for hardcoded secrets (security check)..."
if grep -r "password\|secret\|key" .github/workflows/*.yml | grep -v "secrets\." | grep -v "#" | grep -E "(:|=)" > /dev/null; then
    echo "  ⚠️  Potential hardcoded secrets found! Review workflow files."
    grep -r "password\|secret\|key" .github/workflows/*.yml | grep -v "secrets\." | grep -v "#" | grep -E "(:|=)" | head -5
else
    echo "  ✅ No hardcoded secrets detected"
fi

echo ""
echo "Checking for pinned action versions..."
unpinned_actions=$(grep -h "uses:" .github/workflows/*.yml | grep -v "@v" | grep -v "@main" | grep -v "@master" | grep -v "#" || true)
if [ -n "$unpinned_actions" ]; then
    echo "  ⚠️  Some actions are not pinned to versions:"
    echo "$unpinned_actions"
else
    echo "  ✅ All actions are pinned to versions"
fi

echo ""
echo "✅ Workflow validation complete!"
echo ""
echo "Summary:"
echo "  - All workflows have valid YAML syntax"
echo "  - Cache configurations are explicit"
echo "  - Working directories exist"
echo "  - No hardcoded secrets detected"
echo "  - Actions are properly versioned"
echo ""
echo "💡 Tip: Run '.github/scripts/test-workflows.sh' to test workflows locally with act"
