"use client";

import { useState, useTransition } from "react";
import { AlertCircle, Eye, EyeOff, LockKeyhole, ShieldCheck } from "lucide-react";
import { authApi } from "@/lib/api/auth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => { 
    event.preventDefault(); 
    setError(null); 
    const formData = new FormData(event.currentTarget); 
    const params = new URLSearchParams();
    params.append("email", formData.get("email") as string);
    params.append("password", formData.get("password") as string);
    
    startTransition(async () => { 
      try {
        await authApi.login(params);
        router.push("/");
      } catch (err: any) {
        setError(err.message || "Invalid credentials");
      }
    }); 
  };
  return <section className="w-full max-w-md rounded-2xl border border-sky-200/15 bg-card/85 p-1 shadow-2xl shadow-slate-950/40 backdrop-blur-xl">
    <div className="rounded-[0.9rem] border border-white/5 bg-background/35 p-6 sm:p-8">
      <div className="mb-7 space-y-3"><div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[.16em] text-cyan-300"><ShieldCheck className="h-4 w-4" /> Secure operator access</div><h1 className="text-3xl font-semibold tracking-tight">Sign in to <span className="gradient-text">MKG SOC</span></h1><p className="text-sm leading-6 text-muted-foreground">Access the security operations workspace and its protected telemetry.</p></div>
      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        {error && <div role="alert" className="flex gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />{error}</div>}
        <div className="space-y-2"><Label htmlFor="email">Work email</Label><Input id="email" name="email" type="email" autoComplete="email" placeholder="name@company.com" required disabled={isPending} className="h-11 bg-background/60" /></div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/forgot-password" className="text-xs font-medium text-primary hover:underline">Forgot password?</Link>
          </div>
          <div className="relative"><Input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required disabled={isPending} className="h-11 bg-background/60 pr-11" /><Button type="button" variant="ghost" size="icon-sm" className="absolute right-1 top-1" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff /> : <Eye />}</Button></div>
        </div>
        <Button className="h-11 w-full bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500 font-semibold text-slate-950 hover:opacity-90" type="submit" disabled={isPending}>{isPending ? "Authenticating..." : "Sign in securely"}</Button>
      </form>
      <div className="mt-6 flex items-center gap-2 border-t border-border pt-4 text-xs text-muted-foreground"><LockKeyhole className="h-3.5 w-3.5 text-success" /> Session cookies are protected and scoped to this platform.</div>
    </div>
  </section>;
}
