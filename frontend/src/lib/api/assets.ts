import { useCallback, useEffect, useState } from "react";
import { ApiError, apiRequest } from "@/lib/api/client";

export const ASSET_TYPES = ["Server", "Workstation", "VM", "Container", "Web App", "Honeypot"] as const;
export const ASSET_ENVIRONMENTS = ["Production", "Staging", "Development"] as const;
export const ASSET_CRITICALITIES = ["Low", "Medium", "High", "Critical"] as const;
export const ASSET_HEALTH_STATUSES = ["Healthy", "Warning", "Offline", "Compromised"] as const;

export type AssetType = typeof ASSET_TYPES[number];
export type AssetEnvironment = typeof ASSET_ENVIRONMENTS[number];
export type AssetCriticality = typeof ASSET_CRITICALITIES[number];
export type AssetHealthStatus = typeof ASSET_HEALTH_STATUSES[number];

export interface Asset {
  id: string;
  hostname: string;
  ip_address: string;
  os_name?: string | null;
  asset_type: AssetType;
  environment: AssetEnvironment;
  criticality: AssetCriticality;
  owner: string;
  tags: string[];
  has_wazuh_agent: boolean;
  protected_by_waf: boolean;
  is_internet_facing: boolean;
  last_seen: string;
  health_status: AssetHealthStatus;
}

export type AssetListResponse = Asset[];

export type AssetsState =
  | { status: "loading"; assets: Asset[]; error: null }
  | { status: "ready"; assets: Asset[]; error: null }
  | { status: "empty"; assets: Asset[]; error: null }
  | { status: "unauthorized"; assets: Asset[]; error: ApiError }
  | { status: "unavailable"; assets: Asset[]; error: ApiError }
  | { status: "error"; assets: Asset[]; error: ApiError };

const initialState: AssetsState = { status: "loading", assets: [], error: null };

function isRecord(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }
function isString(value: unknown): value is string { return typeof value === "string"; }
function isBoolean(value: unknown): value is boolean { return typeof value === "boolean"; }
function isTimestamp(value: unknown): value is string { return isString(value) && !Number.isNaN(Date.parse(value)); }
function isStringArray(value: unknown): value is string[] { return Array.isArray(value) && value.every(isString); }
function isAssetType(value: unknown): value is AssetType { return isString(value) && ASSET_TYPES.includes(value as AssetType); }
function isEnvironment(value: unknown): value is AssetEnvironment { return isString(value) && ASSET_ENVIRONMENTS.includes(value as AssetEnvironment); }
function isCriticality(value: unknown): value is AssetCriticality { return isString(value) && ASSET_CRITICALITIES.includes(value as AssetCriticality); }
function isHealthStatus(value: unknown): value is AssetHealthStatus { return isString(value) && ASSET_HEALTH_STATUSES.includes(value as AssetHealthStatus); }

function parseAsset(value: unknown): Asset | null {
  if (!isRecord(value) || !isString(value.id) || !isString(value.hostname) || !isString(value.ip_address) || !isAssetType(value.asset_type) || !isEnvironment(value.environment) || !isCriticality(value.criticality) || !isString(value.owner) || !isStringArray(value.tags) || !isBoolean(value.has_wazuh_agent) || !isBoolean(value.protected_by_waf) || !isBoolean(value.is_internet_facing) || !isTimestamp(value.last_seen) || !isHealthStatus(value.health_status)) return null;
  if ("os_name" in value && value.os_name !== null && !isString(value.os_name)) return null;
  return { id: value.id, hostname: value.hostname, ip_address: value.ip_address, asset_type: value.asset_type, environment: value.environment, criticality: value.criticality, owner: value.owner, tags: value.tags, has_wazuh_agent: value.has_wazuh_agent, protected_by_waf: value.protected_by_waf, is_internet_facing: value.is_internet_facing, last_seen: value.last_seen, health_status: value.health_status, ...("os_name" in value ? { os_name: value.os_name as string | null } : {}) };
}

function parseAssetList(value: unknown): AssetListResponse {
  if (!Array.isArray(value)) throw new ApiError("The asset service returned an unexpected response.", 500);
  const assets = value.map(parseAsset);
  if (assets.some((asset) => asset === null)) throw new ApiError("The asset service returned an unexpected response.", 500);
  return assets as AssetListResponse;
}

export async function getAssets(signal?: AbortSignal): Promise<AssetListResponse> {
  try {
    return parseAssetList(await apiRequest<unknown>("assets/", { signal }));
  } catch (cause) {
    if (cause instanceof ApiError || (cause instanceof Error && cause.name === "AbortError")) throw cause;
    throw new ApiError("The asset service is unavailable.", 503);
  }
}

export function useAssets() {
  const [state, setState] = useState<AssetsState>(initialState);
  const load = useCallback(async (signal?: AbortSignal) => {
    setState((current) => ({ ...current, status: "loading", error: null }));
    try {
      const assets = await getAssets(signal);
      setState({ status: assets.length ? "ready" : "empty", assets, error: null });
    } catch (cause) {
      if (cause instanceof Error && cause.name === "AbortError") return;
      const error = cause instanceof ApiError ? cause : new ApiError("Asset data could not be loaded.", 500);
      const status = error.status === 401 ? "unauthorized" : error.status === 502 || error.status === 503 || error.status === 504 ? "unavailable" : "error";
      setState({ status, assets: [], error });
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(() => load(controller.signal));
    return () => controller.abort();
  }, [load]);

  return { ...state, refresh: () => load() };
}
