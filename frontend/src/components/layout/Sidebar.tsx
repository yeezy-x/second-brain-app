// React import not required (jsx: react-jsx)
import { NavLink, useLocation } from "react-router-dom";
import { Inbox, FileText, Link2, Tag as TagIcon, X , Video } from "lucide-react";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";
import { useTags } from "@/features/tags/hooks/useTags";

const TYPE_LINKS = [
  { to: "/?type=tweet", label: "Tweets", icon: X, type: "tweet" },
  { to: "/?type=video", label: "Videos", icon: Video, type: "video" },
  { to: "/?type=document", label: "Documents", icon: FileText, type: "document" },
  { to: "/?type=link", label: "Links", icon: Link2, type: "link" },
] as const;

export function Sidebar({
  onNavigate,
  testIdSuffix = "desktop",
}: {
  onNavigate?: () => void;
  testIdSuffix?: string;
}) {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const activeType = params.get("type");
  const activeTag = params.get("tag");
  const { data: tags } = useTags();

  return (
    <aside className="flex h-full w-full flex-col gap-6 border-r border-border bg-bg-elev/60 p-4 lg:w-64">
      <div className="px-1">
        <Logo />
      </div>

      <nav className="flex flex-col gap-1" data-testid={`sidebar-nav-${testIdSuffix}`}>
        <NavLink
          to="/"
          end
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "group flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
              isActive && !activeType && !activeTag
                ? "bg-bg-elev-2 text-fg"
                : "text-muted-fg hover:bg-bg-elev-2/70 hover:text-fg"
            )
          }
          data-testid="nav-all"
        >
          <Inbox className="h-4 w-4" />
          All content
        </NavLink>

        {TYPE_LINKS.map(({ to, label, icon: Icon, type }) => (
          <NavLink
            key={type}
            to={to}
            onClick={onNavigate}
            className={() =>
              cn(
                "group flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                activeType === type
                  ? "bg-bg-elev-2 text-fg"
                  : "text-muted-fg hover:bg-bg-elev-2/70 hover:text-fg"
              )
            }
            data-testid={`nav-type-${type}`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between px-3 text-[11px] uppercase tracking-[0.14em] text-muted-fg">
          <span>Tags</span>
          {tags && tags.length > 0 ? (
            <span className="rounded-full bg-bg-elev-2 px-1.5 py-0.5 text-[10px] text-muted-fg">
              {tags.length}
            </span>
          ) : null}
        </div>
        <div
          className="flex flex-wrap gap-1.5 px-2 max-h-48 overflow-y-auto"
          data-testid={`sidebar-tags-${testIdSuffix}`}
        >
          {!tags || tags.length === 0 ? (
            <p className="px-1 text-xs text-muted-fg/80">
              Tags appear here once you add some.
            </p>
          ) : (
            tags.map((t) => (
              <NavLink
                key={t._id}
                onClick={onNavigate}
                to={`/?tag=${encodeURIComponent(t.name)}`}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition-colors",
                  activeTag === t.name
                    ? "border-accent/50 bg-accent/10 text-accent"
                    : "border-border bg-bg-elev-2/70 text-muted-fg hover:text-fg hover:border-muted-fg/40"
                )}
                data-testid={`tag-${t.name}`}
              >
                <TagIcon className="h-3 w-3" />
                {t.name}
              </NavLink>
            ))
          )}
        </div>
      </div>

      <div className="mt-auto px-3 text-[11px] text-muted-fg/80">
        v1.0 · made for thinkers
      </div>
    </aside>
  );
}
