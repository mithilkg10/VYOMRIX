import "server-only";

import { getBackendApiUrl } from "@/lib/api/config";

export async function revokeCurrentSession(
  accessToken?: string,
  refreshToken?: string,
  sessionId?: string
): Promise<Response | null> {
  let bearer = accessToken;
  let currentSessionId = sessionId;

  // Refresh only after access expiry so logout can revoke the active session.
  if (!bearer && refreshToken) {
    const refreshed = await fetch(`${getBackendApiUrl()}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: "no-store",
    });
    if (refreshed.ok) {
      const data = await refreshed.json();
      bearer = data.access_token;
      currentSessionId = data.session_id;
    }
  }

  if (!bearer || !currentSessionId) return null;
  return fetch(
    `${getBackendApiUrl()}/api/v1/auth/logout?session_id=${encodeURIComponent(currentSessionId)}`,
    {
      method: "POST",
      headers: { Accept: "application/json", Authorization: `Bearer ${bearer}` },
      cache: "no-store",
    }
  );
}
