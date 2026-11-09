import { getButton, getCodeBox, getEmailLayout, safeText } from './base';

export function getPinResetEmailHtml({
  code,
  resetLink,
  userName,
}: {
  code: string;
  resetLink: string;
  userName?: string | null;
}) {
  const greeting = userName ? `Halo ${safeText(userName)},` : 'Halo,';

  return getEmailLayout({
    title: 'Reset PIN Keamanan Norden Finance',
    preheader: `Kode reset PIN Anda: ${code}. Berlaku selama 15 menit.`,
    body: `
      <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;font-weight:700;letter-spacing:-0.02em;color:#18181B;">
        Reset PIN Keamanan
      </h1>
      <p style="margin:0 0 14px;font-size:14px;line-height:1.6;font-weight:600;color:#27272A;">
        ${greeting}
      </p>
      <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#52525B;">
        Kami menerima permintaan untuk mengatur ulang PIN keamanan 4-digit pada perangkat Anda. Silakan gunakan kode verifikasi 6-digit berikut pada layar aplikasi:
      </p>

      ${getCodeBox(code, 'Berlaku selama 15 menit')}

      <p style="margin:20px 0 10px;font-size:13px;line-height:1.6;color:#52525B;">
        Atau buka kunci dan atur ulang PIN secara otomatis dengan menekan tombol berikut:
      </p>

      ${getButton('Buka Kunci &amp; Reset PIN', resetLink)}

      <div style="margin-top:24px;padding:12px 16px;background-color:#F4F4F5;border-radius:8px;font-size:12px;line-height:1.5;color:#71717A;">
        Jika Anda tidak merasa meminta reset PIN, Anda dapat mengabaikan email ini dengan aman. PIN Anda tetap aktif dan data keuangan Anda tetap terlindungi.
      </div>
    `,
  });
}
