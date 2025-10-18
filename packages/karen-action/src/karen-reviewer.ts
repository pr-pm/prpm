import Anthropic from '@anthropic-ai/sdk';
import { KarenReview, KarenScore, getKarenGrade } from './karen-config';
import { KAREN_SYSTEM_PROMPT, buildKarenAnalysisPrompt } from './karen-prompt';
import { RepoAnalyzer } from './repo-analyzer';

export class KarenReviewer {
  private anthropic: Anthropic;

  constructor(apiKey: string) {
    this.anthropic = new Anthropic({ apiKey });
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

    // Get Karen's review from Claude
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

    // Parse response
    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    const reviewData = JSON.parse(content.text);

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
}
