import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
  {
    variants: {
      variant: {
        default: "gradient-accent text-white ring-transparent",
        secondary: "bg-surface2 text-muted ring-border",
        owner: "bg-violet-500/15 text-violet-600 ring-violet-500/25 dark:text-violet-300",
        editor: "bg-emerald-500/15 text-emerald-600 ring-emerald-500/25 dark:text-emerald-300",
        viewer: "bg-amber-500/15 text-amber-600 ring-amber-500/25 dark:text-amber-300",
        outline: "text-muted ring-border",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
