-- Enable pgvector extension for AI-powered semantic search
-- Required for storing and querying vector embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify installation
SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';
