import { getPublicAppUrl } from '../lib/appUrl';

export default function JsonLd() {
  const baseUrl = getPublicAppUrl();
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${baseUrl}/#organization`,
        name: 'Norden Finance',
        url: baseUrl,
        logo: {
          '@type': 'ImageObject',
          url: `${baseUrl}/brand/norden-icon.png`,
          width: 697,
          height: 697,
        },
        sameAs: [
          'https://instagram.com/norden.finance',
        ],
      },
      {
        '@type': 'WebSite',
        '@id': `${baseUrl}/#website`,
        url: baseUrl,
        name: 'Norden Finance',
        description: 'Aplikasi pencatatan keuangan pribadi, budgeting, dan manajemen arus kas Indonesia.',
        publisher: {
          '@id': `${baseUrl}/#organization`,
        },
        inLanguage: 'id-ID',
      },
      {
        '@type': 'SoftwareApplication',
        '@id': `${baseUrl}/#software`,
        name: 'Norden Finance',
        applicationCategory: 'FinanceApplication',
        operatingSystem: 'Web Browser',
        url: baseUrl,
        description: 'Aplikasi keuangan pribadi untuk mencatat pemasukan dan pengeluaran harian, mengelola multi-rekening & e-wallet, mengatur anggaran bulanan, dan memantau target tabungan.',
        offers: [
          {
            '@type': 'Offer',
            name: 'Akses Uji Coba 14 Hari',
            price: '0',
            priceCurrency: 'IDR',
            description: 'Akses uji coba fitur lengkap selama 14 hari setelah pendaftaran awal, tanpa kartu kredit.',
            priceSpecification: {
              '@type': 'UnitPriceSpecification',
              price: '0',
              priceCurrency: 'IDR',
              unitText: '14 hari',
            },
          },
          {
            '@type': 'Offer',
            name: 'Paket Pro Bulanan',
            price: '19000',
            priceCurrency: 'IDR',
            description: 'Langganan Pro penuh selama 30 hari.',
            priceSpecification: {
              '@type': 'UnitPriceSpecification',
              price: '19000',
              priceCurrency: 'IDR',
              unitText: '30 hari',
            },
          },
          {
            '@type': 'Offer',
            name: 'Paket Pro Tahunan',
            price: '149000',
            priceCurrency: 'IDR',
            description: 'Langganan Pro penuh selama 365 hari.',
            priceSpecification: {
              '@type': 'UnitPriceSpecification',
              price: '149000',
              priceCurrency: 'IDR',
              unitText: '365 hari',
            },
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
