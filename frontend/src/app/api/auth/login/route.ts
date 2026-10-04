import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createOwnerSessionToken, OWNER_COOKIE_NAME } from "@/lib/demo-session";

const OWNER_TTL_SECONDS = 8 * 60 * 60;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const email = String(formData.get("email") ?? formData.get("username") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");

    const configuredEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const configuredHash = process.env.ADMIN_PASSWORD_HASH;

    if (!configuredEmail || !configuredHash) {
      return NextResponse.json({ detail: "Owner access is not configured." }, { status: 503 });
    }

    const compatibleHash = configuredHash.replace(/^\$2y\$/, "$2b$");
    const passwordMatches = email === configuredEmail && await bcrypt.compare(password, compatibleHash);

    if (!passwordMatches) {
      return NextResponse.json({ detail: "Invalid credentials" }, { status: 401 });
    }

    const token = await createOwnerSessionToken(OWNER_TTL_SECONDS);
    const response = NextResponse.json({
      status: "success",
      session_id: "hosted-owner-review",
      mode: "owner-review",
    });

    response.cookies.set(OWNER_COOKIE_NAME, token, {
      path: "/",
      maxAge: OWNER_TTL_SECONDS,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
    });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    console.error("Owner login route error:", error);
    return NextResponse.json({ detail: "Internal Server Error" }, { status: 500 });
  }
}
