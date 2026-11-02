import 'server-only';
import { site } from '@/lib/content';
import type { Lead } from '@/lib/lead';
import { leadProperties } from '@/lib/server/hubspot';
export async function failover(lead: Lead, reason: string) {
  const endpoint = process.env.FORMSPREE_FAILOVER_URL || site.keep.formspreeFailover;
  const url = new URL(endpoint);
  if (url.protocol !== 'https:' || url.hostname !== 'formspree.io') throw new Error('failover_unconfigured');
  const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ ...leadProperties(lead), name: lead.name, email: lead.email, _subject: lead.priority === 'crisis' ? 'CRISIS: Quantum Lynx website request' : 'Quantum Lynx website request', delivery_reason: reason }), signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error(`failover_${response.status}`);
  // Formspree delivers the request to the owner as well as storing the backup.
}
export async function alertOwner(kind: string, route: string, contactId?: string) {
  const endpoint = process.env.OWNER_ALERT_WEBHOOK_URL;
  if (!endpoint) return;
  const url = new URL(endpoint);
  if (url.protocol !== 'https:') throw new Error('alert_unconfigured');
  const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind, route, contact_id: contactId, ...(route === 'call_now' && process.env.CRISIS_ALERT_TO ? { to: process.env.CRISIS_ALERT_TO } : {}) }), signal: AbortSignal.timeout(5000) });
  if (!response.ok) throw new Error('alert_failed');
}
