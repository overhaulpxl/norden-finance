import { getAdminAuth } from './firebaseAdmin';
import { getAppUrl, sendEmail } from './email';
import { getVerificationEmailHtml } from './email/templates/verificationEmail';
import { getPasswordResetEmailHtml } from './email/templates/passwordResetEmail';

export async function sendVerificationEmail({
  email,
  userName,
}: {
  email: string;
  userName?: string | null;
}) {
  const appUrl = getAppUrl();
  const verificationLink = await getAdminAuth().generateEmailVerificationLink(email, {
    url: `${appUrl}/auth/verified`,
    handleCodeInApp: false,
  });

  return sendEmail({
    to: email,
    subject: 'Verify your Norden Finance account',
    html: getVerificationEmailHtml({ verificationLink, userName }),
    text: [
      'Verify your email address',
      '',
      'Welcome to Norden Finance.',
      'Please verify your email address to activate your account and start tracking your money with clarity.',
      '',
      verificationLink,
      '',
      'Track your money. Find your direction.',
    ].join('\n'),
  });
}

export async function sendPasswordResetEmail({
  email,
  userName,
}: {
  email: string;
  userName?: string | null;
}) {
  const appUrl = getAppUrl();
  const resetLink = await getAdminAuth().generatePasswordResetLink(email, {
    url: `${appUrl}/auth/action`,
    handleCodeInApp: false,
  });

  return sendEmail({
    to: email,
    subject: 'Atur Ulang Kata Sandi Akun Norden Finance',
    html: getPasswordResetEmailHtml({ resetLink, userName }),
    text: [
      'Atur Ulang Kata Sandi Akun Norden Finance',
      '',
      userName ? `Halo ${userName},` : 'Halo,',
      'Kami menerima permintaan untuk mengatur ulang kata sandi akun Norden Finance Anda.',
      'Silakan buka tautan berikut untuk membuat kata sandi baru:',
      '',
      resetLink,
      '',
      'Tautan ini berlaku selama 1 jam. Jika Anda tidak meminta pengaturan ulang kata sandi, abaikan email ini.',
      '',
      'Norden Finance - Track your money. Find your direction.',
    ].join('\n'),
  });
}


