"use client";

import { useMemo, useState } from "react";
import { Ban, Gauge, Play, Shield, ShieldCheck, ShieldOff, Trash2 } from "lucide-react";
import { ANALYST, act, useEngine } from "@/lib/engine/use-engine";
import { inspect, WAF_PRESETS, WAF_RULES, type WafRequest, type WafResult } from "@/lib/engine/waf";
import { cn } from "@/lib/utils";
import { Btn, Empty, Input, Loading, Page, PageHeader, Panel, Select, Stat, fmtNum, fmtTime } from "@/components/console/kit";

const PROTECTED = ["web-lab-01", "api-staging-01"];

export default function WafPage() {
  const engine = useEngine();
  const [req, setReq] = useState<WafRequest>(WAF_PRESETS[1].req);
  const [host, setHost] = useState("api-staging-01");
  const [result, setResult] = useState<WafResult | null>(() => inspect(WAF_PRESETS[1].req, 5, "detection"));
  const [newIp, setNewIp] = useState("");
  const v = engine?.version ?? 0;
  const stats = useMemo(() => {
    if (!engine) return null;
    const since = engine.lastSec * 1000 - 3_600_000;
    const web = engine.events.filter((e) => e.sensor === "nginx" && e.ts >= since);
    const waf = engine.events.filter((e) => e.logsource.service === "waf");
    const families = new Map<string, number>();
    const attackers = new Map<string, number>();
    for (const e of waf) { families.set(String(e.fields.family), (families.get(String(e.fields.family)) ?? 0) + 1); attackers.set(String(e.fields.src_ip), (attackers.get(String(e.fields.src_ip)) ?? 0) + 1); }
    return {
      requests: web.length,
      blocked: web.filter((e) => e.fields["waf-action"] === "block").length,
      edge: web.filter((e) => e.fields["waf-action"] === "edge-block").length,
      logged: web.filter((e) => e.fields["waf-action"] === "log").length,
      log: waf.slice(-40).reverse(),
      families: [...families.entries()].sort((a, b) => b[1] - a[1]),
      attackers: [...attackers.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine, v]);
  if (!engine || !stats) return <Loading />;
  const mode = engine.world.wafMode[host] ?? "blocking";
  const runTest = (r = req) => setResult(inspect(r, 5, mode));
  const maxFam = Math.max(1, ...stats.families.map(([, n]) => n));

  return (
    <Page>
      <PageHeader eyebrow="Edge protection" title="Web Application Firewall" description="Every request to the two DMZ web servers goes through this inspection before nginx logs it. Rules are modelled on the OWASP Core Rule Set at paranoia level 1: inputs are URL decoded up to three times, HTML entity decoded, stripped of SQL comments and lower cased, then each matching rule adds to an anomaly score. At 5 or more the request is blocked, or only logged in detection mode." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Requests, last hour" value={fmtNum(stats.requests)} hint="Both web servers" icon={<Gauge className="h-4 w-4" />} />
        <Stat label="Blocked by WAF" value={fmtNum(stats.blocked)} hint="Anomaly score of 5 or more" icon={<Shield className="h-4 w-4" />} tone="emerald" />
        <Stat label="Logged, not blocked" value={fmtNum(stats.logged)} hint="Hosts in detection mode" icon={<ShieldOff className="h-4 w-4" />} tone="amber" />
        <Stat label="Dropped at the edge" value={fmtNum(stats.edge)} hint={`${engine.world.blockedIps.size} addresses on the block list`} icon={<Ban className="h-4 w-4" />} tone="rose" />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {PROTECTED.map((h) => {
          const m = engine.world.wafMode[h] ?? "blocking";
          return (
            <div key={h} className={cn("panel flex flex-wrap items-center gap-4 p-5", m === "detection" && "border-amber-500/40")}>
              <span className={cn("grid h-11 w-11 place-items-center rounded-xl border", m === "blocking" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300" : "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-300")}>{m === "blocking" ? <ShieldCheck className="h-5 w-5" /> : <ShieldOff className="h-5 w-5" />}</span>
              <div className="min-w-0 flex-1"><p className="font-mono text-sm font-semibold">{h}</p><p className="text-xs text-muted-foreground">{m === "blocking" ? "Blocking mode. Attacks get HTTP 403." : "Detection only. Attacks are logged but reach the application."}</p></div>
              <Btn size="sm" variant={m === "blocking" ? "outline" : "primary"} onClick={() => act({ kind: "action", action: "waf_mode", target: h, mode: m === "blocking" ? "detection" : "blocking", actor: ANALYST }, `${h} WAF set to ${m === "blocking" ? "detection" : "blocking"} mode`)}>{m === "blocking" ? "Switch to detection only" : "Switch to blocking"}</Btn>
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
        <Panel title="Request tester" subtitle="Inspect any request with the live rule set. Nothing is sent anywhere." glow>
          <div className="mb-3 flex flex-wrap gap-1.5">{WAF_PRESETS.map((p) => <button key={p.label} type="button" onClick={() => { setReq(p.req); runTest(p.req); }} className="rounded-md border bg-muted/40 px-2 py-1 text-[11px] font-medium hover:border-primary/40">{p.label}</button>)}</div>
          <form onSubmit={(e) => { e.preventDefault(); runTest(); }} className="space-y-2">
            <div className="flex gap-2">
              <Select label="Method" value={req.method} onChange={(m) => setReq({ ...req, method: m })} options={["GET", "POST", "PUT"].map((m) => ({ value: m, label: m }))} className="w-24" />
              <Input aria-label="Request URI" value={req.uri} onChange={(e) => setReq({ ...req, uri: e.target.value })} className="font-mono text-[12.5px]" />
            </div>
            <Input aria-label="User agent" value={req.userAgent ?? ""} onChange={(e) => setReq({ ...req, userAgent: e.target.value })} placeholder="User agent" className="font-mono text-[12.5px]" />
            <textarea aria-label="Request body" value={req.body ?? ""} onChange={(e) => setReq({ ...req, body: e.target.value })} placeholder="Request body (optional)" rows={2} className="w-full rounded-lg border bg-card p-2.5 font-mono text-[12.5px] outline-none focus:border-primary" />
            <div className="flex flex-wrap items-center gap-2">
              <Select label="Host policy" value={host} onChange={(h) => { setHost(h); setResult(inspect(req, 5, engine.world.wafMode[h] ?? "blocking")); }} options={PROTECTED.map((h) => ({ value: h, label: `Policy of ${h}` }))} />
              <Btn type="submit" variant="primary"><Play />Inspect</Btn>
            </div>
          </form>
          {result && (
            <div className="mt-5 space-y-4">
              <div className={cn("flex items-center gap-4 rounded-xl border p-4", result.action === "block" ? "border-emerald-500/40 bg-emerald-500/10" : result.action === "log" ? "border-amber-500/40 bg-amber-500/10" : "border-border bg-muted/30")}>
                <div className="flex-1">
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Decision</p>
                  <p className="text-lg font-semibold">{result.action === "block" ? "Blocked, HTTP 403" : result.action === "log" ? "Logged only, request allowed" : "Allowed"}</p>
                </div>
                <div className="w-40">
                  <div className="flex justify-between text-[11px]"><span>Score {result.score}</span><span className="text-muted-foreground">threshold {result.threshold}</span></div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted"><div className={cn("h-full rounded-full", result.score >= result.threshold ? "bg-rose-500" : "bg-emerald-500")} style={{ width: `${Math.min(100, (result.score / 20) * 100)}%` }} /></div>
                </div>
              </div>
              {result.matches.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border">
                  <table className="w-full text-left text-xs"><thead className="bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground"><tr><th className="px-3 py-2">Rule</th><th className="px-3 py-2">Message</th><th className="px-3 py-2">Target</th><th className="px-3 py-2">Matched</th><th className="px-3 py-2 text-right">Score</th></tr></thead>
                    <tbody>{result.matches.map((m) => <tr key={m.id} className="border-t"><td className="px-3 py-2 font-mono font-semibold">{m.id}</td><td className="px-3 py-2">{m.msg}</td><td className="px-3 py-2 font-mono text-[11px]">{m.target}</td><td className="max-w-[160px] truncate px-3 py-2 font-mono text-[11px] text-rose-600 dark:text-rose-300">{m.matched}</td><td className="px-3 py-2 text-right font-mono">+{m.score}</td></tr>)}</tbody></table>
                </div>
              ) : <p className="text-xs text-muted-foreground">No rule matched.</p>}
              <div>
                <p className="mb-1.5 text-xs font-semibold">What the rules saw after normalisation</p>
                <div className="terminal space-y-0.5 p-3">{result.normalized.map((n, i) => <div key={i} className="break-all"><span className="text-cyan-300">{n.target.padEnd(17)}</span>{n.value}</div>)}</div>
              </div>
            </div>
          )}
        </Panel>

        <div className="space-y-6">
          <Panel title="Edge block list" subtitle="Dropped before the WAF and the web servers">
            <form onSubmit={(e) => { e.preventDefault(); const ip = newIp.trim(); if (!/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) return; act({ kind: "action", action: "block_ip", target: ip, actor: ANALYST }, `${ip} blocked`); setNewIp(""); }} className="mb-3 flex gap-2">
              <Input aria-label="Address to block" value={newIp} onChange={(e) => setNewIp(e.target.value)} placeholder="203.0.113.77" className="font-mono" />
              <Btn type="submit" variant="danger" disabled={!/^\d{1,3}(\.\d{1,3}){3}$/.test(newIp.trim())}><Ban />Block</Btn>
            </form>
            {engine.world.blockedIps.size === 0 ? <p className="text-xs text-muted-foreground">No addresses blocked.</p> : (
              <ul className="space-y-1.5">{[...engine.world.blockedIps].map((ip) => <li key={ip} className="flex items-center justify-between rounded-lg border px-3 py-1.5"><span className="font-mono text-[13px]">{ip}</span><Btn size="sm" variant="ghost" onClick={() => act({ kind: "action", action: "unblock_ip", target: ip, actor: ANALYST }, `${ip} removed from the block list`)}><Trash2 />Remove</Btn></li>)}</ul>
            )}
          </Panel>
          <Panel title="Rule families hit" subtitle={`${WAF_RULES.length} rules loaded`} bodyClassName="space-y-2.5">
            {stats.families.length === 0 ? <p className="text-xs text-muted-foreground">No WAF matches yet.</p> : stats.families.map(([f, n]) => (
              <div key={f}><div className="flex justify-between text-xs"><span>{f}</span><span className="font-mono text-muted-foreground">{n}</span></div><div className="mt-1 h-1.5 rounded-full bg-muted"><div className="h-full rounded-full bg-gradient-to-r from-orange-500 to-rose-500" style={{ width: `${(n / maxFam) * 100}%` }} /></div></div>
            ))}
          </Panel>
          <Panel title="Top sources" bodyClassName="space-y-1.5">
            {stats.attackers.map(([ip, n]) => <div key={ip} className="flex items-center justify-between rounded-lg border px-3 py-1.5 text-xs"><span className="font-mono">{ip}</span><span className="text-muted-foreground">{n} matches</span>{!engine.world.blockedIps.has(ip) ? <Btn size="sm" variant="ghost" onClick={() => act({ kind: "action", action: "block_ip", target: ip, actor: ANALYST }, `${ip} blocked`)}><Ban />Block</Btn> : <span className="text-[11px] text-emerald-600 dark:text-emerald-300">blocked</span>}</div>)}
          </Panel>
        </div>
      </div>

      <Panel title="WAF audit log" subtitle="Newest 40 rule matches" bodyClassName="p-0">
        {stats.log.length === 0 ? <div className="p-5"><Empty title="No matches yet" /></div> : (
          <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-xs">
            <thead className="border-b bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground"><tr><th className="px-4 py-2">Time</th><th className="px-3 py-2">Host</th><th className="px-3 py-2">Source</th><th className="px-3 py-2">Rule</th><th className="px-3 py-2">URI</th><th className="px-3 py-2">Action</th></tr></thead>
            <tbody>{stats.log.map((e) => <tr key={e.id} className="border-b last:border-0"><td className="px-4 py-2 font-mono">{fmtTime(e.ts)}</td><td className="px-3 py-2 font-mono">{e.host}</td><td className="px-3 py-2 font-mono">{String(e.fields.src_ip)}</td><td className="px-3 py-2"><span className="font-mono font-semibold">{String(e.fields.rule_id)}</span> {String(e.fields.rule_msg)}</td><td className="max-w-[260px] truncate px-3 py-2 font-mono text-muted-foreground">{String(e.fields.uri)}</td><td className="px-3 py-2"><span className={cn("rounded px-1.5 py-0.5 font-semibold", e.fields.action === "block" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-amber-500/10 text-amber-700 dark:text-amber-300")}>{e.fields.action === "block" ? "blocked" : "logged"}</span></td></tr>)}</tbody>
          </table></div>
        )}
      </Panel>
    </Page>
  );
}
