import { readiness } from '@/lib/content';
import type { Priority } from '@/lib/content';

export type ReadinessResult = { score: number; tier: 'ready' | 'exposed' | 'at_risk'; exposures: string[] };
export type Attribution = Partial<Record<'landing_page' | 'referrer' | 'utm_source' | 'utm_medium' | 'utm_campaign' | 'gclid' | 'hutk', string>>;
export type Lead = {
  channel: 'form' | 'readiness' | 'assistant' | 'voice';
  email: string;
  consent_version: string;
  name?: string;
  company?: string;
  jobtitle?: string;
  phone?: string;
  priority?: Priority;
  facility_type?: 'physician_owned_hospital' | 'surgical_center' | 'ltac' | 'other';
  timeline?: 'under_90_days' | 'under_12_months' | 'unknown';
  readiness?: ReadinessResult;
  attribution?: Attribution;
  turnstile_token?: string;
  website?: string;
};
export type Answers = Record<string, number>;
export function readinessResult(answers: Answers) {
  const scored = readiness.questions.filter(q => !('scored' in q) || q.scored !== false);
  const done = scored.filter(q => answers[q.id] !== undefined);
  const score = done.reduce((sum, q) => sum + (2 - answers[q.id]), 0);
  const answered = readiness.questions.filter(q => answers[q.id] !== undefined).length;
  const tier = readiness.tiers.find(t => score >= t.min)!;
  const weak = done.filter(q => answers[q.id] > 0).sort((a, b) => answers[b.id] - answers[a.id]);
  const exposures = weak.slice(0, 3).map(q => q.weak!);
  const next = answers.window === 2 ? 'Survey Support' : (weak[0]?.service ?? 'Program review');
  return { score, answered, tier, exposures, next, hasScoredAnswer: done.length > 0 };
}
export const PHI_MESSAGE = 'Please remove patient details. This form cannot accept patient information.';
// Contact names are permitted. Names linked to clinical details, identifiers,
// and dates of birth are rejected before any network submission or storage.
const PHI_PATTERNS = [
  /\b(?:mrn|medical\s+record\s+(?:number|no)|ssn|social\s+security|dob|date\s+of\s+birth)\b/i,
  /\b\d{3}[- ]\d{2}[- ]\d{4}\b/,
  /\b[Pp]atient(?:'s)?\s+(?!(?:[Ss]afety|[Cc]are|[Ee]xperience|[Rr]elations)\b)(?:name\s*(?:is|:)?\s*)?[A-Z][a-z]+\s+[A-Z][a-z]+\b/,
  /\bpatient(?:'s)?\s+name\s*(?:is|:)\s*\S+\s+\S+/i,
  /\b[A-Z][a-z]+\s+[A-Z][a-z]+\s+(?:was\s+|is\s+|has\s+|with\s+)?(?:diagnosed|admitted|treated|tested\s+positive|infected|suffering|MRSA|COVID|C\.?\s*diff|tuberculosis)\b/i,
  /\b(?:patient|diagnosis|diagnosed|admitted|discharged)\b.{0,60}\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/i,
  /\b(?:patient|room|bed)\s*(?:#|number|no\.?|:)\s*\d+\b/i
];
export function containsPatientDetails(value: unknown): boolean {
  if (typeof value === 'string') return PHI_PATTERNS.some(pattern => pattern.test(value));
  if (Array.isArray(value)) return value.some(containsPatientDetails);
  if (value && typeof value === 'object') return Object.values(value).some(containsPatientDetails);
  return false;
}
