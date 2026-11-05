/**
 * Safe mobile haptic feedback helper using navigator.vibrate.
 * Degrades gracefully on desktop or unsupported devices.
 */
export function triggerHaptic(type: 'light' | 'medium' | 'success' | 'warning' | 'selection' = 'light') {
  if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      if (type === 'selection') navigator.vibrate(6);
      else if (type === 'light') navigator.vibrate(10);
      else if (type === 'medium') navigator.vibrate(20);
      else if (type === 'success') navigator.vibrate([10, 40, 15]);
      else if (type === 'warning') navigator.vibrate([25, 40, 25]);
    } catch {
      // Ignore unsupported browser vibration failures
    }
  }
}
