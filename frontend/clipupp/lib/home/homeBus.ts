/**
 * Tiny in-page event bus for the homepage. The category rail emits
 * "today:tab" with a category slug, and the Today tab bar listens.
 * `peek` returns the last payload so a late subscriber can sync.
 */
export type HomeBusEvents = {
  "today:tab": string;
};

type Handler<K extends keyof HomeBusEvents> = (payload: HomeBusEvents[K]) => void;

const handlers = new Map<keyof HomeBusEvents, Set<Handler<keyof HomeBusEvents>>>();
const last = new Map<keyof HomeBusEvents, HomeBusEvents[keyof HomeBusEvents]>();

export function emit<K extends keyof HomeBusEvents>(name: K, payload: HomeBusEvents[K]): void {
  last.set(name, payload);
  handlers.get(name)?.forEach((fn) => (fn as Handler<K>)(payload));
}

/** Subscribe. Returns the unsubscribe function. */
export function on<K extends keyof HomeBusEvents>(name: K, fn: Handler<K>): () => void {
  let set = handlers.get(name);
  if (!set) {
    set = new Set();
    handlers.set(name, set);
  }
  set.add(fn as Handler<keyof HomeBusEvents>);
  return () => {
    set?.delete(fn as Handler<keyof HomeBusEvents>);
  };
}

/** Last emitted payload for the event, undefined when none yet. */
export function peek<K extends keyof HomeBusEvents>(name: K): HomeBusEvents[K] | undefined {
  return last.get(name) as HomeBusEvents[K] | undefined;
}
