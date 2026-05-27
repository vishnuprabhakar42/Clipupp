import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[112px] w-full rounded-md border-[1.5px] border-cv-neutral-200 bg-white px-3 py-2 text-[15px] leading-[1.6] text-cv-neutral-900 placeholder:text-cv-neutral-400 focus:border-cv-primary focus:outline-none focus:ring-2 focus:ring-cv-primary/30 disabled:cursor-not-allowed disabled:opacity-40",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
