/**
 * License extraction utilities
 * Extracts license information from LICENSE files for proper attribution
 */

import { readFile, access } from 'fs/promises';
import { join } from 'path';
import { constants } from 'fs';

/**
 * Common license file names to search for
 */
const LICENSE_FILE_PATTERNS = [
  'LICENSE',
  'LICENSE.md',
  'LICENSE.txt',
  'LICENCE',
  'LICENCE.md',
  'LICENCE.txt',
  'LICENSE-MIT',
  'LICENSE-APACHE',
  'COPYING',
  'COPYING.txt',
];

/**
 * License type detection patterns
 * Ordered by specificity - more specific patterns first
 */
const LICENSE_PATTERNS = [
  { pattern: /MIT License/i, type: 'MIT' },
  { pattern: /Apache License[\s\S]*Version 2\.0/i, type: 'Apache-2.0' },
  { pattern: /GNU GENERAL PUBLIC LICENSE[\s\S]*Version 3/i, type: 'GPL-3.0' },
  { pattern: /GNU GENERAL PUBLIC LICENSE[\s\S]*Version 2/i, type: 'GPL-2.0' },
  { pattern: /GNU LESSER GENERAL PUBLIC LICENSE[\s\S]*Version 3/i, type: 'LGPL-3.0' },
  { pattern: /GNU LESSER GENERAL PUBLIC LICENSE[\s\S]*Version 2/i, type: 'LGPL-2.1' },
  { pattern: /BSD 3-Clause License/i, type: 'BSD-3-Clause' },
  { pattern: /BSD 2-Clause License/i, type: 'BSD-2-Clause' },
  { pattern: /Mozilla Public License[\s\S]*Version 2\.0/i, type: 'MPL-2.0' },
  { pattern: /ISC License/i, type: 'ISC' },
  { pattern: /The Unlicense/i, type: 'Unlicense' },
  { pattern: /Creative Commons Zero[\s\S]*1\.0/i, type: 'CC0-1.0' },
];

export interface LicenseInfo {
  type: string | null;
  text: string | null;
  url: string | null;
  fileName: string | null;
}

/**
 * Detect license type from license text
 */
function detectLicenseType(text: string): string | null {
  for (const { pattern, type } of LICENSE_PATTERNS) {
    if (pattern.test(text)) {
      return type;
    }
  }
  return null;
}

/**
 * Generate GitHub raw URL for license file
 */
function generateLicenseUrl(repositoryUrl: string | undefined, fileName: string): string | null {
  if (!repositoryUrl) {
    return null;
  }

  // Extract owner/repo from GitHub URL
  const githubMatch = repositoryUrl.match(/github\.com[/:]([\w-]+)\/([\w-]+)/);
  if (!githubMatch) {
    return null;
  }

  const [, owner, repo] = githubMatch;
  // Use raw.githubusercontent.com for direct file access
  return `https://raw.githubusercontent.com/${owner}/${repo}/main/${fileName}`;
}

/**
 * Find and extract license information from the current directory
 */
export async function extractLicenseInfo(repositoryUrl?: string): Promise<LicenseInfo> {
  const cwd = process.cwd();

  // Try each license file pattern
  for (const fileName of LICENSE_FILE_PATTERNS) {
    const filePath = join(cwd, fileName);

    try {
      // Check if file exists
      await access(filePath, constants.R_OK);

      // Read license file
      const text = await readFile(filePath, 'utf-8');

      // Detect license type
      const type = detectLicenseType(text);

      // Generate license URL if repository is provided
      const url = generateLicenseUrl(repositoryUrl, fileName);

      return {
        type,
        text,
        url,
        fileName,
      };
    } catch {
      // File doesn't exist or can't be read, try next pattern
      continue;
    }
  }

  // No license file found
  return {
    type: null,
    text: null,
    url: null,
    fileName: null,
  };
}

/**
 * Display license information if found
 */
export function validateLicenseInfo(licenseInfo: LicenseInfo, packageName: string): void {
  if (licenseInfo.text && licenseInfo.type) {
    console.log(`   License: ${licenseInfo.type} (${licenseInfo.fileName})`);
  } else if (licenseInfo.text && !licenseInfo.type) {
    console.log(`   License: Found (${licenseInfo.fileName})`);
  } else {
    console.log(`   License: Not found (package will be published without license)`);
  }
}
