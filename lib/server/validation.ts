import 'server-only';
import Ajv2020 from 'ajv/dist/2020';
import addFormats from 'ajv-formats';
import schema from '@/schema/lead.schema.json';
import { readiness } from '@/lib/content';
import { containsPatientDetails, type Lead } from '@/lib/lead';
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);
const validate = ajv.compile<Lead>(schema);
export function validateLead(value: unknown): { ok: true; lead: Lead } | { ok: false; code: string } {
  if (!validate(value)) return { ok: false, code: 'invalid_request' };
  if (containsPatientDetails(value)) return { ok: false, code: 'patient_information' };
  if (value.consent_version !== 'v1') return { ok: false, code: 'invalid_request' };
  if (!['form', 'readiness'].includes(value.channel)) return { ok: false, code: 'unsupported_channel' };
  if (value.channel === 'form' && (!value.name?.trim() || !value.company?.trim() || !value.jobtitle?.trim() || !value.priority)) return { ok: false, code: 'missing_fields' };
  if (value.channel === 'readiness' && (!value.company?.trim() || !value.readiness)) return { ok: false, code: 'missing_fields' };
  if (value.readiness) {
    const tier = readiness.tiers.find(t => value.readiness!.score >= t.min);
    const exposures = new Set(readiness.questions.map(q => q.weak).filter(Boolean));
    if (tier?.id !== value.readiness.tier || value.readiness.exposures.some(e => !exposures.has(e)) || new Set(value.readiness.exposures).size !== value.readiness.exposures.length) return { ok: false, code: 'invalid_request' };
  }
  const lead: Lead = { ...value, email: value.email.trim().toLowerCase() };
  for (const key of ['name', 'company', 'jobtitle', 'phone'] as const) if (lead[key]) lead[key] = lead[key]!.trim();
  return { ok: true, lead };
}
