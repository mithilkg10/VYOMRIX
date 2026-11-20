"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, CircleDashed, Clock3, Crosshair, Flag, Loader2, Play, RotateCcw, ShieldCheck, ShieldOff, Target, Zap } from "lucide-react";
import { ANALYST, act, launchScenario, resetLab, useEngine } from "@/lib/engine/use-engine";
import type { Engine, ScenarioRun, StepState } from "@/lib/engine/engine";
import { techniqueName } from "@/lib/engine/attack";
import { cn } from "@/lib/utils";
import { Btn, Loading, Page, PageHeader, Panel, SevBadge, StatusBadge, dur, fmtTime } from "@/components/console/kit";
import { TERM_SENSOR } from "@/components/console/charts";

const STEP_ICON: Record<StepState, React.ReactNode> = {
  pending: <Clock3 className="h-4 w-4 text-muted-foreground" />,
  running: <Loader2 className="h-4 w-4 animate-spin text-cyan-500" />,
  executed: <Flag className="h-4 w-4 text-rose-500" />,
  prevented: <ShieldCheck className="h-4 w-4 text-emerald-500" />,
  skipped: <CircleDashed className="h-4 w-4 text-muted-foreground" />,
};

function ruleTitle(engine: Engine, name: string) {
  if (name === "intel_ioc_match") return "Threat intel match";
  return engine.ruleByName.get(name)?.title ?? name;
}

