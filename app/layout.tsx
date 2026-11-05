import type { Metadata, Viewport } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import { LanguageProvider } from '../lib/i18n';
import { HideBalanceProvider } from '../lib/HideBalanceContext';

const font = Outfit({ subsets: ['latin'] });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#FFE066',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://www.nordenfinance.site'),
  title: {
    default: 'Norden Finance — Aplikasi Keuangan Pribadi',
    template: '%s | Norden Finance',
  },
  description: 'Kelola keuangan pribadi lebih teratur dengan Norden Finance. Catat pemasukan dan pengeluaran, atur anggaran, pantau tabungan, dan kelola keuangan harian dalam satu aplikasi.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Norden Finance — Aplikasi Keuangan Pribadi',
    description: 'Kelola keuangan pribadi lebih teratur dengan Norden Finance. Catat pemasukan dan pengeluaran, atur anggaran, pantau tabungan, dan kelola keuangan harian dalam satu aplikasi.',
    url: 'https://www.nordenfinance.site',
    siteName: 'Norden Finance',
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Norden Finance — Aplikasi Keuangan Pribadi',
    description: 'Kelola keuangan pribadi lebih teratur dengan Norden Finance. Catat pemasukan dan pengeluaran, atur anggaran, pantau tabungan, dan kelola keuangan harian dalam satu aplikasi.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/brand/favicon-16.png?v=3', sizes: '16x16', type: 'image/png' },
      { url: '/brand/favicon-32.png?v=3', sizes: '32x32', type: 'image/png' },
      { url: '/brand/favicon-64.png?v=3', sizes: '64x64', type: 'image/png' },
    ],
    shortcut: '/brand/favicon-32.png?v=3',
    apple: '/brand/apple-touch-icon.png?v=3',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="light" suppressHydrationWarning>
      <body className={`${font.className} transition-colors duration-300 antialiased`} suppressHydrationWarning>
        <LanguageProvider>
          <HideBalanceProvider>
            {children}
          </HideBalanceProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
