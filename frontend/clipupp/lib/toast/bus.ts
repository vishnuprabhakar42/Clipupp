import type { toast as SonnerToast } from "sonner";

/*
 * Tiny bridge between `notify()` callers and the lazily loaded toaster.
 * Nothing here imports sonner at runtime: jobs wait in a queue until the
 * toaster has mounted and hands over its `toast` api, then run in order.
 * The first queued job flags the toaster as wanted so `ToasterHost` loads it.
 */
export type ToastApi = typeof SonnerToast;
type Job = (api: ToastApi) => void;

let api: ToastApi | null = null;
let queue: Job[] = [];
let wanted = false;
const listeners = new Set<() => void>();

function want() {
  if (wanted) return;
  wanted = true;
  for (const l of listeners) l();
}

/** Run `job` with the sonner api now, or once the toaster has mounted. */
export function withToast(job: Job): void {
  if (api) {
    job(api);
    return;
  }
  queue.push(job);
  want();
}

/** Called by the mounted toaster: hands over the api and flushes the queue. */
export function toastReady(next: ToastApi): void {
  api = next;
  const pending = queue;
  queue = [];
  for (const job of pending) job(next);
}

/**
 * Called when the mounted toaster unmounts (a layout remount): drops the api
 * so later jobs queue again and re-flag the toaster as wanted.
 */
export function toastGone(): void {
  api = null;
  wanted = false;
}

export function isToasterWanted(): boolean {
  return wanted;
}

export function subscribeToasterWanted(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Test-only reset of the module state. */
export function __resetToastBus(): void {
  api = null;
  queue = [];
  wanted = false;
  listeners.clear();
}
