import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

// Three real variants across the platform: primary (filled clipupp-primary),
// secondary (outlined 1.5px), ghost (text-only). Legacy variant names
// (default/destructive/outline/link) are kept as aliases so existing call
// sites don't break — they map onto the same three behaviours.
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clipupp-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-clipupp-primary text-clipupp-primary-fg hover:bg-clipupp-primary-strong",
        secondary:
          "border-[1.5px] border-clipupp-primary bg-transparent text-clipupp-primary hover:bg-clipupp-primary-soft",
        ghost:
          "bg-transparent text-clipupp-primary hover:bg-clipupp-primary-soft",
        danger:
          "bg-clipupp-danger text-white hover:bg-clipupp-danger-strong",
        // Legacy aliases — keep existing usages compiling.
        default:
          "bg-clipupp-primary text-clipupp-primary-fg hover:bg-clipupp-primary-strong",
        destructive:
          "bg-clipupp-danger text-white hover:bg-clipupp-danger-strong",
        outline:
          "border-[1.5px] border-clipupp-primary bg-transparent text-clipupp-primary hover:bg-clipupp-primary-soft",
        link:
          "bg-transparent text-clipupp-primary underline-offset-4 hover:underline",
      },
      size: {
        // Min 44px tap target (WCAG); `sm` reserved for dense admin chrome.
        sm: "h-9 px-3 text-sm",
        default: "h-11 px-4",
        md: "h-11 px-4",
        lg: "h-12 px-6 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
