// Minimal YAML reader covering the subset used by Sigma rules: block maps, block lists,
// lists of maps, quoted and plain scalars, flow lists and literal or folded blocks.
// Written in house so the rule playground has no third party parser in the trust path.

export type YamlValue = string | number | boolean | null | YamlValue[] | { [key: string]: YamlValue };

type Line = { indent: number; text: string; raw: string; no: number };

export class YamlError extends Error {
  constructor(message: string, public line: number) {
    super(`Line ${line}: ${message}`);
  }
}

function stripComment(text: string) {
  let quote: string | null = null;
  for (let i = 0; i < text.length; i += 1) {
    const c = text[i];
    if (quote) {
      if (c === quote) quote = null;
    } else if (c === "'" || c === '"') quote = c;
    else if (c === "#" && (i === 0 || /\s/.test(text[i - 1]))) return text.slice(0, i).trimEnd();
  }
  return text.trimEnd();
}

function scalar(raw: string, no: number): YamlValue {
  const v = raw.trim();
  if (v === "" || v === "~" || v === "null") return null;
  if (v === "true") return true;
  if (v === "false") return false;
  if (v.startsWith('"')) {
    if (!v.endsWith('"') || v.length < 2) throw new YamlError("Unterminated double quoted string", no);
    return v.slice(1, -1).replace(/\\(["\\nt])/g, (_, ch: string) => (ch === "n" ? "\n" : ch === "t" ? "\t" : ch));
  }
  if (v.startsWith("'")) {
    if (!v.endsWith("'") || v.length < 2) throw new YamlError("Unterminated single quoted string", no);
    return v.slice(1, -1).replace(/''/g, "'");
  }
  if (v.startsWith("[")) {
    if (!v.endsWith("]")) throw new YamlError("Unterminated flow list", no);
    const inner = v.slice(1, -1).trim();
    if (!inner) return [];
    const parts: string[] = [];
    let quote: string | null = null;
    let cur = "";
    for (const c of inner) {
      if (quote) { if (c === quote) quote = null; cur += c; continue; }
      if (c === "'" || c === '"') { quote = c; cur += c; continue; }
      if (c === ",") { parts.push(cur); cur = ""; continue; }
      cur += c;
    }
    parts.push(cur);
    return parts.map((p) => scalar(p, no));
  }
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  return v;
}

const KEY_RE = /^("[^"]*"|'[^']*'|[^'"\s\-#][^:]*?|-[^\s:][^:]*?)\s*:(?:\s+|$)(.*)$/;

export function parseYaml(source: string): YamlValue {
  const lines: Line[] = [];
  source.replace(/\t/g, "  ").split(/\r?\n/).forEach((raw, idx) => {
    const text = stripComment(raw);
    if (!text.trim() || text.trim() === "---") return;
    lines.push({ indent: text.length - text.trimStart().length, text: text.trim(), raw, no: idx + 1 });
  });
  let pos = 0;

  const block = (indent: number): YamlValue => {
    const line = lines[pos];
    if (!line || line.indent < indent) return null;
    return line.text === "-" || line.text.startsWith("- ") ? list(line.indent) : map(line.indent);
  };

  const blockScalar = (parentIndent: number, folded: boolean, startNo: number) => {
    // Block scalars keep raw lines, so read from the original source by line number.
    const rawLines = source.split(/\r?\n/);
    const collected: string[] = [];
    let i = startNo; // next raw line index (0 based equals startNo since startNo is 1 based)
    let baseIndent = -1;
    while (i < rawLines.length) {
      const raw = rawLines[i].replace(/\t/g, "  ");
      const ind = raw.length - raw.trimStart().length;
      if (raw.trim() && ind <= parentIndent) break;
      if (raw.trim() && baseIndent < 0) baseIndent = ind;
      collected.push(raw.trim() ? raw.slice(Math.max(0, baseIndent)) : "");
      i += 1;
    }
    while (pos < lines.length && lines[pos].no <= i) pos += 1;
    const text = collected.join("\n").replace(/\n+$/, "");
    return folded ? text.split("\n\n").map((para) => para.replace(/\n/g, " ")).join("\n") : text;
  };

  function map(indent: number): YamlValue {
    const out: Record<string, YamlValue> = {};
    while (pos < lines.length) {
      const line = lines[pos];
      if (line.indent < indent) break;
      if (line.indent > indent) throw new YamlError("Unexpected indentation", line.no);
      if (line.text === "-" || line.text.startsWith("- ")) break;
      const m = KEY_RE.exec(line.text);
      if (!m) throw new YamlError(`Expected "key: value" but found "${line.text}"`, line.no);
      const key = m[1].replace(/^(["'])(.*)\1$/, "$2");
      const rest = m[2].trim();
      pos += 1;
      if (rest === "|" || rest === "|-" || rest === ">" || rest === ">-") {
        out[key] = blockScalar(indent, rest.startsWith(">"), line.no);
      } else if (rest === "") {
        const next = lines[pos];
        if (next && next.indent > indent) out[key] = block(next.indent);
        else if (next && next.indent === indent && (next.text === "-" || next.text.startsWith("- "))) out[key] = list(indent);
        else out[key] = null;
      } else out[key] = scalar(rest, line.no);
    }
    return out;
  }

  function list(indent: number): YamlValue {
    const out: YamlValue[] = [];
    while (pos < lines.length) {
      const line = lines[pos];
      if (line.indent !== indent || !(line.text === "-" || line.text.startsWith("- "))) {
        if (line.indent > indent) throw new YamlError("Unexpected indentation inside list", line.no);
        break;
      }
      const content = line.text === "-" ? "" : line.text.slice(2).trim();
      if (!content) {
        pos += 1;
        const next = lines[pos];
        out.push(next && next.indent > indent ? block(next.indent) : null);
      } else if (KEY_RE.test(content) && !content.startsWith("'") && !content.startsWith('"')) {
        const childIndent = indent + (line.text.length - content.length);
        lines[pos] = { ...line, indent: childIndent, text: content };
        out.push(map(childIndent));
      } else {
        pos += 1;
        out.push(scalar(content, line.no));
      }
    }
    return out;
  }

  const result = block(lines[0]?.indent ?? 0);
  if (pos < lines.length) throw new YamlError("Could not parse remaining content", lines[pos].no);
  return result;
}
