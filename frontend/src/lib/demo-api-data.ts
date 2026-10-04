const isoMinutesAgo = (minutes: number) =>
  new Date(Date.now() - minutes * 60_000).toISOString();

const isoHoursAgo = (hours: number) =>
  new Date(Date.now() - hours * 3_600_000).toISOString();

const syntheticEvidence = (incident: string, index: number) => ({
  id: `EVD-${incident.replace("INC-", "")}-${String(index).padStart(2, "0")}`,
  name: `${incident.toLowerCase()}-evidence-${index}.json`,
  type: "application/json",
  uploaded_at: isoHoursAgo(Math.max(1, index)),
});

export const demoUser = {
  id: "demo-analyst",
  email: "demo.analyst@mithilkg.dev",
  full_name: "Recruiter SOC Demo",
  role: "SOC Analyst",
  permissions: [
    "incidents:read",
    "assets:read",
    "siem:read",
    "rules:read",
    "threat_intel:read",
    "mitre:read",
    "reports:read",
    "audit:read",
  ],
  is_active: true,
};

export const demoAssets = [
  { id: "AST-001", hostname: "win-endpoint-01", ip_address: "10.10.20.15", os_name: "Windows 11", asset_type: "Workstation", environment: "Development", criticality: "High", owner: "Cyber Defense Lab", tags: ["lab", "endpoint", "finance-user"], has_wazuh_agent: true, protected_by_waf: false, is_internet_facing: false, last_seen: isoMinutesAgo(2), health_status: "Warning" },
  { id: "AST-002", hostname: "web-lab-01", ip_address: "10.10.30.20", os_name: "Ubuntu 24.04", asset_type: "Web App", environment: "Development", criticality: "High", owner: "Cyber Defense Lab", tags: ["lab", "web", "nginx"], has_wazuh_agent: true, protected_by_waf: true, is_internet_facing: true, last_seen: isoMinutesAgo(1), health_status: "Healthy" },
  { id: "AST-003", hostname: "wazuh-manager", ip_address: "10.10.10.5", os_name: "Ubuntu 24.04", asset_type: "Server", environment: "Development", criticality: "Critical", owner: "Cyber Defense Lab", tags: ["siem", "wazuh", "core"], has_wazuh_agent: true, protected_by_waf: false, is_internet_facing: false, last_seen: isoMinutesAgo(1), health_status: "Healthy" },
  { id: "AST-004", hostname: "linux-jump-01", ip_address: "10.10.20.31", os_name: "Ubuntu 22.04", asset_type: "VM", environment: "Development", criticality: "Medium", owner: "Security Engineering", tags: ["jump-host", "ssh", "lab"], has_wazuh_agent: true, protected_by_waf: false, is_internet_facing: false, last_seen: isoMinutesAgo(4), health_status: "Healthy" },
  { id: "AST-005", hostname: "db-lab-01", ip_address: "10.10.40.12", os_name: "Debian 12", asset_type: "Server", environment: "Development", criticality: "Critical", owner: "Platform Engineering", tags: ["database", "postgresql", "lab"], has_wazuh_agent: true, protected_by_waf: false, is_internet_facing: false, last_seen: isoMinutesAgo(3), health_status: "Healthy" },
  { id: "AST-006", hostname: "api-staging-01", ip_address: "10.10.30.24", os_name: "Ubuntu 24.04", asset_type: "Web App", environment: "Staging", criticality: "High", owner: "Application Security", tags: ["api", "staging", "waf"], has_wazuh_agent: true, protected_by_waf: true, is_internet_facing: true, last_seen: isoMinutesAgo(2), health_status: "Warning" },
  { id: "AST-007", hostname: "analyst-ws-02", ip_address: "10.10.20.22", os_name: "Windows 11", asset_type: "Workstation", environment: "Development", criticality: "Medium", owner: "Security Operations", tags: ["analyst", "endpoint"], has_wazuh_agent: true, protected_by_waf: false, is_internet_facing: false, last_seen: isoMinutesAgo(6), health_status: "Healthy" },
  { id: "AST-008", hostname: "honeypot-ssh-01", ip_address: "10.10.50.9", os_name: "Ubuntu 22.04", asset_type: "Honeypot", environment: "Development", criticality: "Low", owner: "Threat Research", tags: ["honeypot", "ssh", "deception"], has_wazuh_agent: true, protected_by_waf: false, is_internet_facing: true, last_seen: isoMinutesAgo(1), health_status: "Compromised" },
  { id: "AST-009", hostname: "container-api-02", ip_address: "10.10.60.18", os_name: "Alpine Linux", asset_type: "Container", environment: "Staging", criticality: "Medium", owner: "Platform Engineering", tags: ["container", "api"], has_wazuh_agent: false, protected_by_waf: true, is_internet_facing: false, last_seen: isoMinutesAgo(15), health_status: "Healthy" },
  { id: "AST-010", hostname: "legacy-win-01", ip_address: "10.10.20.44", os_name: "Windows 10", asset_type: "Workstation", environment: "Development", criticality: "Medium", owner: "Cyber Defense Lab", tags: ["legacy", "endpoint"], has_wazuh_agent: true, protected_by_waf: false, is_internet_facing: false, last_seen: isoHoursAgo(3), health_status: "Offline" },
] as const;

