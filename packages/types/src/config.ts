/**
 * Configuration types
 */

/**
 * Registry configuration
 */
export interface RegistryConfig {
  port: number;
  host: string;
  logLevel: string;
  database: {
    url: string;
  };
  redis: {
    url: string;
  };
  search: {
    engine: 'postgres' | 'opensearch';
    opensearch: {
      endpoint: string;
      region: string;
    };
  };
  jwt: {
    secret: string;
    expiresIn: string;
  };
  github: {
    clientId: string;
    clientSecret: string;
    callbackUrl: string;
  };
  s3: {
    endpoint: string;
    region: string;
    bucket: string;
    accessKeyId: string;
    secretAccessKey: string;
  };
  rateLimit: {
    max: number;
    window: number;
  };
  packages: {
    maxSize: number;
    allowedExtensions: string[];
  };
  ai: {
    anthropicApiKey: string;
    evaluationEnabled: boolean;
  };
}
