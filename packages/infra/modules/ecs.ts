/**
 * ECS Module - Fargate, ALB, ECR
 */

import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as awsx from "@pulumi/awsx";
import { VpcResources } from "./network";

export interface EcsConfig {
  vpc: VpcResources;
  image: string;
  cpu: number;
  memory: number;
  desiredCount: number;
  domainName?: string;
  dbSecurityGroupId: pulumi.Output<string>;
  redisSecurityGroupId: pulumi.Output<string>;
  secretsArn: pulumi.Output<Record<string, string>>;
  s3BucketName: pulumi.Output<string>;
  tags: Record<string, string>;
}

export interface EcsResources {
  cluster: aws.ecs.Cluster;
  service: aws.ecs.Service;
  taskDefinition: aws.ecs.TaskDefinition;
  ecsSecurityGroup: aws.ec2.SecurityGroup;
  alb: aws.lb.LoadBalancer;
  targetGroup: aws.lb.TargetGroup;
  ecrRepo: aws.ecr.Repository;
  taskRole: aws.iam.Role;
  executionRole: aws.iam.Role;
  logGroup: aws.cloudwatch.LogGroup;
}

function createFargateService(
  projectName: string,
  environment: string,
  config: EcsConfig
): EcsResources {
  const name = `${projectName}-${environment}`;
  const region = aws.getRegionOutput().name;
  const accountId = aws.getCallerIdentityOutput().accountId;

  // Create ECR repository
  const ecrRepo = new aws.ecr.Repository(`${name}-registry`, {
    name: `${name}-registry`,
    imageScanningConfiguration: {
      scanOnPush: true,
    },
    encryptionConfigurations: [
      {
        encryptionType: "AES256",
      },
    ],
    tags: config.tags,
  });

  // ECR lifecycle policy
  new aws.ecr.LifecyclePolicy(`${name}-registry-lifecycle`, {
    repository: ecrRepo.name,
    policy: JSON.stringify({
      rules: [
        {
          rulePriority: 1,
          description: "Keep last 10 images",
          selection: {
            tagStatus: "any",
            countType: "imageCountMoreThan",
            countNumber: 10,
          },
          action: {
            type: "expire",
          },
        },
      ],
    }),
  });

  // Create CloudWatch log group
  const logGroup = new aws.cloudwatch.LogGroup(`${name}-logs`, {
    name: `/ecs/${name}`,
    retentionInDays: environment === "prod" ? 30 : 7,
    tags: config.tags,
  });

  // Create ECS cluster
  const cluster = new aws.ecs.Cluster(`${name}-cluster`, {
    name: `${name}-cluster`,
    settings: [
      {
        name: "containerInsights",
        value: "enabled",
      },
    ],
    tags: config.tags,
  });

  // Create IAM role for task execution (pulling images, writing logs)
  const executionRole = new aws.iam.Role(`${name}-execution-role`, {
    assumeRolePolicy: JSON.stringify({
      Version: "2012-10-17",
      Statement: [
        {
          Action: "sts:AssumeRole",
          Effect: "Allow",
          Principal: {
            Service: "ecs-tasks.amazonaws.com",
          },
        },
      ],
    }),
    tags: config.tags,
  });

  new aws.iam.RolePolicyAttachment(`${name}-execution-policy`, {
    role: executionRole.name,
    policyArn: "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy",
  });

  // Add Secrets Manager access to execution role
  new aws.iam.RolePolicy(`${name}-execution-secrets-policy`, {
    role: executionRole.id,
    policy: config.secretsArn.apply(arns =>
      JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: ["secretsmanager:GetSecretValue"],
            Resource: Object.values(arns),
          },
        ],
      })
    ),
  });

  // Create IAM role for task (accessing AWS services)
  const taskRole = new aws.iam.Role(`${name}-task-role`, {
    assumeRolePolicy: JSON.stringify({
      Version: "2012-10-17",
      Statement: [
        {
          Action: "sts:AssumeRole",
          Effect: "Allow",
          Principal: {
            Service: "ecs-tasks.amazonaws.com",
          },
        },
      ],
    }),
    tags: config.tags,
  });

  // Add S3 access policy
  new aws.iam.RolePolicy(`${name}-task-s3-policy`, {
    role: taskRole.id,
    policy: config.s3BucketName.apply(bucketName =>
      JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: [
              "s3:PutObject",
              "s3:GetObject",
              "s3:DeleteObject",
              "s3:ListBucket",
            ],
            Resource: [
              `arn:aws:s3:::${bucketName}`,
              `arn:aws:s3:::${bucketName}/*`,
            ],
          },
        ],
      })
    ),
  });

  // Create security group for ECS tasks
  const ecsSecurityGroup = new aws.ec2.SecurityGroup(`${name}-ecs-sg`, {
    vpcId: config.vpc.vpc.id,
    description: "Security group for PRMP ECS tasks",
    ingress: [
      {
        protocol: "tcp",
        fromPort: 3000,
        toPort: 3000,
        cidrBlocks: ["10.0.0.0/16"],
        description: "Allow from ALB",
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
      Name: `${name}-ecs-sg`,
    },
  });

  // Allow ECS to access RDS
  new aws.ec2.SecurityGroupRule(`${name}-ecs-to-rds`, {
    type: "ingress",
    fromPort: 5432,
    toPort: 5432,
    protocol: "tcp",
    sourceSecurityGroupId: ecsSecurityGroup.id,
    securityGroupId: config.dbSecurityGroupId,
    description: "Allow ECS to RDS",
  });

  // Allow ECS to access Redis
  new aws.ec2.SecurityGroupRule(`${name}-ecs-to-redis`, {
    type: "ingress",
    fromPort: 6379,
    toPort: 6379,
    protocol: "tcp",
    sourceSecurityGroupId: ecsSecurityGroup.id,
    securityGroupId: config.redisSecurityGroupId,
    description: "Allow ECS to Redis",
  });

  // Create Application Load Balancer
  const albSecurityGroup = new aws.ec2.SecurityGroup(`${name}-alb-sg`, {
    vpcId: config.vpc.vpc.id,
    description: "Security group for PRMP ALB",
    ingress: [
      {
        protocol: "tcp",
        fromPort: 80,
        toPort: 80,
        cidrBlocks: ["0.0.0.0/0"],
        description: "HTTP from internet",
      },
      {
        protocol: "tcp",
        fromPort: 443,
        toPort: 443,
        cidrBlocks: ["0.0.0.0/0"],
        description: "HTTPS from internet",
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
      Name: `${name}-alb-sg`,
    },
  });

  const alb = pulumi.output(config.vpc.publicSubnets).apply(subnets =>
    new aws.lb.LoadBalancer(`${name}-alb`, {
      name: `${name}-alb`,
      loadBalancerType: "application",
      securityGroups: [albSecurityGroup.id],
      subnets: subnets.map(s => s.id),
      enableHttp2: true,
      enableDeletionProtection: environment === "prod",
      tags: {
        ...config.tags,
        Name: `${name}-alb`,
      },
    })
  );

  // Create target group
  const targetGroup = new aws.lb.TargetGroup(`${name}-tg`, {
    name: `${name}-tg`,
    port: 3000,
    protocol: "HTTP",
    vpcId: config.vpc.vpc.id,
    targetType: "ip",
    healthCheck: {
      enabled: true,
      path: "/health",
      interval: 30,
      timeout: 5,
      healthyThreshold: 2,
      unhealthyThreshold: 3,
      matcher: "200",
    },
    deregistrationDelay: 30,
    tags: config.tags,
  });

  // Create HTTP listener (redirect to HTTPS if domain configured)
  pulumi.output(alb).apply(lb =>
    new aws.lb.Listener(`${name}-http-listener`, {
      loadBalancerArn: lb.arn,
      port: 80,
      protocol: "HTTP",
      defaultActions: [
        {
          type: "forward",
          targetGroupArn: targetGroup.arn,
        },
      ],
    })
  );

  // Create task definition
  const taskDefinition = pulumi
    .all([
      ecrRepo.repositoryUrl,
      accountId,
      region,
      config.secretsArn,
      config.s3BucketName,
    ])
    .apply(([repoUrl, accId, reg, secrets, bucket]) =>
      new aws.ecs.TaskDefinition(`${name}-task`, {
        family: `${name}-task`,
        networkMode: "awsvpc",
        requiresCompatibilities: ["FARGATE"],
        cpu: config.cpu.toString(),
        memory: config.memory.toString(),
        executionRoleArn: executionRole.arn,
        taskRoleArn: taskRole.arn,

        containerDefinitions: JSON.stringify([
          {
            name: "prpm-registry",
            image: `${repoUrl}:latest`,
            essential: true,
            portMappings: [
              {
                containerPort: 3000,
                protocol: "tcp",
              },
            ],
            environment: [
              { name: "NODE_ENV", value: environment },
              { name: "PORT", value: "3000" },
              { name: "HOST", value: "0.0.0.0" },
              { name: "SEARCH_ENGINE", value: "postgres" },
              { name: "AWS_REGION", value: reg },
              { name: "S3_BUCKET", value: bucket },
            ],
            secrets: [
              {
                name: "DATABASE_URL",
                valueFrom: `${secrets.database}:url::`,
              },
              {
                name: "REDIS_URL",
                valueFrom: `${secrets.redis}:url::`,
              },
              {
                name: "JWT_SECRET",
                valueFrom: secrets.jwt,
              },
              {
                name: "GITHUB_CLIENT_ID",
                valueFrom: `${secrets.github}:client_id::`,
              },
              {
                name: "GITHUB_CLIENT_SECRET",
                valueFrom: `${secrets.github}:client_secret::`,
              },
            ],
            logConfiguration: {
              logDriver: "awslogs",
              options: {
                "awslogs-group": logGroup.name,
                "awslogs-region": reg,
                "awslogs-stream-prefix": "ecs",
              },
            },
          },
        ]),

        tags: config.tags,
      })
    );

  // Create ECS service
  const service = pulumi
    .all([
      cluster.id,
      taskDefinition.arn,
      config.vpc.privateSubnets,
      alb,
    ])
    .apply(([clusterId, taskDefArn, subnets, lb]) =>
      new aws.ecs.Service(`${name}-service`, {
        name: `${name}-service`,
        cluster: clusterId,
        taskDefinition: taskDefArn,
        desiredCount: config.desiredCount,
        launchType: "FARGATE",

        networkConfiguration: {
          subnets: subnets.map(s => s.id),
          securityGroups: [ecsSecurityGroup.id],
          assignPublicIp: false,
        },

        loadBalancers: [
          {
            targetGroupArn: targetGroup.arn,
            containerName: "prpm-registry",
            containerPort: 3000,
          },
        ],

        healthCheckGracePeriodSeconds: 60,

        tags: config.tags,
      })
    );

  return {
    cluster,
    service: pulumi.output(service),
    taskDefinition: pulumi.output(taskDefinition),
    ecsSecurityGroup,
    alb: pulumi.output(alb),
    targetGroup,
    ecrRepo,
    taskRole,
    executionRole,
    logGroup,
  };
}

export const ecs = {
  createFargateService,
};
