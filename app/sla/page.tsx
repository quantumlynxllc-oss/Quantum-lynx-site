import { LegalPage } from '@/components/legal-page';
import { pageMetadata } from '@/lib/metadata';
export const metadata = pageMetadata('/sla');
export default function SLA() { return <LegalPage page="sla" />; }
