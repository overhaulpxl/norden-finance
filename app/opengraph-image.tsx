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
          border: '12px solid #000000',
          padding: '44px 52px',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Top Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Logo Monogram & Name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '52px',
                height: '52px',
                backgroundColor: '#FFE066',
                border: '4px solid #000000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '4px 4px 0px #000000',
              }}
            >
              <span style={{ fontSize: 32, fontWeight: 900, color: '#000000' }}>
                N
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 26, fontWeight: 900, letterSpacing: '1.5px', color: '#000000', textTransform: 'uppercase' }}>
                NORDEN FINANCE
              </span>
              <span style={{ fontSize: 12, fontWeight: 800, color: '#525252', letterSpacing: '1px', textTransform: 'uppercase' }}>
                Track your money. Find your direction.
              </span>
            </div>
          </div>

          {/* Coordinate Badge */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div
              style={{
                backgroundColor: '#FFFFFF',
                border: '3px solid #000000',
                padding: '6px 14px',
                boxShadow: '3px 3px 0px #000000',
                fontSize: 12,
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                color: '#000000',
              }}
            >
              EST. 2026 // PERSONAL FINANCE OS
            </div>
          </div>
        </div>

        {/* Hero Section: Editorial Typography + Compass Rose Motif */}
        <div style={{ display: 'flex', gap: '48px', alignItems: 'center', margin: '8px 0' }}>
          {/* Left Column: Brand Statement */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1.25, gap: '16px' }}>
            <div
              style={{
                display: 'flex',
                alignSelf: 'flex-start',
                backgroundColor: '#FFE066',
                border: '2.5px solid #000000',
                padding: '4px 12px',
                fontSize: 11,
                fontWeight: 900,
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                boxShadow: '2px 2px 0px #000000',
                color: '#000000',
              }}
            >
              ARAH KEUANGAN PRESISI
            </div>

            <div
              style={{
                fontSize: 54,
                fontWeight: 900,
                color: '#000000',
                lineHeight: 1.05,
                letterSpacing: '-1px',
                textTransform: 'uppercase',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <span>Track your money.</span>
              <span>Find your direction.</span>
            </div>

            <p style={{ fontSize: 18, fontWeight: 600, color: '#383838', lineHeight: 1.45, margin: 0, maxWidth: '580px' }}>
              Aplikasi pencatatan keuangan personal dengan bahasa sehari-hari. Kelola multi-rekening, pantau portofolio aset, dan kendalikan arus kas bebas bocor halus.
            </p>
          </div>

          {/* Right Column: Handcrafted Norden Compass Emblem */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 0.75 }}>
            <div
              style={{
                width: '240px',
                height: '240px',
                backgroundColor: '#FFE066',
                border: '5px solid #000000',
                boxShadow: '8px 8px 0px #000000',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Compass Rose SVG */}
              <svg width="160" height="160" viewBox="0 0 100 100" fill="none">
                {/* Compass Dial Outer & Inner Rings */}
                <circle cx="50" cy="50" r="44" stroke="#000000" strokeWidth="3" strokeDasharray="3 3" />
                <circle cx="50" cy="50" r="38" stroke="#000000" strokeWidth="2" />

                {/* Cardinal Direction Ticks */}
                <line x1="50" y1="8" x2="50" y2="16" stroke="#000000" strokeWidth="3" />
                <line x1="50" y1="84" x2="50" y2="92" stroke="#000000" strokeWidth="3" />
                <line x1="8" y1="50" x2="16" y2="50" stroke="#000000" strokeWidth="3" />
                <line x1="84" y1="50" x2="92" y2="50" stroke="#000000" strokeWidth="3" />

                {/* North Arrow Point */}
                <polygon points="50,14 58,48 50,42" fill="#000000" />
                <polygon points="50,14 42,48 50,42" fill="#FFFFFF" stroke="#000000" strokeWidth="1.5" />

                {/* South Arrow Point */}
                <polygon points="50,86 58,52 50,58" fill="#FFFFFF" stroke="#000000" strokeWidth="1.5" />
                <polygon points="50,86 42,52 50,58" fill="#000000" />

                {/* East Arrow Point */}
                <polygon points="86,50 52,58 58,50" fill="#000000" />
                <polygon points="86,50 52,42 58,50" fill="#FFFFFF" stroke="#000000" strokeWidth="1.5" />

                {/* West Arrow Point */}
                <polygon points="14,50 48,58 42,50" fill="#FFFFFF" stroke="#000000" strokeWidth="1.5" />
                <polygon points="14,50 48,42 42,50" fill="#000000" />

                {/* Center Pin */}
                <circle cx="50" cy="50" r="5" fill="#FFE066" stroke="#000000" strokeWidth="2.5" />
              </svg>

              <div
                style={{
                  marginTop: '8px',
                  fontSize: '11px',
                  fontWeight: 900,
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  color: '#000000',
                }}
              >
                NORDEN COMPASS
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Architectural Grid: 3 Pillars */}
        <div style={{ display: 'flex', gap: '16px', borderTop: '3px solid #000000', paddingTop: '18px' }}>
          {/* Pillar 1 */}
          <div
            style={{
              flex: 1,
              backgroundColor: '#FFFFFF',
              border: '3px solid #000000',
              padding: '12px 16px',
              boxShadow: '4px 4px 0px #000000',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: '1px', color: '#737373' }}>
              01 // NATURAL INPUT
            </span>
            <span style={{ fontSize: 15, fontWeight: 900, color: '#000000' }}>
              Pencatatan Secepat Chat
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#525252', lineHeight: 1.3 }}>
              Ketik bahasa sehari-hari, nominal & dompet langsung terdata.
            </span>
          </div>

          {/* Pillar 2 */}
          <div
            style={{
              flex: 1,
              backgroundColor: '#FFFFFF',
              border: '3px solid #000000',
              padding: '12px 16px',
              boxShadow: '4px 4px 0px #000000',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: '1px', color: '#737373' }}>
              02 // MULTI-WALLET
            </span>
            <span style={{ fontSize: 15, fontWeight: 900, color: '#000000' }}>
              Rekening & Portofolio
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#525252', lineHeight: 1.3 }}>
              Pantau saldo bank, e-wallet, saham, kripto, & emas riil.
            </span>
          </div>

          {/* Pillar 3 */}
          <div
            style={{
              flex: 1,
              backgroundColor: '#FFFFFF',
              border: '3px solid #000000',
              padding: '12px 16px',
              boxShadow: '4px 4px 0px #000000',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: '1px', color: '#737373' }}>
              03 // PRIVASI 100%
            </span>
            <span style={{ fontSize: 15, fontWeight: 900, color: '#000000' }}>
              Tanpa Iklan, Data Aman
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#525252', lineHeight: 1.3 }}>
              Data keuangan privat, terlindungi enkripsi & sesi aman.
            </span>
          </div>
        </div>

        {/* Footer Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '10px', height: '10px', backgroundColor: '#22c55e', border: '1.5px solid #000000' }} />
            <span style={{ fontSize: 12, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', color: '#000000' }}>
              LIVE PRODUCTION // NO TRACKERS
            </span>
          </div>
          <div style={{ fontSize: 16, fontWeight: 900, color: '#000000', letterSpacing: '1.5px' }}>
            WWW.NORDENFINANCE.SITE
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
