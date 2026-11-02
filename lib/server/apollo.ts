import 'server-only';
import { unstable_cache } from 'next/cache';
import type { Lead } from '@/lib/lead';
import type { Enrichment } from '@/lib/server/hubspot';
import { companyDomain } from '@/lib/server/scoring';
type Organization = { name?: string; estimated_num_employees?: number; city?: string; state?: string; country?: string };
const pending = new Map<string, Promise<Enrichment | undefined>>();
const cached = unstable_cache(async (domain: string): Promise<Enrichment | undefined> => {
  const response = await fetch(`https://api.apollo.io/api/v1/organizations/enrich?domain=${encodeURIComponent(domain)}`, { headers: { 'x-api-key': process.env.APOLLO_API_KEY!, Accept: 'application/json' }, signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error('apollo_enrichment_failed');
  const data = await response.json() as { organization?: Organization };
  const org = data.organization;
  if (!org) return undefined;
  const name = org.name ?? '';
  const facility_type = /physician[- ]owned hospital/i.test(name) ? 'physician_owned_hospital' : /(?:surgical|surgery)\s+cent(?:er|re)/i.test(name) ? 'surgical_center' : undefined;
  return { domain, ...(org.name ? { name: org.name } : {}), ...(org.estimated_num_employees ? { numberofemployees: String(org.estimated_num_employees) } : {}), ...(org.city ? { city: org.city } : {}), ...(org.state ? { state: org.state } : {}), ...(org.country ? { country: org.country } : {}), ...(facility_type ? { facility_type } : {}) };
}, ['ql-apollo-domain-v1'], { revalidate: 90 * 86400 });
export async function enrichCompany(lead: Lead) {
  const domain = companyDomain(lead.email);
  if (!process.env.APOLLO_API_KEY || !domain) return undefined;
  let work = pending.get(domain);
  if (!work) { work = cached(domain).finally(() => pending.delete(domain)); pending.set(domain, work); }
  return work;
}
export async function enrollConsult(lead: Lead) {
  const key = process.env.APOLLO_API_KEY;
  const sequence = process.env.APOLLO_CONSULT_SEQUENCE_ID;
  const account = process.env.APOLLO_EMAIL_ACCOUNT_ID;
  if (!key || !sequence || !account) return false;
  const headers = { 'x-api-key': key, 'Content-Type': 'application/json', Accept: 'application/json' };
  const contact = await fetch('https://api.apollo.io/api/v1/contacts', { method: 'POST', headers, body: JSON.stringify({ email: lead.email, organization_name: lead.company, title: lead.jobtitle, ...(lead.name ? { first_name: lead.name.split(' ')[0], last_name: lead.name.split(' ').slice(1).join(' ') } : {}) }), signal: AbortSignal.timeout(8000) });
  if (!contact.ok) throw new Error('apollo_contact_failed');
  const data = await contact.json() as { contact?: { id: string } };
  if (!data.contact?.id) throw new Error('apollo_contact_missing');
  const response = await fetch(`https://api.apollo.io/api/v1/emailer_campaigns/${encodeURIComponent(sequence)}/add_contact_ids`, { method: 'POST', headers, body: JSON.stringify({ emailer_campaign_id: sequence, contact_ids: [data.contact.id], send_email_from_email_account_id: account }), signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error('apollo_sequence_failed');
  return true;
}
