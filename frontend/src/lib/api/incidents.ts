import { useCallback, useEffect, useState } from "react";
import { ApiError, apiRequest } from "@/lib/api/client";

export const INCIDENT_SEVERITIES = ["Low", "Medium", "High", "Critical"] as const;
export const INCIDENT_STATUSES = ["Open", "In Progress", "Contained", "Resolved", "Closed"] as const;

export type IncidentSeverity = typeof INCIDENT_SEVERITIES[number];
export type IncidentStatus = typeof INCIDENT_STATUSES[number];

export interface IncidentTimelineEvent {
  id: string;
  timestamp: string;
  source: string;
  description: string;
  raw_data?: unknown | null;
}

export interface IncidentEvidence {
  id: string;
  name: string;
  type: string;
  url?: string | null;
  uploaded_at: string;
}

export interface Incident {
  id: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  created_at: string;
  updated_at: string;
  closed_at?: string | null;
  assigned_analyst?: string | null;
  related_assets: string[];
  related_mitre_tactics: string[];
  timeline: IncidentTimelineEvent[];
  evidence: IncidentEvidence[];
  playbook_id?: string | null;
  ai_summary?: string | null;
}

export type PaginatedIncidentResponse = {
  items: Incident[];
  total: number;
  skip: number;
  limit: number;
};

export type IncidentsState =
  | { status: "loading"; data: PaginatedIncidentResponse | null; error: null }
  | { status: "ready"; data: PaginatedIncidentResponse; error: null }
  | { status: "empty"; data: PaginatedIncidentResponse; error: null }
  | { status: "unauthorized"; data: PaginatedIncidentResponse | null; error: ApiError }
  | { status: "unavailable"; data: PaginatedIncidentResponse | null; error: ApiError }
  | { status: "error"; data: PaginatedIncidentResponse | null; error: ApiError };

const initialState: IncidentsState = { status: "loading", data: null, error: null };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isTimestamp(value: unknown): value is string {
  return isString(value) && !Number.isNaN(Date.parse(value));
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isString);
}

function isSeverity(value: unknown): value is IncidentSeverity {
  return isString(value) && INCIDENT_SEVERITIES.includes(value as IncidentSeverity);
}

function isStatus(value: unknown): value is IncidentStatus {
  return isString(value) && INCIDENT_STATUSES.includes(value as IncidentStatus);
}

function parseTimelineEvent(value: unknown): IncidentTimelineEvent | null {
  if (!isRecord(value) || !isString(value.id) || !isTimestamp(value.timestamp) || !isString(value.source) || !isString(value.description)) return null;
  if ("raw_data" in value && value.raw_data !== null && typeof value.raw_data !== "object" && !isString(value.raw_data) && typeof value.raw_data !== "number" && typeof value.raw_data !== "boolean") return null;
  return { id: value.id, timestamp: value.timestamp, source: value.source, description: value.description, ...("raw_data" in value ? { raw_data: value.raw_data } : {}) };
}

function parseEvidence(value: unknown): IncidentEvidence | null {
  if (!isRecord(value) || !isString(value.id) || !isString(value.name) || !isString(value.type) || !isTimestamp(value.uploaded_at)) return null;
  const evidence = { id: value.id, name: value.name, type: value.type, uploaded_at: value.uploaded_at };
  if (!("url" in value)) return evidence;
  const url = value.url;
  if (url !== undefined && url !== null && !isString(url)) return null;
  return url === undefined ? evidence : { ...evidence, url };
}

function parseIncident(value: unknown): Incident | null {
  if (!isRecord(value) || !isString(value.id) || !isString(value.title) || !isString(value.description) || !isSeverity(value.severity) || !isStatus(value.status) || !isTimestamp(value.created_at) || !isTimestamp(value.updated_at) || !isStringArray(value.related_assets) || !isStringArray(value.related_mitre_tactics) || !Array.isArray(value.timeline) || !Array.isArray(value.evidence)) return null;
  if (("closed_at" in value && value.closed_at !== null && !isTimestamp(value.closed_at)) || ("assigned_analyst" in value && value.assigned_analyst !== null && !isString(value.assigned_analyst)) || ("playbook_id" in value && value.playbook_id !== null && !isString(value.playbook_id)) || ("ai_summary" in value && value.ai_summary !== null && !isString(value.ai_summary))) return null;
  const timeline = value.timeline.map(parseTimelineEvent);
  const evidence = value.evidence.map(parseEvidence);
  if (timeline.some((event) => event === null) || evidence.some((item) => item === null)) return null;
  return {
    id: value.id, title: value.title, description: value.description, severity: value.severity, status: value.status, created_at: value.created_at, updated_at: value.updated_at,
    related_assets: value.related_assets, related_mitre_tactics: value.related_mitre_tactics, timeline: timeline as IncidentTimelineEvent[], evidence: evidence as IncidentEvidence[],
    ...("closed_at" in value ? { closed_at: value.closed_at as string | null } : {}), ...("assigned_analyst" in value ? { assigned_analyst: value.assigned_analyst as string | null } : {}), ...("playbook_id" in value ? { playbook_id: value.playbook_id as string | null } : {}), ...("ai_summary" in value ? { ai_summary: value.ai_summary as string | null } : {}),
  };
}

