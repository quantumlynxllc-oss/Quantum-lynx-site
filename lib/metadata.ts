import type { Metadata } from 'next';
import { site } from '@/lib/content';
export function siteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL;
  const host = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  return new URL(configured || (host ? `https://${host}` : 'http://localhost:3000'));
}
export const isPreview = process.env.VERCEL_ENV !== 'production';
export function pageMetadata(path: string, override?: { title: string; description: string }): Metadata {
  const route = site.routes.find(r => r.path === path);
  const title = override?.title ?? route?.title ?? 'Quantum Lynx';
  const description = override?.description ?? route?.description ?? '';
  return { title, description, alternates: { canonical: new URL(path, siteUrl()).toString() }, openGraph: { title, description, url: new URL(path, siteUrl()).toString(), type: 'website', siteName: 'Quantum Lynx LLC', images: [{ url: '/og-default.png', width: 1200, height: 630, alt: site.share.imageAlt }] }, twitter: { card: 'summary_large_image', title, description, images: ['/og-default.png'] } };
}
export function organizationSchema() {
  const base = siteUrl();
  return { '@context': 'https://schema.org', '@type': 'ProfessionalService', '@id': new URL('/#organization', base).toString(), name: 'Quantum Lynx LLC', url: base.toString(), logo: new URL('/ql-helix-512.png', base).toString(), description: 'Infection control consulting, remote surveillance, survey support, and crisis response for physician-owned hospitals and surgical centers.', foundingDate: '2016', areaServed: { '@type': 'Country', name: 'United States' }, founder: { '@type': 'Person', name: 'Travaughn Baker-Johnson', jobTitle: 'CEO and Principal Infection Preventionist' }, sameAs: [site.keep.linkedin] };
}
