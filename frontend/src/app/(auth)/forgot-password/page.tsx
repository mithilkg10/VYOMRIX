"use client";

import { useState, useTransition } from "react";
import { AlertCircle, ShieldCheck, MailCheck, ArrowLeft } from "lucide-react";
import { authApi } from "@/lib/api/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      try {
        const result = await authApi.forgotPassword(formData.get("email") as string);
        setSuccess(result.message);
      } catch (err: any) {
        setError(err.message || "An error occurred");
      }
    });
  };

  return (
    <section className="w-full max-w-md rounded-2xl border border-sky-200/15 bg-card/85 p-1 shadow-2xl shadow-slate-950/40 backdrop-blur-xl">
      <div className="rounded-[0.9rem] border border-white/5 bg-background/35 p-6 sm:p-8">
        <div className="mb-7 space-y-3">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[.16em] text-cyan-300">
            <ShieldCheck className="h-4 w-4" /> Account Recovery
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Forgot password?</h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Enter your work email address to receive a secure password reset link.
          </p>
        </div>

        {success ? (
          <div className="space-y-6">
            <div role="alert" className="flex items-start gap-3 rounded-xl border border-success/30 bg-success/10 p-4 text-sm text-success">
              <MailCheck className="mt-0.5 h-5 w-5 shrink-0" />
              <p>{success}</p>
            </div>
            <Link href="/login" className="flex items-center justify-center w-full h-11 rounded-md border border-border bg-surface-sunken hover:bg-surface-elevated text-sm font-medium transition-colors">
              Return to Sign In
            </Link>
          </div>
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            {error && (
              <div role="alert" className="flex gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Work email</Label>
              <Input id="email" name="email" type="email" autoComplete="email" placeholder="name@company.com" required disabled={isPending} className="h-11 bg-background/60" />
            </div>
            <Button className="h-11 w-full bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500 font-semibold text-slate-950 hover:opacity-90" type="submit" disabled={isPending}>
              {isPending ? "Sending request..." : "Send reset link"}
            </Button>
            
            <div className="pt-2 text-center">
              <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors">
                <ArrowLeft className="h-4 w-4" /> Back to sign in
              </Link>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
