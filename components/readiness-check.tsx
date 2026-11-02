'use client';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { readiness } from '@/lib/content';
import { readinessResult, type Answers, type Lead, type ReadinessResult } from '@/lib/lead';
import { LeadForm, readinessFields } from '@/components/lead-form';
import { trackEvent } from '@/components/consent';

export function ReadinessCheck({ siteKey }: { siteKey: string }) {
  const [answers, setAnswers] = useState<Answers>({});
  const [sent, setSent] = useState(false);
  const tracked = useRef(false);
  const result = readinessResult(answers);
  const timeline = ({ 0: 'unknown', 1: 'under_12_months', 2: 'under_90_days' } as const)[answers.window as 0 | 1 | 2];
  const payload: Omit<Lead, 'email' | 'consent_version'> = { channel: 'readiness', readiness: { score: result.score, tier: result.tier.id as ReadinessResult['tier'], exposures: result.exposures }, ...(timeline ? { timeline } : {}) };
  function answer(question: string, index: number) {
    const updated = { ...answers, [question]: index }; setAnswers(updated); setSent(false);
    const next = readinessResult(updated);
    if (next.answered === 7 && !tracked.current) { trackEvent('readiness_complete', { tier: next.tier.id }); tracked.current = true; }
  }
  return <section className="ql-section ql-section-top64"><div className="ql-container"><div className="ql-sec-head ql-readiness-head"><div className="ql-eyebrow">Readiness Check</div><h1 className="ql-h1 ql-mt16">Find your exposure in 3 minutes.</h1><p className="ql-body-lg ql-readiness-lede">Seven questions about your program. Do not enter patient data.</p></div>
    <div className="qs-check"><div>{readiness.questions.map((q, i) => <fieldset className="qs-q ql-question" key={q.id}><legend className="qs-q-t ql-question-legend"><span>0{i + 1}</span>{q.text}</legend><div className="qs-choices ql-question-choices">{q.options.map((option, index) => <button className="qs-chip" type="button" data-q={q.id} key={option} aria-pressed={answers[q.id] === index} onClick={() => answer(q.id, index)}>{option}</button>)}</div></fieldset>)}</div>
      <aside className="qs-score" id="score-slot" aria-label="Readiness result"><div aria-live="polite" aria-atomic="true"><div className="ql-panel-line"><span className="ql-label ql-dark-muted">{result.answered} of 7 answered</span>{result.hasScoredAnswer && <span className={`qs-tag ${result.tier.tone}`}>{result.tier.label}</span>}</div><div className="qs-score-n ql-score-number">{result.score}<span className="ql-score-denominator"> / {readiness.maxScore}</span></div><div className="qs-bar" role="img" aria-label={`Readiness score ${result.score} of ${readiness.maxScore}`}><i className={`ql-score-${result.score}`} /></div>
        {result.hasScoredAnswer && <><div className="qs-sample ql-score-exposures"><span className="ql-label ql-dark-muted">Top exposures</span><ol>{result.exposures.length ? result.exposures.map((exposure, i) => <li key={exposure}><b>0{i + 1}</b><span>{exposure}</span></li>) : <li><span>None flagged so far</span></li>}</ol></div><div className="ql-score-next">Start with <b>{result.next}</b></div></>}
      </div>{result.hasScoredAnswer && (sent ? <div className="ql-summary-sent" role="status"><div className="ql-summary-title">Summary on its way.</div><Link className="ql-btn ql-btn-primary ql-btn-full ql-summary-link" href="/consult">Review it with a CIC</Link></div> : <LeadForm fields={readinessFields} payload={payload} label="Email my summary" siteKey={siteKey} onSuccess={() => setSent(true)} />)}<p className="qs-fine">{readiness.disclaimer}</p></aside>
    </div></div></section>;
}
