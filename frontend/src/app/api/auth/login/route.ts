import { NextRequest, NextResponse } from "next/server";
import { getBackendApiUrl } from "@/lib/api/config";
import { setAuthCookies } from "@/lib/api/cookies";
import { generateCsrfToken } from "@/lib/csrf";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // The UI labels this field as email; FastAPI's OAuth2 form expects username.
    if (!formData.get("username") && formData.get("email")) {
      formData.set("username", String(formData.get("email")));
    }

    let backendResponse;
    try {
      backendResponse = await fetch(`${getBackendApiUrl()}/api/v1/auth/login`, {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
    } catch (e) {
      console.error("Backend fetch error:", e);
      return NextResponse.json({ detail: "Service unavailable. Could not connect to backend." }, { status: 503 });
    }

    const data = await backendResponse.json();

    if (!backendResponse.ok) {
      return NextResponse.json(data, { status: backendResponse.status });
    }

    const { access_token, refresh_token, session_id, token_type, ...safeMetadata } = data;
    const csrfToken = generateCsrfToken(refresh_token || access_token);

    const response = NextResponse.json({
      status: "success",
      session_id,
      ...safeMetadata,
    });

    setAuthCookies(response, access_token, refresh_token, csrfToken);
    return response;
  } catch (error) {
    console.error("Login route error:", error);
    return NextResponse.json({ detail: "Internal Server Error" }, { status: 500 });
  }
}
