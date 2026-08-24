import "server-only";

const DEFAULT_BACKEND_API_URL = "http://backend:8000";

export function getBackendApiUrl() {
  const serviceUrl = process.env.BACKEND_URL;
  const deploymentServiceUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}/svc/api`
    : undefined;

  return (
    process.env.BACKEND_API_URL ??
    serviceUrl ??
    deploymentServiceUrl ??
    DEFAULT_BACKEND_API_URL
  ).replace(/\/$/, "");
}
