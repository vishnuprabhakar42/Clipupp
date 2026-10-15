import { NextResponse } from "next/server";
import { probeBackend } from "@/lib/health/probe";

export const dynamic = "force-dynamic";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8080";
const VERSION = process.env.GIT_SHA ?? "dev";

/**
 * Container and reverse-proxy health. Always 200 while this process answers,
 * so Caddy keeps routing to the web container even when the backend is
 * restarting; the smoke test reads `backend` to decide whether a deploy is good.
 */
export async function GET() {
  const backend = await probeBackend(BACKEND_URL, 2000);
  return NextResponse.json({ ok: true, version: VERSION, backend }, { headers: { "cache-control": "no-store" } });
}
