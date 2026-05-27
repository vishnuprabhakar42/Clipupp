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
          "bg-cv-neutral-100 text-cv-neutral-700",
        primary:
          "bg-cv-primary text-cv-primary-fg",
        "primary-soft":
          "bg-cv-primary-soft text-cv-primary-strong",
        accent:
          "bg-cv-accent text-cv-accent-fg",
        "accent-soft":
          "bg-cv-accent-soft text-cv-accent-strong",
        success:
          "bg-cv-success text-cv-success-fg",
        "success-soft":
          "bg-cv-success-soft text-cv-success-strong",
        danger:
          "bg-cv-danger text-cv-danger-fg",
        "danger-soft":
          "bg-cv-danger-soft text-cv-danger-strong",
        // Legacy aliases — preserve existing usages.
        default:
          "bg-cv-primary text-cv-primary-fg",
        secondary:
          "bg-cv-primary-soft text-cv-primary-strong",
        destructive:
          "bg-cv-danger text-cv-danger-fg",
        outline:
          "border border-cv-neutral-200 bg-transparent text-cv-neutral-700",
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
