export function getSafeContinueUrl(continueUrl: string | null): string {
  if (!continueUrl) return '/dashboard';
  try {
    const trimmed = continueUrl.trim();
    // Allow relative paths starting with single '/'
    if (trimmed.startsWith('/') && !trimmed.startsWith('//') && !trimmed.startsWith('/\\')) {
      return trimmed;
    }
    const parsed = new URL(trimmed);
    const allowedHostnames = [
      'www.nordenfinance.site',
      'nordenfinance.site',
      'localhost',
    ];
    const isAllowedVercel =
      parsed.hostname.endsWith('.vercel.app') && parsed.hostname.includes('norden');

    if (allowedHostnames.includes(parsed.hostname) || isAllowedVercel) {
      return parsed.pathname + parsed.search + parsed.hash;
    }
  } catch {
    // Malformed URL, fallback
  }
  return '/dashboard';
}

export function mapFirebaseAuthError(error: unknown, defaultMessage: string): string {
  if (!error || typeof error !== 'object') return defaultMessage;
  const code = (error as { code?: string }).code || '';

  switch (code) {
    case 'auth/expired-action-code':
      return 'Tautan aksi telah kadaluarsa. Silakan ajukan permintaan baru.';
    case 'auth/invalid-action-code':
      return 'Tautan aksi tidak valid atau sudah pernah digunakan sebelumnya.';
    case 'auth/user-disabled':
      return 'Akun pengguna ini telah dinonaktifkan.';
    case 'auth/user-not-found':
      return 'Akun pengguna tidak ditemukan.';
    case 'auth/weak-password':
      return 'Kata sandi terlalu lemah. Gunakan minimal 8 karakter.';
    default:
      return (error as { message?: string }).message || defaultMessage;
  }
}
