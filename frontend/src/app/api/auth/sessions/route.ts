import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getBackendApiUrl } from "@/lib/api/config";

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const accessToken = cookieStore.get("access_token")?.value;
    const demoSession = cookieStore.get("demo_session")?.value === "1";

    if (demoSession) {
      return NextResponse.json([{
        id: "demo-session",
        user_agent: request.headers.get("user-agent") ?? "Recruiter Demo Browser",
        ip_address: "Synthetic / hidden",
        created_at: "2026-10-03T15:00:00Z",
        last_used_at: new Date().toISOString(),
        is_current: true
      }]);
    }

    if (!accessToken) {
      return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
    }

    const backendResponse = await fetch(`${getBackendApiUrl()}/api/v1/auth/sessions`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${accessToken}`
      },
      cache: "no-store",
    });

    const data = await backendResponse.json();
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error("Sessions GET route error:", error);
    return NextResponse.json({ detail: "Internal Server Error" }, { status: 500 });
  }
}