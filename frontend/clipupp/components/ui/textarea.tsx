import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[112px] w-full rounded-md border-[1.5px] border-clipupp-neutral-200 bg-white px-3 py-2 text-[15px] leading-[1.6] text-clipupp-neutral-900 placeholder:text-clipupp-neutral-400 focus:border-clipupp-primary focus:outline-none focus:ring-2 focus:ring-clipupp-primary/30 disabled:cursor-not-allowed disabled:opacity-40",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
