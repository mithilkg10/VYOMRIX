// Sigma rule compiler and evaluator.
// Supports the Sigma specification features used by real community rules: logsource
// matching, selections as maps or lists of maps, keyword lists, wildcards, the modifiers
// contains, startswith, endswith, all, re (with i, m, s), cidr, gt, gte, lt, lte, exists,
// windash, wide, base64 and base64offset, condition expressions with and, or, not,
// parentheses, "1 of", "all of" and "them", and Sigma v2 correlation rules
// (event_count, value_count, temporal and temporal_ordered).

import { bytesToBase64, parseDuration, utf16leBytes, utf8Bytes } from "./util";
import { parseYaml, type YamlValue } from "./yaml";
import type { FieldValue, LogSource, SecEvent, Severity } from "./types";

export class SigmaError extends Error {}

export type CorrelationType = "event_count" | "value_count" | "temporal" | "temporal_ordered";

export interface Correlation {
  type: CorrelationType;
  rules: string[];
  groupBy: string[];
  timespan: number;
  condition: { gte?: number; gt?: number; lte?: number; lt?: number; eq?: number; field?: string };
  generate: boolean;
}

export interface SigmaRule {
  id: string;
  name?: string;
  title: string;
  status: string;
  description: string;
  author: string;
  date: string;
  level: Severity;
  tags: string[];
  techniques: string[];
  tactics: string[];
  falsepositives: string[];
  logsource: LogSource;
  yaml: string;
  kind: "event" | "correlation";
  fields: string[];
  test?: (event: SecEvent) => boolean;
  correlation?: Correlation;
}

type Predicate = (event: SecEvent) => boolean;

const LEVELS: Severity[] = ["informational", "low", "medium", "high", "critical"];

export function getField(event: SecEvent, name: string): FieldValue | undefined {
  if (name in event.fields) return event.fields[name];
  const lower = name.toLowerCase();
  for (const key of Object.keys(event.fields)) if (key.toLowerCase() === lower) return event.fields[key];
  if (lower === "computer" || lower === "host" || lower === "hostname") return event.host;
  if (lower === "user") return event.user;
  if (lower === "message") return event.message;
  return undefined;
}

function wildcardToRegex(value: string) {
  let out = "";
  for (let i = 0; i < value.length; i += 1) {
    const c = value[i];
    if (c === "\\" && (value[i + 1] === "*" || value[i + 1] === "?" || value[i + 1] === "\\")) {
      out += "\\" + value[i + 1];
      i += 1;
    } else if (c === "*") out += "[\\s\\S]*";
    else if (c === "?") out += "[\\s\\S]";
    else out += c.replace(/[.+^${}()|[\]\\]/g, "\\$&");
  }
  return out;
}

function ipToInt(ip: string) {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => !Number.isInteger(p) || p < 0 || p > 255)) return null;
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

function base64OffsetVariants(bytes: number[]) {
  const starts = [0, 2, 3];
  const ends = [0, 3, 2];
  const out: string[] = [];
  for (let i = 0; i < 3; i += 1) {
    const encoded = bytesToBase64([...new Array(i).fill(32), ...bytes]);
    const end = ends[(bytes.length + i) % 3];
    out.push(encoded.slice(starts[i], end ? encoded.length - end : undefined));
  }
  return out;
}

const TRANSFORMS = new Set(["wide", "utf16le", "base64", "base64offset", "windash"]);
const MATCHERS = new Set(["contains", "startswith", "endswith", "re", "cidr", "gt", "gte", "lt", "lte", "exists"]);
const FLAGS = new Set(["all", "i", "m", "s", "cased"]);

