import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const ACCESS_TOKEN_COOKIE = "access_token";
export const REFRESH_TOKEN_COOKIE = "refresh_token";
export const CSRF_TOKEN_COOKIE = "csrf_token";

const isProduction = process.env.NODE_ENV === "production";

export const getAccessTokenCookieOptions = () => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax" as const,
  path: "/", // Path must be / so it is sent on Server Actions/BFF calls from any page
  maxAge: 15 * 60, // 15 minutes
});

export const getRefreshTokenCookieOptions = () => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax" as const,
  path: "/", // Kept at / to allow BFF rotation across paths
  maxAge: 7 * 24 * 60 * 60, // 7 days
});

export const getCsrfTokenCookieOptions = () => ({
  httpOnly: false,
  secure: isProduction,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 7 * 24 * 60 * 60,
});

export function setAuthCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken?: string,
  csrfToken?: string
) {
  response.cookies.set(ACCESS_TOKEN_COOKIE, accessToken, getAccessTokenCookieOptions());

  if (refreshToken) {
    response.cookies.set(REFRESH_TOKEN_COOKIE, refreshToken, getRefreshTokenCookieOptions());
  }

  if (csrfToken) {
    response.cookies.set(CSRF_TOKEN_COOKIE, csrfToken, getCsrfTokenCookieOptions());
  }
}

export function clearAuthCookies(response: NextResponse) {
  response.cookies.delete(ACCESS_TOKEN_COOKIE);
  response.cookies.delete(REFRESH_TOKEN_COOKIE);
  response.cookies.delete(CSRF_TOKEN_COOKIE);
}

export async function clearAuthCookiesAction() {
  const cookieStore = await cookies();
  cookieStore.delete(ACCESS_TOKEN_COOKIE);
  cookieStore.delete(REFRESH_TOKEN_COOKIE);
  cookieStore.delete(CSRF_TOKEN_COOKIE);
}

