import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Badges: 6px radius (small interactive), 11px uppercase 0.04em, weight 600.
// Five real variants matching the 5 brand roles. Legacy default/secondary/
// destructive/outline kept as aliases so existing call sites don't break.
const badgeVariants = cva(
  "inline-flex items-center rounded-sm px-2 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-[0.04em] transition-colors",
  {
    variants: {
      variant: {
        neutral:
          "bg-clipupp-neutral-100 text-clipupp-neutral-700",
        primary:
          "bg-clipupp-primary text-clipupp-primary-fg",
        "primary-soft":
          "bg-clipupp-primary-soft text-clipupp-primary-strong",
        accent:
          "bg-clipupp-accent text-clipupp-accent-fg",
        "accent-soft":
          "bg-clipupp-accent-soft text-clipupp-accent-strong",
        success:
          "bg-clipupp-success text-clipupp-success-fg",
        "success-soft":
          "bg-clipupp-success-soft text-clipupp-success-strong",
        danger:
          "bg-clipupp-danger text-clipupp-danger-fg",
        "danger-soft":
          "bg-clipupp-danger-soft text-clipupp-danger-strong",
        // Legacy aliases — preserve existing usages.
        default:
          "bg-clipupp-primary text-clipupp-primary-fg",
        secondary:
          "bg-clipupp-primary-soft text-clipupp-primary-strong",
        destructive:
          "bg-clipupp-danger text-clipupp-danger-fg",
        outline:
          "border border-clipupp-neutral-200 bg-transparent text-clipupp-neutral-700",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
