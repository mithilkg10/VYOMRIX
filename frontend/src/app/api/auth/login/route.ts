import { NextRequest, NextResponse } from "next/server";
import { getBackendApiUrl } from "@/lib/api/config";
import { setAuthCookies } from "@/lib/api/cookies";
import crypto from "crypto";
import { generateCsrfToken } from "@/lib/csrf";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const backendResponse = await fetch(`${getBackendApiUrl()}/api/v1/auth/login`, {
      method: "POST",
      body: formData,
      headers: {
        Accept: "application/json",
      },
      cache: "no-store",
    });

    const data = await backendResponse.json();

    if (!backendResponse.ok) {
      return NextResponse.json(data, { status: backendResponse.status });
    }

    // Success - intercept tokens and set secure cookies
    const { access_token, refresh_token, session_id, token_type, ...safeMetadata } = data;
    
    // Generate a new CSRF token cryptographically bound to the session (using refresh_token as stable ID)
    const csrfToken = generateCsrfToken(refresh_token || access_token);

    const response = NextResponse.json({
      status: "success",
      session_id,
      ...safeMetadata
    });

    // Set secure HTTP-only cookies
    setAuthCookies(response, access_token, refresh_token, csrfToken);
    
    return response;
  } catch (error) {
    console.error("Login route error:", error);
    return NextResponse.json({ detail: "Internal Server Error" }, { status: 500 });
  }
}
