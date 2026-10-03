import { NextResponse } from "next/server";

export function GET(request: Request) {
  const response = NextResponse.redirect(new URL("/", request.url));
  response.cookies.set("demo_session", "1", {
    path: "/",
    maxAge: 3600,
    sameSite: "lax",
    secure: true,
    httpOnly: false,
  });
  return response;
}
