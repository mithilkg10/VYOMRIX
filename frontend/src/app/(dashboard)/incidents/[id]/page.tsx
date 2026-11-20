"use client";

import Link from "next/link";
import { use, useMemo, useState } from "react";
import { ArrowLeft, Ban, CheckCircle2, FileDown, Lock, MessageSquarePlus, Play, Search, ShieldCheck, UserX } from "lucide-react";
import { ANALYST, act, useEngine } from "@/lib/engine/use-engine";
import type { Engine } from "@/lib/engine/engine";
import { TACTICS, attackUrl, techniqueName, techniqueTactic } from "@/lib/engine/attack";
import { lookupIoc } from "@/lib/engine/intel";
import type { Alert, Incident, SecEvent } from "@/lib/engine/types";
import { cn } from "@/lib/utils";
import { Btn, Empty, Loading, Page, Panel, RiskRing, SevBadge, StatusBadge, Tabs, dur, fmtDateTime, fmtTime } from "@/components/console/kit";
import { EventDetail, decodedCommand } from "@/components/console/event-detail";
import { sensorColor } from "@/components/console/charts";

type Node = { e: SecEvent; children: Node[]; flagged: boolean };

function processTree(engine: Engine, inc: Incident, alerts: Alert[]) {
  const flaggedIds = new Set(alerts.flatMap((a) => a.eventIds));
  const run = alerts.find((a) => a.run)?.run;
  const from = inc.firstActivity - 60_000;
  const to = inc.updatedAt + 60_000;
  const procs = engine.events.filter((e) => e.logsource.category === "process_creation" && e.logsource.product === "windows" && inc.hosts.includes(e.host) && e.ts >= from && e.ts <= to && (run ? e.run === run : flaggedIds.has(e.id)));
  const byGuid = new Map<string, Node>();
  for (const e of procs) byGuid.set(String(e.fields.ProcessGuid), { e, children: [], flagged: flaggedIds.has(e.id) });
  const roots: Node[] = [];
  for (const n of byGuid.values()) {
    const parent = byGuid.get(String(n.e.fields.ParentProcessGuid));
    if (parent) parent.children.push(n); else roots.push(n);
  }
  return roots;
}

function TreeNode({ node, depth, onOpen }: { node: Node; depth: number; onOpen: (e: SecEvent) => void }) {
  const exe = String(node.e.fields.Image).split("\\").pop();
  const parentExe = String(node.e.fields.ParentImage).split("\\").pop();
  const decoded = decodedCommand(String(node.e.fields.CommandLine));
  return (
    <li>
      <button type="button" onClick={() => onOpen(node.e)} className={cn("group flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-muted/60", node.flagged && "bg-rose-500/5")} style={{ paddingLeft: depth * 22 + 8 }}>
        {depth === 0 && <span className="mt-0.5 font-mono text-[10px] text-muted-foreground">{parentExe} ▸</span>}
        <span className={cn("mt-1 h-2 w-2 shrink-0 rounded-full", node.flagged ? "bg-rose-500 shadow-[0_0_8px_#f43f5e]" : "bg-slate-400")} />
        <span className="min-w-0">
          <span className="font-mono text-[12.5px] font-semibold">{exe}</span>
          <span className="ml-2 font-mono text-[10px] text-muted-foreground">pid {String(node.e.fields.ProcessId)} · {node.e.host} · {fmtTime(node.e.ts)}</span>
          <span className="block truncate font-mono text-[11px] text-muted-foreground group-hover:whitespace-normal group-hover:break-all">{String(node.e.fields.CommandLine)}</span>
          {decoded && <span className="mt-0.5 block font-mono text-[11px] text-amber-700 dark:text-amber-300">decoded: {decoded}</span>}
        </span>
      </button>
      {node.children.length > 0 && <ul className="border-l border-dashed" style={{ marginLeft: depth * 22 + 12 }}>{node.children.map((c) => <TreeNode key={c.e.id} node={c} depth={depth + 1} onOpen={onOpen} />)}</ul>}
    </li>
  );
}

