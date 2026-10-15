"use client";

import { Component, type ReactNode } from "react";
import { isChunkLoadError } from "@/lib/lazy/isChunkLoadError";

interface Props {
  /** Names the island in the console message. */
  name: string;
  children: ReactNode;
}

interface State {
  failed: boolean;
}

const RELOAD_FLAG = "clipupp:chunk-reload";


/**
 * Catches a lazy island whose chunk failed to load (after `retryImport` gave
 * up), so a stale tab after a deploy loses one overlay instead of the whole
 * page. A chunk that is gone for good (old build hashes after a deploy) gets
 * one page reload per session, which picks up the new build; a second
 * failure in the same session renders nothing and logs once.
 */
export class LazyBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error(`[lazy] ${this.props.name} failed to load`, error);
    if (!isChunkLoadError(error)) return;
    try {
      if (window.sessionStorage.getItem(RELOAD_FLAG)) return;
      window.sessionStorage.setItem(RELOAD_FLAG, "1");
    } catch {
      return;
    }
    window.location.reload();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
