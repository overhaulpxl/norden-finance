import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Norden Finance — Aplikasi Keuangan Pribadi';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#FAF9F5',
          border: '16px solid #000000',
          padding: '56px 64px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Top Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#FFE066',
              border: '4px solid #000000',
              padding: '10px 20px',
              boxShadow: '4px 4px 0px #000000',
            }}
          >
            <span style={{ fontSize: 20, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px', color: '#000000' }}>
              Personal Finance OS
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ width: 16, height: 16, backgroundColor: '#FFE066', border: '2px solid #000' }} />
            <span style={{ width: 16, height: 16, backgroundColor: '#bbf7d0', border: '2px solid #000' }} />
            <span style={{ width: 16, height: 16, backgroundColor: '#000000', border: '2px solid #000' }} />
          </div>
        </div>

        {/* Central Content Card */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#FFFFFF',
            border: '6px solid #000000',
            padding: '40px 48px',
            boxShadow: '10px 10px 0px #000000',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            {/* Logo Icon Box */}
            <div
              style={{
                width: '72px',
                height: '72px',
                backgroundColor: '#FFE066',
                border: '4px solid #000000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '4px 4px 0px #000000',
                fontWeight: 900,
                fontSize: '44px',
                color: '#000000',
              }}
            >
              N
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 52, fontWeight: 900, letterSpacing: '1px', color: '#000000', textTransform: 'uppercase' }}>
                Norden Finance
              </span>
              <span style={{ fontSize: 24, fontWeight: 700, color: '#15803d' }}>
                Aplikasi Keuangan Pribadi & Budgeting Indonesia
              </span>
            </div>
          </div>

          <p style={{ fontSize: 22, fontWeight: 600, color: '#404040', lineHeight: 1.4, margin: '8px 0 0 0' }}>
            Catat pengeluaran dan pemasukan dengan bahasa natural, pantau multi-rekening & e-wallet, atur anggaran bulanan, dan kelola arah finansial Anda.
          </p>
        </div>

        {/* Bottom Feature Pill Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ backgroundColor: '#ffffff', border: '3px solid #000', padding: '8px 16px', fontSize: 16, fontWeight: 800 }}>
              Smart Input Cepat
            </div>
            <div style={{ backgroundColor: '#ffffff', border: '3px solid #000', padding: '8px 16px', fontSize: 16, fontWeight: 800 }}>
              Multi-Dompet & Saldo
            </div>
            <div style={{ backgroundColor: '#ffffff', border: '3px solid #000', padding: '8px 16px', fontSize: 16, fontWeight: 800 }}>
              Anggaran & Tabungan
            </div>
          </div>
          <span style={{ fontSize: 20, fontWeight: 900, color: '#000000', letterSpacing: '1px' }}>
            www.nordenfinance.site
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
