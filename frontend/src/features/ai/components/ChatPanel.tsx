import * as React from "react";
import { Loader2, Send, Sparkles, Square, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ChatMessage } from "@/features/ai/components/ChatMessage";
import { useAiChat } from "@/features/ai/hooks/useAiChat";
import { cn } from "@/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ChatPanel({ open, onOpenChange }: Props) {
  const { messages, isStreaming, error, sendMessage, clearChat, stop } =
    useAiChat();
  const [draft, setDraft] = React.useState("");
  const bottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) {
      setDraft("");
    }
  }, [open]);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    await sendMessage(text);
  };

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => onOpenChange(false)}
        aria-hidden={!open}
      />

      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-border bg-bg-elev shadow-2xl transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full"
        )}
        data-testid="chat-panel"
        aria-hidden={!open}
      >
        <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-accent" />
            <div>
              <h2 className="text-sm font-semibold text-fg">Ask your brain</h2>
              <p className="text-[11px] text-muted-fg">
                Answers from your saved content
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={clearChat}
              aria-label="Clear chat"
              data-testid="chat-clear"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              aria-label="Close chat"
              data-testid="chat-close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-muted-fg">
              <Sparkles className="h-8 w-8 text-accent/60" />
              <p className="text-sm font-medium text-fg">
                What did I save about…?
              </p>
              <p className="max-w-xs text-xs">
                Ask questions in natural language. I&apos;ll search your library
                and cite relevant items.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {messages.map((m) => (
                <ChatMessage key={m.id} message={m} />
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {error ? (
          <p className="px-4 pb-2 text-xs text-danger" data-testid="chat-error">
            {error}
          </p>
        ) : null}

        <form
          onSubmit={handleSubmit}
          className="border-t border-border p-4"
        >
          <div className="flex gap-2">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Ask about your saved content…"
              rows={2}
              className="min-h-[72px] resize-none"
              disabled={isStreaming}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void handleSubmit(e);
                }
              }}
              data-testid="chat-input"
            />
            <div className="flex flex-col gap-2">
              {isStreaming ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  onClick={stop}
                  aria-label="Stop generating"
                  data-testid="chat-stop"
                >
                  <Square className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="icon"
                  disabled={!draft.trim()}
                  aria-label="Send message"
                  data-testid="chat-send"
                >
                  <Send className="h-4 w-4" />
                </Button>
              )}
              {isStreaming ? (
                <Loader2 className="mx-auto h-4 w-4 animate-spin text-muted-fg" />
              ) : null}
            </div>
          </div>
        </form>
      </aside>
    </>
  );
}
