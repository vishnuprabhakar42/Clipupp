"use client";

import { Component, type ReactNode } from "react";

interface Props {
  /** Names the island in the console message. */
  name: string;
  children: ReactNode;
}

interface State {
  failed: boolean;
}

/**
 * Catches a lazy island whose chunk failed to load (after `retryImport` gave
 * up), so a stale tab after a deploy loses one overlay instead of the whole
 * page. Renders nothing on failure and logs once.
 */
export class LazyBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.error(`[lazy] ${this.props.name} failed to load`, error);
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}
