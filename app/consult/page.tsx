import { PriorityProvider } from '@/components/priority';
import { Consult } from '@/components/consult';
import { isPriority } from '@/lib/content';
import { pageMetadata } from '@/lib/metadata';
import { turnstileSiteKey, schedulerUrl } from '@/lib/server/config';
export const metadata = pageMetadata('/consult');
export default async function ConsultPage({ searchParams }: { searchParams: Promise<{ priority?: string }> }) {
  const { priority } = await searchParams;
  return <PriorityProvider key={priority ?? 'survey'} initialPriority={isPriority(priority) ? priority : 'survey'}><Consult numbered={false} siteKey={turnstileSiteKey()} schedulerUrl={schedulerUrl()} /></PriorityProvider>;
}
