import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { DEMO_COOKIE_NAME, verifyDemoSessionToken } from "@/lib/demo-session";

function tokenHasExpired(token: string) {
  try {
    const payload = token.split(".")[1];
    if (!payload) return true;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
    const decoded = JSON.parse(atob(padded));
    return typeof decoded.exp !== "number" || decoded.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;
  const demoToken = request.cookies.get(DEMO_COOKIE_NAME)?.value;

  const isAuthPage =
    pathname.startsWith("/login") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password");
  const isDemoEntry = pathname === "/demo-login";
  const isDemoWorkspace = pathname === "/demo";

  const hasValidAccess = Boolean(accessToken && !tokenHasExpired(accessToken));
  const hasRefresh = Boolean(refreshToken);
  const hasDemoSession = await verifyDemoSessionToken(demoToken).catch(() => false);

  if (hasDemoSession && !isDemoWorkspace && !isDemoEntry) {
    return NextResponse.redirect(new URL("/demo", request.url));
  }

  if (isDemoWorkspace && !hasDemoSession) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (!hasValidAccess && !hasRefresh && !hasDemoSession && !isAuthPage && !isDemoEntry) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    const response = NextResponse.redirect(loginUrl);
    if (accessToken) response.cookies.delete("access_token");
    return response;
  }

  if ((hasValidAccess || hasDemoSession) && isAuthPage) {
    return NextResponse.redirect(new URL(hasDemoSession ? "/demo" : "/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
