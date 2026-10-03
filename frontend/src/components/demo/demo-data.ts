export const demoStats = [
  { value: "06", label: "Investigation records", detail: "Five validated, one partial" },
  { value: "10", label: "Sigma rules", detail: "Seven directly validated" },
  { value: "01", label: "Custom Wazuh rule", detail: "Validated correlation" },
  { value: "05", label: "ATT&CK techniques", detail: "Evidence-backed mappings" },
];

export const demoIncidents = [
  { id: "INC-001", title: "Authentication anomaly", severity: "High", status: "Validated", evidence: "Failed logon correlation and investigation notes" },
  { id: "INC-002", title: "PowerShell activity", severity: "Medium", status: "Validated", evidence: "PowerShell telemetry and detection workflow" },
  { id: "INC-003", title: "Scheduled task activity", severity: "Medium", status: "Validated", evidence: "Task creation evidence and triage context" },
  { id: "INC-004", title: "Sensitive process discovery", severity: "High", status: "Partial", evidence: "Safe discovery evidence; expected event not observed" },
  { id: "INC-005", title: "Web application event", severity: "High", status: "Validated", evidence: "Synthetic application security workflow" },
  { id: "INC-006", title: "Data transfer event", severity: "Medium", status: "Validated", evidence: "Transfer evidence and integrity verification" },
];

export const demoAssets = [
  { name: "win-endpoint-01", type: "Windows 11 endpoint", state: "Monitored" },
  { name: "web-lab-01", type: "Synthetic application", state: "Monitored" },
  { name: "wazuh-manager", type: "SIEM service", state: "Connected" },
];

export const demoDetections = [
  { name: "Authentication monitoring", state: "Validated" },
  { name: "PowerShell monitoring", state: "Validated" },
  { name: "Scheduled task monitoring", state: "Validated" },
  { name: "Sensitive process discovery", state: "Partial" },
  { name: "Application security monitoring", state: "Validated" },
  { name: "Data transfer monitoring", state: "Validated" },
];

export const demoAttack = [
  "Valid Accounts",
  "PowerShell",
  "Scheduled Task/Job",
  "Process Discovery",
  "Exfiltration Over Web Service",
];

export const demoReports = [
  "INC-001 Authentication investigation",
  "INC-002 PowerShell investigation",
  "INC-003 Scheduled task investigation",
  "INC-004 Partial validation note",
  "INC-005 Web application investigation",
  "INC-006 Data transfer investigation",
];
