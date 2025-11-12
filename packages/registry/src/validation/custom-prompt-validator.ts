/**
 * Custom Prompt Validator
 *
 * SECURITY: Validates user-supplied prompts before playground execution
 * Prevents prompt injection, jailbreaks, and resource abuse
 */

export interface PromptValidationResult {
  safe: boolean;
  score: number; // 0-100, higher = safer
  issues: PromptIssue[];
  sanitizedPrompt?: string;
  recommendations?: string[];
}

export interface PromptIssue {
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: string;
  description: string;
  line?: number;
  suggestion?: string;
}

/**
 * Validate user-supplied custom prompt for playground use
 * SECURITY: Multi-stage validation with scoring system
 */
export function validateCustomPrompt(prompt: string): PromptValidationResult {
  const issues: PromptIssue[] = [];
  let score = 100; // Start perfect, deduct for issues

  // Stage 1: Critical patterns (auto-reject)
  const criticalIssues = checkCriticalPatterns(prompt);
  issues.push(...criticalIssues);
  score -= criticalIssues.length * 30; // -30 per critical issue

  // Stage 2: Jailbreak attempts
  const jailbreakIssues = checkJailbreakPatterns(prompt);
  issues.push(...jailbreakIssues);
  score -= jailbreakIssues.length * 20; // -20 per jailbreak

  // Stage 3: Resource abuse indicators
  const resourceIssues = checkResourceAbuse(prompt);
  issues.push(...resourceIssues);
  score -= resourceIssues.length * 15; // -15 per abuse pattern

  // Stage 4: Data exfiltration patterns
  const exfilIssues = checkExfiltrationPatterns(prompt);
  issues.push(...exfilIssues);
  score -= exfilIssues.length * 25; // -25 per exfil pattern

  // Stage 5: Structural issues
  const structuralIssues = checkStructuralIssues(prompt);
  issues.push(...structuralIssues);
  score -= structuralIssues.length * 5; // -5 per structural issue

  // Stage 6: Length and complexity
  const complexityIssues = checkComplexity(prompt);
  issues.push(...complexityIssues);
  score -= complexityIssues.length * 10; // -10 per complexity issue

  // Clamp score
  score = Math.max(0, Math.min(100, score));

  // Determine safety threshold
  const safe = score >= 70 && !issues.some(i => i.severity === 'critical');

  // Generate recommendations
  const recommendations = generateRecommendations(issues);

  // Optionally sanitize (remove dangerous sections)
  const sanitizedPrompt = safe ? prompt : sanitizePrompt(prompt, issues);

  return {
    safe,
    score,
    issues,
    sanitizedPrompt,
    recommendations,
  };
}

/**
 * Check for critical security patterns that auto-reject
 */
function checkCriticalPatterns(prompt: string): PromptIssue[] {
  const issues: PromptIssue[] = [];
  const lowerPrompt = prompt.toLowerCase();

  const criticalPatterns = [
    {
      pattern: /ignore\s+all\s+(previous|above|prior)\s+(instructions|rules|constraints)/i,
      type: 'instruction_override',
      description: 'Attempts to override system instructions',
    },
    {
      pattern: /system\s*(override|bypass|disable)/i,
      type: 'system_bypass',
      description: 'Attempts to bypass security systems',
    },
    {
      pattern: /(disable|turn\s+off|remove)\s+(safety|security|restrictions)/i,
      type: 'safety_disable',
      description: 'Attempts to disable safety features',
    },
    {
      pattern: /you\s+are\s+now\s+(in\s+)?(developer|admin|god|debug)\s+mode/i,
      type: 'mode_switching',
      description: 'Attempts unauthorized mode switching',
    },
    {
      pattern: /<\s*script|javascript:|on\w+\s*=/i,
      type: 'code_injection',
      description: 'Contains potential code injection',
    },
  ];

  for (const { pattern, type, description } of criticalPatterns) {
    if (pattern.test(prompt)) {
      issues.push({
        severity: 'critical',
        type,
        description,
        suggestion: 'Remove this pattern to use custom prompts',
      });
    }
  }

  return issues;
}

/**
 * Check for jailbreak patterns
 */
