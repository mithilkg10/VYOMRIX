type DemoReport = {
  id: string;
  title: string;
  severity: "High" | "Medium";
  status: "Validated" | "Partial";
  summary: string;
  evidence: string[];
  attack: string[];
  findings: string[];
  limitation: string;
};

const REPORTS: Record<string, DemoReport> = {
  "INC-001": {
    id: "INC-001",
    title: "Authentication Anomaly",
    severity: "High",
    status: "Validated",
    summary: "Repeated failed sign-in activity was correlated and reviewed through the VYOMRIX incident workflow.",
    evidence: ["Windows Security failed-logon telemetry", "Wazuh correlation alert", "Linked endpoint: win-endpoint-01", "Analyst triage notes and timeline"],
    attack: ["T1078 - Valid Accounts", "Credential Access"],
    findings: ["Authentication failures were grouped into one investigation context.", "Correlation reduced repeated raw events into an analyst-ready incident.", "No destructive response action is exposed in the recruiter demo."],
    limitation: "Synthetic Cyber Defense Lab scenario. This report does not represent production customer telemetry.",
  },
  "INC-002": {
    id: "INC-002",
    title: "PowerShell Activity",
    severity: "Medium",
    status: "Validated",
    summary: "Controlled PowerShell execution telemetry was captured and reviewed against a detection rule.",
    evidence: ["PowerShell script-block telemetry", "Wazuh alert context", "Detection rule SIG-002", "Endpoint: win-endpoint-01"],
    attack: ["T1059.001 - PowerShell", "Execution"],
    findings: ["PowerShell activity was visible in the SIEM workflow.", "Detection context maps the event to ATT&CK for faster triage.", "The scenario validates investigation workflow rather than claiming autonomous response."],
    limitation: "Controlled lab activity using synthetic and sanitized evidence.",
  },
  "INC-003": {
    id: "INC-003",
    title: "Scheduled Task Activity",
    severity: "Medium",
    status: "Validated",
    summary: "A controlled scheduled-task event was detected and investigated as a persistence scenario.",
    evidence: ["Scheduled task creation telemetry", "Wazuh rule context", "Detection rule SIG-003", "Incident timeline"],
    attack: ["T1053 - Scheduled Task/Job", "Persistence"],
    findings: ["Task creation was captured as a distinct security event.", "The incident view links detection evidence and ATT&CK context.", "Analyst review remains explicit and auditable."],
    limitation: "Controlled persistence test; no real endpoint is altered by the public demo.",
  },
  "INC-004": {
    id: "INC-004",
    title: "Sensitive Process Discovery",
    severity: "High",
    status: "Partial",
    summary: "A safe process-discovery test produced partial telemetry and is intentionally recorded as a partial validation.",
    evidence: ["Controlled discovery command", "Available endpoint telemetry", "Analyst validation notes", "Expected event comparison"],
    attack: ["T1057 - Process Discovery", "Discovery"],
    findings: ["The scenario did not produce every expected signal.", "VYOMRIX preserves the incomplete result instead of marking it successful.", "The partial outcome demonstrates evidence-based reporting and transparent limitations."],
    limitation: "Partial validation by design. Missing expected telemetry is documented rather than inferred.",
  },
  "INC-005": {
    id: "INC-005",
    title: "Web Application Security Event",
    severity: "High",
    status: "Validated",
    summary: "A synthetic web-application security event was reviewed through the incident workflow.",
    evidence: ["Synthetic application event", "Protected asset context: web-lab-01", "Investigation timeline", "Application-security triage notes"],
    attack: ["Initial Access", "Web application security context"],
    findings: ["Application events use the same investigation workflow as endpoint alerts.", "Asset context supports affected-system review.", "The recruiter environment exposes no active attack surface or mutation controls."],
    limitation: "Synthetic web-application event used only for demonstration.",
  },
  "INC-006": {
    id: "INC-006",
    title: "Data Transfer Event",
    severity: "Medium",
    status: "Validated",
    summary: "A controlled data-transfer event was retained with integrity-oriented evidence for analyst review.",
    evidence: ["Controlled transfer record", "Linked source and destination assets", "Integrity verification notes", "Incident resolution record"],
    attack: ["Exfiltration", "Data transfer monitoring"],
    findings: ["Transfer evidence is presented alongside linked assets.", "The workflow supports traceable analyst review from event to report.", "No external destination or sensitive data is included in the recruiter dataset."],
    limitation: "Controlled lab transfer using non-sensitive synthetic data.",
  },
};

const encoder = new TextEncoder();

function escapePdfText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function wrapText(value: string, maxChars: number) {
  const words = value.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length <= maxChars) line = next;
    else {
      if (line) lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function rgb(hex: string) {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16) / 255;
  const g = parseInt(value.slice(2, 4), 16) / 255;
  const b = parseInt(value.slice(4, 6), 16) / 255;
  return `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)}`;
}

function text(content: string[], value: string, x: number, y: number, size = 10, bold = false, color = "#334155") {
  content.push(`BT /${bold ? "F2" : "F1"} ${size} Tf ${rgb(color)} rg 1 0 0 1 ${x} ${y} Tm (${escapePdfText(value)}) Tj ET`);
}

