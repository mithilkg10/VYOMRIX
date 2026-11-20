"use client";

import Link from "next/link";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import type { SecEvent } from "@/lib/engine/types";
import { lookupIoc } from "@/lib/engine/intel";
import { decodePowerShell } from "@/lib/engine/util";
import { Drawer, Field, fmtDateTime } from "./kit";
import { sensorColor } from "./charts";

export function decodedCommand(cmd: string) {
  const m = /\s-(?:enc|encodedcommand|ec|e)\s+([A-Za-z0-9+/=]{16,})/i.exec(cmd);
  if (!m) return null;
  try { return decodePowerShell(m[1]); } catch { return null; }
}

export function EventDetail({ event, onClose }: { event: SecEvent | null; onClose: () => void }) {
  if (!event) return null;
  const cmd = typeof event.fields.CommandLine === "string" ? event.fields.CommandLine : "";
  const decoded = cmd ? decodedCommand(cmd) : null;
  const iocs = Object.values(event.fields).map((v) => (typeof v === "string" ? lookupIoc(v.replace(/^SHA256=/, "")) : undefined)).filter((x, i, arr): x is NonNullable<typeof x> => Boolean(x) && arr.indexOf(x) === i);
  const raw = JSON.stringify({ id: event.id, timestamp: new Date(event.ts).toISOString(), sensor: event.sensor, logsource: event.logsource, host: event.host, user: event.user, message: event.message, ...event.fields }, null, 2);
  return (
    <Drawer open onClose={onClose} title={event.message.length > 70 ? event.message.slice(0, 70) + "…" : event.message} subtitle={<span className="flex flex-wrap gap-2"><span className={sensorColor(event.sensor)}>{event.sensor}</span><span>{fmtDateTime(event.ts)}</span><span className="font-mono">{event.id}</span></span>} wide>
      {decoded && (
        <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
          <p className="text-xs font-semibold text-amber-800 dark:text-amber-300">Decoded PowerShell (UTF16LE base64)</p>
          <p className="mt-1 break-all font-mono text-[12px]">{decoded}</p>
        </div>
      )}
      {iocs.length > 0 && (
        <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3">
          <p className="text-xs font-semibold text-rose-700 dark:text-rose-300">Matches threat intelligence</p>
          {iocs.map((i) => <p key={i.value} className="mt-1 text-[12px]"><span className="font-mono">{i.value}</span> · {i.threat} · {i.feed} · confidence {i.confidence}</p>)}
        </div>
      )}
      <dl className="rounded-xl border px-3">
        <Field label="Host"><Link className="text-primary hover:underline" href={`/assets?host=${event.host}`}>{event.host}</Link></Field>
        {event.user && <Field label="User">{event.user}</Field>}
        <Field label="Log source">{Object.entries(event.logsource).map(([k, v]) => `${k}: ${v}`).join(", ")}</Field>
        {Object.entries(event.fields).map(([k, v]) => <Field key={k} label={k}>{String(v)}</Field>)}
      </dl>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link href={`/hunting?q=${encodeURIComponent(`host:${event.host}`)}`} className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-muted">Hunt on {event.host}</Link>
        {typeof event.fields.ProcessGuid === "string" && <Link href={`/hunting?q=${encodeURIComponent(`ParentProcessGuid:"${event.fields.ProcessGuid}"`)}`} className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-muted">Child processes</Link>}
        <button type="button" onClick={() => { void navigator.clipboard?.writeText(raw); toast.success("Event JSON copied"); }} className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-muted"><Copy className="h-3.5 w-3.5" />Copy JSON</button>
      </div>
      <pre className="terminal mt-4 max-h-80 overflow-auto p-3">{raw}</pre>
    </Drawer>
  );
}
