/**
 * Database Module - RDS PostgreSQL
 */

import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { VpcResources } from "./network";

export interface DatabaseConfig {
  vpc: VpcResources;
  username: string;
  password: pulumi.Output<string>;
  instanceClass: string;
  allocatedStorage: number;
  tags: Record<string, string>;
  bastionSecurityGroupId?: pulumi.Output<string>;
}

export interface DatabaseResources {
  instance: pulumi.Output<aws.rds.Instance>;
  subnetGroup: pulumi.Output<aws.rds.SubnetGroup>;
  securityGroup: aws.ec2.SecurityGroup;
  endpoint: pulumi.Output<string>;
  port: pulumi.Output<number>;
}

function createRdsPostgres(
  projectName: string,
  environment: string,
  config: DatabaseConfig
): DatabaseResources {
  const name = `${projectName}-${environment}`;

  // Create DB subnet group
  const subnetGroup = pulumi.output(config.vpc.privateSubnets).apply(subnets =>
    new aws.rds.SubnetGroup(`${name}-db-subnet`, {
      subnetIds: subnets.map(s => s.id),
      tags: {
        ...config.tags,
        Name: `${name}-db-subnet`,
      },
    })
  );

  // Create security group for RDS
  const securityGroup = new aws.ec2.SecurityGroup(`${name}-rds-sg`, {
    vpcId: config.vpc.vpc.id,
    description: "Security group for PRMP RDS PostgreSQL",
    ingress: [
      {
        protocol: "tcp",
        fromPort: 5432,
        toPort: 5432,
        cidrBlocks: ["10.0.0.0/16"], // Allow from VPC
        description: "PostgreSQL from VPC",
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
      Name: `${name}-rds-sg`,
    },
  });

  // Add ingress rule to allow bastion host access if provided
  if (config.bastionSecurityGroupId) {
    new aws.ec2.SecurityGroupRule(`${name}-rds-bastion-ingress`, {
      type: "ingress",
      securityGroupId: securityGroup.id,
      sourceSecurityGroupId: config.bastionSecurityGroupId,
      protocol: "tcp",
      fromPort: 5432,
      toPort: 5432,
      description: "PostgreSQL from bastion host",
    });
  }

  // Create parameter group for PostgreSQL 17
  const parameterGroup = new aws.rds.ParameterGroup(`${name}-db-params`, {
    family: "postgres17",
    parameters: [
      {
        name: "log_connections",
        value: "1",
      },
      {
        name: "log_disconnections",
        value: "1",
      },
      {
        name: "log_duration",
        value: "1",
      },
      // Note: shared_preload_libraries is a static parameter that requires DB reboot
      // Can be enabled later via AWS console if needed
    ],
    tags: {
      ...config.tags,
      Name: `${name}-db-params`,
    },
  });

  // Create RDS instance
  const instance = pulumi.all([subnetGroup]).apply(([sg]) =>
    new aws.rds.Instance(`${name}-db`, {
      identifier: `${name}-db`,
      engine: "postgres",
      engineVersion: "17.2",
      instanceClass: config.instanceClass,
      allocatedStorage: config.allocatedStorage,
      storageType: "gp3",
      storageEncrypted: true,

      dbName: "prpm_registry",
      username: config.username,
      password: config.password,

      dbSubnetGroupName: sg.name,
      vpcSecurityGroupIds: [securityGroup.id],
      parameterGroupName: parameterGroup.name,

      backupRetentionPeriod: 7,
      backupWindow: "03:00-04:00",
      maintenanceWindow: "mon:04:00-mon:05:00",

      enabledCloudwatchLogsExports: ["postgresql", "upgrade"],

      autoMinorVersionUpgrade: true,
      publiclyAccessible: false,
      skipFinalSnapshot: environment !== "prod",
      finalSnapshotIdentifier: environment === "prod" ? `${name}-db-final-snapshot` : undefined,

      tags: {
        ...config.tags,
        Name: `${name}-db`,
      },
    })
  );

  return {
    instance: pulumi.output(instance),
    subnetGroup: pulumi.output(subnetGroup),
    securityGroup,
    endpoint: pulumi.output(instance).apply(i => i.endpoint.apply(e => e.split(":")[0])),
    port: pulumi.output(instance).apply(i => i.port),
  };
}

export const database = {
  createRdsPostgres,
};
