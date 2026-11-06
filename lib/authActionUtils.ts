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
      process.env.NODE_ENV !== 'production' &&
      parsed.hostname.endsWith('.vercel.app') &&
      parsed.hostname.includes('norden');

    if (allowedHostnames.includes(parsed.hostname) || isAllowedVercel) {
      const safePath = parsed.pathname + parsed.search + parsed.hash;
      if (safePath.startsWith('/') && !safePath.startsWith('//') && !safePath.startsWith('/\\')) {
        return safePath;
      }
    }
  } catch {
    // Malformed URL, fallback
  }
  return '/dashboard';
}

export function mapFirebaseAuthError(
  error: unknown,
  defaultMessage: string,
  lang: 'id' | 'en' = 'id'
): string {
  if (!error || typeof error !== 'object') return defaultMessage;
  const code = (error as { code?: string }).code || '';

  if (lang === 'en') {
    switch (code) {
      case 'auth/expired-action-code':
        return 'Action link has expired. Please submit a new request.';
      case 'auth/invalid-action-code':
        return 'Action link is invalid or has already been used.';
      case 'auth/user-disabled':
        return 'This user account has been disabled.';
      case 'auth/user-not-found':
        return 'User account was not found.';
      case 'auth/weak-password':
        return 'Password is too weak. Please use at least 8 characters.';
      default:
        return (error as { message?: string }).message || defaultMessage;
    }
  }

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
