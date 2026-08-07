"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/(auth)/login/actions";
import { AlertTriangle, BrainCircuit, ChevronDown, ChevronLeft, Database, FileText, FileWarning, FlaskConical, LayoutDashboard, Network, Radar, Search, Settings, Shield, ShieldCheck, TerminalSquare, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type NavigationItem = { name: string; href: string; icon: typeof LayoutDashboard; preview?: boolean };
type NavigationGroup = { name: string; items: NavigationItem[] };

const groups: NavigationGroup[] = [
  { name: "Command", items: [{ name: "Dashboard", href: "/", icon: LayoutDashboard }, { name: "Incidents", href: "/incidents", icon: AlertTriangle }, { name: "Assets", href: "/assets", icon: ShieldCheck, preview: true }, { name: "SIEM", href: "/siem", icon: TerminalSquare, preview: true }, { name: "AI SOC", href: "/ai-soc", icon: BrainCircuit, preview: true }] },
  { name: "Detection", items: [{ name: "Detection Engineering", href: "/detection", icon: FlaskConical, preview: true }, { name: "WAF", href: "/waf", icon: Shield, preview: true }, { name: "Honeypot", href: "/honeypot", icon: Network }, { name: "Phishing", href: "/phishing", icon: FileWarning }] },
  { name: "Intelligence", items: [{ name: "Threat Intelligence", href: "/threat-intel", icon: Database }, { name: "MITRE ATT&CK", href: "/mitre", icon: Radar, preview: true }, { name: "Threat Hunting", href: "/hunting", icon: Search }, { name: "Deception", href: "/deception", icon: Network, preview: true }] },
  { name: "Operations", items: [{ name: "Reports", href: "/reports", icon: FileText }, { name: "Audit Log", href: "/audit", icon: FileText }, { name: "Notifications", href: "/notifications", icon: FileWarning }] },
  { name: "Administration", items: [{ name: "System Health", href: "/system", icon: Settings }, { name: "Administration", href: "/administration", icon: Users }, { name: "Settings", href: "/settings", icon: Settings }] },
];

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => Object.fromEntries(groups.map((group) => [group.name, true])));

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", closeOnEscape);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", closeOnEscape); document.body.style.overflow = previousOverflow; };
  }, [open, onClose]);

  const isActive = (href: string) => pathname === href || (href !== "/" && pathname.startsWith(href + "/"));
  const toggleGroup = (name: string) => setExpandedGroups((current) => ({ ...current, [name]: !current[name] }));

  return <>
    {open && <button className="fixed inset-0 z-40 bg-slate-950/65 backdrop-blur-sm lg:hidden" aria-label="Close navigation" onClick={onClose} />}
    <aside className={cn("fixed inset-y-0 left-0 z-50 flex -translate-x-full flex-col border-r border-sky-200/10 bg-sidebar/95 shadow-2xl backdrop-blur-xl transition-[width,transform] duration-200 ease-out lg:static lg:z-auto lg:translate-x-0", collapsed ? "lg:w-20" : "w-72 lg:w-72", open && "w-72 translate-x-0")} aria-label="Primary navigation">
      <div className="flex h-16 items-center border-b border-sky-200/10 px-3">
        <Link href="/" className="flex min-w-0 flex-1 items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={onClose}>
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-cyan-400 via-blue-500 to-violet-500 text-slate-950 shadow-lg shadow-cyan-500/20"><Shield className="h-5 w-5" aria-hidden="true" /></span>
          <span className={cn("min-w-0", collapsed && "lg:hidden")}><span className="block truncate text-sm font-semibold tracking-tight">MKG SOC Platform</span><span className="block text-[10px] uppercase tracking-[.16em] text-muted-foreground">Powered by Vyomrix</span></span>
        </Link>
        <Button variant="ghost" size="icon-sm" className="lg:hidden" onClick={onClose} aria-label="Close navigation"><X /></Button>
      </div>
      <nav className="flex-1 overflow-y-auto px-2 py-3">
        {groups.map((group) => <section key={group.name} className="mb-3">
          <button type="button" onClick={() => toggleGroup(group.name)} className={cn("flex h-8 w-full items-center rounded-md px-2 text-left text-[10px] font-semibold uppercase tracking-[.15em] text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", collapsed && "lg:justify-center")} aria-expanded={expandedGroups[group.name]}>
            <span className={collapsed ? "lg:hidden" : ""}>{group.name}</span><ChevronDown className={cn("ml-auto h-3.5 w-3.5 transition-transform", !expandedGroups[group.name] && "-rotate-90", collapsed && "lg:ml-0")} aria-hidden="true" />
          </button>
          {expandedGroups[group.name] && <div className="space-y-0.5">{group.items.map((item) => { const active = isActive(item.href); const label = item.preview ? `${item.name} (Preview)` : item.name; return <Link key={item.name} href={item.href} title={collapsed ? label : undefined} onClick={onClose} className={cn("group interactive relative flex min-h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", active ? "bg-gradient-to-r from-cyan-400/15 via-blue-500/12 to-violet-500/12 text-foreground shadow-[inset_2px_0_0_#22d3ee]" : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground", collapsed && "lg:justify-center lg:px-2")}><span className={cn("grid h-6 w-6 place-items-center rounded-md", active ? "bg-primary/15 text-primary" : "text-muted-foreground group-hover:text-primary")}><item.icon className="h-4 w-4" aria-hidden="true" /></span><span className={cn("min-w-0 truncate", collapsed && "lg:hidden")}>{item.name}</span>{item.preview && <Badge variant="outline" className={cn("ml-auto px-1.5 py-0 text-[10px] font-medium text-muted-foreground", collapsed && "lg:hidden")}>Preview</Badge>}</Link>; })}</div>}
        </section>)}
      </nav>
      <div className="border-t border-sky-200/10 p-3">
        <UserProfile collapsed={collapsed} />
        <form action={logoutAction}><Button type="submit" variant="destructive" className={cn("w-full justify-start", collapsed && "lg:justify-center lg:px-2")} title={collapsed ? "Logout" : undefined}><X className="h-4 w-4" /><span className={collapsed ? "lg:hidden" : ""}>Logout</span></Button></form>
      </div>
      <Button variant="ghost" size="icon-sm" className="absolute -right-4 top-20 hidden rounded-full border bg-card shadow-lg lg:inline-flex" onClick={() => setCollapsed((value) => !value)} aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}><ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} /></Button>
    </aside>
  </>;
}

import { useQuery } from "@tanstack/react-query";
import { authApi } from "@/lib/api/auth";

function UserProfile({ collapsed }: { collapsed: boolean }) {
  const { data: user, isLoading } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: authApi.getCurrentUser,
  });

  if (isLoading) {
    return (
      <div className={cn("mb-2 rounded-xl border border-sky-200/10 bg-card/60 p-3 flex animate-pulse items-center", collapsed && "lg:p-2 lg:justify-center")}>
        <div className="w-8 h-8 rounded-full bg-surface-sunken shrink-0" />
        <div className={cn("ml-3 space-y-1.5", collapsed && "lg:hidden")}>
          <div className="h-3 w-24 bg-surface-sunken rounded" />
          <div className="h-2 w-16 bg-surface-sunken rounded" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className={cn("mb-2 rounded-xl border border-sky-200/10 bg-card/60 p-3 flex items-center", collapsed && "lg:p-2 lg:justify-center")} title={collapsed ? `${user.full_name || user.email} - ${user.role}` : undefined}>
      <Users className={cn("h-8 w-8 text-primary p-1.5 bg-primary/10 rounded-full shrink-0", collapsed && "lg:block")} aria-hidden="true" />
      <div className={cn("ml-3 min-w-0 flex-1", collapsed && "lg:hidden")}>
        <p className="text-sm font-medium truncate">{user.full_name || user.email}</p>
        <p className="text-xs text-muted-foreground truncate">{user.role}</p>
      </div>
    </div>
  );
}
