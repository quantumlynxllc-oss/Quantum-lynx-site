import { PageHead, Ledger } from '@/components/sections';
import { pageMetadata } from '@/lib/metadata';
export const metadata = pageMetadata('/services');
export default function Services() { return <><PageHead eyebrow="Service lines" title="Start from the problem on your desk." lede="Each service line opens with a named CIC. Pick one line, or run several as one program." /><section className="ql-section"><div className="ql-container"><Ledger /></div></section></>; }
