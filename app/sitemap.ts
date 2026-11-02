import type { MetadataRoute } from 'next';
import { services, site } from '@/lib/content';
import { siteUrl } from '@/lib/metadata';
export default function sitemap(): MetadataRoute.Sitemap {
  return [...site.routes.filter(r => r.phase === 1 && !r.path.includes('[') && !r.path.startsWith('/api')).map(r => r.path), ...services.services.map(s => `/services/${s.slug}`)].map(path => ({ url: new URL(path, siteUrl()).toString() }));
}
