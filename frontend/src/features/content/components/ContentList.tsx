import * as React from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ContentCard } from "@/features/content/components/ContentCard";
import { ContentListSkeleton } from "@/components/states/ContentListSkeleton";
import { EmptyState } from "@/components/states/EmptyState";
import { ErrorState } from "@/components/states/ErrorState";

import { useContentList } from "@/features/content/hooks/useContentList";
import { CONTENT_TYPES, type ContentType, type SearchMode } from "@/features/content/types";

const PAGE_LIMIT = 20;

function isContentType(value: string | null): value is ContentType {
  return value !== null && (CONTENT_TYPES as string[]).includes(value);
}

type Props = {
  onOpenCreate: () => void;
};

export function ContentList({ onOpenCreate }: Props) {
  const [params, setParams] = useSearchParams();
  const typeParam = params.get("type");
  const type = isContentType(typeParam) ? typeParam : undefined;
  const tag = params.get("tag") ?? undefined;
  const search = params.get("search") ?? undefined;
  const mode: SearchMode | undefined =
    params.get("mode") === "semantic" ? "semantic" : undefined;

  // Cursor pagination is mutually exclusive with search per backend.
  const [cursors, setCursors] = React.useState<string[]>([]); // stack of next cursors used for paging forward
  const currentCursor: string | undefined = search ? undefined : cursors[cursors.length - 1];

  // Reset cursors whenever filters change, otherwise we'd page through the wrong list.
  React.useEffect(() => {
    setCursors([]);
  }, [type, tag, search, mode]);

  const queryParams = {
    type,
    tag,
    search,
    mode,
    cursor: currentCursor,
    limit: PAGE_LIMIT,
  };

  const { data, isLoading, isFetching, isError, error, refetch } =
    useContentList(queryParams);

  const items = data?.items ?? [];
  const nextCursor = data?.nextCursor ?? null;

  if (isLoading && !data) {
    return <ContentListSkeleton rows={6} />;
  }

  if (isError) {
    return (
      <ErrorState
        error={error}
        title="Couldn't load your content"
        onRetry={() => refetch()}
      />
    );
  }

  if (items.length === 0) {
    const filtersActive = Boolean(type || tag || search);
    if (filtersActive) {
      return (
        <EmptyState
          title="No matches"
          description="Try adjusting your filters or clearing your search."
          action={{
            label: "Clear filters",
            testId: "empty-clear-filters",
            onClick: () => setParams(new URLSearchParams(), { replace: true }),
          }}
        />
      );
    }
    return (
      <EmptyState
        title="Your second brain is empty"
        description="Save your first tweet, video, link or document to get started."
        action={{
          label: "Add your first item",
          testId: "empty-add-first",
          onClick: onOpenCreate,
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-fg" data-testid="content-list-meta">
          Showing {items.length}
          {nextCursor || cursors.length > 0 ? " on this page" : ""}
          {type ? ` · ${type}` : ""}
          {tag ? ` · #${tag}` : ""}
          {search ? ` · "${search}"` : ""}
          {search && mode === "semantic" ? " · smart" : ""}
        </p>
        {isFetching && data ? (
          <span className="inline-flex items-center gap-2 text-xs text-muted-fg">
            <Loader2 className="h-3 w-3 animate-spin" /> Refreshing
          </span>
        ) : null}
      </div>

      <ul
        className="grid gap-3"
        data-testid="content-list"
        aria-busy={isFetching ? "true" : undefined}
      >
        {items.map((item) => (
          <ContentCard key={item._id} item={item} />
        ))}
      </ul>

      {!search ? (
        <div className="mt-2 flex items-center justify-between">
          <Button
            variant="ghost"
            disabled={cursors.length === 0 || isFetching}
            onClick={() => setCursors((s) => s.slice(0, -1))}
            data-testid="content-list-prev"
          >
            ← Previous
          </Button>
          <Button
            variant="secondary"
            disabled={!nextCursor || isFetching}
            onClick={() => {
              if (nextCursor) setCursors((s) => [...s, nextCursor]);
            }}
            data-testid="content-list-next"
          >
            Next →
          </Button>
        </div>
      ) : null}
    </div>
  );
}
