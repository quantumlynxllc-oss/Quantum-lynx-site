'use client';
import { useRef, useState } from 'react';
import { services, triageFor, type Priority } from '@/lib/content';
import { usePriority } from '@/components/priority';
import { LeadForm, consultFields } from '@/components/lead-form';

export function Consult({ numbered = true, siteKey, schedulerUrl }: { numbered?: boolean; siteKey: string; schedulerUrl?: string }) {
  const { priority, setPriority } = usePriority();
  const [sent, setSent] = useState(false);
  const confirmation = useRef<HTMLDivElement>(null);
  const Heading = numbered ? 'h2' : 'h1';
  return <section className="ql-cta-section" id="consult"><div className="ql-container ql-cta-grid"><div><div className="ql-eyebrow on-dark">{numbered ? '07 / Engagement' : 'Engagement'}</div><Heading className="ql-h1 ql-consult-title">A <span className="ql-accent-text">20-minute</span> consult. Decide from there.</Heading><p className="ql-body-lg ql-consult-copy">Get a review of your current program, your top three exposures, and a scope if it fits. No obligation.</p><ul className="ql-cta-list"><li>Reply within 1 business day</li><li>Priority response for crisis requests</li><li>BAA signed before any PHI changes hands</li></ul></div>
    <div className="ql-cta-form-wrap" id="consult-slot">{sent ? <div ref={confirmation} tabIndex={-1} role="status"><div className="ql-eyebrow">Received</div><div className="ql-h3 ql-confirm-title">{priority === 'crisis' ? 'Crisis request received. Call [CRISIS LINE] if this cannot wait.' : 'Received. Expect a reply within 1 business day.'}</div>{schedulerUrl ? <><iframe className="ql-scheduler" title="Schedule a consult with Quantum Lynx" src={schedulerUrl} /><p className="ql-scheduler-fallback">We will email you times instead.</p></> : <div className="qs-portrait ql-scheduler-placeholder">[HUBSPOT MEETINGS SCHEDULER]</div>}</div>
      : <LeadForm fields={consultFields} payload={{ channel: 'form', priority }} heading="Schedule a consult" label={triageFor(priority).cta} select={{ value: priority, options: [...services.triage, { id: 'other', label: 'Something else' }], onChange: value => setPriority(value as Priority) }} siteKey={siteKey} onSuccess={() => { setSent(true); requestAnimationFrame(() => confirmation.current?.focus()); }} />}
    </div></div></section>;
}
