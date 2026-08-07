import { NextRequest, NextResponse } from "next/server";
import { getBackendApiUrl } from "@/lib/api/config";
import { clearAuthCookies } from "@/lib/api/cookies";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const backendResponse = await fetch(`${getBackendApiUrl()}/api/v1/auth/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await backendResponse.json();
    const response = NextResponse.json(data, { status: backendResponse.status });

    if (backendResponse.ok) {
      // Backend invalidates all sessions on reset, so we must clear local cookies too
      clearAuthCookies(response);
    }
    
    return response;
  } catch (error) {
    console.error("Reset password route error:", error);
    return NextResponse.json({ detail: "Internal Server Error" }, { status: 500 });
  }
}
