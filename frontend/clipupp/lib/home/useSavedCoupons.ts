"use client";

import { useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { useAuth } from "@/lib/auth/AuthProvider";
import { savedCouponsApi } from "@/lib/api/savedCoupons";
import { notify, notifyError } from "@/components/site/Toast";

type SavedState = {
  ids: string[];
  hydrated: boolean;
  /** Local-only flip. Returns true when the id is now saved. */
  toggleLocal: (id: string) => boolean;
  setIds: (ids: string[]) => void;
};

export const useSavedStore = create<SavedState>()(
  persist(
    (set, get) => ({
      ids: [],
      hydrated: false,
      toggleLocal: (id) => {
        const has = get().ids.includes(id);
        set({ ids: has ? get().ids.filter((x) => x !== id) : [...get().ids, id] });
        return !has;
      },
      setIds: (ids) => set({ ids }),
    }),
    {
      name: "clipupp:saved",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ ids: s.ids }),
      // Hydrate in an effect so SSR markup and first client render agree.
      skipHydration: true,
      onRehydrateStorage: () => () => useSavedStore.setState({ hydrated: true }),
    }
  )
);

let hydrationStarted = false;
function ensureHydrated() {
  if (hydrationStarted || typeof window === "undefined") return;
  hydrationStarted = true;
  void useSavedStore.persist.rehydrate();
}

/**
 * Saved coupons. Local (localStorage `clipupp:saved`) for everyone, mirrored to
 * the account API when signed in. `toggle` shows the saved/removed toast itself.
 * `ids` is empty and `hydrated` false until the first client effect runs.
 */
export function useSavedCoupons() {
  const { user } = useAuth();
  const t = useTranslations("toast");
  const ids = useSavedStore((s) => s.ids);
  const hydrated = useSavedStore((s) => s.hydrated);

  useEffect(ensureHydrated, []);

  const has = useCallback((id: string) => ids.includes(id), [ids]);

  const toggle = useCallback(
    (id: string) => {
      const nowSaved = useSavedStore.getState().toggleLocal(id);
      notify(nowSaved ? t("saved") : t("removed"));
      if (user) {
        (nowSaved ? savedCouponsApi.save(id) : savedCouponsApi.unsave(id)).catch(() =>
          notifyError(t("saveFailed"))
        );
      }
      return nowSaved;
    },
    [user, t]
  );

  return { ids, hydrated, count: ids.length, has, toggle };
}

const MERGE_FLAG = "clipupp:saved-merged";

/**
 * Mount once (e.g. in the home client shell). When a user appears (null to
 * value), pushes local ids to the account then replaces local ids with the
 * server list. Runs once per user per browser session.
 */
export function useMergeSavedOnLogin() {
  const { user } = useAuth();
  const userId = user?.id ?? null;

  useEffect(() => {
    if (!userId) return;
    ensureHydrated();
    try {
      if (sessionStorage.getItem(MERGE_FLAG) === userId) return;
      sessionStorage.setItem(MERGE_FLAG, userId);
    } catch {
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        // Wait for local hydration so we do not push an empty list.
        if (!useSavedStore.getState().hydrated) await useSavedStore.persist.rehydrate();
        const local = useSavedStore.getState().ids;
        await Promise.allSettled(local.map((id) => savedCouponsApi.save(id)));
        const server: string[] = [];
        let cursor: string | undefined;
        do {
          const page = await savedCouponsApi.list(cursor, 100);
          server.push(...page.data.map((i) => i.couponId));
          cursor = page.page.hasMore ? (page.page.nextCursor ?? undefined) : undefined;
        } while (cursor && server.length < 1000);
        if (!cancelled) useSavedStore.getState().setIds(server);
      } catch {
        try {
          sessionStorage.removeItem(MERGE_FLAG);
        } catch {}
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);
}
