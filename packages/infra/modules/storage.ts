/**
 * Storage Module - S3 + CloudFront
 */

import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export interface StorageResources {
  bucket: aws.s3.BucketV2;
  bucketPublicAccessBlock: aws.s3.BucketPublicAccessBlock;
  bucketVersioning: aws.s3.BucketVersioningV2;
  bucketEncryption: aws.s3.BucketServerSideEncryptionConfigurationV2;
  bucketLifecycle: aws.s3.BucketLifecycleConfigurationV2;
  cloudfront: aws.cloudfront.Distribution;
  oai: aws.cloudfront.OriginAccessIdentity;
}

function createPackageBucket(
  projectName: string,
  environment: string,
  tags: Record<string, string>
): StorageResources {
  const name = `${projectName}-${environment}`;
  const bucketName = `${name}-packages`;

  // Create S3 bucket
  const bucket = new aws.s3.BucketV2(`${name}-packages`, {
    bucket: bucketName,
    tags: {
      ...tags,
      Name: bucketName,
    },
  });

  // Block public access
  const bucketPublicAccessBlock = new aws.s3.BucketPublicAccessBlock(
    `${name}-packages-public-access-block`,
    {
      bucket: bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    }
  );

  // Enable versioning
  const bucketVersioning = new aws.s3.BucketVersioningV2(`${name}-packages-versioning`, {
    bucket: bucket.id,
    versioningConfiguration: {
      status: "Enabled",
    },
  });

  // Enable encryption
  const bucketEncryption = new aws.s3.BucketServerSideEncryptionConfigurationV2(
    `${name}-packages-encryption`,
    {
      bucket: bucket.id,
      rules: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: "AES256",
          },
          bucketKeyEnabled: true,
        },
      ],
    }
  );

  // Lifecycle policy
  const bucketLifecycle = new aws.s3.BucketLifecycleConfigurationV2(
    `${name}-packages-lifecycle`,
    {
      bucket: bucket.id,
      rules: [
        {
          id: "delete-old-versions",
          status: "Enabled",
          noncurrentVersionExpiration: {
            noncurrentDays: 90,
          },
        },
        {
          id: "abort-incomplete-multipart-uploads",
          status: "Enabled",
          abortIncompleteMultipartUpload: {
            daysAfterInitiation: 7,
          },
        },
      ],
    }
  );

  // Create CloudFront Origin Access Identity
  const oai = new aws.cloudfront.OriginAccessIdentity(`${name}-oai`, {
    comment: `OAI for ${bucketName}`,
  });

  // Create bucket policy to allow CloudFront
  new aws.s3.BucketPolicy(`${name}-packages-policy`, {
    bucket: bucket.id,
    policy: pulumi.all([bucket.arn, oai.iamArn]).apply(([bucketArn, oaiArn]) =>
      JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Sid: "CloudFrontGetObject",
            Effect: "Allow",
            Principal: {
              AWS: oaiArn,
            },
            Action: "s3:GetObject",
            Resource: `${bucketArn}/*`,
          },
        ],
      })
    ),
  });

  // Create CloudFront distribution
  const cloudfront = new aws.cloudfront.Distribution(`${name}-cdn`, {
    enabled: true,
    comment: `CDN for ${bucketName}`,

    origins: [
      {
        originId: bucket.id,
        domainName: bucket.bucketRegionalDomainName,
        s3OriginConfig: {
          originAccessIdentity: oai.cloudfrontAccessIdentityPath,
        },
      },
    ],

    defaultCacheBehavior: {
      targetOriginId: bucket.id,
      viewerProtocolPolicy: "redirect-to-https",
      allowedMethods: ["GET", "HEAD", "OPTIONS"],
      cachedMethods: ["GET", "HEAD"],

      forwardedValues: {
        queryString: false,
        cookies: {
          forward: "none",
        },
      },

      minTtl: 0,
      defaultTtl: 86400, // 1 day
      maxTtl: 31536000, // 1 year

      compress: true,
    },

    priceClass: "PriceClass_100", // US, Canada, Europe

    restrictions: {
      geoRestriction: {
        restrictionType: "none",
      },
    },

    viewerCertificate: {
      cloudfrontDefaultCertificate: true,
    },

    tags: {
      ...tags,
      Name: `${name}-cdn`,
    },
  });

  return {
    bucket,
    bucketPublicAccessBlock,
    bucketVersioning,
    bucketEncryption,
    bucketLifecycle,
    cloudfront,
    oai,
  };
}

export const storage = {
  createPackageBucket,
};
