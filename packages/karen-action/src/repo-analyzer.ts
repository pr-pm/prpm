import * as fs from 'fs';
import * as path from 'path';
import { KarenConfig, DEFAULT_KAREN_CONFIG } from './karen-config';

export interface RepoStats {
  totalFiles: number;
  totalLines: number;
  todoCount: number;
  testFileCount: number;
  filesByExtension: Record<string, number>;
}

export interface FileInfo {
  path: string;
  content: string;
  size: number;
  extension: string;
  lines: number;
}

export class RepoAnalyzer {
  private config: KarenConfig;
  private rootPath: string;

  constructor(rootPath: string, config: Partial<KarenConfig> = {}) {
    this.rootPath = rootPath;
    this.config = { ...DEFAULT_KAREN_CONFIG, ...config };
  }

  async analyzeRepository(): Promise<{
    files: FileInfo[];
    stats: RepoStats;
    readme?: string;
    packageJson?: any;
  }> {
    const files = await this.scanDirectory(this.rootPath);
    const stats = this.calculateStats(files);

    const readme = this.findReadme(files);
    const packageJson = this.findPackageJson(files);

    // Select most relevant files for review (max 20 files)
    const relevantFiles = this.selectRelevantFiles(files, 20);

    return {
      files: relevantFiles,
      stats,
      readme,
      packageJson
    };
  }

  private async scanDirectory(dir: string, baseDir: string = dir): Promise<FileInfo[]> {
    const files: FileInfo[] = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      const relativePath = path.relative(baseDir, fullPath);

      // Skip ignored paths
      if (this.shouldIgnore(relativePath)) {
        continue;
      }

      if (entry.isDirectory()) {
        files.push(...await this.scanDirectory(fullPath, baseDir));
      } else if (entry.isFile()) {
        const fileInfo = this.analyzeFile(fullPath, relativePath);
        if (fileInfo) {
          files.push(fileInfo);
        }
      }
    }

    return files;
  }

  private analyzeFile(fullPath: string, relativePath: string): FileInfo | null {
    try {
      const content = fs.readFileSync(fullPath, 'utf8');
      const stats = fs.statSync(fullPath);
      const extension = path.extname(fullPath);

      // Skip binary files and very large files
      if (stats.size > 1024 * 1024 || this.isBinary(extension)) {
        return null;
      }

      return {
        path: relativePath,
        content,
        size: stats.size,
        extension,
        lines: content.split('\n').length
      };
    } catch (error) {
      // Skip files that can't be read
      return null;
    }
  }

  private shouldIgnore(relativePath: string): boolean {
    const ignorePatterns = this.config.ignore || DEFAULT_KAREN_CONFIG.ignore!;

    return ignorePatterns.some(pattern => {
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return regex.test(relativePath);
      }
      return relativePath.includes(pattern);
    });
  }

  private isBinary(extension: string): boolean {
    const binaryExts = [
      '.png', '.jpg', '.jpeg', '.gif', '.ico', '.pdf',
      '.zip', '.tar', '.gz', '.exe', '.dll', '.so',
      '.woff', '.woff2', '.ttf', '.eot'
    ];
    return binaryExts.includes(extension.toLowerCase());
  }

  private calculateStats(files: FileInfo[]): RepoStats {
    const stats: RepoStats = {
      totalFiles: files.length,
      totalLines: 0,
      todoCount: 0,
      testFileCount: 0,
      filesByExtension: {}
    };

    for (const file of files) {
      stats.totalLines += file.lines;

      // Count TODOs
      const todoMatches = file.content.match(/TODO|FIXME|XXX|HACK/gi);
      stats.todoCount += todoMatches ? todoMatches.length : 0;

      // Count test files
      if (this.isTestFile(file.path)) {
        stats.testFileCount++;
      }

      // Count by extension
      const ext = file.extension || 'no-extension';
      stats.filesByExtension[ext] = (stats.filesByExtension[ext] || 0) + 1;
    }

    return stats;
  }

  private isTestFile(filePath: string): boolean {
    const testPatterns = [
      /\.test\./,
      /\.spec\./,
      /__tests__/,
      /test\//,
      /tests\//
    ];
    return testPatterns.some(pattern => pattern.test(filePath));
  }

  private selectRelevantFiles(files: FileInfo[], maxFiles: number): FileInfo[] {
    // Prioritize files for Karen to review
    const scored = files.map(file => ({
      file,
      score: this.calculateRelevanceScore(file)
    }));

    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, maxFiles).map(s => s.file);
  }

  private calculateRelevanceScore(file: FileInfo): number {
    let score = 0;

    // Prioritize source code
    const sourceExts = ['.ts', '.js', '.tsx', '.jsx', '.py', '.go', '.rs', '.java'];
    if (sourceExts.includes(file.extension)) {
      score += 10;
    }

    // Prioritize main entry points
    if (file.path.match(/index\.|main\.|app\./)) {
      score += 5;
    }

    // Prioritize config files
    if (file.path.match(/config|setup|init/i)) {
      score += 3;
    }

    // Prioritize files with TODOs (Karen will roast these)
    const todoCount = (file.content.match(/TODO|FIXME|XXX|HACK/gi) || []).length;
    score += todoCount * 2;

    // Prioritize medium-sized files (not too small, not too large)
    if (file.lines > 50 && file.lines < 500) {
      score += 5;
    }

    // Deprioritize test files (but don't exclude)
    if (this.isTestFile(file.path)) {
      score -= 2;
    }

    return score;
  }

  private findReadme(files: FileInfo[]): string | undefined {
    const readme = files.find(f =>
      f.path.toLowerCase() === 'readme.md' ||
      f.path.toLowerCase() === 'readme.txt'
    );
    return readme?.content;
  }

  private findPackageJson(files: FileInfo[]): any | undefined {
    const pkgFile = files.find(f => f.path === 'package.json');
    if (pkgFile) {
      try {
        return JSON.parse(pkgFile.content);
      } catch {
        return undefined;
      }
    }
    return undefined;
  }
}
