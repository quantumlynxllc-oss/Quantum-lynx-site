import 'server-only';
import { triageFor } from '@/lib/content';
import { scoreLead, routeLead } from '@/lib/server/scoring';
import type { Lead } from '@/lib/lead';

export type Enrichment = { name?: string; domain: string; numberofemployees?: string; city?: string; state?: string; country?: string; facility_type?: Lead['facility_type'] };

// Provider-independent context used by CRM notes and the existing email failover.
export function leadProperties(lead: Lead) {
  const values = {
    name: lead.name, email: lead.email, company: lead.company, jobtitle: lead.jobtitle, phone: lead.phone,
    ql_lead_channel: lead.channel, ql_priority: lead.priority,
    ql_recommended_service: lead.priority ? triageFor(lead.priority).service : undefined,
    ql_facility_type: lead.facility_type, ql_timeline: lead.timeline,
    ql_readiness_score: lead.readiness?.score, ql_readiness_tier: lead.readiness?.tier,
    ql_top_exposures: lead.readiness?.exposures.join('\n'),
    ql_lead_score: scoreLead(lead), ql_route: routeLead(lead),
    ql_landing_page: lead.attribution?.landing_page, ...lead.attribution,
    consent_version: lead.consent_version
  };
  return Object.fromEntries(Object.entries(values).filter(([, value]) => value !== undefined));
}

export function leadNote(lead: Lead, enrichment?: Enrichment) {
  return JSON.stringify({ ...leadProperties(lead), ...(enrichment ? { company_enrichment: enrichment } : {}) }, null, 2);
}
