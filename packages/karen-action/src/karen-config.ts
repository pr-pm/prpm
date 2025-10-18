export interface KarenConfig {
  // Scoring weights (0-1, must sum to 1)
  weights?: {
    bullshitFactor?: number;
    actuallyWorks?: number;
    codeQualityReality?: number;
    completionHonesty?: number;
    practicalValue?: number;
  };

  // Directories to ignore
  ignore?: string[];

  // Focus areas for review
  focus?: string[];

  // Strictness level (1-10, default 7)
  strictness?: number;

  // Enable specific checks
  checks?: {
    overEngineering?: boolean;
    missingTests?: boolean;
    incompleteTodos?: boolean;
    deadCode?: boolean;
    unnecessaryDeps?: boolean;
  };

  // Custom thresholds
  thresholds?: {
    minScore?: number;
    todoLimit?: number;
    complexityLimit?: number;
  };
}

export const DEFAULT_KAREN_CONFIG: KarenConfig = {
  weights: {
    bullshitFactor: 0.25,
    actuallyWorks: 0.25,
    codeQualityReality: 0.20,
    completionHonesty: 0.15,
    practicalValue: 0.15
  },
  ignore: [
    'node_modules',
    'dist',
    'build',
    'coverage',
    '.git',
    'vendor',
    '*.lock',
    'package-lock.json',
    'yarn.lock',
    'pnpm-lock.yaml'
  ],
  strictness: 7,
  checks: {
    overEngineering: true,
    missingTests: true,
    incompleteTodos: true,
    deadCode: true,
    unnecessaryDeps: true
  },
  thresholds: {
    minScore: 0,
    todoLimit: 20,
    complexityLimit: 15
  }
};

export interface KarenScore {
  total: number; // 0-100
  breakdown: {
    bullshitFactor: number; // 0-20
    actuallyWorks: number; // 0-20
    codeQualityReality: number; // 0-20
    completionHonesty: number; // 0-20
    practicalValue: number; // 0-20
  };
  grade: string;
  timestamp: string;
}

export interface KarenIssue {
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  message: string;
  file?: string;
  line?: number;
  suggestion?: string;
}

export interface KarenReview {
  score: KarenScore;
  summary: string;
  whatActuallyWorks: string[];
  issues: KarenIssue[];
  bottomLine: string;
  prescription: string[];
}

export function getKarenGrade(score: number): string {
  if (score >= 90) return "Surprisingly legit";
  if (score >= 70) return "Actually decent";
  if (score >= 50) return "Meh, it works I guess";
  if (score >= 30) return "Needs intervention";
  return "Delete this and start over";
}

export function getKarenEmoji(score: number): string {
  if (score >= 90) return "🏆";
  if (score >= 70) return "✅";
  if (score >= 50) return "😐";
  if (score >= 30) return "🚨";
  return "💀";
}
