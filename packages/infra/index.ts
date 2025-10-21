/**
 * PRPM Registry Infrastructure - Elastic Beanstalk (Cost-Optimized)
 *
 * This is a cost-optimized alternative to the ECS Fargate setup.
 *
 * Cost comparison:
 * - ECS Setup (index.ts): ~$126/month
 * - Beanstalk Setup (this file): ~$32.50/month
 * - Savings: $93.50/month (74%)
 *
 * Architecture:
 * - Elastic Beanstalk (t3.micro) with Application Load Balancer
 * - RDS PostgreSQL (db.t4g.micro)
 * - S3 + CloudFront
 * - No NAT Gateway needed (saves $32/month)
 * - No ElastiCache (use in-memory caching, saves $12/month)
 * - No separate ALB charge (included with Beanstalk)
 *
 * To use this instead of ECS:
 * 1. Rename index.ts to index-ecs.ts
 * 2. Rename this file to index.ts
 * 3. Run: pulumi up
 */

import * as pulumi from "@pulumi/pulumi";
import * as beanstalk from "./modules/beanstalk";
import { network } from "./modules/network";
import { database } from "./modules/database";
import { storage } from "./modules/storage";
import { bastion } from "./modules/bastion";
import {
  validateStackConfig,
  validateDatabaseConfig,
  validateAll,
} from "./validation";

// Get configuration
const config = new pulumi.Config();
const awsConfig = new pulumi.Config("aws");
const dbConfigNS = new pulumi.Config("db");
const githubConfigNS = new pulumi.Config("github");
const jwtConfigNS = new pulumi.Config("jwt");
const appConfigNS = new pulumi.Config("app");

const region = awsConfig.require("region");

const projectName = "prpm";
const environment = pulumi.getStack(); // dev, staging, prod

// Validate stack configuration
const stackValidation = validateStackConfig({
  environment,
  region,
  projectName,
});

if (!stackValidation.valid) {
  console.error("Stack configuration validation failed:");
  stackValidation.errors.forEach(err => console.error(`  - ${err}`));
  throw new Error("Invalid stack configuration");
}

// Tags to apply to all resources
const tags = {
  Project: "PRPM",
  Environment: environment,
  ManagedBy: "Pulumi",
  CostOptimized: "true",
  Architecture: "Beanstalk",
};

// Configuration values
const dbConfig = {
  username: dbConfigNS.get("username") || "prpm",
  password: dbConfigNS.requireSecret("password"),
  instanceClass: dbConfigNS.get("instanceClass") || "db.t4g.micro",
  allocatedStorage: parseInt(dbConfigNS.get("allocatedStorage") || "20"),
};

const githubOAuth = {
  clientId: githubConfigNS.requireSecret("clientId"),
  clientSecret: githubConfigNS.requireSecret("clientSecret"),
};

const jwtConfig = {
  secret: jwtConfigNS.requireSecret("secret"),
};

const appConfig = {
  instanceType: appConfigNS.get("instanceType") || "t3.micro",
  minSize: parseInt(appConfigNS.get("minSize") || "1"),
  maxSize: parseInt(appConfigNS.get("maxSize") || "2"),
  domainName: appConfigNS.get("domainName"), // e.g., registry.prpm.dev
};

const ec2KeyName = config.get('ec2KeyName') || 'Khaliq Stable';

// Run all configuration validations
validateAll([
  {
    category: "Database Configuration",
    result: validateDatabaseConfig(dbConfig),
  },
]);

// 1. Network Infrastructure
// For Beanstalk, we can use simpler VPC without NAT Gateway
const vpc = network.createVpc(projectName, environment, tags);

// 2. Bastion Host (for secure database access)
const bastionHost = bastion.createBastionHost(projectName, environment, {
  vpc,
  keyName: ec2KeyName,
  tags,
});

// 3. Database Layer (RDS PostgreSQL)
const db = database.createRdsPostgres(projectName, environment, {
  vpc,
  username: dbConfig.username,
  password: dbConfig.password,
  instanceClass: dbConfig.instanceClass,
  allocatedStorage: dbConfig.allocatedStorage,
  bastionSecurityGroupId: bastionHost.securityGroup.id,
  tags,
});

// 4. Storage Layer (S3 + CloudFront)
const s3 = storage.createPackageBucket(projectName, environment, tags);

