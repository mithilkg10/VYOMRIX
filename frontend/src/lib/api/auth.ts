import { apiRequest } from "./client";

export interface UserResponse {
  id: string;
  email: string;
  full_name?: string;
  role: string;
  permissions: string[];
  is_active: boolean;
}

export interface SessionResponse {
  id: string;
  user_agent: string;
  ip_address: string;
  created_at: string;
  last_used_at: string;
  is_current: boolean;
}

export const authApi = {
  getCurrentUser: () => apiRequest<UserResponse>("/v1/auth/me"), // Keep as /v1 because it uses generic proxy
  login: (data: URLSearchParams) =>
    apiRequest<any>("/auth/login", {
      method: "POST",
      body: data.toString(),
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    }),
  logout: () => apiRequest<void>("/auth/logout", { method: "POST" }),
  getSessions: () => apiRequest<SessionResponse[]>("/auth/sessions"),
  revokeSession: (sessionId: string) =>
    apiRequest<void>(`/auth/sessions/${sessionId}`, { method: "DELETE" }),
  revokeAllSessions: () =>
    apiRequest<void>("/auth/sessions/revoke-all", { method: "POST" }),
  forgotPassword: (email: string) =>
    apiRequest<{ status: string; message: string }>("/auth/forgot-password", {
      method: "POST",
      body: { email },
    }),
  resetPassword: (token: string, new_password: string) =>
    apiRequest<{ status: string; message: string }>("/auth/reset-password", {
      method: "POST",
      body: { token, new_password },
    }),
};
