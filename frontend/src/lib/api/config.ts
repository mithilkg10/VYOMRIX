import "server-only";

const DEFAULT_BACKEND_API_URL = "http://backend:8000";

export function getBackendApiUrl() {
  const configuredUrl = process.env.BACKEND_API_URL;
  if (process.env.VERCEL && (!configuredUrl || !configuredUrl.startsWith("https://"))) {
    throw new Error("BACKEND_API_URL must be an HTTPS backend URL on Vercel");
  }
  return (configuredUrl ?? DEFAULT_BACKEND_API_URL).replace(/\/$/, "");
}
