import { apiRequest } from "./client";

export interface SearchResult {
  id: string;
  type: "incident" | "asset" | "rule" | "user";
  title: string;
  subtitle?: string;
  url: string;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
}

export const searchApi = {
  globalSearch: (query: string, limit = 10, signal?: AbortSignal) =>
    apiRequest<SearchResponse>(
      `/v1/search?q=${encodeURIComponent(query)}&limit=${limit}`,
      { signal }
    ),
};
