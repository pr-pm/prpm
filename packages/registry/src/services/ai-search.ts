/**
 * AI Search Service
 * Semantic search using vector embeddings and multi-stage ranking
 */

import OpenAI from 'openai';
import type { FastifyInstance } from 'fastify';
import type {
  AISearchQuery,
  AISearchResult,
  AISearchResponse,
  AISearchConfig,
  SearchRankingWeights
} from '@pr-pm/types';

const DEFAULT_CONFIG: AISearchConfig = {
  embedding_model: 'text-embedding-3-small',
  embedding_dimensions: 1536,
  max_candidates: 50,
  max_results: 10,
  ranking_weights: {
    semantic_similarity: 0.5,
    quality_score: 0.3,
    popularity: 0.2
  },
  min_similarity_threshold: 0.3
};

export class AISearchService {
  private openai: OpenAI;
  private server: FastifyInstance;
  private config: AISearchConfig;

  constructor(server: FastifyInstance, config?: Partial<AISearchConfig>) {
    this.server = server;
    this.config = { ...DEFAULT_CONFIG, ...config };

    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable required for AI search');
    }

    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  /**
   * Perform AI-powered semantic search
   */
  async search(query: AISearchQuery, userId?: string): Promise<AISearchResponse> {
    const startTime = Date.now();
    const metadata = {
      embedding_time_ms: 0,
      vector_search_time_ms: 0,
      reranking_time_ms: 0
    };

    try {
      // Step 1: Generate embedding for user query
      const embeddingStart = Date.now();
      const queryEmbedding = await this.generateQueryEmbedding(query.query);
      metadata.embedding_time_ms = Date.now() - embeddingStart;

      // Step 2: Vector similarity search to get top candidates
      const vectorSearchStart = Date.now();
      const candidates = await this.vectorSearch(
        queryEmbedding,
        query.filters,
        this.config.max_candidates
      );
      metadata.vector_search_time_ms = Date.now() - vectorSearchStart;

      // Step 3: Rerank candidates by combined score
      const rerankingStart = Date.now();
      const rankedResults = this.rerankResults(candidates, this.config.ranking_weights);
      metadata.reranking_time_ms = Date.now() - rerankingStart;

      // Step 4: Take top N results
      const finalResults = rankedResults
        .slice(0, query.limit || this.config.max_results);

      // Step 5: Track usage
      if (userId) {
        this.trackSearchUsage(userId, query.query, finalResults.length, Date.now() - startTime);
      }

      const executionTime = Date.now() - startTime;

      this.server.log.info({
        userId,
        query: query.query,
        results_count: finalResults.length,
        execution_time_ms: executionTime,
        metadata
      }, 'AI search completed');

      return {
        results: finalResults,
        query: query.query,
        total_matches: candidates.length,
        execution_time_ms: executionTime,
        search_metadata: metadata
      };
    } catch (error) {
      this.server.log.error({ error, query: query.query }, 'AI search failed');
      throw error;
    }
  }

