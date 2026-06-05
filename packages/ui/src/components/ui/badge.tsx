import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../lib/utils.js";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        /* shadcn base */
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",

        /* status pills */
        "status-processing":
          "border-transparent bg-[hsl(var(--status-processing)/0.15)] text-[hsl(var(--status-processing))] border-[hsl(var(--status-processing)/0.3)]",
        "status-ready":
          "border-transparent bg-[hsl(var(--status-ready)/0.15)] text-[hsl(var(--status-ready))] border-[hsl(var(--status-ready)/0.3)]",
        "status-error":
          "border-transparent bg-[hsl(var(--status-error)/0.15)] text-[hsl(var(--status-error))] border-[hsl(var(--status-error)/0.3)]",

        /* source telemetry chips */
        "source-parametric":
          "border-transparent bg-[hsl(var(--source-parametric)/0.15)] text-[hsl(var(--source-parametric))] border-[hsl(var(--source-parametric)/0.3)]",
        "source-document":
          "border-transparent bg-[hsl(var(--source-document)/0.15)] text-[hsl(var(--source-document))] border-[hsl(var(--source-document)/0.3)]",
        "source-web":
          "border-transparent bg-[hsl(var(--source-web)/0.15)] text-[hsl(var(--source-web))] border-[hsl(var(--source-web)/0.3)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
