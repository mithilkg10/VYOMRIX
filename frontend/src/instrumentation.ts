export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Server-only validation
    const isProduction = process.env.NODE_ENV === 'production';
    
    // 1. Validate BACKEND_API_URL
    if (!process.env.BACKEND_API_URL) {
      if (isProduction) {
        throw new Error('BACKEND_API_URL must be defined in production.');
      } else {
        console.warn('BACKEND_API_URL is missing, falling back to defaults if any.');
      }
    }
    
    // 2. Validate CSRF_SECRET
    const csrfSecret = process.env.CSRF_SECRET;
    if (isProduction) {
      if (!csrfSecret || csrfSecret === 'default_dev_secret_change_me_in_prod') {
        throw new Error('FATAL: CSRF_SECRET is missing or using default development secret in production! Aborting startup.');
      }
    }
    
    // Do not expose these checks to the Edge runtime to avoid edge-compat issues, 
    // restrict to nodejs runtime only.
  }
}
