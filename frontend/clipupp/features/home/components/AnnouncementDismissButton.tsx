"use client";

import { X } from "lucide-react";
import { dismissAnnouncement } from "./announcementActions";

/**
 * Tiny client island — wraps the dismiss button in a form so the click is a
 * progressive-enhancement form submission. Works without JS (full page reload
 * after server action); with JS, Next's form action handler runs the action
 * without reloading.
 */
export function AnnouncementDismissButton({ id }: { id: string }) {
  return (
    <form action={dismissAnnouncement} className="absolute right-3 top-1/2 -translate-y-1/2">
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        aria-label="Dismiss announcement"
        className="rounded-md p-1 text-white/80 transition-colors hover:bg-white/15 hover:text-white"
      >
        <X className="h-4 w-4" />
      </button>
    </form>
  );
}
