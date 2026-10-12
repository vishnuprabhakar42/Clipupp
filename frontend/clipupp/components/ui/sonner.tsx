"use client"

import { Check, CircleAlert } from "lucide-react"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

// Design pill: ink-filled, centred, above the mobile bottom nav (offset set in
// globals.css via .clipupp-toaster). Single Toaster for the whole app, mounted
// in app/[locale]/layout.tsx. Use notify()/notifyError() from
// components/site/Toast for the app-level helpers.
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      position="bottom-center"
      duration={2300}
      className="toaster group clipupp-toaster"
      icons={{
        success: <Check size={16} aria-hidden />,
        error: <CircleAlert size={16} aria-hidden />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "group toast flex items-center gap-2 rounded-full bg-clipupp-ft-ink px-4 py-3 text-[13px] font-semibold text-clipupp-surface shadow-clipupp-pop",
          icon: "shrink-0",
          description: "group-[.toast]:opacity-80",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
