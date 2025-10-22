/**
 * Unit tests for AI-powered prompt quality evaluator
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { evaluatePromptWithAI, getDetailedAIEvaluation } from '../ai-evaluator.js';

// Mock Anthropic SDK
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      messages: {
        create: vi.fn().mockResolvedValue({
          content: [
            {
              type: 'text',
              text: `SCORE: 0.85
REASONING: Well-structured prompt with clear instructions and examples. Good use of sections and specific guidance.
STRENGTHS: Clear structure, comprehensive examples, specific guidelines
WEAKNESSES: Could benefit from more edge case handling`
            }
          ]
        })
      }
    }))
  };
});

// Mock config
vi.mock('../../config.js', () => ({
  config: {
    ai: {
      anthropicApiKey: 'test-key',
      evaluationEnabled: true
    }
  }
}));

const mockServer = {
  log: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
} as any;

describe('AI Evaluator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('evaluatePromptWithAI', () => {
    it('should evaluate a well-structured prompt', async () => {
      const content = {
        format: 'canonical',
        version: '1.0',
        sections: [
          {
            type: 'instructions',
            title: 'Test Instructions',
            content: 'This is a test prompt with clear instructions for the AI.'
          },
          {
            type: 'rules',
            title: 'Rules',
            rules: ['Rule 1', 'Rule 2', 'Rule 3']
          }
        ]
      };

      const score = await evaluatePromptWithAI(content, mockServer);

      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(1.0);
      expect(typeof score).toBe('number');
    });

    it('should handle empty content gracefully', async () => {
      const score = await evaluatePromptWithAI(null, mockServer);

      expect(score).toBe(0);
      expect(mockServer.log.debug).toHaveBeenCalled();
    });

    it('should handle short content with fallback', async () => {
      const content = {
        format: 'canonical',
        sections: [{ type: 'instructions', content: 'Short' }]
      };

      const score = await evaluatePromptWithAI(content, mockServer);

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1.0);
    });

    it('should extract text from canonical format', async () => {
      const content = {
        sections: [
          {
            type: 'instructions',
            title: 'Main Instructions',
            content: 'Detailed instructions here with enough text to trigger AI evaluation. ' +
              'This should be long enough to pass the minimum length check.'
          },
          {
            type: 'examples',
            examples: [
              {
                title: 'Example 1',
                description: 'Example description',
                code: 'console.log("test");'
              }
            ]
          }
        ]
      };

      const score = await evaluatePromptWithAI(content, mockServer);

      expect(score).toBeGreaterThan(0);
    });

    it('should handle string content', async () => {
      const content = 'This is a simple string prompt with enough content to be evaluated by the AI system.';

      const score = await evaluatePromptWithAI(content, mockServer);

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1.0);
    });
  });

  describe('getDetailedAIEvaluation', () => {
    it('should return detailed evaluation result', async () => {
      const content = {
        sections: [
          {
            type: 'instructions',
            content: 'Well-structured instructions with clear guidance and specific examples.'
          }
        ]
      };

      const result = await getDetailedAIEvaluation(content, mockServer);

      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('reasoning');
      expect(result).toHaveProperty('strengths');
      expect(result).toHaveProperty('weaknesses');
      expect(result).toHaveProperty('suggestions');

      expect(typeof result.score).toBe('number');
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(1.0);

      expect(typeof result.reasoning).toBe('string');
      expect(Array.isArray(result.strengths)).toBe(true);
      expect(Array.isArray(result.weaknesses)).toBe(true);
      expect(Array.isArray(result.suggestions)).toBe(true);
    });

    it('should handle evaluation errors gracefully', async () => {
      const content = { sections: [{ type: 'instructions', content: 'Test' }] };
      const result = await getDetailedAIEvaluation(content, mockServer);

      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('reasoning');
      expect(typeof result.reasoning).toBe('string');
    });
  });

  describe('Heuristic Fallback', () => {
    beforeEach(() => {
      // Mock config without API key
      vi.doMock('../../config.js', () => ({
        config: {
          ai: {
            anthropicApiKey: '',
            evaluationEnabled: false
          }
        }
      }));
    });

    it('should use heuristic scoring when AI is disabled', async () => {
      const content = {
        sections: [
          { type: 'instructions', content: 'Test instructions' },
          { type: 'rules', rules: ['Rule 1', 'Rule 2'] },
          { type: 'examples', examples: [{ code: 'test' }] }
        ]
      };

      const score = await evaluatePromptWithAI(content, mockServer);

      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(1.0);
    });

    it('should score based on section count', async () => {
      const singleSection = {
        sections: [{ type: 'instructions', content: 'Test' }]
      };

      const multipleSections = {
        sections: [
          { type: 'instructions', content: 'Test' },
          { type: 'rules', rules: ['Rule 1', 'Rule 2'] },
          { type: 'examples', examples: [] },
          { type: 'guidelines', content: 'Guidelines' }
        ]
      };

      const score1 = await evaluatePromptWithAI(singleSection, mockServer);
      const score2 = await evaluatePromptWithAI(multipleSections, mockServer);

      expect(score2).toBeGreaterThan(score1);
    });

    it('should score based on content length', async () => {
      const shortContent = {
        sections: [{ type: 'instructions', content: 'Short' }]
      };

      const longContent = {
        sections: [{
          type: 'instructions',
          content: 'A'.repeat(2500) // Long content
        }]
      };

      const score1 = await evaluatePromptWithAI(shortContent, mockServer);
      const score2 = await evaluatePromptWithAI(longContent, mockServer);

      expect(score2).toBeGreaterThan(score1);
    });

    it('should give bonus for instructions section', async () => {
      const noInstructions = {
        sections: [
          { type: 'metadata', content: 'Test' },
          { type: 'other', content: 'Test' }
        ]
      };

      const withInstructions = {
        sections: [
          { type: 'instructions', content: 'Clear instructions' },
          { type: 'other', content: 'Test' }
        ]
      };

      const score1 = await evaluatePromptWithAI(noInstructions, mockServer);
      const score2 = await evaluatePromptWithAI(withInstructions, mockServer);

      expect(score2).toBeGreaterThan(score1);
    });
  });

  describe('Score Parsing', () => {
    it('should parse valid score format', async () => {
      const content = {
        sections: [{
          type: 'instructions',
          content: 'Test content with sufficient length for AI evaluation to proceed.'
        }]
      };

      const score = await evaluatePromptWithAI(content, mockServer);

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1.0);
    });

    it('should clamp scores to 0-1 range', async () => {
      // Mock API response with out-of-range score
      const Anthropic = await import('@anthropic-ai/sdk');
      const mockCreate = vi.fn().mockResolvedValue({
        content: [{
          type: 'text',
          text: 'SCORE: 1.5\nREASONING: Test\nSTRENGTHS: Good\nWEAKNESSES: None'
        }]
      });

      (Anthropic.default as any).mockImplementation(() => ({
        messages: { create: mockCreate }
      }));

      const content = {
        sections: [{
          type: 'instructions',
          content: 'Test content with sufficient length for evaluation.'
        }]
      };

      const score = await evaluatePromptWithAI(content, mockServer);

      expect(score).toBeLessThanOrEqual(1.0);
    });
  });

  describe('Text Extraction', () => {
    it('should extract text from multiple section types', async () => {
      const content = {
        sections: [
          {
            type: 'instructions',
            title: 'Instructions',
            content: 'Main instructions here'
          },
          {
            type: 'rules',
            title: 'Rules',
            rules: ['Rule 1', 'Rule 2']
          },
          {
            type: 'examples',
            title: 'Examples',
            examples: [
              { title: 'Ex1', code: 'code here' }
            ]
          },
          {
            type: 'guidelines',
            items: ['Item 1', 'Item 2']
          }
        ]
      };

      const score = await evaluatePromptWithAI(content, mockServer);

      expect(score).toBeGreaterThan(0);
    });

    it('should handle malformed content gracefully', async () => {
      const malformed = {
        sections: 'not an array'
      };

      const score = await evaluatePromptWithAI(malformed as any, mockServer);

      expect(score).toBeGreaterThanOrEqual(0);
    });

    it('should handle missing fields', async () => {
      const content = {
        sections: [
          { type: 'instructions' }, // No content field
          { title: 'Test' }, // No type field
          {} // Empty object
        ]
      };

      const score = await evaluatePromptWithAI(content, mockServer);

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1.0);
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      // Mock API failure
      const Anthropic = await import('@anthropic-ai/sdk');
      const mockCreate = vi.fn().mockRejectedValue(new Error('API Error'));

      (Anthropic.default as any).mockImplementation(() => ({
        messages: { create: mockCreate }
      }));

      const content = {
        sections: [{
          type: 'instructions',
          content: 'Test content for error handling scenario.'
        }]
      };

      const score = await evaluatePromptWithAI(content, mockServer);

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1.0);
    });

    it('should handle network timeouts', async () => {
      const Anthropic = await import('@anthropic-ai/sdk');
      const mockCreate = vi.fn().mockRejectedValue(new Error('Request timeout'));

      (Anthropic.default as any).mockImplementation(() => ({
        messages: { create: mockCreate }
      }));

      const content = {
        sections: [{
          type: 'instructions',
          content: 'Test content for timeout scenario with sufficient length.'
        }]
      };

      const score = await evaluatePromptWithAI(content, mockServer);

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1.0);
    });
  });
});
