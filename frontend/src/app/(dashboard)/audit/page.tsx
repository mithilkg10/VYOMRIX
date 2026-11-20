"use client";

import { useState } from "react";
import { Download, Link2, ShieldCheck, ShieldX } from "lucide-react";
import { useEngine } from "@/lib/engine/use-engine";
import { Btn, Empty, Loading, Page, PageHeader, Panel, Stat, fmtDateTime } from "@/components/console/kit";

export default function AuditPage() {
  const engine = useEngine();
  const [checked, setChecked] = useState<{ ok: boolean; brokenAt: number | null; at: number } | null>(null);
  if (!engine) return <Loading />;
  const entries = [...engine.audit].reverse();
  const download = () => {
    const blob = new Blob([JSON.stringify(engine.audit, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `vyomrix-audit-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <Page>
      <PageHeader eyebrow="Accountability" title="Audit Log" description="Every response action, status change and triage verdict is appended to a hash chain. Each entry stores the SHA 256 of the previous entry, so changing or removing any record breaks every hash after it. Verification recomputes the whole chain in the browser."
        actions={<><Btn onClick={download}><Download />Export JSON</Btn><Btn variant="primary" onClick={() => setChecked({ ...engine.verifyAudit(), at: Date.now() })}><ShieldCheck />Verify chain</Btn></>} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Entries" value={engine.audit.length} hint="Since the window started" icon={<Link2 className="h-4 w-4" />} />
        <Stat label="Actors" value={new Set(engine.audit.map((a) => a.actor)).size} hint="Analysts and automation" icon={<ShieldCheck className="h-4 w-4" />} tone="violet" />
        <Stat label="Head hash" value={<span className="text-base">{engine.audit.length ? engine.audit[engine.audit.length - 1].hash.slice(0, 16) + "…" : "empty"}</span>} hint="Latest link in the chain" icon={<Link2 className="h-4 w-4" />} tone="emerald" />
      </div>
      {checked && (
        <div className={`flex items-center gap-3 rounded-xl border p-4 ${checked.ok ? "border-emerald-500/40 bg-emerald-500/10" : "border-rose-500/40 bg-rose-500/10"}`}>
          {checked.ok ? <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-300" /> : <ShieldX className="h-5 w-5 text-rose-600" />}
          <p className="text-sm font-medium">{checked.ok ? `Chain intact. All ${engine.audit.length} hashes recomputed and matched.` : `Chain broken at entry ${checked.brokenAt}.`}</p>
          <span className="ml-auto text-xs text-muted-foreground">Checked {new Date(checked.at).toLocaleTimeString("en-GB")}</span>
        </div>
      )}
      <Panel bodyClassName="p-0">
        {entries.length === 0 ? <div className="p-6"><Empty title="No actions recorded yet" /></div> : (
          <div className="overflow-x-auto"><table className="w-full min-w-[980px] text-left text-xs">
            <thead className="border-b bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground"><tr><th className="px-4 py-2.5">#</th><th className="px-3 py-2.5">Time</th><th className="px-3 py-2.5">Actor</th><th className="px-3 py-2.5">Action</th><th className="px-3 py-2.5">Target</th><th className="px-3 py-2.5">Previous hash</th><th className="px-3 py-2.5">Hash</th></tr></thead>
            <tbody>{entries.map((e) => (
              <tr key={e.seq} className="border-b last:border-0">
                <td className="px-4 py-2.5 font-mono">{e.seq}</td><td className="whitespace-nowrap px-3 py-2.5 font-mono">{fmtDateTime(e.ts)}</td><td className="px-3 py-2.5">{e.actor}</td><td className="px-3 py-2.5 font-medium">{e.action}</td><td className="px-3 py-2.5 font-mono">{e.detail}</td>
                <td className="px-3 py-2.5 font-mono text-muted-foreground" title={e.prevHash}>{e.prevHash.slice(0, 12)}…</td><td className="px-3 py-2.5 font-mono text-primary" title={e.hash}>{e.hash.slice(0, 12)}…</td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </Panel>
    </Page>
  );
}