export const demoAgents = [
  { id: "001", name: "win-endpoint-01", ip: "10.10.20.15", os_name: "Windows", os_version: "11", status: "active", last_keepalive: isoMinutesAgo(2), version: "4.9.2" },
  { id: "002", name: "web-lab-01", ip: "10.10.30.20", os_name: "Linux", os_version: "Ubuntu 24.04", status: "active", last_keepalive: isoMinutesAgo(1), version: "4.9.2" },
  { id: "003", name: "wazuh-manager", ip: "10.10.10.5", os_name: "Linux", os_version: "Ubuntu 24.04", status: "active", last_keepalive: isoMinutesAgo(1), version: "4.9.2" },
  { id: "004", name: "linux-jump-01", ip: "10.10.20.31", os_name: "Linux", os_version: "Ubuntu 22.04", status: "active", last_keepalive: isoMinutesAgo(4), version: "4.9.2" },
  { id: "005", name: "db-lab-01", ip: "10.10.40.12", os_name: "Linux", os_version: "Debian 12", status: "active", last_keepalive: isoMinutesAgo(3), version: "4.9.2" },
  { id: "006", name: "api-staging-01", ip: "10.10.30.24", os_name: "Linux", os_version: "Ubuntu 24.04", status: "active", last_keepalive: isoMinutesAgo(2), version: "4.9.2" },
  { id: "007", name: "analyst-ws-02", ip: "10.10.20.22", os_name: "Windows", os_version: "11", status: "active", last_keepalive: isoMinutesAgo(6), version: "4.9.2" },
  { id: "008", name: "honeypot-ssh-01", ip: "10.10.50.9", os_name: "Linux", os_version: "Ubuntu 22.04", status: "active", last_keepalive: isoMinutesAgo(1), version: "4.9.2" },
  { id: "010", name: "legacy-win-01", ip: "10.10.20.44", os_name: "Windows", os_version: "10", status: "disconnected", last_keepalive: isoHoursAgo(3), version: "4.8.1" },
];

