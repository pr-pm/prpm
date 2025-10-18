import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { KarenReview, KarenScore, getKarenGrade } from './karen-config';
import { KAREN_SYSTEM_PROMPT, buildKarenAnalysisPrompt } from './karen-prompt';
import { RepoAnalyzer } from './repo-analyzer';

export type AIProvider = 'anthropic' | 'openai';

export class KarenReviewer {
  private anthropic?: Anthropic;
  private openai?: OpenAI;
  private provider: AIProvider;

  constructor(config: { provider: AIProvider; apiKey: string }) {
    this.provider = config.provider;

    if (config.provider === 'anthropic') {
      this.anthropic = new Anthropic({ apiKey: config.apiKey });
    } else {
      this.openai = new OpenAI({ apiKey: config.apiKey });
    }
  }

  async reviewRepository(
    repoPath: string,
    repoName: string,
    repoDescription?: string,
    config: any = {}
  ): Promise<KarenReview> {
    // Analyze repository
    const analyzer = new RepoAnalyzer(repoPath, config);
    const { files, stats, readme, packageJson } = await analyzer.analyzeRepository();

    // Build prompt
    const prompt = buildKarenAnalysisPrompt(
      {
        name: repoName,
        description: repoDescription,
        readme,
        packageJson,
        files,
        stats
      },
      config
    );

    let reviewData: any;

    if (this.provider === 'anthropic' && this.anthropic) {
      reviewData = await this.getAnthropicReview(prompt);
    } else if (this.provider === 'openai' && this.openai) {
      reviewData = await this.getOpenAIReview(prompt);
    } else {
      throw new Error('No AI provider configured');
    }

    // Build KarenReview object
    const score: KarenScore = {
      total: reviewData.score.total,
      breakdown: reviewData.score.breakdown,
      grade: getKarenGrade(reviewData.score.total),
      timestamp: new Date().toISOString()
    };

    return {
      score,
      summary: reviewData.summary,
      whatActuallyWorks: reviewData.whatActuallyWorks,
      issues: reviewData.issues,
      bottomLine: reviewData.bottomLine,
      prescription: reviewData.prescription
    };
  }

  private async getAnthropicReview(prompt: string): Promise<any> {
    if (!this.anthropic) {
      throw new Error('Anthropic client not initialized');
    }

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: KAREN_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    return JSON.parse(content.text);
  }

  private async getOpenAIReview(prompt: string): Promise<any> {
    if (!this.openai) {
      throw new Error('OpenAI client not initialized');
    }

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: KAREN_SYSTEM_PROMPT
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 4096,
      temperature: 0.7
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    return JSON.parse(content);
  }
}
