import Link from "next/link";
import {
  Activity,
  Bell,
  Boxes,
  Crosshair,
  ExternalLink,
  FileSearch,
  Gauge,
  Network,
  Radar,
  Search,
  ShieldCheck,
  Siren,
  Users,
} from "lucide-react";

const incidents = [
  { id: "INC-001", title: "Authentication Attack", severity: "High", status: "PASS", detail: "Failed-logon correlation and investigation evidence" },
  { id: "INC-002", title: "PowerShell Activity", severity: "Medium", status: "PASS", detail: "PowerShell telemetry and detection workflow" },
  { id: "INC-003", title: "Scheduled Task", severity: "Medium", status: "PASS", detail: "Task creation evidence and triage context" },
  { id: "INC-004", title: "Credential Access", severity: "High", status: "PARTIAL", detail: "Safe LSASS discovery evidence; expected event not observed" },
  { id: "INC-005", title: "Web Attack", severity: "High", status: "PASS", detail: "Synthetic application-security detection workflow" },
  { id: "INC-006", title: "Data Transfer", severity: "Medium", status: "PASS", detail: "Transfer evidence and integrity verification" },
];

const nav = [
  [Gauge, "Overview"],
  [Siren, "Incidents"],
  [Boxes, "Assets"],
  [Radar, "Detections"],
  [Crosshair, "Threat Intel"],
  [Network, "MITRE ATT&CK"],
  [FileSearch, "Reports"],
];

