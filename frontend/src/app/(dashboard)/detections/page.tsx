"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BookOpen, FlaskConical, Layers, Play, Radar, Target, Wand2 } from "lucide-react";
import { useEngine } from "@/lib/engine/use-engine";
import { INTEL_RULE } from "@/lib/engine/engine";
import type { SigmaRule } from "@/lib/engine/sigma";
import { PLAYGROUND_TEMPLATE, runPlayground, type PlaygroundResult } from "@/lib/engine/hunt";
import { attackUrl, techniqueName } from "@/lib/engine/attack";
import type { SecEvent } from "@/lib/engine/types";
import { Btn, Drawer, Empty, Input, Loading, Page, PageHeader, Panel, Select, SevBadge, Stat, Tabs, ago, fmtTime } from "@/components/console/kit";
import { EventDetail } from "@/components/console/event-detail";
import { YamlView } from "@/components/console/yaml-view";

function Library({ onTry }: { onTry: (yaml: string) => void }) {
  const engine = useEngine()!;
  const params = useSearchParams();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [kind, setKind] = useState("all");
  const [event, setEvent] = useState<SecEvent | null>(null);
  const selectedName = params.get("rule");
  const rule = selectedName ? engine.ruleByName.get(selectedName) : undefined;
  const v = engine.version;
  const recent = useMemo(() => (rule?.kind === "event" ? engine.events.filter((e) => rule.test!(e)).slice(-12).reverse() : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rule, v]);
  const rules = engine.rules.filter((r) => (kind === "all" || r.kind === kind) && (!q || `${r.title} ${r.name} ${r.techniques.join(" ")} ${r.tags.join(" ")}`.toLowerCase().includes(q.toLowerCase())));
  const stat = (r: SigmaRule) => engine.stats.get(r.name ?? r.id)!;
  const precision = (r: SigmaRule) => { const s = stat(r); return s.tp + s.fp ? Math.round((s.tp / (s.tp + s.fp)) * 100) : null; };
  const logsource = (r: SigmaRule) => r.kind === "correlation" ? `${r.correlation!.type} over ${r.correlation!.rules.join(", ")}` : Object.values(r.logsource).join(" / ");
  const intel = engine.stats.get(INTEL_RULE.name)!;

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <Select label="Rule type" value={kind} onChange={setKind} options={[{ value: "all", label: "All rules" }, { value: "event", label: "Single event rules" }, { value: "correlation", label: "Correlation rules" }]} />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search title, technique or tag" aria-label="Search rules" className="max-w-xs" />
        <span className="ml-auto text-xs text-muted-foreground">Building block rules feed correlations and do not alert on their own.</span>
      </div>
      <div className="panel overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-[13px]">
          <thead className="border-b bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground"><tr><th className="px-4 py-2.5">Rule</th><th className="px-3 py-2.5">Level</th><th className="px-3 py-2.5">Source</th><th className="px-3 py-2.5">ATT&CK</th><th className="px-3 py-2.5 text-right">Matches</th><th className="px-3 py-2.5 text-right">Alerts</th><th className="px-3 py-2.5">Last fired</th><th className="px-3 py-2.5 text-right">Precision</th></tr></thead>
          <tbody>
            {rules.map((r) => { const s = stat(r); const p = precision(r); const building = s.alerts === 0 && engine.rules.some((c) => c.correlation?.rules.includes(r.name ?? "")) && r.kind === "event" && !engine.rules.find((c) => c.correlation?.rules.includes(r.name ?? ""))?.correlation?.generate; return (
              <tr key={r.id} onClick={() => router.replace(`/detections?rule=${r.name}`, { scroll: false })} className="cursor-pointer border-b last:border-0 hover:bg-muted/40">
                <td className="max-w-[320px] px-4 py-2.5"><p className="truncate font-medium">{r.title}</p><p className="font-mono text-[10.5px] text-muted-foreground">{r.name}{building ? " · building block" : ""}{r.kind === "correlation" ? " · correlation" : ""}</p></td>
                <td className="px-3 py-2.5"><SevBadge level={r.level} /></td>
                <td className="max-w-[200px] truncate px-3 py-2.5 font-mono text-[11px] text-muted-foreground">{logsource(r)}</td>
                <td className="px-3 py-2.5 font-mono text-[11px]">{r.techniques.slice(0, 2).join(", ")}</td>
                <td className="px-3 py-2.5 text-right font-mono text-xs">{s.hits}</td>
                <td className="px-3 py-2.5 text-right font-mono text-xs">{s.alerts}</td>
                <td className="px-3 py-2.5 text-xs text-muted-foreground">{s.lastFired ? ago(s.lastFired, engine.lastSec * 1000) : "No hits in window"}</td>
                <td className="px-3 py-2.5 text-right font-mono text-xs">{p === null ? <span className="text-muted-foreground">untriaged</span> : <span className={p >= 80 ? "text-emerald-600 dark:text-emerald-300" : "text-amber-600 dark:text-amber-300"}>{p}%</span>}</td>
              </tr>
            ); })}
            <tr className="border-t bg-muted/20">
              <td className="px-4 py-2.5"><p className="font-medium">{INTEL_RULE.title}</p><p className="font-mono text-[10.5px] text-muted-foreground">{INTEL_RULE.name} · built in</p></td>
              <td className="px-3 py-2.5 text-xs text-muted-foreground">by confidence</td><td className="px-3 py-2.5 font-mono text-[11px] text-muted-foreground">all sensors</td><td className="px-3 py-2.5 font-mono text-[11px]">varies</td>
              <td className="px-3 py-2.5 text-right font-mono text-xs">{intel.hits}</td><td className="px-3 py-2.5 text-right font-mono text-xs">{intel.alerts}</td><td className="px-3 py-2.5 text-xs text-muted-foreground">{intel.lastFired ? ago(intel.lastFired, engine.lastSec * 1000) : "No hits"}</td><td className="px-3 py-2.5 text-right font-mono text-xs text-muted-foreground">{intel.tp + intel.fp ? `${Math.round((intel.tp / (intel.tp + intel.fp)) * 100)}%` : "untriaged"}</td>
            </tr>
          </tbody>
        </table>
      </div>
      {rule && (
        <Drawer open onClose={() => router.replace("/detections", { scroll: false })} title={rule.title} subtitle={<span className="flex flex-wrap items-center gap-2"><SevBadge level={rule.level} /><span className="font-mono">{rule.id}</span><span>status {rule.status}</span></span>} wide>
          <p className="text-sm leading-6 text-muted-foreground">{rule.description}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">{rule.techniques.map((t) => <a key={t} href={attackUrl(t)} target="_blank" rel="noreferrer" className="rounded border border-violet-500/25 bg-violet-500/10 px-2 py-0.5 font-mono text-[11px] text-violet-700 hover:underline dark:text-violet-300">{t} {techniqueName(t)}</a>)}</div>
          <div className="mt-4 grid grid-cols-4 gap-2 text-center">
            {[["Matches", stat(rule).hits], ["Alerts", stat(rule).alerts], ["True pos.", stat(rule).tp], ["False pos.", stat(rule).fp]].map(([k, val]) => <div key={k} className="rounded-xl border p-2"><p className="text-[10px] uppercase tracking-wider text-muted-foreground">{k}</p><p className="font-mono text-lg font-semibold">{val}</p></div>)}
          </div>
          {rule.falsepositives.length > 0 && <p className="mt-3 text-xs text-muted-foreground"><span className="font-semibold text-foreground">Known false positives:</span> {rule.falsepositives.join("; ")}</p>}
          <div className="mt-4 flex items-center justify-between"><p className="text-xs font-semibold">Rule source, exactly as executed</p>{rule.kind === "event" && <Btn size="sm" onClick={() => { onTry(rule.yaml); router.replace("/detections?tab=playground", { scroll: false }); }}><Wand2 />Edit in playground</Btn>}</div>
          <div className="mt-2"><YamlView source={rule.yaml.trim()} /></div>
          {rule.kind === "event" && (
            <>
              <p className="mb-2 mt-5 text-xs font-semibold">Latest matching events</p>
              {recent.length === 0 ? <p className="text-xs text-muted-foreground">No matches in the current window. Launch the scenario that exercises this rule in the <Link className="text-primary underline" href="/lab">Attack Lab</Link>.</p> : (
                <ul className="divide-y rounded-xl border">{recent.map((e) => <li key={e.id}><button type="button" onClick={() => setEvent(e)} className="flex w-full gap-3 px-3 py-2 text-left hover:bg-muted/50"><span className="font-mono text-[11px] text-muted-foreground">{fmtTime(e.ts)}</span><span className="font-mono text-[11px]">{e.host}</span><span className="truncate font-mono text-[11px] text-muted-foreground">{e.message}</span></button></li>)}</ul>
              )}
            </>
          )}
        </Drawer>
      )}
      <EventDetail event={event} onClose={() => setEvent(null)} />
    </>
  );
}

