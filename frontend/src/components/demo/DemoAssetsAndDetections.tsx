import { Boxes, Radar } from "lucide-react";
import { demoAssets, demoDetections } from "./demo-data";

export function DemoAssetsAndDetections() {
  return (
    <section className="mt-6 grid gap-6 xl:grid-cols-2">
      <div id="assets" className="rounded-2xl border border-white/10 bg-white/[.02] p-5">
        <div className="mb-4 flex items-center gap-2">
          <Boxes className="h-5 w-5 text-cyan-300" />
          <h2 className="font-semibold">Assets</h2>
        </div>
        <div className="space-y-3">
          {demoAssets.map((asset) => (
            <div key={asset.name} className="flex items-center justify-between rounded-xl border border-white/[.07] bg-black/20 px-4 py-3">
              <div>
                <div className="text-sm font-medium text-white">{asset.name}</div>
                <div className="mt-0.5 text-xs text-slate-500">{asset.type}</div>
              </div>
              <span className="text-xs text-emerald-300">{asset.state}</span>
            </div>
          ))}
        </div>
      </div>

      <div id="detections" className="rounded-2xl border border-white/10 bg-white/[.02] p-5">
        <div className="mb-4 flex items-center gap-2">
          <Radar className="h-5 w-5 text-cyan-300" />
          <h2 className="font-semibold">Detection validation</h2>
        </div>
        <div className="space-y-3">
          {demoDetections.map((item) => (
            <div key={item.name} className="flex items-center justify-between rounded-xl border border-white/[.07] bg-black/20 px-4 py-3">
              <span className="text-sm text-slate-300">{item.name}</span>
              <span className={item.state === "Partial" ? "text-xs text-amber-200" : "text-xs text-emerald-300"}>
                {item.state}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
