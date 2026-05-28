import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-md border-[1.5px] border-clipupp-neutral-200 bg-white px-3 text-[15px] text-clipupp-neutral-900 placeholder:text-clipupp-neutral-400 focus:border-clipupp-primary focus:outline-none focus:ring-2 focus:ring-clipupp-primary/30 file:border-0 file:bg-transparent file:text-sm file:font-semibold file:text-clipupp-neutral-900 disabled:cursor-not-allowed disabled:opacity-40",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
