'use client';
import { services, triageFor, type Priority } from '@/lib/content';
import { usePriority } from '@/components/priority';
import { trackEvent } from '@/components/consent';
export function TriageDesk() {
  const { priority, setPriority } = usePriority();
  const selected = triageFor(priority);
  return <><div className="ql-eyebrow">Triage desk</div><h2>What is on your desk right now?</h2><div className="qs-opts">{services.triage.map(t => <button className="qs-opt" key={t.id} type="button" data-triage={t.id} aria-pressed={priority === t.id} onClick={() => { setPriority(t.id as Priority); trackEvent('triage_select', { priority: t.id }); }}><span className="qs-tick" aria-hidden="true" /><span>{t.label}</span></button>)}</div><div className="qs-result" aria-live="polite"><div><div className="qs-kicker">Start with</div><strong>{selected.service}</strong></div><div><div className="qs-kicker">First response</div><strong>{selected.response}</strong></div><p>{selected.first}</p></div><a className="ql-btn ql-btn-primary" href="#consult">{selected.cta}</a></>;
}
