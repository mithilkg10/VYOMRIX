// Server-only signing for isolated recruiter sessions.
const encoder = new TextEncoder();

export const DEMO_COOKIE_NAME = "vyomrix_demo";

function getDemoSecret() {
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
    encoder.encode(getDemoSecret()),
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

export async function createDemoSessionToken(ttlSeconds = 1800) {
  const expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
  const nonceBytes = new Uint8Array(16);
  crypto.getRandomValues(nonceBytes);
  const nonce = Array.from(nonceBytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  const payload = `v1.${expiresAt}.${nonce}`;
  return `${payload}.${await sign(payload)}`;
}

export async function verifyDemoSessionToken(token?: string | null) {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 4 || parts[0] !== "v1") return false;

  const expiresAt = Number(parts[1]);
  if (!Number.isFinite(expiresAt) || expiresAt <= Math.floor(Date.now() / 1000)) return false;

  const payload = parts.slice(0, 3).join(".");
  const expected = await sign(payload);
  return constantTimeEqual(parts[3], expected);
}
