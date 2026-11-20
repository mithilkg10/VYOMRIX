import { NextRequest, NextResponse } from "next/server";
import { DEMO_COOKIE_NAME, OWNER_COOKIE_NAME, verifyDemoSessionToken, verifyOwnerSessionToken } from "@/lib/demo-session";
import { getBackendApiUrl } from "@/lib/api/config";
import { isHostedShowcase } from "@/lib/hosting";
const demoUser = {
  id: "demo-analyst",
  email: "recruiter.demo@vyomrix.local",
  full_name: "Recruiter SOC Demo",
  role: "SOC Analyst",
  permissions: ["incidents:read", "assets:read", "rules:read", "threat_intel:read", "mitre:read", "reports:read", "audit:read"],
  is_active: true,
};

type RouteContext = { params: Promise<{ path: string[] }> };

function demoResponse(path: string, _request: NextRequest, owner = false) {
  if (path === "v1/auth/me") {
    if (owner) {
      return NextResponse.json({
        ...demoUser,
        id: "hosted-owner",
        email: process.env.ADMIN_EMAIL ?? "owner@vyomrix.local",
        full_name: "VYOMRIX Owner",
        role: "Super Admin",
        permissions: ["admin:*"],
      });
    }
    return NextResponse.json(demoUser);
  }
  if (path === "health/status") return NextResponse.json({ status: "ok", details: { mode: "recruiter-demo", data: "synthetic" }, service: "VYOMRIX Demo", version: "1.0", database: "synthetic" });
  if (path === "health" || path === "health/" || path === "health/live" || path === "health/ready") return NextResponse.json({ status: "ok", service: "VYOMRIX Demo", version: "1.0", database: "synthetic" });
  return NextResponse.json({ detail: "In hosted mode this data is produced by the detection engine running in the browser." }, { status: 404 });
}

async function proxy(request: NextRequest, path: string) {
  let base: string;
  try {
    base = getBackendApiUrl();
  } catch {
    return NextResponse.json({ detail: "Backend is not configured for this deployment." }, { status: 503 });
  }

  const backendPath = path.startsWith("v1/") ? path.slice(3) : path;
  const target = new URL(`${base}/api/v1/${backendPath}`);
  const sourceUrl = new URL(request.url);
  target.search = sourceUrl.search;

  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  headers.set("accept", "application/json");

  const body = request.method === "GET" || request.method === "HEAD" ? undefined : await request.text();
  let response: Response;
  try {
    response = await fetch(target, { method: request.method, headers, body, cache: "no-store" });
  } catch {
    return NextResponse.json({ detail: "Backend is unreachable." }, { status: 502 });
  }
  const responseBody = await response.text();
  return new NextResponse(responseBody, {
    status: response.status,
    headers: { "content-type": response.headers.get("content-type") ?? "application/json" },
  });
}

async function handle(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  const joined = path.join("/");
  const demoToken = request.cookies.get(DEMO_COOKIE_NAME)?.value;
  const ownerToken = request.cookies.get(OWNER_COOKIE_NAME)?.value;
  const demo = await verifyDemoSessionToken(demoToken).catch(() => false);
  const owner = await verifyOwnerSessionToken(ownerToken).catch(() => false);

  if (demo || owner) {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return NextResponse.json(
        { detail: owner ? "Hosted owner review is read-only. Changes are disabled." : "Recruiter demo is read-only. Changes are disabled by design." },
        { status: 403, headers: { "Cache-Control": "no-store" } },
      );
    }

    if (joined === "v1/system/stream/telemetry" || joined === "v1/incidents/stream/updates") {
      return new NextResponse(null, { status: 204, headers: { "Cache-Control": "no-store" } });
    }

    const response = demoResponse(joined, request, owner);
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    return response;
  }

  if (isHostedShowcase()) {
    return NextResponse.json({ detail: "Sign in required." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  return proxy(request, joined);
}

export async function GET(request: NextRequest, context: RouteContext) {
  return handle(request, context);
}

export async function POST(request: NextRequest, context: RouteContext) {
  return handle(request, context);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  return handle(request, context);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return handle(request, context);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  return handle(request, context);
}