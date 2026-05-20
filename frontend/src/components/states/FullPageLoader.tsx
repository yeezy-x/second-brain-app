// React import not required (jsx: react-jsx)
import { Loader2 } from "lucide-react";

export function FullPageLoader() {
  return (
    <div className="flex h-full min-h-[60vh] w-full items-center justify-center text-muted-fg">
      <div className="flex items-center gap-3 text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading…
      </div>
    </div>
  );
}
