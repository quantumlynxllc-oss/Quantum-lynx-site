import 'server-only';
export function turnstileSiteKey() {
  return process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || (process.env.VERCEL_ENV === 'production' ? '' : '1x00000000000000000000AA');
}
export function schedulerUrl() {
  const value = process.env.NEXT_PUBLIC_ZOHO_BOOKINGS_URL;
  if (!value) return undefined;
  try {
    const url = new URL(value);
    const allowed = ['zohobookings.com', 'zohobookings.eu', 'zohobookings.in', 'zohobookings.com.au', 'zohobookings.jp', 'zohobookings.ca'].some(domain => url.hostname === domain || url.hostname.endsWith(`.${domain}`));
    return url.protocol === 'https:' && allowed && !url.username && !url.password ? url.toString() : undefined;
  } catch { return undefined; }
}
