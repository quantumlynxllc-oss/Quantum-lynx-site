import type { MetadataRoute } from 'next';
import { siteUrl, isPreview } from '@/lib/metadata';
export default function robots(): MetadataRoute.Robots { return { rules: { userAgent: '*', disallow: isPreview ? ['/'] : ['/api/', '/prototype/', '/design/', '/docs/', '/schema/'] }, ...(isPreview ? {} : { sitemap: new URL('/sitemap.xml', siteUrl()).toString() }) }; }
