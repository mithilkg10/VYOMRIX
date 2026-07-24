import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function tokenHasExpired(token: string) {
  try {
    const payload = token.split(".")[1];
    if (!payload) return true;
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return typeof decoded.exp !== "number" || decoded.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

export function proxy(request: NextRequest) {
  const token = request.cookies.get("access_token")?.value;
  const isAuthPage = request.nextUrl.pathname.startsWith("/login");
  if ((!token || tokenHasExpired(token)) && !isAuthPage) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", request.nextUrl.pathname);
    const response = NextResponse.redirect(loginUrl);
    if (token) response.cookies.delete("access_token");
    return response;
  }
  if (token && !tokenHasExpired(token) && isAuthPage) return NextResponse.redirect(new URL("/", request.url));
  return NextResponse.next();
}

export const config = { matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"] };
