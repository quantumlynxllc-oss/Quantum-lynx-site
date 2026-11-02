import type { Metadata } from 'next';
import { Inter_Tight, Inter, JetBrains_Mono } from 'next/font/google';
import '@/design/tokens.css';
import '@/design/kit.css';
import '@/design/site.css';
import './globals.css';
import { Navigation } from '@/components/navigation';
import { Footer } from '@/components/sections';
import { ConsentProvider } from '@/components/consent';
import { siteUrl, isPreview } from '@/lib/metadata';

const display = Inter_Tight({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-inter-tight', display: 'swap' });
const sans = Inter({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-inter', display: 'swap' });
const mono = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-jetbrains', display: 'swap', preload: false });
export const metadata: Metadata = { metadataBase: siteUrl(), applicationName: 'Quantum Lynx', icons: { icon: [{ url: '/ql-helix.svg', type: 'image/svg+xml' }], apple: '/apple-touch-icon.png' }, robots: isPreview ? { index: false, follow: false } : { index: true, follow: true } };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en" className={`ql-fonts ${display.variable} ${sans.variable} ${mono.variable}`}><body><ConsentProvider><a className="ql-skip" href="#main-content">Skip to main content</a><Navigation /><main id="main-content" tabIndex={-1}>{children}</main><Footer /></ConsentProvider></body></html>;
}
