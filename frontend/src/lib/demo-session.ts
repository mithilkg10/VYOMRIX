// Server-only signing for isolated recruiter and owner-review sessions.
const encoder = new TextEncoder();

export const DEMO_COOKIE_NAME = "vyomrix_demo";
export const OWNER_COOKIE_NAME = "vyomrix_owner";

function getSessionSecret() {
  const secret = process.env.DEMO_SESSION_SECRET ?? process.env.CSRF_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("DEMO_SESSION_SECRET or CSRF_SECRET must be configured with at least 32 characters.");
  }
  return secret;
}

function toHex(bytes: ArrayBuffer) {
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function sign(value: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(getSessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return toHex(await crypto.subtle.sign("HMAC", key, encoder.encode(value)));
}

function constantTimeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let result = 0;
  for (let index = 0; index < left.length; index += 1) {
    result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return result === 0;
}

async function createSessionToken(purpose: "demo" | "owner", ttlSeconds: number) {
  const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
  const nonceBytes = new Uint8Array(16);
  crypto.getRandomValues(nonceBytes);
  const nonce = Array.from(nonceBytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  const payload = `v2.${purpose}.${expiresAt}.${nonce}`;
  return `${payload}.${await sign(payload)}`;
}

async function verifySessionToken(token: string | null | undefined, purpose: "demo" | "owner") {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 5 || parts[0] !== "v2" || parts[1] !== purpose) return false;

  const expiresAt = Number(parts[2]);
  if (!Number.isFinite(expiresAt) || expiresAt <= Math.floor(Date.now() / 1000)) return false;

  const payload = parts.slice(0, 4).join(".");
  const expected = await sign(payload);
  return constantTimeEqual(parts[4], expected);
}

export function createDemoSessionToken(ttlSeconds = 1800) {
  return createSessionToken("demo", ttlSeconds);
}

export function verifyDemoSessionToken(token?: string | null) {
  return verifySessionToken(token, "demo");
}

export function createOwnerSessionToken(ttlSeconds = 8 * 60 * 60) {
  return createSessionToken("owner", ttlSeconds);
}

export function verifyOwnerSessionToken(token?: string | null) {
  return verifySessionToken(token, "owner");
}
