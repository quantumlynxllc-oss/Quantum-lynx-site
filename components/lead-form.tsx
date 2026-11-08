'use client';
import { useRef, useState, type FormEvent } from 'react';
import { containsPatientDetails, PHI_MESSAGE, type Lead, type Attribution } from '@/lib/lead';
import { consentSnapshot, trackEvent } from '@/components/consent';
import { TurnstileField, type TurnstileHandle } from '@/components/turnstile';

export type FormField = { id: string; name: 'name' | 'email' | 'company' | 'jobtitle'; label: string; autocomplete: string; maxLength: number; error: string };
export const consultFields: FormField[] = [
  { id: 'f-name', name: 'name', label: 'Your name', autocomplete: 'name', maxLength: 120, error: 'Enter your name.' },
  { id: 'f-email', name: 'email', label: 'Work email', autocomplete: 'email', maxLength: 254, error: 'Enter a valid work email.' },
  { id: 'f-fac', name: 'company', label: 'Facility', autocomplete: 'organization', maxLength: 160, error: 'Enter your facility.' },
  { id: 'f-role', name: 'jobtitle', label: 'Your role', autocomplete: 'organization-title', maxLength: 120, error: 'Enter your role.' }
];
export const readinessFields = [
  { ...consultFields[1], id: 'r-email' }, { ...consultFields[2], id: 'r-fac' }
];
function attribution(): Attribution {
  const out: Attribution = { landing_page: location.pathname.slice(0, 300) };
  // Optional attribution is collected only with consent and never contains PHI.
  if (consentSnapshot() !== 'accepted') return out;
  const query = new URLSearchParams(location.search);
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'gclid'] as const) {
    const v = query.get(key); if (v && !containsPatientDetails(v)) out[key] = v.slice(0, key === 'gclid' ? 200 : 120);
  }
  try { if (document.referrer) out.referrer = new URL(document.referrer).origin.slice(0, 300); } catch { /* Invalid referrer omitted. */ }
  return out;
}
export function LeadForm({ fields, payload, label, heading, select, onSuccess, siteKey }: {
  fields: FormField[]; payload: Omit<Lead, 'email' | 'consent_version'>; label: string; heading?: string;
  select?: { value: string; options: { id: string; label: string }[]; onChange: (value: string) => void };
  onSuccess: () => void; siteKey: string;
}) {
  const [sending, setSending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const verification = useRef<TurnstileHandle>(null);
  const form = useRef<HTMLFormElement>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (sending) return;
    const data = new FormData(event.currentTarget);
    const invalid: Record<string, string> = {};
    const values: Record<string, string> = {};
    for (const field of fields) {
      const value = String(data.get(field.name) ?? '').trim(); values[field.name] = value;
      if (!value || (field.name === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))) invalid[field.name] = field.error;
      else if (containsPatientDetails(value)) invalid[field.name] = PHI_MESSAGE;
    }
    if (select && !select.options.some(o => o.id === select.value)) invalid.priority = 'Select a priority.';
    setErrors(invalid); setServerError('');
    if (Object.keys(invalid).length) { form.current?.querySelector<HTMLElement>(`[name="${Object.keys(invalid)[0]}"]`)?.focus(); return; }
    setSending(true);
    try {
      const token = await verification.current?.token();
      if (!token) throw new Error('Verification unavailable');
      const body: Lead = { ...payload, ...values, email: values.email, consent_version: 'v1', turnstile_token: token, website: String(data.get('website') ?? ''), attribution: attribution() };
      const response = await fetch('/api/lead', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        setServerError(result?.code === 'patient_information' ? PHI_MESSAGE : 'Try again, or email [BUSINESS EMAIL]');
        verification.current?.reset(); return;
      }
      trackEvent('generate_lead', { channel: payload.channel, priority: payload.priority ?? 'other' });
      onSuccess();
    } catch { setServerError('Try again, or email [BUSINESS EMAIL]'); verification.current?.reset(); }
    finally { setSending(false); }
  }
  const id = payload.channel === 'form' ? 'consult-form' : 'readiness-form';
  return <form ref={form} className={`${payload.channel === 'form' ? 'ql-cta-form' : 'ql-readiness-form'}`} id={id} onSubmit={submit} noValidate aria-busy={sending}>
    {heading && <div className="ql-eyebrow">{heading}</div>}
    {fields.map(field => <div className="ql-field" key={field.name}><label htmlFor={field.id}>{field.label}</label><input id={field.id} name={field.name} type={field.name === 'email' ? 'email' : 'text'} autoComplete={field.autocomplete} required maxLength={field.maxLength} disabled={sending} aria-invalid={!!errors[field.name]} aria-describedby={`${field.id}-notice${errors[field.name] ? ` ${field.id}-error` : ''}`} /><span className="ql-sr-only" id={`${field.id}-notice`}>Do not include patient information.</span>{errors[field.name] && <p className="ql-field-error" id={`${field.id}-error`}>{errors[field.name]}</p>}</div>)}
    {select && <div className="ql-field"><label htmlFor="f-pri">Priority</label><select id="f-pri" name="priority" required value={select.value} disabled={sending} onChange={event => select.onChange(event.target.value)} aria-invalid={!!errors.priority} aria-describedby={errors.priority ? 'f-pri-error' : undefined}>{select.options.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}</select>{errors.priority && <p className="ql-field-error" id="f-pri-error">{errors.priority}</p>}</div>}
    <input className="ql-honeypot" type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
    <TurnstileField ref={verification} siteKey={siteKey} />
    {serverError && <p className="ql-form-error" role="alert">{serverError}</p>}
    <button className="ql-btn ql-btn-primary ql-btn-full" type="submit" disabled={sending}>{sending ? 'Sending' : label}</button>
    <div className={`ql-form-notice ${payload.channel === 'form' ? 'ql-caption' : 'qs-fine'}`}>Do not include patient information. This form is not for PHI.</div>
    <noscript><p className="ql-form-error">Enable JavaScript to send this form.</p></noscript>
  </form>;
}
