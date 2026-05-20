import * as React from "react";
import { Button } from "@/components/ui/button";
import { TriangleAlert, RotateCw } from "lucide-react";

type State = { hasError: boolean; error: Error | null };

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error("Unhandled UI error:", error, info);
  }

  reset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  render(): React.ReactNode {
    if (!this.state.hasError) return this.props.children;
    return (
      <div
        className="grid min-h-[60vh] place-items-center px-6"
        data-testid="error-boundary"
      >
        <div className="max-w-md text-center animate-fade-in">
          <div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-full bg-danger/10 text-danger">
            <TriangleAlert className="h-4 w-4" />
          </div>
          <h2 className="font-display text-xl font-semibold text-fg">
            Something just went sideways.
          </h2>
          <p className="mt-2 text-sm text-muted-fg">
            {this.state.error?.message || "An unexpected error occurred."}
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <Button variant="secondary" onClick={this.reset}>
              <RotateCw className="h-3.5 w-3.5" />
              Try again
            </Button>
            <Button onClick={() => window.location.reload()}>Reload app</Button>
          </div>
        </div>
      </div>
    );
  }
}