  /**
   * Generate embedding for search query
   */
  private async generateQueryEmbedding(query: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: this.config.embedding_model,
        input: query.substring(0, 8000),
        dimensions: this.config.embedding_dimensions
      });

      return response.data[0].embedding;
    } catch (error) {
      this.server.log.error({ error, query }, 'Failed to generate query embedding');
      throw new Error('Failed to generate search embedding');
    }
  }

  /**
   * Perform vector similarity search using pgvector
   */
  private async vectorSearch(
    queryEmbedding: number[],
    filters?: AISearchQuery['filters'],
    limit: number = 50
  ): Promise<AISearchResult[]> {
    // Build filter conditions
    const conditions: string[] = [
      "p.visibility = 'public'",
      "p.deprecated = false",
      "pe.embedding IS NOT NULL"
    ];
    const params: any[] = [`[${queryEmbedding.join(',')}]`];
    let paramCount = 1;

    if (filters?.format) {
      paramCount++;
      conditions.push(`p.format = $${paramCount}`);
      params.push(filters.format);
    }

    if (filters?.subtype) {
      paramCount++;
      conditions.push(`p.subtype = $${paramCount}`);
      params.push(filters.subtype);
    }

    if (filters?.language) {
      paramCount++;
      conditions.push(`p.language = $${paramCount}`);
      params.push(filters.language);
    }

    if (filters?.framework) {
      paramCount++;
      conditions.push(`p.framework = $${paramCount}`);
      params.push(filters.framework);
    }

    if (filters?.min_quality) {
      paramCount++;
      conditions.push(`p.quality_score >= $${paramCount}`);
      params.push(filters.min_quality);
    }

    // Add category filter
    if (filters?.categories && filters.categories.length > 0) {
      paramCount++;
      conditions.push(`EXISTS (
        SELECT 1 FROM package_categories pc
        JOIN categories c ON pc.category_id = c.id
        WHERE pc.package_id = p.id AND c.slug = ANY($${paramCount}::text[])
      )`);
      params.push(filters.categories);
    }

    // Add use case filter
    if (filters?.use_cases && filters.use_cases.length > 0) {
      paramCount++;
      conditions.push(`EXISTS (
        SELECT 1 FROM package_use_cases puc
        JOIN use_cases uc ON puc.use_case_id = uc.id
        WHERE puc.package_id = p.id AND uc.slug = ANY($${paramCount}::text[])
      )`);
      params.push(filters.use_cases);
    }

    const whereClause = conditions.join(' AND ');
    paramCount++;

    // Execute vector similarity query
    const query = `
      SELECT
        p.id as package_id,
        p.name,
        p.description,
        p.format,
        p.subtype,
        p.author_id,
        u.username as author_username,
        p.version,
        p.quality_score,
        p.total_downloads,
        COALESCE(s.stars_count, 0) as stars_count,
        pe.ai_use_case_description,
        pe.ai_problem_statement,
        pe.ai_best_for,
        pe.ai_similar_to,
        1 - (pe.embedding <=> $1::vector) as similarity_score
      FROM packages p
      JOIN package_embeddings pe ON p.id = pe.package_id
      LEFT JOIN users u ON p.author_id = u.id
      LEFT JOIN (
        SELECT package_id, COUNT(*) as stars_count
        FROM package_stars
        GROUP BY package_id
      ) s ON p.id = s.package_id
      WHERE ${whereClause}
      ORDER BY pe.embedding <=> $1::vector
      LIMIT $${paramCount}
    `;

    params.push(limit);

    const result = await this.server.pg.query(query, params);

    return result.rows.map(row => ({
      package_id: row.package_id,
      name: row.name,
      description: row.description,
      format: row.format,
      subtype: row.subtype,
      author_id: row.author_id,
      author_username: row.author_username,
      version: row.version,
      quality_score: row.quality_score,
      total_downloads: row.total_downloads,
      stars_count: row.stars_count,
      ai_use_case_description: row.ai_use_case_description,
      ai_problem_statement: row.ai_problem_statement,
      ai_best_for: row.ai_best_for,
      ai_similar_to: row.ai_similar_to || [],
      similarity_score: parseFloat(row.similarity_score),
      quality_score_normalized: 0, // Will be calculated in reranking
      popularity_score_normalized: 0, // Will be calculated in reranking
      final_score: 0 // Will be calculated in reranking
    }));
  }

  /**
   * Rerank results using weighted scoring
   */
  private rerankResults(
    candidates: AISearchResult[],
    weights: SearchRankingWeights
  ): AISearchResult[] {
    // Filter by minimum similarity threshold
    const filtered = candidates.filter(
      c => c.similarity_score >= (this.config.min_similarity_threshold || 0)
    );

    if (filtered.length === 0) {
      return [];
    }

    // Normalize quality scores (0-5 → 0-1)
    const maxQuality = 5;

    // Normalize popularity (log scale)
    const maxDownloads = Math.max(...filtered.map(c => c.total_downloads), 1);
    const logMaxDownloads = Math.log10(maxDownloads + 1);

    // Calculate final scores
    const scored = filtered.map(candidate => {
      const qualityNormalized = parseFloat(candidate.quality_score?.toString() || '0') / maxQuality;
      const popularityNormalized = Math.log10(candidate.total_downloads + 1) / logMaxDownloads;

      const finalScore =
        (candidate.similarity_score * weights.semantic_similarity) +
        (qualityNormalized * weights.quality_score) +
        (popularityNormalized * weights.popularity);

      return {
        ...candidate,
        quality_score_normalized: qualityNormalized,
        popularity_score_normalized: popularityNormalized,
        final_score: finalScore
      };
    });

    // Sort by final score descending
    return scored.sort((a, b) => b.final_score - a.final_score);
  }

  /**
   * Track search usage for analytics
   */
  private async trackSearchUsage(
    userId: string,
    query: string,
    resultsCount: number,
    executionTimeMs: number
  ): Promise<void> {
    try {
      // Check if user has PRPM+
      const userResult = await this.server.pg.query(
        `SELECT subscription_tier FROM users WHERE id = $1`,
        [userId]
      );

      const hasPRPMPlus = userResult.rows[0]?.subscription_tier === 'prpm_plus';

      // Log to analytics (async, don't block response)
      setImmediate(async () => {
        try {
          await this.server.pg.query(
            `INSERT INTO ai_search_usage (
              user_id, query, results_count, execution_time_ms, has_prpm_plus, created_at
            ) VALUES ($1, $2, $3, $4, $5, NOW())`,
            [userId, query, resultsCount, executionTimeMs, hasPRPMPlus]
          );
        } catch (error) {
          this.server.log.error({ error }, 'Failed to track AI search usage');
        }
      });
    } catch (error) {
      // Don't fail the search if tracking fails
      this.server.log.warn({ error }, 'Failed to track search usage');
    }
  }

  /**
   * Get similar packages using vector similarity
   */
  async getSimilarPackages(packageId: string, limit: number = 5): Promise<AISearchResult[]> {
    try {
      // Get the package's embedding
      const embeddingResult = await this.server.pg.query(
        `SELECT embedding FROM package_embeddings WHERE package_id = $1`,
        [packageId]
      );

      if (embeddingResult.rows.length === 0) {
        return [];
      }

      const embedding = embeddingResult.rows[0].embedding;

      // Find similar packages
      const query = `
        SELECT
          p.id as package_id,
          p.name,
          p.description,
          p.format,
          p.subtype,
          p.quality_score,
          p.total_downloads,
          1 - (pe.embedding <=> $1::vector) as similarity_score
        FROM packages p
        JOIN package_embeddings pe ON p.id = pe.package_id
        WHERE p.id != $2
          AND p.visibility = 'public'
          AND p.deprecated = false
        ORDER BY pe.embedding <=> $1::vector
        LIMIT $3
      `;

      const result = await this.server.pg.query(query, [embedding, packageId, limit]);

      return result.rows.map(row => ({
        package_id: row.package_id,
        name: row.name,
        description: row.description,
        format: row.format,
        subtype: row.subtype,
        author_id: '',
        version: '',
        quality_score: row.quality_score,
        total_downloads: row.total_downloads,
        stars_count: 0,
        ai_use_case_description: null,
        ai_problem_statement: null,
        ai_best_for: null,
        ai_similar_to: [],
        similarity_score: parseFloat(row.similarity_score),
        quality_score_normalized: 0,
        popularity_score_normalized: 0,
        final_score: 0
      }));
    } catch (error) {
      this.server.log.error({ error, packageId }, 'Failed to get similar packages');
      return [];
    }
  }
}
