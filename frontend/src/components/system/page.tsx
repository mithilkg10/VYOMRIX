import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function PageContainer({ children, className }: { children: React.ReactNode; className?: string }) { return <div className={cn("app-page space-y-6 sm:space-y-8", className)}>{children}</div>; }
export function PageActions({ children }: { children: React.ReactNode }) { return <div className="flex flex-wrap items-center gap-2 sm:justify-end">{children}</div>; }
export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) { return <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1 overflow-hidden text-xs text-muted-foreground">{items.map((item, index) => <span className="flex min-w-0 items-center gap-1" key={item.label}><span className="truncate">{item.label}</span>{index < items.length - 1 && <span aria-hidden="true">/</span>}</span>)}</nav>; }
export function ContentGrid({ children, className }: { children: React.ReactNode; className?: string }) { return <div className={cn("grid gap-4 sm:gap-6", className)}>{children}</div>; }

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return <header className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-end sm:justify-between">
    <div className="min-w-0 space-y-1.5"><h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>{description && <p className="max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">{description}</p>}</div>
    {actions && <PageActions>{actions}</PageActions>}
  </header>;
}

export function SectionHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return <div className="flex items-start justify-between gap-4"><div><h2 className="text-base font-semibold">{title}</h2>{description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}</div>{actions}</div>;
}

export function MetricCard({ label, value, detail, icon: Icon, tone = "default" }: { label: string; value: string; detail?: React.ReactNode; icon: LucideIcon; tone?: "default" | "success" | "warning" | "danger" | "info" }) {
  const color = { default: "text-muted-foreground", success: "text-success", warning: "text-warning", danger: "text-destructive", info: "text-info" }[tone];
  return <Card className="panel gap-3 py-4"><CardHeader className="flex flex-row items-center justify-between px-4 pb-0"><CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle><Icon className={cn("h-4 w-4", color)} aria-hidden="true" /></CardHeader><CardContent className="px-4"><div className={cn("text-2xl font-semibold tracking-tight", tone === "danger" && "text-destructive")}>{value}</div>{detail && <p className="mt-1 text-xs text-muted-foreground">{detail}</p>}</CardContent></Card>;
}
