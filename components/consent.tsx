'use client';
import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

type Consent = 'accepted' | 'declined' | null;
let visitConsent: Consent = null;
function subscribe(callback: () => void) {
  window.addEventListener('ql-consent-change', callback);
  window.addEventListener('storage', callback);
  return () => { window.removeEventListener('ql-consent-change', callback); window.removeEventListener('storage', callback); };
}
export function consentSnapshot(): Consent {
  try {
    const value = localStorage.getItem('ql-consent');
    return value === 'accepted' || value === 'declined' ? value : visitConsent;
  } catch { return visitConsent; }
}
const Context = createContext({ open: () => {} });
export function CookieSettings() { const { open } = useContext(Context); return <button className="qs-linkbtn" type="button" onClick={open}>Cookie settings</button>; }

type TrackingWindow = Window & { dataLayer?: unknown[]; gtag?: (...args: unknown[]) => void; trackingFunctions?: { onLoad: (options: { appId: string }) => void } };
export function trackEvent(name: 'triage_select' | 'readiness_complete' | 'generate_lead', parameters: Record<string, string>) {
  if (consentSnapshot() !== 'accepted') return;
  (window as TrackingWindow).gtag?.('event', name, parameters);
}

function Trackers({ consent }: { consent: Consent }) {
  const path = usePathname();
  useEffect(() => {
    if (consent !== 'accepted') return;
    const w = window as TrackingWindow;
    const scripts: HTMLScriptElement[] = [];
    const add = (id: string, src: string) => {
      if (document.getElementById(id)) return;
      const script = document.createElement('script'); script.id = id; script.src = src; script.async = true;
      script.dataset.qlTracker = 'true'; document.head.append(script); scripts.push(script);
      return script;
    };
    const ga = process.env.NEXT_PUBLIC_GA_ID;
    if (ga && /^G-[A-Z0-9]+$/.test(ga)) {
      w.dataLayer = w.dataLayer || [];
      // gtag expects an Arguments object rather than a normal array.
      // eslint-disable-next-line prefer-rest-params
      w.gtag = function () { w.dataLayer!.push(arguments); };
      w.gtag('consent', 'default', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
      w.gtag('js', new Date());
      w.gtag('config', ga, { send_page_view: false, page_location: `${location.origin}${path}`, page_referrer: '', ignore_referrer: true, allow_google_signals: false, allow_ad_personalization_signals: false });
      add('ql-ga4', `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(ga)}`);
    }
    const apollo = process.env.NEXT_PUBLIC_APOLLO_TRACKER_ID;
    if (apollo && /^[a-zA-Z0-9_-]+$/.test(apollo)) {
      const script = add('ql-apollo', 'https://assets.apollo.io/micro/website-tracker/tracker.iife.js');
      if (script) script.onload = () => { if (consentSnapshot() === 'accepted') w.trackingFunctions?.onLoad({ appId: apollo }); };
    }
    return () => { scripts.forEach(script => script.remove()); };
    // The scripts load once per consent choice; the next effect tracks routes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consent]);
  useEffect(() => {
    if (consent !== 'accepted') return;
    const w = window as TrackingWindow;
    // Never pass the query string, form content, contact details, or referrer.
    w.gtag?.('event', 'page_view', { page_location: `${location.origin}${path}`, page_referrer: '', page_title: document.title });
  }, [consent, path]);
  return null;
}

export function ConsentProvider({ children }: { children: ReactNode }) {
  const consent = useSyncExternalStore(subscribe, consentSnapshot, () => null);
  const [isOpen, setIsOpen] = useState(false);
  function choose(value: Exclude<Consent, null>) {
    const previous = consentSnapshot(); visitConsent = value;
    try { localStorage.setItem('ql-consent', value); } catch { /* This visit only. */ }
    window.dispatchEvent(new Event('ql-consent-change')); setIsOpen(false);
    if (value === 'declined' && previous === 'accepted') location.reload();
  }
  return <Context.Provider value={{ open: () => setIsOpen(true) }}>{children}<Trackers consent={consent} />
    {(!consent || isOpen) && <aside className="qs-consent" id="consent" aria-label="Cookie choices">
      <p>We use cookies to measure site traffic and follow up on requests. They load only if you accept. See our <Link href="/privacy">privacy page</Link>.</p>
      <div className="qs-consent-actions"><button className="ql-btn ql-btn-ghost-dark" type="button" onClick={() => choose('accepted')}>Accept</button><button className="ql-btn ql-btn-ghost-dark" type="button" onClick={() => choose('declined')}>Decline</button></div>
    </aside>}
  </Context.Provider>;
}
