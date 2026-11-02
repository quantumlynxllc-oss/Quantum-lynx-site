import { notFound } from 'next/navigation';
import Link from 'next/link';
import { services } from '@/lib/content';
import { PageHead } from '@/components/sections';
import { JsonLd } from '@/components/json-ld';
import { pageMetadata, siteUrl } from '@/lib/metadata';
export const dynamicParams = false;
export function generateStaticParams() { return services.services.map(s => ({ slug: s.slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = services.services.find(s => s.slug === slug);
  if (!service) return {};
  return pageMetadata(`/services/${slug}`, { title: `${service.title} | Quantum Lynx`, description: service.lede });
}
export default async function Service({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const service = services.services.find(s => s.slug === slug);
  if (!service) notFound();
  const absolute = (path: string) => new URL(path, siteUrl()).toString();
  const data = { '@context': 'https://schema.org', '@graph': [{ '@type': 'Service', name: service.title, serviceType: service.title, description: service.lede, url: absolute(`/services/${slug}`), provider: { '@id': absolute('/#organization') } }, { '@type': 'BreadcrumbList', itemListElement: [['Home', '/'], ['Services', '/services'], [service.title, `/services/${slug}`]].map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: absolute(path) })) }] };
  return <><JsonLd data={data} /><PageHead eyebrow="Service lines" title="Start from the problem on your desk." /><section className="ql-section ql-section-top64"><div className="ql-container qs-svc-layout"><nav className="qs-svc-tabs" aria-label="Service lines">{services.services.map(s => <Link className="qs-svc-tab" href={`/services/${s.slug}`} aria-current={s.slug === slug ? 'page' : undefined} key={s.slug}><span>{s.n}</span>{s.title}</Link>)}</nav><article className="qs-svc-body"><div className="ql-eyebrow">{service.n} / {service.delivery.join(' · ')}</div><h2 className="ql-h2">{service.title}</h2><p className="ql-body-lg ql-service-lede">{service.lede}</p><div className="qs-svc-cols">{[['Use it when', service.when], ['You get', service.get]].map(([label, items]) => <div key={label as string}><h3 className="ql-label ql-service-label">{label}</h3><ul className="qs-list">{(items as string[]).map(item => <li key={item}>{item}</li>)}</ul></div>)}</div><div className="qs-cta"><Link className="ql-btn ql-btn-primary" href={`/consult?priority=${service.priority}`}>{service.cta}</Link><Link className="ql-btn ql-btn-ghost" href="/readiness-check">Take the Readiness Check</Link></div></article></div></section></>;
}
