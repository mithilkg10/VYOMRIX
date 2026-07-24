"use client";

import { ArrowLeft, CalendarClock, Construction, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type UnderDevelopmentProps = { title: string; description: string; plannedCapabilities: string[] };

export function UnderDevelopment({ title, description, plannedCapabilities }: UnderDevelopmentProps) {
  const router = useRouter();
  return (
    <section className="mx-auto flex min-h-full w-full max-w-3xl flex-col justify-center py-8 animate-in fade-in zoom-in duration-500" aria-labelledby="module-title">
      <div className="rounded-xl border bg-card p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10"><Construction className="h-6 w-6 text-primary" aria-hidden="true" /></div>
        <p className="mb-2 text-sm font-medium text-primary">Enterprise module</p>
        <h1 id="module-title" className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">{description}</p>
        <div className="mt-8 grid gap-6 border-y py-6 sm:grid-cols-[1fr_auto] sm:items-center">
          <div><h2 className="flex items-center gap-2 font-medium"><ShieldCheck className="h-4 w-4 text-success" aria-hidden="true" />Planned functionality</h2><ul className="mt-3 space-y-2 text-sm text-muted-foreground">{plannedCapabilities.map((capability) => <li key={capability}>{capability}</li>)}</ul></div>
          <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground"><CalendarClock className="h-4 w-4" aria-hidden="true" />Delivery planned in a future release</div>
        </div>
        <div className="mt-6"><Button variant="outline" onClick={() => router.push("/")}><ArrowLeft className="mr-2 h-4 w-4" />Back to Dashboard</Button></div>
      </div>
    </section>
  );
}
