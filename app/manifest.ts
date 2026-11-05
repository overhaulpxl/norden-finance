import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Norden Finance — Track Your Money',
    short_name: 'Norden',
    description: 'Track your money. Find your direction.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#FAF9F5',
    theme_color: '#FFE066',
    orientation: 'portrait',
    lang: 'id',
    categories: ['finance', 'productivity', 'utilities'],
    prefer_related_applications: false,
    icons: [
      {
        src: '/brand/favicon-32.png?v=3',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        src: '/brand/favicon-64.png?v=3',
        sizes: '64x64',
        type: 'image/png',
      },
      {
        src: '/brand/apple-touch-icon.png?v=3',
        sizes: '180x180',
        type: 'image/png',
      },
      {
        src: '/brand/norden-icon.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/brand/norden-icon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'Catat Transaksi',
        short_name: 'Catat',
        description: 'Buka form pencatatan transaksi instan',
        url: '/?action=new_tx',
        icons: [{ src: '/brand/apple-touch-icon.png?v=3', sizes: '180x180' }],
      },
      {
        name: 'Dompet & Rekening',
        short_name: 'Dompet',
        description: 'Kelola saldo rekening bank dan dompet digital',
        url: '/?tab=wallet',
        icons: [{ src: '/brand/apple-touch-icon.png?v=3', sizes: '180x180' }],
      },
      {
        name: 'Riwayat Mutasi',
        short_name: 'Riwayat',
        description: 'Cek daftar mutasi dan pengeluaran',
        url: '/?tab=history',
        icons: [{ src: '/brand/apple-touch-icon.png?v=3', sizes: '180x180' }],
      },
    ],
  };
}
