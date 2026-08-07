"use client";

import { useState, useTransition, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { AlertCircle, ShieldCheck, CheckCircle2, EyeOff, Eye } from "lucide-react";
import { resetPasswordAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

import { Suspense } from "react";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Invalid or missing reset token. Please request a new password reset link.");
    }
  }, [token]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await resetPasswordAction(formData);
      if (result?.error) setError(result.error);
      if (result?.success) setSuccess(result.success);
    });
  };

  return (
    <section className="w-full max-w-md rounded-2xl border border-sky-200/15 bg-card/85 p-1 shadow-2xl shadow-slate-950/40 backdrop-blur-xl">
      <div className="rounded-[0.9rem] border border-white/5 bg-background/35 p-6 sm:p-8">
        <div className="mb-7 space-y-3">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[.16em] text-cyan-300">
            <ShieldCheck className="h-4 w-4" /> Account Security
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">Create new password</h1>
          <p className="text-sm leading-6 text-muted-foreground">
            Enter your new password below. Ensure it meets the enterprise security requirements.
          </p>
        </div>

        {success ? (
          <div className="space-y-6">
            <div role="alert" className="flex items-start gap-3 rounded-xl border border-success/30 bg-success/10 p-4 text-sm text-success">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
              <p>{success}</p>
            </div>
            <Link href="/login" className="flex items-center justify-center w-full h-11 rounded-md border border-border bg-surface-sunken hover:bg-surface-elevated text-sm font-medium transition-colors">
              Continue to Sign In
            </Link>
          </div>
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit} noValidate>
            <input type="hidden" name="token" value={token || ""} />
            {error && (
              <div role="alert" className="flex gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="new_password">New Password</Label>
              <div className="relative">
                <Input id="new_password" name="new_password" type={showPassword ? "text" : "password"} autoComplete="new-password" required disabled={isPending || !token} className="h-11 bg-background/60 pr-11" />
                <Button type="button" variant="ghost" size="icon-sm" className="absolute right-1 top-1" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff /> : <Eye />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm_password">Confirm Password</Label>
              <Input id="confirm_password" name="confirm_password" type={showPassword ? "text" : "password"} autoComplete="new-password" required disabled={isPending || !token} className="h-11 bg-background/60" />
            </div>

            <Button className="h-11 w-full bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500 font-semibold text-slate-950 hover:opacity-90" type="submit" disabled={isPending || !token}>
              {isPending ? "Resetting password..." : "Reset password"}
            </Button>
          </form>
        )}
      </div>
    </section>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
