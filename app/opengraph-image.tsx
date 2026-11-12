import { ImageResponse } from 'next/og';
import { NORDEN_HORIZONTAL_LOGO_BASE64 } from '../lib/brandLogoBase64';
import { getOutfitFonts } from '../lib/outfitFontBase64';

export const runtime = 'nodejs';
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
          border: '3.5px solid #000000',
          padding: '40px 48px',
          fontFamily: 'Outfit, sans-serif',
        }}
      >
        {/* Top Header Bar — Matches LandingHeader on web */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '3px solid #000000',
            boxShadow: '4px 4px 0px #000000',
            padding: '12px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          {/* Official Brand Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={NORDEN_HORIZONTAL_LOGO_BASE64}
              alt="Norden Finance logo"
              width={126}
              height={46}
              style={{
                width: '126px',
                height: '46px',
                objectFit: 'contain',
              }}
            />
            <div
              style={{
                display: 'flex',
                height: '24px',
                width: '2px',
                backgroundColor: '#000000',
                opacity: 0.15,
                margin: '0 4px',
              }}
            />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#525252', letterSpacing: '0.8px', textTransform: 'uppercase' }}>
              Track your money. Find your direction.
            </span>
          </div>

          {/* Right Header Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                backgroundColor: '#FFE066',
                border: '2.5px solid #000000',
                padding: '6px 14px',
                fontSize: 11,
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                boxShadow: '2px 2px 0px #000000',
                color: '#000000',
                display: 'flex',
              }}
            >
              PERSONAL FINANCE OS
            </div>
            <div
              style={{
                backgroundColor: '#000000',
                color: '#FFFFFF',
                border: '2.5px solid #000000',
                padding: '6px 14px',
                fontSize: 11,
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                boxShadow: '2px 2px 0px #FFE066',
                display: 'flex',
              }}
            >
              WWW.NORDENFINANCE.SITE
            </div>
          </div>
        </div>

        {/* Hero Section: Left Headline + Right Smart Input Window (matches app/page.tsx) */}
        <div style={{ display: 'flex', gap: '40px', alignItems: 'center', margin: '12px 0' }}>
          {/* Left Column: Authentic Web Headline & Copy */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1.15, gap: '14px' }}>
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
              ⚡ KEUANGAN LEBIH TERATUR
            </div>

            <div
              style={{
                fontSize: 44,
                fontWeight: 900,
                color: '#000000',
                lineHeight: 1.08,
                letterSpacing: '-0.8px',
                textTransform: 'uppercase',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <span>Kelola Keuangan Pribadi</span>
              <span>Lebih Teratur dengan Norden</span>
            </div>

            <p
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: '#525252',
                lineHeight: 1.45,
                margin: 0,
                textTransform: 'uppercase',
                letterSpacing: '0.3px',
              }}
            >
              Catat pemasukan dan pengeluaran harian secepat chat dengan Smart Input natural. Pantau seluruh rekening bank, e-wallet, anggaran, dan target tabungan dalam satu sistem terstruktur.
            </p>
          </div>

          {/* Right Column: Smart Input Chat Sandbox Window (matches web demo window) */}
          <div style={{ flex: 0.95, display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                backgroundColor: '#FFFFFF',
                border: '3px solid #000000',
                boxShadow: '7px 7px 0px #000000',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Window Titlebar */}
              <div
                style={{
                  backgroundColor: '#FAF9F5',
                  borderBottom: '3px solid #000000',
                  padding: '10px 16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: '1.2px', textTransform: 'uppercase', color: '#000000' }}>
                    NORDEN SMART INPUT
                  </span>
                  <span style={{ fontSize: 9, fontWeight: 700, color: '#737373', textTransform: 'uppercase' }}>
                    DEMO LANGSUNG
                  </span>
                </div>
                {/* 3 Window Control Dots (Yellow, Mint, Black) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '12px', height: '12px', backgroundColor: '#FFE066', border: '1.5px solid #000000' }} />
                  <div style={{ width: '12px', height: '12px', backgroundColor: '#bbf7d0', border: '1.5px solid #000000' }} />
                  <div style={{ width: '12px', height: '12px', backgroundColor: '#000000', border: '1.5px solid #000000' }} />
                </div>
              </div>

              {/* Window Body */}
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', backgroundColor: '#FFFFFF' }}>
                {/* User Prompt Input Row */}
                <div
                  style={{
                    backgroundColor: '#FAF9F5',
                    border: '2px solid #000000',
                    padding: '10px 14px',
                    boxShadow: '2px 2px 0px #000000',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: '#000000' }}>
                    &gt; kopi susu 28rb bca
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 900,
                      backgroundColor: '#bbf7d0',
                      border: '1.5px solid #000000',
                      padding: '2px 8px',
                      textTransform: 'uppercase',
                    }}
                  >
                    PARSED
                  </span>
                </div>

                {/* Auto Result Card */}
                <div
                  style={{
                    backgroundColor: '#FFFFFF',
                    border: '2.5px solid #000000',
                    padding: '12px 14px',
                    boxShadow: '3px 3px 0px #000000',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#737373' }}>
                      PENGELUARAN TERCATAT
                    </span>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 900,
                        color: '#16a34a',
                        backgroundColor: '#dcfce7',
                        border: '1px solid #16a34a',
                        padding: '1px 6px',
                      }}
                    >
                      SINKRON
                    </span>
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 900, color: '#000000' }}>
                    Rp 28.000
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#404040', display: 'flex', gap: '8px' }}>
                    <span>Kategori: Makan &amp; Minum</span>
                    <span>•</span>
                    <span>Dompet: BCA</span>
                  </div>
                </div>

                {/* Window Micro Footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10, fontWeight: 700, color: '#737373', textTransform: 'uppercase' }}>
                  <span>Parser Lokal Deterministik</span>
                  <span>Zero-Cloud Processing</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Feature Pillars Bar — Clean web cards */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '3px solid #000000',
            paddingTop: '14px',
          }}
        >
          {/* Feature Pills */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ backgroundColor: '#FFFFFF', border: '2px solid #000000', padding: '5px 12px', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', boxShadow: '2px 2px 0px #000000', display: 'flex' }}>
              💬 SMART INPUT NATURAL
            </div>
            <div style={{ backgroundColor: '#FFFFFF', border: '2px solid #000000', padding: '5px 12px', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', boxShadow: '2px 2px 0px #000000', display: 'flex' }}>
              🏦 MULTI-REKENING &amp; WALLET
            </div>
            <div style={{ backgroundColor: '#FFFFFF', border: '2px solid #000000', padding: '5px 12px', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', boxShadow: '2px 2px 0px #000000', display: 'flex' }}>
              📈 PORTOFOLIO &amp; ARUS KAS
            </div>
            <div style={{ backgroundColor: '#FFFFFF', border: '2px solid #000000', padding: '5px 12px', fontSize: 11, fontWeight: 900, textTransform: 'uppercase', boxShadow: '2px 2px 0px #000000', display: 'flex' }}>
              🔒 PRIVASI 100%
            </div>
          </div>

          {/* Live Production Seal */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 12, fontWeight: 900, textTransform: 'uppercase', color: '#000000' }}>
            <div style={{ width: '8px', height: '8px', backgroundColor: '#22c55e', border: '1.5px solid #000000' }} />
            <span>Aplikasi Keuangan Pribadi</span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: getOutfitFonts(),
    }
  );
}
