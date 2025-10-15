/**
 * Test runner for prompts with AI tools
 */

import { PackageType, TestResult, TestCase } from '../types';
import { testPromptWithTool, CLIResult } from './cli-bridge';
import { getRoleScenarios, detectRoleFromPrompt } from './role-scenarios';
import { promises as fs } from 'fs';

export interface TestScenario {
  name: string;
  description: string;
  context: string;
  files?: string[];
  expectedPatterns?: string[];
  timeout?: number;
}

export interface TestRunOptions {
  tool: PackageType;
  scenarios?: TestScenario[];
  role?: string;
  autoDetectRole?: boolean;
  verbose?: boolean;
  isolated?: boolean;
}

/**
 * Load test scenarios from a file
 */
export async function loadTestScenarios(
  scenarioPath: string
): Promise<TestScenario[]> {
  try {
    const content = await fs.readFile(scenarioPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Failed to load scenarios: ${error}`);
  }
}

/**
 * Create default test scenarios
 */
export function createDefaultScenarios(role?: string): TestScenario[] {
  // Use role-specific scenarios if available
  if (role) {
    const roleScenarios = getRoleScenarios(role);
    if (roleScenarios) {
      return roleScenarios;
    }
  }

  // Fall back to generic scenarios
  return [
    {
      name: 'Basic Validation',
      description: 'Test if prompt is loaded correctly',
      context: 'Verify that you understand the instructions in this prompt.',
    },
    {
      name: 'Code Review Scenario',
      description: 'Test prompt on a code review task',
      context:
        'Review this function for potential issues:\n\nfunction add(a, b) { return a + b; }',
    },
    {
      name: 'Explanation Scenario',
      description: 'Test prompt on explaining code',
      context:
        'Explain what this code does:\n\nconst result = arr.map(x => x * 2);',
    },
  ];
}

/**
 * Run a single test scenario
 */
async function runScenario(
  promptPath: string,
  tool: PackageType,
  scenario: TestScenario,
  options: { verbose?: boolean; isolated?: boolean }
): Promise<TestCase> {
  const startTime = Date.now();

  try {
    const result: CLIResult = await testPromptWithTool(promptPath, tool, {
      context: scenario.context,
      files: scenario.files,
      isolated: options.isolated,
      timeout: scenario.timeout,
    });

    // Check expected patterns if provided
    let passed = result.success;
    let error = result.error;

    if (result.success && scenario.expectedPatterns) {
      const missingPatterns = scenario.expectedPatterns.filter(
        (pattern) => !result.output.includes(pattern)
      );

      if (missingPatterns.length > 0) {
        passed = false;
        error = `Missing expected patterns: ${missingPatterns.join(', ')}`;
      }
    }

    return {
      name: scenario.name,
      passed,
      error,
      duration: Date.now() - startTime,
    };
  } catch (err) {
    return {
      name: scenario.name,
      passed: false,
      error: err instanceof Error ? err.message : String(err),
      duration: Date.now() - startTime,
    };
  }
}

/**
 * Run all test scenarios for a prompt
 */
export async function runTests(
  promptPath: string,
  options: TestRunOptions
): Promise<TestResult> {
  let role = options.role;

  // Auto-detect role if enabled
  if (!role && options.autoDetectRole) {
    const content = await fs.readFile(promptPath, 'utf-8');
    role = detectRoleFromPrompt(promptPath, content) || undefined;
    if (role && options.verbose) {
      console.log(`🎯 Auto-detected role: ${role}`);
    }
  }

  const scenarios =
    options.scenarios && options.scenarios.length > 0
      ? options.scenarios
      : createDefaultScenarios(role);

  if (role && options.verbose) {
    console.log(`📋 Using ${scenarios.length} ${role} test scenarios`);
  }

  console.log(`\n🧪 Running ${scenarios.length} test scenarios...`);

  const testCases: TestCase[] = [];

  for (const scenario of scenarios) {
    if (options.verbose) {
      console.log(`\n  📋 ${scenario.name}: ${scenario.description}`);
    }

    const testCase = await runScenario(promptPath, options.tool, scenario, {
      verbose: options.verbose,
      isolated: options.isolated,
    });

    testCases.push(testCase);

    const status = testCase.passed ? '✅' : '❌';
    const duration = ((testCase.duration ?? 0) / 1000).toFixed(2);
    console.log(`  ${status} ${scenario.name} (${duration}s)`);

    if (!testCase.passed && testCase.error) {
      console.log(`     Error: ${testCase.error}`);
    }
  }

  const passedTests = testCases.filter((tc) => tc.passed).length;

  return {
    passed: passedTests === testCases.length,
    totalTests: testCases.length,
    passedTests,
    failedTests: testCases.length - passedTests,
    testCases,
  };
}

/**
 * Calculate effectiveness score (0-100)
 */
export function calculateEffectivenessScore(result: TestResult): number {
  if (result.totalTests === 0) return 0;

  const passRate = result.passedTests / result.totalTests;
  let score = passRate * 100;

  // Bonus for all passing
  if (result.passedTests === result.totalTests) {
    score = 100;
  }

  // Penalty for very slow tests (average > 30s)
  const avgDuration =
    result.testCases.reduce((sum, tc) => sum + (tc.duration ?? 0), 0) /
    result.totalTests;

  if (avgDuration > 30000) {
    score -= 10;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Generate test report
 */
export function generateTestReport(
  promptPath: string,
  tool: PackageType,
  result: TestResult
): string {
  const score = calculateEffectivenessScore(result);
  const status = result.passed ? '✅ PASSED' : '❌ FAILED';

  let report = `
╔════════════════════════════════════════════════════════════════╗
║                      TEST REPORT                               ║
╠════════════════════════════════════════════════════════════════╣
║ Prompt:      ${promptPath.padEnd(48)} ║
║ Tool:        ${tool.padEnd(48)} ║
║ Status:      ${status.padEnd(48)} ║
║ Score:       ${score}/100 ${getScoreEmoji(score).padEnd(42)} ║
╠════════════════════════════════════════════════════════════════╣
║ Total Tests:    ${result.totalTests.toString().padEnd(44)} ║
║ Passed:         ${result.passedTests.toString().padEnd(44)} ║
║ Failed:         ${result.failedTests.toString().padEnd(44)} ║
╠════════════════════════════════════════════════════════════════╣
`;

  // Add individual test results
  report += '║ TEST RESULTS:                                                  ║\n';
  result.testCases.forEach((tc, index) => {
    const status = tc.passed ? '✅' : '❌';
    const duration = tc.duration ? `${(tc.duration / 1000).toFixed(2)}s` : 'N/A';
    const line = `  ${index + 1}. ${status} ${tc.name} (${duration})`;
    report += `║ ${line.padEnd(62)} ║\n`;

    if (!tc.passed && tc.error) {
      const errorLine = `     Error: ${tc.error.substring(0, 45)}`;
      report += `║ ${errorLine.padEnd(62)} ║\n`;
    }
  });

  report += '╚════════════════════════════════════════════════════════════════╝\n';

  return report;
}

/**
 * Get emoji for score
 */
function getScoreEmoji(score: number): string {
  if (score >= 90) return '🌟';
  if (score >= 75) return '✨';
  if (score >= 60) return '👍';
  if (score >= 40) return '⚠️';
  return '❗';
}
