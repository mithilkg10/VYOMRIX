import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function StatusBadge({ status, children }: { status: "neutral" | "success" | "warning" | "danger" | "info"; children: React.ReactNode }) {
  const styles = { neutral: "bg-muted text-muted-foreground", success: "bg-success/15 text-success", warning: "bg-warning/15 text-warning", danger: "bg-destructive/15 text-destructive", info: "bg-info/15 text-info" };
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold", styles[status])}>{children}</span>;
}
export function SearchInput({ label = "Search", className, ...props }: React.ComponentProps<typeof Input> & { label?: string }) {
  const id = props.id ?? "search-input";
  return <div className={cn("relative", className)}><label className="sr-only" htmlFor={id}>{label}</label><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" /><Input id={id} type="search" className="pl-9" {...props} /></div>;
}
export function FilterBar({ children }: { children: React.ReactNode }) { return <div className="panel flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">{children}</div>; }
export function DataTableShell({ children, caption }: { children: React.ReactNode; caption?: string }) { return <div className="panel overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm">{caption && <caption className="sr-only">{caption}</caption>}{children}</table></div></div>; }
export function ChartContainer({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) { return <section className={cn("panel p-5", className)} aria-label={title}><h2 className="text-base font-semibold">{title}</h2><div className="mt-4 min-h-56">{children}</div></section>; }
export function DateTimeDisplay({ value }: { value: Date | string }) { const date = typeof value === "string" ? new Date(value) : value; return <time dateTime={date.toISOString()}>{new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date)}</time>; }
export function ActivityTimeline({ items }: { items: Array<{ title: string; description: string; time: string; tone?: "default" | "danger" | "warning" | "success" }> }) { return <ol className="space-y-4">{items.map((item) => <li key={item.title + item.time} className="relative border-l pl-5"><span className={cn("absolute -left-1.5 top-1 h-3 w-3 rounded-full bg-primary", item.tone === "danger" && "bg-destructive", item.tone === "warning" && "bg-warning", item.tone === "success" && "bg-success")} /><p className="text-sm font-medium">{item.title}</p><p className="mt-1 text-xs text-muted-foreground">{item.description} · {item.time}</p></li>)}</ol>; }
