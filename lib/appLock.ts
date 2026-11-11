/**
 * Client-side 4-digit PIN and Biometric (WebAuthn) screen lock utilities for Norden Finance.
 */

export async function hashPin(pin: string, userId: string): Promise<string> {
  const text = `${userId}_norden_pin_${pin}`;
  const msgBuffer = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function isDesktopDevice(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
    const isIPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
    if (isMobileUA || isIPadOS) return false;

    const hasFinePointer = window.matchMedia('(pointer: fine) and (hover: hover)').matches;
    if (hasFinePointer) return true;

    return window.innerWidth >= 1024;
  } catch {
    return false;
  }
}

export function isPinSet(userId: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const enabled = localStorage.getItem(`norden_pin_enabled_${userId}`);
    const hash = localStorage.getItem(`norden_pin_hash_${userId}`);
    return enabled === 'true' && !!hash;
  } catch {
    return false;
  }
}

export function isBiometricEnabled(userId: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(`norden_biometric_enabled_${userId}`) === 'true';
  } catch {
    return false;
  }
}

export function setBiometricEnabled(userId: string, enabled: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`norden_biometric_enabled_${userId}`, enabled ? 'true' : 'false');
    window.dispatchEvent(new Event('norden_lock_state_change'));
  } catch {
    // Ignore storage failures
  }
}

export async function verifyStoredPin(userId: string, enteredPin: string): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    const savedHash = localStorage.getItem(`norden_pin_hash_${userId}`);
    if (!savedHash) return false;
    const computedHash = await hashPin(enteredPin, userId);
    return savedHash === computedHash;
  } catch {
    return false;
  }
}

export function clearAllUserDataLocally(userId: string): void {
  if (typeof window === 'undefined') return;
  try {
    removePinData(userId);
    localStorage.removeItem(`norden_user_avatar_${userId}`);
    sessionStorage.removeItem(`norden_unlocked_${userId}`);
  } catch {
    // Ignore storage failures
  }
}

export function setPinData(userId: string, pinHash: string, enableBiometrics = false): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`norden_pin_hash_${userId}`, pinHash);
    localStorage.setItem(`norden_pin_enabled_${userId}`, 'true');
    localStorage.setItem(`norden_biometric_enabled_${userId}`, enableBiometrics ? 'true' : 'false');
    sessionStorage.setItem(`norden_unlocked_${userId}`, 'true');
    window.dispatchEvent(new Event('norden_lock_state_change'));
  } catch {
    // Ignore storage failures
  }
}

export function removePinData(userId: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(`norden_pin_hash_${userId}`);
    localStorage.removeItem(`norden_pin_enabled_${userId}`);
    localStorage.removeItem(`norden_biometric_enabled_${userId}`);
    sessionStorage.removeItem(`norden_unlocked_${userId}`);
    window.dispatchEvent(new Event('norden_lock_state_change'));
  } catch {
    // Ignore storage failures
  }
}

export function isAppUnlocked(userId: string): boolean {
  if (typeof window === 'undefined') return true;
  if (!isPinSet(userId)) return true;
  try {
    return sessionStorage.getItem(`norden_unlocked_${userId}`) === 'true';
  } catch {
    return false;
  }
}

export function lockApp(userId: string): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(`norden_unlocked_${userId}`);
    window.dispatchEvent(new Event('norden_lock_state_change'));
  } catch {
    // Ignore storage failures
  }
}

export function unlockApp(userId: string): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(`norden_unlocked_${userId}`, 'true');
    window.dispatchEvent(new Event('norden_lock_state_change'));
  } catch {
    // Ignore storage failures
  }
}

export async function isBiometricSupported(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!window.PublicKeyCredential) return false;
  if (typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function') {
    try {
      return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    } catch {
      return false;
    }
  }
  return false;
}

export async function registerBiometrics(userId: string, userEmail: string): Promise<boolean> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) return false;
  try {
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);
    const credential = await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: 'Norden Finance' },
        user: {
          id: new TextEncoder().encode(userId.slice(0, 16)),
          name: userEmail || 'user',
          displayName: userEmail || 'user',
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' },
          { alg: -257, type: 'public-key' },
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'preferred',
        },
        timeout: 60000,
      },
    });
    return !!credential;
  } catch {
    return false;
  }
}

export async function authenticateBiometrics(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.PublicKeyCredential) return false;
  try {
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);
    const credential = await navigator.credentials.get({
      publicKey: {
        challenge,
        timeout: 60000,
        userVerification: 'preferred',
      },
    });
    return !!credential;
  } catch {
    return false;
  }
}
