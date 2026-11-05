import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Norden Finance — Track Your Money',
    short_name: 'Norden',
    description: 'Track your money. Find your direction.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FAF9F5',
    theme_color: '#FFE066',
    orientation: 'portrait',
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
    ],
  };
}
