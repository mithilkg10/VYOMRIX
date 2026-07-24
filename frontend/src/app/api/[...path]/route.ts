import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { getBackendApiUrl } from "@/lib/api/config";

const ACCESS_TOKEN_COOKIE = "access_token";
const REFRESH_TOKEN_COOKIE = "refresh_token";
const METHODS = new Set(["GET", "POST", "PUT", "PATCH", "DELETE"]);
type RouteContext = { params: Promise<{ path: string[] }> };

async function refreshAccessToken(refreshToken: string) {
  const response = await fetch(
    getBackendApiUrl() + "/api/v1/auth/refresh?refresh_token=" + encodeURIComponent(refreshToken),
    { method: "POST", cache: "no-store" },
  );
  if (!response.ok) return null;
  return response.json() as Promise<{ access_token: string; refresh_token?: string }>;
}

async function proxy(request: NextRequest, { params }: RouteContext) {
  if (!METHODS.has(request.method)) return NextResponse.json({ detail: "Method not allowed" }, { status: 405 });
  const { path } = await params;
  const cookieStore = await cookies();
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
    response.cookies.set(ACCESS_TOKEN_COOKIE, refreshed.access_token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 60 * 60 * 24 * 7, path: "/" });
    if (refreshed.refresh_token) response.cookies.set(REFRESH_TOKEN_COOKIE, refreshed.refresh_token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 60 * 60 * 24 * 30, path: "/" });
  }
  if (upstream.status === 401 && !refreshed) {
    response.cookies.delete(ACCESS_TOKEN_COOKIE);
    response.cookies.delete(REFRESH_TOKEN_COOKIE);
  }
  return response;
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
