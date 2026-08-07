"use client";

import { useIncidents } from "@/lib/api/incidents";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDistanceToNow } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldAlert, AlertTriangle, Info, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

function getSeverityIcon(severity: string) {
  switch (severity) {
    case "Critical": return <ShieldAlert className="h-4 w-4 text-destructive" />;
    case "High": return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    case "Medium": return <Info className="h-4 w-4 text-amber-500" />;
    case "Low": return <ShieldCheck className="h-4 w-4 text-blue-500" />;
    default: return <Info className="h-4 w-4" />;
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case "Open": return "bg-destructive/10 text-destructive hover:bg-destructive/20";
    case "In Progress": return "bg-orange-500/10 text-orange-500 hover:bg-orange-500/20";
    case "Contained": return "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20";
    case "Resolved": return "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20";
    case "Closed": return "bg-slate-500/10 text-slate-500 hover:bg-slate-500/20";
    default: return "bg-primary/10 text-primary";
  }
}

export function IncidentList({ onSelect }: { onSelect: (id: string) => void }) {
  const { status, data, error, refresh } = useIncidents();

  if (status === "loading") {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (status === "error" || status === "unavailable" || status === "unauthorized") {
    return (
      <div className="flex h-64 flex-col items-center justify-center space-y-4 rounded-lg border border-dashed p-8 text-center">
        <ShieldAlert className="h-12 w-12 text-muted-foreground/50" />
        <div className="space-y-1">
          <h3 className="text-lg font-medium">Failed to load incidents</h3>
          <p className="text-sm text-muted-foreground">{error?.message || "An unknown error occurred"}</p>
        </div>
        <Button variant="outline" onClick={refresh}>Try Again</Button>
      </div>
    );
  }

  if (status === "empty" || !data?.items?.length) {
    return (
      <div className="flex h-64 flex-col items-center justify-center space-y-4 rounded-lg border border-dashed p-8 text-center">
        <ShieldCheck className="h-12 w-12 text-muted-foreground/50" />
        <div className="space-y-1">
          <h3 className="text-lg font-medium">No incidents found</h3>
          <p className="text-sm text-muted-foreground">Your environment is currently secure.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]"></TableHead>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Severity</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.items.map((incident) => (
            <TableRow 
              key={incident.id} 
              className="cursor-pointer transition-colors hover:bg-muted/50"
              onClick={() => onSelect(incident.id)}
            >
              <TableCell>
                {getSeverityIcon(incident.severity)}
              </TableCell>
              <TableCell className="font-medium">
                {incident.title}
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className={getStatusColor(incident.status)}>
                  {incident.status}
                </Badge>
              </TableCell>
              <TableCell>{incident.severity}</TableCell>
              <TableCell className="text-muted-foreground">
                {formatDistanceToNow(new Date(incident.created_at), { addSuffix: true })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
