/**
 * Secrets Module - AWS Secrets Manager
 */

import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export interface SecretsConfig {
  dbEndpoint: pulumi.Output<string>;
  dbUsername: string;
  dbPassword: pulumi.Output<string>;
  redisEndpoint: pulumi.Output<string>;
  githubClientId: pulumi.Output<string>;
  githubClientSecret: pulumi.Output<string>;
  tags: Record<string, string>;
}

export interface SecretsResources {
  secretsArn: pulumi.Output<Record<string, string>>;
  jwtSecret: aws.secretsmanager.Secret;
  dbSecret: aws.secretsmanager.Secret;
  redisSecret: aws.secretsmanager.Secret;
  githubSecret: aws.secretsmanager.Secret;
}

function createSecrets(
  projectName: string,
  environment: string,
  config: SecretsConfig
): SecretsResources {
  const name = `${projectName}-${environment}`;

  // Generate JWT secret
  const jwtSecret = new aws.secretsmanager.Secret(`${name}-jwt-secret`, {
    name: `${name}/jwt-secret`,
    description: "JWT secret for PRMP Registry",
    tags: config.tags,
  });

  const jwtSecretValue = new aws.secretsmanager.SecretVersion(`${name}-jwt-secret-value`, {
    secretId: jwtSecret.id,
    secretString: pulumi.output(
      // Generate random secret (in production, use a proper random generator)
      Buffer.from(Math.random().toString(36) + Math.random().toString(36))
        .toString("base64")
        .substring(0, 32)
    ),
  });

  // Database credentials
  const dbSecret = new aws.secretsmanager.Secret(`${name}-db-secret`, {
    name: `${name}/database`,
    description: "Database credentials for PRMP Registry",
    tags: config.tags,
  });

  const dbSecretValue = new aws.secretsmanager.SecretVersion(`${name}-db-secret-value`, {
    secretId: dbSecret.id,
    secretString: pulumi
      .all([config.dbEndpoint, config.dbPassword])
      .apply(([endpoint, password]) =>
        JSON.stringify({
          username: config.dbUsername,
          password: password,
          host: endpoint,
          port: "5432",
          database: "prpm_registry",
          url: `postgresql://${config.dbUsername}:${password}@${endpoint}:5432/prpm_registry`,
        })
      ),
  });

  // Redis connection
  const redisSecret = new aws.secretsmanager.Secret(`${name}-redis-secret`, {
    name: `${name}/redis`,
    description: "Redis connection for PRMP Registry",
    tags: config.tags,
  });

  const redisSecretValue = new aws.secretsmanager.SecretVersion(`${name}-redis-secret-value`, {
    secretId: redisSecret.id,
    secretString: config.redisEndpoint.apply(endpoint =>
      JSON.stringify({
        host: endpoint,
        port: "6379",
        url: `redis://${endpoint}:6379`,
      })
    ),
  });

  // GitHub OAuth credentials
  const githubSecret = new aws.secretsmanager.Secret(`${name}-github-secret`, {
    name: `${name}/github-oauth`,
    description: "GitHub OAuth credentials for PRMP Registry",
    tags: config.tags,
  });

  const githubSecretValue = new aws.secretsmanager.SecretVersion(`${name}-github-secret-value`, {
    secretId: githubSecret.id,
    secretString: pulumi
      .all([config.githubClientId, config.githubClientSecret])
      .apply(([clientId, clientSecret]) =>
        JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
        })
      ),
  });

  return {
    secretsArn: pulumi.output({
      jwt: jwtSecret.arn,
      database: dbSecret.arn,
      redis: redisSecret.arn,
      github: githubSecret.arn,
    }),
    jwtSecret,
    dbSecret,
    redisSecret,
    githubSecret,
  };
}

export const secrets = {
  createSecrets,
};
