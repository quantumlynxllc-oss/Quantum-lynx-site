import { PageHead, Principal, FieldRecord, Quotes } from '@/components/sections';
import { pageMetadata, organizationSchema } from '@/lib/metadata';
import { JsonLd } from '@/components/json-ld';
export const metadata = pageMetadata('/about');
export default function About() { return <><JsonLd data={organizationSchema()} /><PageHead eyebrow="About" title="From the microbiology lab to the survey room." lede="Serving hospitals since 2016." /><Principal numbered={false} /><FieldRecord numbered={false} /><Quotes numbered={false} /></>; }
