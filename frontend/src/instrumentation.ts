export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // The Vercel showcase deployment uses a same-origin embedded Python backend,
    // so BACKEND_API_URL is intentionally unnecessary there.
    if (process.env.VERCEL_URL) {
      return;
    }

    const isProduction = process.env.NODE_ENV === "production";

    if (!process.env.BACKEND_API_URL) {
      if (isProduction) {
        throw new Error("BACKEND_API_URL must be defined in production.");
      }
      console.warn("BACKEND_API_URL is missing, falling back to defaults if any.");
    }

    const csrfSecret = process.env.CSRF_SECRET;
    if (isProduction) {
      if (!csrfSecret || csrfSecret === "default_dev_secret_change_me_in_prod") {
        throw new Error("FATAL: CSRF_SECRET is missing or using default development secret in production! Aborting startup.");
      }
    }
  }
}
