/**
 * Monitoring Module - CloudWatch Alarms
 */

import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export interface MonitoringConfig {
  ecsClusterName: pulumi.Output<string>;
  ecsServiceName: pulumi.Output<string>;
  albArn: pulumi.Output<string>;
  dbInstanceId: pulumi.Output<string>;
  tags: Record<string, string>;
}

export interface MonitoringResources {
  ecsHighCpuAlarm: aws.cloudwatch.MetricAlarm;
  ecsHighMemoryAlarm: aws.cloudwatch.MetricAlarm;
  albTargetResponseTimeAlarm: aws.cloudwatch.MetricAlarm;
  albUnhealthyTargetAlarm: aws.cloudwatch.MetricAlarm;
  rdsHighCpuAlarm: aws.cloudwatch.MetricAlarm;
  rdsLowStorageAlarm: aws.cloudwatch.MetricAlarm;
}

function createAlarms(
  projectName: string,
  environment: string,
  config: MonitoringConfig
): MonitoringResources {
  const name = `${projectName}-${environment}`;

  // ECS high CPU alarm
  const ecsHighCpuAlarm = pulumi
    .all([config.ecsClusterName, config.ecsServiceName])
    .apply(([clusterName, serviceName]) =>
      new aws.cloudwatch.MetricAlarm(`${name}-ecs-high-cpu`, {
        name: `${name}-ecs-high-cpu`,
        comparisonOperator: "GreaterThanThreshold",
        evaluationPeriods: 2,
        metricName: "CPUUtilization",
        namespace: "AWS/ECS",
        period: 300,
        statistic: "Average",
        threshold: 80,
        alarmDescription: "ECS CPU utilization is above 80%",
        dimensions: {
          ClusterName: clusterName,
          ServiceName: serviceName,
        },
        tags: config.tags,
      })
    );

  // ECS high memory alarm
  const ecsHighMemoryAlarm = pulumi
    .all([config.ecsClusterName, config.ecsServiceName])
    .apply(([clusterName, serviceName]) =>
      new aws.cloudwatch.MetricAlarm(`${name}-ecs-high-memory`, {
        name: `${name}-ecs-high-memory`,
        comparisonOperator: "GreaterThanThreshold",
        evaluationPeriods: 2,
        metricName: "MemoryUtilization",
        namespace: "AWS/ECS",
        period: 300,
        statistic: "Average",
        threshold: 80,
        alarmDescription: "ECS memory utilization is above 80%",
        dimensions: {
          ClusterName: clusterName,
          ServiceName: serviceName,
        },
        tags: config.tags,
      })
    );

  // ALB target response time
  const albTargetResponseTimeAlarm = config.albArn.apply(arn => {
    const albName = arn.split("/").slice(-3).join("/");
    return new aws.cloudwatch.MetricAlarm(`${name}-alb-response-time`, {
      name: `${name}-alb-response-time`,
      comparisonOperator: "GreaterThanThreshold",
      evaluationPeriods: 2,
      metricName: "TargetResponseTime",
      namespace: "AWS/ApplicationELB",
      period: 300,
      statistic: "Average",
      threshold: 1, // 1 second
      alarmDescription: "ALB target response time is above 1 second",
      dimensions: {
        LoadBalancer: albName,
      },
      tags: config.tags,
    });
  });

  // ALB unhealthy target count
  const albUnhealthyTargetAlarm = config.albArn.apply(arn => {
    const albName = arn.split("/").slice(-3).join("/");
    return new aws.cloudwatch.MetricAlarm(`${name}-alb-unhealthy-targets`, {
      name: `${name}-alb-unhealthy-targets`,
      comparisonOperator: "GreaterThanThreshold",
      evaluationPeriods: 1,
      metricName: "UnHealthyHostCount",
      namespace: "AWS/ApplicationELB",
      period: 60,
      statistic: "Average",
      threshold: 0,
      alarmDescription: "ALB has unhealthy targets",
      dimensions: {
        LoadBalancer: albName,
      },
      tags: config.tags,
    });
  });

  // RDS high CPU alarm
  const rdsHighCpuAlarm = config.dbInstanceId.apply(
    dbId =>
      new aws.cloudwatch.MetricAlarm(`${name}-rds-high-cpu`, {
        name: `${name}-rds-high-cpu`,
        comparisonOperator: "GreaterThanThreshold",
        evaluationPeriods: 2,
        metricName: "CPUUtilization",
        namespace: "AWS/RDS",
        period: 300,
        statistic: "Average",
        threshold: 80,
        alarmDescription: "RDS CPU utilization is above 80%",
        dimensions: {
          DBInstanceIdentifier: dbId,
        },
        tags: config.tags,
      })
  );

  // RDS low storage alarm
  const rdsLowStorageAlarm = config.dbInstanceId.apply(
    dbId =>
      new aws.cloudwatch.MetricAlarm(`${name}-rds-low-storage`, {
        name: `${name}-rds-low-storage`,
        comparisonOperator: "LessThanThreshold",
        evaluationPeriods: 1,
        metricName: "FreeStorageSpace",
        namespace: "AWS/RDS",
        period: 300,
        statistic: "Average",
        threshold: 2147483648, // 2GB in bytes
        alarmDescription: "RDS free storage space is below 2GB",
        dimensions: {
          DBInstanceIdentifier: dbId,
        },
        tags: config.tags,
      })
  );

  return {
    ecsHighCpuAlarm: pulumi.output(ecsHighCpuAlarm) as any,
    ecsHighMemoryAlarm: pulumi.output(ecsHighMemoryAlarm) as any,
    albTargetResponseTimeAlarm: pulumi.output(albTargetResponseTimeAlarm) as any,
    albUnhealthyTargetAlarm: pulumi.output(albUnhealthyTargetAlarm) as any,
    rdsHighCpuAlarm: pulumi.output(rdsHighCpuAlarm) as any,
    rdsLowStorageAlarm: pulumi.output(rdsLowStorageAlarm) as any,
  };
}

export const monitoring = {
  createAlarms,
};
