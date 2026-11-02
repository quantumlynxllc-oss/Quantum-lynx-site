import 'server-only';
import { site, triageFor } from '@/lib/content';
import { companyDomain, scoreLead, routeLead, type Route } from '@/lib/server/scoring';
import type { Lead } from '@/lib/lead';

type Contact = { id: string; properties: Record<string, string | null> };
export type Enrichment = { name?: string; domain: string; numberofemployees?: string; city?: string; state?: string; country?: string; facility_type?: Lead['facility_type'] };
async function request(path: string, init: RequestInit = {}) {
  const token = process.env.HUBSPOT_PRIVATE_APP_TOKEN;
  if (!token) throw new Error('hubspot_unconfigured');
  const host = path.startsWith('/submissions/') ? 'https://api.hsforms.com' : 'https://api.hubapi.com';
  const response = await fetch(`${host}${path}`, { ...init, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...init.headers }, signal: AbortSignal.timeout(8000), cache: 'no-store' });
  if (!response.ok) { if (response.status === 404) return null; throw new Error(`hubspot_${response.status}`); }
  if (response.status === 204) return {};
  return response.json();
}
export function leadProperties(lead: Lead) {
  const name = lead.name?.trim().split(/\s+/);
  const values: Record<string, string | undefined> = {
    email: lead.email, ...(name?.length ? { firstname: name[0], lastname: name.slice(1).join(' ') } : {}),
    company: lead.company, jobtitle: lead.jobtitle, phone: lead.phone,
    ql_lead_channel: lead.channel, ql_priority: lead.priority,
    ql_recommended_service: lead.priority ? triageFor(lead.priority).service : undefined,
    ql_facility_type: lead.facility_type, ql_timeline: lead.timeline,
    ql_readiness_score: lead.readiness ? String(lead.readiness.score) : undefined,
    ql_readiness_tier: lead.readiness?.tier, ql_top_exposures: lead.readiness?.exposures.join('\n'),
    ql_lead_score: String(scoreLead(lead)), ql_route: routeLead(lead),
    ql_landing_page: lead.attribution?.landing_page, hs_google_click_id: lead.attribution?.gclid
  };
  // Portal owners can omit unavailable fields without forking the JSON source.
  const omit = new Set((process.env.HUBSPOT_OMIT_PROPERTIES ?? '').split(',').map(p => p.trim()));
  return Object.fromEntries(Object.entries(values).filter(([key, value]) => value !== undefined && !omit.has(key))) as Record<string, string>;
}
export async function captureHubspot(lead: Lead): Promise<Contact> {
  const guid = process.env.HUBSPOT_CONSULT_FORM_GUID;
  const portal = process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID;
  if (!process.env.HUBSPOT_PRIVATE_APP_TOKEN || !guid || !portal) throw new Error('hubspot_unconfigured');
  const current = await request(`/crm/v3/objects/contacts/${encodeURIComponent(lead.email)}?idProperty=email&properties=lifecyclestage,hs_lead_status`) as Contact | null;
  const properties = leadProperties(lead);
  const contact = current
    ? await request(`/crm/v3/objects/contacts/${current.id}`, { method: 'PATCH', body: JSON.stringify({ properties }) }) as Contact
    : await createContact(properties);
  if (!contact?.id) throw new Error('hubspot_contact_missing');
  await updateCompany(contact.id, lead);
  const fields = ['email', 'firstname', 'lastname', 'company', 'jobtitle'].filter(name => properties[name]).map(name => ({ objectTypeId: '0-1', name, value: properties[name] }));
  const context = { ...(lead.attribution?.hutk ? { hutk: lead.attribution.hutk } : {}), ...(lead.attribution?.landing_page ? { pageUri: new URL(lead.attribution.landing_page, process.env.NEXT_PUBLIC_SITE_URL || site.currentUrl).toString() } : {}) };
  const form = await request(`/submissions/v3/integration/secure/submit/${encodeURIComponent(portal)}/${encodeURIComponent(guid)}`, { method: 'POST', body: JSON.stringify({ fields, context }) });
  if (!form) throw new Error('hubspot_form_missing');
  return contact;
}
async function createContact(properties: Record<string, string>): Promise<Contact> {
  try { return await request('/crm/v3/objects/contacts', { method: 'POST', body: JSON.stringify({ properties: { ...properties, lifecyclestage: 'lead', hs_lead_status: 'NEW' } }) }) as Contact; }
  catch (error) {
    // Handle simultaneous submissions without changing an existing lifecycle stage.
    if (!(error instanceof Error) || error.message !== 'hubspot_409') throw error;
    return await request(`/crm/v3/objects/contacts/${encodeURIComponent(properties.email)}?idProperty=email`, { method: 'PATCH', body: JSON.stringify({ properties }) }) as Contact;
  }
}
export async function updateCompany(contactId: string, lead: Lead, enrichment?: Enrichment) {
  const domain = companyDomain(lead.email);
  if (!domain) return;
  const search = await request('/crm/v3/objects/companies/search', { method: 'POST', body: JSON.stringify({ filterGroups: [{ filters: [{ propertyName: 'domain', operator: 'EQ', value: domain }] }], properties: ['domain'], limit: 1 }) }) as { results: { id: string }[] };
  const { facility_type: _facility, ...details } = enrichment ?? { domain };
  void _facility;
  const properties = { name: lead.company || enrichment?.name || domain, ...details };
  const company = search.results[0]
    ? await request(`/crm/v3/objects/companies/${search.results[0].id}`, { method: 'PATCH', body: JSON.stringify({ properties }) })
    : await request('/crm/v3/objects/companies', { method: 'POST', body: JSON.stringify({ properties }) });
  if (company?.id) await request(`/crm/v4/objects/contacts/${contactId}/associations/default/companies/${company.id}`, { method: 'PUT' });
}
export async function updateLead(contactId: string, lead: Lead) { await request(`/crm/v3/objects/contacts/${contactId}`, { method: 'PATCH', body: JSON.stringify({ properties: leadProperties(lead) }) }); }
export async function routeTask(contactId: string, lead: Lead, route: Route) {
  const titles: Record<Route, string> = { call_now: 'CRISIS: contact a person now', call_today: 'Contact this website lead today', consult_sequence: 'Follow up with consult scheduler', nurture: 'Send requested summary and review follow-up' };
  const due = new Date(); if (route === 'call_today') due.setUTCHours(23, 59, 0, 0);
  const note = [`Channel: ${lead.channel}`, `Priority: ${lead.priority ?? 'other'}`, `Route: ${route}`, `Score: ${scoreLead(lead)}`, ...(lead.readiness ? [`Readiness: ${lead.readiness.score}/12 (${lead.readiness.tier})`, ...lead.readiness.exposures] : [])].join('\n');
  await request('/crm/v3/objects/tasks', { method: 'POST', body: JSON.stringify({ properties: { hs_task_subject: titles[route], hs_task_body: note, hs_task_status: 'NOT_STARTED', hs_task_priority: route === 'call_now' ? 'HIGH' : 'MEDIUM', hs_task_type: route === 'call_now' || route === 'call_today' ? 'CALL' : 'EMAIL', hs_timestamp: due.toISOString(), ...(process.env.HUBSPOT_OWNER_ID ? { hubspot_owner_id: process.env.HUBSPOT_OWNER_ID } : {}) }, associations: [{ to: { id: contactId }, types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 204 }] }] }) });
}
