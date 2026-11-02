import Link from 'next/link';
import { services, site } from '@/lib/content';
import { CookieSettings } from '@/components/consent';
import { TriageDesk } from '@/components/triage';

export function Arrow() { return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>; }
export function PageHead({ eyebrow, title, lede }: { eyebrow: string; title: string; lede?: string }) {
  return <section className="qs-band qs-pagehead"><div className="ql-container"><div className="ql-eyebrow on-dark">{eyebrow}</div><h1 className="ql-h1 ql-page-title">{title}</h1>{lede && <p className="ql-body-lg ql-page-lede">{lede}</p>}</div></section>;
}
export function SectionHead({ eyebrow, title }: { eyebrow: string; title: string }) { return <div className="ql-sec-head"><div className="ql-eyebrow">{eyebrow}</div><h2 className="ql-h2 ql-mt16">{title}</h2></div>; }
export function Footer() {
  return <footer className="ql-footer"><div className="ql-container"><div className="ql-footer-grid">
    <div><img className="ql-footer-mark" src="/ql-helix.svg" width="27" height="56" alt="" /><div className="ql-footer-name">Quantum Lynx LLC</div><p className="ql-caption ql-footer-description">Infection control for physician-owned hospitals and surgical centers.</p></div>
    <div className="ql-footer-col"><div className="ql-label">Services</div><Link href="/services">All service lines</Link><Link href="/readiness-check">Readiness Check</Link></div>
    <div className="ql-footer-col"><div className="ql-label">Company</div><Link href="/about">About</Link><a href={site.keep.linkedin}>LinkedIn</a></div>
    <div className="ql-footer-col"><div className="ql-label">Legal</div><Link href="/privacy">Privacy and HIPAA/BAA</Link><Link href="/sla">Service Level Agreement</Link><CookieSettings /></div>
  </div><div className="ql-footer-legal"><span>© 2026 Quantum Lynx LLC</span><span className="ql-mono">NO PHI IN FORMS OR CHAT</span></div></div></footer>;
}
export function Hero() {
  return <section className="qs-hero ql-hero-surface"><div className="ql-hero-grain" aria-hidden="true" /><img className="qs-hero-mark" src="/ql-helix.svg" width="510" height="1060" alt="" aria-hidden="true" />
    <div className="ql-container"><div className="qs-hero-grid"><div><div className="ql-eyebrow ql-hero-eyebrow">CIC-led · BAA on day one · Houston-based, nationwide</div>
      <h1 className="qs-h1">Infection control that holds up <span className="ql-accent-text">under survey</span></h1>
      <p className="qs-sub ql-dark-muted">Remote surveillance, survey support, and crisis response for physician-owned hospitals and surgical centers, with one named CIC accountable.</p>
      <div className="qs-cta"><a className="ql-btn ql-btn-primary" href="#consult">Schedule a 20-minute consult</a><Link className="ql-btn ql-btn-ghost-dark" href="/readiness-check">Take the Readiness Check</Link></div></div>
      <div className="qs-triage" id="triage-slot"><TriageDesk /></div></div>
      <div className="qs-stats ql-dark-divider">{services.proof.map(p => <div className="qs-stat" key={p.label}><b>{p.value}</b><span className="ql-dark-muted">{p.label}</span></div>)}</div>
      <p className="qs-proof-note ql-dark-muted">{services.proofNote}</p>
    </div></section>;
}
export function Ledger() {
  return <div className="qs-ledger">{services.services.map(s => <Link className="qs-row" href={`/services/${s.slug}`} key={s.slug}><span className="qs-row-n">{s.n}</span><span className="qs-row-t">{s.title}</span><span className="qs-row-d">{s.ledger}</span><span className="qs-row-m">{s.delivery.join(' · ')}</span><Arrow /></Link>)}</div>;
}
export function Steps() {
  return <section className="ql-section ql-white-surface"><div className="ql-container"><SectionHead eyebrow="02 / How it works" title="One call to a program you can defend." /><div className="qs-steps">{services.steps.map(s => <div className="qs-step" key={s.n}><div className="qs-step-n">{s.n}</div><h3>{s.title}</h3><p>{s.text}</p></div>)}</div></div></section>;
}
export function ReadinessTeaser() {
  return <section className="ql-section qs-band"><div className="ql-container qs-split"><div><div className="ql-eyebrow on-dark">03 / Readiness Check</div><h2 className="ql-h2 ql-white-text ql-mt16">Find your exposure in 3 minutes.</h2><p className="ql-body-lg ql-teaser-copy">Seven questions. A readiness score and your top three exposures. No patient data, no login.</p><div className="qs-cta"><Link className="ql-btn ql-btn-primary" href="/readiness-check">Start the Readiness Check</Link></div></div>
    <div className="qs-sample"><div className="ql-panel-line"><span className="ql-label ql-dark-muted">Sample result</span><span className="qs-tag warn">Exposed</span></div><ol><li><b>01</b><span>No mock survey in the last 12 months</span></li><li><b>02</b><span>One person owns NHSN, with no backup</span></li><li><b>03</b><span>Infection control plan review overdue</span></li></ol></div></div></section>;
}
export function FieldRecord({ numbered = true }: { numbered?: boolean }) {
  return <section className="ql-section"><div className="ql-container"><SectionHead eyebrow={numbered ? '04 / Field record' : 'Field record'} title="Harvey. Outbreaks. Surveyors on site." /><div className="qs-record"><div><div className="qs-big">12,000</div><div className="ql-label ql-record-caption">Patients tested in 8 days</div><p className="ql-body-sm ql-record-copy">Set up, ran, and reported cases for a drive-up COVID-19 testing center in Liberty County.</p></div><div className="qs-facts">{services.record.map(r => <div className="qs-fact" key={r.title}><b>{r.title}</b><span>{r.text}</span></div>)}</div></div></div></section>;
}
export function Quotes({ numbered = true }: { numbered?: boolean }) {
  return <section className="ql-section ql-bone-surface"><div className="ql-container"><SectionHead eyebrow={numbered ? '05 / Client voices' : 'Client voices'} title="From the people accountable for the result." /><div className="qs-quotes">{services.quotes.map(q => <figure className="qs-quote" key={q.org}><blockquote>{q.text}</blockquote><figcaption><b>{q.role}</b>{q.org}</figcaption></figure>)}</div></div></section>;
}
export function Principal({ numbered = true }: { numbered?: boolean }) {
  return <section className="ql-section"><div className="ql-container ql-about-grid"><div><div className="ql-eyebrow">{numbered ? '06 / Principal' : 'Principal'}</div><h2 className="ql-h2 ql-mt16">Run by a CIC. Reached by name.</h2><p className="ql-body-lg ql-principal-copy">{services.principal.name} leads every engagement as {services.principal.title}, with a background in clinical microbiology and hospital program oversight.</p><ul className="ql-credentials">{services.principal.credentials.map(c => <li key={c.k}><span className="k">{c.k}</span><span className="v">{c.v}</span></li>)}</ul></div><div className="ql-portrait-wrap"><div className="qs-portrait">[HEADSHOT]</div></div></div></section>;
}
