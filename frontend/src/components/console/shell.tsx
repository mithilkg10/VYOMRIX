"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useTheme } from "next-themes";
import {
  Activity, AlertTriangle, Bell, BookOpenCheck, Boxes, ChevronRight, Crosshair, FileText, FlaskConical, Globe2, LayoutDashboard,
  LogOut, Menu, Moon, Pause, Play, Radar, ScrollText, Search, Settings, Shield, ShieldAlert, Sun, Swords, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getEngine, setPaused, useEngine, usePaused } from "@/lib/engine/use-engine";
import { logoutAction } from "@/app/(auth)/login/actions";
import { Kbd, SevBadge, ago } from "./kit";

type Mode = "demo" | "owner";

const NAV: { group: string; items: { href: string; label: string; icon: typeof Activity; owner?: boolean }[] }[] = [
  { group: "Operate", items: [
    { href: "/", label: "Overview", icon: LayoutDashboard },
    { href: "/lab", label: "Attack Lab", icon: Swords },
    { href: "/incidents", label: "Incidents", icon: ShieldAlert },
    { href: "/alerts", label: "Alert Queue", icon: AlertTriangle },
  ] },
  { group: "Detect", items: [
    { href: "/detections", label: "Detections", icon: FlaskConical },
    { href: "/hunting", label: "Threat Hunting", icon: Search },
    { href: "/mitre", label: "ATT&CK Coverage", icon: Radar },
  ] },
  { group: "Protect", items: [
    { href: "/waf", label: "Web Firewall", icon: Shield },
    { href: "/threat-intel", label: "Threat Intel", icon: Globe2 },
    { href: "/deception", label: "Deception", icon: Crosshair },
    { href: "/assets", label: "Assets", icon: Boxes },
  ] },
  { group: "Govern", items: [
    { href: "/reports", label: "Reports", icon: FileText },
    { href: "/audit", label: "Audit Log", icon: ScrollText },
    { href: "/settings", label: "Settings", icon: Settings, owner: true },
  ] },
];

function Logo() {
  return (
    <span className="relative grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-cyan-400 via-sky-500 to-violet-600 shadow-[0_0_24px_-4px_rgb(34_211_238/.7)]">
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M12 3 4 6v6c0 4.5 3.4 8.2 8 9 4.6-.8 8-4.5 8-9V6l-8-3Z" />
        <path d="m8.5 11.5 3.5 3.5 4-6" />
      </svg>
    </span>
  );
}

