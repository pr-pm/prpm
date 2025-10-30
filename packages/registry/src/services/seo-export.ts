/**
 * SEO Export Service - Trigger Lambda to regenerate SEO data
 */

import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { FastifyInstance } from 'fastify';
import { config } from '../config.js';

const lambdaClient = new LambdaClient({
  region: config.s3.region
});

const SEO_LAMBDA_NAME = process.env.SEO_LAMBDA_NAME || 'prpm-prod-seo-data-fetcher';

/**
 * Trigger SEO Lambda to regenerate packages.json and collections.json
 * This should be called after package publish/unpublish to keep SEO data fresh
 */
export async function triggerSeoExport(server: FastifyInstance): Promise<void> {
  // Skip if Lambda name not configured (e.g., in local dev)
  if (!SEO_LAMBDA_NAME || process.env.NODE_ENV === 'development') {
    server.log.debug('Skipping SEO export trigger (not configured or in development)');
    return;
  }

  try {
    server.log.info({ lambdaName: SEO_LAMBDA_NAME }, 'Triggering SEO Lambda to regenerate export data');

    const command = new InvokeCommand({
      FunctionName: SEO_LAMBDA_NAME,
      InvocationType: 'Event', // Async invocation - don't wait for response
      Payload: JSON.stringify({
        bucketName: config.s3.bucket,
        keyPrefix: 'seo-data',
      }),
    });

    await lambdaClient.send(command);

    server.log.info('✓ SEO Lambda invocation triggered successfully');
  } catch (error) {
    // Log error but don't fail the request - SEO export is non-critical
    server.log.error({ error }, '✗ Failed to trigger SEO Lambda (non-critical)');
  }
}
