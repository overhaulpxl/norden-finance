import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
const font = Outfit({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "Norden Finance",
  description: "Track your money. Find your direction. Norden adalah Personal Finance Operating System yang membantu Anda mencatat transaksi, mengelola saldo, memantau budget, dan memahami arah keuangan Anda.",
  icons: {
    icon: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="light" suppressHydrationWarning>
      <body className={`${font.className} transition-colors duration-300`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
