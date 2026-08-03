import * as React from "react";
import { aiApi } from "@/features/ai/api/ai-api";
import type { ChatMessage, ChatSource } from "@/features/ai/types";

function createId() {
  return crypto.randomUUID();
}

export function useAiChat() {
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const abortRef = React.useRef<AbortController | null>(null);

  const clearChat = React.useCallback(() => {
    abortRef.current?.abort();
    setMessages([]);
    setError(null);
    setIsStreaming(false);
  }, []);

  const sendMessage = React.useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || isStreaming) return;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const userMessage: ChatMessage = {
        id: createId(),
        role: "user",
        content: trimmed,
      };

      const assistantId = createId();
      const history = [...messages, userMessage];

      setMessages([
        ...history,
        { id: assistantId, role: "assistant", content: "", sources: [] },
      ]);
      setError(null);
      setIsStreaming(true);

      let sources: ChatSource[] = [];

      try {
        const payload = {
          messages: history.map((m) => ({ role: m.role, content: m.content })),
        };

        for await (const evt of aiApi.streamChat(payload, controller.signal)) {
          if (evt.event === "sources") {
            sources = evt.data;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, sources } : m
              )
            );
          } else if (evt.event === "text-delta") {
            const delta = evt.data;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId
                  ? { ...m, content: m.content + delta }
                  : m
              )
            );
          } else if (evt.event === "done") {
            sources = evt.data.sources ?? sources;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantId ? { ...m, sources } : m
              )
            );
          } else if (evt.event === "error") {
            throw new Error(evt.data.message);
          }
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        const message =
          err instanceof Error ? err.message : "Failed to get a response";
        setError(message);
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
      } finally {
        setIsStreaming(false);
      }
    },
    [isStreaming, messages]
  );

  const stop = React.useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
  }, []);

  return {
    messages,
    isStreaming,
    error,
    sendMessage,
    clearChat,
    stop,
  };
}
