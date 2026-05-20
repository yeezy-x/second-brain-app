import * as React from "react";
import { Button } from "@/components/ui/button";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void; testId?: string };
  icon?: React.ReactNode;
  className?: string;
};

export function EmptyState({
  title,
  description,
  action,
  icon,
  className,
}: EmptyStateProps) {
  return (
    <div
      data-testid="empty-state"
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-bg-elev/50 px-6 py-16 text-center animate-fade-in",
        className
      )}
    >
      <div className="mb-4 grid h-12 w-12 place-items-center rounded-full bg-bg-elev-2 text-muted-fg">
        {icon ?? <Inbox className="h-5 w-5" />}
      </div>
      <h3 className="text-base font-semibold text-fg">{title}</h3>
      {description ? (
        <p className="mt-1 max-w-md text-sm text-muted-fg">{description}</p>
      ) : null}
      {action ? (
        <Button
          className="mt-5"
          onClick={action.onClick}
          data-testid={action.testId ?? "empty-state-action"}
        >
          {action.label}
        </Button>
      ) : null}
    </div>
  );
}
