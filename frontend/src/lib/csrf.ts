import { createHmac, randomBytes, timingSafeEqual } from "crypto";

const CSRF_SECRET = process.env.CSRF_SECRET || "default_dev_secret_change_me_in_prod";

export function generateCsrfToken(sessionId: string): string {
  // sessionId is typically the refresh token
  const nonce = randomBytes(16).toString('hex');
  const hmac = createHmac('sha256', CSRF_SECRET);
  hmac.update(`${nonce}:${sessionId}`);
  const signature = hmac.digest('hex');
  return `${nonce}.${signature}`;
}

export function validateCsrfToken(token: string, sessionId: string): boolean {
  if (!token || typeof token !== 'string') return false;
  
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  
  const [nonce, signature] = parts;
  const hmac = createHmac('sha256', CSRF_SECRET);
  hmac.update(`${nonce}:${sessionId}`);
  const expectedSignature = hmac.digest('hex');
  
  try {
    const expectedBuffer = Buffer.from(expectedSignature, 'hex');
    const actualBuffer = Buffer.from(signature, 'hex');
    if (expectedBuffer.length !== actualBuffer.length) return false;
    return timingSafeEqual(expectedBuffer, actualBuffer);
  } catch {
    return false;
  }
}
