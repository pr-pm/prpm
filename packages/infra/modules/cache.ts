/**
 * Cache Module - ElastiCache Redis
 */

import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { VpcResources } from "./network";

export interface CacheConfig {
  vpc: VpcResources;
  tags: Record<string, string>;
}

export interface CacheResources {
  cluster: aws.elasticache.Cluster;
  subnetGroup: aws.elasticache.SubnetGroup;
  securityGroup: aws.ec2.SecurityGroup;
  endpoint: pulumi.Output<string>;
  port: pulumi.Output<number>;
}

function createElastiCache(
  projectName: string,
  environment: string,
  config: CacheConfig
): CacheResources {
  const name = `${projectName}-${environment}`;

  // Create cache subnet group
  const subnetGroup = pulumi.output(config.vpc.privateSubnets).apply(subnets =>
    new aws.elasticache.SubnetGroup(`${name}-cache-subnet`, {
      subnetIds: subnets.map(s => s.id),
      tags: {
        ...config.tags,
        Name: `${name}-cache-subnet`,
      },
    })
  );

  // Create security group for ElastiCache
  const securityGroup = new aws.ec2.SecurityGroup(`${name}-redis-sg`, {
    vpcId: config.vpc.vpc.id,
    description: "Security group for PRMP Redis",
    ingress: [
      {
        protocol: "tcp",
        fromPort: 6379,
        toPort: 6379,
        cidrBlocks: ["10.0.0.0/16"],
        description: "Redis from VPC",
      },
    ],
    egress: [
      {
        protocol: "-1",
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ["0.0.0.0/0"],
        description: "Allow all outbound",
      },
    ],
    tags: {
      ...config.tags,
      Name: `${name}-redis-sg`,
    },
  });

  // Create parameter group for Redis 7.0
  const parameterGroup = new aws.elasticache.ParameterGroup(`${name}-redis-params`, {
    family: "redis7",
    parameters: [
      {
        name: "maxmemory-policy",
        value: "allkeys-lru",
      },
    ],
    tags: {
      ...config.tags,
      Name: `${name}-redis-params`,
    },
  });

  // Create Redis cluster
  const cluster = pulumi.all([subnetGroup]).apply(([sg]) =>
    new aws.elasticache.Cluster(`${name}-redis`, {
      clusterId: `${name}-redis`,
      engine: "redis",
      engineVersion: "7.0",
      nodeType: "cache.t4g.micro",
      numCacheNodes: 1,

      subnetGroupName: sg.name,
      securityGroupIds: [securityGroup.id],
      parameterGroupName: parameterGroup.name,

      port: 6379,

      snapshotRetentionLimit: environment === "prod" ? 5 : 0,
      snapshotWindow: "03:00-05:00",
      maintenanceWindow: "mon:05:00-mon:06:00",

      tags: {
        ...config.tags,
        Name: `${name}-redis`,
      },
    })
  );

  return {
    cluster: pulumi.output(cluster) as any,
    subnetGroup: pulumi.output(subnetGroup) as any,
    securityGroup,
    endpoint: pulumi.output(cluster).apply(c => c.cacheNodes[0].address),
    port: pulumi.output(6379),
  };
}

export const cache = {
  createElastiCache,
};
