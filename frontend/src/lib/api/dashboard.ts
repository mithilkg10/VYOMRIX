import { type Asset, getAssets } from "@/lib/api/assets";
import { apiRequest, ApiError } from "@/lib/api/client";
import { type Incident, getIncidents } from "@/lib/api/incidents";
import { type SiemAgent, type SiemAlert, getAgents, getAlerts } from "@/lib/api/siem";

export type SystemHealth = { status: "ok" | "degraded"; details: Record<string, string> };

export type DashboardSource<T> = { data: T; error: ApiError | null };
export type DashboardData = {
  health: DashboardSource<SystemHealth>;
  incidents: DashboardSource<Incident[]>;
  assets: DashboardSource<Asset[]>;
  alerts: DashboardSource<SiemAlert[]>;
  agents: DashboardSource<SiemAgent[]>;
};

const source = <T>(result: PromiseSettledResult<T>): DashboardSource<T> =>
  result.status === "fulfilled"
    ? { data: result.value, error: null }
    : { data: [] as T, error: result.reason instanceof ApiError ? result.reason : new ApiError("The data source could not be loaded.", 500) };

const getHealth = async (signal?: AbortSignal) => apiRequest<SystemHealth>("health/status", { signal });

export async function getDashboardData(signal?: AbortSignal): Promise<DashboardData> {
  const [health, incidents, assets, alerts, agents] = await Promise.allSettled([
    getHealth(signal),
    getIncidents(0, 50, undefined, undefined, signal).then((response) => response.items),
    getAssets(signal),
    getAlerts().then((response) => response.items),
    getAgents().then((response) => response.items),
  ]);
  return { health: source(health), incidents: source(incidents), assets: source(assets), alerts: source(alerts), agents: source(agents) };
}
