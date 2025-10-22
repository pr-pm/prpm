#!/usr/bin/env node

/**
 * Fix remote server categorization in existing JSON files
 *
 * Corrects the remote_server field based on transport_type:
 * - remote_server: true only if transport_type is 'sse' or 'websocket'
 * - Sets transport_type to 'stdio' if not specified
 */

import { readFileSync, writeFileSync } from 'fs';

function inferTransportType(description, readme = '') {
  const text = `${description} ${readme}`.toLowerCase();

  if (text.includes('websocket') || text.includes('ws://') || text.includes('wss://')) return 'websocket';
  if (text.includes('sse') || text.includes('server-sent events') || text.includes('eventsource')) return 'sse';

  return 'stdio'; // default - most MCP servers use stdio
}

function isRemoteServer(transportType) {
  return transportType === 'sse' || transportType === 'websocket';
}

function fixFile(filePath) {
  console.log(`\n🔧 Fixing ${filePath}...`);

  try {
    const data = JSON.parse(readFileSync(filePath, 'utf-8'));
    let fixedCount = 0;
    let remoteCount = 0;

    const fixed = data.map(pkg => {
      // Only fix MCP servers
      if (pkg.type !== 'mcp') return pkg;

      const oldRemote = pkg.remote_server;
      const oldTransport = pkg.transport_type;

      // Determine correct transport type
      let transportType = pkg.transport_type;
      if (!transportType || transportType === null) {
        transportType = inferTransportType(pkg.description || '', pkg.readme || '');
      }

      // Determine if remote based on transport type
      const isRemote = isRemoteServer(transportType);

      // Update package
      const updated = {
        ...pkg,
        transport_type: transportType,
        remote_server: isRemote,
        remote_url: isRemote ? (pkg.remote_url || `${pkg.repository_url}#remote`) : undefined
      };

      // Remove undefined fields
      if (!updated.remote_url) delete updated.remote_url;

      // Track changes
      if (oldRemote !== isRemote || oldTransport !== transportType) {
        fixedCount++;
        console.log(`   ✏️  ${pkg.id}: remote=${oldRemote}→${isRemote}, transport=${oldTransport}→${transportType}`);
      }

      if (isRemote) remoteCount++;

      return updated;
    });

    // Write back
    writeFileSync(filePath, JSON.stringify(fixed, null, 2));

    console.log(`   ✅ Fixed ${fixedCount} packages`);
    console.log(`   🌐 Remote servers: ${remoteCount}/${data.length}`);

    return { total: data.length, fixed: fixedCount, remote: remoteCount };
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
    return { total: 0, fixed: 0, remote: 0 };
  }
}

// Files to fix
const files = [
  'scraped-mcp-servers-official.json',
];

console.log('🚀 Fixing remote server categorization in JSON files\n');

let totalFixed = 0;
let totalRemote = 0;
let totalPackages = 0;

for (const file of files) {
  const result = fixFile(file);
  totalFixed += result.fixed;
  totalRemote += result.remote;
  totalPackages += result.total;
}

console.log('\n\n📊 Summary:');
console.log(`   Total packages: ${totalPackages}`);
console.log(`   Fixed: ${totalFixed}`);
console.log(`   Remote servers: ${totalRemote}`);
console.log('\n✅ Done!');
