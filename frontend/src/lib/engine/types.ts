export type Severity = "informational" | "low" | "medium" | "high" | "critical";

export const SEVERITY_RANK: Record<Severity, number> = { informational: 0, low: 1, medium: 2, high: 3, critical: 4 };

export type LogSource = { product?: string; category?: string; service?: string };

export type FieldValue = string | number;

export interface SecEvent {
  id: string;
  ts: number;
  /** Display name of the pipeline that produced it, for example "Sysmon" or "nginx". */
  sensor: string;
  logsource: LogSource;
  host: string;
  user?: string;
  message: string;
  fields: Record<string, FieldValue>;
  /** Scenario run and step that produced this event, if any. Never used by detection logic. */
  run?: string;
  step?: number;
}

export type AlertStatus = "new" | "acknowledged" | "closed";
export type Verdict = "true_positive" | "false_positive" | "benign" | null;

export interface Alert {
  id: string;
  ruleId: string;
  ruleTitle: string;
  level: Severity;
  ts: number;
  firstEventTs: number;
  lastTs: number;
  host: string;
  user?: string;
  ips: string[];
  hosts: string[];
  users: string[];
  techniques: string[];
  tactics: string[];
  eventIds: string[];
  count: number;
  status: AlertStatus;
  verdict: Verdict;
  incidentId?: string;
  run?: string;
  summary: string;
  kind: "sigma" | "correlation" | "intel" | "waf";
}

export type IncidentStatus = "new" | "investigating" | "contained" | "resolved";

export interface IncidentNote {
  ts: number;
  author: string;
  text: string;
  kind: "note" | "action" | "status" | "system";
}

export interface Incident {
  id: string;
  title: string;
  severity: Severity;
  status: IncidentStatus;
  createdAt: number;
  updatedAt: number;
  firstActivity: number;
  containedAt?: number;
  resolvedAt?: number;
  alertIds: string[];
  hosts: string[];
  users: string[];
  ips: string[];
  tactics: string[];
  techniques: string[];
  riskScore: number;
  notes: IncidentNote[];
  assignee: string;
}

export type ResponseAction = "isolate_host" | "release_host" | "block_ip" | "unblock_ip" | "disable_account" | "enable_account" | "waf_mode";

export interface AuditEntry {
  seq: number;
  ts: number;
  actor: string;
  action: string;
  target: string;
  detail: string;
  prevHash: string;
  hash: string;
}
