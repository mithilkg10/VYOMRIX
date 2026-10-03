import { Activity } from "lucide-react";
import { demoIncidents } from "./demo-data";

export function DemoIncidents() {
  return (
    <section id="incidents" className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/[.02]">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-cyan-300" />
          <h2 className="font-semibold">Incident queue</h2>
        </div>
        <span className="text-xs text-slate-500">Synthetic evidence</span>
      </div>
      <div className="overflow-x-auto">
        <div className="min-w-[760px]">
          <div className="grid grid-cols-[.8fr_1.4fr_.8fr_2fr_.8fr] gap-4 border-b border-white/10 px-5 py-3 text-[11px] uppercase tracking-[.12em] text-slate-500">
            <span>ID</span><span>Scenario</span><span>Severity</span><span>Evidence</span><span>Status</span>
          </div>
          {demoIncidents.map((item) => (
            <div key={item.id} className="grid grid-cols-[.8fr_1.4fr_.8fr_2fr_.8fr] gap-4 border-b border-white/[.07] px-5 py-4 last:border-0">
              <code className="text-sm text-cyan-300">{item.id}</code>
              <span className="text-sm font-medium text-white">{item.title}</span>
              <span className={item.severity === "High" ? "text-sm text-rose-300" : "text-sm text-amber-200"}>{item.severity}</span>
              <span className="text-sm text-slate-400">{item.evidence}</span>
              <span className={item.status === "Partial" ? "w-fit rounded-full border border-amber-300/20 bg-amber-300/10 px-2.5 py-1 text-xs text-amber-200" : "w-fit rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2.5 py-1 text-xs text-emerald-200"}>{item.status}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
