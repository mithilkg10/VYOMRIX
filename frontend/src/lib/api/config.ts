import "server-only";

const DEFAULT_BACKEND_API_URL = "http://backend:8000";

export function getBackendApiUrl() {
  const embeddedBackendUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : undefined;

  return (
    process.env.BACKEND_API_URL ??
    embeddedBackendUrl ??
    DEFAULT_BACKEND_API_URL
  ).replace(/\/$/, "");
}
