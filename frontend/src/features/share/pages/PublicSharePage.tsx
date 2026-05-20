import * as React from "react";
import { Link, useParams } from "react-router-dom";
import { ExternalLink, FileText, Link2, X, Video, ArrowLeft } from "lucide-react";

import { Logo } from "@/components/Logo";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ContentListSkeleton } from "@/components/states/ContentListSkeleton";
import { ErrorState } from "@/components/states/ErrorState";
import { EmptyState } from "@/components/states/EmptyState";

import { usePublicShare } from "@/features/share/hooks/usePublicShare";
import { useAuthStore } from "@/store/auth-store";
import { formatRelativeDate, safeUrlHostname } from "@/lib/utils";
import type { PublicSharedItem } from "@/features/share/types";

const TYPE_META: Record<
  PublicSharedItem["type"],
  { label: string; icon: React.ComponentType<{ className?: string }>; tone: "accent" | "muted" | "neutral" }
> = {
  tweet: { label: "Tweet", icon: X, tone: "accent" },
  video: { label: "Video", icon: Video, tone: "accent" },
  document: { label: "Document", icon: FileText, tone: "neutral" },
  link: { label: "Link", icon: Link2, tone: "muted" },
};

export default function PublicSharePage() {
  const { shareId } = useParams<{ shareId: string }>();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { data, isLoading, isError, error, refetch } = usePublicShare(shareId);

  return (
    <div className="min-h-screen w-full bg-bg">
      <header className="border-b border-border bg-bg-elev/60 backdrop-blur-md">
        <div className="container flex h-14 items-center justify-between gap-3 px-4 sm:px-6">
          <Link
            to={isAuthenticated ? "/" : "/login"}
            className="flex items-center gap-2"
            data-testid="public-share-home-link"
          >
            <Logo />
          </Link>
          <Button
            asChild
            variant="ghost"
            size="sm"
            data-testid="public-share-cta"
          >
            <Link to={isAuthenticated ? "/" : "/signup"}>
              {isAuthenticated ? (
                <>
                  <ArrowLeft className="h-3.5 w-3.5" /> Back to my brain
                </>
              ) : (
                <>Build your own →</>
              )}
            </Link>
          </Button>
        </div>
      </header>

      <main className="container px-4 py-10 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 sm:mb-10 animate-fade-in">
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-fg">
              shared collection
            </p>
            <h1 className="mt-1 font-display text-2xl sm:text-[28px] font-semibold tracking-tight text-fg">
              A second brain, in public.
            </h1>
            <p className="mt-2 text-sm text-muted-fg max-w-xl">
              A read-only window into someone's saved tweets, videos, links and
              documents. The owner can disable this link any time.
            </p>
          </div>

          {isLoading ? (
            <ContentListSkeleton rows={5} />
          ) : isError ? (
            <ErrorState
              error={error}
              title="This link can't be opened"
              onRetry={() => refetch()}
              testId="public-share-error"
            />
          ) : !data || data.length === 0 ? (
            <EmptyState
              title="Nothing here yet"
              description="The owner hasn't saved anything to share."
            />
          ) : (
            <ul
              className="grid gap-3"
              data-testid="public-share-list"
            >
              {data.map((item) => (
                <PublicShareCard key={item._id} item={item} />
              ))}
            </ul>
          )}

          <footer className="mt-12 border-t border-border pt-6 text-center text-xs text-muted-fg">
            Powered by Second Brain ·{" "}
            <Link
              to={isAuthenticated ? "/" : "/signup"}
              className="text-accent underline-offset-4 hover:underline"
            >
              start your own
            </Link>
          </footer>
        </div>
      </main>
    </div>
  );
}

function PublicShareCard({ item }: { item: PublicSharedItem }) {
  const meta = TYPE_META[item.type];
  const Icon = meta.icon;
  const fallbackTitle = item.title || item.metadata?.title || "Untitled";
  const description = item.description || item.metadata?.description;

  return (
    <li
      data-testid={`public-share-card-${item._id}`}
      className="group animate-fade-in rounded-lg border border-border bg-bg-elev/70 p-4 transition-colors hover:border-muted-fg/30 hover:bg-bg-elev"
    >
      <div className="flex items-start gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md border border-border bg-bg-elev-2 text-muted-fg">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={meta.tone}>{meta.label}</Badge>
            <span className="text-xs text-muted-fg">
              {formatRelativeDate(item.createdAt)}
            </span>
            {item.url ? (
              <span className="text-xs text-muted-fg/80">
                · {safeUrlHostname(item.url)}
              </span>
            ) : null}
          </div>
          <h3 className="mt-1.5 truncate text-[15px] font-semibold text-fg">
            {fallbackTitle}
          </h3>
          {description ? (
            <p className="mt-1 line-clamp-3 text-sm text-muted-fg">{description}</p>
          ) : null}
        </div>
        {item.url ? (
          <Button
            asChild
            variant="ghost"
            size="icon"
            aria-label="Open original"
            className="opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100"
          >
            <a href={item.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        ) : null}
      </div>
    </li>
  );
}
