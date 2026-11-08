import 'server-only';
import type { Lead } from '@/lib/lead';
import { captureZoho, updateCompany, updateLead, routeTask } from '@/lib/server/zoho';
import type { Enrichment } from '@/lib/server/lead-context';
import { enrichCompany, enrollConsult } from '@/lib/server/apollo';
import { failover, alertOwner } from '@/lib/server/delivery';
import { routeLead } from '@/lib/server/scoring';
type Dependencies = {
  capture: (lead: Lead) => Promise<{ id: string }>;
  backup: (lead: Lead, reason: string) => Promise<void>;
  alert: (kind: string, route: string, contactId?: string) => Promise<void>;
  enrich: (lead: Lead) => Promise<Enrichment | undefined>;
  company: (contactId: string, lead: Lead, enrichment?: Enrichment) => Promise<void>;
  update: (contactId: string, lead: Lead) => Promise<void>;
  task: typeof routeTask;
  sequence: (lead: Lead) => Promise<boolean>;
};
export const integrations: Dependencies = { capture: captureZoho, backup: failover, alert: alertOwner, enrich: enrichCompany, company: updateCompany, update: updateLead, task: routeTask, sequence: enrollConsult };
export async function deliverLead(input: Lead, deps = integrations) {
  // Anti-abuse tokens are never persisted in either delivery destination.
  const { turnstile_token: _token, website: _website, ...lead } = input;
  void _token; void _website;
  try {
    const contact = await deps.capture(lead);
    return { destination: 'zoho' as const, contactId: contact.id, lead };
  } catch {
    // Success is reported only after a real destination accepts the lead.
    await deps.backup(lead, 'zoho_unavailable');
    await deps.alert('zoho_failover', routeLead(lead)).catch(() => {});
    return { destination: 'failover' as const, lead };
  }
}
export async function finishLead(lead: Lead, contactId: string, deps = integrations) {
  let enrichment: Enrichment | undefined;
  try { enrichment = await deps.enrich(lead); } catch { /* Enrichment cannot block routing. */ }
  const enriched = { ...lead, ...(!lead.facility_type && enrichment?.facility_type ? { facility_type: enrichment.facility_type } : {}) };
  const route = routeLead(enriched);
  const work = await Promise.allSettled([enrichment ? deps.company(contactId, enriched, enrichment) : Promise.resolve(), deps.update(contactId, enriched), deps.task(contactId, enriched, route)]);
  if (route === 'call_now') {
    // Deliver crisis notifications to the owner's existing Formspree inbox too,
    // so an unset phone webhook never leaves a crisis solely in the CRM.
    await deps.backup(enriched, 'crisis_priority_alert');
    await deps.alert('crisis_request', route, contactId).catch(() => {});
  } else if (route === 'consult_sequence') {
    try { await deps.sequence(enriched); } catch { /* The Zoho task is already queued. */ }
  }
  if (work.some(result => result.status === 'rejected')) {
    await deps.backup(enriched, 'routing_needs_review');
    await deps.alert('routing_needs_review', route, contactId).catch(() => {});
  }
}
