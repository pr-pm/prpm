/**
 * Infrastructure Validation Utilities
 * Validates configuration and catches issues before deployment
 */

import * as pulumi from "@pulumi/pulumi";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate database configuration
 */
export function validateDatabaseConfig(config: {
  username: string;
  password: pulumi.Output<string>;
  instanceClass: string;
  allocatedStorage: number;
}): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate username
  if (!config.username || config.username.length < 3) {
    errors.push("Database username must be at least 3 characters");
  }

  if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(config.username)) {
    errors.push("Database username must start with a letter and contain only alphanumeric characters and underscores");
  }

  // Validate instance class
  const validInstanceClasses = [
    "db.t4g.micro",
    "db.t4g.small",
    "db.t4g.medium",
    "db.t3.micro",
    "db.t3.small",
    "db.t3.medium",
    "db.r6g.large",
    "db.r6g.xlarge",
  ];

  if (!validInstanceClasses.includes(config.instanceClass)) {
    warnings.push(`Instance class '${config.instanceClass}' is not in the common list. Valid: ${validInstanceClasses.join(", ")}`);
  }

  // Validate storage
  if (config.allocatedStorage < 20) {
    errors.push("Allocated storage must be at least 20 GB for PostgreSQL");
  }

  if (config.allocatedStorage > 65536) {
    errors.push("Allocated storage cannot exceed 65536 GB");
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Validate ECS configuration
 */
export function validateEcsConfig(config: {
  cpu: number;
  memory: number;
  desiredCount: number;
  image: string;
}): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Valid Fargate CPU/Memory combinations
  const validCombinations: Record<number, number[]> = {
    256: [512, 1024, 2048],
    512: [1024, 2048, 3072, 4096],
    1024: [2048, 3072, 4096, 5120, 6144, 7168, 8192],
    2048: [4096, 5120, 6144, 7168, 8192, 9216, 10240, 11264, 12288, 13312, 14336, 15360, 16384],
    4096: [8192, 9216, 10240, 11264, 12288, 13312, 14336, 15360, 16384, 17408, 18432, 19456, 20480, 21504, 22528, 23552, 24576, 25600, 26624, 27648, 28672, 29696, 30720],
  };

  if (!validCombinations[config.cpu]) {
    errors.push(`Invalid CPU value: ${config.cpu}. Must be one of: ${Object.keys(validCombinations).join(", ")}`);
  } else if (!validCombinations[config.cpu].includes(config.memory)) {
    errors.push(
      `Invalid memory ${config.memory} for CPU ${config.cpu}. Valid values: ${validCombinations[config.cpu].join(", ")}`
    );
  }

  // Validate desired count
  if (config.desiredCount < 1) {
    errors.push("Desired count must be at least 1");
  }

  if (config.desiredCount > 10) {
    warnings.push("Desired count > 10 may incur significant costs. Consider using auto-scaling instead.");
  }

  // Validate image
  if (!config.image) {
    errors.push("Container image is required");
  }

  if (config.image && !config.image.includes(":")) {
    warnings.push("Container image should include a tag (e.g., 'image:latest')");
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Validate network configuration
 */
export function validateNetworkConfig(params: {
  availabilityZoneCount: number;
  cidrBlock: string;
}): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate AZ count
  if (params.availabilityZoneCount < 2) {
    errors.push("At least 2 availability zones required for high availability");
  }

  if (params.availabilityZoneCount > 3) {
    warnings.push("More than 3 AZs may not be necessary and increases costs (NAT Gateway per AZ)");
  }

  // Validate CIDR block
  const cidrRegex = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;
  if (!cidrRegex.test(params.cidrBlock)) {
    errors.push("Invalid CIDR block format. Expected format: 10.0.0.0/16");
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Validate S3 bucket configuration
 */
export function validateStorageConfig(params: {
  bucketName: string;
  versioning: boolean;
  encryption: boolean;
}): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate bucket name
  const bucketNameRegex = /^[a-z0-9][a-z0-9.-]*[a-z0-9]$/;
  if (!bucketNameRegex.test(params.bucketName)) {
    errors.push("Bucket name must start and end with lowercase letter or number, and contain only lowercase letters, numbers, hyphens, and periods");
  }

  if (params.bucketName.length < 3 || params.bucketName.length > 63) {
    errors.push("Bucket name must be between 3 and 63 characters");
  }

  if (params.bucketName.includes("..")) {
    errors.push("Bucket name cannot contain consecutive periods");
  }

  // Validate security settings
  if (!params.versioning) {
    warnings.push("Versioning is disabled. Consider enabling for data protection.");
  }

  if (!params.encryption) {
    errors.push("Encryption must be enabled for production buckets");
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Validate Redis/ElastiCache configuration
 */
export function validateCacheConfig(params: {
  nodeType: string;
  numCacheNodes: number;
}): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate node type
  const validNodeTypes = [
    "cache.t4g.micro",
    "cache.t4g.small",
    "cache.t4g.medium",
    "cache.t3.micro",
    "cache.t3.small",
    "cache.t3.medium",
    "cache.r6g.large",
    "cache.r6g.xlarge",
  ];

  if (!validNodeTypes.includes(params.nodeType)) {
    warnings.push(`Node type '${params.nodeType}' is not in the common list. Valid: ${validNodeTypes.join(", ")}`);
  }

  // Validate number of nodes
  if (params.numCacheNodes < 1) {
    errors.push("Number of cache nodes must be at least 1");
  }

  if (params.numCacheNodes === 1) {
    warnings.push("Single cache node has no redundancy. Consider using 2+ nodes for production.");
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Validate overall stack configuration
 */
export function validateStackConfig(params: {
  environment: string;
  region: string;
  projectName: string;
}): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate environment
  const validEnvironments = ["dev", "staging", "prod"];
  if (!validEnvironments.includes(params.environment)) {
    errors.push(`Environment must be one of: ${validEnvironments.join(", ")}`);
  }

  // Validate region
  const commonRegions = [
    "us-east-1", "us-east-2", "us-west-1", "us-west-2",
    "eu-west-1", "eu-west-2", "eu-central-1",
    "ap-southeast-1", "ap-southeast-2", "ap-northeast-1",
  ];

  if (!commonRegions.includes(params.region)) {
    warnings.push(`Region '${params.region}' is not in the common list. Verify it supports all required services.`);
  }

  // Validate project name
  if (!params.projectName || params.projectName.length < 2) {
    errors.push("Project name must be at least 2 characters");
  }

  if (!/^[a-z0-9-]+$/.test(params.projectName)) {
    errors.push("Project name must contain only lowercase letters, numbers, and hyphens");
  }

  return { valid: errors.length === 0, errors, warnings };
}

/**
 * Print validation results
 */
export function printValidationResults(category: string, result: ValidationResult): void {
  if (result.errors.length > 0) {
    console.error(`\n❌ ${category} - ERRORS:`);
    result.errors.forEach(err => console.error(`   - ${err}`));
  }

  if (result.warnings.length > 0) {
    console.warn(`\n⚠️  ${category} - WARNINGS:`);
    result.warnings.forEach(warn => console.warn(`   - ${warn}`));
  }

  if (result.valid && result.warnings.length === 0) {
    console.log(`\n✅ ${category} - Valid`);
  }
}

/**
 * Run all validations and throw if any fail
 */
export function validateAll(validations: Array<{ category: string; result: ValidationResult }>): void {
  console.log("\n🔍 Running infrastructure validation...\n");

  let hasErrors = false;

  validations.forEach(({ category, result }) => {
    printValidationResults(category, result);
    if (!result.valid) {
      hasErrors = true;
    }
  });

  if (hasErrors) {
    console.error("\n❌ Validation failed. Fix the errors above before deploying.\n");
    throw new Error("Infrastructure validation failed");
  }

  console.log("\n✅ All validations passed!\n");
}
