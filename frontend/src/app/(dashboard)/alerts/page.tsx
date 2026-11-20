"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, CheckCheck, Search, ThumbsDown, ThumbsUp } from "lucide-react";
import { ANALYST, act, useEngine } from "@/lib/engine/use-engine";
import type { Alert, SecEvent } from "@/lib/engine/types";
import { techniqueName } from "@/lib/engine/attack";
import { cn } from "@/lib/utils";
import { Btn, Drawer, Empty, Field, Input, Loading, Page, PageHeader, Select, SevBadge, StatusBadge, Tabs, fmtDateTime, fmtTime } from "@/components/console/kit";
import { EventDetail } from "@/components/console/event-detail";

const KIND_LABEL: Record<Alert["kind"], string> = { sigma: "Sigma", correlation: "Correlation", waf: "WAF", intel: "Intel" };

function AlertQueue() {
  const engine = useEngine();
  const params = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"new" | "acknowledged" | "closed" | "all">("new");
  const [level, setLevel] = useState("all");
  const [kind, setKind] = useState("all");
  const [q, setQ] = useState("");
  const [event, setEvent] = useState<SecEvent | null>(null);
  const v = engine?.version ?? 0;
  const openId = params.get("id");
  const rows = useMemo(() => {
    if (!engine) return [];
    return engine.alerts.filter((a) => (status === "all" || a.status === status) && (level === "all" || a.level === level) && (kind === "all" || a.kind === kind) && (!q || `${a.id} ${a.ruleTitle} ${a.host} ${a.ips.join(" ")} ${a.users.join(" ")}`.toLowerCase().includes(q.toLowerCase()))).slice().reverse().slice(0, 300);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine, v, status, level, kind, q]);
  if (!engine) return <Loading />;
  const selected = openId ? engine.alertById.get(openId) : undefined;
  const close = () => router.replace("/alerts", { scroll: false });
  const triage = (a: Alert, verdict: Alert["verdict"]) => act({ kind: "alert", alert: a.id, verdict, actor: ANALYST }, `${a.id} closed as ${verdict?.replace("_", " ")}`);
  const counts = (s: string) => engine.alerts.filter((a) => a.status === s).length;

  return (
    <Page>
      <PageHeader eyebrow="Triage" title="Alert Queue" description="Every alert links back to the exact rule and raw events that produced it. Repeats of the same rule on the same host within ten minutes are folded into one alert with a counter. Closing an alert as a false positive feeds that rule's precision score on the Detections page." />
      <div className="flex flex-wrap items-center gap-3">
        <Tabs value={status} onChange={setStatus} tabs={[{ id: "new", label: `New ${counts("new")}` }, { id: "acknowledged", label: `Acknowledged ${counts("acknowledged")}` }, { id: "closed", label: `Closed ${counts("closed")}` }, { id: "all", label: `All ${engine.alerts.length}` }]} />
        <Select label="Severity" value={level} onChange={setLevel} options={[{ value: "all", label: "Any severity" }, { value: "critical", label: "Critical" }, { value: "high", label: "High" }, { value: "medium", label: "Medium" }, { value: "low", label: "Low" }]} />
        <Select label="Source" value={kind} onChange={setKind} options={[{ value: "all", label: "Any source" }, { value: "sigma", label: "Sigma rule" }, { value: "correlation", label: "Correlation" }, { value: "waf", label: "WAF" }, { value: "intel", label: "Threat intel" }]} />
        <div className="relative ml-auto w-full max-w-xs"><Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rule, host, IP or user" aria-label="Filter alerts" className="pl-9" /></div>
      </div>
      <div className="panel overflow-x-auto">
        {rows.length === 0 ? <div className="p-6"><Empty title="Queue is empty for these filters">Switch to All, or launch a scenario in the Attack Lab.</Empty></div> : (
          <table className="w-full min-w-[960px] text-left text-[13px]">
            <thead className="border-b bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground"><tr><th className="px-4 py-2.5">Time</th><th className="px-3 py-2.5">Severity</th><th className="px-3 py-2.5">Detection</th><th className="px-3 py-2.5">Host</th><th className="px-3 py-2.5">Entities</th><th className="px-3 py-2.5">Count</th><th className="px-3 py-2.5">Status</th><th className="px-3 py-2.5">Incident</th></tr></thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id} onClick={() => router.replace(`/alerts?id=${a.id}`, { scroll: false })} className={cn("cursor-pointer border-b last:border-0 hover:bg-muted/40", a.status === "new" && (a.level === "critical" || a.level === "high") && "bg-rose-500/[.03]")}>
                  <td className="whitespace-nowrap px-4 py-2.5 font-mono text-xs">{fmtTime(a.ts)}</td>
                  <td className="px-3 py-2.5"><SevBadge level={a.level} /></td>
                  <td className="max-w-[340px] px-3 py-2.5"><p className="truncate font-medium">{a.ruleTitle}</p><p className="text-[11px] text-muted-foreground">{KIND_LABEL[a.kind]} · {a.techniques.slice(0, 2).join(", ")}</p></td>
                  <td className="px-3 py-2.5 font-mono text-xs">{a.host}</td>
                  <td className="max-w-[200px] truncate px-3 py-2.5 font-mono text-[11px] text-muted-foreground">{[...a.ips, ...a.users].join(" · ") || "none"}</td>
                  <td className="px-3 py-2.5 font-mono text-xs">{a.count}</td>
                  <td className="px-3 py-2.5"><StatusBadge status={a.status} label={a.verdict ? a.verdict.replace("_", " ") : a.status} /></td>
                  <td className="px-3 py-2.5">{a.incidentId ? <Link onClick={(e) => e.stopPropagation()} href={`/incidents/${a.incidentId}`} className="font-mono text-xs font-semibold text-primary hover:underline">{a.incidentId}</Link> : <span className="text-xs text-muted-foreground">none</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {selected && (
        <Drawer open onClose={close} title={selected.ruleTitle} subtitle={<span className="flex flex-wrap items-center gap-2"><SevBadge level={selected.level} /><StatusBadge status={selected.status} /><span className="font-mono">{selected.id}</span></span>} wide>
          <p className="rounded-xl border bg-muted/40 p-3 font-mono text-[12px] leading-5">{selected.summary}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {selected.status === "new" && <Btn size="sm" onClick={() => act({ kind: "alert", alert: selected.id, status: "acknowledged", actor: ANALYST }, "Acknowledged")}><Check />Acknowledge</Btn>}
            <Btn size="sm" variant="danger" onClick={() => triage(selected, "true_positive")}><ThumbsUp />True positive</Btn>
            <Btn size="sm" variant="success" onClick={() => triage(selected, "false_positive")}><ThumbsDown />False positive</Btn>
            <Btn size="sm" onClick={() => triage(selected, "benign")}><CheckCheck />Benign, expected</Btn>
          </div>
          <dl className="mt-4 rounded-xl border px-3">
            <Field label="Detection"><Link className="text-primary hover:underline" href={selected.kind === "intel" ? "/threat-intel" : `/detections?rule=${engine.rules.find((r) => r.id === selected.ruleId)?.name ?? ""}`}>{KIND_LABEL[selected.kind]} · {selected.ruleTitle}</Link></Field>
            <Field label="First event">{fmtDateTime(selected.firstEventTs)}</Field>
            <Field label="Alert raised">{fmtDateTime(selected.ts)}</Field>
            <Field label="Last seen">{fmtDateTime(selected.lastTs)}</Field>
            <Field label="Hosts">{selected.hosts.join(", ")}</Field>
            <Field label="Accounts">{selected.users.join(", ") || "none"}</Field>
            <Field label="External IPs">{selected.ips.join(", ") || "none"}</Field>
            <Field label="ATT&CK">{selected.techniques.map((t) => `${t} ${techniqueName(t)}`).join(", ") || "none"}</Field>
            <Field label="Incident">{selected.incidentId ? <Link className="text-primary hover:underline" href={`/incidents/${selected.incidentId}`}>{selected.incidentId}</Link> : "Not grouped (below the incident threshold or a decoy host)"}</Field>
          </dl>
          <p className="mb-2 mt-5 text-xs font-semibold">Contributing events ({selected.eventIds.length})</p>
          <ul className="divide-y rounded-xl border">
            {selected.eventIds.slice(-25).map((id) => engine.eventById.get(id)).filter((e): e is SecEvent => Boolean(e)).map((e) => (
              <li key={e.id}><button type="button" onClick={() => setEvent(e)} className="flex w-full gap-3 px-3 py-2 text-left hover:bg-muted/50"><span className="font-mono text-[11px] text-muted-foreground">{fmtTime(e.ts)}</span><span className="truncate font-mono text-[11.5px]">{e.message}</span></button></li>
            ))}
          </ul>
        </Drawer>
      )}
      <EventDetail event={event} onClose={() => setEvent(null)} />
    </Page>
  );
}

export default function AlertsPage() {
  return <Suspense fallback={<Loading />}><AlertQueue /></Suspense>;
}
