import * as React from "react";
import {
  ChevronDown,
  ExternalLink,
  Loader2,
  Sparkles,
  Trash2,
  X,
  Video,
  FileText,
  Link2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useAddContentTag } from "@/features/content/hooks/useAddContentTag";
import { useDeleteContent } from "@/features/content/hooks/useDeleteContent";
import type { ContentItem, ContentType } from "@/features/content/types";
import { formatRelativeDate, safeUrlHostname } from "@/lib/utils";
import { getErrorMessage } from "@/lib/error";
import { toast } from "sonner";

const TYPE_META: Record<
  ContentType,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    tone: "accent" | "muted" | "neutral" | "success";
  }
> = {
  tweet: { label: "Tweet", icon: X, tone: "accent" },
  video: { label: "Video", icon: Video, tone: "accent" },
  document: { label: "Document", icon: FileText, tone: "neutral" },
  link: { label: "Link", icon: Link2, tone: "muted" },
};

export function ContentCard({ item }: { item: ContentItem }) {
  const meta = TYPE_META[item.type];
  const TypeIcon = meta.icon;
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [summaryOpen, setSummaryOpen] = React.useState(false);
  const del = useDeleteContent();
  const addTag = useAddContentTag();
  const contentId = item._id || item.id;
  const tagNames = (item.tags ?? []).map((t) => t.name).filter(Boolean);

  const ai = item.metadata?.ai;
  const summary = ai?.summary;
  const keyPoints = ai?.keyPoints ?? [];
  const suggestedTags = (ai?.suggestedTags ?? []).filter(
    (t) => !tagNames.includes(t)
  );
  const isEnriching = Boolean(
    item.url && !summary && item.metadataStatus !== "failed"
  );

  const handleDelete = async () => {
    try {
      await del.mutateAsync(contentId);
      toast.success("Content deleted");
      setConfirmOpen(false);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleApplyTag = async (tag: string) => {
    try {
      await addTag.mutateAsync({ id: contentId, tag });
      toast.success(`Added #${tag}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <li
      data-testid={`content-card-${contentId}`}
      className="group relative animate-fade-in rounded-lg border border-border bg-bg-elev/70 p-4 transition-colors hover:border-muted-fg/30 hover:bg-bg-elev"
    >
      <div className="flex items-start gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-border bg-bg-elev-2 text-muted-fg">
          <TypeIcon className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={meta.tone}>{meta.label}</Badge>
            <span className="text-xs text-muted-fg">
              {formatRelativeDate(item.createdAt)}
            </span>
            {item.url ? (
              <span className="text-xs text-muted-fg/80" title={item.url}>
                · {safeUrlHostname(item.url)}
              </span>
            ) : null}
          </div>

          <h3
            className="mt-1.5 truncate text-[15px] font-semibold text-fg"
            title={item.title}
          >
            {item.title || <span className="text-muted-fg italic">Untitled</span>}
          </h3>

          {isEnriching ? (
            <p
              className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-fg"
              data-testid={`content-enriching-${contentId}`}
            >
              <Loader2 className="h-3 w-3 animate-spin" />
              Generating AI summary…
            </p>
          ) : null}

          {summary ? (
            <div className="mt-2">
              <button
                type="button"
                onClick={() => setSummaryOpen((v) => !v)}
                className="flex w-full items-start gap-1.5 text-left text-xs text-muted-fg hover:text-fg"
                data-testid={`content-summary-toggle-${contentId}`}
                aria-expanded={summaryOpen}
              >
                <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-accent" />
                <span className={summaryOpen ? "" : "line-clamp-2"}>
                  {summary}
                </span>
                <ChevronDown
                  className={`ml-auto h-3.5 w-3.5 shrink-0 transition-transform ${
                    summaryOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {summaryOpen && keyPoints.length > 0 ? (
                <ul
                  className="mt-2 space-y-1 border-l border-border pl-3 text-xs text-muted-fg"
                  data-testid={`content-keypoints-${contentId}`}
                >
                  {keyPoints.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          ) : null}

          {tagNames.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {tagNames.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center rounded-full border border-border bg-bg-elev-2 px-2 py-0.5 text-[11px] text-muted-fg"
                >
                  #{t}
                </span>
              ))}
            </div>
          ) : null}

          {suggestedTags.length > 0 ? (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] uppercase tracking-wide text-muted-fg/70">
                Suggested
              </span>
              {suggestedTags.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleApplyTag(t)}
                  disabled={addTag.isPending}
                  className="inline-flex items-center gap-1 rounded-full border border-dashed border-accent/40 bg-accent/5 px-2 py-0.5 text-[11px] text-accent transition-colors hover:bg-accent/15 disabled:opacity-50"
                  data-testid={`suggested-tag-${contentId}-${t}`}
                >
                  <Sparkles className="h-2.5 w-2.5" />
                  #{t}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          {item.url ? (
            <Button
              asChild
              variant="ghost"
              size="icon"
              aria-label="Open link"
              data-testid={`open-content-${contentId}`}
            >
              <a href={item.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          ) : null}
          <Button
            variant="ghost"
            size="icon"
            aria-label="Delete content"
            onClick={() => setConfirmOpen(true)}
            data-testid={`delete-content-btn-${contentId}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Delete this item?"
        description="This action can't be undone. The item will be removed from your second brain immediately."
        confirmLabel="Delete"
        destructive
        loading={del.isPending}
        onConfirm={handleDelete}
        testIdPrefix={`delete-${contentId}`}
      />
    </li>
  );
}
