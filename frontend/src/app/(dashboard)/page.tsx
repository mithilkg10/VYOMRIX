"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowRight, Ban, Crosshair, Gauge, ShieldAlert, Swords, Timer, Activity, Siren } from "lucide-react";
import { useEngine } from "@/lib/engine/use-engine";
import type { Engine } from "@/lib/engine/engine";
import { techniqueName } from "@/lib/engine/attack";
import { Loading, Page, Panel, RiskRing, SevBadge, Stat, StatusBadge, ago, dur, fmtNum, fmtTime } from "@/components/console/kit";
import { TERM_SENSOR, TelemetryChart } from "@/components/console/charts";

function ThreatRadar({ engine }: { engine: Engine }) {
  const assets = engine.assets;
  const cx = 150;
  const cy = 150;
  const color = (state: string) => (state === "Compromised" ? "#f43f5e" : state === "At risk" ? "#f59e0b" : state === "Isolated" ? "#8b5cf6" : state === "Offline" ? "#64748b" : "#10b981");
  return (
    <svg viewBox="0 0 300 300" className="h-full w-full" role="img" aria-label="Threat radar of lab assets">
      <defs>
        <radialGradient id="radarBg"><stop offset="0" stopColor="rgb(var(--glow))" stopOpacity=".10" /><stop offset="1" stopColor="rgb(var(--glow))" stopOpacity="0" /></radialGradient>
        <linearGradient id="sweepGrad" x1="0" x2="1"><stop offset="0" stopColor="rgb(var(--glow))" stopOpacity="0" /><stop offset="1" stopColor="rgb(var(--glow))" stopOpacity=".45" /></linearGradient>
      </defs>
      <circle cx={cx} cy={cy} r="140" fill="url(#radarBg)" />
      {[35, 70, 105, 140].map((r) => <circle key={r} cx={cx} cy={cy} r={r} fill="none" stroke="rgb(var(--glow))" strokeOpacity=".18" />)}
      <line x1="10" y1={cy} x2="290" y2={cy} stroke="rgb(var(--glow))" strokeOpacity=".12" />
      <line x1={cx} y1="10" x2={cx} y2="290" stroke="rgb(var(--glow))" strokeOpacity=".12" />
      <g className="radar-sweep" style={{ transformOrigin: "150px 150px" }}>
        <path d={`M${cx},${cy} L${cx + 140},${cy} A140,140 0 0,0 ${cx + 140 * Math.cos(-Math.PI / 5)},${cy + 140 * Math.sin(-Math.PI / 5)} Z`} fill="url(#sweepGrad)" />
      </g>
      {assets.map((a, i) => {
        const angle = (i / assets.length) * Math.PI * 2 - Math.PI / 2;
        const ring = a.criticality === "Critical" ? 50 : a.criticality === "High" ? 85 : a.criticality === "Medium" ? 115 : 132;
        const x = cx + ring * Math.cos(angle);
        const y = cy + ring * Math.sin(angle);
        const state = engine.hostState(a.hostname);
        const c = color(state);
        return (
          <Link key={a.id} href={`/assets?host=${a.hostname}`}>
            <g className="cursor-pointer">
              <title>{`${a.hostname} · ${state} · risk ${engine.hostRisk(a.hostname)}`}</title>
              {(state === "Compromised" || state === "At risk") && <circle cx={x} cy={y} r="11" fill={c} opacity=".18"><animate attributeName="r" values="6;14;6" dur="2s" repeatCount="indefinite" /></circle>}
              <circle cx={x} cy={y} r="5" fill={c} stroke="var(--card)" strokeWidth="2" />
              <text x={x} y={y + (y > cy ? 17 : -10)} textAnchor="middle" className="fill-muted-foreground font-mono text-[8px]">{a.hostname}</text>
            </g>
          </Link>
        );
      })}
    </svg>
  );
}

