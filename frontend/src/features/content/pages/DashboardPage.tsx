import * as React from "react";
import { useOutletContext, useSearchParams } from "react-router-dom";
import { ContentList } from "@/features/content/components/ContentList";

type ShellCtx = { openCreate: () => void; openShare: () => void };

export default function DashboardPage() {
  const { openCreate } = useOutletContext<ShellCtx>();
  const [params] = useSearchParams();
  const type = params.get("type");
  const tag = params.get("tag");
  const search = params.get("search");
  const mode = params.get("mode");

  const heading = React.useMemo(() => {
    if (search && mode === "semantic") return `Smart results for "${search}"`;
    if (search) return `Results for "${search}"`;
    if (tag) return `Tagged · #${tag}`;
    if (type) return `${type[0]?.toUpperCase()}${type.slice(1)}s`;
    return "Everything";
  }, [type, tag, search, mode]);

  return (
    <div className="mx-auto w-full max-w-4xl">
      <header className="mb-6 sm:mb-8 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted-fg">
            second brain
          </p>
          <h1
            className="font-display text-2xl sm:text-[28px] font-semibold tracking-tight text-fg"
            data-testid="dashboard-heading"
          >
            {heading}
          </h1>
        </div>
      </header>

      <ContentList onOpenCreate={openCreate} />
    </div>
  );
}
