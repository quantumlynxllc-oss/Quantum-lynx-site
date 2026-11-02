import { Hero, SectionHead, Ledger, Steps, ReadinessTeaser, FieldRecord, Quotes, Principal } from '@/components/sections';
import { PriorityProvider } from '@/components/priority';
import { Consult } from '@/components/consult';
import { JsonLd } from '@/components/json-ld';
import { pageMetadata, organizationSchema } from '@/lib/metadata';
import { turnstileSiteKey, schedulerUrl } from '@/lib/server/config';
export const metadata = pageMetadata('/');
export default function Home() {
  return <PriorityProvider><JsonLd data={organizationSchema()} /><Hero /><section className="ql-section" id="services"><div className="ql-container"><SectionHead eyebrow="01 / Service lines" title="Seven service lines. One accountable team." /><Ledger /></div></section><Steps /><ReadinessTeaser /><FieldRecord /><Quotes /><Principal /><Consult siteKey={turnstileSiteKey()} schedulerUrl={schedulerUrl()} /></PriorityProvider>;
}
