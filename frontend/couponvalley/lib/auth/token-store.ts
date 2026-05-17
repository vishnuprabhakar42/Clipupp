/**
 * In-memory access-token store. Module-scoped (one per browser tab) so a
 * malicious script cannot persist a stolen token across reloads — the
 * refresh cookie is HttpOnly and remains the recovery path.
 */
let accessToken: string | null = null;
let listeners = new Set<(token: string | null) => void>();

export const tokenStore = {
  get(): string | null {
    return accessToken;
  },
  set(next: string | null) {
    accessToken = next;
    for (const fn of listeners) fn(next);
  },
  clear() {
    this.set(null);
  },
  subscribe(fn: (token: string | null) => void): () => void {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};
