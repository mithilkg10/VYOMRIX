import Link from "next/link";
import { Activity, AlertTriangle, ExternalLink, ShieldCheck } from "lucide-react";

const incidents = [
  { id: "INC-001", title: "Authentication Attack", status: "PASS", detail: "Failed-logon correlation and investigation evidence" },
  { id: "INC-002", title: "PowerShell Activity", status: "PASS", detail: "PowerShell telemetry and detection workflow" },
  { id: "INC-003", title: "Scheduled Task", status: "PASS", detail: "Task creation evidence and triage context" },
  { id: "INC-004", title: "Credential Access", status: "PARTIAL", detail: "Safe LSASS discovery evidence; expected event not observed" },
  { id: "INC-005", title: "Web Attack", status: "PASS", detail: "Synthetic application-security detection workflow" },
  { id: "INC-006", title: "Data Transfer", status: "PASS", detail: "Transfer evidence and integrity verification" },
];

export default function DemoPage() {
  return (
    <main className="min-h-screen bg-[#020617] text-slate-100">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl border border-cyan-300/20 bg-cyan-300/10">
              <ShieldCheck className="h-6 w-6 text-cyan-300" />
            </div>
            <div>
              <h1 className="font-semibold">VYOMRIX Recruiter Demo</h1>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Read-only synthetic SOC view</p>
            </div>
          </div>
          <div className="flex gap-3 text-sm">
            <Link href="/login" className="rounded-lg border border-white/10 px-4 py-2 text-slate-300 hover:bg-white/5">
              Operator login
            </Link>
            <a href="https://github.com/mithilkg10/VYOMRIX" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-slate-300 hover:bg-white/5">
              GitHub <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </header>

        <section className="py-14">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-cyan-300">SIEM · Security Operations · Detection Engineering</p>
          <h2 className="mt-4 max-w-4xl text-4xl font-semibold tracking-tight sm:text-5xl">
            Explore the analyst workflow without privileged access.
          </h2>
          <p className="mt-5 max-w-3xl leading-7 text-slate-400">
            This public recruiter view uses sanitized synthetic data from the documented Cyber Defense Lab.
            It does not expose private telemetry, credentials, destructive controls, or production infrastructure.
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["06", "Documented investigations"],
            ["10", "Sigma rules"],
            ["01", "Custom Wazuh rule"],
            ["05", "MITRE ATT&CK techniques"],
          ].map(([value, label]) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="font-mono text-3xl text-cyan-300">{value}</div>
              <div className="mt-2 text-sm text-slate-300">{label}</div>
            </div>
          ))}
        </section>

        <section className="py-12">
          <div className="mb-5 flex items-center gap-2">
            <Activity className="h-5 w-5 text-cyan-300" />
            <h3 className="text-xl font-semibold">Synthetic incident queue</h3>
          </div>
          <div className="overflow-hidden rounded-2xl border border-white/10">
            {incidents.map((incident) => (
              <div key={incident.id} className="grid gap-2 border-b border-white/10 px-5 py-4 last:border-0 md:grid-cols-[0.7fr_1.3fr_2fr_0.7fr] md:items-center">
                <code className="text-sm text-cyan-300">{incident.id}</code>
                <div className="font-medium">{incident.title}</div>
                <div className="text-sm text-slate-400">{incident.detail}</div>
                <span className={incident.status === "PARTIAL" ? "w-fit rounded-full border border-amber-300/20 bg-amber-300/10 px-2.5 py-1 text-xs text-amber-200" : "w-fit rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2.5 py-1 text-xs text-emerald-200"}>
                  {incident.status}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-8 rounded-2xl border border-amber-300/10 bg-amber-300/[0.04] p-5 text-sm text-slate-400">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-200" />
            <p>This is a recruiter-safe demonstration surface. Full authenticated operator workflows remain behind the private backend.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
