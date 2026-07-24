"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/(auth)/login/actions";
import { 
  Shield, LayoutDashboard, Activity, AlertTriangle, 
  TerminalSquare, FileWarning, Search, BrainCircuit,
  Database, Network, FileText, Settings 
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Incidents", href: "/incidents", icon: AlertTriangle },
  { name: "AI SOC Analyst", href: "/ai-soc", icon: BrainCircuit },
  { name: "SIEM Logs", href: "/siem", icon: TerminalSquare },
  { name: "WAF Events", href: "/waf", icon: Shield },
  { name: "Threat Intel", href: "/threat-intel", icon: Database },
  { name: "Threat Hunting", href: "/hunting", icon: Search },
  { name: "Phishing Analyzer", href: "/phishing", icon: FileWarning },
  { name: "Honeypot", href: "/honeypot", icon: Network },
  { name: "Reports", href: "/reports", icon: FileText },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col border-r bg-sidebar">
      <div className="flex flex-col h-14 justify-center border-b px-4">
        <div className="flex items-center">
          <Shield className="mr-2 h-6 w-6 text-primary" />
          <span className="font-semibold tracking-tight text-sidebar-foreground">Vyomrix Security Platform</span>
        </div>
        <span className="text-[10px] text-muted-foreground uppercase tracking-widest pl-8 -mt-1">Codename: Vyomrix</span>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center rounded-md px-3 py-2 text-sm font-medium",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <item.icon
                  className={cn(
                    "mr-3 h-5 w-5 flex-shrink-0",
                    isActive ? "text-sidebar-accent-foreground" : "text-muted-foreground group-hover:text-sidebar-foreground"
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="border-t p-4 flex flex-col gap-2">
        <div className="flex items-center gap-3 rounded-lg border bg-card p-3 shadow-sm">
          <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
            MK
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-medium truncate">Mithil K Gowda</span>
            <span className="text-xs text-muted-foreground truncate">Super Admin • admin@mkg.com</span>
          </div>
        </div>
        
        <form action={logoutAction} className="w-full">
          <button type="submit" className="w-full text-left px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-md transition-colors">
            Logout
          </button>
        </form>
      </div>
    </div>
  );
}
