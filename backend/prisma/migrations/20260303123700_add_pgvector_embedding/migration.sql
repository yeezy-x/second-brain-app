-- Enable pgvector (one-time per database; safe to re-run)
CREATE EXTENSION IF NOT EXISTS vector;

-- AiStatus enum for embedding pipeline state
DO $$ BEGIN
    CREATE TYPE "AiStatus" AS ENUM ('pending', 'done', 'failed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Embedding vector (768 dims for Gemini text-embedding-004) + processing status
ALTER TABLE "Content" ADD COLUMN IF NOT EXISTS "embedding" vector(768);
ALTER TABLE "Content" ADD COLUMN IF NOT EXISTS "aiStatus" "AiStatus" NOT NULL DEFAULT 'pending';

-- Btree index for filtering by user + aiStatus (e.g. pending embedding jobs)
CREATE INDEX IF NOT EXISTS "Content_userId_aiStatus_idx" ON "Content" ("userId", "aiStatus");

-- HNSW index for cosine similarity — Prisma cannot model this; keep in raw SQL
CREATE INDEX IF NOT EXISTS content_embedding_idx
ON "Content"
USING hnsw (embedding vector_cosine_ops);
