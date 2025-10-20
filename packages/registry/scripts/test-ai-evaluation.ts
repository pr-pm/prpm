/**
 * Test script for AI-powered prompt quality evaluation
 */

import { evaluatePromptWithAI, getDetailedAIEvaluation } from '../src/scoring/ai-evaluator.js';
import { config } from '../src/config.js';

// Mock Fastify server logger
const mockServer = {
  log: {
    info: (obj: any, msg?: string) => console.log('INFO:', msg || obj),
    debug: (obj: any, msg?: string) => console.log('DEBUG:', msg || obj),
    warn: (obj: any, msg?: string) => console.warn('WARN:', msg || obj),
    error: (obj: any, msg?: string) => console.error('ERROR:', msg || obj),
  }
} as any;

// Test prompt content (canonical format)
const testPromptGood = {
  format: 'canonical',
  version: '1.0',
  sections: [
    {
      type: 'instructions',
      title: 'React Best Practices',
      content: 'You are an expert React developer. Follow modern React patterns and best practices. Use functional components with hooks. Implement proper error boundaries and loading states. Optimize performance with useMemo and useCallback where appropriate.'
    },
    {
      type: 'rules',
      title: 'Code Quality Rules',
      rules: [
        'Always use TypeScript with strict mode enabled',
        'Follow consistent naming conventions (PascalCase for components, camelCase for functions)',
        'Write comprehensive unit tests with React Testing Library',
        'Use ESLint and Prettier for code formatting',
        'Implement proper accessibility (ARIA labels, semantic HTML)'
      ]
    },
    {
      type: 'examples',
      title: 'Code Examples',
      examples: [
        {
          title: 'Optimized Component',
          description: 'Example of a well-optimized React component',
          code: `import { useMemo } from 'react';

function ProductList({ products, filter }) {
  const filteredProducts = useMemo(() =>
    products.filter(p => p.category === filter),
    [products, filter]
  );

  return (
    <ul role="list" aria-label="Product list">
      {filteredProducts.map(p => (
        <li key={p.id}>{p.name}</li>
      ))}
    </ul>
  );
}`
        }
      ]
    }
  ]
};

const testPromptBad = {
  format: 'canonical',
  version: '1.0',
  sections: [
    {
      type: 'instructions',
      title: 'Code',
      content: 'Write code.'
    }
  ]
};

async function runTests() {
  console.log('='.repeat(80));
  console.log('AI Prompt Quality Evaluation Test');
  console.log('='.repeat(80));
  console.log();

  // Check configuration
  console.log('Configuration:');
  console.log(`- AI Evaluation Enabled: ${config.ai.evaluationEnabled}`);
  console.log(`- API Key Configured: ${config.ai.anthropicApiKey ? 'Yes (hidden)' : 'No'}`);
  console.log();

  if (!config.ai.anthropicApiKey) {
    console.log('⚠️  ANTHROPIC_API_KEY not set. Set it in .env to test AI evaluation.');
    console.log('   Testing will use fallback heuristic scoring.');
    console.log();
  }

  // Test 1: Good prompt
  console.log('Test 1: High-Quality Prompt');
  console.log('-'.repeat(80));
  try {
    const score1 = await evaluatePromptWithAI(testPromptGood, mockServer);
    console.log(`✓ Score: ${score1.toFixed(3)} / 1.000`);
    console.log();

    // Get detailed evaluation
    const detailed1 = await getDetailedAIEvaluation(testPromptGood, mockServer);
    console.log('Detailed Analysis:');
    console.log(`  Score: ${detailed1.score.toFixed(3)}`);
    console.log(`  Reasoning: ${detailed1.reasoning}`);
    if (detailed1.strengths.length > 0) {
      console.log(`  Strengths: ${detailed1.strengths.join(', ')}`);
    }
    if (detailed1.weaknesses.length > 0) {
      console.log(`  Weaknesses: ${detailed1.weaknesses.join(', ')}`);
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error(`✗ Test 1 failed: ${err.message}`);
  }
  console.log();

  // Test 2: Poor prompt
  console.log('Test 2: Low-Quality Prompt');
  console.log('-'.repeat(80));
  try {
    const score2 = await evaluatePromptWithAI(testPromptBad, mockServer);
    console.log(`✓ Score: ${score2.toFixed(3)} / 1.000`);
    console.log();

    // Get detailed evaluation
    const detailed2 = await getDetailedAIEvaluation(testPromptBad, mockServer);
    console.log('Detailed Analysis:');
    console.log(`  Score: ${detailed2.score.toFixed(3)}`);
    console.log(`  Reasoning: ${detailed2.reasoning}`);
    if (detailed2.strengths.length > 0) {
      console.log(`  Strengths: ${detailed2.strengths.join(', ')}`);
    }
    if (detailed2.weaknesses.length > 0) {
      console.log(`  Weaknesses: ${detailed2.weaknesses.join(', ')}`);
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error(`✗ Test 2 failed: ${err.message}`);
  }
  console.log();

  // Test 3: Empty content
  console.log('Test 3: Empty Content (Fallback)');
  console.log('-'.repeat(80));
  try {
    const score3 = await evaluatePromptWithAI(null, mockServer);
    console.log(`✓ Score: ${score3.toFixed(3)} / 1.000 (fallback)`);
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error(`✗ Test 3 failed: ${err.message}`);
  }
  console.log();

  console.log('='.repeat(80));
  console.log('Tests Complete');
  console.log('='.repeat(80));
}

// Run tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
