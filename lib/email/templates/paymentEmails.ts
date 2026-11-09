import { getButton, getEmailLayout, safeText } from './base';
import { getPublicAppUrl } from '../../appUrl';

export function getPaymentApprovedEmailHtml({
  userName,
}: {
  userName?: string | null;
}) {
  const appUrl = getPublicAppUrl();
  const greeting = userName ? `Halo ${safeText(userName)},` : 'Halo,';

  return getEmailLayout({
    title: 'Langganan Norden Pro Aktif',
    preheader: 'Pembayaran Anda telah disetujui. Akun Norden Pro Anda kini aktif.',
    body: `
      <div style="margin-bottom:16px;">
        <span style="font-size:12px;font-weight:700;color:#15803D;background:#DCFCE7;padding:4px 10px;border-radius:6px;text-transform:uppercase;letter-spacing:0.04em;">
          Pembayaran Disetujui
        </span>
      </div>
      <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;font-weight:700;letter-spacing:-0.02em;color:#18181B;">
        Selamat! Norden Pro Anda Kini Aktif
      </h1>
      <p style="margin:0 0 14px;font-size:14px;line-height:1.6;font-weight:600;color:#27272A;">
        ${greeting}
      </p>
      <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#52525B;">
        Bukti pembayaran langganan Norden Pro Anda telah berhasil diverifikasi oleh tim kami. Semua fitur eksklusif, analitik lanjutan, dan integrasi cerdas kini telah dapat Anda akses sepenuhnya.
      </p>

      ${getButton('Buka Dashboard Norden', `${appUrl}/dashboard`)}

      <div style="margin-top:24px;padding:12px 16px;background-color:#F4F4F5;border-radius:8px;font-size:12px;line-height:1.5;color:#71717A;">
        Terima kasih atas kepercayaan Anda menggunakan Norden Finance untuk mencapai tujuan finansial Anda.
      </div>
    `,
  });
}

export function getPaymentRejectedEmailHtml({
  userName,
  adminNote,
}: {
  userName?: string | null;
  adminNote?: string | null;
}) {
  const appUrl = getPublicAppUrl();
  const greeting = userName ? `Halo ${safeText(userName)},` : 'Halo,';
  const note = adminNote
    ? `<div style="margin:16px 0;padding:14px 16px;background-color:#FEF2F2;border-left:3px solid #EF4444;border-radius:6px;font-size:13px;line-height:1.6;color:#991B1B;">
        <strong>Catatan Admin:</strong> ${safeText(adminNote)}
      </div>`
    : '';

  return getEmailLayout({
    title: 'Pemeriksaan Pembayaran Norden Pro',
    preheader: 'Bukti pembayaran Anda belum dapat diverifikasi.',
    body: `
      <div style="margin-bottom:16px;">
        <span style="font-size:12px;font-weight:700;color:#B91C1C;background:#FEE2E2;padding:4px 10px;border-radius:6px;text-transform:uppercase;letter-spacing:0.04em;">
          Verifikasi Tertunda
        </span>
      </div>
      <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;font-weight:700;letter-spacing:-0.02em;color:#18181B;">
        Bukti Pembayaran Perlu Ditinjau Ulang
      </h1>
      <p style="margin:0 0 14px;font-size:14px;line-height:1.6;font-weight:600;color:#27272A;">
        ${greeting}
      </p>
      <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#52525B;">
        Kami belum dapat memverifikasi bukti pembayaran yang Anda kirimkan untuk aktivasi Norden Pro.
      </p>

      ${note}

      <p style="margin:16px 0;font-size:14px;line-height:1.6;color:#52525B;">
        Silakan unggah kembali bukti transfer yang jelas dan sesuai melalui tautan berikut:
      </p>

      ${getButton('Tinjau &amp; Unggah Ulang Bukti', `${appUrl}/upgrade`)}

      <div style="margin-top:24px;padding:12px 16px;background-color:#F4F4F5;border-radius:8px;font-size:12px;line-height:1.5;color:#71717A;">
        Jika Anda membutuhkan bantuan lebih lanjut, silakan hubungi tim dukungan kami.
      </div>
    `,
  });
}
