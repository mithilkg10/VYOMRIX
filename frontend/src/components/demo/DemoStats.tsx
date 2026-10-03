import { demoStats } from "./demo-data";

export function DemoStats() {
  return (
    <section id="overview" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {demoStats.map((item) => (
        <div key={item.label} className="rounded-2xl border border-white/10 bg-white/[.03] p-5">
          <div className="font-mono text-3xl text-cyan-300">{item.value}</div>
          <div className="mt-2 text-sm font-medium text-white">{item.label}</div>
          <div className="mt-1 text-xs text-slate-500">{item.detail}</div>
        </div>
      ))}
    </section>
  );
}
