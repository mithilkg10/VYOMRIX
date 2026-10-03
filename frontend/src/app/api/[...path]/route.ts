import { NextRequest, NextResponse } from "next/server";
import { getBackendApiUrl } from "@/lib/api/config";
import {
  demoAgents,
  demoAlerts,
  demoAssets,
  demoAudit,
  demoIncidents,
  demoMitre,
  demoRules,
  demoUser,
} from "@/lib/demo-api-data";

type RouteContext = { params: Promise<{ path: string[] }> };

function demoResponse(path: string, request: NextRequest) {
  if (path === "v1/auth/me") return NextResponse.json(demoUser);
  if (path === "health/status") return NextResponse.json({ status: "ok", details: { mode: "recruiter-demo", data: "synthetic" }, service: "VYOMRIX Demo", version: "1.0", database: "synthetic" });
  if (path === "health" || path === "health/" || path === "health/live" || path === "health/ready") return NextResponse.json({ status: "ok", service: "VYOMRIX Demo", version: "1.0", database: "synthetic" });
  if (path === "assets" || path === "assets/") return NextResponse.json(demoAssets);
  if (path.startsWith("incidents")) {
    const url = new URL(request.url);
    const skip = Number(url.searchParams.get("skip") ?? "0");
    const limit = Number(url.searchParams.get("limit") ?? "50");
    return NextResponse.json({ items: demoIncidents.slice(skip, skip + limit), total: demoIncidents.length, skip, limit });
  }
  if (path === "siem/alerts") return NextResponse.json({ total: demoAlerts.length, items: demoAlerts });
  if (path === "siem/agents") return NextResponse.json({ total: demoAgents.length, items: demoAgents });
  if (path === "detection/rules") return NextResponse.json(demoRules);
  if (path === "mitre/techniques") return NextResponse.json(demoMitre);
  if (path === "audit" || path === "audit/") return NextResponse.json(demoAudit);
  if (path.startsWith("threat-intel/lookup")) {
    const url = new URL(request.url);
    const value = url.searchParams.get("ioc_value") ?? "198.51.100.25";
    const type = url.searchParams.get("ioc_type") ?? "ip";
    return NextResponse.json({
      ioc_value: value,
      ioc_type: type,
      risk_level: "medium",
      risk_score: 55,
      tags: ["synthetic", "recruiter-demo"],
      related_cves: [],
      related_malware: [],
      providers: [{ provider_name: "Synthetic Lab Feed", is_malicious: false, confidence: 70, tags: ["demo"] }],
      country: null,
      asn: null,
      file_type: null,
      cvss_score: null,
      cwe: null,
    });
  }
  if (path.startsWith("reports/generate")) {
    const url = new URL(request.url);
    const format = url.searchParams.get("format") === "html" ? "html" : "pdf";
    return NextResponse.json({ report_id: "RPT-DEMO-001", incident_id: "INC-001", format, download_url: "/demo#reports" });
  }
  if (path.startsWith("v1/search")) {
    return NextResponse.json({ query: new URL(request.url).searchParams.get("q") ?? "", items: [] });
  }
  return NextResponse.json({ detail: "This demo endpoint is not implemented." }, { status: 404 });
}

async function proxy(request: NextRequest, path: string) {
  let base: string;
  try {
    base = getBackendApiUrl();
  } catch {
    return NextResponse.json({ detail: "Backend is not configured for this deployment." }, { status: 503 });
  }

  const target = new URL(`${base}/api/v1/${path}`);
  const sourceUrl = new URL(request.url);
  target.search = sourceUrl.search;

  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  if (contentType) headers.set("content-type", contentType);
  headers.set("accept", "application/json");

  const body = request.method === "GET" || request.method === "HEAD" ? undefined : await request.text();
  const response = await fetch(target, { method: request.method, headers, body, cache: "no-store" });
  const responseBody = await response.text();
  return new NextResponse(responseBody, {
    status: response.status,
    headers: { "content-type": response.headers.get("content-type") ?? "application/json" },
  });
}

async function handle(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  const joined = path.join("/");
  const demo = request.cookies.get("demo_session")?.value === "1";
  if (demo) {
    const isSafeDemoPost = request.method === "POST" && joined.startsWith("reports/generate");
    if (request.method !== "GET" && !isSafeDemoPost) {
      return NextResponse.json({ detail: "Recruiter demo is read-only." }, { status: 403 });
    }
    if (joined === "v1/system/stream/telemetry") {
      return new NextResponse(null, { status: 204 });
    }
    return demoResponse(joined, request);
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