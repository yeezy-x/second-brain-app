import type { ChatRequest, ChatStreamEvent, PrefillRequest, PrefillResponse } from "@/features/ai/types";
import { http } from "@/lib/api-client";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api/v1";

async function* parseSseStream(
  body: ReadableStream<Uint8Array>
): AsyncGenerator<ChatStreamEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const chunks = buffer.split("\n\n");
    buffer = chunks.pop() ?? "";

    for (const chunk of chunks) {
      if (!chunk.trim()) continue;

      let event = "message";
      let dataLine = "";

      for (const line of chunk.split("\n")) {
        if (line.startsWith("event: ")) event = line.slice(7).trim();
        if (line.startsWith("data: ")) dataLine = line.slice(6);
      }

      if (!dataLine) continue;

      const parsed = JSON.parse(dataLine) as unknown;
      yield { event, data: parsed } as ChatStreamEvent;
    }
  }
}

export const aiApi = {
  prefill: (body: PrefillRequest, signal?: AbortSignal): Promise<PrefillResponse> =>
    http.post<PrefillResponse, PrefillRequest>("/ai/prefill", body, { signal }),

  streamChat: async function* (
    body: ChatRequest,
    signal?: AbortSignal
  ): AsyncGenerator<ChatStreamEvent> {
    const res = await fetch(`${API_BASE_URL}/ai/chat`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify(body),
      signal,
    });

    if (!res.ok) {
      let message = "Chat request failed";
      try {
        const json = (await res.json()) as { message?: string };
        if (json.message) message = json.message;
      } catch {
        // ignore
      }
      throw new Error(message);
    }

    if (!res.body) {
      throw new Error("No response stream");
    }

    yield* parseSseStream(res.body);
  },
};
