// React import not required (jsx: react-jsx)
import { cn } from "@/lib/utils";
import { Brain } from "lucide-react";

export function Logo({ className, withWordmark = true }: { className?: string; withWordmark?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="grid h-8 w-8 place-items-center rounded-md bg-linear-to-br from-accent to-indigo-500 shadow-glow">
        <Brain className="h-4 w-4 text-accent-fg" strokeWidth={2.4} />
      </div>
      {withWordmark ? (
        <div className="flex flex-col leading-tight">
          <span className="font-display text-[15px] font-semibold tracking-tight text-fg">
            second brain
          </span>
          <span className="text-[10px] uppercase tracking-[0.18em] text-muted-fg">
            capture · find · share
          </span>
        </div>
      ) : null}
    </div>
  );
}
