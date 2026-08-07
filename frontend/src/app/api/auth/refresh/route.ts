import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getBackendApiUrl } from "@/lib/api/config";
import { setAuthCookies, clearAuthCookies } from "@/lib/api/cookies";
import { generateCsrfToken, validateCsrfToken } from "@/lib/csrf";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const refreshToken = cookieStore.get("refresh_token")?.value;

    if (!refreshToken) {
      return NextResponse.json({ detail: "Missing refresh token" }, { status: 401 });
    }

    const csrfHeader = request.headers.get("x-csrf-token");
    if (!csrfHeader || !validateCsrfToken(csrfHeader, refreshToken)) {
      return NextResponse.json({ detail: "CSRF token mismatch or invalid signature" }, { status: 403 });
    }

    const backendResponse = await fetch(
      `${getBackendApiUrl()}/api/v1/auth/refresh?refresh_token=${encodeURIComponent(refreshToken)}`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );

    const data = await backendResponse.json();

    if (!backendResponse.ok) {
      // Clear cookies if refresh fails permanently
      const response = NextResponse.json(data, { status: backendResponse.status });
      clearAuthCookies(response);
      return response;
    }

    // Success - intercept tokens and set secure cookies
    const { access_token, refresh_token: new_refresh_token, session_id, token_type, ...safeMetadata } = data;
    
    // Rotate the CSRF token because the session ID (refresh_token) has changed
    const csrfToken = generateCsrfToken(new_refresh_token || access_token);

    const response = NextResponse.json({
      status: "success",
      session_id,
      ...safeMetadata
    });

    setAuthCookies(response, access_token, new_refresh_token, csrfToken);
    
    return response;
  } catch (error) {
    console.error("Refresh route error:", error);
    return NextResponse.json({ detail: "Internal Server Error" }, { status: 500 });
  }
}
