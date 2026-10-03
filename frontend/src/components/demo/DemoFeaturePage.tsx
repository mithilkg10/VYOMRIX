import Link from "next/link";
import { ArrowRight, Info, ShieldCheck } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/system/page";
import type { DemoFeatureConfig } from "@/lib/demo-feature-config";

export function DemoFeaturePage({ config }: { config: DemoFeatureConfig }) {
  return (
    <PageContainer>
      <PageHeader title={config.title} description={config.description} />

      <div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/[.035] p-5">
        <div className="flex items-center gap-2 text-sm font-medium text-cyan-100">
          <ShieldCheck className="h-4 w-4" />
          {config.status}
        </div>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{config.boundary}</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {config.metrics.map((metric) => (
          <div key={metric.label} className="panel p-5">
            <div className="font-mono text-3xl text-primary">{metric.value}</div>
            <div className="mt-2 font-medium">{metric.label}</div>
            <div className="mt-1 text-sm text-muted-foreground">{metric.detail}</div>
          </div>
        ))}
      </section>

      <section className="panel overflow-hidden">
        <div className="border-b p-5">
          <h2 className="font-semibold">What is happening on this page?</h2>
          <p className="mt-1 text-sm text-muted-foreground">The records below are synchronized with the same recruiter-demo security story used across VYOMRIX.</p>
        </div>
        <div className="divide-y">
          {config.records.map((record) => (
            <div key={record.title} className="grid gap-3 p-5 md:grid-cols-[1fr_auto] md:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-medium">{record.title}</h3>
                  <span className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">{record.tag}</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{record.detail}</p>
              </div>
              {record.link && (
                <Link href={record.link} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                  Follow evidence <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="panel p-5">
        <div className="mb-3 flex items-center gap-2">
          <Info className="h-4 w-4 text-primary" />
          <h2 className="font-semibold">Continue the investigation</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {config.related.map((item) => (
            <Link key={item.href} href={item.href} className="rounded-lg border px-3 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground">
              {item.label}
            </Link>
          ))}
        </div>
      </section>
    </PageContainer>
  );
}
