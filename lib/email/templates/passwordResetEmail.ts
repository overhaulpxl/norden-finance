import { getButton, getEmailLayout, safeText } from './base';

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
      <h1 style="margin:0 0 16px;font-size:26px;line-height:1.2;font-weight:900;letter-spacing:-.01em;color:#111111;">Atur Ulang Kata Sandi</h1>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;font-weight:700;color:#111111;">${greeting}</p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;font-weight:700;color:#111111;">Kami menerima permintaan untuk mengatur ulang kata sandi akun Norden Finance Anda.</p>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.6;font-weight:700;color:#111111;">Silakan klik tombol di bawah untuk membuat kata sandi baru yang aman:</p>
      <div style="margin:0 0 28px;">${getButton('Atur Ulang Kata Sandi', resetLink)}</div>
      <p style="margin:0 0 8px;font-size:13px;line-height:1.6;font-weight:800;color:#111111;">Jika tombol di atas tidak dapat diklik, salin dan tempel tautan berikut ke browser Anda:</p>
      <p style="margin:0 0 20px;word-break:break-all;font-size:12px;line-height:1.6;font-weight:700;color:#333333;">${safeText(resetLink)}</p>
      <p style="margin:0;font-size:12px;line-height:1.6;font-weight:700;color:#666666;">Tautan ini berlaku selama 1 jam. Jika Anda tidak meminta pengaturan ulang kata sandi, abaikan email ini. Akun Anda tetap aman.</p>
    `,
  });
}
