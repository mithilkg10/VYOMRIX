"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, ShieldAlert, ShieldCheck, Timer, TrendingUp } from "lucide-react";
import { useEngine } from "@/lib/engine/use-engine";
import { tacticName } from "@/lib/engine/attack";
import { SEVERITY_RANK } from "@/lib/engine/types";
import { Empty, Input, Loading, Page, PageHeader, RiskRing, Select, SevBadge, Stat, StatusBadge, Tabs, dur, fmtDateTime } from "@/components/console/kit";

export default function IncidentsPage() {
  const engine = useEngine();
  const [status, setStatus] = useState<"open" | "all" | "contained" | "resolved">("open");
  const [severity, setSeverity] = useState("all");
  const [q, setQ] = useState("");
  const v = engine?.version ?? 0;
  const list = useMemo(() => {
    if (!engine) return [];
    return [...engine.incidents]
      .filter((i) => status === "all" ? true : status === "open" ? i.status === "new" || i.status === "investigating" : i.status === status)
      .filter((i) => severity === "all" || i.severity === severity)
      .filter((i) => !q || `${i.id} ${i.title} ${i.hosts.join(" ")} ${i.users.join(" ")} ${i.ips.join(" ")}`.toLowerCase().includes(q.toLowerCase()))
      .sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity] || b.updatedAt - a.updatedAt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine, v, status, severity, q]);
  if (!engine) return <Loading />;
  const all = engine.incidents;
  const ttc = all.filter((i) => i.containedAt).map((i) => i.containedAt! - i.createdAt);
  const counts = { open: all.filter((i) => i.status === "new" || i.status === "investigating").length, contained: all.filter((i) => i.status === "contained").length, resolved: all.filter((i) => i.status === "resolved").length };

  return (
    <Page>
      <PageHeader eyebrow="Investigate" title="Incidents" description="Alerts of medium severity and above are grouped into incidents when they share a host, user or external address within 30 minutes. High and critical alerts can open a new incident on their own." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Open" value={counts.open} hint="New or under investigation" icon={<ShieldAlert className="h-4 w-4" />} tone="rose" />
        <Stat label="Contained" value={counts.contained} hint="Threat stopped, clean up pending" icon={<ShieldCheck className="h-4 w-4" />} tone="sky" />
        <Stat label="Resolved" value={counts.resolved} hint="Closed with notes" icon={<ShieldCheck className="h-4 w-4" />} tone="emerald" />
        <Stat label="Mean time to contain" value={dur(ttc.length ? ttc.reduce((s, x) => s + x, 0) / ttc.length : NaN)} hint={`${ttc.length} contained so far`} icon={<Timer className="h-4 w-4" />} tone="violet" />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Tabs value={status} onChange={setStatus} tabs={[{ id: "open", label: `Open ${counts.open}` }, { id: "contained", label: `Contained ${counts.contained}` }, { id: "resolved", label: `Resolved ${counts.resolved}` }, { id: "all", label: `All ${all.length}` }]} />
        <Select label="Severity" value={severity} onChange={setSeverity} options={[{ value: "all", label: "Any severity" }, { value: "critical", label: "Critical" }, { value: "high", label: "High" }, { value: "medium", label: "Medium" }]} />
        <div className="relative ml-auto w-full max-w-xs"><Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by id, host, user or IP" aria-label="Filter incidents" className="pl-9" /></div>
      </div>
      {list.length === 0 ? (
        <Empty title={status === "open" ? "No open incidents" : "Nothing matches these filters"} icon={<ShieldCheck className="h-6 w-6" />}>
          {status === "open" ? <>Everything is contained or resolved. Launch a scenario in the <Link className="text-primary underline" href="/lab">Attack Lab</Link> to create one.</> : "Try a different status or clear the search."}
        </Empty>
      ) : (
        <div className="grid gap-4">
          {list.map((i) => (
            <Link key={i.id} href={`/incidents/${i.id}`} className="panel interactive grid gap-4 p-5 hover:border-primary/40 md:grid-cols-[64px_1fr_auto]">
              <RiskRing value={i.riskScore} />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2"><span className="font-mono text-xs text-muted-foreground">{i.id}</span><SevBadge level={i.severity} /><StatusBadge status={i.status} /><span className="text-[11px] text-muted-foreground">Assignee: {i.assignee}</span></div>
                <h2 className="mt-1.5 text-base font-semibold tracking-tight">{i.title}</h2>
                <div className="mt-2 flex flex-wrap gap-1.5">{i.tactics.map((t) => <span key={t} className="rounded-md border bg-muted/50 px-1.5 py-0.5 text-[10.5px]">{tacticName(t)}</span>)}</div>
                <p className="mt-2 font-mono text-[11px] text-muted-foreground">{[...i.hosts, ...i.ips, ...i.users].join(" · ")}</p>
              </div>
              <div className="grid grid-cols-3 gap-4 text-right md:grid-cols-1 md:gap-1.5">
                <div><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Alerts</p><p className="font-mono text-sm font-semibold">{i.alertIds.length}</p></div>
                <div><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Opened</p><p className="font-mono text-xs">{fmtDateTime(i.createdAt)}</p></div>
                <div><p className="text-[10px] uppercase tracking-wider text-muted-foreground">Detect</p><p className="inline-flex items-center gap-1 font-mono text-xs"><TrendingUp className="h-3 w-3" />{dur(i.createdAt - i.firstActivity)}</p></div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </Page>
  );
}
