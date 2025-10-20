/**
 * Network Module - VPC, Subnets, Internet Gateway, NAT Gateway
 */

import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";

export interface VpcResources {
  vpc: aws.ec2.Vpc;
  publicSubnets: aws.ec2.Subnet[];
  privateSubnets: aws.ec2.Subnet[];
  internetGateway: aws.ec2.InternetGateway;
  natGateway: aws.ec2.NatGateway;
  publicRouteTable: aws.ec2.RouteTable;
  privateRouteTable: aws.ec2.RouteTable;
}

function createVpc(
  projectName: string,
  environment: string,
  tags: Record<string, string>
): VpcResources {
  const name = `${projectName}-${environment}`;

  // Get availability zones
  const azs = aws.getAvailabilityZones({
    state: "available",
  });

  // Create VPC
  const vpc = new aws.ec2.Vpc(`${name}-vpc`, {
    cidrBlock: "10.0.0.0/16",
    enableDnsHostnames: true,
    enableDnsSupport: true,
    tags: {
      ...tags,
      Name: `${name}-vpc`,
    },
  });

  // Create Internet Gateway
  const igw = new aws.ec2.InternetGateway(`${name}-igw`, {
    vpcId: vpc.id,
    tags: {
      ...tags,
      Name: `${name}-igw`,
    },
  });

  // Create public subnets (for ALB)
  const publicSubnets = azs.then(azs =>
    azs.names.slice(0, 2).map((az, i) =>
      new aws.ec2.Subnet(`${name}-public-subnet-${i + 1}`, {
        vpcId: vpc.id,
        cidrBlock: `10.0.${i + 1}.0/24`,
        availabilityZone: az,
        mapPublicIpOnLaunch: true,
        tags: {
          ...tags,
          Name: `${name}-public-subnet-${i + 1}`,
          Type: "public",
        },
      })
    )
  );

  // Create private subnets (for ECS, RDS, Redis)
  const privateSubnets = azs.then(azs =>
    azs.names.slice(0, 2).map((az, i) =>
      new aws.ec2.Subnet(`${name}-private-subnet-${i + 1}`, {
        vpcId: vpc.id,
        cidrBlock: `10.0.${i + 10}.0/24`,
        availabilityZone: az,
        tags: {
          ...tags,
          Name: `${name}-private-subnet-${i + 1}`,
          Type: "private",
        },
      })
    )
  );

  // Allocate Elastic IP for NAT Gateway
  const eip = new aws.ec2.Eip(`${name}-nat-eip`, {
    domain: "vpc",
    tags: {
      ...tags,
      Name: `${name}-nat-eip`,
    },
  });

  // Create NAT Gateway in first public subnet
  const natGateway = pulumi.all([publicSubnets]).apply(([subnets]) =>
    new aws.ec2.NatGateway(`${name}-nat`, {
      subnetId: subnets[0].id,
      allocationId: eip.id,
      tags: {
        ...tags,
        Name: `${name}-nat`,
      },
    })
  );

  // Create public route table
  const publicRouteTable = new aws.ec2.RouteTable(`${name}-public-rt`, {
    vpcId: vpc.id,
    routes: [
      {
        cidrBlock: "0.0.0.0/0",
        gatewayId: igw.id,
      },
    ],
    tags: {
      ...tags,
      Name: `${name}-public-rt`,
    },
  });

  // Associate public subnets with public route table
  pulumi.all([publicSubnets]).apply(([subnets]) =>
    subnets.forEach((subnet, i) =>
      new aws.ec2.RouteTableAssociation(`${name}-public-rta-${i + 1}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      })
    )
  );

  // Create private route table
  const privateRouteTable = natGateway.id.apply(natId =>
    new aws.ec2.RouteTable(`${name}-private-rt`, {
      vpcId: vpc.id,
      routes: [
        {
          cidrBlock: "0.0.0.0/0",
          natGatewayId: natId,
        },
      ],
      tags: {
        ...tags,
        Name: `${name}-private-rt`,
      },
    })
  );

  // Associate private subnets with private route table
  pulumi.all([privateSubnets, privateRouteTable]).apply(([subnets, rt]) =>
    subnets.forEach((subnet, i) =>
      new aws.ec2.RouteTableAssociation(`${name}-private-rta-${i + 1}`, {
        subnetId: subnet.id,
        routeTableId: rt.id,
      })
    )
  );

  return {
    vpc,
    publicSubnets: pulumi.output(publicSubnets),
    privateSubnets: pulumi.output(privateSubnets),
    internetGateway: igw,
    natGateway: pulumi.output(natGateway),
    publicRouteTable,
    privateRouteTable: pulumi.output(privateRouteTable),
  } 
}

export const network = {
  createVpc,
};
