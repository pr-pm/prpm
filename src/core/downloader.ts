/**
 * HTTP file downloading functionality
 */

import fetch from 'node-fetch';

/**
 * Download a file from a URL
 */
export async function downloadFile(url: string): Promise<string> {
  try {
    // Validate URL format
    if (!isValidUrl(url)) {
      throw new Error('Invalid URL format');
    }

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const content = await response.text();
    return content;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to download file: ${error.message}`);
    }
    throw new Error('Failed to download file: Unknown error');
  }
}

/**
 * Validate if URL is a valid raw GitHub URL
 */
function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    
    // For MVP, only support raw GitHub URLs
    return (
      urlObj.protocol === 'https:' &&
      (urlObj.hostname === 'raw.githubusercontent.com' || 
       urlObj.hostname === 'github.com' && urlObj.pathname.includes('/raw/'))
    );
  } catch {
    return false;
  }
}

/**
 * Extract filename from URL
 */
export function extractFilename(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const filename = pathname.split('/').pop() || 'unknown';
    
    // If no extension, assume it's a markdown file
    if (!filename.includes('.')) {
      return `${filename}.md`;
    }
    
    return filename;
  } catch {
    return 'unknown.md';
  }
}
