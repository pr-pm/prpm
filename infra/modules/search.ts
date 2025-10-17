/**
 * Search Module - AWS OpenSearch (Optional, Phase 2)
 */

import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { VpcResources } from "./network";

export interface SearchConfig {
  vpc: VpcResources;
  instanceType: string;
  volumeSize: number;
  tags: Record<string, string>;
}

export interface SearchResources {
  domain: aws.opensearch.Domain;
  securityGroup: aws.ec2.SecurityGroup;
  endpoint: pulumi.Output<string>;
  kibanaEndpoint: pulumi.Output<string>;
}

function createOpenSearch(
  projectName: string,
  environment: string,
  config: SearchConfig
): SearchResources {
  const name = `${projectName}-${environment}`;

  // Create security group for OpenSearch
  const securityGroup = new aws.ec2.SecurityGroup(`${name}-opensearch-sg`, {
    vpcId: config.vpc.vpc.id,
    description: "Security group for PRMP OpenSearch",
    ingress: [
      {
        protocol: "tcp",
        fromPort: 443,
        toPort: 443,
        cidrBlocks: ["10.0.0.0/16"],
        description: "HTTPS from VPC",
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
      Name: `${name}-opensearch-sg`,
    },
  });

  // Create OpenSearch domain
  const domain = pulumi.output(config.vpc.privateSubnets).apply(subnets =>
    new aws.opensearch.Domain(`${name}-search`, {
      domainName: `${name}-search`,
      engineVersion: "OpenSearch_2.11",

      clusterConfig: {
        instanceType: config.instanceType,
        instanceCount: 1,
        dedicatedMasterEnabled: false,
        zoneAwarenessEnabled: false,
      },

      ebsOptions: {
        ebsEnabled: true,
        volumeType: "gp3",
        volumeSize: config.volumeSize,
      },

      vpcOptions: {
        subnetIds: [subnets[0].id],
        securityGroupIds: [securityGroup.id],
      },

      encryptAtRest: {
        enabled: true,
      },

      nodeToNodeEncryption: {
        enabled: true,
      },

      domainEndpointOptions: {
        enforceHttps: true,
        tlsSecurityPolicy: "Policy-Min-TLS-1-2-2019-07",
      },

      advancedSecurityOptions: {
        enabled: true,
        internalUserDatabaseEnabled: false,
        masterUserOptions: {
          masterUserArn: aws.getCallerIdentity().then(id => `arn:aws:iam::${id.accountId}:root`),
        },
      },

      accessPolicies: aws.getCallerIdentity().then(id =>
        JSON.stringify({
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Principal: {
                AWS: "*",
              },
              Action: "es:*",
              Resource: `arn:aws:es:*:${id.accountId}:domain/${name}-search/*`,
            },
          ],
        })
      ),

      tags: {
        ...config.tags,
        Name: `${name}-search`,
      },
    })
  );

  return {
    domain: pulumi.output(domain) as any,
    securityGroup,
    endpoint: pulumi.output(domain).apply(d => d.endpoint),
    kibanaEndpoint: pulumi.output(domain).apply(d => d.kibanaEndpoint),
  };
}

export const search = {
  createOpenSearch,
};
