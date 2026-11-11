type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export type SendEmailResult = { sent: true } | { skipped: true } | { error: string };

export { getPublicAppUrl as getAppUrl } from './appUrl';

export const DEFAULT_EMAIL_FROM = 'Norden Finance <noreply@nordenfinance.site>';

export async function sendEmail({ to, subject, html, text }: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const configuredFrom = process.env.EMAIL_FROM;
  const from = (configuredFrom && !configuredFrom.includes('onboarding@resend.dev'))
    ? configuredFrom
    : DEFAULT_EMAIL_FROM;

  if (!apiKey) {
    console.warn('Resend is not configured. Email skipped.');
    return { skipped: true };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        html,
        text,
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      const rawBody = await response.text().catch(() => '');
      let cleanErrorMessage = '';

      try {
        const json = JSON.parse(rawBody);
        if (json.message) {
          cleanErrorMessage = String(json.message);
        }
      } catch {
        cleanErrorMessage = rawBody.slice(0, 300);
      }

      let error = cleanErrorMessage || `Email provider error (${response.status})`;
      if (cleanErrorMessage.toLowerCase().includes('domain is not verified') || rawBody.toLowerCase().includes('domain is not verified')) {
        error = `Domain email pengirim belum diverifikasi di Resend. Silakan verifikasi domain Anda di resend.com/domains.`;
      } else if (cleanErrorMessage.toLowerCase().includes('testing emails') || rawBody.toLowerCase().includes('testing emails')) {
        error = 'Akun Resend testing hanya dapat mengirim ke email pemilik akun. Verifikasi domain di resend.com/domains.';
      }

      console.warn(`Resend email rejected (${response.status}):`, rawBody);
      return { error };
    }

    return { sent: true };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Email sending failed';
    console.warn('Email sending failed:', message);
    return { error: message };
  }
}
