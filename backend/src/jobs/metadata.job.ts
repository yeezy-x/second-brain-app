import { prisma } from "../config/db";
import { logger } from "../core/logger";
import { extractMetadata } from "../utils/metadata";
import { enqueueEnrichmentJob } from "./enrichment.job";

export const processMetadata = async (contentId: string, url: string) => {
  try {
    await prisma.content.update({
      where: { id: contentId },
      data: { metadataStatus: "pending" },
    });
    const metadata = await extractMetadata(url);
    const isFallback = metadata.title === url;
    await prisma.content.update({
      where: { id: contentId },
      data: {
        metadata,
        metadataStatus: isFallback ? "fallback" : "done",
      },
    });
    logger.info({ contentId, metadata }, "Metadata processed");

    const content = await prisma.content.findUnique({
      where: { id: contentId },
      select: { userId: true },
    });

    if (content?.userId) {
      await enqueueEnrichmentJob(contentId, content.userId);
    }
  } catch (err) {
    logger.error({ err, contentId }, "Metadata processing failed");
    await prisma.content.update({
      where: { id: contentId },
      data: { metadataStatus: "failed" },
    });
    throw err;
  }
};
