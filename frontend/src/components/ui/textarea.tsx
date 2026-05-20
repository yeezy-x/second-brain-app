import * as React from "react";
import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  invalid?: boolean;
};

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid, ...props }, ref) => (
    <textarea
      ref={ref}
      data-invalid={invalid ? "true" : undefined}
      className={cn(
        "flex min-h-22 w-full rounded-md border border-border bg-bg-elev px-3 py-2 text-sm",
        "text-fg placeholder:text-muted-fg/70 resize-y",
        "transition-colors duration-150 ease-out",
        "focus-visible:outline-none focus-visible:border-accent/70 focus-visible:ring-2 focus-visible:ring-accent/30",
        "disabled:cursor-not-allowed disabled:opacity-60",
        invalid && "border-danger/70 focus-visible:border-danger focus-visible:ring-danger/30",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";
