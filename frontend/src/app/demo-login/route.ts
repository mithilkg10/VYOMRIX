import { NextResponse } from "next/server";
import { createDemoSessionToken, DEMO_COOKIE_NAME } from "@/lib/demo-session";

const DEMO_TTL_SECONDS = 30 * 60;

async function startDemo(request: Request) {
  const token = await createDemoSessionToken(DEMO_TTL_SECONDS);
  const response = NextResponse.redirect(new URL("/demo", request.url), 303);

  response.cookies.set(DEMO_COOKIE_NAME, token, {
    path: "/",
    maxAge: DEMO_TTL_SECONDS,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
  });

  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function POST(request: Request) {
  return startDemo(request);
}

export async function GET(request: Request) {
  return startDemo(request);
}
