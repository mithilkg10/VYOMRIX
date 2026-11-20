"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ExternalLink, Grid3x3, ShieldQuestion, Target } from "lucide-react";
import { useEngine } from "@/lib/engine/use-engine";
import { INTEL_RULE } from "@/lib/engine/engine";
import { TACTICS, TECHNIQUES, attackUrl } from "@/lib/engine/attack";
import { cn } from "@/lib/utils";
import { Drawer, Loading, Page, PageHeader, SevBadge, Stat, Tabs, fmtTime } from "@/components/console/kit";

export default function MitrePage() {
  const engine = useEngine();
  const [view, setView] = useState<"activity" | "coverage">("activity");
  const [open, setOpen] = useState<string | null>(null);
  const v = engine?.version ?? 0;
  const data = useMemo(() => {
    if (!engine) return null;
    const rulesBy = new Map<string, string[]>();
    for (const r of engine.rules) for (const t of r.techniques) rulesBy.set(t, [...(rulesBy.get(t) ?? []), r.name ?? r.id]);
    for (const t of ["T1071.001", "T1105", "T1595.002", "T1110.001"]) rulesBy.set(t, [...(rulesBy.get(t) ?? []), INTEL_RULE.name]);
    const alertsBy = new Map<string, number>();
    for (const a of engine.alerts) if (a.verdict !== "false_positive") for (const t of a.techniques) alertsBy.set(t, (alertsBy.get(t) ?? 0) + a.count);
    return { rulesBy, alertsBy };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine, v]);
  if (!engine || !data) return <Loading />;
  const covered = TECHNIQUES.filter((t) => data.rulesBy.has(t.id)).length;
  const active = TECHNIQUES.filter((t) => (data.alertsBy.get(t.id) ?? 0) > 0).length;
  const tacticsCovered = TACTICS.filter((tc) => TECHNIQUES.some((t) => t.tactic === tc.id && data.rulesBy.has(t.id))).length;
  const maxA = Math.max(1, ...data.alertsBy.values());
  const tech = open ? TECHNIQUES.find((t) => t.id === open) : undefined;
  const techAlerts = open ? engine.alerts.filter((a) => a.techniques.includes(open)).slice(-10).reverse() : [];

  return (
    <Page>
      <PageHeader eyebrow="MITRE ATT&CK Enterprise" title="ATT&CK Coverage" description="Coverage is worked out from the technique tags of the rules that are actually loaded, not typed in by hand. Techniques without a rule are kept on the map on purpose, so the gaps are visible." actions={<Tabs value={view} onChange={setView} tabs={[{ id: "activity", label: "Live activity" }, { id: "coverage", label: "Rule coverage" }]} />} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Techniques with a detection" value={`${covered} / ${TECHNIQUES.length}`} hint={`${Math.round((covered / TECHNIQUES.length) * 100)}% of the techniques tracked`} icon={<Target className="h-4 w-4" />} />
        <Stat label="Tactics with coverage" value={`${tacticsCovered} / ${TACTICS.length}`} hint="Columns with at least one rule" icon={<Grid3x3 className="h-4 w-4" />} tone="violet" />
        <Stat label="Techniques seen in alerts" value={active} hint="Excluding false positives" icon={<ShieldQuestion className="h-4 w-4" />} tone="rose" />
      </div>
      <div className="flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground">
        {view === "activity" ? <><span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-rose-500" />Alerts, darker is more</span><span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded border border-cyan-500/50 bg-cyan-500/10" />Covered, quiet</span></> : <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-cyan-500/70" />Covered, darker means more rules</span>}
        <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded border border-dashed" />No rule yet</span>
      </div>
      <div className="panel overflow-x-auto p-4">
        <div className="grid min-w-[1400px] grid-cols-14 gap-2" style={{ gridTemplateColumns: `repeat(${TACTICS.length}, minmax(0, 1fr))` }}>
          {TACTICS.map((tc) => (
            <div key={tc.id} className="space-y-1.5">
              <div className="rounded-lg bg-muted/60 px-2 py-2 text-center"><p className="text-[11px] font-semibold leading-4">{tc.name}</p><p className="font-mono text-[9.5px] text-muted-foreground">{tc.short}</p></div>
              {TECHNIQUES.filter((t) => t.tactic === tc.id).map((t) => {
                const rules = data.rulesBy.get(t.id)?.length ?? 0;
                const alerts = data.alertsBy.get(t.id) ?? 0;
                const intensity = view === "activity" ? alerts / maxA : Math.min(1, rules / 3);
                const style = rules === 0 ? undefined : view === "activity" && alerts > 0 ? { background: `rgb(244 63 94 / ${0.15 + intensity * 0.75})` } : view === "coverage" ? { background: `rgb(6 182 212 / ${0.15 + intensity * 0.6})` } : undefined;
                return (
                  <button key={t.id} type="button" onClick={() => setOpen(t.id)} style={style} className={cn("interactive block w-full rounded-lg border px-2 py-1.5 text-left hover:ring-2 hover:ring-primary/40", rules === 0 ? "border-dashed text-muted-foreground" : view === "activity" && alerts === 0 ? "border-cyan-500/40 bg-cyan-500/5" : "border-transparent", view === "activity" && intensity > 0.55 && "text-white")}>
                    <p className="font-mono text-[9.5px] opacity-80">{t.id}</p>
                    <p className="text-[11px] font-medium leading-4">{t.name}</p>
                    {rules > 0 && <p className="mt-0.5 font-mono text-[9.5px] opacity-80">{rules} rule{rules > 1 ? "s" : ""}{alerts ? ` · ${alerts} hits` : ""}</p>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      {tech && (
        <Drawer open onClose={() => setOpen(null)} title={`${tech.id} ${tech.name}`} subtitle={TACTICS.find((t) => t.id === tech.tactic)?.name}>
          <a href={attackUrl(tech.id)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline">Read on attack.mitre.org<ExternalLink className="h-3.5 w-3.5" /></a>
          <p className="mb-2 mt-5 text-xs font-semibold">Detections</p>
          {(data.rulesBy.get(tech.id) ?? []).length === 0 ? <p className="rounded-xl border border-dashed p-3 text-xs text-muted-foreground">No rule covers this technique yet. Write one in the <Link className="text-primary underline" href="/detections?tab=playground">rule playground</Link>.</p> : (
            <ul className="space-y-1.5">{(data.rulesBy.get(tech.id) ?? []).map((n) => { const r = engine.ruleByName.get(n); return <li key={n}><Link href={r ? `/detections?rule=${n}` : "/threat-intel"} className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-[13px] hover:bg-muted/50"><span>{r?.title ?? INTEL_RULE.title}</span>{r && <SevBadge level={r.level} />}</Link></li>; })}</ul>
          )}
          <p className="mb-2 mt-5 text-xs font-semibold">Recent alerts</p>
          {techAlerts.length === 0 ? <p className="text-xs text-muted-foreground">None in the current window.</p> : (
            <ul className="divide-y rounded-xl border">{techAlerts.map((a) => <li key={a.id}><Link href={a.incidentId ? `/incidents/${a.incidentId}` : `/alerts?id=${a.id}`} className="flex items-center gap-3 px-3 py-2 hover:bg-muted/50"><SevBadge level={a.level} /><span className="truncate text-xs">{a.ruleTitle}</span><span className="ml-auto font-mono text-[10px] text-muted-foreground">{a.host} · {fmtTime(a.ts)}</span></Link></li>)}</ul>
          )}
        </Drawer>
      )}
    </Page>
  );
}
