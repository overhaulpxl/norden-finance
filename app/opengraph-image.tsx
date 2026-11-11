import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Norden Finance — Platform Keuangan & Budgeting Modern';
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
          border: '14px solid #000000',
          padding: '48px 56px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Top Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Logo Monogram */}
            <div
              style={{
                width: '56px',
                height: '56px',
                backgroundColor: '#FFE066',
                border: '4px solid #000000',
                borderRadius: '0px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '4px 4px 0px #000000',
                fontWeight: 900,
                fontSize: '34px',
                color: '#000000',
              }}
            >
              N
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 28, fontWeight: 900, letterSpacing: '1.5px', color: '#000000', textTransform: 'uppercase' }}>
                NORDEN FINANCE
              </span>
              <span style={{ fontSize: 13, fontWeight: 800, color: '#525252', letterSpacing: '1px', textTransform: 'uppercase' }}>
                Track your money. Find your direction.
              </span>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#FFE066',
              border: '3px solid #000000',
              borderRadius: '0px',
              padding: '8px 18px',
              boxShadow: '3px 3px 0px #000000',
              fontSize: 13,
              fontWeight: 900,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              color: '#000000',
            }}
          >
            Personal Finance OS
          </div>
        </div>

        {/* Hero Section: 2 Columns */}
        <div style={{ display: 'flex', gap: '44px', alignItems: 'center', margin: '20px 0' }}>
          {/* Left Column: Headline & Value Prop */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1.15, gap: '16px' }}>
            <div
              style={{
                fontSize: 46,
                fontWeight: 900,
                color: '#000000',
                lineHeight: 1.12,
                letterSpacing: '-0.5px',
                textTransform: 'uppercase',
              }}
            >
              Keuangan Lebih Teratur, Bebas Bocor Halus.
            </div>

            <p style={{ fontSize: 18, fontWeight: 600, color: '#404040', lineHeight: 1.45, margin: 0 }}>
              Catat mutasi dengan bahasa sehari-hari, pantau rekening & e-wallet, kelola portofolio aset, dan amankan arus kas bulanan secara akurat.
            </p>

            {/* Feature Badges - Sharp 0px */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '6px' }}>
              <div style={{ display: 'flex', backgroundColor: '#BBF7D0', border: '2.5px solid #000000', borderRadius: '0px', padding: '6px 14px', fontSize: 12, fontWeight: 900, boxShadow: '2px 2px 0px #000', textTransform: 'uppercase' }}>
                Quick Input
              </div>
              <div style={{ display: 'flex', backgroundColor: '#FFFFFF', border: '2.5px solid #000000', borderRadius: '0px', padding: '6px 14px', fontSize: 12, fontWeight: 900, boxShadow: '2px 2px 0px #000', textTransform: 'uppercase' }}>
                Multi-Rekening
              </div>
              <div style={{ display: 'flex', backgroundColor: '#FED7AA', border: '2.5px solid #000000', borderRadius: '0px', padding: '6px 14px', fontSize: 12, fontWeight: 900, boxShadow: '2px 2px 0px #000', textTransform: 'uppercase' }}>
                Portofolio Aset
              </div>
              <div style={{ display: 'flex', backgroundColor: '#E0E7FF', border: '2.5px solid #000000', borderRadius: '0px', padding: '6px 14px', fontSize: 12, fontWeight: 900, boxShadow: '2px 2px 0px #000', textTransform: 'uppercase' }}>
                Laporan PDF Bulanan
              </div>
            </div>
          </div>

          {/* Right Column: Live App Visual Mockup */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 0.95, gap: '14px' }}>
            {/* Card 1: Balance & Liquidity */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#FFFFFF',
                border: '3.5px solid #000000',
                borderRadius: '0px',
                padding: '16px 20px',
                boxShadow: '5px 5px 0px #000000',
                gap: '6px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 900, textTransform: 'uppercase', color: '#737373', letterSpacing: '1px' }}>
                  Total Saldo Rekening Aktif
                </span>
                <span style={{ fontSize: 10, fontWeight: 900, backgroundColor: '#BBF7D0', border: '1.5px solid #000', padding: '2px 8px', borderRadius: '0px', textTransform: 'uppercase' }}>
                  Arus Kas Positif
                </span>
              </div>
              <span style={{ fontSize: 30, fontWeight: 900, color: '#000000' }}>
                Rp 18.450.000
              </span>
            </div>

            {/* Card 2: Natural Language Input */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#FFE066',
                border: '3.5px solid #000000',
                borderRadius: '0px',
                padding: '16px 20px',
                boxShadow: '5px 5px 0px #000000',
                gap: '8px',
              }}
            >
              <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', color: '#000000', letterSpacing: '1px' }}>
                Pencatatan Cepat Satu Baris
              </span>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: '#FFFFFF',
                  border: '2.5px solid #000000',
                  borderRadius: '0px',
                  padding: '8px 14px',
                  fontSize: 13,
                  fontWeight: 800,
                  color: '#171717',
                  justifyContent: 'space-between',
                }}
              >
                <span>&ldquo;kopi susu 28rb bca&rdquo;</span>
                <span style={{ fontSize: 10, backgroundColor: '#BBF7D0', border: '1.5px solid #000', padding: '2px 6px', borderRadius: '0px', fontWeight: 900, textTransform: 'uppercase' }}>
                  Tercatat Otomatis
                </span>
              </div>
            </div>

            {/* Card 3: Target Tabungan */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#FFFFFF',
                border: '3.5px solid #000000',
                borderRadius: '0px',
                padding: '16px 20px',
                boxShadow: '5px 5px 0px #000000',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 900, color: '#000000', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Target Dana Darurat
                </span>
                <span style={{ fontSize: 11, fontWeight: 900, color: '#16a34a' }}>
                  80% TERCAPAI
                </span>
              </div>
              {/* Progress track */}
              <div
                style={{
                  width: '100%',
                  height: '12px',
                  backgroundColor: '#F3F4F6',
                  border: '2px solid #000000',
                  borderRadius: '0px',
                  display: 'flex',
                  overflow: 'hidden',
                }}
              >
                <div style={{ width: '80%', height: '100%', backgroundColor: '#FFE066', borderRight: '2px solid #000' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '3px solid #000000', paddingTop: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '0px', backgroundColor: '#22c55e', border: '1.5px solid #000' }} />
            <span style={{ fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#171717' }}>
              Privasi 100% Terlindungi • Desain Neo-Brutalisme
            </span>
          </div>
          <span style={{ fontSize: 15, fontWeight: 900, color: '#000000', letterSpacing: '1px' }}>
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
