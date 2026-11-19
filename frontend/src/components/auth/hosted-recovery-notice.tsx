import Link from "next/link";
import { ArrowLeft, KeyRound } from "lucide-react";
import { HOSTED_RESET_MESSAGE } from "@/lib/hosting";

export function HostedRecoveryNotice() {
  return (
    <section className="w-full max-w-md rounded-2xl border border-sky-200/15 bg-card/85 p-1 shadow-2xl shadow-slate-950/40 backdrop-blur-xl">
      <div className="space-y-6 rounded-[0.9rem] border border-white/5 bg-background/35 p-6 sm:p-8">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[.16em] text-cyan-300">
            <KeyRound className="h-4 w-4" /> Account recovery
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Password reset</h1>
          <p className="text-sm leading-6 text-muted-foreground">{HOSTED_RESET_MESSAGE}</p>
        </div>
        <Link href="/login" className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-border bg-background/60 text-sm font-medium transition-colors hover:bg-muted">
          <ArrowLeft className="h-4 w-4" /> Back to sign in
        </Link>
      </div>
    </section>
  );
}
