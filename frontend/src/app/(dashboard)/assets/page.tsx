"use client";

import Link from "next/link";
import { Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Globe, Lock, LockOpen, Monitor, Server, ShieldCheck } from "lucide-react";
import { ANALYST, act, useEngine } from "@/lib/engine/use-engine";
import { cn } from "@/lib/utils";
import { Btn, Drawer, Field, Loading, Page, PageHeader, RiskRing, SevBadge, Stat, StatusBadge, fmtNum, fmtTime } from "@/components/console/kit";

function Assets() {
  const engine = useEngine();
  const params = useSearchParams();
  const router = useRouter();
  const host = params.get("host");
  const v = engine?.version ?? 0;
  const rows = useMemo(() => {
    if (!engine) return [];
    const since = engine.lastSec * 1000 - 3_600_000;
    const counts = new Map<string, number>();
    for (const e of engine.events) if (e.ts >= since) counts.set(e.host, (counts.get(e.host) ?? 0) + 1);
    return engine.assets.map((a) => ({ a, risk: engine.hostRisk(a.hostname), state: engine.hostState(a.hostname), events: counts.get(a.hostname) ?? 0, open: engine.alerts.filter((x) => x.hosts.includes(a.hostname) && x.status !== "closed").length }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine, v]);
  if (!engine) return <Loading />;
  const sel = rows.find((r) => r.a.hostname === host);
  const toggle = (h: string) => engine.world.isolated.has(h) ? act({ kind: "action", action: "release_host", target: h, actor: ANALYST }, `${h} released from isolation`) : act({ kind: "action", action: "isolate_host", target: h, actor: ANALYST }, `${h} isolated`);

  return (
    <Page>
      <PageHeader eyebrow="Inventory" title="Assets" description="Eleven hosts across the user LAN, server VLAN, DMZ and the deception segment. Risk is the weighted sum of open alerts on the host in the last hour. Isolation cuts the host off from the network, which stops any attack step that needs it." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Monitored hosts" value={rows.length} hint={`${rows.filter((r) => r.a.offline).length} offline`} icon={<Server className="h-4 w-4" />} />
        <Stat label="At risk or compromised" value={rows.filter((r) => r.state === "At risk" || r.state === "Compromised").length} hint="Risk 20 or higher" icon={<ShieldCheck className="h-4 w-4" />} tone="rose" />
        <Stat label="Isolated" value={engine.world.isolated.size} hint="Network contained" icon={<Lock className="h-4 w-4" />} tone="violet" />
        <Stat label="Internet facing" value={rows.filter((r) => r.a.internetFacing).length} hint="DMZ and decoy" icon={<Globe className="h-4 w-4" />} tone="amber" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
        {rows.map(({ a, risk, state, events, open }) => (
          <article key={a.id} className={cn("panel interactive flex flex-col p-5 hover:border-primary/40", host === a.hostname && "ring-2 ring-primary/50")}>
            <div className="flex items-start gap-4">
              <RiskRing value={risk} size={56} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">{a.platform === "windows" ? <Monitor className="h-4 w-4 text-sky-500" /> : <Server className="h-4 w-4 text-emerald-500" />}<p className="truncate font-mono text-[15px] font-semibold">{a.hostname}</p></div>
                <p className="mt-0.5 text-xs text-muted-foreground">{a.role}</p>
                <div className="mt-2 flex flex-wrap gap-1.5"><StatusBadge status={state} /><span className="rounded-md border px-1.5 py-0.5 text-[10.5px]">{a.criticality}</span>{a.internetFacing && <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10.5px] text-amber-700 dark:text-amber-300">internet facing</span>}{a.waf && <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[10.5px] text-emerald-700 dark:text-emerald-300">WAF {engine.world.wafMode[a.hostname]}</span>}</div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg border p-2"><p className="text-[10px] text-muted-foreground">IP</p><p className="font-mono text-[11.5px]">{a.ip}</p></div>
              <div className="rounded-lg border p-2"><p className="text-[10px] text-muted-foreground">Events / h</p><p className="font-mono text-[11.5px]">{fmtNum(events)}</p></div>
              <div className="rounded-lg border p-2"><p className="text-[10px] text-muted-foreground">Open alerts</p><p className="font-mono text-[11.5px]">{open}</p></div>
            </div>
            <div className="mt-4 flex gap-2">
              <Btn size="sm" className="flex-1" onClick={() => router.replace(`/assets?host=${a.hostname}`, { scroll: false })}>Details</Btn>
              {!a.offline && a.hostname !== "wazuh-manager" && <Btn size="sm" variant={engine.world.isolated.has(a.hostname) ? "success" : "danger"} className="flex-1" onClick={() => toggle(a.hostname)}>{engine.world.isolated.has(a.hostname) ? <><LockOpen />Release</> : <><Lock />Isolate</>}</Btn>}
            </div>
          </article>
        ))}
      </div>
      {sel && (
        <Drawer open onClose={() => router.replace("/assets", { scroll: false })} title={sel.a.hostname} subtitle={sel.a.role}>
          <dl className="rounded-xl border px-3">
            <Field label="State"><StatusBadge status={sel.state} /></Field>
            <Field label="IP address">{sel.a.ip}</Field>
            <Field label="Operating system">{sel.a.os}</Field>
            <Field label="Network zone">{sel.a.zone}</Field>
            <Field label="Sensor">{sel.a.agent}</Field>
            <Field label="Owner">{sel.a.owner}</Field>
            <Field label="Criticality">{sel.a.criticality}</Field>
            <Field label="Risk score">{sel.risk} / 100</Field>
          </dl>
          <div className="mt-4 flex gap-2"><Link href={`/hunting?q=${encodeURIComponent(`host:${sel.a.hostname}`)}`} className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-muted">Hunt on this host</Link></div>
          <p className="mb-2 mt-5 text-xs font-semibold">Recent alerts</p>
          <ul className="divide-y rounded-xl border">
            {engine.alerts.filter((x) => x.hosts.includes(sel.a.hostname)).slice(-12).reverse().map((x) => <li key={x.id}><Link href={x.incidentId ? `/incidents/${x.incidentId}` : `/alerts?id=${x.id}`} className="flex items-center gap-3 px-3 py-2 hover:bg-muted/50"><SevBadge level={x.level} /><span className="truncate text-xs">{x.ruleTitle}</span><span className="ml-auto font-mono text-[10px] text-muted-foreground">{fmtTime(x.ts)}</span></Link></li>)}
          </ul>
        </Drawer>
      )}
    </Page>
  );
}

export default function AssetsPage() {
  return <Suspense fallback={<Loading />}><Assets /></Suspense>;
}
