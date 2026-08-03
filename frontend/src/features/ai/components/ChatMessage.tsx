import type { ChatMessage as ChatMessageType } from "@/features/ai/types";
import { SourceCitation } from "@/features/ai/components/SourceCitation";
import { Sparkles, User } from "lucide-react";

type Props = {
  message: ChatMessageType;
};

export function ChatMessage({ message }: Props) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex gap-2 ${isUser ? "justify-end" : "justify-start"}`}
      data-testid={`chat-message-${message.role}`}
    >
      {!isUser ? (
        <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-accent/30 bg-accent/10 text-accent">
          <Sparkles className="h-3.5 w-3.5" />
        </div>
      ) : null}

      <div
        className={`max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed ${
          isUser
            ? "bg-accent text-accent-fg"
            : "border border-border bg-bg-elev-2 text-fg"
        }`}
      >
        <p className="whitespace-pre-wrap break-words">
          {message.content || (isUser ? "" : "…")}
        </p>
        {!isUser && message.sources?.length ? (
          <SourceCitation sources={message.sources} />
        ) : null}
      </div>

      {isUser ? (
        <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border border-border bg-bg-elev-2 text-muted-fg">
          <User className="h-3.5 w-3.5" />
        </div>
      ) : null}
    </div>
  );
}