export default function DemoPage() {
  return (
    <main className="min-h-screen bg-[#020617] text-slate-100">
      <div className="grid min-h-screen lg:grid-cols-[250px_1fr]">
        <aside className="hidden border-r border-white/10 bg-[#050a16] lg:flex lg:flex-col">
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
            {nav.map(([Icon, label], index) => (
              <div
                key={String(label)}
                className={index === 0
                  ? "flex items-center gap-3 rounded-lg border border-cyan-300/15 bg-cyan-300/[.08] px-3 py-2.5 text-sm text-cyan-100"
                  : "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-400"}
              >
                <Icon className="h-4 w-4" />
                {label}
              </div>
            ))}
          </nav>

          <div className="mt-auto border-t border-white/10 p-4">
            <div className="rounded-xl border border-emerald-300/10 bg-emerald-300/[.05] p-3 text-xs text-slate-400">
              <div className="mb-1 flex items-center gap-2 text-emerald-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Demo mode
              </div>
              Synthetic, read-only evidence.
            </div>
          </div>
        </aside>

        <section className="min-w-0">
          <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 bg-[#020617]/90 px-5 py-4 backdrop-blur-xl sm:px-8">
            <div>
              <p className="text-xs uppercase tracking-[.18em] text-cyan-300">SIEM & Security Operations</p>
              <h1 className="mt-1 text-xl font-semibold">Analyst Overview</h1>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="hidden items-center gap-2 rounded-lg border border-white/10 bg-white/[.03] px-3 py-2 text-sm text-slate-500 md:flex">
                <Search className="h-4 w-4" />
                Search incidents, assets, rules...
              </div>
              <button className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/[.03] text-slate-400">
                <Bell className="h-4 w-4" />
              </button>
              <Link href="/login" className="rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300 hover:bg-white/5">
                Operator login
              </Link>
              <a href="https://github.com/mithilkg10/VYOMRIX" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm text-slate-300 hover:bg-white/5">
                GitHub <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </header>

          <div className="mx-auto max-w-[1500px] p-5 sm:p-8">
            <div className="mb-7 rounded-2xl border border-cyan-300/15 bg-cyan-300/[.04] p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-cyan-100">Recruiter-safe VYOMRIX view</p>
                  <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-400">
                    This surface mirrors the type of information an analyst would review inside VYOMRIX using sanitized Cyber Defense Lab data.
                    It intentionally disables destructive controls, private telemetry, secrets, and privileged administration.
                  </p>
                </div>
                <a href="https://mithilkg-portfolio.vercel.app/lab" target="_blank" rel="noreferrer" className="rounded-lg border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-100">
                  Open Cyber Defense Lab ↗
                </a>
              </div>
            </div>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                ["06", "Active investigation records", "5 pass · 1 partial"],
                ["10", "Sigma detection rules", "7 directly validated"],
                ["01", "Custom Wazuh rule", "Validated correlation"],
                ["05", "ATT&CK techniques", "Evidence-backed mappings"],
              ].map(([value, label, detail]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/[.03] p-5">
                  <div className="font-mono text-3xl text-cyan-300">{value}</div>
                  <div className="mt-2 text-sm font-medium text-white">{label}</div>
                  <div className="mt-1 text-xs text-slate-500">{detail}</div>
                </div>
              ))}
            </section>

            <section className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_.9fr]">
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[.02]">
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
                    {incidents.map((incident) => (
                      <div key={incident.id} className="grid grid-cols-[.8fr_1.4fr_.8fr_2fr_.8fr] gap-4 border-b border-white/[.07] px-5 py-4 last:border-0">
                        <code className="text-sm text-cyan-300">{incident.id}</code>
                        <span className="text-sm font-medium text-white">{incident.title}</span>
                        <span className={incident.severity === "High" ? "text-sm text-rose-300" : "text-sm text-amber-200"}>{incident.severity}</span>
                        <span className="text-sm text-slate-400">{incident.detail}</span>
                        <span className={incident.status === "PARTIAL"
                          ? "w-fit rounded-full border border-amber-300/20 bg-amber-300/10 px-2.5 py-1 text-xs text-amber-200"
                          : "w-fit rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2.5 py-1 text-xs text-emerald-200"}>
                          {incident.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="rounded-2xl border border-white/10 bg-white/[.02] p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <Boxes className="h-5 w-5 text-cyan-300" />
                    <h2 className="font-semibold">Assets</h2>
                  </div>
                  <div className="space-y-3 text-sm">
                    {[
                      ["win-endpoint-01", "Windows 11", "Monitored"],
                      ["web-lab-01", "Synthetic app", "Monitored"],
                      ["wazuh-manager", "SIEM", "Connected"],
                    ].map(([name, type, state]) => (
                      <div key={name} className="flex items-center justify-between rounded-xl border border-white/[.07] bg-black/20 px-4 py-3">
                        <div><div className="font-medium">{name}</div><div className="text-xs text-slate-500">{type}</div></div>
                        <span className="text-xs text-emerald-300">{state}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[.02] p-5">
                  <div className="mb-4 flex items-center gap-2">
                    <Radar className="h-5 w-5 text-cyan-300" />
                    <h2 className="font-semibold">Detection coverage</h2>
                  </div>
                  <div className="space-y-4">
                    {[
                      ["Authentication", "92%"],
                      ["PowerShell", "86%"],
                      ["Persistence", "78%"],
                      ["Application security", "84%"],
                    ].map(([name, width]) => (
                      <div key={name}>
                        <div className="mb-1 flex justify-between text-xs text-slate-400"><span>{name}</span><span>{width}</span></div>
                        <div className="h-2 overflow-hidden rounded-full bg-white/[.06]">
                          <div className="h-full rounded-full bg-cyan-300/70" style={{ width }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 text-[11px] leading-5 text-slate-500">
                    Demo visualization only; these bars are presentation summaries, not production detection-performance claims.
                  </p>
                </div>
              </div>
            </section>

            <section className="mt-6 grid gap-6 lg:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[.02] p-5">
                <div className="mb-4 flex items-center gap-2"><Crosshair className="h-5 w-5 text-cyan-300" /><h2 className="font-semibold">Threat intelligence</h2></div>
                <div className="space-y-3 text-sm text-slate-400">
                  <div className="rounded-xl border border-white/[.07] bg-black/20 p-4"><span className="text-white">IOC enrichment</span><br />Provider-backed enrichment boundary documented.</div>
                  <div className="rounded-xl border border-white/[.07] bg-black/20 p-4"><span className="text-white">Analyst context</span><br />Incidents can be linked to intelligence and ATT&CK context.</div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[.02] p-5">
                <div className="mb-4 flex items-center gap-2"><Network className="h-5 w-5 text-cyan-300" /><h2 className="font-semibold">MITRE ATT&CK</h2></div>
                <div className="flex flex-wrap gap-2">
                  {["Valid Accounts", "PowerShell", "Scheduled Task", "Credential Access", "Exfiltration"].map((item) => (
                    <span key={item} className="rounded-lg border border-cyan-300/10 bg-cyan-300/[.05] px-3 py-2 text-xs text-cyan-100">{item}</span>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[.02] p-5">
                <div className="mb-4 flex items-center gap-2"><Users className="h-5 w-5 text-cyan-300" /><h2 className="font-semibold">Access model</h2></div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between border-b border-white/[.06] pb-3"><span className="text-slate-400">Recruiter demo</span><span className="text-cyan-200">Read-only</span></div>
                  <div className="flex justify-between border-b border-white/[.06] pb-3"><span className="text-slate-400">SOC Analyst</span><span className="text-slate-300">RBAC</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Super Admin</span><span className="text-slate-300">Private</span></div>
                </div>
              </div>
            </section>

            <footer className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-slate-500">
              <span>VYOMRIX recruiter-safe demo · synthetic Cyber Defense Lab data</span>
              <div className="flex gap-4">
                <Link href="/login" className="text-slate-300 hover:text-white">Operator login</Link>
                <a href="https://mithilkg-portfolio.vercel.app/projects/vyomrix-security-platform" target="_blank" rel="noreferrer" className="text-slate-300 hover:text-white">Portfolio case study ↗</a>
              </div>
            </footer>
          </div>
        </section>
      </div>
    </main>
  );
}
