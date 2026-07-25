import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { AlertCircle, AlertTriangle, Inbox, LoaderCircle, PlugZap, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type StateTone = "muted" | "danger" | "warning";

type StatePanelProps = {
  title: string;
  description: string;
  action?: ReactNode;
  compact?: boolean;
  icon?: LucideIcon;
  technicalDetail?: string;
  tone?: StateTone;
  role?: "alert" | "status";
};

function StatePanel({ action, compact = false, description, icon: Icon, role = "status", technicalDetail, title, tone = "muted" }: StatePanelProps) {
  const iconStyles = tone === "danger" ? "bg-destructive/10 text-destructive" : tone === "warning" ? "bg-warning/10 text-warning" : "bg-muted text-muted-foreground";

  return <section className={cn("panel flex flex-col items-center justify-center p-6 text-center", compact ? "min-h-36" : "min-h-52")} role={role} aria-live={role === "status" ? "polite" : undefined}>
    {Icon && <div className={cn("rounded-full p-3", iconStyles)}><Icon className="h-6 w-6" aria-hidden="true" /></div>}
    <h2 className={cn("font-semibold", Icon && "mt-4")}>{title}</h2>
    <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
    {technicalDetail && <details className="mt-3 max-w-md text-left text-xs text-muted-foreground"><summary className="cursor-pointer font-medium text-foreground">Technical details</summary><p className="mt-2 break-words">{technicalDetail}</p></details>}
    {action && <div className="mt-5">{action}</div>}
  </section>;
}

export function LoadingState({ label = "Loading security data…", compact = false, skeleton }: { label?: string; compact?: boolean; skeleton?: ReactNode }) {
  if (skeleton) return <div role="status" aria-label={label} aria-live="polite">{skeleton}<span className="sr-only">{label}</span></div>;
  return <div className={cn("panel flex items-center justify-center gap-3 p-6 text-sm text-muted-foreground", compact ? "min-h-24" : "min-h-52")} role="status" aria-live="polite"><LoaderCircle className="h-5 w-5 animate-spin text-primary" aria-hidden="true" />{label}</div>;
}

export function StateSkeleton({ className }: { className?: string }) {
  return <div className={cn("panel space-y-4 p-5", className)} aria-hidden="true"><Skeleton className="h-5 w-40" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-3/4" /></div>;
}

export function EmptyState({ icon = Inbox, ...props }: Omit<StatePanelProps, "tone" | "role" | "icon"> & { icon?: LucideIcon }) {
  return <StatePanel icon={icon} {...props} />;
}

export function ErrorState({ onRetry, retryLabel = "Try again", ...props }: Omit<StatePanelProps, "action" | "icon" | "role" | "tone"> & { onRetry?: () => void; retryLabel?: string }) {
  return <StatePanel icon={AlertCircle} tone="danger" role="alert" action={onRetry && <Button variant="outline" onClick={onRetry}>{retryLabel}</Button>} {...props} />;
}

export function UnauthorizedState({ action, compact, description = "Your account is not authorized to access this information.", title = "Access unavailable" }: { action?: ReactNode; compact?: boolean; description?: string; title?: string }) {
  return <StatePanel icon={ShieldAlert} tone="danger" role="alert" title={title} description={description} action={action} compact={compact} />;
}

export function IntegrationUnavailableState({ action, compact, guidance, integrationName, reason, technicalDetail }: { action?: ReactNode; compact?: boolean; guidance: string; integrationName: string; reason: string; technicalDetail?: string }) {
  return <StatePanel icon={PlugZap} tone="warning" title={`${integrationName} unavailable`} description={`${reason} ${guidance}`} action={action} compact={compact} technicalDetail={technicalDetail} />;
}

export function PartialDataState({ compact, description = "Some sources could not be loaded. Available information remains visible.", failedSources, title = "Partial data available" }: { compact?: boolean; description?: string; failedSources?: string[]; title?: string }) {
  const sourceDescription = failedSources?.length ? `${description} Unavailable sources: ${failedSources.join(", ")}.` : description;
  return <StatePanel icon={AlertTriangle} tone="warning" title={title} description={sourceDescription} compact={compact} />;
}

export function StatusMessage({ children }: { children: ReactNode }) { return <p className="sr-status" role="status" aria-live="polite">{children}</p>; }