function fieldPredicate(key: string, raw: YamlValue): Predicate {
  const [field, ...mods] = key.split("|");
  for (const mod of mods) if (!TRANSFORMS.has(mod) && !MATCHERS.has(mod) && !FLAGS.has(mod)) throw new SigmaError(`Unsupported modifier "${mod}" on field ${field}`);
  const list: YamlValue[] = Array.isArray(raw) ? raw : [raw];
  const matcher = mods.find((m) => MATCHERS.has(m));
  const all = mods.includes("all");
  const cased = mods.includes("cased");

  if (matcher === "exists") {
    const want = list[0] !== false;
    return (e) => (getField(e, field) !== undefined && getField(e, field) !== "") === want;
  }

  let values: (string | number | null)[] = list.map((v) => (v === null ? null : typeof v === "number" ? v : typeof v === "boolean" ? String(v) : typeof v === "string" ? v : (() => { throw new SigmaError(`Field ${field} has an unsupported value`); })()));

  for (const mod of mods) {
    if (mod === "windash") values = values.flatMap<string | number | null>((v) => (typeof v === "string" ? [v, v.replace(/(^|\s)-/g, "$1/"), v.replace(/(^|\s)-/g, "$1\u2013")] : [v]));
    if (mod === "base64" || mod === "base64offset") {
      const wide = mods.includes("wide") || mods.includes("utf16le");
      values = values.flatMap<string | number | null>((v) => {
        if (v === null) return [null];
        const bytes = wide ? utf16leBytes(String(v)) : utf8Bytes(String(v));
        return mod === "base64" ? [bytesToBase64(bytes)] : base64OffsetVariants(bytes);
      });
    }
  }

  const single = (v: string | number | null): ((actual: FieldValue | undefined) => boolean) => {
    if (v === null) return (a) => a === undefined || a === "";
    const s = String(v);
    switch (matcher) {
      case "re": {
        const flags = (mods.includes("i") ? "i" : "") + (mods.includes("m") ? "m" : "") + (mods.includes("s") ? "s" : "");
        let re: RegExp;
        try { re = new RegExp(s, flags); } catch { throw new SigmaError(`Invalid regular expression on field ${field}`); }
        return (a) => a !== undefined && re.test(String(a));
      }
      case "cidr": {
        const [net, bitsRaw] = s.split("/");
        const base = ipToInt(net);
        const bits = Number(bitsRaw ?? 32);
        if (base === null || !(bits >= 0 && bits <= 32)) throw new SigmaError(`Invalid CIDR "${s}" on field ${field}`);
        const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
        return (a) => { const ip = a === undefined ? null : ipToInt(String(a)); return ip !== null && (ip & mask) >>> 0 === (base & mask) >>> 0; };
      }
      case "gt": case "gte": case "lt": case "lte": {
        const n = Number(s);
        if (Number.isNaN(n)) throw new SigmaError(`Numeric modifier ${matcher} needs a number on field ${field}`);
        return (a) => {
          const x = Number(a);
          if (a === undefined || Number.isNaN(x)) return false;
          return matcher === "gt" ? x > n : matcher === "gte" ? x >= n : matcher === "lt" ? x < n : x <= n;
        };
      }
      default: {
        const body = wildcardToRegex(s);
        const pattern = matcher === "contains" ? body : matcher === "startswith" ? `^${body}` : matcher === "endswith" ? `${body}$` : `^${body}$`;
        const re = new RegExp(pattern, cased ? "" : "i");
        return (a) => a !== undefined && re.test(String(a));
      }
    }
  };

  const tests = values.map(single);
  return (e) => {
    const actual = getField(e, field);
    return all ? tests.every((t) => t(actual)) : tests.some((t) => t(actual));
  };
}

function selectionPredicate(name: string, value: YamlValue): Predicate {
  if (Array.isArray(value)) {
    if (value.every((v) => v !== null && typeof v === "object" && !Array.isArray(v))) {
      const alts = value.map((v, i) => selectionPredicate(`${name}[${i}]`, v));
      return (e) => alts.some((p) => p(e));
    }
    const keywords = value.map((v) => new RegExp(wildcardToRegex(String(v)), "i"));
    return (e) => keywords.some((re) => re.test(e.message));
  }
  if (value && typeof value === "object") {
    const preds = Object.entries(value).map(([k, v]) => fieldPredicate(k, v));
    return (e) => preds.every((p) => p(e));
  }
  throw new SigmaError(`Search identifier "${name}" must be a map or a list`);
}

