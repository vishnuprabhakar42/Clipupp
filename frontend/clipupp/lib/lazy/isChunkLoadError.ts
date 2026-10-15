/** True for the errors webpack and the browser raise when a script chunk never arrives. */
export function isChunkLoadError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const { name, message } = error as { name?: unknown; message?: unknown };
  if (name === "ChunkLoadError") return true;
  return typeof message === "string" && /Loading chunk|Failed to fetch dynamically imported module|Importing a module script failed/i.test(message);
}
