/**
 * S3 Storage Helper
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { FastifyInstance } from 'fastify';
import { config } from '../config.js';
import { createHash } from 'crypto';

const s3Client = new S3Client({
  region: config.s3.region,
  endpoint: config.s3.endpoint !== 'https://s3.amazonaws.com' ? config.s3.endpoint : undefined,
  credentials: config.s3.accessKeyId
    ? {
        accessKeyId: config.s3.accessKeyId,
        secretAccessKey: config.s3.secretAccessKey,
      }
    : undefined,
});

/**
 * Upload package tarball to S3
 */
export async function uploadPackage(
  server: FastifyInstance,
  packageId: string,
  version: string,
  tarball: Buffer
): Promise<{ url: string; hash: string; size: number }> {
  const key = `packages/${packageId}/${version}/package.tar.gz`;
  const hash = createHash('sha256').update(tarball).digest('hex');

  try {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: config.s3.bucket,
        Key: key,
        Body: tarball,
        ContentType: 'application/gzip',
        Metadata: {
          packageId,
          version,
          hash,
        },
      })
    );

    // Generate public URL (CloudFront or S3)
    const url = `https://${config.s3.bucket}.s3.${config.s3.region}.amazonaws.com/${key}`;

    server.log.info(`Uploaded package ${packageId}@${version} to S3: ${url}`);

    return {
      url,
      hash,
      size: tarball.length,
    };
  } catch (error: any) {
    server.log.error(`Failed to upload package to S3:`, error);
    throw new Error('Failed to upload package to storage');
  }
}

/**
 * Get presigned URL for package download
 */
export async function getDownloadUrl(
  server: FastifyInstance,
  packageId: string,
  version: string,
  expiresIn: number = 3600
): Promise<string> {
  const key = `packages/${packageId}/${version}/package.tar.gz`;

  try {
    const command = new GetObjectCommand({
      Bucket: config.s3.bucket,
      Key: key,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn });
    return url;
  } catch (error: any) {
    server.log.error(`Failed to generate download URL:`, error);
    throw new Error('Failed to generate download URL');
  }
}

/**
 * Delete package from S3
 */
export async function deletePackage(
  server: FastifyInstance,
  packageId: string,
  version: string
): Promise<void> {
  const key = `packages/${packageId}/${version}/package.tar.gz`;

  try {
    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: config.s3.bucket,
        Key: key,
      })
    );

    server.log.info(`Deleted package ${packageId}@${version} from S3`);
  } catch (error: any) {
    server.log.error(`Failed to delete package from S3:`, error);
    throw new Error('Failed to delete package from storage');
  }
}
