import 'server-only';
export function turnstileSiteKey() {
  return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || (process.env.VERCEL_ENV === 'production' ? '' : '1x00000000000000000000AA');
}
export function schedulerUrl() {
  const value = process.env.NEXT_PUBLIC_HUBSPOT_MEETINGS_URL;
  if (!value) return undefined;
  try { const url = new URL(value); return url.protocol === 'https:' && url.hostname === 'meetings.hubspot.com' ? url.toString() : undefined; } catch { return undefined; }
}
