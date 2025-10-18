import * as core from '@actions/core';
import * as github from '@actions/github';
import * as fs from 'fs';
import * as path from 'path';
import { parse as parseYaml } from 'yaml';
import { KarenReviewer, AIProvider } from './karen-reviewer';
import { RepoAnalyzer } from './repo-analyzer';
import { generateKarenBadge } from './badge-generator';
import { formatReviewMarkdown, formatPRComment } from './review-formatter';
import { KarenConfig, DEFAULT_KAREN_CONFIG } from './karen-config';

async function run(): Promise<void> {
  try {
    // Get inputs
    const anthropicApiKey = core.getInput('anthropic_api_key', { required: false });
    const openaiApiKey = core.getInput('openai_api_key', { required: false });
    let aiProvider = core.getInput('ai_provider', { required: false }) || 'auto';
    const githubToken = core.getInput('github_token', { required: false });
    const mode = core.getInput('mode', { required: false }) || 'full';
    const postComment = core.getInput('post_comment', { required: false }) === 'true';
    const generateBadge = core.getInput('generate_badge', { required: false }) === 'true';
    const minScore = parseInt(core.getInput('min_score', { required: false }) || '0');

    // Auto-detect provider if not specified
    if (aiProvider === 'auto') {
      if (anthropicApiKey) {
        aiProvider = 'anthropic';
      } else if (openaiApiKey) {
        aiProvider = 'openai';
      } else {
        core.setFailed('Either anthropic_api_key or openai_api_key must be provided');
        return;
      }
    }

    // Validate API key for selected provider
    const apiKey = aiProvider === 'anthropic' ? anthropicApiKey : openaiApiKey;
    if (!apiKey) {
      core.setFailed(`${aiProvider === 'anthropic' ? 'Anthropic' : 'OpenAI'} API key required when ai_provider is ${aiProvider}`);
      return;
    }

    core.info(`🔥 Using ${aiProvider.toUpperCase()} for Karen review...`);

    // Get repository info
    const workspace = process.env.GITHUB_WORKSPACE || process.cwd();
    const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1] || 'unknown';
    const repoDescription = github.context.payload.repository?.description;

    core.info(`🔥 Karen is reviewing ${repoName}...`);

    // Load .karen/config.yml if it exists
    const karenConfigPath = path.join(workspace, '.karen', 'config.yml');
    let config: KarenConfig = DEFAULT_KAREN_CONFIG;

    if (fs.existsSync(karenConfigPath)) {
      core.info('📋 Loading .karen/config.yml');
      const configContent = fs.readFileSync(karenConfigPath, 'utf8');
      const userConfig = parseYaml(configContent);
      config = { ...DEFAULT_KAREN_CONFIG, ...userConfig };
    }

    // Create .karen directory if it doesn't exist
    const karenDir = path.join(workspace, '.karen');
    if (!fs.existsSync(karenDir)) {
      fs.mkdirSync(karenDir, { recursive: true });
    }

    // Load previous score if it exists
    const scorePath = path.join(karenDir, 'score.json');
    let previousScore: number | undefined;
    if (fs.existsSync(scorePath)) {
      const scoreData = JSON.parse(fs.readFileSync(scorePath, 'utf8'));
      previousScore = scoreData.total;
    }

    // Run Karen review
    const reviewer = new KarenReviewer({
      provider: aiProvider as AIProvider,
      apiKey
    });
    const review = await reviewer.reviewRepository(
      workspace,
      repoName,
      repoDescription,
      config
    );

    core.info(`📊 Karen Score: ${review.score.total}/100 - "${review.score.grade}"`);

    // Save score.json
    fs.writeFileSync(
      scorePath,
      JSON.stringify(review.score, null, 2)
    );
    core.info(`💾 Saved score to ${scorePath}`);

    // Generate and save review.md
    const reviewPath = path.join(karenDir, 'review.md');
    const reviewMarkdown = formatReviewMarkdown(review, repoName);
    fs.writeFileSync(reviewPath, reviewMarkdown);
    core.info(`📝 Saved review to ${reviewPath}`);

    // Save to history
    const historyDir = path.join(karenDir, 'history');
    if (!fs.existsSync(historyDir)) {
      fs.mkdirSync(historyDir, { recursive: true });
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const historyPath = path.join(historyDir, `${timestamp}.md`);
    fs.writeFileSync(historyPath, reviewMarkdown);
    core.info(`📚 Saved to history: ${historyPath}`);

    // Generate badge
    let badgePath = '';
    if (generateBadge) {
      const badgesDir = path.join(karenDir, 'badges');
      if (!fs.existsSync(badgesDir)) {
        fs.mkdirSync(badgesDir, { recursive: true });
      }
      badgePath = path.join(badgesDir, 'score-badge.svg');
      const badgeSvg = generateKarenBadge(review.score.total, review.score.grade);
      fs.writeFileSync(badgePath, badgeSvg);
      core.info(`🏆 Generated badge: ${badgePath}`);
    }

    // Post PR comment if enabled
    if (postComment && githubToken && github.context.payload.pull_request) {
      core.info('💬 Posting Karen review as PR comment...');
      const octokit = github.getOctokit(githubToken);
      const comment = formatPRComment(review, repoName, previousScore);

      await octokit.rest.issues.createComment({
        ...github.context.repo,
        issue_number: github.context.payload.pull_request.number,
        body: comment
      });
      core.info('✅ Posted PR comment');
    }

    // Set outputs
    core.setOutput('karen_score', review.score.total);
    core.setOutput('karen_grade', review.score.grade);
    core.setOutput('review_path', reviewPath);
    if (badgePath) {
      core.setOutput('badge_path', badgePath);
    }

    // Check if score meets minimum threshold
    if (review.score.total < minScore) {
      core.setFailed(
        `Karen score ${review.score.total} is below minimum threshold ${minScore}. ${review.bottomLine}`
      );
    } else {
      core.info(`✅ Karen score ${review.score.total} meets minimum threshold ${minScore}`);
    }

    core.info('🎉 Karen review complete!');
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(`Karen encountered an error: ${error.message}`);
    } else {
      core.setFailed('Karen encountered an unknown error');
    }
  }
}

run();
