import { Content } from "../modules/content/content.model";
import { logger } from "../core/logger";
import { extractMetadata } from "../utils/metadata";

export const processMetadata = async (contentId: string, url: string) => {
  try {
    await Content.findByIdAndUpdate(contentId, {
      metadataStatus: "pending",
    });
    const metadata = await extractMetadata(url);
    const isFallback=metadata.title===url;
    await Content.findByIdAndUpdate(contentId, {
      metadata,
      metadataStatus: isFallback ? "fallback" : "done",
    });
    logger.info({ contentId, metadata }, "Metadata processed");
  } catch (err) {
    logger.error({ err, contentId }, "Metadata processing failed");
    await Content.findByIdAndUpdate(contentId, {
      metadataStatus: "failed",
    });
    throw err;
  }
};