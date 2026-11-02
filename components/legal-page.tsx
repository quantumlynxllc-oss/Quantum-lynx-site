import { legal } from '@/lib/content';
import { PageHead } from '@/components/sections';
type LegalSection = { heading: string; phase?: number; paragraphs?: string[]; items?: string[]; table?: { columns: string[]; rows: string[][] } };
export function LegalPage({ page }: { page: 'sla' | 'privacy' }) {
  const data = legal[page];
  return <><PageHead eyebrow={data.eyebrow} title={data.title} lede={data.lede} /><div className="ql-section ql-section-top64"><div className="ql-container"><article className="qs-legal"><p className="qs-legal-date">Last updated {data.updated}</p>{(data.sections as LegalSection[]).filter(s => !s.phase || s.phase === 1).map(section => <section key={section.heading}><h2>{section.heading}</h2>{section.table && <div className="qs-scroll"><table className="qs-table"><thead><tr>{section.table.columns.map(column => <th key={column} scope="col">{column}</th>)}</tr></thead><tbody>{section.table.rows.map((row, index) => <tr key={index}>{row.map((cell, i) => <td key={i}>{cell}</td>)}</tr>)}</tbody></table></div>}{section.paragraphs?.map(text => <p key={text}>{text}</p>)}{section.items && <ul>{section.items.map(item => <li key={item}>{item}</li>)}</ul>}</section>)}</article></div></div></>;
}