function Sidebar({ mode, open, onClose }: { mode: Mode; open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const engine = useEngine();
  const openIncidents = engine ? engine.incidents.filter((i) => i.status === "new" || i.status === "investigating").length : 0;
  const newAlerts = engine ? engine.alerts.filter((a) => a.status === "new" && a.level !== "low" && a.level !== "informational").length : 0;
  const running = engine ? engine.runs.filter((r) => r.status === "running").length : 0;
  const active = (href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/"));
  const badge = (href: string) => (href === "/incidents" ? openIncidents : href === "/alerts" ? newAlerts : href === "/lab" ? running : 0);

  return (
    <>
      {open && <button className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden" aria-label="Close navigation" onClick={onClose} />}
      <aside className={cn("fixed inset-y-0 left-0 z-50 flex w-[260px] -translate-x-full flex-col border-r bg-sidebar/95 backdrop-blur-xl transition-transform duration-200 lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0", open && "translate-x-0")} aria-label="Primary navigation">
        <div className="flex h-16 items-center gap-3 border-b px-4">
          <Logo />
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-bold tracking-[.14em]">VYOMRIX</p>
            <p className="text-[10px] uppercase tracking-[.16em] text-muted-foreground">Detection and response</p>
          </div>
          <button className="rounded-md p-1.5 text-muted-foreground hover:bg-muted lg:hidden" onClick={onClose} aria-label="Close navigation"><X className="h-4 w-4" /></button>
        </div>
        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
          {NAV.map((g) => (
            <div key={g.group}>
              <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-[.18em] text-muted-foreground/80">{g.group}</p>
              <div className="space-y-0.5">
                {g.items.filter((i) => !i.owner || mode === "owner").map((item) => {
                  const isActive = active(item.href);
                  const count = badge(item.href);
                  return (
                    <Link key={item.href} href={item.href} onClick={onClose} aria-current={isActive ? "page" : undefined} className={cn("interactive group relative flex h-9 items-center gap-3 rounded-lg px-2.5 text-[13px] font-medium", isActive ? "bg-gradient-to-r from-cyan-500/15 via-sky-500/10 to-transparent text-foreground" : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground")}>
                      {isActive && <span className="absolute inset-y-1.5 left-0 w-[3px] rounded-full bg-primary shadow-[0_0_10px_rgb(var(--glow))]" />}
                      <item.icon className={cn("h-4 w-4", isActive ? "text-primary" : "group-hover:text-primary")} />
                      <span className="flex-1 truncate">{item.label}</span>
                      {count > 0 && <span className={cn("min-w-5 rounded-full px-1.5 text-center font-mono text-[10px] font-semibold leading-5", item.href === "/lab" ? "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300" : "bg-rose-500/15 text-rose-700 dark:text-rose-300")}>{count}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="border-t p-3">
          <div className="rounded-xl border bg-muted/40 p-3">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="live-dot" />
              {mode === "demo" ? "Recruiter session" : "Owner session"}
            </div>
            <p className="mt-1 text-[11px] leading-4 text-muted-foreground">
              {mode === "demo" ? "Your actions run through the real engine and stay in this browser tab. Expires after 30 minutes." : "Hosted showcase mode. The engine runs in this browser."}
            </p>
            {mode === "demo" ? (
              <form action="/demo-logout" method="post" className="mt-2.5">
                <button className="interactive flex h-8 w-full items-center justify-center gap-2 rounded-lg border bg-card text-xs font-medium hover:bg-muted"><LogOut className="h-3.5 w-3.5" />End demo</button>
              </form>
            ) : (
              <form action={logoutAction} className="mt-2.5">
                <button className="interactive flex h-8 w-full items-center justify-center gap-2 rounded-lg border bg-card text-xs font-medium hover:bg-muted"><LogOut className="h-3.5 w-3.5" />Sign out</button>
              </form>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 0); return () => clearTimeout(t); }, []);
  const dark = !mounted || resolvedTheme === "dark";
  return (
    <button type="button" onClick={() => setTheme(dark ? "light" : "dark")} aria-label={`Switch to ${dark ? "light" : "dark"} theme`} className="interactive grid h-9 w-9 place-items-center rounded-lg border bg-card text-muted-foreground hover:text-foreground">
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

function EngineStatus() {
  const engine = useEngine();
  const paused = usePaused();
  if (!engine) return null;
  const minute = Math.floor(engine.lastSec / 60);
  const last = [1, 2, 3].map((k) => engine.minutes.get(minute - k)?.events ?? 0);
  const eps = last.reduce((s, x) => s + x, 0) / 180;
  return (
    <div className="hidden items-center gap-2 whitespace-nowrap rounded-lg border bg-card px-2.5 py-1.5 xl:flex">
      <span className={paused ? "h-2 w-2 rounded-full bg-amber-500" : "live-dot"} />
      <span className="text-xs font-medium">{paused ? "Engine paused" : "Engine live"}</span>
      <span className="font-mono text-[11px] text-muted-foreground">{eps.toFixed(1)} ev/s</span>
      <span className="font-mono text-[11px] text-muted-foreground">{engine.rules.length} rules</span>
      <button type="button" onClick={() => setPaused(!paused)} className="ml-1 rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label={paused ? "Resume engine" : "Pause engine"}>{paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}</button>
    </div>
  );
}

function AlertBell() {
  const engine = useEngine();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);
  const items = engine ? engine.alerts.filter((a) => a.level === "high" || a.level === "critical").slice(-6).reverse() : [];
  const unread = engine ? engine.alerts.filter((a) => a.status === "new" && (a.level === "high" || a.level === "critical")).length : 0;
  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-label={`High severity alerts, ${unread} new`} aria-expanded={open} className="interactive relative grid h-9 w-9 place-items-center rounded-lg border bg-card text-muted-foreground hover:text-foreground">
        <Bell className="h-4 w-4" />
        {unread > 0 && <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-rose-500 px-1 text-center font-mono text-[9px] font-bold leading-4 text-white">{unread > 99 ? "99+" : unread}</span>}
      </button>
      {open && (
        <div className="absolute right-0 top-11 z-50 w-[360px] overflow-hidden rounded-xl border bg-popover shadow-2xl">
          <div className="flex items-center justify-between border-b px-4 py-2.5"><p className="text-sm font-semibold">High and critical alerts</p><Link href="/alerts" onClick={() => setOpen(false)} className="text-xs font-medium text-primary hover:underline">Open queue</Link></div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 && <p className="px-4 py-6 text-center text-xs text-muted-foreground">Nothing yet. Launch a scenario in the Attack Lab.</p>}
            {items.map((a) => (
              <Link key={a.id} href={a.incidentId ? `/incidents/${a.incidentId}` : `/alerts?id=${a.id}`} onClick={() => setOpen(false)} className="block border-b px-4 py-2.5 last:border-0 hover:bg-muted/60">
                <div className="flex items-center justify-between gap-2"><SevBadge level={a.level} /><span className="font-mono text-[10px] text-muted-foreground">{ago(a.ts)}</span></div>
                <p className="mt-1 truncate text-xs font-medium">{a.ruleTitle}</p>
                <p className="truncate text-[11px] text-muted-foreground">{a.host} · {a.id}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const PALETTE_EVENT = "vyomrix:open-command-palette";
export const openPalette = () => window.dispatchEvent(new Event(PALETTE_EVENT));

function CommandPalette({ mode }: { mode: Mode }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const router = useRouter();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setOpen((v) => !v); } };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(PALETTE_EVENT, onOpen);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener(PALETTE_EVENT, onOpen); };
  }, []);
  const results = useMemo(() => {
    if (!open) return [];
    const term = q.trim().toLowerCase();
    const pages = NAV.flatMap((g) => g.items).filter((i) => !i.owner || mode === "owner").map((i) => ({ kind: "Page", label: i.label, sub: i.href, href: i.href }));
    const e = getEngine();
    const records = [
      ...e.incidents.map((i) => ({ kind: "Incident", label: `${i.id} ${i.title}`, sub: `${i.severity} · ${i.status}`, href: `/incidents/${i.id}` })),
      ...e.alerts.slice(-300).reverse().map((a) => ({ kind: "Alert", label: `${a.id} ${a.ruleTitle}`, sub: `${a.host} · ${a.level}`, href: a.incidentId ? `/incidents/${a.incidentId}` : `/alerts?id=${a.id}` })),
      ...e.rules.map((r) => ({ kind: "Rule", label: r.title, sub: r.name ?? r.id, href: `/detections?rule=${r.name ?? r.id}` })),
      ...e.assets.map((a) => ({ kind: "Asset", label: a.hostname, sub: `${a.ip} · ${a.role}`, href: `/assets?host=${a.hostname}` })),
      ...e.scenarios.map((s) => ({ kind: "Scenario", label: s.name, sub: s.tagline, href: `/lab#${s.id}` })),
    ];
    if (!term) return [...pages, ...records.filter((r) => r.kind === "Incident" || r.kind === "Scenario")].slice(0, 12);
    const all = [...pages, ...records];
    const hits = all.filter((r) => `${r.label} ${r.sub}`.toLowerCase().includes(term)).slice(0, 12);
    return [...hits, { kind: "Hunt", label: `Search events for "${q.trim()}"`, sub: "Threat Hunting", href: `/hunting?q=${encodeURIComponent(q.trim())}` }];
  }, [open, q, mode]);
  if (!open) return null;
  const go = (href: string) => { setOpen(false); setQ(""); router.push(href); };
  return (
    <div className="fixed inset-0 z-[80] grid place-items-start justify-center bg-slate-950/50 px-4 pt-[12vh] backdrop-blur-sm" onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }} role="dialog" aria-modal="true" aria-label="Command palette">
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border bg-popover shadow-2xl">
        <div className="flex items-center gap-3 border-b px-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input autoFocus value={q} onChange={(e) => { setQ(e.target.value); setSel(0); }} onKeyDown={(e) => {
            if (e.key === "Escape") setOpen(false);
            if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(results.length - 1, s + 1)); }
            if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(0, s - 1)); }
            if (e.key === "Enter" && results[sel]) go(results[sel].href);
          }} placeholder="Search pages, incidents, alerts, rules, hosts" aria-label="Search" className="h-12 flex-1 bg-transparent text-sm outline-none" />
          <Kbd>Esc</Kbd>
        </div>
        <ul className="max-h-[52vh] overflow-y-auto p-2" role="listbox">
          {results.map((r, i) => (
            <li key={`${r.kind}${r.href}${i}`} role="option" aria-selected={i === sel}>
              <button type="button" onMouseEnter={() => setSel(i)} onClick={() => go(r.href)} className={cn("flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left", i === sel ? "bg-muted" : "")}>
                <span className="w-16 shrink-0 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{r.kind}</span>
                <span className="min-w-0 flex-1"><span className="block truncate text-sm">{r.label}</span><span className="block truncate text-[11px] text-muted-foreground">{r.sub}</span></span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function ConsoleShell({ mode, children }: { mode: Mode; children: ReactNode }) {
  const [navOpen, setNavOpen] = useState(false);
  return (
    <div className="flex min-h-dvh">
      <a href="#main-content" className="sr-only z-[90] rounded-md bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:absolute focus:left-4 focus:top-4">Skip to content</a>
      <Sidebar mode={mode} open={navOpen} onClose={() => setNavOpen(false)} />
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-xl sm:px-6">
          <button type="button" className="grid h-9 w-9 place-items-center rounded-lg border bg-card lg:hidden" onClick={() => setNavOpen(true)} aria-label="Open navigation"><Menu className="h-4 w-4" /></button>
          <button type="button" onClick={openPalette} className="interactive hidden h-9 w-full max-w-sm items-center gap-2 rounded-lg border bg-card px-3 text-left text-sm text-muted-foreground hover:border-primary/40 sm:flex">
            <Search className="h-4 w-4" /><span className="flex-1 truncate">Search incidents, alerts, rules, hosts</span><Kbd>Ctrl K</Kbd>
          </button>
          <div className="ml-auto flex items-center gap-2">
            <EngineStatus />
            <Link href="/lab" className="interactive hidden h-9 items-center gap-2 whitespace-nowrap rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground shadow-[0_8px_24px_-10px_rgb(var(--glow))] hover:brightness-110 sm:inline-flex"><Swords className="h-4 w-4" />Launch attack</Link>
            <AlertBell />
            <ThemeToggle />
          </div>
        </header>
        {mode === "demo" && (
          <div className="border-b bg-gradient-to-r from-cyan-500/10 via-violet-500/5 to-transparent px-4 py-2 text-center text-[11.5px] text-muted-foreground sm:px-6">
            <BookOpenCheck className="mr-1.5 inline h-3.5 w-3.5 text-primary" />
            Recruiter demo. Telemetry is synthetic, the detection logic is real: Sigma rules, correlation, WAF and intel matching all run live in your browser.
          </div>
        )}
        <main id="main-content">{children}</main>
      </div>
      <CommandPalette mode={mode} />
    </div>
  );
}
