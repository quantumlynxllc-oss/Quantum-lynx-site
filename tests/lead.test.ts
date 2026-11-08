import test from 'node:test';
import assert from 'node:assert/strict';
import { containsPatientDetails, readinessResult, type Lead } from '../lib/lead';
import { validateLead } from '../lib/server/validation';
import { scoreLead, routeLead, companyDomain } from '../lib/server/scoring';
import { deliverLead, finishLead, integrations } from '../lib/server/pipeline';
import { rateLimit } from '../lib/server/abuse';
import { readiness } from '../lib/content';

const lead: Lead = { channel: 'form', name: 'Website Test', email: 'website-test@example.org', company: 'Sample Facility', jobtitle: 'Quality director', priority: 'survey', consent_version: 'v1', website: '', turnstile_token: 'test-token' };

test('contract rejects unknown keys, missing required form fields, invalid email and nested keys', () => {
  for (const body of [{ ...lead, note: 'extra' }, { ...lead, jobtitle: '' }, { ...lead, name: undefined }, { ...lead, email: 'bad' }, { ...lead, attribution: { anything: 'x' } }, { ...lead, website: 'bot' }, { ...lead, consent_version: 'v0' }]) assert.equal(validateLead(body).ok, false);
  assert.equal(validateLead(lead).ok, true);
  assert.equal(validateLead({ ...lead, email: 'reader@gmail.com' }).ok, true);
});

test('patient details are rejected on all text surfaces without rejecting business terminology', () => {
  for (const text of ['MRN 123456', 'DOB 01/02/1980', 'date of birth: 1980-01-02', 'SSN 123-45-6789', '123-45-6789', 'patient Jane Doe', 'Patient Jane Doe', 'patient name: jane doe', 'John Doe tested positive for MRSA', 'patient admitted 10/29/2026', 'room #123']) {
    assert.equal(containsPatientDetails(text), true, text);
    assert.deepEqual(validateLead({ ...lead, company: text }), { ok: false, code: 'patient_information' });
  }
  for (const text of ['patient safety committee', 'Patient Safety Director', 'MD Anderson Cancer Center', 'Infection Preventionist', 'We need a survey review', 'Travaughn Baker-Johnson', 'MRSA program oversight']) assert.equal(containsPatientDetails(text), false, text);
  assert.equal(containsPatientDetails({ attribution: { utm_campaign: 'MRN 1234' } }), true);
});

test('all 729 scored answer combinations use the exact score and survey window never changes it', () => {
  const questions = readiness.questions.filter(q => q.scored !== false);
  for (let n = 0; n < 729; n++) {
    let digits = n; const answers: Record<string, number> = {}; let expected = 0;
    for (const q of questions) { const choice = digits % 3; digits = Math.floor(digits / 3); answers[q.id] = choice; expected += 2 - choice; }
    for (const window of [0, 1, 2]) {
      const result = readinessResult({ ...answers, window });
      assert.equal(result.score, expected); assert.equal(result.answered, 7);
      assert.equal(result.tier.id, expected >= 10 ? 'ready' : expected >= 6 ? 'exposed' : 'at_risk');
      assert.ok(result.exposures.length <= 3);
      if (window === 2) assert.equal(result.next, 'Survey Support');
    }
  }
  assert.equal(readinessResult({ window: 2 }).hasScoredAnswer, false);
  assert.equal(readinessResult({}).score, 0);
});

test('readiness payload must use an allowed exposure and tier consistent with score', () => {
  const valid = { channel: 'readiness', email: lead.email, company: 'Sample Facility', consent_version: 'v1', readiness: { score: 6, tier: 'exposed', exposures: [readiness.questions[0].weak] } };
  assert.equal(validateLead(valid).ok, true);
  assert.equal(validateLead({ ...valid, readiness: { ...valid.readiness, tier: 'ready' } }).ok, false);
  assert.equal(validateLead({ ...valid, readiness: { ...valid.readiness, exposures: ['invented exposure'] } }).ok, false);
});

test('scoring boundaries and crisis override match the integration contract', () => {
  assert.equal(scoreLead(lead), 75); assert.equal(routeLead(lead), 'consult_sequence');
  assert.equal(scoreLead({ ...lead, email: 'reader@gmail.com' }), 60);
  assert.equal(scoreLead({ ...lead, timeline: 'under_90_days', facility_type: 'surgical_center' }), 100);
  for (const score of [0, 49, 50, 79, 80, 100]) assert.equal(routeLead({ ...lead, priority: 'crisis' }, score), 'call_now');
  assert.equal(routeLead(lead, 49), 'nurture'); assert.equal(routeLead(lead, 50), 'consult_sequence'); assert.equal(routeLead(lead, 79), 'consult_sequence'); assert.equal(routeLead(lead, 80), 'call_today');
  assert.equal(companyDomain('reader@proton.me'), undefined); assert.equal(companyDomain('reader@facility.org'), 'facility.org');
});

test('Zoho failure delivers backup before success and never stores anti-abuse tokens', async () => {
  const calls: string[] = [];
  const deps = { ...integrations, capture: async () => { calls.push('zoho'); throw new Error('forced'); }, backup: async (payload: Lead) => { calls.push('backup'); assert.equal(payload.turnstile_token, undefined); assert.equal(payload.website, undefined); assert.equal(payload.email, lead.email); }, alert: async () => { calls.push('alert'); } };
  const result = await deliverLead(lead, deps);
  assert.equal(result.destination, 'failover'); assert.deepEqual(calls, ['zoho', 'backup', 'alert']);
  await assert.rejects(deliverLead(lead, { ...deps, backup: async () => { throw new Error('both destinations down'); } }));
});

test('capture returns without waiting on Apollo; enrichment failure still routes crisis to a person', async () => {
  const calls: string[] = [];
  const deps = { ...integrations, capture: async () => ({ id: 'test-contact' }), enrich: async () => { calls.push('apollo'); throw new Error('unavailable'); }, update: async () => { calls.push('update'); }, company: async () => {}, task: async (_id: string, _lead: Lead, route: string) => { calls.push(route); }, sequence: async () => { calls.push('sequence'); return false; }, backup: async () => { calls.push('backup'); }, alert: async () => { calls.push('alert'); } };
  const crisis = { ...lead, priority: 'crisis' as const };
  const delivered = await deliverLead(crisis, deps); assert.deepEqual(calls, []);
  await finishLead(delivered.lead, 'test-contact', deps);
  assert.deepEqual(calls, ['apollo', 'update', 'call_now', 'backup', 'alert']);
});

test('rate limit rejects the seventh request and resets after ten minutes', () => {
  for (let i = 0; i < 6; i++) assert.equal(rateLimit('isolated-unit-test', 1000).allowed, true);
  assert.equal(rateLimit('isolated-unit-test', 1000).allowed, false);
  assert.equal(rateLimit('isolated-unit-test', 601001).allowed, true);
});
