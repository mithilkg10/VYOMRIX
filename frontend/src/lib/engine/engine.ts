// The VYOMRIX detection engine. Telemetry is generated one second at a time, run through
// the WAF, the intel matcher and every compiled Sigma rule, correlated into alerts and
// grouped into incidents. Analyst decisions and response actions are kept in a journal,
// so a reload replays the same history and reaches exactly the same state.

import { compileRule, countConditionMet, getField, groupKey, type SigmaRule } from "./sigma";
import { RULE_SOURCES } from "./rules";
import { IOCS, lookupIoc } from "./intel";
import { inspect } from "./waf";
import { ASSETS, assetByHost, baselineSecond, hostByIp, type Emitter, type WebRequestDraft, type World } from "./telemetry";
import { SCENARIOS, scenarioById, type StepContext } from "./scenarios";
import { hashString, rng, sha256 } from "./util";
import { techniqueTactic } from "./attack";
import { SEVERITY_RANK, type Alert, type AlertStatus, type AuditEntry, type Incident, type IncidentStatus, type ResponseAction, type SecEvent, type Severity, type Verdict } from "./types";

export type JournalEntry =
  | { t: number; kind: "scenario"; scenario: string; attacker?: string }
  | { t: number; kind: "action"; action: ResponseAction; target: string; mode?: "blocking" | "detection"; incident?: string; run?: string; actor: string }
  | { t: number; kind: "incident_status"; incident?: string; run?: string; status: IncidentStatus; actor: string }
  | { t: number; kind: "note"; incident?: string; run?: string; text: string; actor: string }
  | { t: number; kind: "alert"; alert: string; status?: AlertStatus; verdict?: Verdict; actor: string }
  | { t: number; kind: "assign"; incident: string; assignee: string; actor: string }
  | { t: number; kind: "bulk_verdict"; rule?: string; run?: string; verdict: Verdict; actor: string };

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
export type JournalInput = DistributiveOmit<JournalEntry, "t">;

export type StepState = "pending" | "running" | "executed" | "prevented" | "skipped";

export interface RunStep {
  label: string;
  detail: string;
  technique: string;
  host: string;
  dueTs: number;
  state: StepState;
  reason?: string;
  expect: string[];
  detectedBy: string[];
  detectedAt?: number;
}

export interface ScenarioRun {
  id: string;
  scenarioId: string;
  name: string;
  attacker: string;
  startSec: number;
  status: "running" | "completed" | "contained";
  endedAt?: number;
  steps: RunStep[];
  incidentId?: string;
  mem: Record<string, unknown>;
}

export interface RuleStats {
  hits: number;
  alerts: number;
  lastFired?: number;
  tp: number;
  fp: number;
}

export interface MinuteBucket {
  minute: number;
  events: number;
  blocked: number;
  alerts: Record<Severity, number>;
}

export interface HoneypotAttacker {
  ip: string;
  attempts: number;
  logins: number;
  commands: string[];
  usernames: Set<string>;
  passwords: Set<string>;
  first: number;
  last: number;
}

export const INTEL_RULE = {
  id: "intel-ioc-match",
  name: "intel_ioc_match",
  title: "Threat Intel Indicator Match",
  description: "Every IP, domain, URL and file hash seen in telemetry is checked against the indicator store. Severity follows indicator confidence.",
};

const HISTORY_SECONDS = 90 * 60;
const MAX_EVENTS = 40000;
const ALERT_DEDUP_MS = 10 * 60_000;
const INCIDENT_WINDOW_MS = 30 * 60_000;
const NON_PERSON = /^(nt authority\\system|localsystem|system|www-data|root)$/i;
const WEIGHT: Record<Severity, number> = { informational: 0, low: 4, medium: 12, high: 25, critical: 40 };
const RISK_WEIGHT: Record<Severity, number> = { informational: 0, low: 2, medium: 8, high: 25, critical: 40 };

const TITLE_ORDER: [string, string][] = [
  ["impact", "Ransomware staging"],
  ["exfiltration", "Data exfiltration"],
  ["lateral-movement", "Lateral movement with stolen credentials"],
  ["persistence", "Web application compromise"],
  ["credential-access", "Credential compromise"],
  ["command-and-control", "Command and control activity"],
  ["execution", "Malicious execution"],
  ["initial-access", "Exploitation attempt"],
  ["discovery", "Reconnaissance"],
];

