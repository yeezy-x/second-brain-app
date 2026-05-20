import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md",
    "text-sm font-medium select-none",
    "transition-[background-color,color,box-shadow,transform,opacity]",
    "duration-150 ease-out",
    "disabled:pointer-events-none disabled:opacity-50",
    "focus-visible:outline-none",
    "focus-visible:ring-2 focus-visible:ring-ring/70",
    "focus-visible:ring-offset-0",
  ].join(" "),
  {
    variants: {
      variant: {
        primary: [
          "bg-accent text-accent-fg",
          "hover:bg-accent/90",
          "active:bg-accent/95 active:scale-[0.99]",
          "btn-glow",
        ].join(" "),

        secondary: [
          "bg-bg-elev-2 text-fg border border-border",
          "hover:bg-bg-elev-2/80",
          "hover:border-muted-fg/30",
        ].join(" "),

        ghost: [
          "text-muted-fg",
          "hover:text-fg",
          "hover:bg-bg-elev-2/70",
        ].join(" "),

        outline: [
          "border border-border text-fg",
          "hover:bg-bg-elev-2/80",
          "hover:border-muted-fg/40",
        ].join(" "),

        danger: [
          "bg-danger text-danger-fg",
          "hover:bg-danger/90",
          "active:bg-danger/95",
        ].join(" "),

        link: [
          "text-accent underline-offset-4",
          "hover:underline",
          "px-1",
        ].join(" "),
      },

      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-9 px-4",
        lg: "h-11 px-6 text-base",
        icon: "h-9 w-9",
      },
    },

    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      isLoading = false,
      children,
      disabled,
      type = "button",
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        ref={ref}
        type={!asChild ? type : undefined}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={!asChild ? disabled || isLoading : undefined}
        {...props}
      >
        {isLoading ? (
          <>
            <span
              className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-r-transparent"
              aria-hidden="true"
            />
            <span>{children}</span>
          </>
        ) : (
          children
        )}
      </Comp>
    );
  }
);

Button.displayName = "Button";

