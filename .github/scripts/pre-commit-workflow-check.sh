#!/bin/bash
# Pre-commit workflow validation script

set -e

echo "🔍 Pre-commit workflow validation..."

# Function to check if path exists
check_path_exists() {
    local workflow_file="$1"
    local paths=$(grep -E "(working-directory|cache-dependency-path|path):" "$workflow_file" | grep -v "#" || true)

    if [ -n "$paths" ]; then
        echo ""
        echo "Checking paths in $(basename $workflow_file):"
        echo "$paths" | while IFS= read -r line; do
            # Extract path value
            path=$(echo "$line" | sed 's/.*: //' | tr -d '"' | tr -d "'" | xargs)

            # Skip variables, URLs, and wildcards
            if [[ "$path" =~ ^\$\{ ]] || [[ "$path" =~ ^http ]] || [[ "$path" == *"*"* ]]; then
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

# Validate cache configurations
echo ""
echo "Checking npm cache configurations..."
cache_issues=0
missing_files=()

for file in .github/workflows/*.yml; do
    if grep -q "cache: 'npm'" "$file"; then
        # Check if cache-dependency-path is specified within 3 lines
        if ! grep -A 3 "cache: 'npm'" "$file" | grep -q "cache-dependency-path"; then
            echo "  ⚠️  $(basename $file): uses cache: 'npm' without explicit cache-dependency-path"
            cache_issues=$((cache_issues + 1))
        else
            # Verify the cache-dependency-path files actually exist
            while read -r cache_path; do
                cache_path=$(echo "$cache_path" | sed 's/.*cache-dependency-path: *//' | tr -d '"' | xargs)
                if [ -n "$cache_path" ] && [ ! -e "$cache_path" ]; then
                    missing_files+=("$(basename $file): $cache_path")
                    cache_issues=$((cache_issues + 1))
                fi
            done < <(grep -A 3 "cache: 'npm'" "$file" | grep "cache-dependency-path:")
        fi
    fi
done

if [ ${#missing_files[@]} -gt 0 ]; then
    echo "  ❌ Cache dependency paths that don't exist:"
    for item in "${missing_files[@]}"; do
        echo "     - $item"
    done
fi

if [ $cache_issues -eq 0 ]; then
    echo "  ✅ All cache configurations have explicit paths that exist"
fi

echo ""
echo "✅ Pre-commit validation complete"