function checkJailbreakPatterns(prompt: string): PromptIssue[] {
  const issues: PromptIssue[] = [];

  const jailbreakPatterns = [
    {
      pattern: /pretend|imagine|roleplay.*?(no\s+rules|no\s+restrictions|unrestricted)/i,
      type: 'roleplay_jailbreak',
      description: 'Uses roleplay to attempt jailbreak',
    },
    {
      pattern: /for\s+(educational|research|testing)\s+purposes,?\s+(ignore|bypass)/i,
      type: 'fake_justification',
      description: 'Uses false justification to bypass rules',
    },
    {
      pattern: /(forget|disregard|ignore)\s+everything/i,
      type: 'instruction_reset',
      description: 'Attempts to reset instructions',
    },
    {
      pattern: /new\s+(instructions|rules|guidelines)\s*:/i,
      type: 'instruction_injection',
      description: 'Injects new instructions',
    },
    {
      pattern: /\[SYSTEM\]|\[ADMIN\]|\[ROOT\]/i,
      type: 'fake_system_tag',
      description: 'Uses fake system tags',
    },
  ];

  for (const { pattern, type, description } of jailbreakPatterns) {
    if (pattern.test(prompt)) {
      issues.push({
        severity: 'high',
        type,
        description,
        suggestion: 'Rephrase without bypassing techniques',
      });
    }
  }

  return issues;
}

/**
 * Check for resource abuse patterns
 */
function checkResourceAbuse(prompt: string): PromptIssue[] {
  const issues: PromptIssue[] = [];

  const abusePatterns = [
    {
      pattern: /(spawn|create|launch)\s+\d+\s+(agents?|tasks?|processes?)/i,
      type: 'mass_spawning',
      description: 'Instructs mass agent/task spawning',
    },
    {
      pattern: /fetch\s+\d+\s+URLs?|download\s+\d+\s+files?/i,
      type: 'mass_fetching',
      description: 'Instructs mass URL fetching',
    },
    {
      pattern: /infinite\s+(loop|recursion)|while\s+true/i,
      type: 'infinite_execution',
      description: 'Contains infinite loop patterns',
    },
    {
      pattern: /repeat\s+\d{3,}\s+times|for\s+each\s+of\s+\d{3,}/i,
      type: 'excessive_repetition',
      description: 'Excessive repetition (100+ iterations)',
    },
  ];

  for (const { pattern, type, description } of abusePatterns) {
    if (pattern.test(prompt)) {
      issues.push({
        severity: 'high',
        type,
        description,
        suggestion: 'Reduce resource usage in prompt',
      });
    }
  }

  return issues;
}

/**
 * Check for data exfiltration patterns
 */
function checkExfiltrationPatterns(prompt: string): PromptIssue[] {
  const issues: PromptIssue[] = [];

  const exfilPatterns = [
    {
      pattern: /(send|post|transmit|upload).*?to\s+https?:\/\//i,
      type: 'explicit_exfiltration',
      description: 'Instructs sending data to external URL',
    },
    {
      pattern: /(secretly|silently|without\s+(telling|notifying)|hide)/i,
      type: 'stealth_instruction',
      description: 'Contains stealth/secrecy instructions',
    },
    {
      pattern: /encode.*?(conversation|history|previous|messages)/i,
      type: 'encoding_exfiltration',
      description: 'Attempts to encode conversation for exfiltration',
    },
    {
      pattern: /first\s+letter\s+of\s+each\s+word|acrostic|steganography/i,
      type: 'steganographic_exfiltration',
      description: 'Uses steganography for data hiding',
    },
  ];

  for (const { pattern, type, description } of exfilPatterns) {
    if (pattern.test(prompt)) {
      issues.push({
        severity: 'critical',
        type,
        description,
        suggestion: 'Remove data exfiltration instructions',
      });
    }
  }

  return issues;
}

/**
 * Check structural issues
 */