const incidentSeeds = [
  ["INC-001", "Authentication anomaly", "Repeated failed sign-in activity followed by a successful account logon from the same endpoint.", "High", "Open", 2.2, ["AST-001"], ["Credential Access"], "Windows Security", "Multiple failed logons crossed the correlation threshold."],
  ["INC-002", "Encoded PowerShell activity", "Encoded PowerShell execution was observed and correlated with script-block telemetry.", "High", "In Progress", 3.4, ["AST-001"], ["Execution"], "PowerShell", "Encoded command line and script-block activity were correlated."],
  ["INC-003", "Scheduled task persistence", "A controlled scheduled task was created and reviewed as persistence activity.", "Medium", "Contained", 5.1, ["AST-001"], ["Persistence"], "Windows Security", "Scheduled task creation was detected and contained."],
  ["INC-004", "Sensitive process discovery", "Safe discovery testing produced incomplete expected telemetry and remains partially validated.", "High", "Open", 6.3, ["AST-001"], ["Discovery"], "Sysmon", "Process discovery occurred but one expected telemetry source was absent."],
  ["INC-005", "Web application attack pattern", "Synthetic web requests matched traversal and injection detection logic.", "High", "Resolved", 8.8, ["AST-002"], ["Initial Access"], "WAF", "Multiple suspicious HTTP requests were grouped into one investigation."],
  ["INC-006", "Unusual outbound data transfer", "Controlled outbound transfer volume exceeded the lab baseline.", "Medium", "Resolved", 11.2, ["AST-001", "AST-002"], ["Exfiltration"], "Network Sensor", "Outbound transfer volume exceeded the test threshold."],
  ["INC-007", "SSH brute-force against honeypot", "A burst of failed SSH authentication attempts targeted the deception host.", "Medium", "In Progress", 1.1, ["AST-008"], ["Credential Access"], "Wazuh", "Honeypot recorded repeated SSH authentication attempts."],
  ["INC-008", "Suspicious service creation", "A new Windows service matched persistence-oriented detection logic.", "High", "Contained", 4.2, ["AST-007"], ["Persistence", "Privilege Escalation"], "Sysmon", "Service creation event matched the lab persistence rule."],
  ["INC-009", "Linux privilege escalation signal", "Repeated sudo failures followed by a privileged command execution.", "High", "Open", 7.4, ["AST-004"], ["Privilege Escalation"], "Linux Audit", "Authentication and process events were correlated on the jump host."],
  ["INC-010", "API credential misuse simulation", "Synthetic API requests used an expired token followed by abnormal request volume.", "Medium", "Resolved", 13.5, ["AST-006"], ["Credential Access"], "API Gateway", "Authentication errors and request-rate anomaly were correlated."],
  ["INC-011", "Database enumeration pattern", "Controlled queries generated an unusual schema-enumeration sequence.", "Medium", "In Progress", 9.6, ["AST-005"], ["Discovery"], "PostgreSQL Audit", "Query sequence differed from the normal application baseline."],
  ["INC-012", "Unsigned binary execution", "An unsigned test executable launched from a user-writable directory.", "High", "Resolved", 16.2, ["AST-007"], ["Execution"], "Sysmon", "Process creation and hash telemetry were preserved for review."],
  ["INC-013", "Repeated WAF rule triggers", "A synthetic scanner generated multiple blocked application requests.", "Low", "Closed", 18.4, ["AST-002"], ["Reconnaissance"], "WAF", "Requests were blocked and retained as low-risk scanning activity."],
  ["INC-014", "Endpoint agent heartbeat loss", "A legacy endpoint stopped reporting to the SIEM and was flagged for validation.", "Medium", "Open", 3.1, ["AST-010"], ["Impact"], "Wazuh", "Agent heartbeat exceeded the offline threshold."],
  ["INC-015", "Container configuration drift", "A staging container diverged from the expected monitoring baseline.", "Low", "Resolved", 20.5, ["AST-009"], ["Defense Evasion"], "Configuration Monitor", "Monitoring configuration drift was identified during baseline review."],
] as const;

export const demoIncidents = incidentSeeds.map((seed, index) => {
  const [id, title, description, severity, status, hoursAgo, assets, tactics, source, eventDescription] = seed;
  const created = isoHoursAgo(hoursAgo);
  const resolved = status === "Resolved" || status === "Closed";
  const closedAt = resolved ? isoHoursAgo(Math.max(0.4, hoursAgo - 1.4)) : undefined;
  return {
    id,
    title,
    description,
    severity,
    status,
    created_at: created,
    updated_at: isoHoursAgo(Math.max(0.15, hoursAgo - 0.8)),
    ...(closedAt ? { closed_at: closedAt } : {}),
    assigned_analyst: index % 3 === 0 ? "SOC Analyst A" : index % 3 === 1 ? "SOC Analyst B" : "Recruiter SOC Demo",
    related_assets: [...assets],
    related_mitre_tactics: [...tactics],
    timeline: [
      { id: `EV-${String(index + 1).padStart(3, "0")}-01`, timestamp: created, source, description: eventDescription, raw_data: { synthetic: true, scenario: id } },
      { id: `EV-${String(index + 1).padStart(3, "0")}-02`, timestamp: isoHoursAgo(Math.max(0.1, hoursAgo - 0.25)), source: "VYOMRIX", description: "Alert enriched and attached to the investigation.", raw_data: { synthetic: true } },
    ],
    evidence: [syntheticEvidence(id, 1)],
    ai_summary: null,
  };
});

