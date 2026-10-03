"use client";

import { usePathname } from "next/navigation";
import { BookOpen, CircleHelp, Link2, ShieldAlert } from "lucide-react";

type Guide = {
  title: string;
  plain: string;
  metrics: string[];
  attacks: string[];
  connects: string;
};

const guides: Record<string, Guide> = {
  "/": {
    title: "Security Overview",
    plain: "This is the SOC control room. It summarizes what is happening across incidents, monitored systems, SIEM alerts, and sensor health so an analyst can decide what needs attention first.",
    metrics: [
      "Open incidents = investigations that are not finished yet.",
      "Mean time to contain = how long it took to stop or isolate resolved incidents.",
      "Critical alerts = high-priority SIEM detections that may need analyst review.",
      "Unhealthy assets = monitored systems reporting a warning, offline, or compromised state.",
    ],
    attacks: ["Authentication abuse", "PowerShell activity", "Scheduled-task persistence", "Web application activity", "Data transfer / exfiltration"],
    connects: "Dashboard numbers come from the same synthetic incident, asset, SIEM, detection, and MITRE records used on the detailed pages.",
  },
  "/incidents": {
    title: "Incidents",
    plain: "An incident is a security case. Several alerts or pieces of evidence can be grouped into one investigation so an analyst can track what happened, who is handling it, and whether it has been contained.",
    metrics: [
      "Severity = estimated business/security impact.",
      "Status = Open, In Progress, Contained, Resolved, or Closed.",
      "Timeline = ordered evidence showing how the case developed.",
      "Related assets = the machines or applications involved.",
    ],
    attacks: ["Failed-login activity", "PowerShell execution", "Scheduled task persistence", "Web attack", "Data transfer"],
    connects: "Incidents link back to SIEM alerts, assets, detection rules, ATT&CK techniques, reports, and audit history.",
  },
  "/assets": {
    title: "Assets",
    plain: "Assets are the systems being protected: endpoints, servers, applications, containers, or decoys. This page answers 'what do we own, how important is it, and is it healthy?'",
    metrics: [
      "Criticality = how important the asset is to the environment.",
      "Health = whether the asset is healthy, warning, offline, or compromised.",
      "Wazuh agent = whether endpoint telemetry is being collected.",
      "Internet-facing = whether the system can be reached from outside the lab/network.",
    ],
    attacks: ["Endpoint attacks", "Web attacks", "Credential misuse", "Persistence"],
    connects: "The same asset IDs appear inside incidents, SIEM alerts, and investigation reports.",
  },
  "/siem/alerts": {
    title: "SIEM Alerts",
    plain: "A SIEM collects security events from many systems and turns selected events into alerts. An alert is not automatically an attack; it is a signal that deserves context and triage.",
    metrics: [
      "Severity 0–15 = Wazuh-style alert importance; higher means more urgent.",
      "Rule ID = the detection logic that created the alert.",
      "Source = the endpoint or service that produced the evidence.",
      "MITRE mapping = the attacker behavior associated with the alert, when known.",
    ],
    attacks: ["Authentication failures", "PowerShell", "Scheduled task creation"],
    connects: "High-value alerts can become incidents and are linked to detection rules and MITRE ATT&CK.",
  },
  "/siem/agents": {
    title: "SIEM Agents",
    plain: "Agents are small collectors installed on monitored systems. They send security telemetry to the SIEM so the SOC can see what is happening on each endpoint.",
    metrics: [
      "Status = whether the collector is currently reporting.",
      "Last keepalive = the most recent heartbeat from that agent.",
      "OS/version = what platform is being monitored.",
      "IP = the lab address of the monitored endpoint.",
    ],
    attacks: ["Endpoint execution", "Credential abuse", "Persistence", "File/process activity"],
    connects: "Agent telemetry feeds SIEM alerts, which can then be linked to incidents and detection rules.",
  },
  "/detection": {
    title: "Detection Engineering",
    plain: "Detection engineering is the work of writing and validating rules that identify suspicious behavior in logs. The goal is useful signals with enough context for an analyst to investigate.",
    metrics: [
      "Rule level = how important a match should be treated.",
      "Status = Active, Testing, or Deprecated.",
      "Log source = which telemetry the rule expects.",
      "Tags = attack or behavior labels used to organize rules.",
    ],
    attacks: ["Repeated failed logons", "PowerShell execution", "Scheduled task persistence"],
    connects: "These rules explain why SIEM alerts appear and how ATT&CK coverage is created.",
  },
  "/mitre": {
    title: "MITRE ATT&CK",
    plain: "MITRE ATT&CK is a common dictionary of attacker behaviors. It helps explain what an alert or incident represents in terms used across the cybersecurity industry.",
    metrics: [
      "Technique ID = MITRE's identifier for a specific behavior.",
      "Tactic = the attacker's broader objective, such as Execution or Persistence.",
      "Coverage = how strongly this demo maps evidence/rules to that technique.",
      "Linked rules = detections that watch for the behavior.",
    ],
    attacks: ["Valid Accounts", "PowerShell", "Scheduled Task/Job", "Process Discovery", "Exfiltration"],
    connects: "ATT&CK links human-readable incidents to SIEM alerts and detection rules.",
  },
  "/threat-intel": {
    title: "Threat Intelligence",
    plain: "Threat intelligence adds outside context to an indicator such as an IP address, domain, URL, file hash, or CVE. It helps an analyst decide whether an indicator deserves more attention.",
    metrics: [
      "Risk level = provider classification of the submitted indicator.",
      "Risk score = provider confidence/priority score, not an automatic verdict.",
      "Providers = intelligence sources contributing context.",
      "Tags = labels describing the indicator.",
    ],
    attacks: ["Malicious infrastructure", "Phishing links", "Malware hashes", "Known vulnerabilities"],
    connects: "Indicators can be referenced during incident triage, hunting, phishing analysis, and reports.",
  },
  "/reports": {
    title: "Reports",
    plain: "Reports turn technical investigation data into something that can be shared with managers, auditors, or another analyst. They summarize the incident, evidence, decisions, and outcome.",
    metrics: [
      "Incident ID = the case being documented.",
      "Format = the output representation requested.",
      "Evidence = the technical facts used to support the report.",
      "Status/outcome = how the investigation concluded.",
    ],
    attacks: ["Any incident can be summarized here"],
    connects: "Reports are generated from the same incident records visible on the Incidents page.",
  },
  "/audit": {
    title: "Audit Log",
    plain: "The audit log records who did what inside the platform. It is useful for accountability, troubleshooting, and proving that sensitive actions were tracked.",
    metrics: [
      "Actor = the user who performed an action.",
      "Action = what the user did.",
      "Target/resource = what was viewed or changed.",
      "Result = whether the action succeeded.",
    ],
    attacks: ["Not an attack feed; this is platform accountability data"],
    connects: "Audit events help verify analyst activity across incidents, reports, settings, and administration.",
  },
  "/ai-soc": {
    title: "AI SOC",
    plain: "This demo explains where AI-assisted triage would sit in a SOC workflow. It does not pretend that an external production AI provider is connected; instead it shows evidence-grounded summaries derived from the same synthetic cases.",
    metrics: [
      "Priority = which cases deserve attention first.",
      "Evidence sources = incidents, assets, SIEM alerts, and ATT&CK context used in the summary.",
      "Analyst verification = human review remains required before action.",
    ],
    attacks: ["Authentication abuse", "PowerShell", "Persistence", "Web activity"],
    connects: "AI-assisted triage references the same incidents and alerts shown elsewhere; it does not create a separate truth source.",
  },
  "/waf": {
    title: "Web Application Firewall",
    plain: "A WAF sits in front of a web application and looks for suspicious HTTP requests. In this demo it shows a synthetic event feed tied to the documented web-attack investigation.",
    metrics: [
      "Action = whether a request was allowed, challenged, or blocked.",
      "Rule = why the request was flagged.",
      "Source IP = where the request came from in the synthetic lab.",
      "Linked incident = which SOC case contains the investigation.",
    ],
    attacks: ["SQL injection-style payloads", "Path traversal", "Suspicious web requests"],
    connects: "WAF events link to the web asset, INC-005, SIEM context, and reporting.",
  },
  "/honeypot": {
    title: "Honeypot",
    plain: "A honeypot is a decoy system designed to attract suspicious activity. It gives defenders a controlled place to observe behavior without exposing real assets.",
    metrics: [
      "Session = one interaction with the decoy.",
      "Service = the fake service that received the connection.",
      "Source = the synthetic origin of the interaction.",
      "Observed behavior = what the visitor attempted.",
    ],
    attacks: ["Credential guessing", "Reconnaissance", "Service probing"],
    connects: "Honeypot events feed the Deception view and can be escalated into an incident when appropriate.",
  },
  "/deception": {
    title: "Deception",
    plain: "Deception groups decoys, honey services, and misleading signals used to detect suspicious exploration. Legitimate users should rarely touch these systems, so interaction can be high-value evidence.",
    metrics: [
      "Decoy = the fake asset or service.",
      "Interaction count = how many synthetic touches were observed.",
      "Last activity = the most recent demo interaction.",
      "Escalation = whether activity was linked to an incident.",
    ],
    attacks: ["Reconnaissance", "Credential guessing", "Lateral-movement exploration"],
    connects: "Deception summarizes the same synthetic honeypot sessions and links them to incidents when escalated.",
  },
  "/hunting": {
    title: "Threat Hunting",
    plain: "Threat hunting is proactive investigation: instead of waiting for an alert, an analyst starts with a hypothesis and searches existing telemetry for supporting or contradicting evidence.",
    metrics: [
      "Hypothesis = the behavior the analyst is looking for.",
      "Data sources = logs used to test the hypothesis.",
      "Matches = evidence found in the synthetic dataset.",
      "Disposition = whether the hunt was benign, suspicious, or escalated.",
    ],
    attacks: ["PowerShell execution", "Persistence", "Credential activity", "Data transfer"],
    connects: "Hunts reuse SIEM, asset, and incident evidence and can create a new incident when something important is found.",
  },
  "/phishing": {
    title: "Phishing Analyzer",
    plain: "Phishing analysis examines suspicious messages for risky links, spoofed sender details, urgent language, and indicators that should be checked before a user interacts with the message.",
    metrics: [
      "Sender/domain = who appears to have sent the message.",
      "Indicators = URLs/domains extracted for checking.",
      "Risk signals = reasons the message looks suspicious.",
      "Verdict = the analyst's demo conclusion, not an automated real-world block.",
    ],
    attacks: ["Credential phishing", "Malicious links", "Impersonation"],
    connects: "Extracted indicators can be sent to Threat Intelligence and suspicious messages can be escalated to Incidents.",
  },
  "/notifications": {
    title: "Notifications",
    plain: "Notifications surface important changes so an analyst does not need to constantly watch every screen.",
    metrics: [
      "Priority = how urgent the notification is.",
      "Source = which subsystem produced it.",
      "Linked record = incident, alert, or system item that needs attention.",
      "State = unread/read in a full implementation.",
    ],
    attacks: ["Notifications reflect incidents and detections; they are not an attack source themselves"],
    connects: "The demo notifications are derived from the same incident and SIEM records used across the platform.",
  },
  "/system": {
    title: "System Health",
    plain: "This page checks whether the VYOMRIX application is alive and ready to serve requests. In recruiter demo mode the health service represents the synthetic Vercel-hosted demo layer.",
    metrics: [
      "Application = overall service response.",
      "Liveness = whether the application process is responding.",
      "Readiness = whether it is ready to handle requests.",
      "Database = which data mode is currently active.",
    ],
    attacks: ["Not an attack page; this is platform reliability information"],
    connects: "A healthy platform is required for the other SOC pages to load consistently.",
  },
  "/administration": {
    title: "Administration",
    plain: "Administration explains who can access the platform and what each role is allowed to do. The public recruiter account is intentionally read-only.",
    metrics: [
      "Role = a named permission set.",
      "Permissions = actions the role is allowed to perform.",
      "Active user = whether an account is enabled.",
      "Demo boundary = destructive administration is disabled publicly.",
    ],
    attacks: ["Access control protects the platform itself rather than detecting an external attack"],
    connects: "RBAC controls access to incidents, detections, reports, audit logs, and settings.",
  },
  "/settings": {
    title: "Settings",
    plain: "Settings shows security-related session information. In recruiter demo mode it displays only the current synthetic demo session and keeps destructive session-management actions disabled.",
    metrics: [
      "Current session = the browser session you are using now.",
      "Last active = when the session was most recently used.",
      "Device/user agent = browser/device description.",
    ],
    attacks: ["Session security helps reduce account abuse"],
    connects: "Authentication and session controls protect access to every other VYOMRIX page.",
  },
};

