'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
export function Navigation() {
  const path = usePathname();
  return <header className="qs-nav"><div className="qs-nav-in">
    <Link className="qs-brand" href="/" aria-label="Quantum Lynx home"><img src="/ql-helix.svg" width="20" height="42" alt="" /><div><b>Quantum Lynx</b><span>Infection Control Solutions</span></div></Link>
    <nav className="qs-links" aria-label="Primary">
      {[['/services', 'Services'], ['/readiness-check', 'Readiness Check'], ['/about', 'About']].map(([href, label]) =>
        <Link key={href} href={href} aria-current={path === href || path.startsWith(`${href}/`) ? 'page' : undefined}>{label}</Link>)}
    </nav>
    <Link className="ql-btn ql-btn-secondary" href="/consult">Schedule a consult</Link>
  </div></header>;
}
