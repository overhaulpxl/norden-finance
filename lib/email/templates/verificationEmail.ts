import { getButton, getEmailLayout, getLinkBox, safeText } from './base';

export function getVerificationEmailHtml({
  verificationLink,
  userName,
}: {
  verificationLink: string;
  userName?: string | null;
}) {
  const greeting = userName ? `Halo ${safeText(userName)},` : 'Halo,';

  return getEmailLayout({
    title: 'Verifikasi Akun Norden Finance',
    preheader: 'Verifikasi alamat email Anda untuk mengaktifkan akun Norden Finance.',
    body: `
      <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;font-weight:700;letter-spacing:-0.02em;color:#18181B;">
        Verifikasi Alamat Email Anda
      </h1>
      <p style="margin:0 0 14px;font-size:14px;line-height:1.6;font-weight:600;color:#27272A;">
        ${greeting}
      </p>
      <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#52525B;">
        Selamat datang di Norden Finance! Untuk mengaktifkan akun Anda dan mulai mengelola keuangan pribadi dengan lebih terarah, silakan verifikasi alamat email Anda:
      </p>

      ${getButton('Verifikasi Akun Sekarang', verificationLink)}

      ${getLinkBox(verificationLink, 'Jika tombol di atas tidak dapat diklik, salin dan buka tautan berikut:')}

      <div style="margin-top:24px;padding:12px 16px;background-color:#F4F4F5;border-radius:8px;font-size:12px;line-height:1.5;color:#71717A;">
        Jika Anda tidak mendaftarkan akun di Norden Finance, Anda dapat mengabaikan email ini dengan aman.
      </div>
    `,
  });
}
