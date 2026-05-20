// React import not required (jsx: react-jsx)
import { Button } from "@/components/ui/button";
import { TriangleAlert, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { getErrorMessage } from "@/lib/error";

type ErrorStateProps = {
  error?: unknown;
  title?: string;
  onRetry?: () => void;
  className?: string;
  testId?: string;
};

export function ErrorState({
  error,
  title = "Something went wrong",
  onRetry,
  className,
  testId = "error-state",
}: ErrorStateProps) {
  const message = error ? getErrorMessage(error) : "Please try again.";
  return (
    <div
      data-testid={testId}
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-danger/30 bg-danger/5 px-6 py-12 text-center animate-fade-in",
        className
      )}
    >
      <div className="mb-3 grid h-10 w-10 place-items-center rounded-full bg-danger/10 text-danger">
        <TriangleAlert className="h-4 w-4" />
      </div>
      <h3 className="text-base font-semibold text-fg">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-muted-fg">{message}</p>
      {onRetry ? (
        <Button
          variant="secondary"
          className="mt-5"
          onClick={onRetry}
          data-testid="error-state-retry"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Try again
        </Button>
      ) : null}
    </div>
  );
}
