#!/bin/bash
# Automatically fix missing cache-dependency-path in GitHub Actions workflows
# This script finds all instances of cache: 'npm' without an explicit cache-dependency-path
# and adds it based on the project structure

set -e

echo "🔧 Fixing npm cache paths in GitHub Actions workflows..."
echo ""

FIXED=0
TOTAL=0

for workflow in .github/workflows/*.yml; do
    if ! grep -q "cache: 'npm'" "$workflow"; then
        continue
    fi

    echo "Checking $(basename $workflow)..."
    TOTAL=$((TOTAL + 1))

    # Create a temporary file
    TEMP_FILE=$(mktemp)

    # Read file line by line
    in_setup_node=0
    has_cache_npm=0
    has_cache_path=0
    node_indent=""

    while IFS= read -r line; do
        echo "$line" >> "$TEMP_FILE"

        # Detect when we enter a setup-node action
        if echo "$line" | grep -q "uses: actions/setup-node"; then
            in_setup_node=1
            has_cache_npm=0
            has_cache_path=0
            node_indent=$(echo "$line" | sed 's/\(^[[:space:]]*\).*/\1/')
        fi

        # Detect cache: 'npm'
        if [ "$in_setup_node" -eq 1 ] && echo "$line" | grep -q "cache: 'npm'"; then
            has_cache_npm=1
        fi

        # Detect cache-dependency-path
        if [ "$in_setup_node" -eq 1 ] && echo "$line" | grep -q "cache-dependency-path:"; then
            has_cache_path=1
        fi

        # When we exit the setup-node block (dedent), check if we need to add cache-dependency-path
        if [ "$in_setup_node" -eq 1 ] && [ "$has_cache_npm" -eq 1 ] && [ "$has_cache_path" -eq 0 ]; then
            # Check if we're exiting the 'with:' block
            if ! echo "$line" | grep -q "^[[:space:]]*[a-z-].*:" && ! echo "$line" | grep -q "^[[:space:]]*$"; then
                # We've exited, need to insert before this line
                # Remove the last line from temp file
                sed -i '' -e '$ d' "$TEMP_FILE" 2>/dev/null || sed -i '$ d' "$TEMP_FILE"

                # Determine the cache path based on working directory or default
                cache_path="package-lock.json"

                # Check if there's a working-directory or specific path hint
                if grep -q "working-directory: ./registry" "$workflow"; then
                    cache_path="registry/package-lock.json"
                elif grep -q "working-directory: ./packages/cli" "$workflow"; then
                    cache_path="packages/cli/package-lock.json"
                elif grep -q "working-directory: ./packages/registry-client" "$workflow"; then
                    cache_path="packages/registry-client/package-lock.json"
                elif grep -q "working-directory: ./infra" "$workflow"; then
                    cache_path="infra/package-lock.json"
                fi

                # Add cache-dependency-path with proper indentation
                cache_indent="${node_indent}          "
                echo "${cache_indent}cache-dependency-path: $cache_path" >> "$TEMP_FILE"
                echo "$line" >> "$TEMP_FILE"

                echo "  ✅ Added cache-dependency-path: $cache_path"
                FIXED=$((FIXED + 1))
                in_setup_node=0
                continue
            fi
        fi

        # Reset when we fully exit the action
        if [ "$in_setup_node" -eq 1 ]; then
            current_indent=$(echo "$line" | sed 's/\(^[[:space:]]*\).*/\1/')
            if [ "${#current_indent}" -le "${#node_indent}" ] && [ -n "$line" ] && ! echo "$line" | grep -q "^[[:space:]]*$"; then
                in_setup_node=0
            fi
        fi
    done < "$workflow"

    # Check if file was modified
    if ! diff -q "$workflow" "$TEMP_FILE" > /dev/null 2>&1; then
        mv "$TEMP_FILE" "$workflow"
        echo "  ✅ Updated $(basename $workflow)"
    else
        rm "$TEMP_FILE"
        echo "  ℹ️  No changes needed"
    fi
    echo ""
done

echo "Summary:"
echo "  Workflows checked: $TOTAL"
echo "  Cache paths fixed: $FIXED"
echo ""

if [ $FIXED -gt 0 ]; then
    echo "✅ Fixed $FIXED cache path configurations"
    echo ""
    echo "Next steps:"
    echo "  1. Review the changes: git diff .github/workflows/"
    echo "  2. Test: .github/scripts/pre-commit-workflow-check.sh"
    echo "  3. Commit: git add .github/workflows/ && git commit -m 'Fix npm cache paths'"
else
    echo "✅ All cache paths already configured correctly"
fi
