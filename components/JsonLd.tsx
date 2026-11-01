export default function JsonLd() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://www.nordenfinance.site/#organization',
        name: 'Norden Finance',
        url: 'https://www.nordenfinance.site',
        logo: {
          '@type': 'ImageObject',
          url: 'https://www.nordenfinance.site/brand/norden-icon.png',
          width: 697,
          height: 697,
        },
        sameAs: [
          'https://instagram.com/norden.finance',
        ],
      },
      {
        '@type': 'WebSite',
        '@id': 'https://www.nordenfinance.site/#website',
        url: 'https://www.nordenfinance.site',
        name: 'Norden Finance',
        description: 'Aplikasi pencatatan keuangan pribadi, budgeting, dan manajemen arus kas Indonesia.',
        publisher: {
          '@id': 'https://www.nordenfinance.site/#organization',
        },
        inLanguage: 'id-ID',
      },
      {
        '@type': 'SoftwareApplication',
        '@id': 'https://www.nordenfinance.site/#software',
        name: 'Norden Finance',
        applicationCategory: 'FinanceApplication',
        operatingSystem: 'Web Browser',
        url: 'https://www.nordenfinance.site',
        description: 'Aplikasi keuangan pribadi untuk mencatat pemasukan dan pengeluaran harian, mengelola multi-rekening & e-wallet, mengatur anggaran bulanan, dan memantau target tabungan.',
        offers: [
          {
            '@type': 'Offer',
            name: 'Trial 14 Hari',
            price: '0',
            priceCurrency: 'IDR',
            description: 'Uji coba gratis seluruh fitur selama 14 hari',
          },
          {
            '@type': 'Offer',
            name: 'Pro Bulanan',
            price: '19000',
            priceCurrency: 'IDR',
            description: 'Paket langganan per 30 hari',
          },
          {
            '@type': 'Offer',
            name: 'Pro Tahunan',
            price: '149000',
            priceCurrency: 'IDR',
            description: 'Paket langganan per tahun (365 hari)',
          },
        ],
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
