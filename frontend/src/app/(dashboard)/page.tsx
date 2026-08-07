"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Activity, RefreshCw, Server, ShieldAlert, Users } from "lucide-react";
import { EmptyState, LoadingState, PartialDataState, StatusMessage, UnauthorizedState } from "@/components/system/feedback";
import { MetricCard, PageContainer, PageHeader, SectionHeader } from "@/components/system/page";
import { StatusBadge } from "@/components/system/data-display";
import { Button } from "@/components/ui/button";
import { type DashboardData, getDashboardData } from "@/lib/api/dashboard";
import { AlertActivity, calculateMTTC, SeverityDistribution } from "@/components/dashboard/dashboard-charts";

const formatTime = (value: string) => new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
const failureLabel = (name: string, status: number) => status === 401 ? `${name} unauthorized` : status === 502 || status === 503 || status === 504 ? `${name} unavailable` : `${name} did not load`;

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null); const [loading, setLoading] = useState(true); const [refreshing, setRefreshing] = useState(false); const [lastRefresh, setLastRefresh] = useState<string | null>(null); const active = useRef(false);
  const load = useCallback(async (refresh = false) => { if (active.current) return; active.current = true; if (refresh) setRefreshing(true); else setLoading(true); try { const next = await getDashboardData(); setData(next); setLastRefresh(new Date().toLocaleTimeString()); } finally { active.current = false; setLoading(false); setRefreshing(false); } }, []);
  useEffect(() => { void Promise.resolve().then(() => load()); }, [load]);
  
  useEffect(() => {
    let es: EventSource | null = null;
    let reconnectTimer: NodeJS.Timeout;

    const connect = () => {
      // Connect to telemetry stream
      es = new EventSource("/api/v1/system/stream/telemetry", { withCredentials: true });
      
      es.onmessage = (event) => {
        if (!event.data) return;
        try {
          // Re-fetch dashboard data to keep it in sync on any telemetry event
          // In a highly optimized app, we would selectively patch the state, but reloading ensures full consistency
          void load();
        } catch (err) {
          console.error("Failed to parse telemetry event", err);
        }
      };

      es.onerror = () => {
        es?.close();
        reconnectTimer = setTimeout(connect, 5000);
      };
    };

    connect();

    return () => {
      es?.close();
      clearTimeout(reconnectTimer);
    };
  }, [load]);

  const failures = useMemo(() => !data ? [] : ([ ["Incidents", data.incidents.error], ["Assets", data.assets.error], ["SIEM alerts", data.alerts.error], ["SIEM agents", data.agents.error] ] as const).flatMap(([name, error]) => error ? [failureLabel(name, error.status)] : []), [data]);
  if (loading && !data) return <PageContainer><LoadingState label="Loading operational security data…" /></PageContainer>;
  if (!data) return <PageContainer><EmptyState title="No dashboard data" description="No source results are available." /></PageContainer>;
  const allUnauthorized = [data.incidents, data.assets, data.alerts, data.agents].every((source) => source.error?.status === 401);
  if (allUnauthorized) return <PageContainer><UnauthorizedState title="Access unavailable" description="You are not authorized to view operational data." /></PageContainer>;
  const incidents = data.incidents.data; const assets = data.assets.data; const alerts = data.alerts.data; const agents = data.agents.data;
  const openIncidents = incidents.filter((item) => !["Resolved", "Closed"].includes(item.status)); const highIncidents = incidents.filter((item) => item.severity === "High" || item.severity === "Critical"); const highAlerts = alerts.filter((item) => item.severity >= 7); const activeAgents = agents.filter((item) => item.status.toLowerCase() === "active"); const unhealthyAssets = assets.filter((item) => item.health_status !== "Healthy");
  return <PageContainer>
    <StatusMessage>{refreshing ? "Refreshing dashboard data" : lastRefresh ? `Dashboard refreshed at ${lastRefresh}` : "Dashboard data loaded"}</StatusMessage>
    <PageHeader title="Security Overview" description="Current loaded results from incidents, assets, and SIEM sources." actions={<div className="flex items-center gap-2"><span className="hidden text-xs text-muted-foreground sm:inline">{lastRefresh ? `Last refresh ${lastRefresh}` : "Not refreshed"}</span><Button variant="outline" size="sm" onClick={() => void load(true)} disabled={refreshing} aria-busy={refreshing}><RefreshCw className={refreshing ? "animate-spin" : ""} aria-hidden="true" />Refresh</Button></div>} />
    {failures.length > 0 && <PartialDataState failedSources={failures} />}
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Operational summary">
      <MetricCard label="Open Incidents" value={data.incidents.error ? "Unavailable" : String(openIncidents.length)} detail={data.incidents.error ? failureLabel("Incident service", data.incidents.error.status) : `${highIncidents.length} high/critical severity`} icon={ShieldAlert} tone={highIncidents.length ? "warning" : "default"} />
      <MetricCard label="Mean Time To Contain" value={data.incidents.error ? "Unavailable" : calculateMTTC(incidents)} detail={data.incidents.error ? failureLabel("Incident service", data.incidents.error.status) : "Based on resolved incidents"} icon={Activity} tone="default" />
      <MetricCard label="Critical Alerts" value={data.alerts.error ? "Unavailable" : String(highAlerts.length)} detail={data.alerts.error ? failureLabel("SIEM alerts", data.alerts.error.status) : `Out of ${alerts.length} total alerts`} icon={ShieldAlert} tone={highAlerts.length ? "danger" : "default"} />
      <MetricCard label="Unhealthy Assets" value={data.assets.error ? "Unavailable" : String(unhealthyAssets.length)} detail={data.assets.error ? failureLabel("Asset inventory", data.assets.error.status) : `Out of ${assets.length} total assets`} icon={Server} tone={unhealthyAssets.length ? "warning" : "default"} />
    </section>
    <section className="grid gap-6 xl:grid-cols-2">
      <SeverityDistribution incidents={incidents} alerts={alerts} />
      <AlertActivity alerts={alerts} />
    </section>
    <section className="grid gap-6 xl:grid-cols-2"><RecentIncidents incidents={incidents} unavailable={Boolean(data.incidents.error)} /><RecentAlerts alerts={alerts} unavailable={Boolean(data.alerts.error)} /></section>
    <section className="grid gap-6 xl:grid-cols-2"><section className="panel p-5"><SectionHeader title="Asset posture" description={data.assets.error ? failureLabel("Asset inventory", data.assets.error.status) : "Reported health and internet exposure from loaded assets."} actions={<Button size="sm" variant="outline" render={<Link href="/assets">View assets</Link>} />}/>{!data.assets.error && (assets.length ? <dl className="mt-4 grid gap-3 sm:grid-cols-3"><Posture label="Internet-facing" value={assets.filter((asset) => asset.is_internet_facing).length} /><Posture label="Unhealthy" value={unhealthyAssets.length} /><Posture label="Wazuh agents" value={assets.filter((asset) => asset.has_wazuh_agent).length} /></dl> : <EmptyState title="No assets" description="The asset inventory returned no records." compact />)}</section><section className="panel p-5"><SectionHeader title="SIEM integration status" description="Current result status for independently loaded SIEM sources." actions={<Button size="sm" variant="outline" render={<Link href="/siem/agents">View agents</Link>} />}/><div className="mt-4 space-y-3"><Integration name="Alerts" error={data.alerts.error} /><Integration name="Agents" error={data.agents.error} /></div></section></section>
  </PageContainer>;
}
function RecentIncidents({ incidents, unavailable }: { incidents: DashboardData["incidents"]["data"]; unavailable: boolean }) { return <section className="panel p-5"><SectionHeader title="Recent incidents" description="Latest loaded incident records." actions={<Button size="sm" variant="outline" render={<Link href="/incidents">View all incidents</Link>} />}/>{unavailable ? <p className="mt-4 text-sm text-muted-foreground">Incident records unavailable.</p> : incidents.length ? <ul className="mt-4 divide-y">{[...incidents].sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at)).slice(0, 5).map((item) => <li className="py-3" key={item.id}><p className="font-medium">{item.title}</p><p className="mt-1 text-xs text-muted-foreground">{item.id} · {formatTime(item.updated_at)}</p></li>)}</ul> : <EmptyState title="No incidents" description="No incident records were returned." compact />}</section>; }
function RecentAlerts({ alerts, unavailable }: { alerts: DashboardData["alerts"]["data"]; unavailable: boolean }) { return <section className="panel p-5"><SectionHeader title="Recent SIEM alerts" description="Latest loaded SIEM alert records." actions={<Button size="sm" variant="outline" render={<Link href="/siem/alerts">View SIEM alerts</Link>} />}/>{unavailable ? <p className="mt-4 text-sm text-muted-foreground">SIEM alerts unavailable.</p> : alerts.length ? <ul className="mt-4 divide-y">{[...alerts].sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp)).slice(0, 5).map((item) => <li className="py-3" key={item.id}><p className="font-medium">{item.title}</p><p className="mt-1 text-xs text-muted-foreground">{item.rule_id} · {formatTime(item.timestamp)}</p></li>)}</ul> : <EmptyState title="No SIEM alerts" description="No alert records were returned." compact />}</section>; }
function Posture({ label, value }: { label: string; value: number }) { return <div className="rounded-md border p-3"><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 text-xl font-semibold">{value}</dd></div>; }
function Integration({ error, name }: { error: DashboardData["alerts"]["error"]; name: string }) { const label = error ? failureLabel(name, error.status) : "Loaded"; return <div className="flex items-center justify-between rounded-md border p-3"><span className="text-sm font-medium">{name}</span><StatusBadge status={error ? "warning" : "success"}>{label}</StatusBadge></div>; }