function checkStructuralIssues(prompt: string): PromptIssue[] {
  const issues: PromptIssue[] = [];

  // Check for multiple role definitions (confusing)
  const roleMatches = prompt.match(/you\s+are\s+(a|an)/gi);
  if (roleMatches && roleMatches.length > 3) {
    issues.push({
      severity: 'medium',
      type: 'multiple_roles',
      description: `Defines ${roleMatches.length} different roles (confusing)`,
      suggestion: 'Stick to one clear role definition',
    });
  }

  // Check for contradictory instructions
  if (/always.*never|never.*always/i.test(prompt)) {
    issues.push({
      severity: 'medium',
      type: 'contradictory_instructions',
      description: 'Contains contradictory instructions',
      suggestion: 'Clarify or remove contradictions',
    });
  }

  return issues;
}

/**
 * Check complexity (length, nesting, etc.)
 */
function checkComplexity(prompt: string): PromptIssue[] {
  const issues: PromptIssue[] = [];

  // Check length
  if (prompt.length > 10000) {
    issues.push({
      severity: 'medium',
      type: 'excessive_length',
      description: `Prompt is very long (${prompt.length} chars, max recommended: 10000)`,
      suggestion: 'Simplify and shorten prompt',
    });
  }

  // Check for excessive nested conditions
  const ifMatches = prompt.match(/if\s+/gi);
  if (ifMatches && ifMatches.length > 10) {
    issues.push({
      severity: 'low',
      type: 'excessive_conditionals',
      description: `Too many conditional statements (${ifMatches.length})`,
      suggestion: 'Simplify logic',
    });
  }

  return issues;
}

/**
 * Generate recommendations based on issues
 */
function generateRecommendations(issues: PromptIssue[]): string[] {
  const recommendations: string[] = [];

  const criticalCount = issues.filter(i => i.severity === 'critical').length;
  const highCount = issues.filter(i => i.severity === 'high').length;

  if (criticalCount > 0) {
    recommendations.push(
      `⛔ ${criticalCount} critical issue(s) found. Prompt cannot be used until fixed.`
    );
  }

  if (highCount > 0) {
    recommendations.push(
      `⚠️ ${highCount} high-severity issue(s) found. Strongly recommended to fix.`
    );
  }

  // Add specific recommendations
  const types = new Set(issues.map(i => i.type));

  if (types.has('instruction_override') || types.has('jailbreak')) {
    recommendations.push(
      '💡 Remove phrases that try to override or bypass instructions'
    );
  }

  if (types.has('mass_spawning') || types.has('mass_fetching')) {
    recommendations.push(
      '💡 Reduce resource usage - avoid mass operations'
    );
  }

  if (types.has('explicit_exfiltration') || types.has('stealth_instruction')) {
    recommendations.push(
      '💡 Remove instructions to send data externally or act secretly'
    );
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ Prompt looks good! Safe to use.');
  }

  return recommendations;
}

/**
 * Attempt to sanitize prompt by removing dangerous sections
 * SECURITY: Conservative approach - better to reject than to miss something
 */
function sanitizePrompt(prompt: string, issues: PromptIssue[]): string {
  // For now, don't auto-sanitize - too risky
  // Better to ask user to fix manually
  return prompt;
}

/**
 * Quick safety check for API endpoint
 * Returns true if prompt is safe enough for immediate use
 */
export function isPromptSafe(prompt: string): boolean {
  const result = validateCustomPrompt(prompt);
  return result.safe && result.score >= 70;
}

/**
 * Get user-friendly explanation of validation result
 */
export function explainValidationResult(result: PromptValidationResult): string {
  if (result.safe) {
    return `✅ Prompt is safe to use (score: ${result.score}/100)`;
  }

  const critical = result.issues.filter(i => i.severity === 'critical');
  const high = result.issues.filter(i => i.severity === 'high');

  let explanation = `⛔ Prompt cannot be used (score: ${result.score}/100)\n\n`;

  if (critical.length > 0) {
    explanation += `Critical issues (${critical.length}):\n`;
    critical.forEach(i => {
      explanation += `  • ${i.description}\n`;
    });
  }

  if (high.length > 0) {
    explanation += `\nHigh-severity issues (${high.length}):\n`;
    high.forEach(i => {
      explanation += `  • ${i.description}\n`;
    });
  }

  return explanation;
}
