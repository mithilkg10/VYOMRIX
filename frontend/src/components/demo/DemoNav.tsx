import { Activity, Boxes, FileText, Gauge, Network, Radar, ShieldCheck } from "lucide-react";

const items = [
  { href: "#overview", label: "Overview", icon: Gauge },
  { href: "#incidents", label: "Incidents", icon: Activity },
  { href: "#assets", label: "Assets", icon: Boxes },
  { href: "#detections", label: "Detections", icon: Radar },
  { href: "#attack", label: "MITRE ATT&CK", icon: Network },
  { href: "#reports", label: "Reports", icon: FileText },
];

export function DemoNav({ mobile = false }: { mobile?: boolean }) {
  if (mobile) {
    return (
      <nav aria-label="Recruiter demo sections" className="flex gap-2 overflow-x-auto pb-2">
        {items.map(({ href, label }) => (
          <a
            key={href}
            href={href}
            className="shrink-0 rounded-lg border border-white/10 bg-white/[.03] px-3 py-2 text-xs font-medium text-slate-300"
          >
            {label}
          </a>
        ))}
      </nav>
    );
  }

  return (
    <aside className="hidden min-h-screen border-r border-white/10 bg-[#050a16] lg:flex lg:flex-col">
      <div className="border-b border-white/10 p-6">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl border border-cyan-300/20 bg-cyan-300/10">
            <ShieldCheck className="h-6 w-6 text-cyan-300" />
          </div>
          <div>
            <div className="font-semibold">VYOMRIX</div>
            <div className="text-[10px] uppercase tracking-[.18em] text-slate-500">Recruiter Review</div>
          </div>
        </div>
      </div>

      <nav aria-label="Recruiter demo sections" className="space-y-1 p-4">
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
        <div className="rounded-xl border border-emerald-300/10 bg-emerald-300/[.05] p-3 text-xs leading-5 text-slate-400">
          <div className="mb-1 flex items-center gap-2 font-medium text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            Read-only session
          </div>
          Synthetic lab data only. No backend credentials or administrative actions are exposed.
        </div>
      </div>
    </aside>
  );
}