// 5. Elastic Beanstalk Application
const app = beanstalk.createBeanstalkApp(projectName, environment, {
  vpc,
  dbEndpoint: db.endpoint,
  dbUsername: dbConfig.username,
  dbPassword: dbConfig.password,
  // No Redis - using in-memory caching to save $12/month
  githubClientId: githubOAuth.clientId,
  githubClientSecret: githubOAuth.clientSecret,
  jwtSecret: jwtConfig.secret,
  s3BucketName: s3.bucket.bucket,
  instanceType: appConfig.instanceType,
  minSize: appConfig.minSize,
  maxSize: appConfig.maxSize,
  domainName: appConfig.domainName,
  tags,
});

// Exports
export const vpcId = vpc.vpc.id;
export const publicSubnetIds = vpc.publicSubnets.apply(subnets =>
  pulumi.all(subnets.map(s => s.id))
);
export const privateSubnetIds = vpc.privateSubnets.apply(subnets =>
  pulumi.all(subnets.map(s => s.id))
);

export const dbEndpoint = db.endpoint;
export const dbPort = db.port;
export const dbName = db.instance.apply(i => i.dbName);

export const bastionPublicIp = bastionHost.publicIp;
export const bastionInstanceId = bastionHost.instance.apply(i => i.id);

export const s3BucketName = s3.bucket.bucket;
export const s3BucketArn = s3.bucket.arn;
export const cloudfrontDistributionUrl = s3.cloudfront.domainName;

export const beanstalkApplicationName = app.application.name;
export const beanstalkEnvironmentName = app.environment.name;
export const beanstalkEndpoint = app.endpoint;
export const beanstalkCname = app.cname;

export const apiUrl = appConfig.domainName
  ? pulumi.interpolate`https://${appConfig.domainName}`
  : app.endpoint;

// Cost Summary
export const costSummary = {
  estimatedMonthlyCost: "$32.50-50",
  breakdown: {
    compute: "$7.50 (t3.micro)",
    database: "$15 (db.t4g.micro)",
    storage: "$5-10 (S3 + CloudFront)",
    other: "$5 (data transfer, logs)",
  },
  savingsVsECS: "$93.50/month (74%)",
};

// Deployment Instructions
export const deploymentInstructions = pulumi.output({
  "1_build_application": `
    # Build your application
    cd ../registry
    npm run build
    zip -r application.zip . -x "node_modules/*" ".git/*"
  `,
  "2_upload_to_s3": pulumi.interpolate`
    # Upload to S3
    aws s3 cp application.zip s3://${s3.bucket.bucket}/registry/application.zip
  `,
  "3_create_app_version": pulumi.interpolate`
    # Create new application version
    aws elasticbeanstalk create-application-version \\
      --application-name ${app.application.name} \\
      --version-label v1.0.0 \\
      --source-bundle S3Bucket="${s3.bucket.bucket}",S3Key="registry/application.zip"
  `,
  "4_deploy_version": pulumi.interpolate`
    # Deploy to environment
    aws elasticbeanstalk update-environment \\
      --application-name ${app.application.name} \\
      --environment-name ${app.environment.name} \\
      --version-label v1.0.0
  `,
  "5_run_migrations": pulumi.interpolate`
    # SSH into instance and run migrations
    eb ssh ${app.environment.name}
    cd /var/app/current
    npm run migrate
  `,
  "6_access_api": app.endpoint,
  "7_view_logs": pulumi.interpolate`
    # View logs
    eb logs ${app.environment.name} --tail
  `,
});

// Alternative: Simple EB CLI deployment
export const ebCliDeployment = pulumi.interpolate`
  # Easier deployment with EB CLI
  cd ../registry
  eb init ${app.application.name} --region ${region}
  eb use ${app.environment.name}
  eb deploy
`;

// Monitoring & Health
export const monitoring = {
  healthCheck: pulumi.interpolate`${app.endpoint}/health`,
  cloudWatchLogs: pulumi.interpolate`/aws/elasticbeanstalk/${app.environment.name}`,
  metrics: "Available in AWS Console → Elastic Beanstalk → Monitoring",
};

// Scaling Configuration
export const scalingInfo = {
  current: `${appConfig.minSize}-${appConfig.maxSize} instances`,
  toScale: pulumi.interpolate`
    # Update auto-scaling
    eb setenv --environment ${app.environment.name} \\
      MIN_SIZE=2 \\
      MAX_SIZE=4
  `,
  triggerMetric: "CPU > 70% for 5 minutes",
};
