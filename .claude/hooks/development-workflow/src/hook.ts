/**
 * Development Workflow Hook
 *
 * Enforces documentation and skill updates when working on PRPM features.
 * Provides context-aware reminders based on the type of work being done.
 */

import { readFileSync } from 'fs';
import {
  isPrpmRepository,
  detectWorkType,
  getCLIWorkReminders,
  getBlogWorkReminders,
  getDocsWorkReminders,
  getSkillWorkReminders,
  buildDevelopmentContext
} from './hook-utils';

/**
 * Read hook input from stdin
 */
function readStdin(): any {
  try {
    const input = readFileSync(0, 'utf-8');
    return JSON.parse(input);
  } catch {
    return {};
  }
}

/**
 * Exit with code
 */
function exitHook(code: number): never {
  process.exit(code);
}

/**
 * Main hook execution
 */
async function main() {
  try {
    const input = readStdin();
    const workingDirectory = input.workingDirectory || process.cwd();
    const gitBranch = input.gitBranch;

    // Only activate in PRPM repository
    if (!isPrpmRepository(workingDirectory)) {
      exitHook(0);
    }

    // Detect what type of work is being done
    const workType = detectWorkType(gitBranch);

    // Build reminders based on work type
    const reminders: string[] = [];

    if (workType.isCLIWork) {
      reminders.push(...getCLIWorkReminders());
    }

    if (workType.isBlogWork) {
      reminders.push(...getBlogWorkReminders());
    }

    if (workType.isDocsWork) {
      reminders.push(...getDocsWorkReminders());
    }

    if (workType.isSkillWork) {
      reminders.push(...getSkillWorkReminders());
    }

    // Always add general development context
    const additionalContext = buildDevelopmentContext(workType);

    // If no specific work type detected, provide general guidance
    if (!workType.isCLIWork && !workType.isBlogWork && !workType.isDocsWork && !workType.isSkillWork) {
      reminders.push(
        '📝 PRPM DEVELOPMENT GENERAL GUIDELINES:',
        '',
        '- Keep documentation in sync with code changes',
        '- Update relevant skills when features change',
        '- Follow existing patterns and conventions',
        '- Test thoroughly before committing',
        '',
        'Branch naming helps activate specific workflows:',
        '- *-cli-*, *-feature-*, *-command-* → CLI workflow',
        '- *-blog-*, *-post-* → Blog workflow',
        '- *-docs-*, *-documentation-* → Docs workflow',
        '- *-skill-*, *-agent-*, *-hook-* → Skill workflow'
      );
    }

    // Output context and reminders
    if (additionalContext) {
      console.log(additionalContext);
    }

    if (reminders.length > 0) {
      console.error('\n' + reminders.join('\n') + '\n');
    }

    exitHook(0);
  } catch (error) {
    // Don't block the session if hook fails
    console.error('Development workflow hook error:', error);
    exitHook(0);
  }
}

// Run the hook
main();
