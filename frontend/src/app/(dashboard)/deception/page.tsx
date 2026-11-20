"use client";

import { useMemo, useState } from "react";
import { Ban, Crosshair, KeyRound, LogIn, Terminal, Users } from "lucide-react";
import { ANALYST, act, useEngine } from "@/lib/engine/use-engine";
import { lookupIoc } from "@/lib/engine/intel";
import { cn } from "@/lib/utils";
import { Btn, Loading, Page, PageHeader, Panel, Stat, ago, fmtNum, fmtTime } from "@/components/console/kit";

export default function DeceptionPage() {
  const engine = useEngine();
  const [sel, setSel] = useState<string | null>(null);
  const v = engine?.version ?? 0;
  const data = useMemo(() => {
    if (!engine) return null;
    const hp = engine.events.filter((e) => e.logsource.service === "honeypot");
    const users = new Map<string, number>();
    const pwds = new Map<string, number>();
    for (const e of hp) if (e.fields.Event === "login_failed") { users.set(String(e.fields.Username), (users.get(String(e.fields.Username)) ?? 0) + 1); pwds.set(String(e.fields.Password), (pwds.get(String(e.fields.Password)) ?? 0) + 1); }
    const top = (m: Map<string, number>) => [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
    const attackers = [...engine.honeypot.values()].sort((a, b) => b.last - a.last);
    const sessions = hp.filter((e) => e.fields.Event === "login_success" || e.fields.Event === "command").slice(-40);
    return { hp, users: top(users), pwds: top(pwds), attackers, sessions, logins: hp.filter((e) => e.fields.Event === "login_success").length, cmds: hp.filter((e) => e.fields.Event === "command").length };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [engine, v]);
  if (!engine || !data) return <Loading />;
  const selected = sel ? engine.honeypot.get(sel) : data.attackers.find((a) => a.commands.length) ?? data.attackers[0];
  const bar = (list: [string, number][], color: string) => { const max = Math.max(1, ...list.map(([, n]) => n)); return list.map(([k, n]) => <div key={k}><div className="flex justify-between text-[11.5px]"><span className="font-mono">{k}</span><span className="font-mono text-muted-foreground">{n}</span></div><div className="mt-1 h-1.5 rounded-full bg-muted"><div className={cn("h-full rounded-full", color)} style={{ width: `${(n / max) * 100}%` }} /></div></div>); };

  return (
    <Page>
      <PageHeader eyebrow="Deception" title="SSH Honeypot" description="honeypot-ssh-01 runs a Cowrie style decoy that accepts weak credentials and records everything the attacker types. Nothing legitimate should ever touch it, so every interaction is a signal. Alerts from the decoy are kept out of incidents on purpose, and payload downloads raise their own detection." />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Login attempts" value={fmtNum(data.hp.filter((e) => e.fields.Event === "login_failed").length)} hint="Last 90 minutes" icon={<KeyRound className="h-4 w-4" />} />
        <Stat label="Unique sources" value={data.attackers.length} hint={`${data.attackers.filter((a) => lookupIoc(a.ip)).length} already on an intel feed`} icon={<Users className="h-4 w-4" />} tone="violet" />
        <Stat label="Shell sessions" value={data.logins} hint="Weak password accepted by the decoy" icon={<LogIn className="h-4 w-4" />} tone="amber" />
        <Stat label="Commands captured" value={data.cmds} hint="Full keystroke log" icon={<Terminal className="h-4 w-4" />} tone="rose" />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
        <Panel title="Attacking sources" bodyClassName="p-0">
          <div className="overflow-x-auto"><table className="w-full min-w-[640px] text-left text-xs">
            <thead className="border-b bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground"><tr><th className="px-4 py-2">Source</th><th className="px-3 py-2 text-right">Attempts</th><th className="px-3 py-2 text-right">Logins</th><th className="px-3 py-2 text-right">Commands</th><th className="px-3 py-2">Last seen</th><th className="px-3 py-2">Intel</th><th className="px-3 py-2" /></tr></thead>
            <tbody>{data.attackers.map((a) => { const ioc = lookupIoc(a.ip); return (
              <tr key={a.ip} onClick={() => setSel(a.ip)} className={cn("cursor-pointer border-b last:border-0 hover:bg-muted/40", selected?.ip === a.ip && "bg-muted/60")}>
                <td className="px-4 py-2 font-mono font-medium">{a.ip}</td><td className="px-3 py-2 text-right font-mono">{a.attempts}</td><td className="px-3 py-2 text-right font-mono">{a.logins}</td><td className="px-3 py-2 text-right font-mono">{a.commands.length}</td>
                <td className="px-3 py-2 text-muted-foreground">{ago(a.last, engine.lastSec * 1000)}</td>
                <td className="px-3 py-2">{ioc ? <span className="rounded bg-rose-500/10 px-1.5 py-0.5 text-[10.5px] font-semibold text-rose-700 dark:text-rose-300">on feed</span> : <span className="text-muted-foreground">new</span>}</td>
                <td className="px-3 py-2 text-right" onClick={(e) => e.stopPropagation()}>{engine.world.blockedIps.has(a.ip) ? <span className="text-[11px] text-emerald-600 dark:text-emerald-300">blocked</span> : <Btn size="sm" variant="ghost" onClick={() => act({ kind: "action", action: "block_ip", target: a.ip, actor: ANALYST }, `${a.ip} blocked at the edge`)}><Ban />Block</Btn>}</td>
              </tr>
            ); })}</tbody>
          </table></div>
        </Panel>
        <Panel title={<span className="flex items-center gap-2"><Crosshair className="h-4 w-4 text-primary" />Session replay {selected ? <span className="font-mono text-xs text-muted-foreground">{selected.ip}</span> : null}</span>}>
          <div className="terminal min-h-[220px] p-4">
            {!selected || selected.commands.length === 0 ? <p className="text-slate-500">This source never got a shell. Pick one with commands.</p> : (
              <>
                <p className="text-slate-500">Connected from {selected.ip} as root, first seen {fmtTime(selected.first)}</p>
                {selected.commands.map((c, i) => <p key={i}><span className="text-emerald-300">root@honeypot-ssh-01:~# </span>{c}</p>)}
                <p><span className="text-emerald-300">root@honeypot-ssh-01:~# </span><span className="animate-pulse">▋</span></p>
              </>
            )}
          </div>
          {selected && <p className="mt-3 text-xs text-muted-foreground">Usernames tried: {[...selected.usernames].slice(0, 8).join(", ") || "none"}</p>}
        </Panel>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Panel title="Most tried usernames" bodyClassName="space-y-2.5">{bar(data.users, "bg-gradient-to-r from-violet-500 to-cyan-500")}</Panel>
        <Panel title="Most tried passwords" bodyClassName="space-y-2.5">{bar(data.pwds, "bg-gradient-to-r from-rose-500 to-orange-500")}</Panel>
      </div>
    </Page>
  );
}
