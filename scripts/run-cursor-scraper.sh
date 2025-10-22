#!/bin/bash

# Script to run cursor rules scraper after rate limit reset
# GitHub API rate limit resets at: 2025-10-18 07:15 UTC

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║          Cursor Rules Scraper - Rate Limit Safe               ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Check if GITHUB_TOKEN is set
if [ -n "$GITHUB_TOKEN" ]; then
    echo "✓ GITHUB_TOKEN found - using authenticated requests (5,000/hour)"
else
    echo "⚠️  GITHUB_TOKEN not set - using unauthenticated requests (60/hour)"
    echo "   Get token from: https://github.com/settings/tokens"
    echo ""

    # Check rate limit status
    echo "Checking GitHub API rate limit status..."
    RATE_LIMIT=$(curl -s https://api.github.com/rate_limit)
    REMAINING=$(echo $RATE_LIMIT | jq -r '.rate.remaining')
    RESET=$(echo $RATE_LIMIT | jq -r '.rate.reset')
    RESET_TIME=$(date -d @$RESET 2>/dev/null || date -r $RESET 2>/dev/null || echo "unknown")

    echo "Rate limit: $REMAINING/60 requests remaining"
    echo "Resets at: $RESET_TIME"
    echo ""

    if [ "$REMAINING" -lt "10" ]; then
        echo "❌ Insufficient API requests remaining ($REMAINING/60)"
        echo "   Please wait until $RESET_TIME or set GITHUB_TOKEN"
        exit 1
    fi
fi

echo "Starting cursor rules scraper..."
echo ""

cd "$(dirname "$0")/.."
npx tsx scripts/scraper/github-cursor-rules.ts

SCRAPER_EXIT_CODE=$?

if [ $SCRAPER_EXIT_CODE -eq 0 ]; then
    echo ""
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║                  SCRAPING COMPLETE!                            ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo ""

    # Show results
    if [ -f "scripts/scraped/cursor-rules.json" ]; then
        PACKAGE_COUNT=$(jq 'length' scripts/scraped/cursor-rules.json)
        FILE_SIZE=$(ls -lh scripts/scraped/cursor-rules.json | awk '{print $5}')

        echo "📦 Scraped: $PACKAGE_COUNT cursor rules packages"
        echo "📁 File: scripts/scraped/cursor-rules.json ($FILE_SIZE)"
        echo ""

        # Combined totals
        CLAUDE_COUNT=$(jq 'length' scripts/scraped/claude-agents.json 2>/dev/null || echo "0")
        SUBAGENTS_COUNT=$(jq 'length' scripts/scraped/subagents.json 2>/dev/null || echo "0")
        TOTAL=$((PACKAGE_COUNT + CLAUDE_COUNT + SUBAGENTS_COUNT))

        echo "📊 Total packages: $TOTAL"
        echo "   • Claude agents: $CLAUDE_COUNT"
        echo "   • Subagents: $SUBAGENTS_COUNT"
        echo "   • Cursor rules: $PACKAGE_COUNT"
        echo ""

        echo "🎯 Next step: Test upload pipeline"
        echo "   cd scripts/seed && tsx upload.ts"
    fi
else
    echo ""
    echo "❌ Scraper failed with exit code: $SCRAPER_EXIT_CODE"
    echo "   Check the output above for errors"
    exit $SCRAPER_EXIT_CODE
fi