const alertTemplates = [
  { title: "Repeated authentication failures", description: "Multiple failed logons exceeded the test threshold.", severity: 9, asset: "AST-001", rule: "100201", mitre: ["T1078"], tactic: ["Credential Access"], technique: ["Valid Accounts"], tags: ["authentication", "correlation"] },
  { title: "Encoded PowerShell command", description: "Encoded PowerShell execution matched script telemetry.", severity: 8, asset: "AST-001", rule: "92057", mitre: ["T1059.001"], tactic: ["Execution"], technique: ["PowerShell"], tags: ["powershell", "execution"] },
  { title: "Scheduled task created", description: "Task creation matched persistence detection logic.", severity: 6, asset: "AST-001", rule: "60228", mitre: ["T1053.005"], tactic: ["Persistence"], technique: ["Scheduled Task"], tags: ["persistence", "task"] },
  { title: "New Windows service installed", description: "Service installation observed on monitored endpoint.", severity: 8, asset: "AST-007", rule: "61104", mitre: ["T1543.003"], tactic: ["Persistence", "Privilege Escalation"], technique: ["Windows Service"], tags: ["service", "persistence"] },
  { title: "SSH authentication burst", description: "Multiple failed SSH attempts targeted the deception host.", severity: 6, asset: "AST-008", rule: "5712", mitre: ["T1110"], tactic: ["Credential Access"], technique: ["Brute Force"], tags: ["ssh", "honeypot"] },
  { title: "Sudo authentication failure", description: "Repeated sudo authentication failures observed.", severity: 5, asset: "AST-004", rule: "5403", mitre: ["T1548.003"], tactic: ["Privilege Escalation"], technique: ["Sudo and Sudo Caching"], tags: ["linux", "sudo"] },
  { title: "Suspicious HTTP traversal pattern", description: "WAF blocked traversal-style request pattern.", severity: 7, asset: "AST-002", rule: "31151", mitre: ["T1190"], tactic: ["Initial Access"], technique: ["Exploit Public-Facing Application"], tags: ["waf", "web"] },
  { title: "SQL injection pattern blocked", description: "WAF signature matched a synthetic SQL injection request.", severity: 8, asset: "AST-006", rule: "31152", mitre: ["T1190"], tactic: ["Initial Access"], technique: ["Exploit Public-Facing Application"], tags: ["waf", "sql"] },
  { title: "Large outbound transfer", description: "Outbound transfer size exceeded the synthetic baseline.", severity: 7, asset: "AST-002", rule: "100330", mitre: ["T1041"], tactic: ["Exfiltration"], technique: ["Exfiltration Over C2 Channel"], tags: ["network", "exfiltration"] },
  { title: "Unsigned process from user path", description: "Unsigned executable started from a writable directory.", severity: 7, asset: "AST-007", rule: "61603", mitre: ["T1204.002"], tactic: ["Execution"], technique: ["Malicious File"], tags: ["process", "execution"] },
  { title: "Database schema enumeration", description: "Database audit trail showed unusual enumeration queries.", severity: 5, asset: "AST-005", rule: "100410", mitre: ["T1087"], tactic: ["Discovery"], technique: ["Account Discovery"], tags: ["database", "discovery"] },
  { title: "Endpoint agent disconnected", description: "SIEM agent heartbeat exceeded the disconnect threshold.", severity: 4, asset: "AST-010", rule: "501", mitre: [], tactic: ["Impact"], technique: ["Service Stop"], tags: ["agent", "availability"] },
  { title: "Configuration drift detected", description: "Monitoring configuration differs from the expected staging baseline.", severity: 3, asset: "AST-009", rule: "100501", mitre: ["T1562.001"], tactic: ["Defense Evasion"], technique: ["Disable or Modify Tools"], tags: ["configuration", "container"] },
  { title: "Successful administrator logon", description: "Expected privileged login retained as contextual telemetry.", severity: 2, asset: "AST-003", rule: "60106", mitre: [], tactic: ["Credential Access"], technique: ["Valid Accounts"], tags: ["authentication", "context"] },
  { title: "Package update completed", description: "Routine package update event retained as benign operational noise.", severity: 1, asset: "AST-004", rule: "2902", mitre: [], tactic: [], technique: [], tags: ["maintenance", "benign"] },
] as const;

const assetById = new Map(demoAssets.map((asset) => [asset.id, asset]));

