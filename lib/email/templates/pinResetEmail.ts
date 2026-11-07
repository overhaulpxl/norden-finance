import { getEmailLayout, safeText } from './base';

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
      <h1 style="margin:0 0 16px;font-size:24px;line-height:1.2;font-weight:900;letter-spacing:-.02em;color:#111111;text-transform:uppercase;">
        Reset PIN Keamanan
      </h1>
      <p style="margin:0 0 14px;font-size:15px;line-height:1.6;font-weight:700;color:#111111;">
        ${greeting}
      </p>
      <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#333333;">
        Kami menerima permintaan untuk mereset 4-digit PIN keamanan pada perangkat Anda. Masukkan kode verifikasi 6-digit berikut pada layar aplikasi:
      </p>

      <div style="margin:24px 0;padding:18px 24px;background:#F5D547;border:3px solid #111111;box-shadow:4px 4px 0 #111111;text-align:center;">
        <span style="font-family:monospace;font-size:32px;font-weight:900;letter-spacing:8px;color:#111111;">
          ${safeText(code)}
        </span>
      </div>

      <p style="margin:0 0 16px;font-size:13px;line-height:1.6;color:#444444;">
        Atau klik tombol di bawah untuk langsung membuka kunci dan mereset PIN secara otomatis:
      </p>

      <table role="presentation" cellspacing="0" cellpadding="0" style="margin:0 0 24px;">
        <tr>
          <td>
            <a href="${resetLink}" style="display:inline-block;padding:14px 28px;background:#111111;color:#FFFFFF;text-decoration:none;font-size:13px;font-weight:900;letter-spacing:.06em;text-transform:uppercase;border:3px solid #111111;box-shadow:4px 4px 0 #F5D547;">
              Buka Kunci &amp; Reset PIN
            </a>
          </td>
        </tr>
      </table>

      <p style="margin:0;font-size:12px;line-height:1.6;color:#666666;">
        Kode dan tautan ini berlaku selama 15 menit. Jika Anda tidak meminta reset PIN, abaikan email ini. Data keuangan Anda tetap aman.
      </p>
    `,
  });
}
