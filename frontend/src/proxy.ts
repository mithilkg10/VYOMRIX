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

export function proxy(request: NextRequest) {
  const token = request.cookies.get("access_token")?.value;
  const isAuthPage = request.nextUrl.pathname.startsWith("/login");
  
  let response: NextResponse;
  
  if ((!token || tokenHasExpired(token)) && !isAuthPage) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", request.nextUrl.pathname);
    response = NextResponse.redirect(loginUrl);
    if (token) {
      response.cookies.delete("access_token");
      response.cookies.delete("refresh_token");
    }
  } else if (token && !tokenHasExpired(token) && isAuthPage) {
    response = NextResponse.redirect(new URL("/", request.url));
  } else {
    response = NextResponse.next();
  }
  
  // Set CSRF token if missing
  if (!request.cookies.has("csrf_token")) {
    const csrfToken = crypto.randomUUID();
    response.cookies.set("csrf_token", csrfToken, {
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      httpOnly: false // Must be accessible to JS
    });
  }

  return response;
}

export const config = { matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"] };
