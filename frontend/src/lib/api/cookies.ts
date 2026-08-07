import { NextResponse } from "next/server";

const ACCESS_TOKEN_COOKIE = "access_token";
const REFRESH_TOKEN_COOKIE = "refresh_token";
const CSRF_TOKEN_COOKIE = "csrf_token";

const isProduction = process.env.NODE_ENV === "production";

export function setAuthCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken?: string,
  csrfToken?: string
) {
  // Access Token: 15 minutes
  response.cookies.set(ACCESS_TOKEN_COOKIE, accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    path: "/api",
    maxAge: 15 * 60, 
  });

  // Refresh Token: 7 days
  if (refreshToken) {
    response.cookies.set(REFRESH_TOKEN_COOKIE, refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/api/auth", // Restrictive path consistent with BFF design
      maxAge: 7 * 24 * 60 * 60,
    });
  }

  // CSRF Token (Not HttpOnly, readable by frontend to send in header)
  if (csrfToken) {
    response.cookies.set(CSRF_TOKEN_COOKIE, csrfToken, {
      httpOnly: false,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60,
    });
  }
}

export function clearAuthCookies(response: NextResponse) {
  response.cookies.delete(ACCESS_TOKEN_COOKIE);
  response.cookies.delete(REFRESH_TOKEN_COOKIE);
  response.cookies.delete(CSRF_TOKEN_COOKIE);
}
