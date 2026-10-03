import { NextResponse } from "next/server";

export function GET(request: Request) {
  const url = new URL(request.url);
  const requested = url.searchParams.get("to") ?? "/";
  const destination = requested.startsWith("/") && !requested.startsWith("//") ? requested : "/";

  const response = NextResponse.redirect(new URL(destination, request.url));
  response.cookies.set("demo_session", "1", {
    path: "/",
    maxAge: 3600,
    sameSite: "lax",
    secure: true,
    httpOnly: false,
  });
  return response;
}
