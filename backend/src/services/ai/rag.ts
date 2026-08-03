import { prisma } from "../../config/db";
import { generateEmbedding } from "./client";
import { toVectorLiteral } from "../../utils/vector";

export type RetrievedChunk = {
  id: string;
  title: string;
  url: string | null;
  type: string;
  snippet: string;
  score: number;
};

type MetadataJson = {
  title?: string;
  description?: string;
  ai?: { summary?: string };
};

function buildSnippet(row: {
  title: string | null;
  description: string | null;
  metadata: unknown;
}): string {
  const meta = (row.metadata ?? {}) as MetadataJson;
  const parts = [
    row.description,
    meta.ai?.summary,
    meta.description,
    meta.title,
  ].filter((p) => typeof p === "string" && p.trim());

  const text = parts.join("\n").trim();
  return text.length > 600 ? `${text.slice(0, 597)}...` : text;
}

export async function retrieveRelevantContent(
  userId: string,
  query: string,
  limit = 8
): Promise<RetrievedChunk[]> {
  const queryEmbedding = await generateEmbedding(query, "RETRIEVAL_QUERY");
  if (!queryEmbedding || queryEmbedding.length !== 768) {
    return [];
  }

  const vectorLiteral = toVectorLiteral(queryEmbedding);

  const semanticResults = await prisma.$queryRawUnsafe<
    Array<{ id: string; score: number | string }>
  >(
    `SELECT c.id, 1 - (c.embedding <=> $1::vector) AS score
     FROM "Content" c
     WHERE c."userId" = $2::uuid
       AND c.embedding IS NOT NULL
       AND c."aiStatus" = 'done'::"AiStatus"
     ORDER BY c.embedding <=> $1::vector
     LIMIT $3`,
    vectorLiteral,
    userId,
    limit
  );

  if (semanticResults.length === 0) return [];

  const ids = semanticResults.map((r) => r.id);
  const scoreMap = new Map(
    semanticResults.map((r) => [r.id, Number(r.score)])
  );

  const rows = await prisma.content.findMany({
    where: { id: { in: ids }, userId },
    select: {
      id: true,
      title: true,
      description: true,
      url: true,
      type: true,
      metadata: true,
    },
  });

  return ids
    .map((id) => rows.find((r) => r.id === id))
    .filter((r): r is NonNullable<typeof r> => r != null)
    .map((row) => ({
      id: row.id,
      title: row.title ?? "Untitled",
      url: row.url,
      type: row.type,
      snippet: buildSnippet(row),
      score: scoreMap.get(row.id) ?? 0,
    }));
}
