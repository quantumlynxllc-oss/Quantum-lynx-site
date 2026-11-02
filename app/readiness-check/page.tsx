import { ReadinessCheck } from '@/components/readiness-check';
import { pageMetadata } from '@/lib/metadata';
import { turnstileSiteKey } from '@/lib/server/config';
export const metadata = pageMetadata('/readiness-check');
export default function Readiness() { return <ReadinessCheck siteKey={turnstileSiteKey()} />; }
