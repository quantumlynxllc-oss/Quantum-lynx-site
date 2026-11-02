import 'server-only';
import { createHash, randomUUID } from 'node:crypto';
const requests = new Map<string, { count: number; until: number }>();
const salt = randomUUID();
export function rateLimit(ip: string, now = Date.now()): { allowed: boolean; retryAfter: number } {
  // Store a process-salted hash, never the visitor's raw address or lead fields.
  const key = createHash('sha256').update(salt).update(ip).digest('hex');
  if (requests.size > 10_000) for (const [id, entry] of requests) if (entry.until <= now) requests.delete(id);
  let entry = requests.get(key);
  if (!entry || entry.until <= now) { entry = { count: 0, until: now + 600_000 }; requests.set(key, entry); }
  entry.count++;
  return { allowed: entry.count <= 6, retryAfter: Math.max(1, Math.ceil((entry.until - now) / 1000)) };
}
export async function verifyTurnstile(token: string | undefined, ip: string, hostname: string) {
  if (!token) return false;
  const production = process.env.VERCEL_ENV === 'production';
  const secret = process.env.TURNSTILE_SECRET_KEY || (production ? '' : '1x0000000000000000000000000000000AA');
  if (!secret || (production && /^(?:1x|2x|3x)0+/.test(secret))) return false;
  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: new URLSearchParams({ secret, response: token, ...(ip !== 'unknown' ? { remoteip: ip } : {}), idempotency_key: randomUUID() }), signal: AbortSignal.timeout(8000) });
    if (!response.ok) return false;
    const result = await response.json() as { success: boolean; hostname?: string; action?: string };
    return result.success && (!production || (result.hostname === hostname && result.action === 'lead'));
  } catch { return false; }
}
