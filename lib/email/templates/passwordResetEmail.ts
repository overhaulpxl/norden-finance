import { getButton, getEmailLayout, getLinkBox, safeText } from './base';

export function getPasswordResetEmailHtml({
  resetLink,
  userName,
}: {
  resetLink: string;
  userName?: string | null;
}) {
  const greeting = userName ? `Halo ${safeText(userName)},` : 'Halo,';

  return getEmailLayout({
    title: 'Atur Ulang Kata Sandi - Norden Finance',
    preheader: 'Permintaan atur ulang kata sandi akun Norden Finance Anda.',
    body: `
      <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;font-weight:700;letter-spacing:-0.02em;color:#18181B;">
        Atur Ulang Kata Sandi
      </h1>
      <p style="margin:0 0 14px;font-size:14px;line-height:1.6;font-weight:600;color:#27272A;">
        ${greeting}
      </p>
      <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#52525B;">
        Kami menerima permintaan untuk mengatur ulang kata sandi akun Norden Finance Anda. Silakan klik tombol di bawah untuk membuat kata sandi baru:
      </p>

      ${getButton('Atur Ulang Kata Sandi', resetLink)}

      ${getLinkBox(resetLink, 'Jika tombol di atas tidak berfungsi, salin dan buka tautan berikut di browser Anda:')}

      <div style="margin-top:24px;padding:12px 16px;background-color:#F4F4F5;border-radius:8px;font-size:12px;line-height:1.5;color:#71717A;">
        Tautan ini hanya berlaku selama <strong>1 jam</strong>. Jika Anda tidak pernah meminta perubahan kata sandi, abaikan email ini. Akun Anda tetap aman.
      </div>
    `,
  });
}
