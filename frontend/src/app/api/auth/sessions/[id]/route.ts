import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getBackendApiUrl } from "@/lib/api/config";
import { clearAuthCookies } from "@/lib/api/cookies";
import { validateCsrfToken } from "@/lib/csrf";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const backendResponse = await fetch(`${getBackendApiUrl()}/api/v1/auth/sessions/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`
      },
      cache: "no-store",
    });

    const data = await backendResponse.json();
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error("Session DELETE route error:", error);
    return NextResponse.json({ detail: "Internal Server Error" }, { status: 500 });
  }
}
