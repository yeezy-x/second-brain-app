import * as React from "react";
import { cn } from "@/lib/utils";

const variants = {
  neutral: "bg-bg-elev-2 text-fg border-border",
  accent: "bg-accent/10 text-accent border-accent/30",
  muted: "bg-muted/60 text-muted-fg border-border/60",
  danger: "bg-danger/10 text-danger border-danger/30",
  success: "bg-success/10 text-success border-success/30",
} as const;

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: keyof typeof variants;
};

export function Badge({ className, variant = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wide",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