function RunView({ engine, run }: { engine: Engine; run: ScenarioRun }) {
  const now = engine.lastSec * 1000;
  const executed = run.steps.filter((s) => s.state === "executed" || s.state === "running");
  const detected = executed.filter((s) => s.detectedBy.length > 0);
  const done = run.steps.filter((s) => s.state !== "pending" && s.state !== "running").length;
  const incident = run.incidentId ? engine.incidentById.get(run.incidentId) : undefined;
  const def = engine.scenarios.find((s) => s.id === run.scenarioId);
  const isDone = (action: string, target: string) => action === "isolate_host" ? engine.world.isolated.has(target) : action === "block_ip" ? engine.world.blockedIps.has(target) : action === "disable_account" ? engine.world.disabled.has(target) : engine.world.wafMode[target] === "blocking";
  const responses = [
    ...(def?.responses ?? []).map((r) => { const target = r.target === "attacker" ? run.attacker : r.target; return { action: r.action, target, label: r.target === "attacker" ? `Block ${run.attacker} at the edge` : r.label, done: isDone(r.action, target) }; }),
    ...(incident ? engine.containmentPlan(incident) : []),
  ].filter((p, i, all) => all.findIndex((q) => q.action === p.action && q.target === p.target) === i);
  const events = engine.events.filter((e) => e.run === run.id).slice(-14);
  return (
    <Panel glow={run.status === "running"} title={<span className="flex flex-wrap items-center gap-2"><span className="font-mono text-xs text-muted-foreground">{run.id}</span>{run.name}<StatusBadge status={run.status} label={run.status === "completed" ? "attack completed" : run.status === "contained" ? "attack stopped" : "in progress"} /></span>}
      subtitle={`Attacker ${run.attacker} · started ${fmtTime(run.startSec * 1000)} · ${detected.length} of ${executed.length} executed steps detected`}
      actions={incident && <Link href={`/incidents/${incident.id}`} className="inline-flex h-8 items-center gap-2 rounded-lg border bg-card px-3 text-xs font-semibold hover:bg-muted"><SevBadge level={incident.severity} />{incident.id}</Link>}>
      <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-muted"><div className={cn("h-full rounded-full transition-all duration-700", run.status === "contained" ? "bg-emerald-500" : run.status === "completed" ? "bg-rose-500" : "bg-gradient-to-r from-cyan-500 to-violet-500")} style={{ width: `${(done / run.steps.length) * 100}%` }} /></div>
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <ol className="relative space-y-1">
          {run.steps.map((s, i) => {
            const isLast = i === run.steps.length - 1;
            const latency = s.detectedAt !== undefined ? s.detectedAt - s.dueTs : undefined;
            return (
              <li key={i} className="relative flex gap-3 pb-3">
                {!isLast && <span className="absolute left-[15px] top-8 h-[calc(100%-1.5rem)] w-px bg-border" />}
                <span className={cn("z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border bg-card", s.state === "running" && "border-cyan-500/50 shadow-[0_0_14px_rgb(var(--glow)/.5)]")}>{STEP_ICON[s.state]}</span>
                <div className="min-w-0 flex-1 rounded-xl border bg-muted/20 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[13px] font-semibold">{s.label}</p>
                    <a href={`https://attack.mitre.org/techniques/${s.technique.replace(".", "/")}/`} target="_blank" rel="noreferrer" className="rounded border border-violet-500/25 bg-violet-500/10 px-1.5 py-0.5 font-mono text-[10px] text-violet-700 hover:underline dark:text-violet-300" title={techniqueName(s.technique)}>{s.technique}</a>
                    <span className="font-mono text-[10px] text-muted-foreground">{s.host}</span>
                    <span className="ml-auto font-mono text-[10px] text-muted-foreground">{s.state === "pending" ? `in ${Math.max(0, Math.round((s.dueTs - now) / 1000))} s` : fmtTime(s.dueTs)}</span>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{s.detail}</p>
                  {(s.state === "executed" || s.state === "running") && (
                    s.detectedBy.length ? (
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300"><CheckCircle2 className="h-3.5 w-3.5" />Detected{latency !== undefined ? ` in ${dur(Math.max(0, latency))}` : ""} by</span>
                        {s.detectedBy.map((r) => <Link key={r} href={r === "intel_ioc_match" ? "/threat-intel" : `/detections?rule=${r}`} className="rounded-md border bg-card px-1.5 py-0.5 text-[10.5px] font-medium hover:border-primary/40">{ruleTitle(engine, r)}</Link>)}
                      </div>
                    ) : (
                      <p className="mt-2 text-[11px] font-semibold text-amber-700 dark:text-amber-300">{s.expect.length ? "Waiting for the pipeline" : "Not detected. This step looks like normal activity, which is a documented gap."}</p>
                    )
                  )}
                  {(s.state === "prevented" || s.state === "skipped") && s.reason && <p className={cn("mt-2 text-[11px] font-semibold", s.state === "prevented" ? "text-emerald-700 dark:text-emerald-300" : "text-muted-foreground")}>{s.reason}</p>}
                </div>
              </li>
            );
          })}
        </ol>
        <div className="space-y-4">
          <div className="rounded-xl border p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Respond</p>
            {run.status !== "running" ? (
              <p className="mt-2 text-sm">{run.status === "contained" ? "The chain was broken. Review the incident and close it out." : "The attack ran to completion. Open the incident to investigate and contain."}</p>
            ) : (
              <div className="mt-3 space-y-2">
                {responses.map((p) => (
                  <Btn key={p.action + p.target} size="sm" variant={p.done ? "success" : "danger"} disabled={p.done} className="w-full justify-start" onClick={() => act({ kind: "action", action: p.action, target: p.target, mode: p.action === "waf_mode" ? "blocking" : undefined, incident: incident?.id, actor: ANALYST }, `${p.label} done`)}>
                    {p.done ? <ShieldCheck /> : <ShieldOff />}{p.done ? `${p.label} (done)` : p.label}
                  </Btn>
                ))}
              </div>
            )}
            {def && run.status === "running" && <ul className="mt-3 space-y-1 border-t pt-3 text-[11px] leading-4 text-muted-foreground">{def.hints.map((h) => <li key={h}>· {h}</li>)}</ul>}
          </div>
          <div className="terminal max-h-[300px] overflow-hidden p-3">
            <p className="mb-2 text-[10px] uppercase tracking-wider text-slate-500">Telemetry produced by this run</p>
            {events.length === 0 && <p className="text-slate-500">Waiting for the first step…</p>}
            {events.map((e) => (
              <div key={e.id} className="row-in truncate"><span className="text-slate-500">{fmtTime(e.ts)} </span><span style={{ color: TERM_SENSOR[e.sensor] ?? "#cbd5e1" }}>{e.sensor.padEnd(10)} </span>{e.message}</div>
            ))}
          </div>
        </div>
      </div>
    </Panel>
  );
}

