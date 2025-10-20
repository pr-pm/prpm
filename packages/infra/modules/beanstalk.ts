/**
 * Elastic Beanstalk Module
 *
 * Cost-optimized alternative to ECS Fargate
 * Estimated cost: $32.50/month (vs $126/month for ECS)
 *
 * Includes:
 * - Elastic Beanstalk Application & Environment
 * - Single t3.micro instance (upgradeable)
 * - Application Load Balancer (included)
 * - Auto Scaling (optional)
 * - CloudWatch Logs
 * - No NAT Gateway needed!
 */

import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

interface BeanstalkConfig {
  vpc: ReturnType<typeof createNetwork>;
  dbEndpoint: pulumi.Output<string>;
  dbUsername: string;
  dbPassword: pulumi.Output<string>;
  redisEndpoint?: pulumi.Output<string>;
  githubClientId: pulumi.Output<string>;
  githubClientSecret: pulumi.Output<string>;
  s3BucketName: pulumi.Output<string>;
  instanceType?: string;
  minSize?: number;
  maxSize?: number;
  domainName?: string;
  tags: { [key: string]: string };
}

export function createBeanstalkApp(
  projectName: string,
  environment: string,
  config: BeanstalkConfig
) {
  const name = `${projectName}-${environment}`;
  const instanceType = config.instanceType || "t3.micro";
  const minSize = config.minSize || 1;
  const maxSize = config.maxSize || 2;

  // 1. Create Beanstalk Application
  const application = new aws.elasticbeanstalk.Application(`${name}-app`, {
    name: name,
    description: `PRPM Registry - ${environment}`,
    tags: config.tags,
  });

  // 2. Create IAM Role for EC2 instances
  const instanceRole = new aws.iam.Role(`${name}-instance-role`, {
    name: `${name}-eb-instance-role`,
    assumeRolePolicy: JSON.stringify({
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: { Service: "ec2.amazonaws.com" },
          Action: "sts:AssumeRole",
        },
      ],
    }),
    tags: config.tags,
  });

  // Attach required policies
  const webTierPolicy = new aws.iam.RolePolicyAttachment(
    `${name}-web-tier-policy`,
    {
      role: instanceRole.name,
      policyArn: "arn:aws:iam::aws:policy/AWSElasticBeanstalkWebTier",
    }
  );

  const multicontainerDockerPolicy = new aws.iam.RolePolicyAttachment(
    `${name}-multicontainer-docker-policy`,
    {
      role: instanceRole.name,
      policyArn:
        "arn:aws:iam::aws:policy/AWSElasticBeanstalkMulticontainerDocker",
    }
  );

  const workerTierPolicy = new aws.iam.RolePolicyAttachment(
    `${name}-worker-tier-policy`,
    {
      role: instanceRole.name,
      policyArn: "arn:aws:iam::aws:policy/AWSElasticBeanstalkWorkerTier",
    }
  );

  // S3 access for package storage
  const s3Policy = new aws.iam.RolePolicy(`${name}-s3-policy`, {
    role: instanceRole.name,
    policy: pulumi
      .all([config.s3BucketName])
      .apply(([bucketName]) =>
        JSON.stringify({
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Action: ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
              Resource: `arn:aws:s3:::${bucketName}/*`,
            },
            {
              Effect: "Allow",
              Action: ["s3:ListBucket"],
              Resource: `arn:aws:s3:::${bucketName}`,
            },
          ],
        })
      ),
  });

  // 3. Create Instance Profile
  const instanceProfile = new aws.iam.InstanceProfile(
    `${name}-instance-profile`,
    {
      name: `${name}-eb-instance-profile`,
      role: instanceRole.name,
      tags: config.tags,
    }
  );

  // 4. Create Service Role for Beanstalk
  const serviceRole = new aws.iam.Role(`${name}-service-role`, {
    name: `${name}-eb-service-role`,
    assumeRolePolicy: JSON.stringify({
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Principal: { Service: "elasticbeanstalk.amazonaws.com" },
          Action: "sts:AssumeRole",
        },
      ],
    }),
    tags: config.tags,
  });

  const servicePolicy = new aws.iam.RolePolicyAttachment(
    `${name}-service-policy`,
    {
      role: serviceRole.name,
      policyArn:
        "arn:aws:iam::aws:policy/service-role/AWSElasticBeanstalkEnhancedHealth",
    }
  );

  const serviceManagedPolicy = new aws.iam.RolePolicyAttachment(
    `${name}-service-managed-policy`,
    {
      role: serviceRole.name,
      policyArn:
        "arn:aws:iam::aws:policy/AWSElasticBeanstalkManagedUpdatesCustomerRolePolicy",
    }
  );

  // 5. Security Group for Beanstalk instances
  const securityGroup = new aws.ec2.SecurityGroup(`${name}-eb-sg`, {
    name: `${name}-eb-sg`,
    description: "Security group for Elastic Beanstalk instances",
    vpcId: config.vpc.vpc.id,
    ingress: [
      {
        protocol: "tcp",
        fromPort: 80,
        toPort: 80,
        cidrBlocks: ["0.0.0.0/0"],
        description: "HTTP from anywhere",
      },
      {
        protocol: "tcp",
        fromPort: 443,
        toPort: 443,
        cidrBlocks: ["0.0.0.0/0"],
        description: "HTTPS from anywhere",
      },
    ],
    egress: [
      {
        protocol: "-1",
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ["0.0.0.0/0"],
        description: "All outbound traffic",
      },
    ],
    tags: config.tags,
  });

  // 6. Create Application Version (will be updated via deployments)
  const appVersion = new aws.elasticbeanstalk.ApplicationVersion(
    `${name}-version`,
    {
      name: `${name}-initial`,
      application: application.name,
      description: "Initial application version",
      bucket: config.s3BucketName,
      key: "registry/application.zip", // Placeholder
      tags: config.tags,
    }
  );

  // 7. Create Beanstalk Environment
  const beanstalkEnv = new aws.elasticbeanstalk.Environment(`${name}-env`, {
    name: `${name}-env`,
    application: application.name,
    solutionStackName: "64bit Amazon Linux 2023 v6.2.0 running Node.js 20",
    tier: "WebServer",

    // Environment variables
    settings: [
      // Platform settings
      {
        namespace: "aws:elasticbeanstalk:environment",
        name: "EnvironmentType",
        value: minSize === maxSize && minSize === 1 ? "SingleInstance" : "LoadBalanced",
      },
      {
        namespace: "aws:elasticbeanstalk:environment",
        name: "ServiceRole",
        value: serviceRole.name,
      },

      // Instance settings
      {
        namespace: "aws:autoscaling:launchconfiguration",
        name: "InstanceType",
        value: instanceType,
      },
      {
        namespace: "aws:autoscaling:launchconfiguration",
        name: "IamInstanceProfile",
        value: instanceProfile.name,
      },
      {
        namespace: "aws:autoscaling:launchconfiguration",
        name: "SecurityGroups",
        value: securityGroup.id,
      },

      // Auto Scaling
      {
        namespace: "aws:autoscaling:asg",
        name: "MinSize",
        value: minSize.toString(),
      },
      {
        namespace: "aws:autoscaling:asg",
        name: "MaxSize",
        value: maxSize.toString(),
      },

      // Network settings
      {
        namespace: "aws:ec2:vpc",
        name: "VPCId",
        value: config.vpc.vpc.id,
      },
      {
        namespace: "aws:ec2:vpc",
        name: "Subnets",
        value: pulumi.output(config.vpc.publicSubnets).apply((subnets: unknown[]) =>
          pulumi.all(subnets.map((s: { id: pulumi.Output<string> }) => s.id)).apply(ids => ids.join(","))
        ),
      },
      {
        namespace: "aws:ec2:vpc",
        name: "ELBSubnets",
        value: pulumi.output(config.vpc.publicSubnets).apply((subnets: unknown[]) =>
          pulumi.all(subnets.map((s: { id: pulumi.Output<string> }) => s.id)).apply(ids => ids.join(","))
        ),
      },

      // Node.js settings
      {
        namespace: "aws:elasticbeanstalk:container:nodejs",
        name: "NodeCommand",
        value: "npm start",
      },
      {
        namespace: "aws:elasticbeanstalk:container:nodejs",
        name: "NodeVersion",
        value: "20.x",
      },

      // Application environment variables
      {
        namespace: "aws:elasticbeanstalk:application:environment",
        name: "NODE_ENV",
        value: environment === "prod" ? "production" : environment,
      },
      {
        namespace: "aws:elasticbeanstalk:application:environment",
        name: "PORT",
        value: "3000",
      },

      // Database connection
      {
        namespace: "aws:elasticbeanstalk:application:environment",
        name: "DATABASE_URL",
        value: pulumi.all([config.dbEndpoint, config.dbPassword]).apply(
          ([endpoint, password]) =>
            `postgresql://${config.dbUsername}:${password}@${endpoint}/prpm_registry`
        ),
      },

      // Redis connection (if provided)
      ...(config.redisEndpoint
        ? [
            {
              namespace: "aws:elasticbeanstalk:application:environment",
              name: "REDIS_URL",
              value: config.redisEndpoint.apply(
                (endpoint) => `redis://${endpoint}:6379`
              ),
            },
          ]
        : []),

      // GitHub OAuth
      {
        namespace: "aws:elasticbeanstalk:application:environment",
        name: "GITHUB_CLIENT_ID",
        value: config.githubClientId,
      },
      {
        namespace: "aws:elasticbeanstalk:application:environment",
        name: "GITHUB_CLIENT_SECRET",
        value: config.githubClientSecret,
      },
      {
        namespace: "aws:elasticbeanstalk:application:environment",
        name: "GITHUB_CALLBACK_URL",
        value: config.domainName
          ? `https://${config.domainName}/api/v1/auth/callback`
          : "http://localhost:3000/api/v1/auth/callback",
      },

      // S3 storage
      {
        namespace: "aws:elasticbeanstalk:application:environment",
        name: "AWS_S3_BUCKET",
        value: config.s3BucketName,
      },
      {
        namespace: "aws:elasticbeanstalk:application:environment",
        name: "AWS_REGION",
        value: aws.config.region || "us-west-2",
      },

      // JWT Secret
      {
        namespace: "aws:elasticbeanstalk:application:environment",
        name: "JWT_SECRET",
        value: pulumi.output("change-this-in-production-via-eb-setenv"),
      },

      // Health check
      {
        namespace: "aws:elasticbeanstalk:application",
        name: "Application Healthcheck URL",
        value: "/health",
      },

      // Enhanced health reporting
      {
        namespace: "aws:elasticbeanstalk:healthreporting:system",
        name: "SystemType",
        value: "enhanced",
      },

      // CloudWatch Logs
      {
        namespace: "aws:elasticbeanstalk:cloudwatch:logs",
        name: "StreamLogs",
        value: "true",
      },
      {
        namespace: "aws:elasticbeanstalk:cloudwatch:logs",
        name: "DeleteOnTerminate",
        value: "false",
      },
      {
        namespace: "aws:elasticbeanstalk:cloudwatch:logs",
        name: "RetentionInDays",
        value: "7",
      },

      // Managed updates
      {
        namespace: "aws:elasticbeanstalk:managedactions",
        name: "ManagedActionsEnabled",
        value: "true",
      },
      {
        namespace: "aws:elasticbeanstalk:managedactions",
        name: "PreferredStartTime",
        value: "Sun:03:00",
      },

      // Rolling updates
      {
        namespace: "aws:elasticbeanstalk:command",
        name: "DeploymentPolicy",
        value: "RollingWithAdditionalBatch",
      },
      {
        namespace: "aws:elasticbeanstalk:command",
        name: "BatchSizeType",
        value: "Percentage",
      },
      {
        namespace: "aws:elasticbeanstalk:command",
        name: "BatchSize",
        value: "50",
      },
    ],

    tags: config.tags,
  });

  // 8. ACM Certificate and Route53 (if domain is provided)
  let certificate: aws.acm.Certificate | undefined;
  let dnsRecord: aws.route53.Record | undefined;

  if (config.domainName) {
    // Extract base domain (e.g., "prpm.dev" from "registry.prpm.dev")
    const domainParts = config.domainName.split(".");
    const baseDomain =
      domainParts.length >= 2
        ? domainParts.slice(-2).join(".")
        : config.domainName;

    // Look up existing hosted zone
    const hostedZone = aws.route53.getZoneOutput({
      name: baseDomain,
    });

    // Create ACM certificate
    certificate = new aws.acm.Certificate(`${name}-cert`, {
      domainName: config.domainName,
      validationMethod: "DNS",
      tags: {
        ...config.tags,
        Name: `${config.domainName} SSL Certificate`,
      },
    });

    // Create DNS validation record
    const certValidation = new aws.route53.Record(
      `${name}-cert-validation`,
      {
        name: certificate.domainValidationOptions[0].resourceRecordName,
        type: certificate.domainValidationOptions[0].resourceRecordType,
        zoneId: hostedZone.zoneId,
        records: [certificate.domainValidationOptions[0].resourceRecordValue],
        ttl: 60,
      }
    );

    // Wait for certificate validation
    const certValidationComplete = new aws.acm.CertificateValidation(
      `${name}-cert-validation-complete`,
      {
        certificateArn: certificate.arn,
        validationRecordFqdns: [certValidation.fqdn],
      }
    );

    // Create Route53 A record pointing to Beanstalk environment
    dnsRecord = new aws.route53.Record(`${name}-dns`, {
      name: config.domainName,
      type: "CNAME",
      zoneId: hostedZone.zoneId,
      records: [beanstalkEnv.cname],
      ttl: 300,
    });
  }

  // Return outputs
  return {
    application,
    environment: beanstalkEnv,
    instanceRole,
    serviceRole,
    securityGroup,
    endpoint: beanstalkEnv.endpointUrl,
    cname: beanstalkEnv.cname,
    certificate,
    dnsRecord,
  };
}
