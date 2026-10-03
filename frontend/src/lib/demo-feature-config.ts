export type DemoFeatureConfig = {
  title: string;
  description: string;
  status: string;
  metrics: { label: string; value: string; detail: string }[];
  records: { title: string; detail: string; tag: string; link?: string }[];
  related: { label: string; href: string }[];
  boundary: string;
};

export const demoFeatures: Record<string, DemoFeatureConfig> = {
  aiSoc: {
    title: "AI SOC",
    description: "Evidence-grounded triage assistance using the same synthetic incidents, alerts, and assets shown elsewhere in VYOMRIX.",
    status: "Demo assistance — human verification required",
    metrics: [
      { label: "Cases summarized", value: "06", detail: "Matches the incident queue" },
      { label: "High-priority cases", value: "03", detail: "Authentication, credential discovery, web activity" },
      { label: "Evidence sources", value: "04", detail: "Incidents · Assets · SIEM · ATT&CK" },
    ],
    records: [
      { title: "INC-001 · Authentication anomaly", detail: "Priority: High. Review repeated failed logons and Wazuh correlation before deciding whether credentials were abused.", tag: "Needs analyst review", link: "/incidents" },
      { title: "INC-002 · PowerShell activity", detail: "Priority: Medium. PowerShell telemetry is present and maps to execution behavior; confirm command context before escalation.", tag: "Evidence-backed", link: "/siem/alerts" },
      { title: "INC-004 · Sensitive process discovery", detail: "Priority: High but partial. The expected telemetry was not fully observed, so the demo keeps this case explicitly uncertain.", tag: "Partial evidence", link: "/incidents" },
    ],
    related: [{ label: "Incidents", href: "/incidents" }, { label: "SIEM alerts", href: "/siem/alerts" }, { label: "MITRE ATT&CK", href: "/mitre" }],
    boundary: "These summaries are deterministic demo explanations, not output from a production external AI provider.",
  },
  waf: {
    title: "Web Application Firewall",
    description: "Synthetic web-security events tied to the same web asset and INC-005 investigation used in the recruiter demo.",
    status: "Synthetic WAF event feed",
    metrics: [
      { label: "Requests reviewed", value: "128", detail: "Synthetic demonstration traffic" },
      { label: "Flagged requests", value: "07", detail: "Requests matched demo rules" },
      { label: "Blocked", value: "03", detail: "Demo-only enforcement outcome" },
    ],
    records: [
      { title: "SQL injection-style request", detail: "Source 198.51.100.25 → web-lab-01. Demo rule identified suspicious query syntax and linked it to INC-005.", tag: "Blocked", link: "/incidents" },
      { title: "Path traversal-style request", detail: "Synthetic request attempted traversal patterns against the lab web application.", tag: "Blocked", link: "/assets" },
      { title: "Suspicious scanner request", detail: "Repeated probing pattern retained as context rather than automatically promoted to an incident.", tag: "Observed", link: "/threat-intel" },
    ],
    related: [{ label: "INC-005", href: "/incidents" }, { label: "web-lab-01", href: "/assets" }, { label: "Threat Intelligence", href: "/threat-intel" }],
    boundary: "This feed demonstrates the analyst workflow. It is not a live internet-facing WAF or production request stream.",
  },
  honeypot: {
    title: "Honeypot",
    description: "A safe decoy-service view showing how suspicious interactions could be collected for analyst review.",
    status: "Synthetic decoy sessions",
    metrics: [
      { label: "Decoy services", value: "03", detail: "SSH · HTTP · SMB-style demo services" },
      { label: "Sessions", value: "05", detail: "Synthetic interactions" },
      { label: "Escalated", value: "01", detail: "One interaction promoted for review" },
    ],
    records: [
      { title: "SSH credential guessing", detail: "Synthetic source attempted several common usernames against the decoy SSH service.", tag: "High signal", link: "/deception" },
      { title: "HTTP reconnaissance", detail: "Synthetic scanner requested common administrative paths on the decoy web service.", tag: "Observed", link: "/deception" },
      { title: "SMB service probe", detail: "Synthetic host enumeration attempt recorded without exposing a real production system.", tag: "Observed", link: "/hunting" },
    ],
    related: [{ label: "Deception", href: "/deception" }, { label: "Threat Hunting", href: "/hunting" }, { label: "Incidents", href: "/incidents" }],
    boundary: "The public deployment shows synthetic sessions only; it does not expose or operate an internet-facing decoy.",
  },
  deception: {
    title: "Deception",
    description: "A combined view of decoy assets and interactions that would help defenders notice suspicious exploration early.",
    status: "Synthetic deception overview",
    metrics: [
      { label: "Decoys", value: "03", detail: "Synthetic services represented" },
      { label: "Interactions", value: "05", detail: "Shared with Honeypot view" },
      { label: "High-signal", value: "02", detail: "Interactions worth analyst attention" },
    ],
    records: [
      { title: "decoy-ssh-01", detail: "Designed to surface credential guessing and unauthorized remote-access attempts.", tag: "SSH", link: "/honeypot" },
      { title: "decoy-web-01", detail: "Designed to surface reconnaissance and suspicious path discovery.", tag: "HTTP", link: "/honeypot" },
      { title: "decoy-share-01", detail: "Designed to surface unauthorized service exploration in the synthetic lab.", tag: "SMB", link: "/honeypot" },
    ],
    related: [{ label: "Honeypot", href: "/honeypot" }, { label: "Threat Hunting", href: "/hunting" }, { label: "Audit Log", href: "/audit" }],
    boundary: "These decoys illustrate deception engineering and are not claimed as live production traps.",
  },
  hunting: {
    title: "Threat Hunting",
    description: "Reusable hypotheses that proactively search the existing synthetic evidence instead of waiting for a new alert.",
    status: "Synthetic hunt workspace",
    metrics: [
      { label: "Hunts", value: "04", detail: "Reusable demo hypotheses" },
      { label: "Evidence matches", value: "09", detail: "Across shared SIEM/incidents" },
      { label: "Escalations", value: "02", detail: "Cases requiring incident review" },
    ],
    records: [
      { title: "HUNT-01 · Suspicious PowerShell", detail: "Search PowerShell telemetry for encoded or unusual execution patterns. Demo evidence maps to INC-002.", tag: "Match found", link: "/siem/alerts" },
      { title: "HUNT-02 · Scheduled task persistence", detail: "Search task-creation telemetry for persistence behavior. Demo evidence maps to INC-003.", tag: "Match found", link: "/incidents" },
      { title: "HUNT-03 · Authentication bursts", detail: "Search for repeated failed-logon clusters across monitored endpoints. Demo evidence maps to INC-001.", tag: "Escalated", link: "/incidents" },
      { title: "HUNT-04 · Unusual data transfer", detail: "Review synthetic transfer evidence and integrity notes associated with INC-006.", tag: "Resolved", link: "/reports" },
    ],
    related: [{ label: "SIEM Alerts", href: "/siem/alerts" }, { label: "Incidents", href: "/incidents" }, { label: "Detection Rules", href: "/detection" }],
    boundary: "Hunt results are deterministic synthetic records tied to the same recruiter-demo dataset.",
  },
  phishing: {
    title: "Phishing Analyzer",
    description: "A safe worked example showing how an analyst would inspect a suspicious message and pass indicators into the rest of the SOC workflow.",
    status: "Synthetic phishing analysis",
    metrics: [
      { label: "Messages", value: "01", detail: "Worked synthetic example" },
      { label: "Indicators", value: "02", detail: "Domain + URL extracted" },
      { label: "Risk signals", value: "04", detail: "Impersonation · urgency · link mismatch · credential lure" },
    ],
    records: [
      { title: "Message: 'Microsoft 365 password expires today'", detail: "Synthetic sender domain differs from the displayed brand, the message uses urgency, and the login link points to a non-corporate domain.", tag: "Suspicious" },
      { title: "Extracted domain", detail: "login-security-example.test — safe reserved demo-style indicator for workflow illustration.", tag: "Check intel", link: "/threat-intel" },
      { title: "Analyst action", detail: "Do not click the link. Verify the sender independently and escalate only if evidence supports a real incident.", tag: "Recommended workflow", link: "/incidents" },
    ],
    related: [{ label: "Threat Intelligence", href: "/threat-intel" }, { label: "Incidents", href: "/incidents" }, { label: "Reports", href: "/reports" }],
    boundary: "No real email is uploaded, scanned, or blocked by this public demo.",
  },
  notifications: {
    title: "Notifications",
    description: "A unified queue of important changes derived from the same incidents, SIEM alerts, and system state used elsewhere.",
    status: "Synchronized demo notifications",
    metrics: [
      { label: "Unread", value: "04", detail: "Synthetic demo count" },
      { label: "High priority", value: "02", detail: "Authentication + sensitive-process cases" },
      { label: "Sources", value: "03", detail: "Incidents · SIEM · System" },
    ],
    records: [
      { title: "INC-001 needs review", detail: "High-severity authentication investigation remains open.", tag: "High", link: "/incidents" },
      { title: "Wazuh authentication correlation", detail: "Rule 100201 generated an alert for win-endpoint-01.", tag: "SIEM", link: "/siem/alerts" },
      { title: "INC-004 evidence remains partial", detail: "Expected telemetry was not fully observed; analyst interpretation is required.", tag: "Caution", link: "/incidents" },
      { title: "Recruiter demo healthy", detail: "Vercel synthetic data layer is responding to health checks.", tag: "System", link: "/system" },
    ],
    related: [{ label: "Incidents", href: "/incidents" }, { label: "SIEM Alerts", href: "/siem/alerts" }, { label: "System Health", href: "/system" }],
    boundary: "Notifications are generated from the public demo dataset and are not sent externally.",
  },
  administration: {
    title: "Administration",
    description: "A safe view of the platform's role model. Public demo users can inspect access boundaries but cannot change accounts or permissions.",
    status: "Read-only RBAC demonstration",
    metrics: [
      { label: "Roles", value: "03", detail: "Recruiter Demo · SOC Analyst · Super Admin" },
      { label: "Demo users", value: "01", detail: "Public read-only account" },
      { label: "Privileged changes", value: "0", detail: "Disabled in public demo" },
    ],
    records: [
      { title: "Recruiter Demo", detail: "Can read synthetic incidents, assets, SIEM data, detections, ATT&CK, reports, and audit examples.", tag: "Read-only" },
      { title: "SOC Analyst", detail: "Represents operational analyst permissions in a private deployment.", tag: "Private role" },
      { title: "Super Admin", detail: "Privileged owner role. Credentials and administrative changes are never exposed in the recruiter demo.", tag: "Private role" },
    ],
    related: [{ label: "Settings", href: "/settings" }, { label: "Audit Log", href: "/audit" }, { label: "System Health", href: "/system" }],
    boundary: "Account creation, role changes, password changes, and destructive administration are intentionally disabled publicly.",
  },
};
