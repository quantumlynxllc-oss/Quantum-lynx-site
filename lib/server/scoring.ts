import 'server-only';
import type { Lead } from '@/lib/lead';
export type Route = 'call_now' | 'call_today' | 'consult_sequence' | 'nurture';
const FREE_DOMAINS = new Set(['gmail.com', 'googlemail.com', 'yahoo.com', 'ymail.com', 'hotmail.com', 'outlook.com', 'live.com', 'msn.com', 'aol.com', 'icloud.com', 'me.com', 'proton.me', 'protonmail.com', 'proton.com', 'mail.com', 'gmx.com', 'yahoo.co.uk']);
export function companyDomain(email: string) { const domain = email.split('@')[1]?.toLowerCase(); return domain && !FREE_DOMAINS.has(domain) ? domain : undefined; }
export function scoreLead(lead: Lead) {
  let score = lead.priority === 'crisis' ? 70 : !lead.priority || lead.priority === 'other' ? 15 : 30;
  if (lead.facility_type === 'physician_owned_hospital' || lead.facility_type === 'surgical_center') score += 25;
  else if (lead.facility_type) score += 10;
  if (lead.timeline) score += ({ under_90_days: 25, under_12_months: 15, unknown: 5 })[lead.timeline];
  if (companyDomain(lead.email)) score += 15;
  score += ({ form: 30, readiness: 10, assistant: 0, voice: 0 })[lead.channel];
  if (lead.readiness) score += ({ ready: 0, at_risk: 15, exposed: 10 })[lead.readiness.tier];
  return Math.min(score, 100);
}
export function routeLead(lead: Lead, score = scoreLead(lead)): Route {
  if (lead.priority === 'crisis') return 'call_now';
  if (score >= 80) return 'call_today';
  if (score >= 50) return 'consult_sequence';
  return 'nurture';
}
