import type { Metadata, Viewport } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import { LanguageProvider } from '../lib/i18n';
import { HideBalanceProvider } from '../lib/HideBalanceContext';
import { ThemeProvider } from '../lib/themeContext';
import CookieConsentBanner from '../components/CookieConsentBanner';

const font = Outfit({ subsets: ['latin'] });

import { getPublicAppUrl } from '../lib/appUrl';

const appUrl = getPublicAppUrl();

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#FFE066',
};

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
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
    url: appUrl,
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
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Norden',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="light" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var a = localStorage.getItem('norden_theme_accent');
                if (a && /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(a)) {
                  document.documentElement.style.setProperty('--theme-accent', a);
                  var c = a.replace('#', '');
                  var r = 0, g = 0, b = 0;
                  if (c.length === 3) {
                    r = parseInt(c[0]+c[0], 16) || 0;
                    g = parseInt(c[1]+c[1], 16) || 0;
                    b = parseInt(c[2]+c[2], 16) || 0;
                  } else {
                    r = parseInt(c.substr(0, 2), 16) || 0;
                    g = parseInt(c.substr(2, 2), 16) || 0;
                    b = parseInt(c.substr(4, 2), 16) || 0;
                  }
                  var y = (r * 299 + g * 587 + b * 114) / 1000;
                  document.documentElement.style.setProperty('--theme-accent-text', y >= 150 ? '#000000' : '#ffffff');
                }
                var m = localStorage.getItem('norden_theme_mode');
                var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (m === 'dark' || (m === 'system' && prefersDark)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch(e) {}
            `,
          }}
        />
      </head>
      <body className={`${font.className} transition-colors duration-300 antialiased`} suppressHydrationWarning>
        <ThemeProvider>
          <LanguageProvider>
            <HideBalanceProvider>
              {children}
              <CookieConsentBanner />
            </HideBalanceProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
