import { type Asset, getAssets } from "@/lib/api/assets";
import { ApiError } from "@/lib/api/client";
import { type Incident, getIncidents } from "@/lib/api/incidents";
import { type SiemAgent, type SiemAlert, getAgents, getAlerts } from "@/lib/api/siem";

export type DashboardSource<T> = { data: T; error: ApiError | null };
export type DashboardData = {
  incidents: DashboardSource<Incident[]>;
  assets: DashboardSource<Asset[]>;
  alerts: DashboardSource<SiemAlert[]>;
  agents: DashboardSource<SiemAgent[]>;
};

const source = <T>(result: PromiseSettledResult<T>): DashboardSource<T> =>
  result.status === "fulfilled"
    ? { data: result.value, error: null }
    : { data: [] as T, error: result.reason instanceof ApiError ? result.reason : new ApiError("The data source could not be loaded.", 500) };

export async function getDashboardData(signal?: AbortSignal): Promise<DashboardData> {
  const [incidents, assets, alerts, agents] = await Promise.allSettled([
    getIncidents(signal),
    getAssets(signal),
    getAlerts().then((response) => response.items),
    getAgents().then((response) => response.items),
  ]);
  return { incidents: source(incidents), assets: source(assets), alerts: source(alerts), agents: source(agents) };
}