function getGuide(pathname: string) {
  if (pathname.startsWith("/siem/alerts")) return guides["/siem/alerts"];
  if (pathname.startsWith("/siem/agents")) return guides["/siem/agents"];
  return guides[pathname] ?? guides["/"];
}

export function PageGuide() {
  const pathname = usePathname();
  const guide = getGuide(pathname);

  return (
    <details open className="mx-4 mt-4 rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.035] sm:mx-6">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-5 py-4 text-sm font-semibold text-cyan-100">
        <CircleHelp className="h-4 w-4" />
        Explain this page: {guide.title}
      </summary>
      <div className="grid gap-4 border-t border-cyan-300/10 p-5 xl:grid-cols-3">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[.14em] text-cyan-300">
            <BookOpen className="h-4 w-4" /> In plain English
          </div>
          <p className="text-sm leading-6 text-muted-foreground">{guide.plain}</p>
        </div>
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[.14em] text-cyan-300">
            <ShieldAlert className="h-4 w-4" /> What to read
          </div>
          <ul className="space-y-1.5 text-sm leading-5 text-muted-foreground">
            {guide.metrics.map((item) => <li key={item}>• {item}</li>)}
          </ul>
          <p className="mt-3 text-xs text-muted-foreground"><span className="font-semibold text-foreground">Attack concepts:</span> {guide.attacks.join(" · ")}</p>
        </div>
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[.14em] text-cyan-300">
            <Link2 className="h-4 w-4" /> How it connects
          </div>
          <p className="text-sm leading-6 text-muted-foreground">{guide.connects}</p>
        </div>
      </div>
    </details>
  );
}
