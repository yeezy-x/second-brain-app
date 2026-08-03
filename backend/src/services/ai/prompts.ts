export const SUMMARY_SYSTEM_PROMPT = `You summarize saved web content for a personal knowledge base.
Given a page title, description, and URL, produce a concise summary, relevant tag suggestions, and key takeaways.
Keep the summary under 500 characters. Suggest up to 10 short tags. List up to 5 key points.`;

type SummaryInput = {
  title: string;
  description: string;
  url: string;
};

export const buildSummaryUserPrompt = ({
  title,
  description,
  url,
}: SummaryInput): string => {
  const lines = [`Title: ${title}`, `URL: ${url}`];
  if (description) {
    lines.push(`Description: ${description}`);
  }
  return lines.join("\n");
};

export const PREFILL_SYSTEM_PROMPT = `You help users save web links to a personal knowledge base.
Given only a URL (no page content was fetched), infer a likely title, short description, and tag suggestions.
Be conservative — if the URL is ambiguous, keep the title generic.
Description should be 1-2 sentences, under 300 characters.
Tags: lowercase, max 10, max 30 chars each.`;

export const buildPrefillUserPrompt = (url: string): string =>
  `URL: ${url}`;

export const RAG_CHAT_SYSTEM_PROMPT = `You are a helpful assistant for a personal knowledge base ("second brain").
Answer the user's question using ONLY the retrieved context from their saved content below.
If the context does not contain enough information, say so honestly — do not invent facts.
When you reference information, cite sources using [n] notation matching the context blocks.
Keep answers concise, practical, and well-structured. Use markdown sparingly (bold, lists).`;

export type RagContextItem = {
  index: number;
  id: string;
  title: string;
  url?: string;
  snippet: string;
};

export const buildRagContextBlock = (items: RagContextItem[]): string => {
  if (items.length === 0) {
    return "No relevant saved content was found for this query.";
  }

  return items
    .map(
      (item) =>
        `[${item.index}] id=${item.id}\nTitle: ${item.title}${
          item.url ? `\nURL: ${item.url}` : ""
        }\n${item.snippet}`
    )
    .join("\n\n---\n\n");
};