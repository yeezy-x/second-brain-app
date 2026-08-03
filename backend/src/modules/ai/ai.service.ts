import type { Response } from "express";
import { streamText } from "ai";
import { ApiError } from "../../utils/ApiError";
import { env } from "../../config/env";
import { generatePrefill, getLanguageModel } from "../../services/ai/client";
import {
  RAG_CHAT_SYSTEM_PROMPT,
  buildRagContextBlock,
  type RagContextItem,
} from "../../services/ai/prompts";
import { retrieveRelevantContent } from "../../services/ai/rag";
import type { ChatDTO, PrefillDTO } from "./ai.validation";

export type ChatSource = {
  id: string;
  title: string;
  url?: string;
  score: number;
};

export async function prefillFromUrlService(data: PrefillDTO) {
  if (!env.AI_ENABLED) {
    throw new ApiError(503, "AI features are disabled");
  }

  const url = data.url.trim();
  const result = await generatePrefill(url);

  if (!result) {
    throw new ApiError(503, "AI is unavailable");
  }

  return result;
}

function getLatestUserMessage(messages: ChatDTO["messages"]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "user") return messages[i].content;
  }
  throw new ApiError(400, "At least one user message is required");
}

export async function streamChatService(
  userId: string,
  data: ChatDTO,
  res: Response
) {
  if (!env.AI_ENABLED) {
    throw new ApiError(503, "AI features are disabled");
  }

  const latestQuery = getLatestUserMessage(data.messages);
  const retrieved = await retrieveRelevantContent(userId, latestQuery, 8);

  const contextItems: RagContextItem[] = retrieved.map((item, idx) => ({
    index: idx + 1,
    id: item.id,
    title: item.title,
    url: item.url ?? undefined,
    snippet: item.snippet,
  }));

  const sources: ChatSource[] = retrieved.map((item) => ({
    id: item.id,
    title: item.title,
    url: item.url ?? undefined,
    score: item.score,
  }));

  const system = `${RAG_CHAT_SYSTEM_PROMPT}

--- RETRIEVED CONTEXT ---
${buildRagContextBlock(contextItems)}`;

  const result = streamText({
    model: getLanguageModel(),
    system,
    messages: data.messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  });

  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  res.write(`event: sources\ndata: ${JSON.stringify(sources)}\n\n`);

  try {
    for await (const delta of result.textStream) {
      if (!delta) continue;
      res.write(`event: text-delta\ndata: ${JSON.stringify(delta)}\n\n`);
    }
    res.write(`event: done\ndata: ${JSON.stringify({ sources })}\n\n`);
    res.end();
  } catch (err) {
    if (!res.headersSent) {
      throw err;
    }
    res.write(
      `event: error\ndata: ${JSON.stringify({ message: "Stream interrupted" })}\n\n`
    );
    res.end();
  }
}
