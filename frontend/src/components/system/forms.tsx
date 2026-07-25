import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function FormField({ id, label, description, error, children }: { id: string; label: string; description?: string; error?: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label htmlFor={id}>{label}</Label>{children}{description && !error && <p className="text-xs text-muted-foreground">{description}</p>}{error && <p className="text-xs text-destructive" role="alert">{error}</p>}</div>;
}

export function Pagination({ page, totalPages, onPageChange }: { page: number; totalPages: number; onPageChange: (page: number) => void }) {
  return <nav className="flex items-center justify-between gap-3 text-sm" aria-label="Pagination"><p className="text-muted-foreground">Page {page} of {totalPages}</p><div className="flex gap-2"><Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}><ChevronLeft />Previous</Button><Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>Next<ChevronRight /></Button></div></nav>;
}

export function FormGrid({ children, className }: { children: React.ReactNode; className?: string }) { return <div className={cn("grid gap-4 sm:grid-cols-2", className)}>{children}</div>; }