function Playground({ yaml, setYaml }: { yaml: string; setYaml: (y: string) => void }) {
  const engine = useEngine()!;
  const [result, setResult] = useState<PlaygroundResult | null>(null);
  const [event, setEvent] = useState<SecEvent | null>(null);
  const run = () => setResult(runPlayground(yaml, engine.events));
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Panel title="Sigma rule" subtitle="Compiled by the same parser the live engine uses" actions={<Select label="Start from a rule" value="" onChange={(n) => { const r = engine.ruleByName.get(n); if (r) { setYaml(r.yaml.trim() + "\n"); setResult(null); } }} options={[{ value: "", label: "Load a rule…" }, ...engine.rules.filter((r) => r.kind === "event").map((r) => ({ value: r.name ?? r.id, label: r.title }))]} className="max-w-[220px] text-xs" />}>
        <label htmlFor="sigma" className="sr-only">Sigma rule YAML</label>
        <textarea id="sigma" value={yaml} onChange={(e) => setYaml(e.target.value)} spellCheck={false} rows={24} className="terminal w-full resize-y p-4 text-[12.5px] leading-[1.6] outline-none focus:ring-2 focus:ring-primary/40" />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Btn variant="primary" onClick={run}><Play />Run against {engine.events.length.toLocaleString("en-GB")} events</Btn>
          <Btn onClick={() => { setYaml(PLAYGROUND_TEMPLATE); setResult(null); }}>Reset template</Btn>
          <span className="text-[11px] text-muted-foreground">Modifiers: contains, startswith, endswith, all, re, cidr, gt, gte, lt, lte, exists, windash, wide, base64, base64offset</span>
        </div>
      </Panel>
      <Panel title="Results" subtitle={result?.ok ? `${result.matches.length} matches in ${result.scanned.toLocaleString("en-GB")} events · ${result.ms.toFixed(1)} ms` : "Run the rule to see matches"}>
        {!result && <Empty title="Nothing run yet" icon={<FlaskConical className="h-6 w-6" />}>Load a rule from the library, change a value and run it. Then launch a scenario and run it again to see the new matches.</Empty>}
        {result && !result.ok && <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4"><p className="text-sm font-semibold text-rose-700 dark:text-rose-300">The rule did not compile</p><p className="mt-1 font-mono text-[12px]">{result.error}</p></div>}
        {result?.ok && (result.matches.length === 0 ? <Empty title="Compiled, but no events match">The syntax is valid. Nothing in the current window satisfies the condition.</Empty> : (
          <ul className="max-h-[560px] divide-y overflow-y-auto rounded-xl border">
            {result.matches.slice(-200).reverse().map((e) => <li key={e.id}><button type="button" onClick={() => setEvent(e)} className="flex w-full gap-3 px-3 py-2 text-left hover:bg-muted/50"><span className="font-mono text-[11px] text-muted-foreground">{fmtTime(e.ts)}</span><span className="w-28 shrink-0 truncate font-mono text-[11px]">{e.host}</span><span className="truncate font-mono text-[11px] text-muted-foreground">{e.message}</span></button></li>)}
          </ul>
        ))}
      </Panel>
      <EventDetail event={event} onClose={() => setEvent(null)} />
    </div>
  );
}

