"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { tokenStore } from "@/lib/auth/token-store";
import { authApi } from "@/lib/api/auth";
import { usersApi } from "@/lib/api/users";
import type { UserSummary } from "@/lib/api/types";

type AuthContextValue = {
  user: UserSummary | null;
  isReady: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: UserSummary | null) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type ProviderProps = {
  initialUser?: UserSummary | null;
  children: ReactNode;
};

export function AuthProvider({ initialUser = null, children }: ProviderProps) {
  const [user, setUser] = useState<UserSummary | null>(initialUser);
  const [isReady, setIsReady] = useState<boolean>(initialUser !== null);

  const hydrate = useCallback(async () => {
    try {
      const me = await usersApi.me();
      setUser(me);
    } catch {
      setUser(null);
    } finally {
      setIsReady(true);
    }
  }, []);

  // On mount, if we have no in-memory token, attempt a silent refresh via
  // the HttpOnly cookie; on success, hydrate the user.
  useEffect(() => {
    if (initialUser) {
      setIsReady(true);
      return;
    }
    if (tokenStore.get()) {
      void hydrate();
      return;
    }
    void hydrate();
  }, [hydrate, initialUser]);

  const refresh = useCallback(async () => {
    await hydrate();
  }, [hydrate]);

  const logout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isReady, refresh, logout, setUser }),
    [user, isReady, refresh, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