function compileCondition(condition: string, selections: Map<string, Predicate>): Predicate {
  const tokens = condition.replace(/\(/g, " ( ").replace(/\)/g, " ) ").split(/\s+/).filter(Boolean);
  let i = 0;
  const peek = () => tokens[i]?.toLowerCase();
  const resolve = (pattern: string) => {
    if (pattern === "them") return [...selections.keys()].filter((k) => !k.startsWith("_"));
    const re = new RegExp(`^${wildcardToRegex(pattern)}$`);
    const names = [...selections.keys()].filter((k) => re.test(k));
    if (!names.length) throw new SigmaError(`Condition refers to "${pattern}" but no such search identifier exists`);
    return names;
  };
  const primary = (): Predicate => {
    const t = tokens[i];
    if (!t) throw new SigmaError("Condition ended unexpectedly");
    if (t === "(") {
      i += 1;
      const inner = orExpr();
      if (tokens[i] !== ")") throw new SigmaError("Missing closing parenthesis in condition");
      i += 1;
      return inner;
    }
    if ((t === "1" || t.toLowerCase() === "all" || t.toLowerCase() === "any") && tokens[i + 1]?.toLowerCase() === "of") {
      const quant = t.toLowerCase();
      const target = tokens[i + 2];
      if (!target) throw new SigmaError(`"${t} of" needs a target`);
      i += 3;
      const preds = resolve(target).map((n) => selections.get(n)!);
      return quant === "all" ? (e) => preds.every((p) => p(e)) : (e) => preds.some((p) => p(e));
    }
    i += 1;
    const names = resolve(t);
    if (names.length !== 1 || names[0] !== t) throw new SigmaError(`Unknown search identifier "${t}"`);
    return selections.get(t)!;
  };
  const notExpr = (): Predicate => {
    if (peek() === "not") { i += 1; const inner = notExpr(); return (e) => !inner(e); }
    return primary();
  };
  const andExpr = (): Predicate => {
    let left = notExpr();
    while (peek() === "and") { i += 1; const l = left; const r = notExpr(); left = (e) => l(e) && r(e); }
    return left;
  };
  function orExpr(): Predicate {
    let left = andExpr();
    while (peek() === "or") { i += 1; const l = left; const r = andExpr(); left = (e) => l(e) || r(e); }
    return left;
  }
  const result = orExpr();
  if (i < tokens.length) throw new SigmaError(`Unexpected "${tokens[i]}" in condition`);
  return result;
}

const str = (v: YamlValue | undefined) => (v === undefined || v === null ? "" : String(v));
const strList = (v: YamlValue | undefined) => (Array.isArray(v) ? v.map((x) => String(x)) : v === undefined || v === null ? [] : [String(v)]);