export default function OverviewPage() {
  const engine = useEngine();
  const v = engine?.version ?? 0;
  const m = useMemo(() => {
    if (!engine) return null;
    const now = engine.lastSec * 1000;
    const minute = Math.floor(engine.lastSec / 60);
    let lastHour = 0;
    let blocked = 0;
    const spark: number[] = [];
    for (let k = 59; k >= 0; k -= 1) { const b = engine.minutes.get(minute - k); lastHour += b?.events ?? 0; blocked += b?.blocked ?? 0; if (k % 3 === 0) spark.push(b?.events ?? 0); }
    const open = engine.incidents.filter((i) => i.status === "new" || i.status === "investigating");
    const newAlerts = engine.alerts.filter((a) => a.status === "new" && (a.level === "high" || a.level === "critical"));
    const ttd = engine.incidents.map((i) => i.createdAt - i.firstActivity).filter((x) => x >= 0);
    const ttc = engine.incidents.filter((i) => i.containedAt).map((i) => i.containedAt! - i.createdAt);
    const techCount = new Map<string, number>();
    for (const a of engine.alerts) if (now - a.ts < 3_600_000 * 2 && a.verdict !== "false_positive") for (const t of a.techniques) techCount.set(t, (techCount.get(t) ?? 0) + a.count);
    const topTech = [...techCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
    const risky = engine.assets.map((a) => ({ a, risk: engine.hostRisk(a.hostname), state: engine.hostState(a.hostname) })).sort((x, y) => y.risk - x.risk).slice(0, 5);
    return {
      lastHour, blocked, spark, open, newAlerts, topTech, risky,
      mttd: ttd.length ? ttd.reduce((s, x) => s + x, 0) / ttd.length : NaN,
      mttc: ttc.length ? ttc.reduce((s, x) => s + x, 0) / ttc.length : NaN,
      feed: engine.alerts.slice(-9).reverse(),
      stream: engine.events.slice(-16).reverse(),
      running: engine.runs.filter((r) => r.status === "running"),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine, v]);

  if (!engine || !m) return <Loading />;
  const maxTech = Math.max(1, ...m.topTech.map(([, c]) => c));

  return (
    <Page>
      <section className="panel panel-glow relative overflow-hidden">
        <div className="scanline pointer-events-none absolute inset-0 opacity-40" />
        <div className="relative grid gap-6 p-6 lg:grid-cols-[1fr_320px] lg:p-8">
          <div className="flex flex-col justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border bg-card/70 px-3 py-1 text-[11px] font-semibold text-muted-foreground"><span className="live-dot" />Live security operations · corp.local lab</div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
                Detect, investigate and contain,<br className="hidden sm:block" /> <span className="gradient-text">in real time.</span>
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                {fmtNum(engine.totalEvents)} events from {engine.assets.length} hosts and 9 sensors went through {engine.rules.length} Sigma rules, a CRS style WAF and the intel store in the last 90 minutes.
                Launch an attack and watch the pipeline catch it step by step, then contain it before it reaches the file server.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/lab" className="interactive inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-[0_10px_30px_-10px_rgb(var(--glow))] hover:brightness-110"><Swords className="h-4 w-4" />Launch an attack</Link>
              <Link href="/incidents" className="interactive inline-flex h-10 items-center gap-2 rounded-xl border bg-card px-4 text-sm font-semibold hover:bg-muted">Open incidents<ArrowRight className="h-4 w-4" /></Link>
              <Link href="/detections" className="interactive inline-flex h-10 items-center gap-2 rounded-xl border bg-card px-4 text-sm font-semibold hover:bg-muted">Read the rules</Link>
            </div>
            {m.running.length > 0 && (
              <Link href="/lab" className="flex items-center gap-3 rounded-xl border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm">
                <Siren className="h-4 w-4 animate-pulse text-cyan-600 dark:text-cyan-300" />
                <span className="font-medium">{m.running.map((r) => r.name).join(", ")} in progress</span>
                <span className="ml-auto text-xs text-muted-foreground">Watch it live</span>
              </Link>
            )}
          </div>
          <div className="mx-auto aspect-square w-full max-w-[320px]"><ThreatRadar engine={engine} /></div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <Stat label="Events, last hour" value={fmtNum(m.lastHour)} hint="All sensors" icon={<Activity className="h-4 w-4" />} spark={m.spark} />
        <Stat label="Open incidents" value={m.open.length} hint={`${engine.incidents.length} in total`} icon={<ShieldAlert className="h-4 w-4" />} tone="rose" />
        <Stat label="New high and critical" value={m.newAlerts.length} hint="Awaiting triage" icon={<Siren className="h-4 w-4" />} tone="amber" />
        <Stat label="Mean time to detect" value={dur(m.mttd)} hint="First malicious event to incident" icon={<Gauge className="h-4 w-4" />} tone="emerald" />
        <Stat label="Mean time to contain" value={dur(m.mttc)} hint="Incident to containment" icon={<Timer className="h-4 w-4" />} tone="violet" />
        <Stat label="Requests blocked" value={fmtNum(m.blocked)} hint="WAF and edge, last hour" icon={<Ban className="h-4 w-4" />} tone="sky" />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel className="xl:col-span-2" title="Telemetry and detections" subtitle="Events per minute with alerts stacked by severity, last 90 minutes">
          <TelemetryChart engine={engine} />
        </Panel>
        <Panel title="Live alert feed" subtitle="Newest first" actions={<Link href="/alerts" className="text-xs font-semibold text-primary hover:underline">Queue</Link>} bodyClassName="p-0">
          <ul className="divide-y">
            {m.feed.map((a) => (
              <li key={a.id} className="row-in">
                <Link href={a.incidentId ? `/incidents/${a.incidentId}` : `/alerts?id=${a.id}`} className="flex items-start gap-3 px-5 py-2.5 hover:bg-muted/50">
                  <SevBadge level={a.level} className="mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1"><p className="truncate text-[13px] font-medium">{a.ruleTitle}</p><p className="truncate font-mono text-[11px] text-muted-foreground">{a.host}{a.count > 1 ? ` · x${a.count}` : ""}</p></div>
                  <span className="shrink-0 font-mono text-[10px] text-muted-foreground">{ago(a.ts, engine.lastSec * 1000)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel title="Incidents" subtitle="Grouped by shared hosts, users and addresses" actions={<Link href="/incidents" className="text-xs font-semibold text-primary hover:underline">All incidents</Link>} bodyClassName="space-y-2.5">
          {engine.incidents.slice(-5).reverse().map((i) => (
            <Link key={i.id} href={`/incidents/${i.id}`} className="block rounded-xl border p-3 hover:border-primary/40 hover:bg-muted/40">
              <div className="flex items-center gap-2"><SevBadge level={i.severity} /><StatusBadge status={i.status} /><span className="ml-auto font-mono text-[10px] text-muted-foreground">{i.id}</span></div>
              <p className="mt-2 text-[13px] font-semibold leading-5">{i.title}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">{i.alertIds.length} alerts · {i.tactics.length} tactics · opened {fmtTime(i.createdAt)}</p>
            </Link>
          ))}
          {engine.incidents.length === 0 && <p className="text-xs text-muted-foreground">No incidents yet.</p>}
        </Panel>
        <Panel title="Top ATT&CK techniques" subtitle="Alert volume, last two hours" actions={<Link href="/mitre" className="text-xs font-semibold text-primary hover:underline">Coverage map</Link>} bodyClassName="space-y-3">
          {m.topTech.map(([t, c]) => (
            <div key={t}>
              <div className="flex items-center justify-between gap-3 text-xs"><span className="truncate"><span className="font-mono text-primary">{t}</span> {techniqueName(t)}</span><span className="font-mono text-muted-foreground">{c}</span></div>
              <div className="mt-1.5 h-1.5 rounded-full bg-muted"><div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-violet-500" style={{ width: `${(c / maxTech) * 100}%` }} /></div>
            </div>
          ))}
        </Panel>
        <Panel title="Hosts at risk" subtitle="Weighted alert score, last hour" actions={<Link href="/assets" className="text-xs font-semibold text-primary hover:underline">Assets</Link>} bodyClassName="space-y-1">
          {m.risky.map(({ a, risk, state }) => (
            <Link key={a.id} href={`/assets?host=${a.hostname}`} className="flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-muted/50">
              <RiskRing value={risk} size={42} />
              <div className="min-w-0 flex-1"><p className="truncate font-mono text-[13px] font-medium">{a.hostname}</p><p className="truncate text-[11px] text-muted-foreground">{a.role}</p></div>
              <StatusBadge status={state} />
            </Link>
          ))}
        </Panel>
      </div>

      <Panel title={<span className="flex items-center gap-2"><Crosshair className="h-4 w-4 text-primary" />Raw event stream</span>} subtitle="The last 16 events as the sensors emitted them" actions={<Link href="/hunting" className="text-xs font-semibold text-primary hover:underline">Hunt across all events</Link>} bodyClassName="p-0">
        <div className="terminal m-4 max-h-[340px] overflow-hidden p-3">
          {m.stream.map((e) => (
            <div key={e.id} className="row-in flex gap-3 truncate">
              <span className="text-slate-500">{fmtTime(e.ts)}</span>
              <span className="w-28 shrink-0 truncate" style={{ color: TERM_SENSOR[e.sensor] ?? "#cbd5e1" }}>{e.sensor}</span>
              <span className="w-32 shrink-0 truncate text-slate-400">{e.host}</span>
              <span className="truncate">{e.message}</span>
            </div>
          ))}
        </div>
      </Panel>
    </Page>
  );
}