function isPrivate(ip: string) {
  return /^(10\.|127\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(ip);
}

export function seedJournal(start: number): JournalEntry[] {
  const a = "SOC Analyst (r.iyer)";
  return [
    { t: start + 600, kind: "scenario", scenario: "web-compromise", attacker: "203.0.113.58" },
    { t: start + 690, kind: "incident_status", run: "RUN-1", status: "investigating", actor: a },
    { t: start + 690, kind: "note", run: "RUN-1", text: "Triage started. sqlmap traffic from 203.0.113.58 confirmed. The WAF on api-staging-01 is in detection only mode, so nothing was blocked.", actor: a },
    { t: start + 720, kind: "action", action: "block_ip", target: "203.0.113.58", run: "RUN-1", actor: a },
    { t: start + 722, kind: "action", action: "isolate_host", target: "api-staging-01", run: "RUN-1", actor: a },
    { t: start + 725, kind: "incident_status", run: "RUN-1", status: "contained", actor: a },
    { t: start + 1500, kind: "note", run: "RUN-1", text: "api-staging-01 rebuilt from the golden image. All credentials in the users table rotated. Change CHG-2291 raised to move the staging WAF to blocking mode.", actor: a },
    { t: start + 1502, kind: "action", action: "release_host", target: "api-staging-01", run: "RUN-1", actor: a },
    { t: start + 1505, kind: "incident_status", run: "RUN-1", status: "resolved", actor: a },
    { t: start + 1510, kind: "bulk_verdict", run: "RUN-1", verdict: "true_positive", actor: a },
    { t: start + 2900, kind: "scenario", scenario: "ssh-exfil", attacker: "203.0.113.214" },
    { t: start + 2980, kind: "incident_status", run: "RUN-2", status: "investigating", actor: a },
    { t: start + 2990, kind: "action", action: "block_ip", target: "203.0.113.214", run: "RUN-2", actor: a },
    { t: start + 2993, kind: "action", action: "isolate_host", target: "db-lab-01", run: "RUN-2", actor: a },
    { t: start + 2995, kind: "incident_status", run: "RUN-2", status: "contained", actor: a },
    { t: start + 3000, kind: "note", run: "RUN-2", text: "DNS exfiltration stopped by isolating db-lab-01. Roughly 30 queries left before isolation. Next: confirm how the deploy key was reused and rotate it.", actor: a },
    { t: start + 3600, kind: "action", action: "release_host", target: "db-lab-01", run: "RUN-2", actor: a },
    { t: start + 3610, kind: "bulk_verdict", run: "RUN-2", verdict: "true_positive", actor: a },
    { t: start + 3620, kind: "bulk_verdict", rule: "domain_discovery", verdict: "false_positive", actor: a },
    { t: start + 3630, kind: "bulk_verdict", rule: "schtasks_create", verdict: "benign", actor: a },
    { t: start + 3640, kind: "bulk_verdict", rule: "db_archive_staging", verdict: "false_positive", actor: a },
    { t: start + 3650, kind: "bulk_verdict", rule: "dns_long_label", verdict: "false_positive", actor: a },
  ];
}

export class Engine {
  readonly rules: SigmaRule[];
  readonly ruleByName = new Map<string, SigmaRule>();
  private readonly eventRules: SigmaRule[];
  private readonly corrByRef = new Map<string, SigmaRule[]>();
  private readonly silent = new Set<string>();
  private corrState = new Map<string, Map<string, unknown>>();

  events: SecEvent[] = [];
  eventById = new Map<string, SecEvent>();
  alerts: Alert[] = [];
  alertById = new Map<string, Alert>();
  incidents: Incident[] = [];
  incidentById = new Map<string, Incident>();
  runs: ScenarioRun[] = [];
  audit: AuditEntry[] = [];
  stats = new Map<string, RuleStats>();
  minutes = new Map<number, MinuteBucket>();
  honeypot = new Map<string, HoneypotAttacker>();
  world: World = { isolated: new Set(), blockedIps: new Set(), disabled: new Set(), wafMode: { "web-lab-01": "blocking", "api-staging-01": "detection" } };
  journal: JournalEntry[];
  readonly startSec: number;
  lastSec: number;
  totalEvents = 0;
  version = 0;

  private seq = { alert: 4100, incident: 1041, run: 0 };
  private listeners = new Set<() => void>();
  private journalCursor = 0;

  constructor(opts: { startSec: number; journal?: JournalEntry[]; nowSec: number }) {
    this.startSec = opts.startSec;
    this.lastSec = opts.startSec - 1;
    this.journal = [...(opts.journal ?? seedJournal(opts.startSec))].sort((a, b) => a.t - b.t);
    this.rules = RULE_SOURCES.map((src) => compileRule(src));
    for (const rule of this.rules) {
      this.ruleByName.set(rule.name ?? rule.id, rule);
      this.stats.set(rule.name ?? rule.id, { hits: 0, alerts: 0, tp: 0, fp: 0 });
    }
    this.stats.set(INTEL_RULE.name, { hits: 0, alerts: 0, tp: 0, fp: 0 });
    this.eventRules = this.rules.filter((r) => r.kind === "event");
    for (const rule of this.rules.filter((r) => r.kind === "correlation")) {
      for (const ref of rule.correlation!.rules) {
        const list = this.corrByRef.get(ref) ?? [];
        list.push(rule);
        this.corrByRef.set(ref, list);
      }
    }
    // Rules referenced only by non generating correlations act as building blocks.
    for (const [ref, corrs] of this.corrByRef) if (this.ruleByName.get(ref)?.kind === "event" && corrs.every((c) => !c.correlation!.generate)) this.silent.add(ref);
    this.advanceTo(opts.nowSec);
  }

  // ---- subscription ------------------------------------------------------------------
  subscribe = (fn: () => void) => { this.listeners.add(fn); return () => { this.listeners.delete(fn); }; };
  getVersion = () => this.version;
  private notify() { this.version += 1; for (const fn of this.listeners) fn(); }

  // ---- time --------------------------------------------------------------------------
  advanceTo(nowSec: number) {
    if (nowSec <= this.lastSec) return;
    const from = Math.max(this.lastSec + 1, nowSec - 6 * 3600);
    for (let sec = from; sec <= nowSec; sec += 1) this.processSecond(sec);
    this.lastSec = nowSec;
    this.notify();
  }

  private processSecond(sec: number) {
    while (this.journalCursor < this.journal.length && this.journal[this.journalCursor].t <= sec) {
      this.apply(this.journal[this.journalCursor]);
      this.journalCursor += 1;
    }
    const r = rng(hashString(`vyomrix:${sec}`));
    const buffer: SecEvent[] = [];
    let n = 0;
    const em: Emitter = {
      sec, r, world: this.world,
      emit: (draft, ms) => {
        const offset = Math.max(0, Math.min(999, Math.floor(ms ?? r() * 1000)));
        const event: SecEvent = { ...draft, id: `E${sec.toString(36)}${(n++).toString(36)}`, ts: sec * 1000 + offset };
        buffer.push(event);
        return event;
      },
      web: (req, ms) => this.webRequest(em, req, ms),
    };
    baselineSecond(em);
    for (const run of this.runs) if (run.status === "running") this.progressRun(run, em);
    buffer.sort((a, b) => a.ts - b.ts);
    for (const event of buffer) this.ingest(event);
    this.lastSec = Math.max(this.lastSec, sec);
  }

  private webRequest(em: Emitter, req: WebRequestDraft, ms?: number) {
    const edgeBlocked = this.world.blockedIps.has(req.ip);
    const mode = this.world.wafMode[req.host] ?? "blocking";
    const res = edgeBlocked ? null : inspect({ method: req.method, uri: req.uri, body: req.body, userAgent: req.ua, srcIp: req.ip }, 5, mode);
    const blocked = edgeBlocked || res?.action === "block";
    const [stem, query = ""] = req.uri.split("?");
    const event = em.emit({
      sensor: "nginx", logsource: { category: "webserver", product: "nginx" }, host: req.host,
      message: `${req.ip} "${req.method} ${req.uri}" ${blocked ? 403 : req.status}${edgeBlocked ? " (edge block list)" : ""}`,
      fields: { "c-ip": req.ip, "cs-method": req.method, "cs-uri-stem": stem, "cs-uri-query": query, "sc-status": blocked ? 403 : req.status, "sc-bytes": blocked ? 548 : req.bytes, "cs-user-agent": req.ua, "cs-host": req.host, "waf-action": edgeBlocked ? "edge-block" : res!.action, "waf-score": res?.score ?? 0 },
      run: req.run, step: req.step,
    }, ms);
    if (res) for (const m of res.matches) {
      em.emit({
        sensor: "WAF (CRS)", logsource: { product: "vyomrix", service: "waf" }, host: req.host,
        message: `[${m.id}] ${m.msg} from ${req.ip} (score ${res.score}, ${res.action})`,
        fields: { rule_id: m.id, rule_msg: m.msg, severity: m.severity, family: m.family, anomaly_score: res.score, action: res.action, src_ip: req.ip, uri: req.uri, matched_data: m.matched, target: m.target, request_id: event.id },
        run: req.run, step: req.step,
      }, ms);
    }
    return { event, blocked };
  }

  private progressRun(run: ScenarioRun, em: Emitter) {
    const def = scenarioById(run.scenarioId)!;
    for (let i = 0; i < def.steps.length; i += 1) {
      const step = def.steps[i];
      const state = run.steps[i];
      if (state.state !== "pending" && state.state !== "running") continue;
      const start = run.startSec + step.at;
      const span = step.span ?? 1;
      if (em.sec < start || em.sec >= start + span) continue;
      const prevent = (reason: string) => {
        state.state = "prevented";
        state.reason = reason;
        run.status = "contained";
        run.endedAt = em.sec * 1000;
        for (let j = i + 1; j < run.steps.length; j += 1) { run.steps[j].state = "skipped"; run.steps[j].reason = "The attack chain was broken at an earlier step."; }
      };
      const isolated = step.gate?.hosts?.find((h) => this.world.isolated.has(h));
      if (isolated) { prevent(`${isolated} is isolated, so the attacker could not reach it.`); break; }
      if (step.gate?.attackerIp && this.world.blockedIps.has(run.attacker)) { prevent(`Traffic from ${run.attacker} is dropped by the edge block list.`); break; }
      if (step.gate?.account && this.world.disabled.has(step.gate.account)) { prevent(`The ${step.gate.account} account is disabled.`); break; }
      const ctx: StepContext = { em, run: run.id, step: i, tick: em.sec - start, mem: run.mem, attacker: run.attacker };
      const out = step.run(ctx);
      if (!out.ok) { prevent(out.reason); break; }
      state.state = em.sec === start + span - 1 ? "executed" : "running";
    }
    if (run.status === "running" && run.steps.every((s) => s.state === "executed")) { run.status = "completed"; run.endedAt = em.sec * 1000; }
  }

  // ---- ingestion and detection ------------------------------------------------------
  private ingest(event: SecEvent) {
    this.events.push(event);
    this.eventById.set(event.id, event);
    this.totalEvents += 1;
    if (this.events.length > MAX_EVENTS) {
      const removed = this.events.splice(0, this.events.length - MAX_EVENTS);
      for (const e of removed) this.eventById.delete(e.id);
    }
    const bucket = this.bucket(event.ts);
    bucket.events += 1;
    if (event.fields["sc-status"] === 403) bucket.blocked += 1;
    if (event.logsource.service === "honeypot") this.trackHoneypot(event);
    else this.checkIntel(event);
    for (const rule of this.eventRules) if (rule.test!(event)) this.onMatch(rule, event, [event.id]);
  }

  private bucket(ts: number) {
    const minute = Math.floor(ts / 60_000);
    let b = this.minutes.get(minute);
    if (!b) {
      b = { minute, events: 0, blocked: 0, alerts: { informational: 0, low: 0, medium: 0, high: 0, critical: 0 } };
      this.minutes.set(minute, b);
      if (this.minutes.size > 6 * 60) this.minutes.delete(Math.min(...this.minutes.keys()));
    }
    return b;
  }

  private trackHoneypot(event: SecEvent) {
    const ip = String(event.fields.SourceIp);
    let a = this.honeypot.get(ip);
    if (!a) { a = { ip, attempts: 0, logins: 0, commands: [], usernames: new Set(), passwords: new Set(), first: event.ts, last: event.ts }; this.honeypot.set(ip, a); }
    a.last = event.ts;
    if (event.fields.Event === "login_failed") { a.attempts += 1; a.usernames.add(String(event.fields.Username)); a.passwords.add(String(event.fields.Password)); }
    if (event.fields.Event === "login_success") { a.logins += 1; a.attempts += 1; }
    if (event.fields.Event === "command") { a.commands.push(String(event.fields.Command)); if (a.commands.length > 40) a.commands.shift(); }
  }

  private checkIntel(event: SecEvent) {
    const candidates = new Set<string>();
    for (const f of ["DestinationIp", "IpAddress", "SourceIp", "c-ip", "src_ip", "query", "DestinationHostname"]) {
      const v = event.fields[f];
      if (typeof v === "string" && v) candidates.add(v);
    }
    const hashes = String(event.fields.Hashes ?? "");
    const sha = /SHA256=([A-F0-9]{64})/i.exec(hashes);
    if (sha) candidates.add(sha[1]);
    const cmd = String(event.fields.CommandLine ?? "");
    for (const m of cmd.match(/https?:\/\/[^\s'"]+|\b\d{1,3}(?:\.\d{1,3}){3}\b/g) ?? []) {
      candidates.add(m);
      const host = /^https?:\/\/([^/:]+)/.exec(m);
      if (host) candidates.add(host[1]);
    }
    for (const value of candidates) {
      const ioc = lookupIoc(value);
      if (!ioc) continue;
      const level: Severity = ioc.confidence >= 90 ? "high" : ioc.confidence >= 70 ? "medium" : "low";
      const st = this.stats.get(INTEL_RULE.name)!;
      st.hits += 1;
      st.lastFired = event.ts;
      this.raise({
        ruleId: INTEL_RULE.id, ruleName: INTEL_RULE.name, title: `${INTEL_RULE.title}: ${ioc.threat}`, level, kind: "intel",
        techniques: ioc.tags.includes("c2") ? ["T1071.001"] : ioc.tags.includes("scanner") ? ["T1595.002"] : ioc.tags.includes("bruteforce") ? ["T1110.001"] : ["T1105"],
        tactics: [],
        event, ids: [event.id], dedupExtra: ioc.value,
        summary: `${ioc.type.toUpperCase()} ${ioc.value} (${ioc.feed}, confidence ${ioc.confidence}) seen in ${event.sensor} on ${event.host}.`,
      });
      break;
    }
  }

  private onMatch(rule: SigmaRule, event: SecEvent, ids: string[]) {
    const name = rule.name ?? rule.id;
    const st = this.stats.get(name)!;
    st.hits += 1;
    st.lastFired = event.ts;
    if (!this.silent.has(name)) {
      this.raise({
        ruleId: rule.id, ruleName: name, title: rule.title, level: rule.level, kind: rule.kind === "correlation" ? "correlation" : event.logsource.service === "waf" ? "waf" : "sigma",
        techniques: rule.techniques, tactics: rule.tactics, event, ids,
        summary: rule.kind === "correlation" ? this.correlationSummary(rule, event, ids.length) : event.message,
      });
    }
    for (const corr of this.corrByRef.get(name) ?? []) this.feedCorrelation(corr, name, event, ids);
  }

  private correlationSummary(rule: SigmaRule, event: SecEvent, count: number) {
    const c = rule.correlation!;
    const group = c.groupBy.map((f) => `${f} ${getField(event, f)}`).join(", ");
    if (c.type === "temporal_ordered" || c.type === "temporal") return `${c.rules.join(" then ")} for ${group} within ${c.timespan / 60000} min.`;
    return `${count} matching events of ${c.rules.join(", ")} for ${group} within ${c.timespan / 60000} min.`;
  }

  private feedCorrelation(corr: SigmaRule, source: string, event: SecEvent, ids: string[]) {
    const c = corr.correlation!;
    const values = c.groupBy.map((f) => getField(event, f));
    if (values.some((v) => v === undefined || v === "")) return;
    const key = groupKey(event, c.groupBy);
    const name = corr.name ?? corr.id;
    let states = this.corrState.get(name);
    if (!states) { states = new Map(); this.corrState.set(name, states); }
    const horizon = event.ts - c.timespan;
    if (c.type === "event_count") {
      const list = ((states.get(key) as { ts: number; ids: string[] }[] | undefined) ?? []).filter((x) => x.ts >= horizon);
      list.push({ ts: event.ts, ids });
      if (countConditionMet(c.condition, list.length)) { states.delete(key); this.onMatch(corr, event, list.flatMap((x) => x.ids).slice(-60)); }
      else states.set(key, list);
    } else if (c.type === "value_count") {
      const map = (states.get(key) as Map<string, { ts: number; id: string }> | undefined) ?? new Map<string, { ts: number; id: string }>();
      for (const [v, x] of map) if (x.ts < horizon) map.delete(v);
      map.set(String(getField(event, c.condition.field!) ?? ""), { ts: event.ts, id: ids[ids.length - 1] });
      if (countConditionMet(c.condition, map.size)) { states.delete(key); this.onMatch(corr, event, [...map.values()].map((x) => x.id)); }
      else states.set(key, map);
    } else {
      const seen = (states.get(key) as Map<string, { ts: number; ids: string[] }> | undefined) ?? new Map<string, { ts: number; ids: string[] }>();
      for (const [v, x] of seen) if (x.ts < horizon) seen.delete(v);
      const idx = c.rules.indexOf(source);
      if (c.type === "temporal_ordered" && c.rules.slice(0, idx).some((r) => !seen.has(r))) { states.set(key, seen); return; }
      seen.set(source, { ts: event.ts, ids });
      if (c.rules.every((r) => seen.has(r))) { states.delete(key); this.onMatch(corr, event, [...seen.values()].flatMap((x) => x.ids).slice(-60)); }
      else states.set(key, seen);
    }
  }

  private raise(o: { ruleId: string; ruleName: string; title: string; level: Severity; kind: Alert["kind"]; techniques: string[]; tactics: string[]; event: SecEvent; ids: string[]; summary: string; dedupExtra?: string }) {
    const { event } = o;
    const hosts = new Set([event.host]);
    const ips = new Set<string>();
    for (const f of ["IpAddress", "SourceIp", "c-ip", "src_ip", "DestinationIp"]) {
      const v = event.fields[f];
      if (typeof v !== "string" || !/^\d+\.\d+\.\d+\.\d+$/.test(v)) continue;
      if (isPrivate(v)) { const h = hostByIp(v); if (h && f !== "DestinationIp") hosts.add(h); } else ips.add(v);
    }
    const users = new Set<string>();
    const failedAuth = event.fields.EventID === 4625 || event.fields.Event === "failed_password" || event.fields.Event === "invalid_user";
    if (event.user && !failedAuth && !NON_PERSON.test(event.user)) users.add(event.user);
    const tactics = o.tactics.length ? o.tactics : [...new Set(o.techniques.map((t) => techniqueTactic(t)).filter((x): x is NonNullable<typeof x> => Boolean(x)))];
    const contributing = o.ids.map((id) => this.eventById.get(id)).filter((e): e is SecEvent => Boolean(e));
    const runId = contributing.find((e) => e.run)?.run;

    const existing = this.alerts.find((a) => a.ruleId === o.ruleId && a.host === event.host && a.status !== "closed" && event.ts - a.lastTs < ALERT_DEDUP_MS && (o.dedupExtra === undefined || a.summary.includes(o.dedupExtra)) && a.run === runId);
    this.markSteps(contributing, o.ruleName, event.ts);
    if (existing) {
      existing.count += 1;
      existing.lastTs = event.ts;
      existing.eventIds = [...existing.eventIds, ...o.ids].slice(-80);
      for (const h of hosts) if (!existing.hosts.includes(h)) existing.hosts.push(h);
      for (const ip of ips) if (!existing.ips.includes(ip)) existing.ips.push(ip);
      for (const u of users) if (!existing.users.includes(u)) existing.users.push(u);
      if (existing.incidentId) this.touchIncident(this.incidentById.get(existing.incidentId)!, existing);
      return;
    }
    const delay = 400 + (hashString(event.id + o.ruleId) % 2600);
    this.seq.alert += 1;
    const alert: Alert = {
      id: `ALR-${this.seq.alert}`, ruleId: o.ruleId, ruleTitle: o.title, level: o.level, ts: event.ts + delay,
      firstEventTs: Math.min(event.ts, ...contributing.map((e) => e.ts)), lastTs: event.ts, host: event.host, user: event.user,
      ips: [...ips], hosts: [...hosts], users: [...users], techniques: o.techniques, tactics, eventIds: o.ids.slice(-80), count: 1,
      status: "new", verdict: null, summary: o.summary, kind: o.kind, run: runId,
    };
    this.alerts.push(alert);
    this.alertById.set(alert.id, alert);
    const st = this.stats.get(o.ruleName);
    if (st) st.alerts += 1;
    this.bucket(alert.ts).alerts[alert.level] += 1;
    for (const e of contributing) if (e.run) { const run = this.runs.find((r) => r.id === e.run); if (run) { const s = run.steps[e.step ?? 0]; if (s && s.detectedAt === undefined) s.detectedAt = alert.ts; } }
    this.attachToIncident(alert);
  }

  private markSteps(events: SecEvent[], ruleName: string, ts: number) {
    for (const e of events) {
      if (!e.run) continue;
      const run = this.runs.find((r) => r.id === e.run);
      const step = run?.steps[e.step ?? 0];
      if (step && !step.detectedBy.includes(ruleName)) { step.detectedBy.push(ruleName); step.detectedAt = step.detectedAt ?? ts; }
    }
  }

  private attachToIncident(alert: Alert) {
    if (alert.host === "honeypot-ssh-01" || SEVERITY_RANK[alert.level] < SEVERITY_RANK.medium) return;
    const shares = (inc: Incident) => alert.hosts.some((h) => inc.hosts.includes(h)) || alert.users.some((u) => inc.users.includes(u)) || alert.ips.some((ip) => inc.ips.includes(ip));
    let inc = this.incidents.find((i) => i.status !== "resolved" && alert.ts - i.updatedAt < INCIDENT_WINDOW_MS && (alert.run ? this.runOf(i) === alert.run : !this.runOf(i)) && shares(i));
    if (!inc && alert.run) inc = this.incidents.find((i) => this.runOf(i) === alert.run && i.status !== "resolved");
    if (!inc) {
      if (SEVERITY_RANK[alert.level] < SEVERITY_RANK.high) return;
      this.seq.incident += 1;
      inc = {
        id: `INC-${this.seq.incident}`, title: alert.ruleTitle, severity: alert.level, status: "new", createdAt: alert.ts, updatedAt: alert.ts, firstActivity: alert.firstEventTs,
        alertIds: [], hosts: [], users: [], ips: [], tactics: [], techniques: [], riskScore: 0, assignee: "Unassigned",
        notes: [{ ts: alert.ts, author: "Correlation engine", text: `Incident opened from ${alert.id} (${alert.ruleTitle}).`, kind: "system" }],
      };
      this.incidents.push(inc);
      this.incidentById.set(inc.id, inc);
      if (alert.run) { const run = this.runs.find((r) => r.id === alert.run); if (run && !run.incidentId) run.incidentId = inc.id; }
    }
    alert.incidentId = inc.id;
    inc.alertIds.push(alert.id);
    if (alert.firstEventTs < inc.firstActivity) inc.firstActivity = alert.firstEventTs;
    if (alert.run) {
      const run = this.runs.find((r) => r.id === alert.run);
      if (run) inc.firstActivity = Math.min(inc.firstActivity, run.startSec * 1000 + 1000);
    }
    this.touchIncident(inc, alert);
  }

  private runOf(inc: Incident) {
    return this.alertById.get(inc.alertIds[0] ?? "")?.run;
  }

  private touchIncident(inc: Incident, alert: Alert) {
    inc.updatedAt = Math.max(inc.updatedAt, alert.lastTs);
    for (const h of alert.hosts) if (!inc.hosts.includes(h)) inc.hosts.push(h);
    for (const u of alert.users) if (!inc.users.includes(u)) inc.users.push(u);
    for (const ip of alert.ips) if (!inc.ips.includes(ip)) inc.ips.push(ip);
    for (const t of alert.tactics) if (!inc.tactics.includes(t)) inc.tactics.push(t);
    for (const t of alert.techniques) if (!inc.techniques.includes(t)) inc.techniques.push(t);
    if (SEVERITY_RANK[alert.level] > SEVERITY_RANK[inc.severity]) inc.severity = alert.level;
    const alerts = inc.alertIds.map((id) => this.alertById.get(id)!).filter(Boolean);
    inc.riskScore = Math.min(100, alerts.reduce((s, a) => s + WEIGHT[a.level], 0));
    const label = TITLE_ORDER.find(([t]) => inc.tactics.includes(t))?.[1] ?? alerts[0]?.ruleTitle ?? "Suspicious activity";
    inc.title = `${label} on ${inc.hosts.slice(0, 2).join(" and ")}${inc.hosts.length > 2 ? ` and ${inc.hosts.length - 2} more` : ""}`;
  }

  // ---- journal and actions -----------------------------------------------------------
  private resolveIncident(entry: { incident?: string; run?: string }) {
    if (entry.incident) return this.incidentById.get(entry.incident);
    if (entry.run) { const run = this.runs.find((r) => r.id === entry.run); return run?.incidentId ? this.incidentById.get(run.incidentId) : undefined; }
    return undefined;
  }

  private apply(entry: JournalEntry) {
    const ts = entry.t * 1000;
    switch (entry.kind) {
      case "scenario": {
        const def = scenarioById(entry.scenario);
        if (!def) return;
        this.seq.run += 1;
        this.runs.push({
          id: `RUN-${this.seq.run}`, scenarioId: def.id, name: def.name, attacker: entry.attacker ?? def.attacker, startSec: entry.t, status: "running", mem: {},
          steps: def.steps.map((s) => ({ label: s.label, detail: s.detail, technique: s.technique, host: s.host, dueTs: (entry.t + s.at) * 1000, state: "pending", expect: s.expect, detectedBy: [] })),
        });
        return;
      }
      case "action": {
        const w = this.world;
        const verb: Record<ResponseAction, string> = { isolate_host: "Isolated host", release_host: "Released host from isolation", block_ip: "Blocked address at the edge", unblock_ip: "Removed address from the block list", disable_account: "Disabled account", enable_account: "Enabled account", waf_mode: "Changed WAF mode" };
        if (entry.action === "isolate_host") w.isolated.add(entry.target);
        if (entry.action === "release_host") w.isolated.delete(entry.target);
        if (entry.action === "block_ip") w.blockedIps.add(entry.target);
        if (entry.action === "unblock_ip") w.blockedIps.delete(entry.target);
        if (entry.action === "disable_account") w.disabled.add(entry.target);
        if (entry.action === "enable_account") w.disabled.delete(entry.target);
        if (entry.action === "waf_mode" && entry.mode) w.wafMode[entry.target] = entry.mode;
        const detail = entry.action === "waf_mode" ? `${entry.target} set to ${entry.mode} mode` : entry.target;
        this.addAudit(ts, entry.actor, verb[entry.action], entry.target, detail);
        const inc = this.resolveIncident(entry);
        if (inc) inc.notes.push({ ts, author: entry.actor, text: `${verb[entry.action]}: ${detail}`, kind: "action" });
        return;
      }
      case "incident_status": {
        const inc = this.resolveIncident(entry);
        if (!inc) return;
        inc.status = entry.status;
        if (entry.status === "contained" && !inc.containedAt) inc.containedAt = ts;
        if (entry.status === "resolved") { inc.resolvedAt = ts; inc.containedAt = inc.containedAt ?? ts; }
        if (inc.assignee === "Unassigned") inc.assignee = entry.actor;
        inc.notes.push({ ts, author: entry.actor, text: `Status changed to ${entry.status}.`, kind: "status" });
        this.addAudit(ts, entry.actor, "Changed incident status", inc.id, entry.status);
        return;
      }
      case "note": {
        const inc = this.resolveIncident(entry);
        if (inc) inc.notes.push({ ts, author: entry.actor, text: entry.text, kind: "note" });
        return;
      }
      case "assign": {
        const inc = this.incidentById.get(entry.incident);
        if (inc) { inc.assignee = entry.assignee; inc.notes.push({ ts, author: entry.actor, text: `Assigned to ${entry.assignee}.`, kind: "status" }); }
        return;
      }
      case "bulk_verdict": {
        const ruleId = entry.rule ? this.ruleByName.get(entry.rule)?.id : undefined;
        for (const a of this.alerts) {
          if (a.verdict || a.status === "closed") continue;
          if (entry.run ? a.run !== entry.run : a.run || a.ruleId !== ruleId) continue;
          this.apply({ t: entry.t, kind: "alert", alert: a.id, verdict: entry.verdict, actor: entry.actor });
        }
        return;
      }
      case "alert": {
        const alert = this.alertById.get(entry.alert);
        if (!alert) return;
        if (entry.status) alert.status = entry.status;
        if (entry.verdict !== undefined && entry.verdict !== alert.verdict) {
          const name = alert.ruleId === INTEL_RULE.id ? INTEL_RULE.name : this.rules.find((r) => r.id === alert.ruleId)?.name ?? alert.ruleId;
          const st = this.stats.get(name);
          if (st) {
            if (alert.verdict === "true_positive") st.tp -= 1;
            if (alert.verdict === "false_positive") st.fp -= 1;
            if (entry.verdict === "true_positive") st.tp += 1;
            if (entry.verdict === "false_positive") st.fp += 1;
          }
          alert.verdict = entry.verdict;
          if (entry.verdict) alert.status = "closed";
          this.addAudit(ts, entry.actor, "Triaged alert", alert.id, entry.verdict ? entry.verdict.replace("_", " ") : "verdict cleared");
        }
        return;
      }
    }
  }

  private addAudit(ts: number, actor: string, action: string, target: string, detail: string) {
    const prevHash = this.audit[this.audit.length - 1]?.hash ?? "0".repeat(64);
    const seq = this.audit.length + 1;
    const hash = sha256(`${prevHash}|${seq}|${ts}|${actor}|${action}|${target}|${detail}`);
    this.audit.push({ seq, ts, actor, action, target, detail, prevHash, hash });
  }

  verifyAudit() {
    let prev = "0".repeat(64);
    for (const e of this.audit) {
      const expected = sha256(`${prev}|${e.seq}|${e.ts}|${e.actor}|${e.action}|${e.target}|${e.detail}`);
      if (e.prevHash !== prev || e.hash !== expected) return { ok: false, brokenAt: e.seq };
      prev = e.hash;
    }
    return { ok: true, brokenAt: null as number | null };
  }

  /** Records an analyst decision. It applies before the next second is generated, and replays identically. */
  record(entry: JournalInput) {
    const full = { ...entry, t: this.lastSec + 1 } as JournalEntry;
    this.journal.push(full);
    this.apply(full);
    this.journalCursor = this.journal.length;
    this.notify();
    return full;
  }

  launch(scenario: string) {
    this.record({ kind: "scenario", scenario });
    return this.runs[this.runs.length - 1];
  }

  // ---- read helpers ------------------------------------------------------------------
  hostRisk(host: string, now = this.lastSec * 1000) {
    // One contribution per distinct detection, so a noisy rule cannot inflate the score on its own.
    const byRule = new Map<string, number>();
    for (const a of this.alerts) {
      if (!a.hosts.includes(host) || a.verdict === "false_positive" || a.verdict === "benign" || now - a.lastTs >= 3_600_000) continue;
      if (a.incidentId && this.incidentById.get(a.incidentId)?.status === "resolved") continue;
      byRule.set(a.ruleId, Math.max(byRule.get(a.ruleId) ?? 0, RISK_WEIGHT[a.level]));
    }
    return Math.min(100, [...byRule.values()].reduce((s, w) => s + w, 0));
  }

  hostState(host: string) {
    const asset = assetByHost(host);
    if (this.world.isolated.has(host)) return "Isolated" as const;
    if (asset?.offline) return "Offline" as const;
    const risk = this.hostRisk(host);
    return risk >= 60 ? ("Compromised" as const) : risk >= 20 ? ("At risk" as const) : ("Healthy" as const);
  }

  containmentPlan(inc: Incident) {
    const plan: { action: ResponseAction; target: string; label: string; done: boolean }[] = [];
    for (const h of inc.hosts) if (h !== "dc-lab-01") plan.push({ action: "isolate_host", target: h, label: `Isolate ${h}`, done: this.world.isolated.has(h) });
    for (const ip of inc.ips) plan.push({ action: "block_ip", target: ip, label: `Block ${ip} at the edge`, done: this.world.blockedIps.has(ip) });
    for (const u of inc.users) plan.push({ action: "disable_account", target: u, label: `Disable ${u}`, done: this.world.disabled.has(u) });
    return plan;
  }

  get assets() { return ASSETS; }
  get scenarios() { return SCENARIOS; }
  get iocs() { return IOCS; }
  static historySeconds = HISTORY_SECONDS;
}
