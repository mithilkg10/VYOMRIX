import { NextRequest, NextResponse } from "next/server";
import { DEMO_COOKIE_NAME, OWNER_COOKIE_NAME, verifyDemoSessionToken, verifyOwnerSessionToken } from "@/lib/demo-session";
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

function demoResponse(path: string, request: NextRequest, owner = false) {
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
  if (path === "reports/demo-report") {
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>VYOMRIX Demo Incident Report</title></head><body><h1>VYOMRIX Demo Incident Report</h1><p><strong>Incident:</strong> INC-001 Authentication anomaly</p><p><strong>Status:</strong> Open</p><p><strong>Severity:</strong> High</p><p><strong>Summary:</strong> Repeated failed-logon activity was correlated in the synthetic lab and retained for analyst review.</p><p><strong>Evidence:</strong> Windows Security telemetry, Wazuh correlation, linked endpoint win-endpoint-01.</p><p><strong>MITRE context:</strong> Valid Accounts / credential-related behavior.</p><p>This is synthetic recruiter-demo data.</p></body></html>`;
    return new NextResponse(html, {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "content-disposition": "attachment; filename=vyomrix-demo-incident-report.html",
      },
    });
  }
  if (path.startsWith("reports/generate")) {
    const url = new URL(request.url);
    const format = url.searchParams.get("format") === "html" ? "html" : "pdf";
    return NextResponse.json({ report_id: "RPT-DEMO-001", incident_id: "INC-001", format, download_url: "/api/v1/reports/demo-report" });
  }
  if (path.startsWith("v1/search")) {
    const query = (new URL(request.url).searchParams.get("q") ?? "").toLowerCase();
    const results = [
      ...demoIncidents.map((item) => ({ id: item.id, type: "incident" as const, title: item.title, subtitle: item.severity, url: "/incidents" })),
      ...demoAssets.map((item) => ({ id: item.id, type: "asset" as const, title: item.hostname, subtitle: item.asset_type, url: "/assets" })),
      ...demoRules.map((item) => ({ id: item.id, type: "rule" as const, title: item.title, subtitle: item.level, url: "/detection" })),
    ].filter((item) => !query || item.title.toLowerCase().includes(query) || item.id.toLowerCase().includes(query));
    return NextResponse.json({ results: results.slice(0, 10), total: results.length });
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

  const backendPath = path.startsWith("v1/") ? path.slice(3) : path;
  const target = new URL(`${base}/api/v1/${backendPath}`);
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