export default function IncidentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const engine = useEngine();
  const [note, setNote] = useState("");
  const [tab, setTab] = useState<"timeline" | "tree" | "evidence">("timeline");
  const [selected, setSelected] = useState<SecEvent | null>(null);
  const v = engine?.version ?? 0;
  const inc = engine?.incidentById.get(id);
  const data = useMemo(() => {
    if (!engine || !inc) return null;
    const alerts = inc.alertIds.map((a) => engine.alertById.get(a)!).filter(Boolean);
    const timeline = [
      ...alerts.map((a) => ({ ts: a.ts, kind: "alert" as const, a })),
      ...inc.notes.map((n) => ({ ts: n.ts, kind: "note" as const, n })),
    ].sort((x, y) => x.ts - y.ts);
    const evidence = [...new Set(alerts.flatMap((a) => a.eventIds))].map((e) => engine.eventById.get(e)).filter((e): e is SecEvent => Boolean(e)).sort((a, b) => a.ts - b.ts);
    return { alerts, timeline, evidence, tree: processTree(engine, inc, alerts), plan: engine.containmentPlan(inc), run: engine.runs.find((r) => r.incidentId === inc.id) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine, v, inc]);

  if (!engine) return <Loading />;
  if (!inc || !data) return <Page><Empty title={`Incident ${id} was not found`}>It may belong to a lab session that was reset. <Link href="/incidents" className="text-primary underline">Back to incidents</Link></Empty></Page>;

  const setStatus = (status: Incident["status"]) => act({ kind: "incident_status", incident: inc.id, status, actor: ANALYST }, `${inc.id} marked ${status}`);
  const runPlaybook = () => {
    for (const p of data.plan) if (!p.done) act({ kind: "action", action: p.action, target: p.target, incident: inc.id, actor: ANALYST });
    if (inc.status !== "contained" && inc.status !== "resolved") act({ kind: "incident_status", incident: inc.id, status: "contained", actor: ANALYST });
    act({ kind: "note", incident: inc.id, text: `Containment playbook executed: ${data.plan.map((p) => p.label).join("; ")}.`, actor: ANALYST }, "Containment playbook executed");
  };
  const tacticIdx = (t: string) => TACTICS.findIndex((x) => x.id === t);
  const chain = [...inc.tactics].sort((a, b) => tacticIdx(a) - tacticIdx(b));
  const icon = { isolate_host: Lock, block_ip: Ban, disable_account: UserX } as const;

  return (
    <Page>
      <Link href="/incidents" className="inline-flex items-center gap-1.5 pt-2 text-xs font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5" />All incidents</Link>
      <section className="panel panel-glow p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
          <RiskRing value={inc.riskScore} size={76} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2"><span className="font-mono text-xs text-muted-foreground">{inc.id}</span><SevBadge level={inc.severity} /><StatusBadge status={inc.status} /><span className="text-xs text-muted-foreground">Assignee: {inc.assignee}</span></div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">{inc.title}</h1>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[["First activity", fmtDateTime(inc.firstActivity)], ["Time to detect", dur(inc.createdAt - inc.firstActivity)], ["Time to contain", inc.containedAt ? dur(inc.containedAt - inc.createdAt) : "Not yet"], ["Alerts / events", `${data.alerts.length} / ${data.evidence.length}`]].map(([k, val]) => (
                <div key={k} className="rounded-xl border bg-muted/30 px-3 py-2"><p className="text-[10px] uppercase tracking-wider text-muted-foreground">{k}</p><p className="mt-0.5 font-mono text-[13px] font-semibold">{val}</p></div>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 lg:w-56 lg:flex-col">
            {inc.status === "new" && <Btn variant="outline" onClick={() => { act({ kind: "assign", incident: inc.id, assignee: ANALYST, actor: ANALYST }); setStatus("investigating"); }}><Search />Start investigating</Btn>}
            {(inc.status === "new" || inc.status === "investigating") && <Btn variant="primary" onClick={runPlaybook}><Play />Run containment playbook</Btn>}
            {inc.status === "investigating" && <Btn variant="outline" onClick={() => setStatus("contained")}><ShieldCheck />Mark contained</Btn>}
            {inc.status === "contained" && <Btn variant="success" onClick={() => setStatus("resolved")}><CheckCircle2 />Resolve incident</Btn>}
            {inc.status === "resolved" && <Btn variant="outline" onClick={() => setStatus("investigating")}>Reopen</Btn>}
            <Link href={`/reports?incident=${inc.id}`} className="interactive inline-flex h-9 items-center justify-center gap-2 rounded-lg border bg-card px-3.5 text-sm font-medium hover:bg-muted"><FileDown className="h-4 w-4" />Incident report</Link>
          </div>
        </div>
        <div className="mt-6 overflow-x-auto">
          <ol className="flex min-w-max items-center gap-1">
            {chain.map((t, i) => (
              <li key={t} className="flex items-center gap-1">
                <div className="rounded-xl border bg-gradient-to-b from-cyan-500/10 to-violet-500/5 px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-primary">{TACTICS.find((x) => x.id === t)?.name ?? t}</p>
                  <p className="mt-0.5 max-w-[180px] truncate font-mono text-[10.5px] text-muted-foreground">{inc.techniques.filter((x) => techniqueTactic(x) === t).join(", ") || "via correlation"}</p>
                </div>
                {i < chain.length - 1 && <span className="text-muted-foreground">›</span>}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-6">
          <Panel title="Investigation" actions={<Tabs value={tab} onChange={setTab} tabs={[{ id: "timeline", label: "Timeline" }, { id: "tree", label: "Process tree" }, { id: "evidence", label: `Evidence ${data.evidence.length}` }]} />}>
            {tab === "timeline" && (
              <ol className="relative space-y-3 before:absolute before:inset-y-1 before:left-[7px] before:w-px before:bg-border">
                {data.timeline.map((item, i) => item.kind === "alert" ? (
                  <li key={i} className="relative pl-7">
                    <span className="absolute left-0 top-1.5 h-[15px] w-[15px] rounded-full border-2 border-card" style={{ background: { critical: "#f43f5e", high: "#f97316", medium: "#eab308", low: "#38bdf8", informational: "#94a3b8" }[item.a.level] }} />
                    <div className="rounded-xl border p-3">
                      <div className="flex flex-wrap items-center gap-2"><span className="font-mono text-[11px] text-muted-foreground">{fmtTime(item.ts)}</span><SevBadge level={item.a.level} /><span className="text-[13px] font-semibold">{item.a.ruleTitle}</span>{item.a.count > 1 && <span className="font-mono text-[10px] text-muted-foreground">x{item.a.count}</span>}<span className="ml-auto font-mono text-[10px] text-muted-foreground">{item.a.id}</span></div>
                      <p className="mt-1 break-words font-mono text-[11.5px] text-muted-foreground">{item.a.summary}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">{item.a.techniques.map((t) => <a key={t} href={attackUrl(t)} target="_blank" rel="noreferrer" className="rounded border border-violet-500/25 bg-violet-500/10 px-1.5 py-0.5 font-mono text-[10px] text-violet-700 hover:underline dark:text-violet-300">{t} {techniqueName(t)}</a>)}
                        <button type="button" className="ml-auto text-[11px] font-medium text-primary hover:underline" onClick={() => { const e = engine.eventById.get(item.a.eventIds[item.a.eventIds.length - 1]); if (e) setSelected(e); }}>View event</button></div>
                    </div>
                  </li>
                ) : (
                  <li key={i} className="relative pl-7">
                    <span className="absolute left-0.5 top-2 h-3 w-3 rounded-full border-2 border-card bg-primary" />
                    <div className={cn("rounded-xl border border-dashed px-3 py-2", item.n.kind === "action" && "border-emerald-500/40 bg-emerald-500/5")}>
                      <p className="text-[11px] text-muted-foreground"><span className="font-mono">{fmtTime(item.ts)}</span> · {item.n.author} · {item.n.kind}</p>
                      <p className="mt-0.5 text-[13px]">{item.n.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
            {tab === "tree" && (data.tree.length ? <ul className="space-y-1">{data.tree.map((n) => <TreeNode key={n.e.id} node={n} depth={0} onOpen={setSelected} />)}</ul> : <Empty title="No Windows process activity in this incident">Process trees are built from Sysmon process creation events. This incident is web, Linux or network based, so use the Evidence tab.</Empty>)}
            {tab === "evidence" && (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-xs">
                  <thead className="text-[10px] uppercase tracking-wider text-muted-foreground"><tr><th className="py-2 pr-3">Time</th><th className="py-2 pr-3">Sensor</th><th className="py-2 pr-3">Host</th><th className="py-2">Event</th></tr></thead>
                  <tbody>{data.evidence.map((e) => (
                    <tr key={e.id} onClick={() => setSelected(e)} className="cursor-pointer border-t hover:bg-muted/50"><td className="py-2 pr-3 font-mono">{fmtTime(e.ts)}</td><td className={cn("py-2 pr-3 font-medium", sensorColor(e.sensor))}>{e.sensor}</td><td className="py-2 pr-3 font-mono">{e.host}</td><td className="max-w-[520px] truncate py-2 font-mono">{e.message}</td></tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Containment" subtitle="Each action changes what the lab can do next">
            <div className="space-y-2">
              {data.plan.length === 0 && <p className="text-xs text-muted-foreground">No containable entities on this incident.</p>}
              {data.plan.map((p) => { const Icon = icon[p.action as keyof typeof icon] ?? ShieldCheck; return (
                <Btn key={p.action + p.target} size="sm" variant={p.done ? "success" : "outline"} disabled={p.done} className="w-full justify-start" onClick={() => act({ kind: "action", action: p.action, target: p.target, incident: inc.id, actor: ANALYST }, `${p.label} done`)}><Icon />{p.done ? `${p.label} (done)` : p.label}</Btn>
              ); })}
              {data.plan.some((p) => p.done && p.action === "isolate_host") && <p className="pt-1 text-[11px] text-muted-foreground">Release isolated hosts from the Assets page once they are clean.</p>}
            </div>
          </Panel>
          <Panel title="Entities">
            <div className="space-y-3 text-xs">
              <div><p className="mb-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">Hosts</p>{inc.hosts.map((h) => <Link key={h} href={`/assets?host=${h}`} className="mb-1 flex items-center justify-between rounded-lg border px-2.5 py-1.5 hover:bg-muted/50"><span className="font-mono">{h}</span><StatusBadge status={engine.hostState(h)} /></Link>)}</div>
              {inc.users.length > 0 && <div><p className="mb-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">Accounts</p>{inc.users.map((u) => <div key={u} className="mb-1 flex items-center justify-between rounded-lg border px-2.5 py-1.5"><span className="font-mono">{u}</span>{engine.world.disabled.has(u) && <StatusBadge status="closed" label="disabled" />}</div>)}</div>}
              {inc.ips.length > 0 && <div><p className="mb-1.5 text-[10px] uppercase tracking-wider text-muted-foreground">External addresses</p>{inc.ips.map((ip) => { const ioc = lookupIoc(ip); return <div key={ip} className="mb-1 rounded-lg border px-2.5 py-1.5"><div className="flex items-center justify-between"><span className="font-mono">{ip}</span>{engine.world.blockedIps.has(ip) && <StatusBadge status="closed" label="blocked" />}</div>{ioc && <p className="mt-0.5 text-[11px] text-rose-600 dark:text-rose-300">{ioc.threat} ({ioc.feed})</p>}</div>; })}</div>}
              {data.run && <Link href="/lab" className="block rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-2 text-[11.5px]">Produced by Attack Lab run <span className="font-mono font-semibold">{data.run.id}</span> ({data.run.name})</Link>}
            </div>
          </Panel>
          <Panel title="Analyst notes">
            <form onSubmit={(e) => { e.preventDefault(); if (!note.trim()) return; act({ kind: "note", incident: inc.id, text: note.trim(), actor: ANALYST }, "Note added"); setNote(""); }} className="space-y-2">
              <label htmlFor="note" className="sr-only">Add a note</label>
              <textarea id="note" value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={500} placeholder="What did you find? Notes go into the timeline and the report." className="w-full resize-none rounded-lg border bg-card p-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
              <Btn type="submit" size="sm" variant="primary" disabled={!note.trim()}><MessageSquarePlus />Add note</Btn>
            </form>
          </Panel>
        </div>
      </div>
      <EventDetail event={selected} onClose={() => setSelected(null)} />
    </Page>
  );
}