function wrapped(content: string[], value: string, x: number, y: number, maxChars = 92, size = 9.6, color = "#334155") {
  let cursor = y;
  for (const line of wrapText(value, maxChars)) {
    text(content, line, x, cursor, size, false, color);
    cursor -= 13;
  }
  return cursor;
}

function rect(content: string[], x: number, y: number, width: number, height: number, fill: string) {
  content.push(`${rgb(fill)} rg ${x} ${y} ${width} ${height} re f`);
}

function line(content: string[], x1: number, y1: number, x2: number, y2: number, stroke = "#cbd5e1") {
  content.push(`${rgb(stroke)} RG 0.7 w ${x1} ${y1} m ${x2} ${y2} l S`);
}

function buildContent(report: DemoReport) {
  const c: string[] = [];
  rect(c, 0, 695, 595, 147, "#07111f");
  rect(c, 40, 765, 34, 34, "#22d3ee");
  text(c, "V", 52, 776, 14, true, "#07111f");
  text(c, "VYOMRIX", 88, 781, 21, true, "#ffffff");
  text(c, "Security Operations - Investigation Report", 88, 762, 9, false, "#94a3b8");
  text(c, `${report.id}  ${report.title}`, 40, 715, 15, true, "#ffffff");
  text(c, "Recruiter-safe synthetic report", 398, 716, 8.5, false, "#cbd5e1");

  rect(c, 40, 642, 155, 38, "#f1f5f9");
  rect(c, 220, 642, 155, 38, "#f1f5f9");
  rect(c, 400, 642, 155, 38, "#f1f5f9");
  text(c, "SEVERITY", 52, 664, 7.5, true, "#475569");
  text(c, report.severity.toUpperCase(), 129, 655, 10.5, true, report.severity === "High" ? "#dc2626" : "#d97706");
  text(c, "STATUS", 232, 664, 7.5, true, "#475569");
  text(c, report.status.toUpperCase(), 294, 655, 10.5, true, report.status === "Validated" ? "#059669" : "#d97706");
  text(c, "DATA CLASS", 412, 664, 7.5, true, "#475569");
  text(c, "SYNTHETIC", 484, 655, 10.5, true, "#2563eb");

  let y = 608;
  const section = (titleValue: string) => {
    text(c, titleValue, 40, y, 11, true, "#07111f");
    line(c, 40, y - 5, 555, y - 5);
    y -= 22;
  };

  section("Executive summary");
  y = wrapped(c, report.summary, 40, y, 95, 9.6);
  y -= 12;

  section("Evidence reviewed");
  for (const item of report.evidence) {
    rect(c, 44, y + 2, 3, 3, "#22d3ee");
    text(c, item, 56, y, 9.2, false, "#334155");
    y -= 18;
  }
  y -= 4;

  section("MITRE ATT&CK context");
  for (const item of report.attack) {
    rect(c, 40, y - 5, 220, 20, "#e0f2fe");
    text(c, item, 50, y + 1, 8.6, true, "#075985");
    y -= 28;
  }

  section("Analyst findings");
  report.findings.forEach((item, index) => {
    text(c, `${index + 1}.`, 40, y, 9.2, true, "#07111f");
    y = wrapped(c, item, 62, y, 82, 9.2);
    y -= 7;
  });

  section("Scope and limitation");
  y = wrapped(c, report.limitation, 40, y, 95, 9.2);
  y -= 8;

  rect(c, 40, 65, 515, 48, "#ecfeff");
  text(c, "RECRUITER DEMO SAFETY BOUNDARY", 52, 94, 8.5, true, "#155e75");
  text(c, "Read-only session. No private telemetry, secrets, admin controls or destructive actions are exposed.", 52, 77, 7.8, false, "#155e75");

  line(c, 40, 45, 555, 45);
  text(c, "VYOMRIX - Cyber Defense Lab demonstration", 40, 28, 7.5, false, "#64748b");
  text(c, `Report ${report.id} | Generated for recruiter review`, 385, 28, 7.5, false, "#64748b");
  return c.join("\n");
}

function object(id: number, body: string) {
  return `${id} 0 obj\n${body}\nendobj\n`;
}

export function buildDemoReportPdf(incidentId: string) {
  const report = REPORTS[incidentId];
  if (!report) return null;

  const content = buildContent(report);
  const contentLength = encoder.encode(content).length;

  const objects = [
    object(1, "<< /Type /Catalog /Pages 2 0 R >>"),
    object(2, "<< /Type /Pages /Kids [3 0 R] /Count 1 >>"),
    object(3, "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>"),
    object(4, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"),
    object(5, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>"),
    object(6, `<< /Length ${contentLength} >>\nstream\n${content}\nendstream`),
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (const item of objects) {
    offsets.push(encoder.encode(pdf).length);
    pdf += item;
  }

  const xrefOffset = encoder.encode(pdf).length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let index = 1; index <= objects.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return {
    bytes: encoder.encode(pdf),
    filename: `VYOMRIX-${report.id}-${report.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}.pdf`,
  };
}
