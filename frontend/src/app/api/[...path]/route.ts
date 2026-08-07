import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getBackendApiUrl } from "@/lib/api/config";
import { setAuthCookies, clearAuthCookies } from "@/lib/api/cookies";
import { generateCsrfToken, validateCsrfToken } from "@/lib/csrf";

const ACCESS_TOKEN_COOKIE = "access_token";
const REFRESH_TOKEN_COOKIE = "refresh_token";
const METHODS = new Set(["GET", "POST", "PUT", "PATCH", "DELETE"]);
type RouteContext = { params: Promise<{ path: string[] }> };

let refreshPromise: Promise<{ access_token: string; refresh_token?: string } | null> | null = null;

async function refreshAccessToken(refreshToken: string) {
  if (refreshPromise) {
    return refreshPromise;
  }
  
  refreshPromise = (async () => {
    try {
      const response = await fetch(
        getBackendApiUrl() + "/api/v1/auth/refresh?refresh_token=" + encodeURIComponent(refreshToken),
        { method: "POST", cache: "no-store", signal: AbortSignal.timeout(15_000) },
      );
      if (!response.ok) return null;
      return response.json() as Promise<{ access_token: string; refresh_token?: string }>;
    } finally {
      refreshPromise = null;
    }
  })();
  
  return refreshPromise;
}

async function proxy(request: NextRequest, { params }: RouteContext) {
  if (!METHODS.has(request.method)) return NextResponse.json({ detail: "Method not allowed" }, { status: 405 });
  const { path } = await params;
  if (path.length === 0 || path.some((segment) => segment === "." || segment === ".." || segment.includes("\\"))) {
    return NextResponse.json({ detail: "Invalid API path" }, { status: 400 });
  }
  
  const cookieStore = await cookies();
  
  // CSRF Validation for state-changing requests
  if (request.method !== "GET") {
    const csrfHeader = request.headers.get("x-csrf-token");
    const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
    const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;
    const sessionId = refreshToken || accessToken;
    
    // Validate the cryptographic HMAC signature bound to the session
    if (!csrfHeader || !sessionId || !validateCsrfToken(csrfHeader, sessionId)) {
      return NextResponse.json({ detail: "CSRF token mismatch or invalid signature" }, { status: 403 });
    }
    
    // Strict Origin matching
    const origin = request.headers.get("origin");
    const host = request.headers.get("host") || request.headers.get("x-forwarded-host");
    if (origin && host) {
      const originHost = new URL(origin).host;
      if (originHost !== host) {
        return NextResponse.json({ detail: "Cross-origin request rejected" }, { status: 403 });
      }
    }
  }
  
  const refreshToken = cookieStore.get(REFRESH_TOKEN_COOKIE)?.value;
  const targetUrl = new URL("/api/v1/" + path.join("/"), getBackendApiUrl());
  targetUrl.search = request.nextUrl.search;
  const requestBody = request.method === "GET" ? undefined : await request.arrayBuffer();
  const forward = (token?: string) => fetch(targetUrl, {
    method: request.method,
    headers: {
      Accept: request.headers.get("accept") ?? "application/json",
      ...(request.headers.get("content-type") ? { "Content-Type": request.headers.get("content-type")! } : {}),
      ...(token ? { Authorization: "Bearer " + token } : {}),
    },
    body: requestBody,
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  let upstream = await forward(cookieStore.get(ACCESS_TOKEN_COOKIE)?.value);
  let refreshed: { access_token: string; refresh_token?: string } | null = null;
  if (upstream.status === 401 && refreshToken) {
    refreshed = await refreshAccessToken(refreshToken);
    if (refreshed) upstream = await forward(refreshed.access_token);
  }
  const response = new NextResponse(upstream.body, {
    status: upstream.status,
    headers: { "Content-Type": upstream.headers.get("content-type") ?? "application/json", "Cache-Control": "no-store" },
  });
  if (refreshed) {
    const csrfToken = generateCsrfToken(refreshed.refresh_token || refreshed.access_token);
    setAuthCookies(response, refreshed.access_token, refreshed.refresh_token, csrfToken);
  }
  if (upstream.status === 401 && !refreshed) {
    clearAuthCookies(response);
  }
  return response;
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
