import { LegalPage } from '@/components/legal-page';
import { pageMetadata } from '@/lib/metadata';
export const metadata = pageMetadata('/privacy');
export default function Privacy() { return <LegalPage page="privacy" />; }