function Detections() {
  const engine = useEngine();
  const params = useSearchParams();
  const router = useRouter();
  const [yaml, setYaml] = useState(PLAYGROUND_TEMPLATE);
  const tab = params.get("tab") === "playground" ? "playground" : "library";
  if (!engine) return <Loading />;
  const eventRules = engine.rules.filter((r) => r.kind === "event").length;
  const techniques = new Set(engine.rules.flatMap((r) => r.techniques));
  const alerts = [...engine.stats.values()].reduce((s, x) => s + x.alerts, 0);
  const triaged = [...engine.stats.values()].reduce((s, x) => ({ tp: s.tp + x.tp, fp: s.fp + x.fp }), { tp: 0, fp: 0 });
  return (
    <Page>
      <PageHeader eyebrow="Detection engineering" title="Detections" description="Rules are plain Sigma YAML. The in house compiler turns them into matchers at startup, and correlation rules follow the Sigma v2 format: event_count, value_count and temporal_ordered over named base rules." actions={<Link href="/mitre" className="inline-flex h-9 items-center gap-2 rounded-lg border bg-card px-3.5 text-sm font-medium hover:bg-muted"><Radar className="h-4 w-4" />Coverage map</Link>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Rules loaded" value={engine.rules.length} hint={`${eventRules} single event, ${engine.rules.length - eventRules} correlation`} icon={<BookOpen className="h-4 w-4" />} />
        <Stat label="Techniques covered" value={techniques.size} hint="Distinct ATT&CK technique tags" icon={<Target className="h-4 w-4" />} tone="violet" />
        <Stat label="Alerts in window" value={alerts} hint="From rules, before deduplication" icon={<Layers className="h-4 w-4" />} tone="amber" />
        <Stat label="Analyst precision" value={triaged.tp + triaged.fp ? `${Math.round((triaged.tp / (triaged.tp + triaged.fp)) * 100)}%` : "n/a"} hint={`${triaged.tp} true and ${triaged.fp} false positives triaged`} icon={<FlaskConical className="h-4 w-4" />} tone="emerald" />
      </div>
      <Tabs value={tab} onChange={(t) => router.replace(t === "playground" ? "/detections?tab=playground" : "/detections", { scroll: false })} tabs={[{ id: "library", label: "Rule library" }, { id: "playground", label: "Rule playground" }]} />
      {tab === "library" ? <Library onTry={setYaml} /> : <Playground yaml={yaml} setYaml={setYaml} />}
    </Page>
  );
}

export default function DetectionsPage() {
  return <Suspense fallback={<Loading />}><Detections /></Suspense>;
}
