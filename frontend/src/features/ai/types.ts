/**
 * AI feature types — chat + prefill.
 */
export type PrefillRequest = {
  url: string;
};

export type PrefillResponse = {
  title: string;
  description: string;
  suggestedTags: string[];
};

export type ChatRole = "user" | "assistant";

export type ChatSource = {
  id: string;
  title: string;
  url?: string;
  score: number;
};

export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  sources?: ChatSource[];
};

export type ChatRequest = {
  messages: Array<{ role: ChatRole; content: string }>;
};

export type ChatStreamEvent =
  | { event: "sources"; data: ChatSource[] }
  | { event: "text-delta"; data: string }
  | { event: "done"; data: { sources: ChatSource[] } }
  | { event: "error"; data: { message: string } };
