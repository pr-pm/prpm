#!/bin/bash
# Test GitHub Actions workflows locally using act

set -e

# Ensure act is in PATH
export PATH="$HOME/.local/bin:$PATH"

echo "🧪 Local GitHub Actions Testing"
echo "==============================="
echo ""

# Check prerequisites
if ! command -v act &> /dev/null; then
    echo "❌ act is not installed"
    echo "Run: ./scripts/setup-act.sh"
    exit 1
fi

if ! docker info &> /dev/null; then
    echo "❌ Docker is not running"
    exit 1
fi

echo "✅ Prerequisites OK"
echo ""

# Show menu
echo "Select workflow to test:"
echo "  1) CI workflow (registry + CLI + security)"
echo "  2) E2E Tests workflow"
echo "  3) Code Quality workflow"
echo "  4) PR Checks workflow"
echo "  5) List all workflows"
echo "  6) Dry run all workflows"
echo ""
read -p "Enter choice (1-6): " choice

case $choice in
    1)
        echo "Running CI workflow..."
        act push -W .github/workflows/ci.yml
        ;;
    2)
        echo "Running E2E Tests workflow..."
        act push -W .github/workflows/e2e-tests.yml
        ;;
    3)
        echo "Running Code Quality workflow..."
        act push -W .github/workflows/code-quality.yml
        ;;
    4)
        echo "Running PR Checks workflow..."
        act pull_request -W .github/workflows/pr-checks.yml
        ;;
    5)
        echo "Listing all workflows..."
        act -l
        ;;
    6)
        echo "Dry run all workflows..."
        echo ""
        echo "CI:"
        act push -W .github/workflows/ci.yml --dryrun
        echo ""
        echo "E2E Tests:"
        act push -W .github/workflows/e2e-tests.yml --dryrun
        echo ""
        echo "Code Quality:"
        act push -W .github/workflows/code-quality.yml --dryrun
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "✅ Testing complete!"
