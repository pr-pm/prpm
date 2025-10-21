/**
 * Bastion Host Module - EC2 instance for secure database access
 */

import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { VpcResources } from "./network";

export interface BastionConfig {
  vpc: VpcResources;
  keyName: string;
  tags: Record<string, string>;
}

export interface BastionResources {
  instance: pulumi.Output<aws.ec2.Instance>;
  securityGroup: aws.ec2.SecurityGroup;
  publicIp: pulumi.Output<string>;
}

function createBastionHost(
  projectName: string,
  environment: string,
  config: BastionConfig
): BastionResources {
  const name = `${projectName}-${environment}`;

  // Create security group for bastion host
  const securityGroup = new aws.ec2.SecurityGroup(`${name}-bastion-sg`, {
    vpcId: config.vpc.vpc.id,
    description: "Security group for bastion host",
    ingress: [
      {
        protocol: "tcp",
        fromPort: 22,
        toPort: 22,
        cidrBlocks: ["0.0.0.0/0"], // Allow SSH from anywhere (consider restricting to your IP)
        description: "SSH access",
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
      Name: `${name}-bastion-sg`,
    },
  });

  // Get the latest Amazon Linux 2023 AMI
  const ami = aws.ec2.getAmi({
    mostRecent: true,
    owners: ["amazon"],
    filters: [
      {
        name: "name",
        values: ["al2023-ami-*-x86_64"],
      },
      {
        name: "virtualization-type",
        values: ["hvm"],
      },
    ],
  });

  // Create bastion host instance
  const instance = pulumi.output(config.vpc.publicSubnets).apply(subnets =>
    ami.then(ami =>
      new aws.ec2.Instance(`${name}-bastion`, {
        instanceType: "t3.micro", // Very small instance, perfect for bastion
        ami: ami.id,
        keyName: config.keyName,
        subnetId: subnets[0].id, // Place in first public subnet
        vpcSecurityGroupIds: [securityGroup.id],
        associatePublicIpAddress: true,

        // User data to install PostgreSQL client
        userData: `#!/bin/bash
          yum update -y
          yum install -y postgresql15
          echo "Bastion host initialized" > /var/log/bastion-init.log
        `,

        tags: {
          ...config.tags,
          Name: `${name}-bastion`,
          Purpose: "Database Access",
        },
      })
    )
  );

  return {
    instance: pulumi.output(instance),
    securityGroup,
    publicIp: pulumi.output(instance).apply(i => i.publicIp),
  };
}

export const bastion = {
  createBastionHost,
};
