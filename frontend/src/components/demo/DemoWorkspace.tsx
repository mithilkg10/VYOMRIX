import Link from "next/link";
import { Bell, ExternalLink, Search } from "lucide-react";
import { DemoAttackAndReports } from "./DemoAttackAndReports";
import { DemoAssetsAndDetections } from "./DemoAssetsAndDetections";
import { DemoIncidents } from "./DemoIncidents";
import { DemoNav } from "./DemoNav";
import { DemoStats } from "./DemoStats";

export function DemoWorkspace() {
  return (
    <main className="min-h-screen bg-[#020617] text-slate-100">
      <div className="grid min-h-screen lg:grid-cols-[250px_1fr]">
        <DemoNav />

        <section className="min-w-0">
          <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 bg-[#020617]/90 px-5 py-4 backdrop-blur-xl sm:px-8">
            <div>
              <p className="text-xs uppercase tracking-[.18em] text-cyan-300">SIEM & Security Operations</p>
              <h1 className="mt-1 text-xl font-semibold">Analyst Overview</h1>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="hidden items-center gap-2 rounded-lg border border-white/10 bg-white/[.03] px-3 py-2 text-sm text-slate-500 md:flex">
                <Search className="h-4 w-4" />
                Synthetic workspace
              </div>
              <div className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/[.03] text-slate-400">
                <Bell className="h-4 w-4" />
              </div>
              <Link href="/login" className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300 hover:bg-white/5">
                Operator login
              </Link>
              <a
                href="https://github.com/mithilkg10/VYOMRIX"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300 hover:bg-white/5"
              >
                GitHub <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </header>

          <div className="mx-auto max-w-[1500px] p-5 sm:p-8">
            <div className="mb-7 rounded-2xl border border-cyan-300/15 bg-cyan-300/[.04] p-5">
              <p className="text-sm font-medium text-cyan-100">Recruiter-safe VYOMRIX workspace</p>
              <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-400">
                Explore a read-only representation of the VYOMRIX analyst workflow using sanitized Cyber Defense Lab data.
                Destructive controls, private telemetry, secrets and privileged administration are intentionally excluded.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  href="https://mithilkg-portfolio.vercel.app/lab"
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100"
                >
                  Open Cyber Defense Lab ↗
                </a>
                <a
                  href="https://mithilkg-portfolio.vercel.app/projects/vyomrix-security-platform"
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300"
                >
                  Project case study ↗
                </a>
              </div>
            </div>

            <DemoStats />
            <DemoIncidents />
            <DemoAssetsAndDetections />
            <DemoAttackAndReports />

            <footer className="mt-8 border-t border-white/10 pt-6 text-xs text-slate-500">
              Public demo account: demo.analyst@mithilkg.dev · read-only synthetic data.
            </footer>
          </div>
        </section>
      </div>
    </main>
  );
}
