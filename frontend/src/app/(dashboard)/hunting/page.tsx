"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { Bookmark, Play, Search } from "lucide-react";
import { useEngine } from "@/lib/engine/use-engine";
import { compileHunt, HuntError, SAVED_HUNTS } from "@/lib/engine/hunt";
import type { SecEvent } from "@/lib/engine/types";
import { cn } from "@/lib/utils";
import { Btn, Empty, Loading, Page, PageHeader, Panel, Select, fmtNum, fmtTime } from "@/components/console/kit";
import { EventDetail } from "@/components/console/event-detail";
import { sensorColor, tooltipStyle } from "@/components/console/charts";

const FACETS = ["host", "sensor", "user", "EventID", "Image", "c-ip", "SourceIp", "query_domain", "rule_id"];

function Hunting() {
  const engine = useEngine();
  const params = useSearchParams();
  const router = useRouter();
  const committed = params.get("q") ?? "";
  const [draft, setDraft] = useState(committed);
  const [facet, setFacet] = useState("host");
  const [selected, setSelected] = useState<SecEvent | null>(null);
  const v = engine?.version ?? 0;
  const result = useMemo(() => {
    if (!engine) return null;
    const start = performance.now();
    try {
      const pred = compileHunt(committed);
      const matches = engine.events.filter(pred);
      return { ok: true as const, matches, ms: performance.now() - start };
    } catch (error) {
      return { ok: false as const, error: error instanceof HuntError ? error.message : "Query could not be parsed." };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine, v, committed]);
  const facets = useMemo(() => {
    if (!result?.ok) return [];
    const counts = new Map<string, number>();
    for (const e of result.matches) {
      const value = facet === "host" ? e.host : facet === "sensor" ? e.sensor : facet === "user" ? e.user : e.fields[facet];
      if (value === undefined || value === "") continue;
      counts.set(String(value), (counts.get(String(value)) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [result, facet]);
  const histogram = useMemo(() => {
    if (!engine || !result?.ok) return [];
    const last = Math.floor(engine.lastSec / 60);
    const buckets = new Map<number, number>();
    for (const e of result.matches) { const m = Math.floor(e.ts / 60_000); if (last - m < 90) buckets.set(m, (buckets.get(m) ?? 0) + 1); }
    return Array.from({ length: 90 }, (_, i) => { const m = last - 89 + i; return { t: new Date(m * 60_000).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }), n: buckets.get(m) ?? 0 }; });
  }, [engine, result]);

  if (!engine || !result) return <Loading />;
  const run = (q: string) => { setDraft(q); router.replace(q ? `/hunting?q=${encodeURIComponent(q)}` : "/hunting", { scroll: false }); };
  const max = Math.max(1, ...facets.map(([, n]) => n));

  return (
    <Page>
      <PageHeader eyebrow="Proactive search" title="Threat Hunting" description={<>Query every event the sensors produced in the window ({fmtNum(engine.events.length)} held in memory). Use <code className="font-mono text-foreground">field:value</code> with * wildcards, comparisons like <code className="font-mono text-foreground">sc-bytes&gt;4000</code>, quoted free text, AND, OR, NOT, a leading minus and parentheses.</>} />
      <form onSubmit={(e) => { e.preventDefault(); run(draft.trim()); }} className="panel panel-glow flex items-center gap-2 p-2">
        <Search className="ml-2 h-4 w-4 text-muted-foreground" />
        <label htmlFor="hunt" className="sr-only">Hunt query</label>
        <input id="hunt" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder='host:db-lab-01 (Image:*tar OR query:*.example)' className="h-10 flex-1 bg-transparent font-mono text-sm outline-none" spellCheck={false} />
        <Btn type="submit" variant="primary"><Play />Hunt</Btn>
      </form>
      <div className="grid gap-6 xl:grid-cols-[280px_1fr]">
        <div className="space-y-6">
          <Panel title={<span className="flex items-center gap-2"><Bookmark className="h-4 w-4 text-primary" />Saved hunts</span>} bodyClassName="p-2">
            {SAVED_HUNTS.map((h) => (
              <button key={h.name} type="button" onClick={() => run(h.query)} className={cn("block w-full rounded-lg px-3 py-2 text-left hover:bg-muted/60", committed === h.query && "bg-muted")}>
                <p className="text-[13px] font-medium">{h.name}</p>
                <p className="truncate font-mono text-[10.5px] text-muted-foreground">{h.query}</p>
              </button>
            ))}
          </Panel>
          {result.ok && (
            <Panel title="Top values" actions={<Select label="Field" value={facet} onChange={setFacet} options={FACETS.map((f) => ({ value: f, label: f }))} className="h-8 text-xs" />} bodyClassName="space-y-2">
              {facets.length === 0 ? <p className="text-xs text-muted-foreground">No values for this field in the results.</p> : facets.map(([value, n]) => (
                <button key={value} type="button" onClick={() => run(`${committed ? `${committed} ` : ""}${facet}:"${value}"`.trim())} className="block w-full text-left">
                  <div className="flex justify-between gap-2 text-[11.5px]"><span className="truncate font-mono">{value}</span><span className="font-mono text-muted-foreground">{n}</span></div>
                  <div className="mt-1 h-1 rounded-full bg-muted"><div className="h-full rounded-full bg-primary/70" style={{ width: `${(n / max) * 100}%` }} /></div>
                </button>
              ))}
            </Panel>
          )}
        </div>
        <div className="min-w-0 space-y-6">
          {!result.ok ? (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4"><p className="text-sm font-semibold text-rose-700 dark:text-rose-300">Query error</p><p className="mt-1 font-mono text-[12px]">{result.error}</p></div>
          ) : (
            <>
              <Panel title={`${fmtNum(result.matches.length)} matching events`} subtitle={`Searched ${fmtNum(engine.events.length)} events in ${result.ms.toFixed(1)} ms`}>
                <div className="h-24 text-muted-foreground">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={histogram} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                      <XAxis dataKey="t" tick={{ fill: "currentColor", fontSize: 9 }} tickLine={false} axisLine={false} interval={14} />
                      <Tooltip {...tooltipStyle} cursor={{ fill: "currentColor", opacity: 0.06 }} />
                      <Bar dataKey="n" name="Events" fill="#06b6d4" radius={[2, 2, 0, 0]} isAnimationActive={false} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Panel>
              <div className="panel overflow-x-auto">
                {result.matches.length === 0 ? <div className="p-6"><Empty title="No events match">Loosen a condition, or launch a scenario in the Attack Lab and hunt again.</Empty></div> : (
                  <table className="w-full min-w-[820px] text-left text-xs">
                    <thead className="border-b bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground"><tr><th className="px-4 py-2.5">Time</th><th className="px-3 py-2.5">Sensor</th><th className="px-3 py-2.5">Host</th><th className="px-3 py-2.5">Event</th></tr></thead>
                    <tbody>
                      {result.matches.slice(-400).reverse().map((e) => (
                        <tr key={e.id} onClick={() => setSelected(e)} className="cursor-pointer border-b last:border-0 hover:bg-muted/40">
                          <td className="whitespace-nowrap px-4 py-2 font-mono">{fmtTime(e.ts)}</td>
                          <td className={cn("whitespace-nowrap px-3 py-2 font-medium", sensorColor(e.sensor))}>{e.sensor}</td>
                          <td className="whitespace-nowrap px-3 py-2 font-mono">{e.host}</td>
                          <td className="max-w-[640px] truncate px-3 py-2 font-mono text-muted-foreground">{e.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {result.matches.length > 400 && <p className="border-t px-4 py-2 text-[11px] text-muted-foreground">Showing the newest 400. Narrow the query to see older events.</p>}
              </div>
            </>
          )}
        </div>
      </div>
      <EventDetail event={selected} onClose={() => setSelected(null)} />
    </Page>
  );
}

export default function HuntingPage() {
  return <Suspense fallback={<Loading />}><Hunting /></Suspense>;
}