export function compileRule(yaml: string): SigmaRule {
  let doc: YamlValue;
  try { doc = parseYaml(yaml); } catch (error) { throw new SigmaError(error instanceof Error ? error.message : "Invalid YAML"); }
  if (!doc || typeof doc !== "object" || Array.isArray(doc)) throw new SigmaError("A Sigma rule must be a YAML map");
  const title = str(doc.title);
  if (!title) throw new SigmaError("Rule needs a title");
  const level = (str(doc.level) || "medium").toLowerCase() as Severity;
  if (!LEVELS.includes(level)) throw new SigmaError(`Level must be one of ${LEVELS.join(", ")}`);
  const tags = strList(doc.tags).map((t) => t.toLowerCase());
  const techniques = tags.filter((t) => /^attack\.t\d{4}/.test(t)).map((t) => t.slice(7).toUpperCase());
  const tactics = tags.filter((t) => /^attack\.[a-z]/.test(t) && !/^attack\.(t\d|g\d|s\d)/.test(t)).map((t) => t.slice(7).replace(/_/g, "-"));
  const base = {
    id: str(doc.id) || `rule-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    name: str(doc.name) || undefined,
    title,
    status: str(doc.status) || "experimental",
    description: str(doc.description),
    author: str(doc.author),
    date: str(doc.date),
    level,
    tags,
    techniques,
    tactics,
    falsepositives: strList(doc.falsepositives),
    yaml,
    fields: strList(doc.fields),
  };

  if (doc.correlation && typeof doc.correlation === "object" && !Array.isArray(doc.correlation)) {
    const c = doc.correlation;
    const type = str(c.type) as CorrelationType;
    if (!["event_count", "value_count", "temporal", "temporal_ordered"].includes(type)) throw new SigmaError("Correlation type must be event_count, value_count, temporal or temporal_ordered");
    const rules = strList(c.rules);
    if (!rules.length) throw new SigmaError("Correlation needs at least one referenced rule");
    const timespan = parseDuration(str(c.timespan) || undefined);
    if (!timespan) throw new SigmaError('Correlation timespan must look like "5m", "30s" or "1h"');
    const condRaw = c.condition && typeof c.condition === "object" && !Array.isArray(c.condition) ? c.condition : {};
    const condition: Correlation["condition"] = {};
    for (const k of ["gte", "gt", "lte", "lt", "eq"] as const) if (condRaw[k] !== undefined) condition[k] = Number(condRaw[k]);
    if (condRaw.field !== undefined) condition.field = str(condRaw.field);
    if ((type === "event_count" || type === "value_count") && Object.keys(condition).filter((k) => k !== "field").length === 0) throw new SigmaError("Count correlations need a condition such as gte: 10");
    if (type === "value_count" && !condition.field) throw new SigmaError("value_count needs condition.field");
    return { ...base, logsource: {}, kind: "correlation", correlation: { type, rules, groupBy: strList(c["group-by"]), timespan, condition, generate: c.generate === true } };
  }

  const ls = doc.logsource;
  if (!ls || typeof ls !== "object" || Array.isArray(ls)) throw new SigmaError("Rule needs a logsource map");
  const logsource: LogSource = {};
  for (const k of ["product", "category", "service"] as const) if (ls[k] !== undefined && ls[k] !== null) logsource[k] = str(ls[k]).toLowerCase();
  const det = doc.detection;
  if (!det || typeof det !== "object" || Array.isArray(det)) throw new SigmaError("Rule needs a detection map");
  const cond = det.condition;
  if (!cond) throw new SigmaError("Detection needs a condition");
  const selections = new Map<string, Predicate>();
  for (const [name, value] of Object.entries(det)) {
    if (name === "condition" || name === "timeframe") continue;
    selections.set(name, selectionPredicate(name, value));
  }
  if (!selections.size) throw new SigmaError("Detection needs at least one search identifier");
  const conditions = (Array.isArray(cond) ? cond : [cond]).map((c) => compileCondition(String(c), selections));
  const lsTest = (e: SecEvent) => (Object.keys(logsource) as (keyof LogSource)[]).every((k) => (e.logsource[k] ?? "").toLowerCase() === logsource[k]);
  return { ...base, logsource, kind: "event", test: (e) => lsTest(e) && conditions.some((p) => p(e)) };
}

export function groupKey(event: SecEvent, fields: string[]) {
  return fields.map((f) => String(getField(event, f) ?? "")).join("|");
}

export function countConditionMet(condition: Correlation["condition"], n: number) {
  if (condition.gte !== undefined && !(n >= condition.gte)) return false;
  if (condition.gt !== undefined && !(n > condition.gt)) return false;
  if (condition.lte !== undefined && !(n <= condition.lte)) return false;
  if (condition.lt !== undefined && !(n < condition.lt)) return false;
  if (condition.eq !== undefined && n !== condition.eq) return false;
  return true;
}