export default function LabPage() {
  const engine = useEngine();
  const [confirmReset, setConfirmReset] = useState(false);
  if (!engine) return <Loading />;
  const runs = [...engine.runs].reverse();
  const userRuns = runs.filter((r) => r.id !== "RUN-1" && r.id !== "RUN-2");
  const history = runs.filter((r) => r.id === "RUN-1" || r.id === "RUN-2");

  return (
    <Page>
      <PageHeader eyebrow="Adversary simulation" title="Attack Lab"
        description="Each scenario only writes raw telemetry: process starts, logons, web requests and DNS queries. Nothing tells the engine an attack is happening. What gets caught is decided by the same rules, WAF and intel matching shown everywhere else in the console."
        actions={confirmReset ? (
          <><span className="text-xs text-muted-foreground">Clear all your actions and start fresh?</span><Btn size="sm" variant="danger" onClick={resetLab}>Reset lab</Btn><Btn size="sm" onClick={() => setConfirmReset(false)}>Cancel</Btn></>
        ) : <Btn size="sm" onClick={() => setConfirmReset(true)}><RotateCcw />Reset lab</Btn>} />

      <div className="grid gap-5 lg:grid-cols-3">
        {engine.scenarios.map((s) => {
          const active = engine.runs.some((r) => r.scenarioId === s.id && r.status === "running");
          return (
            <article key={s.id} id={s.id} className="panel group relative flex flex-col overflow-hidden p-5 transition hover:border-primary/40">
              <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br from-cyan-500/20 to-violet-500/20 blur-2xl transition group-hover:scale-125" />
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-primary"><Target className="h-3.5 w-3.5" />{s.steps.length} steps · about {s.steps[s.steps.length - 1].at + (s.steps[s.steps.length - 1].span ?? 1)} s</div>
              <h2 className="mt-2 text-lg font-semibold tracking-tight">{s.name}</h2>
              <p className="mt-1 text-xs font-medium text-muted-foreground">{s.tagline}</p>
              <p className="mt-3 text-[13px] leading-6 text-muted-foreground">{s.narrative}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {s.steps.map((st) => <span key={st.label} title={`${st.label}: ${techniqueName(st.technique)}`} className="rounded border bg-muted/40 px-1.5 py-0.5 font-mono text-[10px]">{st.technique}</span>)}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-[11px]">
                <div className="rounded-lg border p-2"><p className="text-muted-foreground">Entry point</p><p className="font-mono font-medium">{s.entry}</p></div>
                <div className="rounded-lg border p-2"><p className="text-muted-foreground">Attacker</p><p className="font-mono font-medium">{s.attacker}</p></div>
              </div>
              <div className="mt-auto pt-5">
                <Btn variant="primary" className="w-full" disabled={active} onClick={() => { launchScenario(s.id); window.scrollTo({ top: 520, behavior: "smooth" }); }}>
                  {active ? <><Loader2 className="animate-spin" />Running</> : <><Play />Launch scenario</>}
                </Btn>
              </div>
            </article>
          );
        })}
      </div>

      {userRuns.length === 0 ? (
        <div className="panel flex flex-col items-center gap-3 px-6 py-12 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-2xl border bg-muted"><Zap className="h-5 w-5 text-primary" /></span>
          <p className="text-sm font-semibold">Pick a scenario to start</p>
          <p className="max-w-lg text-xs leading-5 text-muted-foreground">The timeline for your run appears here. Try letting one run to completion, then launch it again and contain it early using the Respond panel. The incident, alerts, audit log and reports all update from what you do.</p>
        </div>
      ) : userRuns.slice(0, 4).map((r) => <RunView key={r.id} engine={engine} run={r} />)}

      {history.length > 0 && (
        <Panel title={<span className="flex items-center gap-2"><Crosshair className="h-4 w-4 text-primary" />Earlier today</span>} subtitle="Scenarios that ran before your session started and were handled by the on shift analyst" bodyClassName="grid gap-3 md:grid-cols-2">
          {history.map((r) => (
            <div key={r.id} className="rounded-xl border p-4">
              <div className="flex items-center gap-2"><span className="font-mono text-xs text-muted-foreground">{r.id}</span><span className="text-sm font-semibold">{r.name}</span></div>
              <p className="mt-1 text-xs text-muted-foreground">Attacker {r.attacker} · {fmtTime(r.startSec * 1000)} · {r.steps.filter((s) => s.detectedBy.length).length} of {r.steps.length} steps detected</p>
              {r.incidentId && <Link href={`/incidents/${r.incidentId}`} className="mt-2 inline-block text-xs font-semibold text-primary hover:underline">Open {r.incidentId}</Link>}
            </div>
          ))}
        </Panel>
      )}
    </Page>
  );
}
