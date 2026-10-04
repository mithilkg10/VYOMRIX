import { ExternalLink, LockKeyhole, ShieldCheck } from "lucide-react";
import { DemoAttackAndReports } from "./DemoAttackAndReports";
import { DemoAssetsAndDetections } from "./DemoAssetsAndDetections";
import { DemoIncidents } from "./DemoIncidents";
import { DemoNav } from "./DemoNav";
import { DemoStats } from "./DemoStats";

export function DemoWorkspace() {
  return (
    <main className="min-h-screen bg-[#020617] text-slate-100" data-demo-surface="recruiter">
      <div className="grid min-h-screen lg:grid-cols-[240px_1fr]">
        <DemoNav />

        <section className="min-w-0">
          <header className="sticky top-0 z-20 border-b border-white/10 bg-[#020617]/95 px-5 py-4 backdrop-blur-xl sm:px-8">
            <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-[.16em] text-cyan-300">VYOMRIX Recruiter Demo</p>
                <h1 className="mt-1 text-xl font-semibold">Security Operations Workspace</h1>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-lg border border-emerald-300/15 bg-emerald-300/[.06] px-3 py-2 text-xs font-medium text-emerald-200">
                  <ShieldCheck className="h-4 w-4" />
                  Read-only · synthetic data
                </span>
                <form action="/demo-logout" method="post">
                  <button className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/[.05] hover:text-white">
                    End demo
                  </button>
                </form>
              </div>
            </div>
          </header>

          <div className="mx-auto max-w-[1440px] p-5 sm:p-8">
            <section id="overview" className="rounded-2xl border border-cyan-300/15 bg-gradient-to-br from-cyan-300/[.06] to-blue-400/[.025] p-5 sm:p-6">
              <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                <div className="max-w-4xl">
                  <div className="flex items-center gap-2 text-sm font-semibold text-cyan-100">
                    <LockKeyhole className="h-4 w-4" />
                    Safe public review environment
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    This workspace shows how VYOMRIX brings alerts, investigations, assets, detection validation,
                    MITRE ATT&amp;CK context and reporting into one analyst flow. The data is sanitized from controlled
                    Cyber Defense Lab scenarios. No private telemetry, credentials or privileged controls are exposed.
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    The recruiter session is isolated from the operator environment. Every write operation is blocked,
                    and the session expires automatically.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <a
                    href="https://mithilkg-portfolio.vercel.app/lab"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-cyan-300/20 bg-cyan-300/10 px-4 py-2.5 text-sm font-medium text-cyan-50 transition hover:bg-cyan-300/[.16]"
                  >
                    Cyber Defense Lab <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  <a
                    href="https://github.com/mithilkg10/VYOMRIX"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/[.05]"
                  >
                    Source code <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </section>

            <div className="mt-6 lg:hidden">
              <DemoNav mobile />
            </div>

            <DemoStats />
            <DemoIncidents />
            <DemoAssetsAndDetections />
            <DemoAttackAndReports />

            <footer className="mt-8 border-t border-white/10 pt-6 text-xs text-slate-500">
              VYOMRIX · recruiter-safe review environment
            </footer>
          </div>
        </section>
      </div>
    </main>
  );
}
