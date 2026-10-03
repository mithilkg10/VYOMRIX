import Link from "next/link";
import { Activity, Boxes, FileText, Gauge, Network, Radar, ShieldCheck } from "lucide-react";

const items = [
  { href: "#overview", label: "Overview", icon: Gauge },
  { href: "#incidents", label: "Incidents", icon: Activity },
  { href: "#assets", label: "Assets", icon: Boxes },
  { href: "#detections", label: "Detections", icon: Radar },
  { href: "#attack", label: "MITRE ATT&CK", icon: Network },
  { href: "#reports", label: "Reports", icon: FileText },
];

export function DemoNav() {
  return (
    <aside className="hidden min-h-screen border-r border-white/10 bg-[#050a16] lg:flex lg:flex-col">
      <div className="border-b border-white/10 p-6">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl border border-cyan-300/20 bg-cyan-300/10">
            <ShieldCheck className="h-6 w-6 text-cyan-300" />
          </div>
          <div>
            <div className="font-semibold">VYOMRIX</div>
            <div className="text-[10px] uppercase tracking-[.18em] text-slate-500">Recruiter Demo</div>
          </div>
        </div>
      </div>

      <nav className="space-y-1 p-4">
        {items.map(({ href, label, icon: Icon }) => (
          <a
            key={href}
            href={href}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-400 transition hover:bg-white/[.05] hover:text-white"
          >
            <Icon className="h-4 w-4" />
            {label}
          </a>
        ))}
      </nav>

      <div className="mt-auto border-t border-white/10 p-4">
        <div className="rounded-xl border border-emerald-300/10 bg-emerald-300/[.05] p-3 text-xs text-slate-400">
          <div className="mb-1 flex items-center gap-2 text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Read-only demo
          </div>
          Synthetic data only.
        </div>
        <Link href="/login" className="mt-3 block text-xs text-slate-500 hover:text-white">
          Return to operator login
        </Link>
      </div>
    </aside>
  );
}
