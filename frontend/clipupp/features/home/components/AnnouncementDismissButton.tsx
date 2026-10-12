"use client";

import { X } from "lucide-react";
import { dismissAnnouncement } from "./announcementActions";

/**
 * Tiny client island - wraps the dismiss button in a form so the click is a
 * progressive-enhancement form submission. Works without JS (full page reload
 * after server action); with JS, Next's form action handler runs the action
 * without reloading.
 */
export function AnnouncementDismissButton({ id, label }: { id: string; label: string }) {
  return (
    <form action={dismissAnnouncement} className="shrink-0">
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        aria-label={label}
        className="grid h-8 w-8 place-items-center rounded-full text-white/80 transition-colors hover:bg-white/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-clipupp-gold"
      >
        <X className="h-[18px] w-[18px]" aria-hidden="true" />
      </button>
    </form>
  );
}
