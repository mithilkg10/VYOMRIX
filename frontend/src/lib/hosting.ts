/**
 * The hosted Vercel deployment has no FastAPI backend. Its owner account is configured
 * with ADMIN_EMAIL and ADMIN_PASSWORD_HASH, and every data view is served by the
 * read only showcase layer. Backend only features are turned off in that mode.
 */
export function isHostedShowcase(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD_HASH);
}

export const HOSTED_RESET_MESSAGE =
  "Password reset is not available on the hosted showcase. The owner password is managed in the deployment settings, and recruiters can use the one click demo on the sign in page.";
