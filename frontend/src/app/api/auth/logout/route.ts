import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getBackendApiUrl } from "@/lib/api/config";
import { clearAuthCookies } from "@/lib/api/cookies";
import { validateCsrfToken } from "@/lib/csrf";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("access_token")?.value;

    // Validate CSRF with cryptographic signature bound to session
    const csrfHeader = request.headers.get("x-csrf-token");
    const refreshToken = cookieStore.get("refresh_token")?.value;
    const sessionId = refreshToken || accessToken;
    if (!csrfHeader || !sessionId || !validateCsrfToken(csrfHeader, sessionId)) {
      return NextResponse.json({ detail: "CSRF token mismatch or invalid signature" }, { status: 403 });
    }

    if (!accessToken) {
      return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
    }

    // Read session_id from URL query params
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id");

    const targetUrl = sessionId 
      ? `${getBackendApiUrl()}/api/v1/auth/logout?session_id=${encodeURIComponent(sessionId)}`
      : `${getBackendApiUrl()}/api/v1/auth/logout`;

    const backendResponse = await fetch(targetUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`
      },
      cache: "no-store",
    });

    const data = await backendResponse.json();

    const response = NextResponse.json(data, { status: backendResponse.status });

    // Always clear cookies on logout
    if (backendResponse.ok) {
      clearAuthCookies(response);
    }
    
    return response;
  } catch (error) {
    console.error("Logout route error:", error);
    return NextResponse.json({ detail: "Internal Server Error" }, { status: 500 });
  }
}
