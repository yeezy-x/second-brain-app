import type { ChatSource } from "@/features/ai/types";
import { ExternalLink } from "lucide-react";

type Props = {
  sources: ChatSource[];
};

export function SourceCitation({ sources }: Props) {
  if (!sources.length) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-1.5" data-testid="chat-sources">
      <span className="text-[10px] uppercase tracking-wide text-muted-fg/80 w-full">
        Sources
      </span>
      {sources.map((source) => (
        <a
          key={source.id}
          href={source.url || `#content-${source.id}`}
          target={source.url ? "_blank" : undefined}
          rel={source.url ? "noopener noreferrer" : undefined}
          className="inline-flex max-w-full items-center gap-1 rounded-full border border-border bg-bg-elev-2 px-2 py-0.5 text-[11px] text-muted-fg transition-colors hover:border-accent/40 hover:text-accent"
          title={source.title}
          data-testid={`chat-source-${source.id}`}
        >
          {source.url ? (
            <ExternalLink className="h-2.5 w-2.5 shrink-0" />
          ) : null}
          <span className="truncate">{source.title}</span>
          <span className="text-[10px] text-muted-fg/70">
            {Math.round(source.score * 100)}%
          </span>
        </a>
      ))}
    </div>
  );
}