function parseIncidentList(value: unknown): PaginatedIncidentResponse {
  if (!isRecord(value) || !Array.isArray(value.items) || typeof value.total !== "number" || typeof value.skip !== "number" || typeof value.limit !== "number") {
    throw new ApiError("The incident service returned an unexpected response format.", 500);
  }
  const items = value.items.map(parseIncident);
  if (items.some((incident) => incident === null)) throw new ApiError("The incident service returned malformed incidents.", 500);
  return { items: items as Incident[], total: value.total, skip: value.skip, limit: value.limit };
}

export async function getIncidents(skip = 0, limit = 50, incidentStatus?: IncidentStatus, severity?: IncidentSeverity, signal?: AbortSignal): Promise<PaginatedIncidentResponse> {
  try {
    const params = new URLSearchParams({ skip: skip.toString(), limit: limit.toString() });
    if (incidentStatus) params.append("status", incidentStatus);
    if (severity) params.append("severity", severity);
    return parseIncidentList(await apiRequest<unknown>(`incidents/?${params.toString()}`, { signal }));
  } catch (cause) {
    if (cause instanceof ApiError || (cause instanceof Error && cause.name === "AbortError")) throw cause;
    throw new ApiError("The incident service is unavailable.", 503);
  }
}

export function useIncidents(skip = 0, limit = 50, incidentStatus?: IncidentStatus, severity?: IncidentSeverity) {
  const [state, setState] = useState<IncidentsState>(initialState);
  
  const load = useCallback(async (signal?: AbortSignal) => {
    setState((current) => ({ ...current, status: "loading", error: null }));
    try {
      const data = await getIncidents(skip, limit, incidentStatus, severity, signal);
      setState({ status: data.items.length ? "ready" : "empty", data, error: null });
    } catch (cause) {
      if (cause instanceof Error && cause.name === "AbortError") return;
      const error = cause instanceof ApiError ? cause : new ApiError("Incident data could not be loaded.", 500);
      const status = error.status === 401 ? "unauthorized" : error.status === 502 || error.status === 503 || error.status === 504 ? "unavailable" : "error";
      setState({ status, data: null, error });
    }
  }, [skip, limit, incidentStatus, severity]);

  useEffect(() => {
    const controller = new AbortController();
    void Promise.resolve().then(() => load(controller.signal));
    return () => controller.abort();
  }, [load]);

  // SSE setup for real-time updates
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimer: NodeJS.Timeout;
    let retryCount = 0;

    const connect = () => {
      eventSource = new EventSource("/api/v1/incidents/stream/updates");
      
      eventSource.onopen = () => {
        retryCount = 0;
      };

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          const parsed = parseIncident(payload.payload);
          if (parsed) {
            setState((current) => {
              if (!current.data) return current;
              const existingIndex = current.data.items.findIndex(i => i.id === parsed.id);
              const newItems = [...current.data.items];
              if (existingIndex >= 0) {
                newItems[existingIndex] = parsed;
              } else if (!incidentStatus || parsed.status === incidentStatus) {
                newItems.unshift(parsed);
              }
              return {
                ...current,
                data: { ...current.data, items: newItems }
              };
            });
          }
        } catch (e) {
          console.error("SSE parse error", e);
        }
      };

      eventSource.onerror = () => {
        eventSource?.close();
        const timeout = Math.min(1000 * Math.pow(2, retryCount), 30000);
        retryCount++;
        reconnectTimer = setTimeout(connect, timeout);
      };
    };

    connect();

    return () => {
      eventSource?.close();
      clearTimeout(reconnectTimer);
    };
  }, [incidentStatus]);

  return { ...state, refresh: () => load() };
}