export const demoAlerts = Array.from({ length: 96 }, (_, index) => {
  const template = alertTemplates[index % alertTemplates.length];
  const asset = assetById.get(template.asset)!;
  const wave = index % 12;
  const minutesAgo = 8 + index * 13 + (wave % 4) * 7;
  return {
    id: `ALT-${String(index + 1).padStart(3, "0")}`,
    timestamp: isoMinutesAgo(minutesAgo),
    title: template.title,
    description: template.description,
    severity: template.severity,
    source: {
      name: template.tags.includes("waf") ? "WAF" : "Wazuh",
      ip: asset.ip_address,
      agent_id: String((index % 10) + 1).padStart(3, "0"),
      agent_name: asset.hostname,
    },
    rule_id: template.rule,
    mitre: {
      id: [...template.mitre],
      tactic: [...template.tactic],
      technique: [...template.technique],
    },
    raw_data: {
      synthetic: true,
      test_event: true,
      event_sequence: index + 1,
      source_asset: asset.hostname,
    },
    tags: [...template.tags, "synthetic-test"],
  };
}).sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));

export const demoRules = [
  { id: "SIG-001", title: "Repeated Failed Logons", description: "Detects repeated authentication failures.", logsource: { product: "windows", service: "security" }, level: "High", status: "Active", tags: ["attack.credential_access"], author: "Mithil K Gowda", date: isoHoursAgo(72), raw_yaml: "title: Repeated Failed Logons" },
  { id: "SIG-002", title: "Encoded PowerShell Activity", description: "Detects encoded or suspicious PowerShell execution.", logsource: { product: "windows", service: "powershell" }, level: "High", status: "Active", tags: ["attack.execution"], author: "Mithil K Gowda", date: isoHoursAgo(72), raw_yaml: "title: Encoded PowerShell Activity" },
  { id: "SIG-003", title: "Scheduled Task Creation", description: "Detects scheduled task creation.", logsource: { product: "windows", service: "security" }, level: "Medium", status: "Active", tags: ["attack.persistence"], author: "Mithil K Gowda", date: isoHoursAgo(72), raw_yaml: "title: Scheduled Task Creation" },
  { id: "SIG-004", title: "Windows Service Creation", description: "Detects new service installation.", logsource: { product: "windows", service: "system" }, level: "High", status: "Active", tags: ["attack.persistence"], author: "Mithil K Gowda", date: isoHoursAgo(70), raw_yaml: "title: Windows Service Creation" },
  { id: "SIG-005", title: "SSH Brute Force", description: "Detects repeated SSH authentication failures.", logsource: { product: "linux", service: "auth" }, level: "Medium", status: "Active", tags: ["attack.credential_access"], author: "Mithil K Gowda", date: isoHoursAgo(69), raw_yaml: "title: SSH Brute Force" },
  { id: "SIG-006", title: "Linux Sudo Failure Burst", description: "Detects repeated sudo authentication failures.", logsource: { product: "linux", service: "auth" }, level: "Medium", status: "Active", tags: ["attack.privilege_escalation"], author: "Mithil K Gowda", date: isoHoursAgo(68), raw_yaml: "title: Linux Sudo Failure Burst" },
  { id: "SIG-007", title: "Suspicious Web Traversal", description: "Detects traversal-style web request patterns.", logsource: { product: "nginx", service: "access" }, level: "High", status: "Active", tags: ["attack.initial_access"], author: "Mithil K Gowda", date: isoHoursAgo(67), raw_yaml: "title: Suspicious Web Traversal" },
  { id: "SIG-008", title: "Large Outbound Transfer", description: "Detects transfer volume outside the synthetic baseline.", logsource: { product: "network", service: "flow" }, level: "High", status: "Active", tags: ["attack.exfiltration"], author: "Mithil K Gowda", date: isoHoursAgo(66), raw_yaml: "title: Large Outbound Transfer" },
  { id: "SIG-009", title: "Unsigned Binary From User Path", description: "Detects unsigned binary execution from a writable path.", logsource: { product: "windows", service: "sysmon" }, level: "High", status: "Active", tags: ["attack.execution"], author: "Mithil K Gowda", date: isoHoursAgo(65), raw_yaml: "title: Unsigned Binary From User Path" },
  { id: "SIG-010", title: "Monitoring Configuration Drift", description: "Detects security monitoring configuration drift.", logsource: { product: "linux", service: "audit" }, level: "Low", status: "Active", tags: ["attack.defense_evasion"], author: "Mithil K Gowda", date: isoHoursAgo(64), raw_yaml: "title: Monitoring Configuration Drift" },
];

