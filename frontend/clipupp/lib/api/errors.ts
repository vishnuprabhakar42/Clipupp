import type { ApiProblem } from "./types";

/**
 * Thrown by the fetch wrapper for any non-2xx response. Carries the parsed
 * RFC 7807 problem body so UI code can branch on `code` and surface
 * field-level errors.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly problem: ApiProblem;

  constructor(problem: ApiProblem) {
    super(problem.detail ?? problem.title ?? `Request failed (${problem.status})`);
    this.name = "ApiError";
    this.status = problem.status;
    this.code = problem.code;
    this.problem = problem;
  }

  fieldErrors(): Record<string, string> {
    const map: Record<string, string> = {};
    for (const e of this.problem.errors ?? []) map[e.field] = e.message;
    return map;
  }

  isUnauthorized() {
    return this.status === 401;
  }
}

export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError;
}
