import { FastifyInstance } from 'fastify';
import { config } from '../config.js';
import { uploadJsonObject } from '../storage/s3.js';

interface SeoPackageResponse {
  packages: any[];
  hasMore: boolean;
}

interface SeoCollectionResponse {
  collections: any[];
  hasMore: boolean;
}

export class SeoDataService {
  private server: FastifyInstance;
  private enabled: boolean;
  private bucket: string;
  private prefix: string;
  private cacheControl: string;
  private ssgToken?: string;
  private isRunning = false;
  private rerunRequested = false;

  constructor(server: FastifyInstance) {
    this.server = server;
    this.enabled = config.seoData?.enabled !== false;
    this.bucket = config.seoData?.bucket || config.s3.bucket;
    this.prefix = config.seoData?.prefix || 'seo-data';
    this.cacheControl = config.seoData?.cacheControl || 'public, max-age=300';
    this.ssgToken = process.env.SSG_DATA_TOKEN;

    if (!this.ssgToken) {
      this.server.log.warn('SEO data service disabled: SSG_DATA_TOKEN not configured');
      this.enabled = false;
    }
  }

  isEnabled() {
    return this.enabled;
  }

  async updateSinglePackage(packageName: string) {
    if (!this.enabled) {
      this.server.log.debug({ packageName }, 'SEO data service disabled, skipping package update');
      return;
    }

    try {
      this.server.log.info({ packageName }, '🔄 Updating SEO data for single package');

      const packageData = await this.fetchSinglePackage(packageName);

      if (!packageData) {
        this.server.log.warn({ packageName }, 'Package not found for SEO update');
        return;
      }

      // Upload individual package file: seo-data/packages/{packageName}.json
      const sanitizedName = packageName.replace(/[@\/]/g, '-');
      await uploadJsonObject(this.server, `packages/${sanitizedName}.json`, packageData, {
        bucket: this.bucket,
        prefix: this.prefix,
        cacheControl: this.cacheControl,
      });

      this.server.log.info({ packageName, sanitizedName }, '✅ SEO data updated for package');
    } catch (error) {
      this.server.log.error(
        { packageName, error: error instanceof Error ? error.message : String(error) },
        'Failed to update SEO data for package'
      );
    }
  }

  async queueFullRebuild(trigger: string) {
    if (!this.enabled) {
      this.server.log.debug({ trigger }, 'SEO data service disabled, skipping rebuild');
      return;
    }

    if (this.isRunning) {
      this.rerunRequested = true;
      this.server.log.info({ trigger }, 'SEO data rebuild already in progress, will rerun once finished');
      return;
    }

    this.isRunning = true;
    do {
      this.rerunRequested = false;
      try {
        await this.rebuildAll(trigger);
      } catch (error) {
        this.server.log.error({ error: error instanceof Error ? error.message : String(error) }, 'SEO data rebuild failed');
      }
    } while (this.rerunRequested);
    this.isRunning = false;
  }

  private async rebuildAll(trigger: string) {
    this.server.log.info({ trigger }, '🔄 Rebuilding SEO data (packages & collections)');

    const [packages, collections] = await Promise.all([
      this.fetchAllPackages(),
      this.fetchAllCollections(),
    ]);

    await Promise.all([
      uploadJsonObject(this.server, 'packages.json', packages, {
        bucket: this.bucket,
        prefix: this.prefix,
        cacheControl: this.cacheControl,
      }),
      uploadJsonObject(this.server, 'collections.json', collections, {
        bucket: this.bucket,
        prefix: this.prefix,
        cacheControl: this.cacheControl,
      }),
    ]);

    this.server.log.info(
      { trigger, packages: packages.length, collections: collections.length },
      '✅ SEO data uploaded'
    );
  }

  private async fetchAllPackages() {
    const allPackages: any[] = [];
    let offset = 0;
    const limit = 500;

    while (true) {
      const response = await this.fetchPackages(limit, offset);
      if (!Array.isArray(response.packages) || response.packages.length === 0) {
        break;
      }

      allPackages.push(...response.packages);

      if (!response.hasMore) {
        break;
      }

      offset += limit;
    }

    return allPackages;
  }

  private async fetchPackages(limit: number, offset: number): Promise<SeoPackageResponse> {
    const response = await this.server.inject({
      method: 'GET',
      url: `/api/v1/packages/ssg-data?limit=${limit}&offset=${offset}`,
      headers: {
        'x-ssg-token': this.ssgToken!,
      },
    });

    if (response.statusCode !== 200) {
      throw new Error(`Failed to fetch packages for SEO data (status ${response.statusCode})`);
    }

    return response.json() as SeoPackageResponse;
  }

  private async fetchSinglePackage(packageName: string): Promise<any | null> {
    const response = await this.server.inject({
      method: 'GET',
      url: `/api/v1/packages/ssg-data?packageName=${encodeURIComponent(packageName)}`,
      headers: {
        'x-ssg-token': this.ssgToken!,
      },
    });

    if (response.statusCode !== 200) {
      throw new Error(`Failed to fetch package ${packageName} for SEO data (status ${response.statusCode})`);
    }

    const data = response.json() as SeoPackageResponse;

    // Should return exactly one package when filtered by name
    if (!data.packages || data.packages.length === 0) {
      return null;
    }

    return data.packages[0];
  }

  private async fetchAllCollections() {
    const allCollections: any[] = [];
    let offset = 0;
    const limit = 500;

    while (true) {
      const response = await this.fetchCollections(limit, offset);
      if (!Array.isArray(response.collections) || response.collections.length === 0) {
        break;
      }

      allCollections.push(...response.collections);

      if (!response.hasMore) {
        break;
      }

      offset += limit;
    }

    return allCollections;
  }

  private async fetchCollections(limit: number, offset: number): Promise<SeoCollectionResponse> {
    const response = await this.server.inject({
      method: 'GET',
      url: `/api/v1/collections/ssg-data?limit=${limit}&offset=${offset}`,
      headers: {
        'x-ssg-token': this.ssgToken!,
      },
    });

    if (response.statusCode !== 200) {
      throw new Error(`Failed to fetch collections for SEO data (status ${response.statusCode})`);
    }

    return response.json() as SeoCollectionResponse;
  }
}
