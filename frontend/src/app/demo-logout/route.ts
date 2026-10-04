import { NextResponse } from "next/server";
import { DEMO_COOKIE_NAME } from "@/lib/demo-session";

export async function POST(request: Request) {
  const response = NextResponse.redirect(new URL("/login", request.url), 303);
  response.cookies.set(DEMO_COOKIE_NAME, "", {
    path: "/",
    maxAge: 0,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
  });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
