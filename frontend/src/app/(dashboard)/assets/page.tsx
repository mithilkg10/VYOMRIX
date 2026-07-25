"use client";

import { type ReactNode, useMemo, useState } from "react";
import { RefreshCw, Server, ShieldCheck, Globe2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmptyState, ErrorState, IntegrationUnavailableState, LoadingState, UnauthorizedState } from "@/components/system/feedback";
import { StatusBadge } from "@/components/system/data-display";
import { MetricCard, PageContainer, PageHeader } from "@/components/system/page";
import { ASSET_CRITICALITIES, ASSET_ENVIRONMENTS, ASSET_HEALTH_STATUSES, ASSET_TYPES, Asset, AssetCriticality, AssetEnvironment, AssetHealthStatus, AssetType, useAssets } from "@/lib/api/assets";

const criticalityTone = (value: Asset["criticality"]) => value === "Critical" ? "danger" : value === "High" ? "warning" : value === "Medium" ? "info" : "success";
const healthTone = (value: Asset["health_status"]) => value === "Compromised" ? "danger" : value === "Offline" || value === "Warning" ? "warning" : "success";
const formatTimestamp = (value: string) => new Date(value).toLocaleString();

export default function AssetsPage() {
  const { assets, status, refresh } = useAssets();
  const [query, setQuery] = useState("");
  const [assetType, setAssetType] = useState<AssetType | "All">("All");
  const [environment, setEnvironment] = useState<AssetEnvironment | "All">("All");
  const [criticality, setCriticality] = useState<AssetCriticality | "All">("All");
  const [health, setHealth] = useState<AssetHealthStatus | "All">("All");
  const [sort, setSort] = useState<"hostname" | "criticality" | "last_seen">("hostname");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Asset | null>(null);

  const filtered = useMemo(() => assets.filter((asset) => (
    (assetType === "All" || asset.asset_type === assetType) &&
    (environment === "All" || asset.environment === environment) &&
    (criticality === "All" || asset.criticality === criticality) &&
    (health === "All" || asset.health_status === health) &&
    [asset.id, asset.hostname, asset.ip_address, asset.owner, asset.os_name ?? "", ...asset.tags].join(" ").toLowerCase().includes(query.toLowerCase())
  )).sort((a, b) => sort === "criticality" ? ASSET_CRITICALITIES.indexOf(b.criticality) - ASSET_CRITICALITIES.indexOf(a.criticality) : sort === "last_seen" ? new Date(b.last_seen).getTime() - new Date(a.last_seen).getTime() : a.hostname.localeCompare(b.hostname)), [assets, assetType, environment, criticality, health, query, sort]);

  const pageSize = 10;
  const pageCount = Math.ceil(filtered.length / pageSize);
  const activePage = pageCount ? Math.min(page, pageCount) : 1;
  const rows = filtered.slice((activePage - 1) * pageSize, activePage * pageSize);
  const clear = () => { setQuery(""); setAssetType("All"); setEnvironment("All"); setCriticality("All"); setHealth("All"); setPage(1); };

  if (status === "loading" && !assets.length) return <PageContainer><LoadingState label="Loading asset inventory..." /></PageContainer>;
  if (status === "unauthorized") return <PageContainer><UnauthorizedState title="Session expired" description="Sign in again to access asset data." /></PageContainer>;
  if (status === "unavailable") return <PageContainer><IntegrationUnavailableState integrationName="Asset service" reason="The service did not respond." guidance="Verify service health and try again." action={<Button variant="outline" onClick={() => void refresh()}>Retry</Button>} /></PageContainer>;
  if (status === "error") return <PageContainer><ErrorState title="Asset data unavailable" description="The asset inventory could not be loaded. Try again." onRetry={() => void refresh()} /></PageContainer>;

  const criticalAssets = assets.filter((asset) => ["Critical", "High"].includes(asset.criticality)).length;
  const wazuhAssets = assets.filter((asset) => asset.has_wazuh_agent).length;
  const internetFacing = assets.filter((asset) => asset.is_internet_facing).length;

  return <PageContainer>
    <PageHeader title="Asset Intelligence" description="Inventory results from the asset service. Filters and sorting apply to loaded results only." actions={<Button variant="outline" onClick={() => void refresh()}><RefreshCw className={status === "loading" ? "animate-spin" : ""} />Refresh</Button>} />
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard label="Loaded assets" value={String(assets.length)} icon={Server} />
      <MetricCard label="Critical / high in results" value={String(criticalAssets)} icon={ShieldCheck} tone="danger" />
      <MetricCard label="Wazuh-connected in results" value={String(wazuhAssets)} icon={ShieldCheck} tone="info" />
      <MetricCard label="Internet-facing in results" value={String(internetFacing)} icon={Globe2} tone="warning" />
    </section>
    <section className="panel p-4 sm:p-5">
      <div className="flex flex-wrap gap-2"><Input className="min-w-48 flex-1" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Search loaded assets" aria-label="Search loaded assets" /><AssetSelect value={assetType} onChange={(value) => { setAssetType(value as AssetType | "All"); setPage(1); }} label="Filter asset type" values={ASSET_TYPES} /><AssetSelect value={environment} onChange={(value) => { setEnvironment(value as AssetEnvironment | "All"); setPage(1); }} label="Filter environment" values={ASSET_ENVIRONMENTS} /><AssetSelect value={criticality} onChange={(value) => { setCriticality(value as AssetCriticality | "All"); setPage(1); }} label="Filter criticality" values={ASSET_CRITICALITIES} /><AssetSelect value={health} onChange={(value) => { setHealth(value as AssetHealthStatus | "All"); setPage(1); }} label="Filter health" values={ASSET_HEALTH_STATUSES} /><Button variant="ghost" onClick={clear}>Clear</Button></div>
      {!filtered.length ? <EmptyState title="No assets found" description="No loaded asset records match the current filters." /> : <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[880px] text-sm"><thead className="border-b text-left text-xs text-muted-foreground"><tr><th className="p-3">ID</th><th className="p-3"><button onClick={() => setSort("hostname")}>Hostname</button></th><th className="p-3">IP address</th><th className="p-3">Type</th><th className="p-3">Environment</th><th className="p-3"><button onClick={() => setSort("criticality")}>Criticality</button></th><th className="p-3">Health</th><th className="p-3"><button onClick={() => setSort("last_seen")}>Last seen</button></th></tr></thead><tbody>{rows.map((asset) => <tr key={asset.id} className="cursor-pointer border-b transition-colors hover:bg-muted/40 focus-visible:bg-muted/40 focus-visible:outline-none" tabIndex={0} role="button" aria-label={`Open asset ${asset.hostname}`} onClick={() => setSelected(asset)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelected(asset); } }}><td className="p-3 font-mono text-xs">{asset.id}</td><td className="max-w-64 p-3 font-medium">{asset.hostname}</td><td className="p-3 font-mono text-xs">{asset.ip_address}</td><td className="p-3">{asset.asset_type}</td><td className="p-3">{asset.environment}</td><td className="p-3"><StatusBadge status={criticalityTone(asset.criticality)}>{asset.criticality}</StatusBadge></td><td className="p-3"><StatusBadge status={healthTone(asset.health_status)}>{asset.health_status}</StatusBadge></td><td className="p-3 font-mono text-xs text-muted-foreground">{formatTimestamp(asset.last_seen)}</td></tr>)}</tbody></table></div>}
      {filtered.length > pageSize && <div className="mt-4 flex items-center justify-between"><span className="text-sm text-muted-foreground">Page {activePage} of {pageCount}</span><div className="flex gap-2"><Button size="sm" variant="outline" disabled={activePage === 1} onClick={() => setPage(activePage - 1)}>Previous</Button><Button size="sm" variant="outline" disabled={activePage >= pageCount} onClick={() => setPage(activePage + 1)}>Next</Button></div></div>}
    </section>
    <Dialog open={selected !== null} onOpenChange={(isOpen) => { if (!isOpen) setSelected(null); }}><DialogContent className="right-0 left-auto top-0 h-dvh w-[min(100vw,32rem)] max-w-none translate-x-0 translate-y-0 overflow-y-auto rounded-none border-y-0 border-r-0 p-0 sm:w-[min(92vw,36rem)]">{selected && <><DialogHeader className="sticky top-0 z-10 border-b bg-background/95 p-5 backdrop-blur"><div className="flex items-start justify-between gap-4 pr-10"><div className="min-w-0"><DialogTitle className="break-words">{selected.hostname || selected.id}</DialogTitle><DialogDescription className="mt-1 font-mono text-xs">Asset details</DialogDescription></div><DialogClose render={<Button variant="ghost" size="icon" aria-label="Close asset details"><X aria-hidden="true" /></Button>} /></div></DialogHeader><div className="space-y-5 p-5 text-sm"><dl className="space-y-4"><AssetDetail label="Asset ID" value={selected.id} mono /><AssetDetail label="Hostname" value={selected.hostname} /><AssetDetail label="IP address" value={selected.ip_address} mono /><AssetDetail label="Operating system" value={selected.os_name ?? "Not provided"} muted={!selected.os_name} /><AssetDetail label="Asset type" value={selected.asset_type} /><AssetDetail label="Environment" value={selected.environment} /><AssetDetail label="Criticality" value={<StatusBadge status={criticalityTone(selected.criticality)}>{selected.criticality}</StatusBadge>} /><AssetDetail label="Health" value={<StatusBadge status={healthTone(selected.health_status)}>{selected.health_status}</StatusBadge>} /><AssetDetail label="Owner" value={selected.owner || "Not provided"} muted={!selected.owner} /><AssetDetail label="Last seen" value={formatTimestamp(selected.last_seen)} mono /></dl><section><h3 className="text-sm font-semibold">Coverage</h3><dl className="mt-3 space-y-3"><AssetDetail label="Wazuh agent" value={selected.has_wazuh_agent ? "Reported" : "Not reported"} /><AssetDetail label="WAF protection" value={selected.protected_by_waf ? "Reported" : "Not reported"} /><AssetDetail label="Internet-facing" value={selected.is_internet_facing ? "Reported" : "Not reported"} /></dl></section><section><h3 className="text-sm font-semibold">Tags</h3>{selected.tags.length ? <ul className="mt-3 flex flex-wrap gap-2">{selected.tags.map((tag) => <li className="rounded-md border bg-muted/40 px-2 py-1 font-mono text-xs" key={tag}>{tag}</li>)}</ul> : <p className="mt-1 text-sm text-muted-foreground">Not provided</p>}</section></div></>}</DialogContent></Dialog>
  </PageContainer>;
}

function AssetSelect({ label, onChange, value, values }: { label: string; onChange: (value: string) => void; value: string; values: readonly string[] }) { return <select className="h-10 rounded-md border bg-background px-3 text-sm" value={value} onChange={(event) => onChange(event.target.value)} aria-label={label}><option>All</option>{values.map((item) => <option key={item}>{item}</option>)}</select>; }
function AssetDetail({ label, value, mono = false, muted = false }: { label: string; value: ReactNode; mono?: boolean; muted?: boolean }) { return <div className="grid gap-1 border-b border-border/60 pb-4 last:border-0 last:pb-0"><dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt><dd className={`min-w-0 break-words ${mono ? "font-mono text-xs" : ""} ${muted ? "text-muted-foreground" : ""}`}>{value}</dd></div>; }
