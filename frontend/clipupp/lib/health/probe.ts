export type BackendState = "up" | "down";

/** Hits the backend readiness probe with a hard timeout; never throws. */
export async function probeBackend(baseUrl: string, timeoutMs: number): Promise<BackendState> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${baseUrl}/actuator/health/readiness`, { signal: controller.signal, cache: "no-store" });
    return res.status === 200 ? "up" : "down";
  } catch {
    return "down";
  } finally {
    clearTimeout(timer);
  }
}
