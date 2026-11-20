// Exports the Sigma rules from the TypeScript engine to detection_content/sigma and
// writes the parity fixtures the Python test suite checks against.
// Usage: npm run export:detection
import { mkdtempSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, "..", "..");
const src = resolve(here, "..", "src", "lib", "engine");
const out = mkdtempSync(join(tmpdir(), "vyomrix-engine-"));
for (const file of readdirSync(src).filter((f) => f.endsWith(".ts") && !f.startsWith("use-") && f !== "report-pdf.ts")) {
  const { outputText } = ts.transpileModule(readFileSync(join(src, file), "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } });
  writeFileSync(join(out, file.replace(/\.ts$/, ".js")), outputText);
}
const require = createRequire(import.meta.url);
const { RULE_SOURCES } = require(join(out, "rules.js"));
const { compileRule } = require(join(out, "sigma.js"));
const { Engine } = require(join(out, "engine.js"));

const ruleDir = join(repo, "detection_content", "sigma");
rmSync(ruleDir, { recursive: true, force: true });
mkdirSync(ruleDir, { recursive: true });
const rules = RULE_SOURCES.map((s) => compileRule(s));
for (const r of rules) writeFileSync(join(ruleDir, `${r.name}.yml`), r.yaml.trim() + "\n");

const NOW = 1_795_000_000;
const engine = new Engine({ startSec: NOW - 3600, nowSec: NOW, journal: [] });
for (const s of ["phish-ransom", "web-compromise", "ssh-exfil"]) engine.launch(s);
engine.advanceTo(NOW + 80);
const eventRules = rules.filter((r) => r.kind === "event");
const attack = engine.events.filter((e) => e.run);
const baseline = engine.events.filter((e) => !e.run).filter((_, i) => i % 7 === 0).slice(0, 400);
const fixtures = [...attack, ...baseline].map((ev) => ({
  event: { id: ev.id, ts: ev.ts, host: ev.host, user: ev.user ?? null, message: ev.message, logsource: ev.logsource, fields: ev.fields, run: ev.run ?? null },
  matches: eventRules.filter((r) => r.test(ev)).map((r) => r.name).sort(),
}));
writeFileSync(join(repo, "backend", "tests_detection", "sigma_parity.json"), JSON.stringify(fixtures));
rmSync(out, { recursive: true, force: true });
console.log(`Exported ${rules.length} rules and ${fixtures.length} parity fixtures.`);
