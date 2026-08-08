import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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

export function middleware(request: NextRequest) {
  const accessToken = request.cookies.get("access_token")?.value;
  const refreshToken = request.cookies.get("refresh_token")?.value;
  
  const isAuthPage = request.nextUrl.pathname.startsWith("/login") || 
                     request.nextUrl.pathname.startsWith("/forgot-password") || 
                     request.nextUrl.pathname.startsWith("/reset-password");
  
  const hasValidAccess = accessToken && !tokenHasExpired(accessToken);
  const hasRefresh = !!refreshToken;
  
  let response: NextResponse;
  
  if (!hasValidAccess && !hasRefresh && !isAuthPage) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", request.nextUrl.pathname);
    response = NextResponse.redirect(loginUrl);
    if (accessToken) {
      response.cookies.delete("access_token");
    }
  } else if (hasValidAccess && isAuthPage) {
    response = NextResponse.redirect(new URL("/", request.url));
  } else {
    response = NextResponse.next();
  }

  return response;
}

export const config = { matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"] };
