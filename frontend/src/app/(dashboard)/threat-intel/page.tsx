"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Database, Fingerprint, Globe2, Radio, Search } from "lucide-react";
import { useEngine } from "@/lib/engine/use-engine";
import { INTEL_RULE } from "@/lib/engine/engine";
import { FEEDS, classifyIndicator, lookupIoc } from "@/lib/engine/intel";
import { Btn, Input, Loading, Page, PageHeader, Panel, SevBadge, Stat, fmtTime } from "@/components/console/kit";

export default function ThreatIntelPage() {
  const engine = useEngine();
  const [value, setValue] = useState("192.0.2.44");
  const [query, setQuery] = useState("192.0.2.44");
  const v = engine?.version ?? 0;
  const data = useMemo(() => {
    if (!engine) return null;
    const blob = (e: (typeof engine.events)[number]) => Object.values(e.fields).join(" ").toLowerCase();
    const sightings = new Map<string, { count: number; last: number; hosts: Set<string> }>();
    for (const ioc of engine.iocs) sightings.set(ioc.value, { count: 0, last: 0, hosts: new Set() });
    for (const e of engine.events) {
      if (e.logsource.service === "honeypot") continue;
      const text = blob(e);
      for (const ioc of engine.iocs) if (text.includes(ioc.value.toLowerCase())) { const s = sightings.get(ioc.value)!; s.count += 1; s.last = Math.max(s.last, e.ts); s.hosts.add(e.host); }
    }
    const lookupHits = query ? engine.events.filter((e) => e.logsource.service !== "honeypot" && blob(e).includes(query.toLowerCase())) : [];
    const honey = [...engine.honeypot.values()].sort((a, b) => b.attempts - a.attempts).slice(0, 8);
    return { sightings, lookupHits, honey, matches: engine.alerts.filter((a) => a.ruleId === INTEL_RULE.id).slice(-15).reverse() };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine, v, query]);
  if (!engine || !data) return <Loading />;
  const kind = classifyIndicator(query);
  const ioc = lookupIoc(query);
  const honeyHit = engine.honeypot.get(query);
  const st = engine.stats.get(INTEL_RULE.name)!;

  return (
    <Page>
      <PageHeader eyebrow="Enrichment" title="Threat Intelligence" description="Every IP, domain, URL and SHA 256 that appears in telemetry is checked against the indicator store as it is ingested, including addresses and URLs pulled out of command lines. Indicators here are synthetic and use the RFC 5737 documentation ranges and the reserved .example domain." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Indicators loaded" value={engine.iocs.length} hint={`${FEEDS.length} feeds`} icon={<Database className="h-4 w-4" />} />
        <Stat label="Matches in window" value={st.hits} hint={`${st.alerts} alerts after deduplication`} icon={<Fingerprint className="h-4 w-4" />} tone="rose" />
        <Stat label="Honeypot sources" value={engine.honeypot.size} hint="Addresses seen by the decoy" icon={<Radio className="h-4 w-4" />} tone="violet" />
        <Stat label="Indicators sighted" value={[...data.sightings.values()].filter((s) => s.count > 0).length} hint="At least one event in window" icon={<Globe2 className="h-4 w-4" />} tone="amber" />
      </div>

      <Panel title="Indicator lookup" subtitle="Checks the store, the honeypot and every event in the window" glow>
        <form onSubmit={(e) => { e.preventDefault(); setQuery(value.trim()); }} className="flex flex-wrap gap-2">
          <Input aria-label="Indicator" value={value} onChange={(e) => setValue(e.target.value)} placeholder="IP, domain, URL or SHA 256" className="max-w-xl font-mono" />
          <Btn type="submit" variant="primary"><Search />Look up</Btn>
          {["192.0.2.44", "update-cdn.example", "203.0.113.77", "198.51.100.66", "exfil-sync.example"].map((x) => <button key={x} type="button" onClick={() => { setValue(x); setQuery(x); }} className="rounded-md border bg-muted/40 px-2 font-mono text-[11px] hover:border-primary/40">{x}</button>)}
        </form>
        {query && (
          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            <div className={`rounded-xl border p-4 ${ioc ? "border-rose-500/40 bg-rose-500/10" : "bg-muted/30"}`}>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Verdict</p>
              <p className="mt-1 text-lg font-semibold">{ioc ? "Known malicious" : honeyHit ? "Seen attacking the honeypot" : "No intel on file"}</p>
              <p className="mt-1 text-xs text-muted-foreground">Type: {kind}</p>
              {ioc && <p className="mt-2 text-[13px]">{ioc.threat}<br /><span className="text-xs text-muted-foreground">{ioc.feed} · confidence {ioc.confidence} · first seen {ioc.firstSeen}</span></p>}
              {!ioc && data.lookupHits.length > 0 && <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">Not on any feed, but it appears in {data.lookupHits.length} events. Behaviour rules are what catch unknown infrastructure.</p>}
            </div>
            <div className="rounded-xl border p-4">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Sightings in telemetry</p>
              <p className="mt-1 font-mono text-2xl font-semibold">{data.lookupHits.length}</p>
              <p className="text-xs text-muted-foreground">{[...new Set(data.lookupHits.map((e) => e.host))].join(", ") || "No hosts"}</p>
              {data.lookupHits.length > 0 && <Link href={`/hunting?q=${encodeURIComponent(`"${query}"`)}`} className="mt-2 inline-block text-xs font-semibold text-primary hover:underline">Hunt these events</Link>}
            </div>
            <div className="rounded-xl border p-4">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Honeypot</p>
              {honeyHit ? <><p className="mt-1 font-mono text-2xl font-semibold">{honeyHit.attempts}</p><p className="text-xs text-muted-foreground">login attempts, {honeyHit.logins} successful, {honeyHit.commands.length} commands</p></> : <p className="mt-1 text-sm text-muted-foreground">Never seen by the decoy.</p>}
            </div>
          </div>
        )}
      </Panel>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Panel title="Indicator store" bodyClassName="p-0">
          <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-xs">
            <thead className="border-b bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground"><tr><th className="px-4 py-2">Indicator</th><th className="px-3 py-2">Threat</th><th className="px-3 py-2">Feed</th><th className="px-3 py-2 text-right">Conf.</th><th className="px-3 py-2 text-right">Sightings</th><th className="px-3 py-2">Last seen</th></tr></thead>
            <tbody>{engine.iocs.map((i) => { const s = data.sightings.get(i.value)!; return (
              <tr key={i.value} onClick={() => { setValue(i.value); setQuery(i.value); }} className="cursor-pointer border-b last:border-0 hover:bg-muted/40">
                <td className="max-w-[220px] px-4 py-2"><span className="mr-2 rounded bg-muted px-1 py-0.5 text-[9.5px] font-semibold uppercase">{i.type}</span><span className="break-all font-mono">{i.value.length > 28 ? i.value.slice(0, 28) + "…" : i.value}</span></td>
                <td className="px-3 py-2">{i.threat}</td><td className="px-3 py-2 text-muted-foreground">{i.feed}</td>
                <td className="px-3 py-2 text-right font-mono">{i.confidence}</td>
                <td className="px-3 py-2 text-right font-mono">{s.count > 0 ? <span className="font-semibold text-rose-600 dark:text-rose-300">{s.count}</span> : 0}</td>
                <td className="px-3 py-2 font-mono text-muted-foreground">{s.last ? fmtTime(s.last) : "never"}</td>
              </tr>
            ); })}</tbody>
          </table></div>
        </Panel>
        <div className="space-y-6">
          <Panel title="Feeds" bodyClassName="space-y-2">
            {FEEDS.map((f) => <div key={f.id} className="rounded-xl border p-3"><div className="flex items-center justify-between"><p className="text-[13px] font-semibold">{f.name}</p><span className="flex items-center gap-1.5 text-[10.5px] text-muted-foreground"><span className="live-dot" />{f.refresh}</span></div><p className="mt-0.5 text-[11.5px] text-muted-foreground">{f.description}</p></div>)}
          </Panel>
          <Panel title="Recent intel matches" bodyClassName="p-0">
            <ul className="divide-y">{data.matches.map((a) => <li key={a.id}><Link href={a.incidentId ? `/incidents/${a.incidentId}` : `/alerts?id=${a.id}`} className="block px-4 py-2.5 hover:bg-muted/40"><div className="flex items-center gap-2"><SevBadge level={a.level} /><span className="font-mono text-[11px] text-muted-foreground">{a.host} · {fmtTime(a.ts)}</span></div><p className="mt-1 truncate text-xs">{a.summary}</p></Link></li>)}</ul>
          </Panel>
        </div>
      </div>
    </Page>
  );
}
