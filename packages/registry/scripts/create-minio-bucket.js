#!/usr/bin/env node
/**
 * Create MinIO bucket for package storage
 */

import { S3Client, CreateBucketCommand, HeadBucketCommand, PutBucketCorsCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: 'us-east-1',
  endpoint: 'http://localhost:9000',
  credentials: {
    accessKeyId: 'minioadmin',
    secretAccessKey: 'minioadmin',
  },
  forcePathStyle: true,
});

const BUCKET_NAME = 'prpm-packages';

async function createBucket() {
  try {
    // Check if bucket exists
    try {
      await s3Client.send(new HeadBucketCommand({ Bucket: BUCKET_NAME }));
      console.log(`✅ Bucket '${BUCKET_NAME}' already exists`);
      return;
    } catch (error) {
      if (error.name !== 'NotFound') {
        throw error;
      }
    }

    // Create bucket
    await s3Client.send(new CreateBucketCommand({ Bucket: BUCKET_NAME }));
    console.log(`✅ Created bucket '${BUCKET_NAME}'`);

    // Set CORS policy
    await s3Client.send(new PutBucketCorsCommand({
      Bucket: BUCKET_NAME,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedHeaders: ['*'],
            AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE'],
            AllowedOrigins: ['*'],
            ExposeHeaders: ['ETag'],
            MaxAgeSeconds: 3000,
          },
        ],
      },
    }));
    console.log(`✅ Set CORS policy for bucket '${BUCKET_NAME}'`);

    console.log('\n🎉 MinIO bucket setup complete!');
    console.log(`\n📦 Bucket: ${BUCKET_NAME}`);
    console.log(`🔗 MinIO Console: http://localhost:9001`);
    console.log(`🔑 Credentials: minioadmin / minioadmin\n`);
  } catch (error) {
    console.error('❌ Failed to create bucket:', error.message);
    process.exit(1);
  }
}

createBucket();
