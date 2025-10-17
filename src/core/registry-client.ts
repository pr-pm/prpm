/**
 * Registry API Client
 * Handles all communication with the PRMP Registry
 */

import { PackageType } from '../types';

export interface RegistryPackage {
  id: string;
  display_name: string;
  description?: string;
  type: PackageType;
  tags: string[];
  total_downloads: number;
  rating_average?: number;
  verified: boolean;
  latest_version?: {
    version: string;
    tarball_url: string;
  };
}

export interface SearchResult {
  packages: RegistryPackage[];
  total: number;
  offset: number;
  limit: number;
}

export interface RegistryConfig {
  url: string;
  token?: string;
}

export class RegistryClient {
  private baseUrl: string;
  private token?: string;

  constructor(config: RegistryConfig) {
    this.baseUrl = config.url.replace(/\/$/, ''); // Remove trailing slash
    this.token = config.token;
  }

  /**
   * Search for packages in the registry
   */
  async search(query: string, options?: {
    type?: PackageType;
    tags?: string[];
    limit?: number;
    offset?: number;
  }): Promise<SearchResult> {
    const params = new URLSearchParams({ q: query });
    if (options?.type) params.append('type', options.type);
    if (options?.tags) options.tags.forEach(tag => params.append('tags', tag));
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.offset) params.append('offset', options.offset.toString());

    const response = await this.fetch(`/api/v1/search?${params}`);
    return response.json();
  }

  /**
   * Get package information
   */
  async getPackage(packageId: string): Promise<RegistryPackage> {
    const response = await this.fetch(`/api/v1/packages/${packageId}`);
    return response.json();
  }

  /**
   * Get specific package version
   */
  async getPackageVersion(packageId: string, version: string): Promise<any> {
    const response = await this.fetch(`/api/v1/packages/${packageId}/${version}`);
    return response.json();
  }

  /**
   * Download package tarball
   */
  async downloadPackage(tarballUrl: string): Promise<Buffer> {
    const response = await fetch(tarballUrl);
    if (!response.ok) {
      throw new Error(`Failed to download package: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * Get trending packages
   */
  async getTrending(type?: PackageType, limit: number = 20): Promise<RegistryPackage[]> {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (type) params.append('type', type);

    const response = await this.fetch(`/api/v1/search/trending?${params}`);
    const data = await response.json();
    return data.packages;
  }

  /**
   * Get featured packages
   */
  async getFeatured(type?: PackageType, limit: number = 20): Promise<RegistryPackage[]> {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (type) params.append('type', type);

    const response = await this.fetch(`/api/v1/search/featured?${params}`);
    const data = await response.json();
    return data.packages;
  }

  /**
   * Publish a package (requires authentication)
   */
  async publish(manifest: any, tarball: Buffer): Promise<any> {
    if (!this.token) {
      throw new Error('Authentication required. Run `prmp login` first.');
    }

    const formData = new FormData();
    formData.append('manifest', JSON.stringify(manifest));
    formData.append('tarball', new Blob([tarball]), 'package.tar.gz');

    const response = await this.fetch('/api/v1/packages', {
      method: 'POST',
      body: formData,
    });

    return response.json();
  }

  /**
   * Login and get authentication token
   */
  async login(): Promise<string> {
    // This will open browser for GitHub OAuth
    // For now, return placeholder - will implement OAuth flow
    throw new Error('Login not yet implemented. Coming soon!');
  }

  /**
   * Get current user info
   */
  async whoami(): Promise<any> {
    if (!this.token) {
      throw new Error('Not authenticated. Run `prmp login` first.');
    }

    const response = await this.fetch('/api/v1/auth/me');
    return response.json();
  }

  /**
   * Helper method for making authenticated requests
   */
  private async fetch(path: string, options: RequestInit = {}): Promise<Response> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: response.statusText }));
      throw new Error(error.error || error.message || 'Request failed');
    }

    return response;
  }
}

/**
 * Get registry client with configuration
 */
export function getRegistryClient(): RegistryClient {
  // TODO: Load from config file (~/.prmprc or similar)
  const registryUrl = process.env.PRMP_REGISTRY_URL || 'https://registry.promptpm.dev';
  const token = process.env.PRMP_TOKEN;

  return new RegistryClient({
    url: registryUrl,
    token,
  });
}
