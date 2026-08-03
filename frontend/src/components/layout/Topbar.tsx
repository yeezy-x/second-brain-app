import * as React from "react";
import { Menu, LogOut, Plus, Search, Share2, Sparkles, X, Shield } from "lucide-react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLogout } from "@/features/auth/hooks/useLogout";
import { useAuthStore } from "@/store/auth-store";
import type { SearchMode } from "@/features/content/types";
import { toast } from "sonner";

type TopbarProps = {
  onOpenSidebar: () => void;
  onCreate: () => void;
  onShare: () => void;
};

function parseSearchMode(value: string | null): SearchMode {
  return value === "semantic" ? "semantic" : "keyword";
}

export function Topbar({ onOpenSidebar, onCreate, onShare }: TopbarProps) {
  const [params, setParams] = useSearchParams();
  const initial = params.get("search") ?? "";
  const [value, setValue] = React.useState<string>(initial);
  const searchMode = parseSearchMode(params.get("mode"));
  const navigate = useNavigate();
  const logout = useLogout();
  const email = useAuthStore((s) => s.user?.email);
  const role = useAuthStore((s) => s.user?.role);

  // Keep input in sync if the URL changes externally (sidebar nav, back button).
  React.useEffect(() => {
    setValue(params.get("search") ?? "");
  }, [params]);

  // Debounced commit of search to the URL.
  React.useEffect(() => {
    const id = window.setTimeout(() => {
      const current = params.get("search") ?? "";
      if (value === current) return;
      const next = new URLSearchParams(params);
      if (value) next.set("search", value);
      else {
        next.delete("search");
        next.delete("mode");
      }
      // Search and cursor are mutually exclusive on the backend.
      next.delete("cursor");
      setParams(next, { replace: true });
    }, 300);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const setSearchMode = (mode: SearchMode) => {
    const next = new URLSearchParams(params);
    if (mode === "semantic") next.set("mode", "semantic");
    else next.delete("mode");
    next.delete("cursor");
    setParams(next, { replace: true });
  };

  const handleLogout = async () => {
    try {
      await logout.mutateAsync();
      toast.success("Logged out");
    } catch {
      toast.message("Logged out locally");
    } finally {
      navigate("/login", { replace: true });
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-bg/80 px-3 backdrop-blur-md sm:px-6">
      <Button
        variant="ghost"
        size="icon"
        onClick={onOpenSidebar}
        className="lg:hidden"
        aria-label="Open navigation"
        data-testid="topbar-menu-btn"
      >
        <Menu className="h-4 w-4" />
      </Button>

      <div className="flex min-w-0 flex-1 max-w-2xl items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-fg" />
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={
              searchMode === "semantic"
                ? "Search by meaning…"
                : "Search by title or description…"
            }
            className="pl-9 pr-9"
            aria-label="Search content"
            data-testid="search-input"
          />
          {value ? (
            <button
              type="button"
              onClick={() => setValue("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-fg hover:text-fg"
              aria-label="Clear search"
              data-testid="search-clear"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>

        <div
          className="inline-flex shrink-0 rounded-md border border-border bg-bg-elev p-0.5"
          role="group"
          aria-label="Search mode"
        >
          <button
            type="button"
            onClick={() => setSearchMode("keyword")}
            className={`rounded px-2 py-1 text-[11px] font-medium transition-colors ${
              searchMode === "keyword"
                ? "bg-bg-elev-2 text-fg shadow-sm"
                : "text-muted-fg hover:text-fg"
            }`}
            data-testid="search-mode-keyword"
          >
            Keyword
          </button>
          <button
            type="button"
            onClick={() => setSearchMode("semantic")}
            className={`inline-flex items-center gap-1 rounded px-2 py-1 text-[11px] font-medium transition-colors ${
              searchMode === "semantic"
                ? "bg-accent/15 text-accent shadow-sm"
                : "text-muted-fg hover:text-fg"
            }`}
            data-testid="search-mode-semantic"
          >
            <Sparkles className="h-3 w-3" />
            Smart
          </button>
        </div>
      </div>

      <Button onClick={onCreate} className="hidden sm:inline-flex" data-testid="topbar-create-btn">
        <Plus className="h-4 w-4" />
        Add content
      </Button>
      <Button
        onClick={onCreate}
        size="icon"
        className="sm:hidden"
        aria-label="Add content"
        data-testid="topbar-create-btn-mobile"
      >
        <Plus className="h-4 w-4" />
      </Button>

      <Button
        onClick={onShare}
        variant="secondary"
        className="hidden sm:inline-flex"
        data-testid="topbar-share-btn"
      >
        <Share2 className="h-4 w-4" />
        Share
      </Button>
      <Button
        onClick={onShare}
        size="icon"
        variant="secondary"
        className="sm:hidden"
        aria-label="Share my brain"
        data-testid="topbar-share-btn-mobile"
      >
        <Share2 className="h-4 w-4" />
      </Button>

      {role === "ADMIN" ? (
        <Button
          asChild
          variant="ghost"
          className="hidden sm:inline-flex"
          data-testid="topbar-admin-btn"
        >
          <Link to="/admin">
            <Shield className="h-4 w-4" />
            Admin
          </Link>
        </Button>
      ) : null}

      <div className="hidden md:flex items-center gap-2 pl-2 border-l border-border">
        <div className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-accent/30 to-indigo-500/30 text-[11px] font-semibold uppercase text-fg">
          {email?.[0] ?? "?"}
        </div>
        <div className="hidden lg:flex flex-col leading-tight">
          <span className="text-xs text-muted-fg">Signed in as</span>
          <span
            className="text-xs font-medium text-fg max-w-[180px] truncate"
            data-testid="topbar-user-email"
            title={email ?? ""}
          >
            {email ?? "—"}
          </span>
        </div>
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={handleLogout}
        aria-label="Log out"
        data-testid="topbar-logout-btn"
        isLoading={logout.isPending}
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </header>
  );
}
