import { NextResponse } from "next/server";
import { buildDemoReportPdf } from "@/lib/demo-report-pdf";

type RouteContext = { params: Promise<{ incident: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { incident } = await context.params;
  const report = buildDemoReportPdf(incident.toUpperCase());

  if (!report) {
    return NextResponse.json({ detail: "Report not found." }, { status: 404 });
  }

  return new NextResponse(report.bytes, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${report.filename}"`,
      "Cache-Control": "public, max-age=3600",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
