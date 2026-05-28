import { tokenStore } from "@/lib/auth/token-store";
import { refreshAccessToken } from "@/lib/auth/refresh";
import { ApiError } from "./errors";
import type { ApiProblem } from "./types";

/**
 * Server-side fetches (server components, route handlers) call the backend
 * directly because they run inside the Next.js Node process — no proxy needed.
 *
 * Browser-side fetches ALWAYS use a relative base ("") so they hit the
 * Next.js same-origin proxy declared in next.config.mjs. This is mandatory:
 * it keeps the `clipupp_rt` cookie scoped to the frontend origin (localhost:3000)
 * where the Next server can read it via cookies(). NEXT_PUBLIC_API_BASE_URL
 * is intentionally ignored on the browser side — overriding it produces a
 * cross-origin login flow where the cookie lands on the backend's origin
 * and SSR session checks silently break.
 */
const API_BASE =
  typeof window === "undefined"
    ? process.env.BACKEND_URL ??
      process.env.NEXT_PUBLIC_API_BASE_URL ??
      "http://localhost:8080"
    : "";

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  /** When true, do not auto-retry on 401. Used by the refresh call itself. */
  skipAuthRetry?: boolean;
  /** When true, do not send Authorization even if a token exists (auth endpoints). */
  anonymous?: boolean;
  /** Pass a fresh idempotency key on mutating writes to make retries safe. */
  idempotencyKey?: string;
  /** Server-side: forward incoming cookies for /auth/refresh. */
  cookie?: string;
};

async function parseProblem(res: Response): Promise<ApiProblem> {
  let body: unknown;
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  if (body && typeof body === "object" && "code" in (body as object)) {
    return body as ApiProblem;
  }
  return {
    title: res.statusText || "Request failed",
    status: res.status,
    code: res.status === 401 ? "UNAUTHORIZED" : "UNKNOWN",
  };
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(opts.body !== undefined ? { "Content-Type": "application/json" } : {}),
    ...(opts.idempotencyKey ? { "Idempotency-Key": opts.idempotencyKey } : {}),
    ...(opts.cookie ? { Cookie: opts.cookie } : {}),
    ...opts.headers,
  };

  if (!opts.anonymous) {
    const tok = tokenStore.get();
    if (tok) headers.Authorization = `Bearer ${tok}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method: opts.method ?? "GET",
    headers,
    credentials: "include",
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });

  if (res.status === 401 && !opts.skipAuthRetry && !opts.anonymous) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      return request<T>(path, { ...opts, skipAuthRetry: true });
    }
  }

  if (!res.ok) {
    throw new ApiError(await parseProblem(res));
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

// refreshAccessToken now lives in @/lib/auth/refresh — see that file for the
// single-flight singleton that all API clients share.

export const apiClient = {
  get: <T>(path: string, opts?: RequestOptions) => request<T>(path, opts),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: "POST", body }),
  patch: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: "PATCH", body }),
  put: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: "PUT", body }),
  del: <T>(path: string, opts?: RequestOptions) =>
    request<T>(path, { ...opts, method: "DELETE" }),
};

export { API_BASE };
