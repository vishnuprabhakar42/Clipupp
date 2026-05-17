import { NextRequest, NextResponse } from "next/server";

/**
 * Catch-all route handler for /api/v1/auth/* requests. Bypasses the generic
 * Next.js rewrite proxy because we need to take EXPLICIT control of the
 * `cv_rt` cookie:
 *
 *   1. Forward the request body + cv_rt cookie value to the backend.
 *   2. Pass through any Set-Cookie headers from the backend so the browser
 *      stores them under the proxy origin (localhost:3000), where the
 *      Next.js server can read them via cookies() on subsequent requests.
 */

const BACKEND_URL =
  process.env.BACKEND_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:8080";

const REFRESH_COOKIE = "cv_rt";

// Hop-by-hop headers we should NOT forward in either direction.
const STRIP = new Set([
  "connection",
  "transfer-encoding",
  "content-length",
  "host",
  "expect",
  "upgrade",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "trailers",
  "keep-alive",
]);

export async function GET(req: NextRequest, ctx: { params: Promise<{ slug: string[] }> }) {
  return proxy(req, ctx);
}
export async function POST(req: NextRequest, ctx: { params: Promise<{ slug: string[] }> }) {
  return proxy(req, ctx);
}
export async function DELETE(req: NextRequest, ctx: { params: Promise<{ slug: string[] }> }) {
  return proxy(req, ctx);
}
export async function PATCH(req: NextRequest, ctx: { params: Promise<{ slug: string[] }> }) {
  return proxy(req, ctx);
}
export async function PUT(req: NextRequest, ctx: { params: Promise<{ slug: string[] }> }) {
  return proxy(req, ctx);
}

async function proxy(
  req: NextRequest,
  ctx: { params: Promise<{ slug: string[] }> }
) {
  const { slug } = await ctx.params;
  const url = new URL(`/api/v1/auth/${slug.join("/")}`, BACKEND_URL);
  for (const [k, v] of req.nextUrl.searchParams) url.searchParams.set(k, v);

  const method = req.method;
  const body =
    method === "GET" || method === "HEAD" ? undefined : await req.arrayBuffer();

  // Forward request headers (filtered) + the cv_rt cookie as a Cookie header
  // so the backend's RefreshCookie.read() can pick it up.
  const headers: Record<string, string> = {};
  req.headers.forEach((value, name) => {
    const lower = name.toLowerCase();
    if (STRIP.has(lower)) return;
    if (lower === "cookie") return; // re-set below from req.cookies
    headers[name] = value;
  });
  // Read ALL cv_rt values from the raw Cookie header. If a stale
  // narrowly-pathed cookie still exists alongside the new Path=/ one, the
  // browser sends both. The last one in header order is the latest set,
  // so we forward that.
  const rawCookie = req.headers.get("cookie") ?? "";
  const allRt: string[] = [];
  for (const part of rawCookie.split(";")) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    const k = part.slice(0, eq).trim();
    if (k === REFRESH_COOKIE) allRt.push(part.slice(eq + 1).trim());
  }
  const rt = allRt[allRt.length - 1] ?? req.cookies.get(REFRESH_COOKIE)?.value;
  if (rt) headers["cookie"] = `${REFRESH_COOKIE}=${rt}`;

  // DIAGNOSTIC — surfaces in the `npm run dev` console.
  // Remove once auth is stable.
  // eslint-disable-next-line no-console
  console.log(
    `[auth-proxy] ${method} /api/v1/auth/${slug.join("/")} cv_rt=${
      rt ? `present(len=${rt.length}, dupes=${allRt.length})` : "MISSING"
    } cookie-header-len=${rawCookie.length} req-origin=${req.headers.get("origin") ?? "-"}`
  );

  let backendRes: Response;
  try {
    backendRes = await fetch(url.toString(), {
      method,
      headers,
      body,
      redirect: "manual",
      cache: "no-store",
    });
  } catch (e) {
    return NextResponse.json(
      { code: "BACKEND_UNREACHABLE", title: String(e), status: 502 },
      { status: 502 }
    );
  }

  const respBody = await backendRes.arrayBuffer();

  // Build response headers: copy everything except hop-by-hop. Pass
  // Set-Cookie headers verbatim so the browser stores them under this origin.
  const responseHeaders = new Headers();
  const setCookieValues: string[] = [];
  const anyHeaders = backendRes.headers as Headers & { getSetCookie?: () => string[] };
  if (typeof anyHeaders.getSetCookie === "function") {
    setCookieValues.push(...anyHeaders.getSetCookie());
  } else {
    const raw = backendRes.headers.get("set-cookie");
    if (raw) setCookieValues.push(raw);
  }

  backendRes.headers.forEach((value, name) => {
    const lower = name.toLowerCase();
    if (STRIP.has(lower)) return;
    if (lower === "set-cookie") return; // appended separately below
    responseHeaders.set(name, value);
  });
  for (const sc of setCookieValues) {
    responseHeaders.append("set-cookie", sc);
  }

  return new NextResponse(respBody, {
    status: backendRes.status,
    headers: responseHeaders,
  });
}
