import { FileText, Network } from "lucide-react";
import { demoAttack, demoReports } from "./demo-data";

export function DemoAttackAndReports() {
  return (
    <section className="mt-6 grid gap-6 xl:grid-cols-2">
      <div id="attack" className="rounded-2xl border border-white/10 bg-white/[.02] p-5">
        <div className="mb-4 flex items-center gap-2">
          <Network className="h-5 w-5 text-cyan-300" />
          <h2 className="font-semibold">MITRE ATT&CK context</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {demoAttack.map((item) => (
            <span key={item} className="rounded-lg border border-cyan-300/10 bg-cyan-300/[.05] px-3 py-2 text-xs text-cyan-100">
              {item}
            </span>
          ))}
        </div>
      </div>

      <div id="reports" className="rounded-2xl border border-white/10 bg-white/[.02] p-5">
        <div className="mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5 text-cyan-300" />
          <h2 className="font-semibold">Investigation reports</h2>
        </div>
        <div className="space-y-2">
          {demoReports.map((report) => (
            <div key={report} className="rounded-xl border border-white/[.07] bg-black/20 px-4 py-3 text-sm text-slate-300">
              {report}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
