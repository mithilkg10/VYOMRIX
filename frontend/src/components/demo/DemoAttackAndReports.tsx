import { Download, FileText, Network } from "lucide-react";
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
        <div className="mb-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-cyan-300" />
            <h2 className="font-semibold">Investigation reports</h2>
          </div>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            Downloadable PDF reports generated from the synthetic recruiter dataset.
          </p>
        </div>

        <div className="space-y-2">
          {demoReports.map((report) => (
            <div
              key={report.id}
              className="flex flex-col gap-3 rounded-xl border border-white/[.07] bg-black/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <code className="text-xs font-semibold text-cyan-300">{report.id}</code>
                  <span
                    className={
                      report.status === "Partial"
                        ? "rounded-full border border-amber-300/20 bg-amber-300/10 px-2 py-0.5 text-[10px] font-medium text-amber-200"
                        : "rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2 py-0.5 text-[10px] font-medium text-emerald-200"
                    }
                  >
                    {report.status}
                  </span>
                </div>
                <p className="mt-1 truncate text-sm text-slate-300">{report.title}</p>
              </div>

              <a
                href={`/api/demo-reports/${report.id}`}
                download
                className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-cyan-300/20 bg-cyan-300/[.07] px-3 text-xs font-medium text-cyan-100 transition hover:bg-cyan-300/[.14]"
              >
                <Download className="h-3.5 w-3.5" />
                Download PDF
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