export const demoMitre = [
  { id: "T1078", name: "Valid Accounts", description: "Authentication activity is correlated with account context.", tactics: ["Credential Access"], data_sources: ["Windows Security"], mitigations: ["Account monitoring", "MFA"], coverage: "High", linked_sigma_rules: ["SIG-001"], linked_wazuh_rules: ["100201"] },
  { id: "T1059.001", name: "PowerShell", description: "PowerShell execution telemetry is retained for investigation.", tactics: ["Execution"], data_sources: ["PowerShell", "Sysmon"], mitigations: ["Script logging"], coverage: "High", linked_sigma_rules: ["SIG-002"], linked_wazuh_rules: ["92057"] },
  { id: "T1053.005", name: "Scheduled Task", description: "Scheduled task creation is monitored as persistence activity.", tactics: ["Persistence"], data_sources: ["Windows Security"], mitigations: ["Monitor task creation"], coverage: "High", linked_sigma_rules: ["SIG-003"], linked_wazuh_rules: ["60228"] },
  { id: "T1543.003", name: "Windows Service", description: "Service installation events are monitored.", tactics: ["Persistence", "Privilege Escalation"], data_sources: ["Windows System", "Sysmon"], mitigations: ["Service monitoring"], coverage: "High", linked_sigma_rules: ["SIG-004"], linked_wazuh_rules: ["61104"] },
  { id: "T1110", name: "Brute Force", description: "Authentication bursts are monitored across Windows and SSH telemetry.", tactics: ["Credential Access"], data_sources: ["Authentication logs"], mitigations: ["Rate limiting", "Account lockout"], coverage: "High", linked_sigma_rules: ["SIG-001", "SIG-005"], linked_wazuh_rules: ["5712", "100201"] },
  { id: "T1548.003", name: "Sudo and Sudo Caching", description: "Sudo authentication failures provide Linux privilege-escalation context.", tactics: ["Privilege Escalation"], data_sources: ["Linux auth"], mitigations: ["Least privilege"], coverage: "Medium", linked_sigma_rules: ["SIG-006"], linked_wazuh_rules: ["5403"] },
  { id: "T1190", name: "Exploit Public-Facing Application", description: "Synthetic WAF events provide application attack context.", tactics: ["Initial Access"], data_sources: ["WAF", "Web access logs"], mitigations: ["WAF", "Input validation"], coverage: "Medium", linked_sigma_rules: ["SIG-007"], linked_wazuh_rules: ["31151", "31152"] },
  { id: "T1041", name: "Exfiltration Over C2 Channel", description: "Transfer-volume anomalies are retained for exfiltration review.", tactics: ["Exfiltration"], data_sources: ["Network Flow"], mitigations: ["Egress monitoring"], coverage: "Medium", linked_sigma_rules: ["SIG-008"], linked_wazuh_rules: ["100330"] },
  { id: "T1562.001", name: "Disable or Modify Tools", description: "Monitoring configuration drift is tracked as defense-evasion context.", tactics: ["Defense Evasion"], data_sources: ["Configuration audit"], mitigations: ["Configuration integrity"], coverage: "Medium", linked_sigma_rules: ["SIG-010"], linked_wazuh_rules: ["100501"] },
];

export const demoAudit = Array.from({ length: 28 }, (_, index) => {
  const actions = ["view", "search", "export", "triage", "filter"] as const;
  const targets = ["dashboard", "incident", "siem-alert", "asset", "detection-rule"] as const;
  return {
    id: `AUD-${String(index + 1).padStart(3, "0")}`,
    user_email: index % 5 === 0 ? "owner@vyomrix.local" : "demo.analyst@mithilkg.dev",
    action: actions[index % actions.length],
    target: targets[index % targets.length],
    resource_id: index % 2 === 0 ? `INC-${String((index % 15) + 1).padStart(3, "0")}` : `ALT-${String((index % 96) + 1).padStart(3, "0")}`,
    ip_address: "synthetic",
    user_agent: "vyomrix-test-session",
    result: "success",
    timestamp: isoMinutesAgo(12 + index * 19),
  };
});
