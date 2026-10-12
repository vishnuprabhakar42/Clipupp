"use client"

import { useEffect, useRef } from "react"
import { Check, CircleAlert } from "lucide-react"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

// Design pill: ink-filled, centred, above the mobile bottom nav (offset props here, 28px at lg+ in
// globals.css). Single Toaster for the whole app, mounted
// in app/[locale]/layout.tsx. Use notify()/notifyError() from
// components/site/Toast for the app-level helpers.
const Toaster = ({ ...props }: ToasterProps) => {
  const layer = useRef<HTMLDivElement>(null)

  // A modal <dialog> sits in the top layer and would cover the toasts. The toaster
  // lives in a manual popover (also top layer) that is re-promoted each time a sheet opens.
  useEffect(() => {
    const el = layer.current
    if (!el || typeof el.showPopover !== "function") return
    const promote = () => {
      try {
        if (el.matches(":popover-open")) el.hidePopover()
        el.showPopover()
      } catch {}
    }
    promote()
    window.addEventListener("clipupp:dialog-open", promote)
    return () => window.removeEventListener("clipupp:dialog-open", promote)
  }, [])

  return (
    <div ref={layer} popover="manual" className="clipupp-toast-layer">
    <Sonner
      position="bottom-center"
      duration={2300}
      offset={{ bottom: "76px" }}
      mobileOffset={{ bottom: "calc(76px + env(safe-area-inset-bottom))" }}
      className="toaster group clipupp-toaster"
      icons={{
        success: <Check size={16} aria-hidden />,
        error: <CircleAlert size={16} aria-hidden />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "group toast flex items-center gap-2 rounded-full bg-clipupp-neutral-900 px-4 py-3 text-[13px] font-semibold text-clipupp-surface shadow-clipupp-pop",
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
    </div>
  )
}

export { Toaster }
