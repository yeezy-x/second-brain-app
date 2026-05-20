import * as React from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { CreateContentDialog } from "@/features/content/components/CreateContentDialog";
import { ShareDialog } from "@/features/share/components/ShareDialog";
import { Outlet } from "react-router-dom";
import { cn } from "@/lib/utils";

export function AppShell() {
  const [createOpen, setCreateOpen] = React.useState(false);
  const [shareOpen, setShareOpen] = React.useState(false);
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg">
      {/* Desktop sidebar */}
      <div className="hidden lg:block lg:w-64 shrink-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar */}
      <div
        className={cn(
          "fixed inset-0 z-40 lg:hidden transition-opacity",
          mobileNavOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        aria-hidden={!mobileNavOpen}
      >
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileNavOpen(false)}
        />
        <div
          className={cn(
            "absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-bg-elev transition-transform duration-300",
            mobileNavOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <Sidebar onNavigate={() => setMobileNavOpen(false)} testIdSuffix="mobile" />
        </div>
      </div>

      <div className="flex h-full flex-1 flex-col overflow-hidden">
        <Topbar
          onOpenSidebar={() => setMobileNavOpen(true)}
          onCreate={() => setCreateOpen(true)}
          onShare={() => setShareOpen(true)}
        />
        <main
          className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-10"
          data-testid="main-content"
        >
          <Outlet context={{ openCreate: () => setCreateOpen(true), openShare: () => setShareOpen(true) }} />
        </main>
      </div>

      <CreateContentDialog open={createOpen} onOpenChange={setCreateOpen} />
      <ShareDialog open={shareOpen} onOpenChange={setShareOpen} />
    </div>
  );
}
