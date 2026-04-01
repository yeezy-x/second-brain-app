import { Content } from "../modules/content/content.model";
import { extractMetadata } from "../utils/metadata";

export const processMetadata = async (contentId: string, url: string) => {
  try {
    const metadata = await extractMetadata(url);
    await Content.findByIdAndUpdate(contentId, {
      metadata,
      metadataStatus: "done"
    });
  } catch (err) {
    await Content.findByIdAndUpdate(contentId, {
      metadataStatus: "failed"
    })
    setTimeout(() => processMetadata(contentId, url), 5 * 60 * 1000);
    console.error("Metadata job failed:", err);
  }
};