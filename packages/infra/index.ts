/**
 * PRMP Registry Infrastructure
 *
 * This Pulumi program provisions the complete AWS infrastructure for the PRMP Registry:
 * - VPC with public/private subnets across 2 AZs
 * - RDS PostgreSQL database
 * - ElastiCache Redis cluster
 * - ECS Fargate cluster with Application Load Balancer
 * - S3 bucket for package storage with CloudFront CDN
 * - OpenSearch domain (optional, for Phase 2)
 * - Secrets Manager for sensitive configuration
 * - IAM roles and security groups
 * - CloudWatch log groups and alarms
 */

import * as pulumi from "@pulumi/pulumi";
import { network } from "./modules/network";
import { database } from "./modules/database";
import { cache } from "./modules/cache";
import { storage } from "./modules/storage";
import { secrets } from "./modules/secrets";
import { ecs } from "./modules/ecs";
import { search } from "./modules/search";
import { monitoring } from "./modules/monitoring";

// Get configuration
const config = new pulumi.Config();
const awsConfig = new pulumi.Config("aws");
const region = awsConfig.require("region");

const projectName = "prmp";
const environment = pulumi.getStack(); // dev, staging, prod

// Tags to apply to all resources
const tags = {
  Project: "PRMP",
  Environment: environment,
  ManagedBy: "Pulumi",
};

// Configuration values
const dbConfig = {
  username: config.get("db:username") || "prmp",
  password: config.requireSecret("db:password"),
  instanceClass: config.get("db:instanceClass") || "db.t4g.micro",
  allocatedStorage: parseInt(config.get("db:allocatedStorage") || "20"),
};

const githubOAuth = {
  clientId: config.requireSecret("github:clientId"),
  clientSecret: config.requireSecret("github:clientSecret"),
};

const appConfig = {
  image: config.get("app:image") || "prmp-registry:latest",
  cpu: parseInt(config.get("app:cpu") || "256"),
  memory: parseInt(config.get("app:memory") || "512"),
  desiredCount: parseInt(config.get("app:desiredCount") || "2"),
  domainName: config.get("app:domainName"), // e.g., registry.promptpm.dev
};

const searchConfig = {
  enabled: config.getBoolean("search:enabled") || false,
  instanceType: config.get("search:instanceType") || "t3.small.search",
  volumeSize: parseInt(config.get("search:volumeSize") || "10"),
};

// 1. Network Infrastructure
const vpc = network.createVpc(projectName, environment, tags);

// 2. Database Layer
const db = database.createRdsPostgres(projectName, environment, {
  vpc,
  username: dbConfig.username,
  password: dbConfig.password,
  instanceClass: dbConfig.instanceClass,
  allocatedStorage: dbConfig.allocatedStorage,
  tags,
});

// 3. Cache Layer
const redis = cache.createElastiCache(projectName, environment, {
  vpc,
  tags,
});

// 4. Storage Layer
const s3 = storage.createPackageBucket(projectName, environment, tags);

// 5. Secrets Management
const secretsData = secrets.createSecrets(projectName, environment, {
  dbEndpoint: db.endpoint,
  dbUsername: dbConfig.username,
  dbPassword: dbConfig.password,
  redisEndpoint: redis.endpoint,
  githubClientId: githubOAuth.clientId,
  githubClientSecret: githubOAuth.clientSecret,
  tags,
});

// 6. ECS Cluster & Application
const app = ecs.createFargateService(projectName, environment, {
  vpc,
  image: appConfig.image,
  cpu: appConfig.cpu,
  memory: appConfig.memory,
  desiredCount: appConfig.desiredCount,
  domainName: appConfig.domainName,
  dbSecurityGroupId: db.securityGroup.id,
  redisSecurityGroupId: redis.securityGroup.id,
  secretsArn: secretsData.secretsArn,
  s3BucketName: s3.bucket.bucket,
  tags,
});

// 7. Search (Optional - Phase 2)
let opensearch: any = undefined;
if (searchConfig.enabled) {
  opensearch = search.createOpenSearch(projectName, environment, {
    vpc,
    instanceType: searchConfig.instanceType,
    volumeSize: searchConfig.volumeSize,
    tags,
  });
}

// 8. Monitoring & Alarms
const monitors = monitoring.createAlarms(projectName, environment, {
  ecsClusterName: app.cluster.name,
  ecsServiceName: app.service.name,
  albArn: app.alb.arn,
  dbInstanceId: db.instance.id,
  tags,
});

// Exports
export const vpcId = vpc.vpc.id;
export const publicSubnetIds = pulumi.all(vpc.publicSubnets.map(s => s.id));
export const privateSubnetIds = pulumi.all(vpc.privateSubnets.map(s => s.id));

export const dbEndpoint = db.endpoint;
export const dbPort = db.port;
export const dbName = db.instance.dbName;

export const redisEndpoint = redis.endpoint;
export const redisPort = redis.port;

export const s3BucketName = s3.bucket.bucket;
export const s3BucketArn = s3.bucket.arn;
export const cloudfrontDistributionUrl = s3.cloudfront.domainName;

export const albDnsName = app.alb.dnsName;
export const albZoneId = app.alb.zoneId;
export const apiUrl = appConfig.domainName
  ? pulumi.interpolate`https://${appConfig.domainName}`
  : pulumi.interpolate`http://${app.alb.dnsName}`;

export const ecsClusterName = app.cluster.name;
export const ecsServiceName = app.service.name;
export const ecrRepositoryUrl = app.ecrRepo.repositoryUrl;

export const secretsManagerArn = secretsData.secretsArn;

if (opensearch) {
  export const opensearchEndpoint = opensearch.endpoint;
  export const opensearchDashboardUrl = opensearch.kibanaEndpoint;
}

// Output instructions for next steps
export const nextSteps = pulumi.output({
  "1_push_docker_image": pulumi.interpolate`
    # Login to ECR
    aws ecr get-login-password --region ${region} | docker login --username AWS --password-stdin ${app.ecrRepo.repositoryUrl}

    # Build and push
    cd ../registry
    docker build -t prmp-registry:latest .
    docker tag prmp-registry:latest ${app.ecrRepo.repositoryUrl}:latest
    docker push ${app.ecrRepo.repositoryUrl}:latest
  `,
  "2_run_migrations": pulumi.interpolate`
    # Run migrations via ECS task
    aws ecs run-task \\
      --cluster ${app.cluster.name} \\
      --task-definition ${app.taskDefinition.family} \\
      --launch-type FARGATE \\
      --network-configuration "awsvpcConfiguration={subnets=[${vpc.privateSubnets[0].id}],securityGroups=[${app.ecsSecurityGroup.id}],assignPublicIp=DISABLED}" \\
      --overrides '{"containerOverrides":[{"name":"prmp-registry","command":["npm","run","migrate"]}]}'
  `,
  "3_access_api": apiUrl,
  "4_view_logs": pulumi.interpolate`
    aws logs tail /ecs/${projectName}-${environment} --follow
  `,
});
