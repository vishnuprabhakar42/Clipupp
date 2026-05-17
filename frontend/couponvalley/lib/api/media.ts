import { tokenStore } from "@/lib/auth/token-store";
import { refreshAccessToken } from "@/lib/auth/refresh";
import { ApiError } from "./errors";
import { API_BASE } from "./client";
import type { ApiProblem } from "./types";

export type MediaUploadResponse = { url: string };

/**
 * Upload an image file to the backend (multipart, so we can't reuse the
 * JSON apiClient). On 401 we re-use the SHARED refreshAccessToken singleton
 * from lib/auth/refresh — critical, because rolling a per-module singleton
 * here would let media uploads and apiClient calls race each other at
 * /auth/refresh and trip the backend's replay-detection (since the second
 * call's refresh token has already been rotated by the first), revoking
 * the entire session.
 */
async function upload(
  file: File,
  opts: { signal?: AbortSignal } = {}
): Promise<MediaUploadResponse> {
  const first = await attempt(file, opts);
  if (first.status !== 401) return finalise(first);
  const refreshed = await refreshAccessToken();
  if (!refreshed) return finalise(first);
  const second = await attempt(file, opts);
  return finalise(second);
}

async function attempt(
  file: File,
  opts: { signal?: AbortSignal }
): Promise<Response> {
  const form = new FormData();
  form.append("file", file);

  const headers: Record<string, string> = { Accept: "application/json" };
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;

  return fetch(`${API_BASE}/api/v1/media/upload`, {
    method: "POST",
    headers,
    credentials: "include",
    body: form,
    signal: opts.signal,
  });
}

async function finalise(res: Response): Promise<MediaUploadResponse> {
  if (!res.ok) {
    let problem: ApiProblem;
    try {
      problem = (await res.json()) as ApiProblem;
    } catch {
      problem = {
        title: res.statusText || "Upload failed",
        status: res.status,
        code: res.status === 401 ? "UNAUTHORIZED" : "UPLOAD_FAILED",
      };
    }
    throw new ApiError(problem);
  }
  return (await res.json()) as MediaUploadResponse;
}

export const mediaApi = { upload };
