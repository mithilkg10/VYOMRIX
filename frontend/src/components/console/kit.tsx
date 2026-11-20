"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { IncidentStatus, Severity } from "@/lib/engine/types";

// ---- formatting ----------------------------------------------------------------------
export const fmtNum = (n: number) => n.toLocaleString("en-GB");
export const fmtTime = (ts: number) => new Date(ts).toLocaleTimeString("en-GB", { hour12: false });
export const fmtDateTime = (ts: number) => new Date(ts).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
export function ago(ts: number, now = Date.now()) {
  const s = Math.max(0, Math.round((now - ts) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  return `${h} h ${m % 60} min ago`;
}
export function dur(ms: number) {
  if (!Number.isFinite(ms) || ms < 0) return "n/a";
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)} s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ${Math.round(s % 60)} s`;
  return `${Math.floor(m / 60)} h ${m % 60} min`;
}

// ---- severity -----------------------------------------------------------------------
export const SEV_HEX: Record<Severity, string> = { critical: "#f43f5e", high: "#f97316", medium: "#eab308", low: "#38bdf8", informational: "#94a3b8" };
const SEV_CLASS: Record<Severity, string> = {
  critical: "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  high: "border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-300",
  medium: "border-yellow-500/35 bg-yellow-500/10 text-yellow-800 dark:text-yellow-300",
  low: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  informational: "border-slate-400/30 bg-slate-400/10 text-slate-600 dark:text-slate-300",
};
export function SevBadge({ level, className }: { level: Severity; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-semibold capitalize", SEV_CLASS[level], className)}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: SEV_HEX[level] }} />
      {level === "informational" ? "info" : level}
    </span>
  );
}

const STATUS_CLASS: Record<string, string> = {
  new: "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  investigating: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  contained: "border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  resolved: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  acknowledged: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  closed: "border-slate-400/30 bg-slate-400/10 text-slate-600 dark:text-slate-300",
  running: "border-cyan-500/30 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
  completed: "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  Healthy: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  "At risk": "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  Compromised: "border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300",
  Isolated: "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  Offline: "border-slate-400/30 bg-slate-400/10 text-slate-600 dark:text-slate-300",
};
export function StatusBadge({ status, label }: { status: IncidentStatus | string; label?: string }) {
  return <span className={cn("inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-semibold capitalize", STATUS_CLASS[status] ?? STATUS_CLASS.closed)}>{label ?? status}</span>;
}

// ---- layout -------------------------------------------------------------------------
export function Page({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("app-page space-y-6 pb-16", className)}>{children}</div>;
}

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: ReactNode; description?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="flex flex-col gap-4 pt-2 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl">
        {eyebrow && <p className="text-[11px] font-semibold uppercase tracking-[.2em] text-primary">{eyebrow}</p>}
        <h1 className="mt-1.5 text-2xl font-semibold tracking-tight sm:text-[28px]">{title}</h1>
        {description && <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function Panel({ title, subtitle, actions, children, className, bodyClassName, glow, id }: { title?: ReactNode; subtitle?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string; bodyClassName?: string; glow?: boolean; id?: string }) {
  return (
    <section id={id} className={cn("panel min-w-0", glow && "panel-glow", className)}>
      {(title || actions) && (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b px-5 py-3.5">
          <div className="min-w-0">
            {title && <h2 className="text-sm font-semibold tracking-tight">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </section>
  );
}

export function Stat({ label, value, hint, icon, tone = "cyan", spark }: { label: string; value: ReactNode; hint?: ReactNode; icon?: ReactNode; tone?: "cyan" | "rose" | "amber" | "emerald" | "violet" | "sky"; spark?: number[] }) {
  const tones = {
    cyan: "text-cyan-600 dark:text-cyan-300 bg-cyan-500/10 border-cyan-500/20",
    rose: "text-rose-600 dark:text-rose-300 bg-rose-500/10 border-rose-500/20",
    amber: "text-amber-600 dark:text-amber-300 bg-amber-500/10 border-amber-500/20",
    emerald: "text-emerald-600 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/20",
    violet: "text-violet-600 dark:text-violet-300 bg-violet-500/10 border-violet-500/20",
    sky: "text-sky-600 dark:text-sky-300 bg-sky-500/10 border-sky-500/20",
  };
  const stroke = { cyan: "#06b6d4", rose: "#f43f5e", amber: "#f59e0b", emerald: "#10b981", violet: "#8b5cf6", sky: "#0ea5e9" }[tone];
  return (
    <div className="panel relative overflow-hidden p-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        {icon && <span className={cn("grid h-8 w-8 place-items-center rounded-lg border", tones[tone])}>{icon}</span>}
      </div>
      <p className="mt-2 font-mono text-[26px] font-semibold leading-none tracking-tight">{value}</p>
      {hint && <p className="mt-2 text-xs text-muted-foreground">{hint}</p>}
      {spark && spark.length > 1 && <Spark data={spark} color={stroke} className="absolute bottom-0 right-0 h-10 w-28 opacity-80" />}
    </div>
  );
}

export function Spark({ data, color = "#06b6d4", className }: { data: number[]; color?: string; className?: string }) {
  const id = useId().replace(/:/g, "");
  const max = Math.max(1, ...data);
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * 100},${30 - (v / max) * 26}`).join(" ");
  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className={className} aria-hidden="true">
      <defs><linearGradient id={`g${id}`} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={color} stopOpacity=".35" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient></defs>
      <polygon points={`0,30 ${pts} 100,30`} fill={`url(#g${id})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function RiskRing({ value, size = 64 }: { value: number; size?: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const color = value >= 60 ? "#f43f5e" : value >= 20 ? "#f59e0b" : "#10b981";
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label={`Risk score ${value} of 100`}>
      <circle cx="32" cy="32" r={r} fill="none" stroke="currentColor" strokeOpacity=".12" strokeWidth="6" />
      <circle cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="6" strokeLinecap="round" strokeDasharray={`${(value / 100) * c} ${c}`} transform="rotate(-90 32 32)" />
      <text x="32" y="36.5" textAnchor="middle" className="fill-foreground font-mono text-[13px] font-semibold">{value}</text>
    </svg>
  );
}

// ---- controls -----------------------------------------------------------------------
type BtnVariant = "primary" | "outline" | "ghost" | "danger" | "success";
const BTN: Record<BtnVariant, string> = {
  primary: "bg-primary text-primary-foreground shadow-[0_0_0_1px_rgb(var(--glow)/.4),0_8px_24px_-8px_rgb(var(--glow)/.6)] hover:brightness-110",
  outline: "border bg-card hover:bg-muted",
  ghost: "hover:bg-muted text-muted-foreground hover:text-foreground",
  danger: "border border-rose-500/30 bg-rose-500/10 text-rose-700 hover:bg-rose-500/20 dark:text-rose-300",
  success: "border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300",
};
export function Btn({ variant = "outline", size = "md", className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: "sm" | "md" }) {
  return <button type="button" className={cn("interactive inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-45 [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0", size === "sm" ? "h-8 px-3 text-xs" : "h-9 px-3.5 text-sm", BTN[variant], className)} {...props} />;
}

export function Tabs<T extends string>({ tabs, value, onChange, className }: { tabs: { id: T; label: ReactNode }[]; value: T; onChange: (v: T) => void; className?: string }) {
  return (
    <div role="tablist" className={cn("inline-flex flex-wrap gap-1 rounded-xl border bg-muted/60 p-1", className)}>
      {tabs.map((t) => (
        <button key={t.id} role="tab" type="button" aria-selected={value === t.id} onClick={() => onChange(t.id)} className={cn("interactive rounded-lg px-3 py-1.5 text-xs font-semibold", value === t.id ? "bg-card text-foreground shadow-sm ring-1 ring-border" : "text-muted-foreground hover:text-foreground")}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn("h-9 w-full rounded-lg border bg-card px-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20", props.className)} />;
}

export function Select({ value, onChange, options, label, className }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; label: string; className?: string }) {
  return (
    <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} className={cn("h-9 rounded-lg border bg-card px-2.5 text-sm outline-none focus:border-primary", className)}>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

export function Empty({ title, children, icon }: { title: string; children?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="grid place-items-center rounded-xl border border-dashed px-6 py-10 text-center">
      {icon && <div className="mb-3 text-muted-foreground">{icon}</div>}
      <p className="text-sm font-semibold">{title}</p>
      {children && <div className="mt-1 max-w-md text-xs leading-5 text-muted-foreground">{children}</div>}
    </div>
  );
}

export function Drawer({ open, onClose, title, subtitle, children, wide }: { open: boolean; onClose: () => void; title: ReactNode; subtitle?: ReactNode; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label={typeof title === "string" ? title : "Details"}>
      <button className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]" aria-label="Close panel" onClick={onClose} />
      <aside className={cn("absolute inset-y-0 right-0 flex w-full flex-col border-l bg-background shadow-2xl animate-in slide-in-from-right duration-200", wide ? "max-w-3xl" : "max-w-xl")}>
        <div className="flex items-start justify-between gap-3 border-b px-5 py-4">
          <div className="min-w-0"><h2 className="text-base font-semibold">{title}</h2>{subtitle && <div className="mt-1 text-xs text-muted-foreground">{subtitle}</div>}</div>
          <Btn variant="ghost" size="sm" onClick={onClose} aria-label="Close"><X /></Btn>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
      </aside>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[130px_1fr] gap-3 border-b py-2 text-xs last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="min-w-0 break-words font-mono">{children}</dd>
    </div>
  );
}

export function Loading({ label = "Starting the detection engine" }: { label?: string }) {
  return (
    <div className="app-page grid min-h-[60vh] place-items-center">
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
          <div className="radar-sweep absolute inset-0 rounded-full" style={{ background: "conic-gradient(from 0deg, transparent 70%, rgb(var(--glow) / .6))" }} />
        </div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">Replaying the last 90 minutes of lab telemetry through every rule.</p>
      </div>
    </div>
  );
}

export function Mono({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("font-mono text-[12px]", className)}>{children}</span>;
}

export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), intervalMs); return () => clearInterval(t); }, [intervalMs]);
  return now;
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="rounded border bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">{children}</kbd>;
}
