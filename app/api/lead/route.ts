import { after, NextRequest, NextResponse } from 'next/server';
import { validateLead } from '@/lib/server/validation';
import { rateLimit, verifyTurnstile } from '@/lib/server/abuse';
import { deliverLead, finishLead } from '@/lib/server/pipeline';

export const runtime = 'nodejs';
export const maxDuration = 60;
const reply = (status: number, code: string, headers?: Record<string, string>) => NextResponse.json({ ok: status === 200, code }, { status, headers: { 'Cache-Control': 'no-store', ...headers } });
export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host') || request.nextUrl.host;
  if (origin) {
    try { const source = new URL(origin); if (!['http:', 'https:'].includes(source.protocol) || source.host !== host) return reply(403, 'invalid_origin'); }
    catch { return reply(403, 'invalid_origin'); }
  }
  const ip = (request.headers.get('x-vercel-forwarded-for') || request.headers.get('x-forwarded-for'))?.split(',')[0].trim() || 'unknown';
  const limit = rateLimit(ip);
  if (!limit.allowed) return reply(429, 'rate_limited', { 'Retry-After': String(limit.retryAfter) });
  if (!request.headers.get('content-type')?.includes('application/json')) return reply(415, 'invalid_content_type');
  if (Number(request.headers.get('content-length')) > 16384) return reply(413, 'request_too_large');
  // Stream with a hard size limit; do not read or log an unbounded request body.
  let raw = '';
  try {
    const reader = request.body?.getReader(); if (!reader) return reply(400, 'invalid_request');
    const decoder = new TextDecoder(); let bytes = 0;
    while (true) { const { done, value } = await reader.read(); if (done) break; bytes += value.byteLength; if (bytes > 16384) { await reader.cancel(); return reply(413, 'request_too_large'); } raw += decoder.decode(value, { stream: true }); }
    raw += decoder.decode();
  } catch { return reply(400, 'invalid_request'); }
  let body: unknown; try { body = JSON.parse(raw); } catch { return reply(400, 'invalid_request'); }
  raw = '';
  if (body && typeof body === 'object' && 'website' in body && body.website) return reply(400, 'invalid_request');
  const validation = validateLead(body);
  if (!validation.ok) return reply(400, validation.code);
  const lead = validation.lead;
  if (!await verifyTurnstile(lead.turnstile_token, ip, host.split(':')[0])) return reply(400, 'verification_failed');
  try {
    const delivered = await deliverLead(lead);
    if (delivered.destination === 'hubspot') after(async () => {
      try { await finishLead(delivered.lead, delivered.contactId); }
      catch { console.error('lead_background_delivery_failed'); }
    });
    return reply(200, 'received');
  } catch {
    // Never include visitor data, request bodies, or vendor error text in logs.
    console.error('lead_delivery_unavailable');
    return reply(503, 'delivery_unavailable');
  }
}
