#!/usr/bin/env node
/**
 * CI Test Claude Hook
 * Tests installation to .claude/hooks/
 */

const input = JSON.parse(process.argv[2] || '{}');

// Simple passthrough hook for testing
const output = {
  status: 'success',
  message: 'CI test hook executed'
};

console.log(JSON.stringify(output));
