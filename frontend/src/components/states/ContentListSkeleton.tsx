// React import not required (jsx: react-jsx)
import { Skeleton } from "@/components/ui/skeleton";

export function ContentListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <ul className="grid gap-3" aria-busy="true" data-testid="content-list-skeleton">
      {Array.from({ length: rows }).map((_, i) => (
        <li
          key={i}
          className="rounded-lg border border-border bg-bg-elev/60 p-4"
        >
          <div className="flex items-start gap-3">
            <Skeleton className="h-9 w-9" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/5" />
              <Skeleton className="h-3 w-2/5" />
              <div className="flex gap-2 pt-1">
                <Skeleton className="h-4 w-12 rounded-full" />
                <Skeleton className="h-4 w-16 rounded-full" />
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
