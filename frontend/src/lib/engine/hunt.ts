// Hunting query language over the event store.
//   host:db-lab-01 EventID:4625            implicit AND
//   CommandLine:*comsvcs* OR Image:*vssadmin*
//   NOT sensor:nginx   or   -sensor:nginx
//   sc-status>=400  sc-bytes>4000
//   "Failed password"                       free text in the message
//   (query:*exfil* OR query:*tunnel*) host:db-lab-01

import { getField, compileRule, SigmaError } from "./sigma";
import type { SecEvent } from "./types";

type Pred = (e: SecEvent) => boolean;

export class HuntError extends Error {}

function wildcard(value: string) {
  const body = value.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, "[\\s\\S]*").replace(/\?/g, "[\\s\\S]");
  return new RegExp(`^${body}$`, "i");
}

function tokenize(q: string) {
  const tokens: string[] = [];
  let i = 0;
  while (i < q.length) {
    const c = q[i];
    if (/\s/.test(c)) { i += 1; continue; }
    if (c === "(" || c === ")") { tokens.push(c); i += 1; continue; }
    let tok = "";
    let quote = false;
    while (i < q.length && (quote || (!/\s/.test(q[i]) && q[i] !== "(" && q[i] !== ")"))) {
      if (q[i] === '"') quote = !quote;
      tok += q[i];
      i += 1;
    }
    if (quote) throw new HuntError("Unclosed quote in query");
    tokens.push(tok);
  }
  return tokens;
}

function term(tok: string): Pred {
  let negate = false;
  let t = tok;
  if (t.startsWith("-") && t.length > 1 && !/^-\d/.test(t)) { negate = true; t = t.slice(1); }
  let pred: Pred;
  const cmp = /^([A-Za-z][\w.-]*)(>=|<=|>|<)(-?\d+(?:\.\d+)?)$/.exec(t);
  const kv = /^([A-Za-z][\w.-]*):(.*)$/.exec(t);
  if (cmp) {
    const [, field, op, num] = cmp;
    const n = Number(num);
    pred = (e) => {
      const v = Number(getField(e, field));
      if (Number.isNaN(v)) return false;
      return op === ">" ? v > n : op === ">=" ? v >= n : op === "<" ? v < n : v <= n;
    };
  } else if (kv) {
    const [, field, rawValue] = kv;
    const value = rawValue.replace(/^"(.*)"$/, "$1");
    if (!value) throw new HuntError(`"${field}:" needs a value`);
    const re = value.includes("*") || value.includes("?") ? wildcard(value) : null;
    const lower = value.toLowerCase();
    pred = (e) => {
      const v = field.toLowerCase() === "sensor" ? e.sensor : getField(e, field);
      if (v === undefined) return false;
      return re ? re.test(String(v)) : String(v).toLowerCase() === lower;
    };
  } else {
    const text = t.replace(/^"(.*)"$/, "$1").toLowerCase();
    pred = (e) => e.message.toLowerCase().includes(text) || e.host.toLowerCase() === text;
  }
  return negate ? (e) => !pred(e) : pred;
}

export function compileHunt(query: string): Pred {
  const tokens = tokenize(query.trim());
  if (!tokens.length) return () => true;
  let i = 0;
  const upper = () => tokens[i]?.toUpperCase();
  const primary = (): Pred => {
    const t = tokens[i];
    if (t === undefined) throw new HuntError("Query ended unexpectedly");
    if (t === "(") {
      i += 1;
      const inner = orExpr();
      if (tokens[i] !== ")") throw new HuntError("Missing closing parenthesis");
      i += 1;
      return inner;
    }
    if (t === ")") throw new HuntError("Unexpected closing parenthesis");
    i += 1;
    return term(t);
  };
  const notExpr = (): Pred => {
    if (upper() === "NOT") { i += 1; const p = notExpr(); return (e) => !p(e); }
    return primary();
  };
  const andExpr = (): Pred => {
    let left = notExpr();
    while (i < tokens.length && tokens[i] !== ")" && upper() !== "OR") {
      if (upper() === "AND") i += 1;
      const l = left;
      const r = notExpr();
      left = (e) => l(e) && r(e);
    }
    return left;
  };
  function orExpr(): Pred {
    let left = andExpr();
    while (upper() === "OR") { i += 1; const l = left; const r = andExpr(); left = (e) => l(e) || r(e); }
    return left;
  }
  const p = orExpr();
  if (i < tokens.length) throw new HuntError(`Unexpected "${tokens[i]}"`);
  return p;
}

export const SAVED_HUNTS = [
  { name: "Encoded PowerShell anywhere", query: "Image:*powershell.exe CommandLine:*-enc*" },
  { name: "Failed logons, any platform", query: "EventID:4625 OR Event:failed_password OR Event:invalid_user" },
  { name: "Requests the WAF blocked", query: "sc-status:403" },
  { name: "Large responses to suspicious queries", query: "sensor:nginx sc-bytes>4000 (cs-uri-query:*union* OR cs-uri-query:*select*)" },
  { name: "DNS to reserved .example domains", query: "sensor:\"DNS resolver\" query:*.example -query:*cloudfront.net" },
  { name: "Shells spawned by web servers", query: "ParentImage:*php-fpm* OR ParentImage:*nginx*" },
  { name: "Connections to documentation ranges", query: "DestinationIp:192.0.2.* OR DestinationIp:203.0.113.*" },
  { name: "Honeypot commands", query: "sensor:Cowrie Event:command" },
];

export interface PlaygroundResult {
  ok: boolean;
  error?: string;
  kind?: "event" | "correlation";
  matches: SecEvent[];
  scanned: number;
  ms: number;
  title?: string;
}

/** Compiles a user supplied Sigma rule and runs it against the current event store. */
export function runPlayground(yaml: string, events: SecEvent[]): PlaygroundResult {
  const start = typeof performance !== "undefined" ? performance.now() : Date.now();
  try {
    const rule = compileRule(yaml);
    if (rule.kind === "correlation") return { ok: false, kind: "correlation", error: "Correlation rules reference other rules and run inside the live engine. Paste a single event rule to test it here.", matches: [], scanned: 0, ms: 0, title: rule.title };
    const matches = events.filter((e) => rule.test!(e));
    const end = typeof performance !== "undefined" ? performance.now() : Date.now();
    return { ok: true, kind: "event", matches, scanned: events.length, ms: end - start, title: rule.title };
  } catch (error) {
    return { ok: false, error: error instanceof SigmaError || error instanceof Error ? error.message : "The rule could not be compiled.", matches: [], scanned: 0, ms: 0 };
  }
}

export const PLAYGROUND_TEMPLATE = `title: Certutil Used to Download a File
id: 00000000-0000-4000-8000-000000000001
status: experimental
description: Write your own detection. This one looks for certutil downloads, then try the hunts in the Hunting page for ideas.
logsource:
  product: windows
  category: process_creation
detection:
  selection:
    Image|endswith: '\\certutil.exe'
    CommandLine|contains|all:
      - 'urlcache'
      - 'http'
  condition: selection
level: high
tags:
  - attack.command-and-control
  - attack.t1105
`;
