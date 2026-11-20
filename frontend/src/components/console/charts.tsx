"use client";

import { Area, Bar, CartesianGrid, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Engine } from "@/lib/engine/engine";
import { SEV_HEX } from "./kit";

export const tooltipStyle = {
  contentStyle: { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 10, fontSize: 12, color: "var(--popover-foreground)", boxShadow: "0 10px 30px rgb(0 0 0 / .18)" },
  labelStyle: { color: "var(--muted-foreground)", fontSize: 11 },
  itemStyle: { padding: 0 },
};

export function minuteSeries(engine: Engine, minutes = 90) {
  const last = Math.floor(engine.lastSec / 60);
  const out = [];
  for (let m = last - minutes + 1; m <= last; m += 1) {
    const b = engine.minutes.get(m);
    out.push({
      t: new Date(m * 60_000).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false }),
      events: b?.events ?? 0,
      blocked: b?.blocked ?? 0,
      critical: b?.alerts.critical ?? 0,
      high: b?.alerts.high ?? 0,
      medium: b?.alerts.medium ?? 0,
      low: b?.alerts.low ?? 0,
    });
  }
  return out;
}

export function TelemetryChart({ engine, minutes = 90, height = 260 }: { engine: Engine; minutes?: number; height?: number }) {
  const data = minuteSeries(engine, minutes);
  return (
    <div className="text-muted-foreground" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
          <defs>
            <linearGradient id="evFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#06b6d4" stopOpacity={0.35} /><stop offset="1" stopColor="#06b6d4" stopOpacity={0} /></linearGradient>
          </defs>
          <CartesianGrid stroke="currentColor" strokeOpacity={0.12} vertical={false} />
          <XAxis dataKey="t" tick={{ fill: "currentColor", fontSize: 10 }} tickLine={false} axisLine={false} interval={Math.floor(minutes / 6)} />
          <YAxis yAxisId="ev" tick={{ fill: "currentColor", fontSize: 10 }} tickLine={false} axisLine={false} width={44} />
          <YAxis yAxisId="al" orientation="right" tick={{ fill: "currentColor", fontSize: 10 }} tickLine={false} axisLine={false} width={24} allowDecimals={false} />
          <Tooltip {...tooltipStyle} />
          <Area yAxisId="ev" type="monotone" dataKey="events" name="Events per minute" stroke="#06b6d4" strokeWidth={1.6} fill="url(#evFill)" isAnimationActive={false} />
          <Bar yAxisId="al" dataKey="critical" name="Critical alerts" stackId="a" fill={SEV_HEX.critical} radius={[0, 0, 0, 0]} isAnimationActive={false} />
          <Bar yAxisId="al" dataKey="high" name="High alerts" stackId="a" fill={SEV_HEX.high} isAnimationActive={false} />
          <Bar yAxisId="al" dataKey="medium" name="Medium alerts" stackId="a" fill={SEV_HEX.medium} isAnimationActive={false} />
          <Bar yAxisId="al" dataKey="low" name="Low alerts" stackId="a" fill={SEV_HEX.low} radius={[3, 3, 0, 0]} isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function sensorColor(sensor: string) {
  const map: Record<string, string> = {
    Sysmon: "text-cyan-600 dark:text-cyan-300",
    "Windows Security": "text-sky-600 dark:text-sky-300",
    "Windows System": "text-sky-600 dark:text-sky-300",
    nginx: "text-emerald-600 dark:text-emerald-300",
    "WAF (CRS)": "text-orange-600 dark:text-orange-300",
    "DNS resolver": "text-violet-600 dark:text-violet-300",
    sshd: "text-amber-600 dark:text-amber-300",
    auditd: "text-teal-600 dark:text-teal-300",
    Cowrie: "text-pink-600 dark:text-pink-300",
  };
  return map[sensor] ?? "text-muted-foreground";
}

export const TERM_SENSOR: Record<string, string> = {
  Sysmon: "#67e8f9", "Windows Security": "#7dd3fc", "Windows System": "#7dd3fc", nginx: "#6ee7b7", "WAF (CRS)": "#fdba74", "DNS resolver": "#c4b5fd", sshd: "#fcd34d", auditd: "#5eead4", Cowrie: "#f9a8d4",
};
