"use client";

import { type ReactNode, useMemo, useState } from "react";
import { RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { EmptyState, ErrorState, IntegrationUnavailableState, LoadingState, UnauthorizedState } from "@/components/system/feedback";
import { PageContainer, PageHeader, MetricCard } from "@/components/system/page";
import { StatusBadge } from "@/components/system/data-display";
import { INCIDENT_SEVERITIES, INCIDENT_STATUSES, Incident, IncidentSeverity, IncidentStatus, useIncidents } from "@/lib/api/incidents";

const severityStatus = (value: Incident["severity"]) =>
  value === "Critical" ? "danger" : value === "High" ? "warning" : value === "Medium" ? "info" : "success";

const formatTimestamp = (value: string) => new Date(value).toLocaleString();

export default function IncidentsPage() {
  const [query, setQuery] = useState("");
  const [severity, setSeverity] = useState<IncidentSeverity | undefined>(undefined);
  const [incidentStatus, setIncidentStatus] = useState<IncidentStatus | undefined>(undefined);
  const [sort, setSort] = useState<"updated_at" | "created_at" | "severity">("updated_at");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Incident | null>(null);

  const pageSize = 10;
  const skip = (page - 1) * pageSize;

  const { data, status, refresh } = useIncidents(skip, pageSize, incidentStatus, severity);
  const incidents = data?.items || [];
  const total = data?.total || 0;

  const filtered = useMemo(
    () =>
      incidents
        .filter(
          (item) =>
            [item.id, item.title, item.assigned_analyst ?? ""].join(" ").toLowerCase().includes(query.toLowerCase()),
        )
        .sort((a, b) =>
          sort === "severity"
            ? ["Low", "Medium", "High", "Critical"].indexOf(b.severity) - ["Low", "Medium", "High", "Critical"].indexOf(a.severity)
            : new Date(b[sort]).getTime() - new Date(a[sort]).getTime(),
        ),
    [incidents, query, sort],
  );

  const pageCount = Math.ceil(total / pageSize);
  const activePage = pageCount ? Math.min(page, pageCount) : 1;
  const rows = filtered; // Sorting is client side on current page items

  const clear = () => {
    setQuery("");
    setSeverity(undefined);
    setIncidentStatus(undefined);
    setPage(1);
  };
  const openIncident = (incident: Incident) => setSelected(incident);

  if (status === "loading" && !incidents.length) return <PageContainer><LoadingState label="Loading incident queue..." /></PageContainer>;
  if (status === "unauthorized") return <PageContainer><UnauthorizedState title="Session expired" description="Sign in again to access incident data." /></PageContainer>;
  if (status === "unavailable") return <PageContainer><IntegrationUnavailableState integrationName="Incident service" reason="The service did not respond." guidance="Verify service health and try again." action={<Button variant="outline" onClick={() => void refresh()}>Retry</Button>} /></PageContainer>;
  if (status === "error") return <PageContainer><ErrorState title="Incident data unavailable" description="The incident response could not be loaded. Try again." onRetry={() => void refresh()} /></PageContainer>;

  const open = incidents.filter((item) => !["Resolved", "Closed"].includes(item.status)).length;
  const priority = incidents.filter((item) => ["Critical", "High"].includes(item.severity)).length;
  const resolved = incidents.filter((item) => item.status === "Resolved").length;

  return (
    <PageContainer>
      <PageHeader
        title="Incident Response"
        description="Live investigation records from the incident service."
        actions={<Button variant="outline" onClick={() => void refresh()}><RefreshCw className={status === "loading" ? "animate-spin" : ""} />Refresh</Button>}
      />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Loaded incidents" value={String(incidents.length)} icon={RefreshCw} />
        <MetricCard label="Open in results" value={String(open)} icon={RefreshCw} tone="warning" />
        <MetricCard label="Critical / high in results" value={String(priority)} icon={RefreshCw} tone="danger" />
        <MetricCard label="Resolved in results" value={String(resolved)} icon={RefreshCw} tone="success" />
      </section>
      <section className="panel p-4 sm:p-5">
        <div className="flex flex-wrap gap-2">
          <Input className="min-w-48 flex-1" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Search ID, title, or assigned analyst" aria-label="Search loaded incidents" />
          <select className="h-10 rounded-md border bg-background px-3 text-sm" value={severity || "All"} onChange={(event) => { setSeverity(event.target.value === "All" ? undefined : event.target.value as IncidentSeverity); setPage(1); }} aria-label="Filter severity">
            <option>All</option>{INCIDENT_SEVERITIES.map((value) => <option key={value}>{value}</option>)}
          </select>
          <select className="h-10 rounded-md border bg-background px-3 text-sm" value={incidentStatus || "All"} onChange={(event) => { setIncidentStatus(event.target.value === "All" ? undefined : event.target.value as IncidentStatus); setPage(1); }} aria-label="Filter status">
            <option>All</option>{INCIDENT_STATUSES.map((value) => <option key={value}>{value}</option>)}
          </select>
          <Button variant="ghost" onClick={clear}>Clear</Button>
        </div>
        {!filtered.length ? <EmptyState title="No incidents found" description="No incident records match the current filters." /> : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="border-b text-left text-xs text-muted-foreground"><tr><th className="p-3">ID</th><th className="p-3">Title</th><th className="p-3"><button onClick={() => setSort("severity")}>Severity</button></th><th className="p-3">Status</th><th className="p-3">Analyst</th><th className="p-3"><button onClick={() => setSort("updated_at")}>Updated</button></th></tr></thead>
              <tbody>{rows.map((item) => (
                <tr
                  key={item.id}
                  className="cursor-pointer border-b transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none"
                  tabIndex={0}
                  role="button"
                  aria-label={`Open incident ${item.id}`}
                  onClick={() => openIncident(item)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      openIncident(item);
                    }
                  }}
                >
                  <td className="p-3 font-mono text-xs">{item.id}</td><td className="max-w-80 p-3 font-medium">{item.title}</td><td className="p-3"><StatusBadge status={severityStatus(item.severity)}>{item.severity}</StatusBadge></td><td className="p-3"><StatusBadge status={item.status === "Resolved" || item.status === "Closed" ? "success" : "warning"}>{item.status}</StatusBadge></td><td className="p-3 text-muted-foreground">{item.assigned_analyst ?? "Unavailable"}</td><td className="p-3 font-mono text-xs text-muted-foreground">{formatTimestamp(item.updated_at)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
        {total > pageSize && <div className="mt-4 flex items-center justify-between"><span className="text-sm text-muted-foreground">Page {activePage} of {pageCount}</span><div className="flex gap-2"><Button size="sm" variant="outline" disabled={activePage === 1} onClick={() => setPage(activePage - 1)}>Previous</Button><Button size="sm" variant="outline" disabled={activePage >= pageCount} onClick={() => setPage(activePage + 1)}>Next</Button></div></div>}
      </section>
      <Dialog open={selected !== null} onOpenChange={(isOpen) => { if (!isOpen) setSelected(null); }}>
        <DialogContent className="right-0 left-auto top-0 h-dvh w-[min(100vw,32rem)] max-w-none translate-x-0 translate-y-0 overflow-y-auto rounded-none border-y-0 border-r-0 p-0 sm:w-[min(92vw,36rem)]">
          {selected && <>
            <DialogHeader className="sticky top-0 z-10 border-b bg-background/95 p-5 backdrop-blur">
              <div className="flex items-start justify-between gap-4 pr-10">
                <div className="min-w-0"><DialogTitle className="break-words">{selected.title || selected.id}</DialogTitle><DialogDescription className="mt-1 font-mono text-xs">Incident details</DialogDescription></div>
                <DialogClose render={<Button variant="ghost" size="icon" aria-label="Close incident details"><X aria-hidden="true" /></Button>} />
              </div>
            </DialogHeader>
            <div className="space-y-5 p-5 text-sm">
              <dl className="space-y-4">
                <Detail label="Incident ID" value={selected.id} mono />
                <Detail label="Title" value={selected.title} />
                <Detail label="Severity" value={<StatusBadge status={severityStatus(selected.severity)}>{selected.severity}</StatusBadge>} />
                <Detail label="Status" value={<StatusBadge status={selected.status === "Resolved" || selected.status === "Closed" ? "success" : "warning"}>{selected.status}</StatusBadge>} />
                <Detail label="Description" value={selected.description || "Not provided"} muted={!selected.description} />
                <Detail label="Assigned analyst" value={selected.assigned_analyst ?? "Not provided"} muted={!selected.assigned_analyst} />
                <Detail label="Created" value={formatTimestamp(selected.created_at)} mono />
                <Detail label="Updated" value={formatTimestamp(selected.updated_at)} mono />
                {selected.closed_at && <Detail label="Closed" value={formatTimestamp(selected.closed_at)} mono />}
              </dl>
              <IncidentContext incident={selected} />
            </div>
          </>}
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}

function Detail({ label, value, mono = false, muted = false }: { label: string; value: ReactNode; mono?: boolean; muted?: boolean }) {
  return <div className="grid gap-1 border-b border-border/60 pb-4 last:border-0 last:pb-0"><dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt><dd className={`min-w-0 break-words ${mono ? "font-mono text-xs" : ""} ${muted ? "text-muted-foreground" : ""}`}>{value}</dd></div>;
}

function IncidentContext({ incident }: { incident: Incident }) {
  const context = [
    { label: "Related assets", values: incident.related_assets },
    { label: "MITRE tactics", values: incident.related_mitre_tactics },
  ];
  return <div className="space-y-5"><section><h3 className="text-sm font-semibold">Investigation context</h3>{context.map((item) => <div className="mt-3" key={item.label}><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{item.label}</p>{item.values.length ? <ul className="mt-2 flex flex-wrap gap-2">{item.values.map((value) => <li className="rounded-md border bg-muted/40 px-2 py-1 font-mono text-xs" key={value}>{value}</li>)}</ul> : <p className="mt-1 text-sm text-muted-foreground">Not provided</p>}</div>)}</section>{incident.timeline.length > 0 && <section><h3 className="text-sm font-semibold">Timeline</h3><ol className="mt-3 space-y-3">{incident.timeline.map((event) => <li className="border-l pl-3" key={event.id}><p className="text-sm font-medium">{event.description}</p><p className="mt-1 text-xs text-muted-foreground">{event.source} · {formatTimestamp(event.timestamp)}</p></li>)}</ol></section>}{incident.evidence.length > 0 && <section><h3 className="text-sm font-semibold">Evidence</h3><ul className="mt-3 space-y-2">{incident.evidence.map((item) => <li className="rounded-md border p-3" key={item.id}><p className="font-medium">{item.name}</p><p className="mt-1 text-xs text-muted-foreground">{item.type} · Added {formatTimestamp(item.uploaded_at)}</p></li>)}</ul></section>}</div>;
}
