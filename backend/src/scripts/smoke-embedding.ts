/**
 * Smoke test for Step 2 — enqueue one embedding job.
 *
 * Usage:
 *   npm run smoke:embedding -- <contentId> <userId>
 */
import { connectDB } from "../config/db";
import { enqueueEmbeddingJob } from "../jobs/embedding.job";

const contentId = process.argv[2];
const userId = process.argv[3];

async function main() {
  if (!contentId || !userId) {
    console.error(
      "Usage: npm run smoke:embedding -- <contentId> <userId>"
    );
    process.exit(1);
  }

  await connectDB();
  await enqueueEmbeddingJob(contentId, userId);
  console.log(`Enqueued embedding job for content ${contentId}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
