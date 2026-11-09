import { getPublicAppUrl } from '../../appUrl';

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[char] || char);
}

export function safeText(value: string | null | undefined, fallback = '') {
  return escapeHtml(value || fallback);
}

export function getEmailLayout({
  title,
  preheader,
  body,
}: {
  title: string;
  preheader: string;
  body: string;
}) {
  const appUrl = getPublicAppUrl();
  const logoUrl = `${appUrl}/brand/norden-horizontal.png`;
  const currentYear = new Date().getFullYear();

  return `<!doctype html>
<html lang="id">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${safeText(title)}</title>
    <!--[if mso]>
    <style type="text/css">
      body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
    </style>
    <![endif]-->
  </head>
  <body style="margin:0;padding:0;background-color:#F4F5F7;-webkit-font-smoothing:antialiased;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#18181B;">
    <!-- Preheader preview text -->
    <div style="display:none;font-size:1px;color:#F4F5F7;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
      ${safeText(preheader)}
    </div>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#F4F5F7;margin:0;padding:36px 16px;">
      <tr>
        <td align="center">
          <!-- Main Card Container -->
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:540px;background-color:#FFFFFF;border-radius:14px;border:1px solid #E4E4E7;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.03);">
            
            <!-- Brand Top Accent Bar -->
            <tr>
              <td height="4" style="background-color:#F5D547;line-height:4px;font-size:4px;">&nbsp;</td>
            </tr>

            <!-- Header with Official Logo -->
            <tr>
              <td style="padding:28px 32px 20px;border-bottom:1px solid #F4F4F5;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td align="left" style="vertical-align:middle;">
                      <a href="${appUrl}" target="_blank" style="text-decoration:none;display:inline-block;">
                        <img src="${logoUrl}" alt="Norden Finance" width="145" height="auto" style="display:block;border:0;outline:none;text-decoration:none;width:145px;max-width:145px;height:auto;" />
                      </a>
                    </td>
                    <td align="right" style="vertical-align:middle;">
                      <span style="font-size:11px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#71717A;background:#F4F4F5;padding:4px 8px;border-radius:6px;">
                        Security Alert
                      </span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Main Email Body -->
            <tr>
              <td style="padding:32px 32px 28px;">
                ${body}
              </td>
            </tr>

            <!-- Reassuring Security Footer -->
            <tr>
              <td style="padding:24px 32px 28px;background-color:#FAFAFA;border-top:1px solid #F4F4F5;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td>
                      <p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#52525B;letter-spacing:-0.01em;">
                        Norden Finance · Track your money. Find your direction.
                      </p>
                      <p style="margin:0 0 10px;font-size:11px;line-height:1.6;color:#71717A;">
                        Email ini dikirim secara otomatis untuk melindungi keamanan akun Anda. Jika Anda tidak pernah meminta tindakan ini, silakan abaikan email ini atau amankan kata sandi akun Anda.
                      </p>
                      <p style="margin:0;font-size:11px;color:#A1A1AA;">
                        &copy; ${currentYear} Norden Finance. Seluruh hak cipta dilindungi.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function getButton(label: string, href: string) {
  return `
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:20px 0;">
      <tr>
        <td align="center" style="border-radius:8px;background-color:#18181B;">
          <a href="${safeText(href)}" target="_blank" style="font-size:13px;font-weight:600;letter-spacing:0.02em;color:#FFFFFF;text-decoration:none;padding:12px 24px;border-radius:8px;display:inline-block;border:1px solid #18181B;">
            ${safeText(label)} &rarr;
          </a>
        </td>
      </tr>
    </table>
  `;
}

export function getCodeBox(code: string, validityText = 'Berlaku selama 15 menit') {
  return `
    <div style="margin:22px 0;padding:20px;background-color:#FAFAFA;border:1px solid #E4E4E7;border-radius:10px;text-align:center;">
      <div style="font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#71717A;margin-bottom:8px;">
        Kode Verifikasi
      </div>
      <div style="font-family:'SF Mono',Menlo,Consolas,Monaco,monospace;font-size:32px;font-weight:700;letter-spacing:8px;color:#18181B;padding:4px 0;">
        ${safeText(code)}
      </div>
      <div style="font-size:11px;color:#71717A;margin-top:6px;">
        ${safeText(validityText)} &bull; Jangan bagikan kode ini kepada siapapun
      </div>
    </div>
  `;
}

export function getLinkBox(url: string, note = 'Atau salin dan buka tautan berikut di browser Anda:') {
  return `
    <div style="margin-top:22px;padding:12px 14px;background-color:#F4F4F5;border-radius:8px;font-size:11px;color:#71717A;line-height:1.5;">
      <div style="font-weight:600;color:#52525B;margin-bottom:4px;">${safeText(note)}</div>
      <a href="${safeText(url)}" target="_blank" style="color:#2563EB;word-break:break-all;text-decoration:underline;">
        ${safeText(url)}
      </a>
    </div>
  `;
}
