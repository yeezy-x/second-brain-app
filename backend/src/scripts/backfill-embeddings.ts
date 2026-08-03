/**
 * Backfill embedding jobs for existing content (one-time / manual).
 *
 * Usage:
 *   npm run backfill:embeddings
 *   npm run backfill:embeddings -- --dry-run
 *   npm run backfill:embeddings -- --limit=50
 *   npm run backfill:embeddings -- --userId=<uuid>
 *   npm run backfill:embeddings -- --retry-failed
 *
 * Requires: AI_ENABLED=true, Redis up, worker running (`npm run worker`).
 */
import { connectDB, prisma } from "../config/db";
import { env } from "../config/env";
import {
  buildEmbeddingText,
  enqueueEmbeddingJob,
} from "../jobs/embedding.job";

type BackfillRow = {
  id: string;
  userId: string;
  title: string | null;
  description: string | null;
  metadata: unknown;
  aiStatus: string;
};

function parseArgs(argv: string[]) {
  const dryRun = argv.includes("--dry-run");
  const retryFailed = argv.includes("--retry-failed");

  let limit: number | undefined;
  let userId: string | undefined;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--limit" && argv[i + 1]) {
      limit = Number(argv[++i]);
    } else if (arg.startsWith("--limit=")) {
      limit = Number(arg.slice("--limit=".length));
    } else if (arg === "--userId" && argv[i + 1]) {
      userId = argv[++i];
    } else if (arg.startsWith("--userId=")) {
      userId = arg.slice("--userId=".length);
    }
  }

  if (limit !== undefined && (!Number.isFinite(limit) || limit < 1)) {
    throw new Error("--limit must be a positive number");
  }

  if (userId && !/^[0-9a-f-]{36}$/i.test(userId)) {
    throw new Error("--userId must be a valid UUID");
  }

  return { dryRun, retryFailed, limit, userId };
}

async function fetchCandidates(
  userId: string | undefined,
  retryFailed: boolean,
  limit: number | undefined
): Promise<BackfillRow[]> {
  const statusClause = retryFailed
    ? `("aiStatus" IN ('pending', 'failed') OR embedding IS NULL)`
    : `("aiStatus" = 'pending' OR embedding IS NULL)`;

  const params: unknown[] = [];
  let paramIdx = 1;

  let sql = `
    SELECT id, "userId", title, description, metadata, "aiStatus"::text AS "aiStatus"
    FROM "Content"
    WHERE ${statusClause}
  `;

  if (userId) {
    sql += ` AND "userId" = $${paramIdx}::uuid`;
    params.push(userId);
    paramIdx += 1;
  }

  sql += ` ORDER BY "createdAt" ASC`;

  if (limit !== undefined) {
    sql += ` LIMIT $${paramIdx}`;
    params.push(limit);
  }

  return prisma.$queryRawUnsafe<BackfillRow[]>(sql, ...params);
}

async function main() {
  const { dryRun, retryFailed, limit, userId } = parseArgs(process.argv.slice(2));

  if (!env.AI_ENABLED) {
    console.error("AI_ENABLED must be true to backfill embeddings.");
    process.exit(1);
  }

  await connectDB();

  const rows = await fetchCandidates(userId, retryFailed, limit);
  const total = rows.length;

  console.log(
    [
      `Found ${total} candidate row(s).`,
      dryRun ? "[DRY RUN]" : "",
      userId ? `userId=${userId}` : "",
      retryFailed ? "including failed" : "",
      limit ? `limit=${limit}` : "",
    ]
      .filter(Boolean)
      .join(" ")
  );

  if (total === 0) {
    console.log("Nothing to backfill.");
    return;
  }

  let enqueued = 0;
  let skipped = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const progress = `[${i + 1}/${total}]`;

    const text = buildEmbeddingText({
      title: row.title,
      description: row.description,
      metadata: row.metadata,
    });

    if (!text) {
      skipped += 1;
      console.log(`${progress} skip ${row.id} — no embeddable text`);
      continue;
    }

    if (dryRun) {
      enqueued += 1;
      console.log(
        `${progress} [dry-run] would enqueue ${row.id} (aiStatus=${row.aiStatus})`
      );
      continue;
    }

    await enqueueEmbeddingJob(row.id, row.userId);
    enqueued += 1;
    console.log(`${progress} enqueued ${row.id} (aiStatus=${row.aiStatus})`);
  }

  console.log("");
  console.log(`Summary: enqueued=${enqueued}, skipped=${skipped}, total=${total}`);
  if (!dryRun && enqueued > 0) {
    console.log("Ensure the worker is running: npm run worker");
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
